package service

import (
	"context"
	"fmt"
	"os"
	"vector-search-project/internal/model"

	"github.com/pgvector/pgvector-go"
	"google.golang.org/genai"
)

type EmbeddingService struct {
	client *genai.Client
}

func NewEmbeddingService() *EmbeddingService {
	apiKey := os.Getenv("GEMINI_API_KEY")
	ctx := context.Background()

	// Create client using the new SDK pattern
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})

	if err != nil {
		fmt.Printf("Failed to create Gemini client: %v\n", err)
		return nil
	}
	return &EmbeddingService{
		client: client,
	}
}

func (s *EmbeddingService) EmbedDescription(ctx context.Context, description string) (pgvector.Vector, error) {
	modelName := os.Getenv("GEMINI_EMBEDDING_MODEL")

	// Follow the result pattern from your snippet
	contents := []*genai.Content{
		genai.NewContentFromText(description, "user"),
	}

	result, err := s.client.Models.EmbedContent(ctx,
		modelName,
		contents,
		nil,
	)

	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("gemini embedding failed: %w", err)
	}

	// Extract values from the embeddings in the result
	if len(result.Embeddings) == 0 || len(result.Embeddings[0].Values) == 0 {
		return pgvector.Vector{}, fmt.Errorf("no embeddings returned")
	}

	return pgvector.NewVector(result.Embeddings[0].Values), nil
}

func (s *EmbeddingService) EmbedFruit(ctx context.Context, f *model.Fruit) (pgvector.Vector, error) {
	description := fmt.Sprintf("A %s %s fruit from %s, available during %s. Best for %s. It has a %s texture and a %s flavor profile.", f.Color, f.Name, f.Origin, f.Season, f.BestFor, f.Texture, f.Flavor)
	return s.EmbedDescription(ctx, description)
}

func (s *EmbeddingService) EmbedVisualEntity(ctx context.Context, imageData []byte, mimeType string, description string) (pgvector.Vector, error) {
	modelName := os.Getenv("GEMINI_EMBEDDING_MODEL")

	contents := []*genai.Content{
		genai.NewContentFromParts([]*genai.Part{
			genai.NewPartFromText(description),
			genai.NewPartFromBytes(imageData, mimeType),
		}, genai.RoleUser),
	}

	result, err := s.client.Models.EmbedContent(ctx,
		modelName,
		contents,
		nil,
	)

	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("gemini multimodal embedding failed: %w", err)
	}

	if len(result.Embeddings) == 0 || len(result.Embeddings[0].Values) == 0 {
		return pgvector.Vector{}, fmt.Errorf("no embeddings returned")
	}

	return pgvector.NewVector(result.Embeddings[0].Values), nil
}
