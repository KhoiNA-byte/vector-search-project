import os
from PIL import Image

def get_latest_media_file():
    folder = r"C:\Users\khoin\.gemini\antigravity\brain\51dc1964-d402-4b7a-b036-7ddc9caab33c\.tempmediaStorage"
    files = [os.path.join(folder, f) for f in os.listdir(folder) if f.startswith("media_") and f.endswith(".png")]
    files.sort(key=os.path.getmtime)
    return files[-1] if files else None

def main():
    img_path = get_latest_media_file()
    if not img_path:
        print("No media files found")
        return
    print(f"Loading {img_path}")
    im = Image.open(img_path)
    im = im.convert("RGB")
    w, h = im.size
    
    # Let's sample along the vertical center at different heights
    # The palette has 4 horizontal blocks
    y_coords = [int(h * 0.125), int(h * 0.375), int(h * 0.625), int(h * 0.875)]
    x = w // 2
    for i, y in enumerate(y_coords):
        r, g, b = im.getpixel((x, y))
        hex_code = f"#{r:02x}{g:02x}{b:02x}"
        print(f"Row {i+1} color: {hex_code}")

if __name__ == "__main__":
    main()
