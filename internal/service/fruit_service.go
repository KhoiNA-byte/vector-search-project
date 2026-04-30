package service

import (
	"context"
	"fmt"
	"vector-search-project/internal/database"
	"vector-search-project/internal/model"
	"vector-search-project/internal/repository"

	"github.com/pgvector/pgvector-go"
)

type FruitService interface {
	Seed(ctx context.Context) error
	Search(ctx context.Context, query string) ([]model.Fruit, error)
}

type fruitService struct {
	repo     repository.FruitRepository
	embedSvc *EmbeddingService
}

func NewFruitService(repo repository.FruitRepository, embedSvc *EmbeddingService) FruitService {
	return &fruitService{
		repo:     repo,
		embedSvc: embedSvc,
	}
}

func (s *fruitService) Seed(ctx context.Context) error {
	count, err := s.repo.Count(ctx)
	if err != nil {
		return fmt.Errorf("failed to check fruit count: %w", err)
	}
	if count > 0 {
		return nil // skip seeding if data already exists
	}

	fruitsToSeed := database.GetFruitsToSeed()

	for _, f := range fruitsToSeed {
		embedding, err := s.embedSvc.EmbedFruit(ctx, f)
		if err != nil {
			return fmt.Errorf("failed to embed fruit %s: %w", f.Name, err)
		}
		f.Embedding = embedding
		if err := s.repo.CreateFruit(ctx, f); err != nil {
			return err
		}
	}
	return nil
}

func (s *fruitService) Search(ctx context.Context, query string) ([]model.Fruit, error) {
	if query == "" {
		return nil, fmt.Errorf("query is required")
	}

	fmt.Printf("Searching for: '%s'\n", query)
	promptEmbedding, err := s.embedSvc.EmbedDescription(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to embed search query: %w", err)
	}

	results, err := s.repo.SearchFruits(ctx, promptEmbedding, 4)
	if err != nil {
		return nil, fmt.Errorf("search failed: %w", err)
	}

	for i := range results {
		// Clear embedding to keep response slim
		results[i].Embedding = pgvector.Vector{}
	}

	return results, nil
}
