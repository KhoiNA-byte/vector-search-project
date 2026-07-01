package controller

import (
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"vector-search-project/internal/model/request"
	"vector-search-project/internal/model/response"
	"vector-search-project/internal/service"
	"vector-search-project/internal/webutil"

	"github.com/gorilla/mux"
)

type DocumentController struct {
	docSvc service.DocumentService
}

func NewDocumentController(docSvc service.DocumentService) *DocumentController {
	return &DocumentController{
		docSvc: docSvc,
	}
}

func (c *DocumentController) Upload(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form (max 50MB)
	err := r.ParseMultipartForm(50 << 20)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Failed to parse multipart form: "+err.Error())
		return
	}

	files := r.MultipartForm.File["files"]
	if len(files) == 0 {
		// Fallback to singular key
		files = r.MultipartForm.File["file"]
	}
	if len(files) == 0 {
		webutil.RespondWithError(w, http.StatusBadRequest, "At least one file in 'files' or 'file' form parameter is required")
		return
	}

	var uploadedFiles []string
	for _, fileHeader := range files {
		filename := fileHeader.Filename
		file, err := fileHeader.Open()
		if err != nil {
			webutil.RespondWithError(w, http.StatusInternalServerError, "Failed to read file "+filename+": "+err.Error())
			return
		}

		contentType := fileHeader.Header.Get("Content-Type")
		if contentType == "" {
			lowerName := strings.ToLower(filename)
			if strings.HasSuffix(lowerName, ".pdf") {
				contentType = "application/pdf"
			} else if strings.HasSuffix(lowerName, ".docx") {
				contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
			}
		}

		err = c.docSvc.Upload(r.Context(), filename, file, fileHeader.Size, contentType)
		file.Close()
		if err != nil {
			webutil.RespondWithError(w, http.StatusInternalServerError, "Failed to ingest document "+filename+": "+err.Error())
			return
		}
		uploadedFiles = append(uploadedFiles, filename)
	}

	webutil.RespondWithJSON(w, http.StatusOK, map[string]any{
		"message": "Documents uploaded and indexed successfully",
		"files":   uploadedFiles,
		"count":   len(uploadedFiles),
	})
}

func (c *DocumentController) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	results, err := c.docSvc.SearchDocuments(r.Context(), query)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, results)
}

func (c *DocumentController) SemanticSearch(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Q     string   `json:"q"`
		Scope []string `json:"scope"`
	}

	if err := webutil.DecodeJSON(r, &req); err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Q == "" {
		webutil.RespondWithError(w, http.StatusBadRequest, "Search query 'q' is required")
		return
	}

	results, err := c.docSvc.SemanticSearch(r.Context(), req.Q, req.Scope)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, results)
}

func (c *DocumentController) GetDocuments(w http.ResponseWriter, r *http.Request) {
	docs, err := c.docSvc.GetDocuments(r.Context())
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, docs)
}

func (c *DocumentController) GetDocumentDetails(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	encodedName := vars["name"]
	docName, err := url.QueryUnescape(encodedName)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid document name encoding")
		return
	}

	metadata, chunks, err := c.docSvc.GetDocumentDetails(r.Context(), docName)
	if err != nil {
		webutil.RespondWithError(w, http.StatusNotFound, "Document not found: "+err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, map[string]any{
		"document": metadata,
		"chunks":   chunks,
	})
}

func (c *DocumentController) GetChunks(w http.ResponseWriter, r *http.Request) {
	docName := r.URL.Query().Get("document")
	var results []response.ChunkRes
	var err error

	if docName != "" {
		results, err = c.docSvc.GetChunksByDocument(r.Context(), docName)
	} else {
		results, err = c.docSvc.GetAllChunks(r.Context())
	}

	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, results)
}

func (c *DocumentController) UpdateChunk(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid chunk ID")
		return
	}

	var req request.UpdateChunkReq
	if err := webutil.DecodeJSON(r, &req); err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	err = c.docSvc.UpdateChunk(r.Context(), id, req.Content)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Chunk updated successfully"})
}

func (c *DocumentController) DeleteChunk(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid chunk ID")
		return
	}

	err = c.docSvc.DeleteChunk(r.Context(), id)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Chunk deleted successfully"})
}

func (c *DocumentController) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	encodedName := vars["name"]
	docName, err := url.QueryUnescape(encodedName)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid document name encoding")
		return
	}

	err = c.docSvc.DeleteDocument(r.Context(), docName)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Document deleted successfully"})
}
