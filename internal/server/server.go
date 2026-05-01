package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"vector-search-project/internal/controller"
	"vector-search-project/internal/database"
	"vector-search-project/internal/repository"
	"vector-search-project/internal/service"
)

type Server struct {
	port int
	db   database.Service
}

func NewServer() *http.Server {
	portStr := os.Getenv("PORT")
	port, err := strconv.Atoi(portStr)
	if err != nil {
		log.Fatalf("failed to parse PORT environment variable: %v", err)
	}
	db := database.New()

	newServer := &Server{
		port: port,
		db:   db,
	}

	ctx := context.Background()

	// Initialize repositories and services
	fruitRepo := repository.NewFruitRepository(db.Pool())
	embedSvc := service.NewEmbeddingService()
	fruitSvc := service.NewFruitService(fruitRepo, embedSvc)
	fruitCtrl := controller.NewFruitController(fruitSvc)

	// Run migrations and seed data
	if err := fruitRepo.Migrate(ctx); err != nil {
		log.Printf("migration failed: %v", err)
	}
	if err := fruitSvc.Seed(ctx); err != nil {
		log.Printf("seeding failed: %v", err)
	}

	// Declare Server config
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", newServer.port),
		Handler:      newServer.RegisterRoutes(fruitCtrl),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return server
}
