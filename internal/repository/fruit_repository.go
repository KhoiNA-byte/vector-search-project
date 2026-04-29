package repository

import (
	"context"
	"fmt"

	"vector-search-project/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pgvector/pgvector-go"
)

type FruitRepository interface {
	Migrate(ctx context.Context) error
	CreateFruit(ctx context.Context, fruit *model.Fruit) error
	SearchFruits(ctx context.Context, embedding pgvector.Vector, limit int) ([]model.Fruit, error)
	GetAllFruits(ctx context.Context) ([]model.Fruit, error)
	DeleteFruit(ctx context.Context) error
	Count(ctx context.Context) (int64, error)
}

type fruitRepository struct {
	pool *pgxpool.Pool
}

func NewFruitRepository(pool *pgxpool.Pool) FruitRepository {
	return &fruitRepository{pool: pool}
}

func (r *fruitRepository) Migrate(ctx context.Context) error {
	// Re-dropping to ensure we have the new schema with 'season'
	_, _ = r.pool.Exec(ctx, "DROP TABLE IF EXISTS fruits CASCADE")

	setupSQL := `
		CREATE TABLE IF NOT EXISTS fruits (
			id bigserial PRIMARY KEY,
			name text NOT NULL,
			origin text,
			bestFor text,
			texture text,
			flavor text,
			season text,
			color text,
			price double precision,
			embedding vector(3072)
		);
	`
	if _, err := r.pool.Exec(ctx, setupSQL); err != nil {
		return fmt.Errorf("fruit migration failed: %w", err)
	}
	return nil
}

func (r *fruitRepository) CreateFruit(ctx context.Context, fruit *model.Fruit) error {
	query := `
		INSERT INTO fruits (name, origin, bestFor, texture, flavor, season, color, price, embedding)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`
	err := r.pool.QueryRow(ctx, query, fruit.Name, fruit.Origin, fruit.BestFor, fruit.Texture, fruit.Flavor, fruit.Season, fruit.Color, fruit.Price, fruit.Embedding).Scan(&fruit.ID)
	if err != nil {
		return fmt.Errorf("create fruit failed: %w", err)
	}
	return nil
}

func (r *fruitRepository) SearchFruits(ctx context.Context, embedding pgvector.Vector, limit int) ([]model.Fruit, error) {
	query := `
		SELECT id, name, origin, bestFor, texture, flavor, season, color, price, embedding
		FROM fruits
		ORDER BY embedding <=> $1
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, embedding, limit)
	if err != nil {
		return nil, fmt.Errorf("fruit search failed: %w", err)
	}
	defer rows.Close()

	var fruits []model.Fruit
	for rows.Next() {
		var f model.Fruit
		err := rows.Scan(&f.ID, &f.Name, &f.Origin, &f.BestFor, &f.Texture, &f.Flavor, &f.Season, &f.Color, &f.Price, &f.Embedding)
		if err != nil {
			return nil, fmt.Errorf("scan fruit failed: %w", err)
		}
		fruits = append(fruits, f)
	}
	return fruits, nil
}

func (r *fruitRepository) DeleteFruit(ctx context.Context) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM fruits")
	return err
}

func (r *fruitRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM fruits").Scan(&count)
	return count, err
}

func (r *fruitRepository) GetAllFruits(ctx context.Context) ([]model.Fruit, error) {
	query := `
		SELECT id, name, origin, bestFor, texture, flavor, season, color, price, embedding
		FROM fruits
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get all fruits failed: %w", err)
	}
	defer rows.Close()

	var fruits []model.Fruit
	for rows.Next() {
		var f model.Fruit
		err := rows.Scan(&f.ID, &f.Name, &f.Origin, &f.BestFor, &f.Texture, &f.Flavor, &f.Season, &f.Color, &f.Price, &f.Embedding)
		if err != nil {
			return nil, fmt.Errorf("scan fruit failed: %w", err)
		}
		fruits = append(fruits, f)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("rows error: %w", rows.Err())
	}

	return fruits, nil
}
