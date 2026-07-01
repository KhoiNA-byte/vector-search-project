package model

import "github.com/pgvector/pgvector-go"

type DocumentChunk struct {
	ID           int64           `json:"id"`
	DocumentName string          `json:"documentName"`
	PageNumber   int             `json:"pageNumber"`
	Content      string          `json:"content"`
	Embedding    pgvector.Vector `json:"embedding,omitempty"`
}

type Document struct {
	Name       string `json:"name"`
	ChunkCount int64  `json:"chunkCount"`
}
