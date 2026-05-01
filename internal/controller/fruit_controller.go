package controller

import (
	"net/http"
	"vector-search-project/internal/service"
	"vector-search-project/internal/webutil"
)

type FruitController struct {
	fruitSvc service.FruitService
}

func NewFruitController(fruitSvc service.FruitService) *FruitController {
	return &FruitController{
		fruitSvc: fruitSvc,
	}
}

func (c *FruitController) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	if query == "" {
		webutil.RespondWithError(w, http.StatusBadRequest, "Query parameter 'q' is required")
		return
	}

	results, err := c.fruitSvc.Search(r.Context(), query)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, results)
}

func (c *FruitController) GetAll(w http.ResponseWriter, r *http.Request) {
	results, err := c.fruitSvc.GetAll(r.Context())
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, results)
}
