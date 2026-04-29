package service

import (
	"context"
	"fmt"
	"os"
	"vector-search-project/internal/model"

	"github.com/google/generative-ai-go/genai"
	"github.com/pgvector/pgvector-go"
	"google.golang.org/api/option"
)

// EmbeddingService converts a description into a vector representation using Gemini.
type EmbeddingService struct {
	client *genai.Client
}

func NewEmbeddingService() *EmbeddingService {
	apiKey := os.Getenv("GEMINI_API_KEY")
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		fmt.Printf("Failed to create Gemini client: %v\n", err)
		return nil
	}
	return &EmbeddingService{
		client: client,
	}
}

func (s *EmbeddingService) EmbedDescription(ctx context.Context, description string) (pgvector.Vector, error) {
	modelName := os.Getenv("GEMINI_MODEL")
	if modelName == "" {
		modelName = "gemini-embedding-2"
	}

	model := s.client.EmbeddingModel(modelName)

	res, err := model.EmbedContent(ctx, genai.Text(description))
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("gemini embedding failed: %w", err)
	}

	return pgvector.NewVector(res.Embedding.Values), nil
}

func (s *EmbeddingService) EmbedFruit(ctx context.Context, f *model.Fruit) (pgvector.Vector, error) {
	description := fmt.Sprintf("A %s %s fruit from %s, available during %s. Best for %s. It has a %s texture and a %s flavor profile.", f.Color, f.Name, f.Origin, f.Season, f.BestFor, f.Texture, f.Flavor)
	return s.EmbedDescription(ctx, description)
}
