package repository

import (
	"context"
	"fmt"
	"vector-search-project/internal/model"
	"vector-search-project/internal/model/response"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pgvector/pgvector-go"
)

type VisualEntityRepository interface {
	Migrate(ctx context.Context) error
	CreateVisualEntity(ctx context.Context, visualEntity *model.VisualEntity) error
	SearchVisualEntity(ctx context.Context, embedding pgvector.Vector, limit int) ([]response.VisualEntityRes, error)
	GetAllVisualEntity(ctx context.Context) ([]response.VisualEntityRes, error)
	Count(ctx context.Context) (int64, error)
}

type visualEntityRepository struct {
	pool *pgxpool.Pool
}

func NewVisualEntityRepository(pool *pgxpool.Pool) VisualEntityRepository {
	return &visualEntityRepository{pool: pool}
}

func (r *visualEntityRepository) Migrate(ctx context.Context) error {
	setupSQL := `
	CREATE TABLE IF NOT EXISTS visual_entities (
		id bigserial PRIMARY KEY,
		image_url text,
		embedding vector(3072)
	);
`
	if _, err := r.pool.Exec(ctx, setupSQL); err != nil {
		return fmt.Errorf("visual_entities table migration failed: %w", err)
	}
	return nil
}

func (r *visualEntityRepository) CreateVisualEntity(ctx context.Context, visualEntity *model.VisualEntity) error {
	query := `
		INSERT INTO visual_entities (image_url, embedding) 
		VALUES ($1, $2)
		RETURNING id
	`
	err := r.pool.QueryRow(ctx, query, visualEntity.ImageURL, visualEntity.Embedding).Scan(&visualEntity.ID)
	if err != nil {
		return fmt.Errorf("create visual entity failed: %w", err)
	}
	return nil
}

func (r *visualEntityRepository) SearchVisualEntity(ctx context.Context, embedding pgvector.Vector, limit int) ([]response.VisualEntityRes, error) {
	query := `
		SELECT image_url, ROUND((1 - (embedding <=> $1))::numeric * 100, 0) as similarity
		FROM visual_entities
		ORDER BY embedding <=> $1
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, embedding, limit)
	if err != nil {
		return nil, fmt.Errorf("visual entity search failed: %w", err)
	}
	defer rows.Close()

	var visualEntities []response.VisualEntityRes
	for rows.Next() {
		var item response.VisualEntityRes
		err := rows.Scan(&item.ImageURL, &item.Similarity)
		if err != nil {
			return nil, fmt.Errorf("scan visual entity failed: %w", err)
		}
		visualEntities = append(visualEntities, item)
	}
	return visualEntities, nil
}

func (r *visualEntityRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM visual_entities").Scan(&count)
	return count, err
}

func (r *visualEntityRepository) GetAllVisualEntity(ctx context.Context) ([]response.VisualEntityRes, error) {
	query := `
		SELECT image_url, 0 as similarity
		FROM visual_entities
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get all visual entity failed: %w", err)
	}
	defer rows.Close()
	var visualEntities []response.VisualEntityRes
	for rows.Next() {
		var v response.VisualEntityRes
		err := rows.Scan(&v.ImageURL, &v.Similarity)
		if err != nil {
			return nil, fmt.Errorf("scan visual entity failed: %w", err)
		}
		visualEntities = append(visualEntities, v)
	}

	if rows.Err() != nil {
		return nil, fmt.Errorf("rows error: %w", rows.Err())
	}

	return visualEntities, nil
}
