package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"os"
	"strings"
	"vector-search-project/internal/model"

	"github.com/pgvector/pgvector-go"
)

type textRequest struct {
	Text *string `json:"text,omitempty"`
}

type textsRequest struct {
	Texts []string `json:"texts"`
}

type textResponse struct {
	Embedding []float32 `json:"embedding"`
}

type textsResponse struct {
	Embeddings [][]float32 `json:"embeddings"`
}

type EmbeddingService struct {
	baseURL string
	client  *http.Client
}

type ExtractedPageImage struct {
	Data string `json:"data"` // base64
	Ext  string `json:"ext"`
}

type ExtractedPage struct {
	Page        int                  `json:"page"`
	PlainText   string               `json:"plain_text"`
	HTMLContent string               `json:"html_content"`
	Images      []ExtractedPageImage `json:"images"`
}

type ExtractPDFResponse struct {
	Pages []ExtractedPage `json:"pages"`
}

func NewEmbeddingService() *EmbeddingService {
	baseURL := os.Getenv("EMBEDDING_SERVICE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:5000"
	}
	baseURL = strings.TrimSuffix(baseURL, "/")

	return &EmbeddingService{
		baseURL: baseURL,
		client:  &http.Client{},
	}
}

func (s *EmbeddingService) EmbedDescription(ctx context.Context, description string) (pgvector.Vector, error) {
	reqBody := textRequest{Text: &description}
	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/embed/text", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("local embedding service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return pgvector.Vector{}, fmt.Errorf("local embedding service returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var res textResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return pgvector.Vector{}, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(res.Embedding) == 0 {
		return pgvector.Vector{}, fmt.Errorf("received empty embedding")
	}

	return pgvector.NewVector(res.Embedding), nil
}

func (s *EmbeddingService) EmbedDescriptions(ctx context.Context, descriptions []string) ([]pgvector.Vector, error) {
	if len(descriptions) == 0 {
		return nil, nil
	}

	reqBody := textsRequest{Texts: descriptions}
	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/embed/text", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("local batch embedding service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("local batch embedding service returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var res textsResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(res.Embeddings) != len(descriptions) {
		return nil, fmt.Errorf("returned embedding size mismatch: expected %d, got %d", len(descriptions), len(res.Embeddings))
	}

	vectors := make([]pgvector.Vector, len(res.Embeddings))
	for i, emb := range res.Embeddings {
		vectors[i] = pgvector.NewVector(emb)
	}

	return vectors, nil
}

func (s *EmbeddingService) EmbedFruit(ctx context.Context, f *model.Fruit) (pgvector.Vector, error) {
	description := fmt.Sprintf("A %s (outside) and %s (inside) %s fruit from %s, available during %s. Best for %s. It has a %s texture and a %s flavor profile.", f.ColorOutside, f.ColorInside, f.Name, f.Origin, f.Season, f.BestFor, f.Texture, f.Flavor)
	return s.EmbedDescription(ctx, description)
}

func (s *EmbeddingService) EmbedVisualEntity(ctx context.Context, imageData []byte, mimeType string, description string) (pgvector.Vector, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// Add image if present
	if len(imageData) > 0 {
		ext := "png"
		if strings.Contains(mimeType, "jpeg") || strings.Contains(mimeType, "jpg") {
			ext = "jpg"
		} else if strings.Contains(mimeType, "webp") {
			ext = "webp"
		}

		h := make(textproto.MIMEHeader)
		h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="image"; filename="image.%s"`, ext))
		h.Set("Content-Type", mimeType)

		part, err := writer.CreatePart(h)
		if err != nil {
			return pgvector.Vector{}, fmt.Errorf("failed to create image part: %w", err)
		}
		if _, err := io.Copy(part, bytes.NewReader(imageData)); err != nil {
			return pgvector.Vector{}, fmt.Errorf("failed to write image data: %w", err)
		}
	}

	// Add description if present
	if description != "" {
		if err := writer.WriteField("description", description); err != nil {
			return pgvector.Vector{}, fmt.Errorf("failed to write description field: %w", err)
		}
	}

	if err := writer.Close(); err != nil {
		return pgvector.Vector{}, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/embed/multimodal", body)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := s.client.Do(req)
	if err != nil {
		return pgvector.Vector{}, fmt.Errorf("local multimodal embedding service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return pgvector.Vector{}, fmt.Errorf("local multimodal embedding service returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var res textResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return pgvector.Vector{}, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(res.Embedding) == 0 {
		return pgvector.Vector{}, fmt.Errorf("received empty embedding")
	}

	return pgvector.NewVector(res.Embedding), nil
}

func (s *EmbeddingService) ExtractPDF(ctx context.Context, fileReader io.Reader, filename string) (*ExtractPDFResponse, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, filename))
	h.Set("Content-Type", "application/pdf")

	part, err := writer.CreatePart(h)
	if err != nil {
		return nil, fmt.Errorf("failed to create file part: %w", err)
	}
	if _, err := io.Copy(part, fileReader); err != nil {
		return nil, fmt.Errorf("failed to copy file reader: %w", err)
	}

	if err := writer.Close(); err != nil {
		return nil, fmt.Errorf("failed to close multipart writer: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.baseURL+"/extract/pdf", body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("local PDF extraction service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("local PDF extraction service returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var res ExtractPDFResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, fmt.Errorf("failed to decode PDF extraction response: %w", err)
	}
	return &res, nil
}
