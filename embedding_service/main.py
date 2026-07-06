import io
import base64
# pyrefly: ignore [missing-import]
import fitz
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, Form, File, HTTPException
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from typing import List, Optional
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
# pyrefly: ignore [missing-import]
from PIL import Image

app = FastAPI(title="Local Embedding Service")

# Load models on startup
# all-MiniLM-L6-v2: 384 dimensions (for text search)
text_model = SentenceTransformer('all-MiniLM-L6-v2')

# clip-ViT-B-32: 512 dimensions (for multimodal/image search)
clip_model = SentenceTransformer('clip-ViT-B-32')

@app.get("/health")
def health():
    return {"status": "healthy"}

class TextRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[List[str]] = None

def l2_normalize(vector):
    norm = np.linalg.norm(vector)
    if norm == 0:
        return vector
    return (vector / norm).tolist()

@app.post("/embed/text")
def embed_text(req: TextRequest):
    if req.texts is not None:
        embeddings = text_model.encode(req.texts)
        # Convert numpy arrays to lists
        return {"embeddings": [emb.tolist() for emb in embeddings]}
    elif req.text is not None:
        embedding = text_model.encode(req.text)
        return {"embedding": embedding.tolist()}
    else:
        raise HTTPException(status_code=400, detail="Must provide 'text' or 'texts'")

@app.post("/embed/multimodal")
async def embed_multimodal(
    description: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None)
):
    if not description and not image:
        raise HTTPException(status_code=400, detail="Must provide at least 'description' or 'image'")
    
    img_emb = None
    txt_emb = None

    # Embed image if provided
    if image is not None:
        try:
            image_bytes = await image.read()
            pil_image = Image.open(io.BytesIO(image_bytes))
            # clip_model encode handles PIL Image automatically
            img_emb = clip_model.encode(pil_image)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to process image: {str(e)}")

    # Embed text if provided
    if description:
        try:
            txt_emb = clip_model.encode(description)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to process text: {str(e)}")

    # Combine embeddings
    if img_emb is not None and txt_emb is not None:
        # If both, average and normalize them
        combined = (img_emb + txt_emb) / 2
        final_emb = l2_normalize(combined)
    elif img_emb is not None:
        final_emb = l2_normalize(img_emb)
    else:
        final_emb = l2_normalize(txt_emb)

    return {"embedding": final_emb}

def check_overlap(bbox1, bbox2):
    if not bbox1 or not bbox2:
        return False
    # bbox is [x0, y0, x1, y1]
    x_overlap = max(0, min(bbox1[2], bbox2[2]) - max(bbox1[0], bbox2[0]))
    y_overlap = max(0, min(bbox1[3], bbox2[3]) - max(bbox1[1], bbox2[1]))
    area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
    if area1 == 0:
        return False
    return (x_overlap * y_overlap) / area1 > 0.4


def is_inside_table(bbox, table_bbox):
    center_x = (bbox[0] + bbox[2]) / 2
    center_y = (bbox[1] + bbox[3]) / 2
    return (table_bbox[0] <= center_x <= table_bbox[2] and
            table_bbox[1] <= center_y <= table_bbox[3])


def make_table_html(data):
    if not data:
        return ""
    table_html = "<div style='overflow-x: auto; margin: 16px 0; border-radius: 8px; border: 1px solid #e2e8f0;'>"
    table_html += "<table style='width: 100%; border-collapse: collapse; text-align: left; font-family: sans-serif; font-size: 14px;'>"
    
    for row_idx, row in enumerate(data):
        if row_idx == 0:
            table_html += "<thead style='background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;'>"
            table_html += "<tr>"
            for cell in row:
                cell_text = (cell or "").strip().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
                table_html += f"<th style='padding: 12px 14px; font-weight: 600; color: #1e293b; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;'>{cell_text}</th>"
            table_html += "</tr>"
            table_html += "</thead>"
            table_html += "<tbody>"
        else:
            bg_color = "#ffffff" if row_idx % 2 != 0 else "#f8fafc"
            table_html += f"<tr style='background-color: {bg_color}; border-bottom: 1px solid #e2e8f0;'>"
            for cell in row:
                cell_text = (cell or "").strip().replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
                table_html += f"<td style='padding: 12px 14px; color: #334155; border-right: 1px solid #e2e8f0;'>{cell_text}</td>"
            table_html += "</tr>"
            
    table_html += "</tbody>"
    table_html += "</table>"
    table_html += "</div>"
    return table_html


