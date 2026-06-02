package service

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type StorageService interface {
	Upload(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) error
	Delete(ctx context.Context, objectName string) error
	GetPublicURL(objectName string) string
}

type storageService struct {
	client     *minio.Client
	bucketName string
	publicURL  string
}

func NewStorageService() StorageService {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ACCESS_KEY")
	secretKey := os.Getenv("MINIO_SECRET_KEY")
	bucketName := os.Getenv("MINIO_BUCKET")
	publicURL := os.Getenv("MINIO_PUBLIC_URL")
	useSSLStr := os.Getenv("MINIO_USE_SSL")

	useSSL := false
	if useSSLStr == "true" {
		useSSL = true
	}

	if endpoint == "" {
		endpoint = "localhost:9000"
	}
	if accessKey == "" {
		accessKey = "minioadmin"
	}
	if secretKey == "" {
		secretKey = "minioadmin"
	}
	if bucketName == "" {
		bucketName = "visual-entities"
	}
	if publicURL == "" {
		publicURL = "http://localhost:9000/visual-entities"
	}

	// Initialize MinIO client
	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalf("Failed to initialize MinIO client: %v", err)
	}

	ctx := context.Background()

	// Ensure bucket exists
	exists, err := client.BucketExists(ctx, bucketName)
	if err != nil {
		log.Printf("Warning: Failed to check if bucket %s exists: %v", bucketName, err)
	} else if !exists {
		err = client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			log.Fatalf("Failed to create bucket %s: %v", bucketName, err)
		}
		log.Printf("Successfully created bucket %s", bucketName)

		// Set public read-only policy
		policy := fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {"AWS": ["*"]},
					"Action": ["s3:GetObject"],
					"Resource": ["arn:aws:s3:::%s/*"]
				}
			]
		}`, bucketName)

		err = client.SetBucketPolicy(ctx, bucketName, policy)
		if err != nil {
			log.Printf("Warning: Failed to set public policy on bucket %s: %v", bucketName, err)
		} else {
			log.Printf("Successfully set public read policy on bucket %s", bucketName)
		}
	}

	return &storageService{
		client:     client,
		bucketName: bucketName,
		publicURL:  publicURL,
	}
}

func (s *storageService) Upload(ctx context.Context, objectName string, reader io.Reader, size int64, contentType string) error {
	_, err := s.client.PutObject(ctx, s.bucketName, objectName, reader, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("failed to upload object %s to MinIO: %w", objectName, err)
	}
	return nil
}

func (s *storageService) Delete(ctx context.Context, objectName string) error {
	err := s.client.RemoveObject(ctx, s.bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete object %s from MinIO: %w", objectName, err)
	}
	return nil
}

func (s *storageService) GetPublicURL(objectName string) string {
	return fmt.Sprintf("%s/%s", s.publicURL, objectName)
}
