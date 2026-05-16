package service

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"vector-search-project/internal/database"
	"vector-search-project/internal/model"
	"vector-search-project/internal/model/response"
	"vector-search-project/internal/repository"
)

type VisualEntityService interface {
	Seed(ctx context.Context) error
	Create(ctx context.Context, imageData []byte, filename string) (int64, error)
	Search(ctx context.Context, query string) ([]response.VisualEntityRes, error)
	GetAll(ctx context.Context) ([]response.VisualEntityRes, error)
	GetVisualEntity(ctx context.Context, id int64) (*response.VisualEntityRes, error)
	DeleteVisualEntity(ctx context.Context, id int64) error
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

func (s *visualEntityService) Create(ctx context.Context, imageData []byte, filename string) (int64, error) {
	// 1. Save file to disk
	dir := filepath.Join("frontend", "public", "visualEntities")
	if err := os.MkdirAll(dir, 0755); err != nil {
		return 0, fmt.Errorf("failed to create directory: %w", err)
	}

	dstPath := filepath.Join(dir, filename)
	if err := os.WriteFile(dstPath, imageData, 0644); err != nil {
		return 0, fmt.Errorf("failed to save image: %w", err)
	}

	imageURL := "/visualEntities/" + filename

	// 2. Create model
	entity := &model.VisualEntity{
		ImageURL: imageURL,
	}

	// 3. Generate embedding
	embedding, err := s.embedSvc.EmbedVisualEntity(ctx, entity, "Identify this image")
	if err != nil {
		return 0, fmt.Errorf("failed to embed visual entity: %w", err)
	}
	entity.Embedding = embedding

	// 4. Save to DB
	if err := s.repo.CreateVisualEntity(ctx, entity); err != nil {
		return 0, err
	}

	return entity.ID, nil
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

func (s *visualEntityService) GetVisualEntity(ctx context.Context, id int64) (*response.VisualEntityRes, error) {
	result, err := s.repo.GetVisualEntity(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get visual entity with id %d: %w", id, err)
	}
	return result, nil
}

func (s *visualEntityService) DeleteVisualEntity(ctx context.Context, id int64) error {
	err := s.repo.DeleteVisualEntity(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete visual entity with id %d: %w", id, err)
	}
	return nil
}