def dict_to_clean_html(page_dict, page_width, highlights, underlines, links, page_obj=None):
    # Detect tables
    table_list = []
    if page_obj:
        try:
            tables = page_obj.find_tables()
            for tab in tables.tables:
                table_list.append({
                    "bbox": tab.bbox,
                    "data": tab.extract()
                })
        except Exception:
            pass

    # Gather elements to render
    elements = []
    
    # 1. Text blocks
    for block in page_dict.get("blocks", []):
        if block.get("type") != 0: # not a text block
            continue
        bbox = block.get("bbox", [0, 0, 0, 0])
        
        # Check if inside any table
        inside_table = False
        for t in table_list:
            if is_inside_table(bbox, t["bbox"]):
                inside_table = True
                break
                
        if not inside_table:
            elements.append({
                "type": "text",
                "bbox": bbox,
                "data": block
            })
            
    # 2. Table blocks
    for t in table_list:
        elements.append({
            "type": "table",
            "bbox": t["bbox"],
            "data": t["data"]
        })
        
    # Sort elements vertically by their y0 coordinate (bbox[1])
    elements.sort(key=lambda x: x["bbox"][1])
    
    html_blocks = []
    for el in elements:
        if el["type"] == "table":
            table_html = make_table_html(el["data"])
            if table_html:
                html_blocks.append(table_html)
        else:
            block = el["data"]
            bbox = el["bbox"]
            block_width = bbox[2] - bbox[0]
            block_center = bbox[0] + block_width / 2
            page_center = page_width / 2
            
            # Determine alignment
            alignment = "left"
            if abs(block_center - page_center) < (page_width * 0.08) and block_width < (page_width * 0.85):
                alignment = "center"
                
            block_style = f"text-align: {alignment}; margin-bottom: 8px; line-height: 1.4;"
            block_html = f"<div style='{block_style}'>"
            
            for line in block.get("lines", []):
                line_html = ""
                for span in line.get("spans", []):
                    text = span.get("text", "")
                    if not text.strip():
                        continue
                    # escape HTML characters
                    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                    
                    size = span.get("size", 12)
                    flags = span.get("flags", 0)
                    color_int = span.get("color", 0)
                    span_bbox = span.get("bbox", [0, 0, 0, 0])
                    
                    # RGB channels
                    r = (color_int >> 16) & 255
                    g = (color_int >> 8) & 255
                    b = color_int & 255
                    color_hex = f"#{r:02x}{g:02x}{b:02x}"
                    
                    span_styles = []
                    
                    # Check annotations & links
                    is_highlighted = any(check_overlap(span_bbox, h) for h in highlights)
                    is_underlined = any(check_overlap(span_bbox, u) for u in underlines)
                    
                    link_url = None
                    for link in links:
                        if "uri" in link and check_overlap(span_bbox, link.get("from")):
                            link_url = link["uri"]
                            break
                    
                    if flags & 16: # Bold
                        span_styles.append("font-weight: bold;")
                    if flags & 2: # Italic
                        span_styles.append("font-style: italic;")
                    if is_highlighted:
                        span_styles.append("background-color: rgba(255, 235, 59, 0.4); border-radius: 2px; padding: 0 2px;")
                    if is_underlined:
                        span_styles.append("text-decoration: underline;")
                        
                    # Skip forcing color for black or off-black to allow CSS theme styling
                    if color_hex != "#000000" and color_hex != "#010101" and color_hex != "#ffffff":
                        span_styles.append(f"color: {color_hex};")
                        
                    if size > 16:
                        span_styles.append(f"font-size: {size:.1f}px;")
                        
                    style_attr = f" style='{' '.join(span_styles)}'" if span_styles else ""
                    
                    if link_url:
                        line_html += f"<a href='{link_url}' target='_blank' style='color: #03a9f4; text-decoration: underline;{style_attr}'>{text}</a> "
                    else:
                        line_html += f"<span{style_attr}>{text}</span> "
                        
                if line_html:
                    block_html += line_html + "<br/>"
                    
            if block_html.endswith("<br/>"):
                block_html = block_html[:-5]
            block_html += "</div>"
            
            # Only add non-empty blocks
            if block_html != f"<div style='{block_style}'></div>":
                html_blocks.append(block_html)
                
    return "\n".join(html_blocks)

@app.post("/extract/pdf")
async def extract_pdf(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()
        # Open PDF with fitz
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        
        pages_data = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # 1. Extract plain text for embedding
            plain_text = page.get_text("text")
            
            # 2. Extract annotations (highlights, underlines) and links
            highlights = []
            underlines = []
            
            try:
                annots = page.annots()
                if annots:
                    for annot in annots:
                        if annot.type and annot.type[0] == 8: # Highlight
                            highlights.append(annot.rect)
                        elif annot.type and annot.type[0] == 9: # Underline
                            underlines.append(annot.rect)
            except Exception:
                pass # Ignore annot failures
                
            links = []
            try:
                links = page.get_links()
            except Exception:
                pass
                
            # 3. Extract styled HTML blocks from layout dict
            try:
                page_dict = page.get_text("dict")
                page_width = page_dict.get("width", 595)
                html_content = dict_to_clean_html(page_dict, page_width, highlights, underlines, links, page)
            except Exception as e:
                # Fallback to plain text wrapped in divs if structure parsing fails
                escaped_text = plain_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')
                html_content = f"<div>{escaped_text}</div>"
                
            # 4. Extract embedded images
            images = []
            try:
                image_list = page.get_images(full=True)
                for img_idx, img_info in enumerate(image_list):
                    xref = img_info[0]
                    base_image = doc.extract_image(xref)
                    if base_image:
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"]
                        base64_data = base64.b64encode(image_bytes).decode("utf-8")
                        images.append({
                            "data": base64_data,
                            "ext": image_ext
                        })
            except Exception:
                pass # Ignore image extraction failures
                
            pages_data.append({
                "page": page_num + 1,
                "plain_text": plain_text,
                "html_content": html_content,
                "images": images
            })
            
        return {"pages": pages_data}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

if __name__ == "__main__":
    # pyrefly: ignore [missing-import]
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

