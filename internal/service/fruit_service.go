package service

import (
	"context"
	"fmt"
	"vector-search-project/internal/database"
	"vector-search-project/internal/model"
	"vector-search-project/internal/model/request"
	"vector-search-project/internal/model/response"
	"vector-search-project/internal/repository"
)

type FruitService interface {
	Seed(ctx context.Context) error
	Search(ctx context.Context, query string) ([]response.FruitRes, error)
	GetAll(ctx context.Context) ([]response.FruitRes, error)
	GetFruit(ctx context.Context, id int64) (*response.FruitRes, error)
	CreateFruit(ctx context.Context, fruitReq *request.FruitReq) (int64, error)
	UpdateFruit(ctx context.Context, id int64, fruitReq *request.FruitReq) error
	DeleteFruit(ctx context.Context, id int64) error
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

func (s *fruitService) Search(ctx context.Context, query string) ([]response.FruitRes, error) {
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

	return results, nil
}

func (s *fruitService) GetAll(ctx context.Context) ([]response.FruitRes, error) {
	results, err := s.repo.GetAllFruits(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get all fruits: %w", err)
	}
	return results, nil
}

func (s *fruitService) GetFruit(ctx context.Context, id int64) (*response.FruitRes, error) {
	result, err := s.repo.GetFruit(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get fruit with id %d: %w", id, err)
	}
	return result, nil
}

func (s *fruitService) CreateFruit(ctx context.Context, fruitReq *request.FruitReq) (int64, error) {
	fruitModel := &model.Fruit{
		Name:    fruitReq.Name,
		Origin:  fruitReq.Origin,
		BestFor: fruitReq.BestFor,
		Texture: fruitReq.Texture,
		Flavor:  fruitReq.Flavor,
		Season:  fruitReq.Season,
		Color:   fruitReq.Color,
		Price:   fruitReq.Price,
	}

	embedding, err := s.embedSvc.EmbedFruit(ctx, fruitModel)
	if err != nil {
		return 0, fmt.Errorf("failed to generate embedding for new fruit: %w", err)
	}
	fruitModel.Embedding = embedding

	if err := s.repo.CreateFruit(ctx, fruitModel); err != nil {
		return 0, err
	}

	return fruitModel.ID, nil
}

func (s *fruitService) UpdateFruit(ctx context.Context, id int64, fruitReq *request.FruitReq) error {
	// Map request to model
	fruitModel := &model.Fruit{
		ID:      id,
		Name:    fruitReq.Name,
		Origin:  fruitReq.Origin,
		BestFor: fruitReq.BestFor,
		Texture: fruitReq.Texture,
		Flavor:  fruitReq.Flavor,
		Season:  fruitReq.Season,
		Color:   fruitReq.Color,
		Price:   fruitReq.Price,
	}

	// Re-generate embedding using the model
	newEmbedding, err := s.embedSvc.EmbedFruit(ctx, fruitModel)
	if err != nil {
		return fmt.Errorf("failed to generate new embedding for update: %w", err)
	}

	return s.repo.UpdateFruit(ctx, fruitModel, newEmbedding)
}

func (s *fruitService) DeleteFruit(ctx context.Context, id int64) error {
	return s.repo.DeleteFruit(ctx, id)
}
