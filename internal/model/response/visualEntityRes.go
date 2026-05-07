package response

import "github.com/pgvector/pgvector-go"

type VisualEntityRes struct {
	ImageURL   string          `json:"img"`
	Embedding  pgvector.Vector `json:"embedding,omitempty"`
	Similarity float64         `json:"similarity"`
}
