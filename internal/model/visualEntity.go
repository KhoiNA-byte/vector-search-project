package model

import "github.com/pgvector/pgvector-go"

type VisualEntity struct {
	ID         int64           `json:"id"`
	ImageURL   string          `json:"img"`
	Embedding  pgvector.Vector `json:"embedding,omitempty"`
	Similarity float64         `json:"similarity"`
}
