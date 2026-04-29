package model

import "github.com/pgvector/pgvector-go"

type Fruit struct {
	ID        int64
	Name      string
	Origin    string
	BestFor   string
	Texture   string
	Flavor    string
	Season    string
	Color     string
	Price     float64
	Embedding pgvector.Vector
}
