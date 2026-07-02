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

func (s *EmbeddingService) EmbedDescriptions(ctx context.Context, descriptions []string) ([]pgvector.Vector, error) {
	if len(descriptions) == 0 {
		return nil, nil
	}

	modelName := os.Getenv("GEMINI_EMBEDDING_MODEL")
	const batchSize = 100
	var allVectors []pgvector.Vector

	for i := 0; i < len(descriptions); i += batchSize {
		end := i + batchSize
		if end > len(descriptions) {
			end = len(descriptions)
		}
		batch := descriptions[i:end]

		contents := make([]*genai.Content, len(batch))
		for j, desc := range batch {
			contents[j] = genai.NewContentFromText(desc, "user")
		}

		result, err := s.client.Models.EmbedContent(ctx,
			modelName,
			contents,
			nil,
		)
		if err != nil {
			return nil, fmt.Errorf("gemini batch embedding failed at offset %d: %w", i, err)
		}

		if len(result.Embeddings) != len(batch) {
			return nil, fmt.Errorf("gemini batch embedding returned mismatching size at offset %d: expected %d, got %d", i, len(batch), len(result.Embeddings))
		}

		for j, emb := range result.Embeddings {
			if len(emb.Values) == 0 {
				return nil, fmt.Errorf("no values in embedding at index %d", i+j)
			}
			allVectors = append(allVectors, pgvector.NewVector(emb.Values))
		}
	}

	return allVectors, nil
}

func (s *EmbeddingService) EmbedFruit(ctx context.Context, f *model.Fruit) (pgvector.Vector, error) {
	description := fmt.Sprintf("A %s (outside) and %s (inside) %s fruit from %s, available during %s. Best for %s. It has a %s texture and a %s flavor profile.", f.ColorOutside, f.ColorInside, f.Name, f.Origin, f.Season, f.BestFor, f.Texture, f.Flavor)
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
