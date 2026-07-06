package repository

import (
	"context"
	"fmt"
	"vector-search-project/internal/model"
	"vector-search-project/internal/model/response"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pgvector/pgvector-go"
)

type FruitRepository interface {
	Migrate(ctx context.Context) error
	CreateFruit(ctx context.Context, fruit *model.Fruit) error
	SearchFruits(ctx context.Context, embedding pgvector.Vector, limit int) ([]response.FruitRes, error)
	GetAllFruits(ctx context.Context) ([]response.FruitRes, error)
	GetFruit(ctx context.Context, id int64) (*response.FruitRes, error)
	UpdateFruit(ctx context.Context, fruit *model.Fruit, embedding pgvector.Vector) error
	DeleteFruit(ctx context.Context, id int64) error
	Count(ctx context.Context) (int64, error)
}

type fruitRepository struct {
	pool *pgxpool.Pool
}

func NewFruitRepository(pool *pgxpool.Pool) FruitRepository {
	return &fruitRepository{pool: pool}
}

func (r *fruitRepository) Migrate(ctx context.Context) error {
	setupSQL := `
		CREATE TABLE IF NOT EXISTS fruits (
			id            bigserial PRIMARY KEY,
			name          text NOT NULL,
			origin        text,
			bestFor       text,
			texture       text,
			flavor        text,
			season        text,
			color_outside text,
			color_inside  text,
			price         double precision,
			embedding     halfvec(384)
		);

		DO $$ 
		BEGIN 
			IF EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'fruits' AND column_name = 'embedding' AND udt_name = 'vector'
			) THEN 
				ALTER TABLE fruits ALTER COLUMN embedding TYPE halfvec(384);
			END IF;
		END $$;

		CREATE INDEX IF NOT EXISTS fruits_embedding_cosine_idx 
		ON fruits USING hnsw (embedding halfvec_cosine_ops);
	`
	if _, err := r.pool.Exec(ctx, setupSQL); err != nil {
		return fmt.Errorf("fruit migration failed: %w", err)
	}
	return nil
}

func (r *fruitRepository) CreateFruit(ctx context.Context, fruit *model.Fruit) error {
	query := `
		INSERT INTO fruits (name, origin, bestFor, texture, flavor, season, color_outside, color_inside, price, embedding)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id
	`
	err := r.pool.QueryRow(ctx, query,
		fruit.Name, fruit.Origin, fruit.BestFor, fruit.Texture, fruit.Flavor, fruit.Season,
		fruit.ColorOutside, fruit.ColorInside, fruit.Price, fruit.Embedding,
	).Scan(&fruit.ID)
	if err != nil {
		return fmt.Errorf("create fruit failed: %w", err)
	}
	return nil
}

func (r *fruitRepository) SearchFruits(ctx context.Context, embedding pgvector.Vector, limit int) ([]response.FruitRes, error) {
	query := `
		SELECT id, name, origin, bestFor, texture, flavor, season, color_outside, color_inside, price,
		       ROUND((1 - (embedding <=> $1))::numeric * 100, 0) as similarity
		FROM fruits
		ORDER BY embedding <=> $1
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, embedding, limit)
	if err != nil {
		return nil, fmt.Errorf("fruit search failed: %w", err)
	}
	defer rows.Close()

	var fruits []response.FruitRes
	for rows.Next() {
		var f response.FruitRes
		err := rows.Scan(&f.ID, &f.Name, &f.Origin, &f.BestFor, &f.Texture, &f.Flavor, &f.Season,
			&f.ColorOutside, &f.ColorInside, &f.Price, &f.Similarity)
		if err != nil {
			return nil, fmt.Errorf("scan fruit failed: %w", err)
		}
		fruits = append(fruits, f)
	}
	return fruits, nil
}

func (r *fruitRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM fruits").Scan(&count)
	return count, err
}

func (r *fruitRepository) GetAllFruits(ctx context.Context) ([]response.FruitRes, error) {
	query := `
		SELECT id, name, origin, bestFor, texture, flavor, season, color_outside, color_inside, price
		FROM fruits
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get all fruits failed: %w", err)
	}
	defer rows.Close()

	var fruits []response.FruitRes
	for rows.Next() {
		var f response.FruitRes
		err := rows.Scan(&f.ID, &f.Name, &f.Origin, &f.BestFor, &f.Texture, &f.Flavor, &f.Season,
			&f.ColorOutside, &f.ColorInside, &f.Price)
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

func (r *fruitRepository) GetFruit(ctx context.Context, id int64) (*response.FruitRes, error) {
	query := `
		SELECT id, name, origin, bestFor, texture, flavor, season, color_outside, color_inside, price
		FROM fruits
		WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, id)
	var fruit response.FruitRes
	err := row.Scan(&fruit.ID, &fruit.Name, &fruit.Origin, &fruit.BestFor, &fruit.Texture, &fruit.Flavor, &fruit.Season,
		&fruit.ColorOutside, &fruit.ColorInside, &fruit.Price)
	if err != nil {
		return nil, fmt.Errorf("get fruit failed: %w", err)
	}
	return &fruit, nil
}

func (r *fruitRepository) UpdateFruit(ctx context.Context, fruit *model.Fruit, embedding pgvector.Vector) error {
	query := `
		UPDATE fruits
		SET name = $1, origin = $2, bestFor = $3, texture = $4, flavor = $5, season = $6,
		    color_outside = $7, color_inside = $8, price = $9, embedding = $10
		WHERE id = $11
	`
	_, err := r.pool.Exec(ctx, query,
		fruit.Name, fruit.Origin, fruit.BestFor, fruit.Texture, fruit.Flavor, fruit.Season,
		fruit.ColorOutside, fruit.ColorInside, fruit.Price, embedding, fruit.ID)
	if err != nil {
		return fmt.Errorf("update fruit failed: %w", err)
	}
	return nil
}

func (r *fruitRepository) DeleteFruit(ctx context.Context, id int64) error {
	query := `
		DELETE FROM fruits
		WHERE id = $1
	`
	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete fruit failed: %w", err)
	}
	return nil
}
