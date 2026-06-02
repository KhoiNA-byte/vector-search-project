package service

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
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
	repo       repository.VisualEntityRepository
	embedSvc   *EmbeddingService
	storageSvc StorageService
}

func NewVisualEntityService(repo repository.VisualEntityRepository) VisualEntityService {
	return &visualEntityService{
		repo:       repo,
		embedSvc:   NewEmbeddingService(),
		storageSvc: NewStorageService(),
	}
}

func (s *visualEntityService) Seed(ctx context.Context) error {
	count, err := s.repo.Count(ctx)
	if err != nil {
		return fmt.Errorf("failed to check visual entity count: %w", err)
	}
	if count > 0 {
		return nil // skip seeding if data already exists
	}

	VisualEntityToSeed := database.GetVisualEntitiesToSeed()

	for _, v := range VisualEntityToSeed {
		// Extract filename
		filename := filepath.Base(v.ImageURL)
		imagePath := filepath.Join("frontend", "public", "visualEntities", filename)
		
		// Read local file
		imageData, err := os.ReadFile(imagePath)
		if err != nil {
			log.Printf("Warning: failed to read image file %s for seeding: %v", imagePath, err)
			continue
		}

		// Detect MIME type
		ext := strings.ToLower(filepath.Ext(imagePath))
		mimeType := "image/jpeg"
		switch ext {
		case ".png":
			mimeType = "image/png"
		case ".webp":
			mimeType = "image/webp"
		case ".svg":
			mimeType = "image/svg+xml"
		}

		// Generate embedding
		embedding, err := s.embedSvc.EmbedVisualEntity(ctx, imageData, mimeType, "Identify this image")
		if err != nil {
			return fmt.Errorf("failed to embed visual entity %s: %w", filename, err)
		}
		v.Embedding = embedding

		// Upload to MinIO
		reader := bytes.NewReader(imageData)
		err = s.storageSvc.Upload(ctx, filename, reader, int64(len(imageData)), mimeType)
		if err != nil {
			return fmt.Errorf("failed to upload visual entity %s to MinIO: %w", filename, err)
		}

		// Set database image_url reference to the filename
		v.ImageURL = filename
		if err := s.repo.CreateVisualEntity(ctx, v); err != nil {
			return err
		}
	}
	return nil
}

func (s *visualEntityService) Create(ctx context.Context, imageData []byte, filename string) (int64, error) {
	ext := filepath.Ext(filename)

	// Detect MIME type
	mimeType := "image/jpeg"
	switch strings.ToLower(ext) {
	case ".png":
		mimeType = "image/png"
	case ".webp":
		mimeType = "image/webp"
	case ".svg":
		mimeType = "image/svg+xml"
	}

	// Generate embedding
	embedding, err := s.embedSvc.EmbedVisualEntity(ctx, imageData, mimeType, "Identify this image")
	if err != nil {
		return 0, fmt.Errorf("failed to embed visual entity: %w", err)
	}

	// Save to DB first with a temporary name to get the actual auto-incremented ID
	entity := &model.VisualEntity{
		ImageURL:  filename, // Temporary
		Embedding: embedding,
	}
	if err := s.repo.CreateVisualEntity(ctx, entity); err != nil {
		return 0, err
	}

	// Format filename using the actual assigned ID
	formattedName := fmt.Sprintf("visual_entity_%d%s", entity.ID, ext)

	// Upload to MinIO
	reader := bytes.NewReader(imageData)
	err = s.storageSvc.Upload(ctx, formattedName, reader, int64(len(imageData)), mimeType)
	if err != nil {
		// Clean up the DB record on upload failure
		_ = s.repo.DeleteVisualEntity(ctx, entity.ID)
		return 0, fmt.Errorf("failed to upload visual entity to MinIO: %w", err)
	}

	// Update DB record with the correct filename matching the ID
	err = s.repo.UpdateVisualEntityURL(ctx, entity.ID, formattedName)
	if err != nil {
		// Clean up MinIO on failure
		_ = s.storageSvc.Delete(ctx, formattedName)
		return 0, fmt.Errorf("failed to update visual entity image URL: %w", err)
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

	// Map relative filenames to public MinIO URLs
	for i := range results {
		results[i].ImageURL = s.storageSvc.GetPublicURL(results[i].ImageURL)
	}

	return results, nil
}

func (s *visualEntityService) GetAll(ctx context.Context) ([]response.VisualEntityRes, error) {
	results, err := s.repo.GetAllVisualEntity(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get all visual entity: %w", err)
	}

	// Map relative filenames to public MinIO URLs
	for i := range results {
		results[i].ImageURL = s.storageSvc.GetPublicURL(results[i].ImageURL)
	}

	return results, nil
}

func (s *visualEntityService) GetVisualEntity(ctx context.Context, id int64) (*response.VisualEntityRes, error) {
	result, err := s.repo.GetVisualEntity(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get visual entity with id %d: %w", id, err)
	}

	// Map to public MinIO URL
	result.ImageURL = s.storageSvc.GetPublicURL(result.ImageURL)
	return result, nil
}

func (s *visualEntityService) DeleteVisualEntity(ctx context.Context, id int64) error {
	result, err := s.repo.GetVisualEntity(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to find visual entity to delete: %w", err)
	}

	// Delete from MinIO (using the original filename stored in the database)
	err = s.storageSvc.Delete(ctx, result.ImageURL)
	if err != nil {
		log.Printf("Warning: failed to delete file %s from MinIO: %v", result.ImageURL, err)
	}

	// Delete from DB
	err = s.repo.DeleteVisualEntity(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to delete visual entity with id %d: %w", id, err)
	}
	return nil
}
