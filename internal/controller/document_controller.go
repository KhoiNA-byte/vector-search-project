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
	// Parse multipart form (max 20MB)
	err := r.ParseMultipartForm(20 << 20)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Failed to parse multipart form: "+err.Error())
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "File key 'file' is required")
		return
	}
	defer file.Close()

	// Check file extension
	filename := header.Filename
	lowerFilename := strings.ToLower(filename)
	if !strings.HasSuffix(lowerFilename, ".pdf") && !strings.HasSuffix(lowerFilename, ".docx") {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid file format. Only PDF and DOCX are allowed")
		return
	}

	err = c.docSvc.Upload(r.Context(), filename, file, header.Size)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, "Failed to ingest document: "+err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Document ingested successfully", "filename": filename})
}

func (c *DocumentController) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		webutil.RespondWithError(w, http.StatusBadRequest, "Query parameter 'q' is required")
		return
	}

	results, err := c.docSvc.Search(r.Context(), query)
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
