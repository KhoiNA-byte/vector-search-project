package controller

import (
	"net/http"
	"strconv"
	"vector-search-project/internal/model/request"
	"vector-search-project/internal/service"
	"vector-search-project/internal/webutil"

	"github.com/gorilla/mux"
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

func (c *FruitController) GetFruit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid fruit ID")
		return
	}

	result, err := c.fruitSvc.GetFruit(r.Context(), id)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, result)
}

func (c *FruitController) CreateFruit(w http.ResponseWriter, r *http.Request) {
	var fruitReq request.FruitReq
	if err := webutil.DecodeJSON(r, &fruitReq); err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	id, err := c.fruitSvc.CreateFruit(r.Context(), &fruitReq)
	if err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusCreated, map[string]int64{"id": id})
}

func (c *FruitController) UpdateFruit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid fruit ID")
		return
	}

	var fruitReq request.FruitReq
	if err := webutil.DecodeJSON(r, &fruitReq); err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	fruitReq.ID = id

	if err := c.fruitSvc.UpdateFruit(r.Context(), &fruitReq); err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Fruit updated successfully"})
}

func (c *FruitController) DeleteFruit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		webutil.RespondWithError(w, http.StatusBadRequest, "Invalid fruit ID")
		return
	}

	if err := c.fruitSvc.DeleteFruit(r.Context(), id); err != nil {
		webutil.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	webutil.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "Fruit deleted successfully"})
}
