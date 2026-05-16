package controller

import (
	"io"
	"net/http"
	"strconv"
	"vector-search-project/internal/service"
	"vector-search-project/internal/webutil"

	"github.com/gorilla/mux"
)

type VisualEntityController struct {
	service service.VisualEntityService
}

func NewVisualEntityController(service service.VisualEntityService) *VisualEntityController {
	return &VisualEntityController{service: service}
}

func (c *VisualEntityController) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		webutil.RespondWithError(w, http.StatusBadRequest, "Query parameter 'q' is required")
		return
	}

	results, err := c.service.Search(r.Context(), query)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, results)
}

func (c *VisualEntityController) Create(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil { // 10 MB limit
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid form data")
		return
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Image is required")
		return
	}
	defer file.Close()

	imageData, err := io.ReadAll(file)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, "Failed to read image")
		return
	}

	id, err := c.service.Create(r.Context(), imageData, header.Filename)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (c *VisualEntityController) GetAll(w http.ResponseWriter, r *http.Request) {
	results, err := c.service.GetAll(r.Context())
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, results)
}

func (c *VisualEntityController) GetVisualEntity(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid visual entity ID")
		return
	}
	result, err := c.service.GetVisualEntity(r.Context(), id)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, result)
}

func (c *VisualEntityController) DeleteVisualEntity(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid visual entity ID")
	}
	if err := c.service.DeleteVisualEntity(r.Context(), id); err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	webutil.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Visual entity deleted successfully"})
}
