package controller

import (
	"net/http"
	"vector-search-project/internal/service"
	"vector-search-project/internal/webutil"
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

func (c *VisualEntityController) GetAll(w http.ResponseWriter, r *http.Request) {
	results, err := c.service.GetAll(r.Context())
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, results)
}
