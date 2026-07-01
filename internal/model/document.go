package model

import (
	"time"

	"github.com/pgvector/pgvector-go"
)

type DocumentChunk struct {
	ID           int64           `json:"id"`
	DocumentName string          `json:"documentName"`
	PageNumber   int             `json:"pageNumber"`
	Content      string          `json:"content"`
	Embedding    pgvector.Vector `json:"embedding,omitempty"`
}

type Document struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	StoragePath string    `json:"storagePath"`
	FileSize    int64     `json:"fileSize"`
	FileType    string    `json:"fileType"`
	CreatedAt   time.Time `json:"createdAt"`
}
