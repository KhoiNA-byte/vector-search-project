package server

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/mux"

	"vector-search-project/internal/controller"
)

func (s *Server) RegisterRoutes(fruitCtrl *controller.FruitController, visualEntityCtrl *controller.VisualEntityController) http.Handler {
	r := mux.NewRouter()

	// Apply CORS middleware
	r.Use(s.corsMiddleware)

	r.HandleFunc("/health", s.healthHandler)
	r.HandleFunc("/fruits/search", fruitCtrl.Search).Methods(http.MethodGet, http.MethodOptions)
	r.HandleFunc("/fruits", fruitCtrl.GetAll).Methods(http.MethodGet, http.MethodOptions)
	r.HandleFunc("/fruits/{id}", fruitCtrl.GetFruit).Methods(http.MethodGet, http.MethodOptions)
	r.HandleFunc("/fruits/create", fruitCtrl.CreateFruit).Methods(http.MethodPost, http.MethodOptions)
	r.HandleFunc("/fruits/{id}", fruitCtrl.UpdateFruit).Methods(http.MethodPut, http.MethodOptions)
	r.HandleFunc("/fruits/{id}", fruitCtrl.DeleteFruit).Methods(http.MethodDelete, http.MethodOptions)
	r.HandleFunc("/visual-entities/search", visualEntityCtrl.Search).Methods(http.MethodGet, http.MethodOptions)
	r.HandleFunc("/visual-entities", visualEntityCtrl.GetAll).Methods(http.MethodGet, http.MethodOptions)
	r.HandleFunc("/visual-entities/{id}", visualEntityCtrl.GetVisualEntity).Methods(http.MethodGet, http.MethodOptions)
	r.HandleFunc("/visual-entities/create", visualEntityCtrl.Create).Methods(http.MethodPost, http.MethodOptions)
	r.HandleFunc("/visual-entities/{id}", visualEntityCtrl.DeleteVisualEntity).Methods(http.MethodDelete, http.MethodOptions)

	// Additional route configuration
	r.PathPrefix("/public/").Handler(http.StripPrefix("/public", http.FileServer(http.Dir("./public"))))
	r.Handle("/favicon.ico", http.NotFoundHandler())

	return r
}

func (s *Server) corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Credentials", "false")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (s *Server) healthHandler(w http.ResponseWriter, r *http.Request) {
	jsonResp, err := json.Marshal(s.db.Health())
	if err != nil {
		log.Printf("error handling JSON marshal. Err: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResp)
}
