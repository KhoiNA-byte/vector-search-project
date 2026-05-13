package service

import (
	"context"
	"fmt"
	"vector-search-project/internal/database"
	"vector-search-project/internal/model/response"
	"vector-search-project/internal/repository"
)

type VisualEntityService interface {
	Seed(ctx context.Context) error
	Search(ctx context.Context, query string) ([]response.VisualEntityRes, error)
	GetAll(ctx context.Context) ([]response.VisualEntityRes, error)
}

type visualEntityService struct {
	repo     repository.VisualEntityRepository
	embedSvc *EmbeddingService
}

func NewVisualEntityService(repo repository.VisualEntityRepository) VisualEntityService {
	return &visualEntityService{
		repo:     repo,
		embedSvc: NewEmbeddingService(),
	}
}

func (s *visualEntityService) Seed(ctx context.Context) error {
	count, err := s.repo.Count(ctx)
	if err != nil {
		return fmt.Errorf("failed to check fruit count: %w", err)
	}
	if count > 0 {
		return nil // skip seeding if data already exists
	}

	VisualEntityToSeed := database.GetVisualEntitiesToSeed()

	for _, v := range VisualEntityToSeed {
		embedding, err := s.embedSvc.EmbedVisualEntity(ctx, v, "Identify this image")
		if err != nil {
			return fmt.Errorf("failed to embed visual entity %s: %w", v.ImageURL, err)
		}
		v.Embedding = embedding
		if err := s.repo.CreateVisualEntity(ctx, v); err != nil {
			return err
		}
	}
	return nil
}

func (s *visualEntityService) Search(ctx context.Context, query string) ([]response.VisualEntityRes, error) {
	if query == "" {
		return nil, fmt.Errorf("query is required")
	}

	fmt.Printf("Searching for: '%s'\n", query)
	promptEmbedding, err := s.embedSvc.EmbedDescription(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to embed search query: %w", err)
	}

	results, err := s.repo.SearchVisualEntity(ctx, promptEmbedding)
	if err != nil {
		return nil, fmt.Errorf("search failed: %w", err)
	}

	return results, nil
}

func (s *visualEntityService) GetAll(ctx context.Context) ([]response.VisualEntityRes, error) {
	results, err := s.repo.GetAllVisualEntity(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get all visual entity: %w", err)
	}
	return results, nil
}
