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
	UpdateVisualEntityURL(ctx context.Context, id int64, imageURL string) error
	SearchVisualEntity(ctx context.Context, embedding pgvector.Vector) ([]response.VisualEntityRes, error)
	GetAllVisualEntity(ctx context.Context) ([]response.VisualEntityRes, error)
	GetVisualEntity(ctx context.Context, id int64) (*response.VisualEntityRes, error)
	DeleteVisualEntity(ctx context.Context, id int64) error
	Count(ctx context.Context) (int64, error)
	GetMaxID(ctx context.Context) (int64, error)
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
	var err error
	if visualEntity.ID != 0 {
		query := `
			INSERT INTO visual_entities (id, image_url, embedding) 
			VALUES ($1, $2, $3)
			RETURNING id
		`
		err = r.pool.QueryRow(ctx, query, visualEntity.ID, visualEntity.ImageURL, visualEntity.Embedding).Scan(&visualEntity.ID)
		if err == nil {
			// Reset sequence to maximum id in table
			_, _ = r.pool.Exec(ctx, "SELECT setval(pg_get_serial_sequence('visual_entities', 'id'), coalesce(max(id), 1)) FROM visual_entities")
		}
	} else {
		query := `
			INSERT INTO visual_entities (image_url, embedding) 
			VALUES ($1, $2)
			RETURNING id
		`
		err = r.pool.QueryRow(ctx, query, visualEntity.ImageURL, visualEntity.Embedding).Scan(&visualEntity.ID)
	}
	if err != nil {
		return fmt.Errorf("create visual entity failed: %w", err)
	}
	return nil
}

func (r *visualEntityRepository) UpdateVisualEntityURL(ctx context.Context, id int64, imageURL string) error {
	query := `
		UPDATE visual_entities
		SET image_url = $1
		WHERE id = $2
	`
	_, err := r.pool.Exec(ctx, query, imageURL, id)
	if err != nil {
		return fmt.Errorf("update visual entity URL failed: %w", err)
	}
	return nil
}

func (r *visualEntityRepository) SearchVisualEntity(ctx context.Context, embedding pgvector.Vector) ([]response.VisualEntityRes, error) {
	query := `
		SELECT id, image_url, ROUND((1 - (embedding <=> $1))::numeric * 100, 0) as similarity
		FROM visual_entities
		ORDER BY embedding <=> $1
	`
	rows, err := r.pool.Query(ctx, query, embedding)
	if err != nil {
		return nil, fmt.Errorf("visual entity search failed: %w", err)
	}
	defer rows.Close()

	var visualEntities []response.VisualEntityRes
	for rows.Next() {
		var item response.VisualEntityRes
		err := rows.Scan(&item.ID, &item.ImageURL, &item.Similarity)
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
		SELECT id, image_url
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
		err := rows.Scan(&v.ID, &v.ImageURL)
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

func (r *visualEntityRepository) GetVisualEntity(ctx context.Context, id int64) (*response.VisualEntityRes, error) {
	query := `
		SELECT id, image_url
		FROM visual_entities
		WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, id)
	var v response.VisualEntityRes
	err := row.Scan(&v.ID, &v.ImageURL)
	if err != nil {
		return nil, fmt.Errorf("get visual entity failed: %w", err)
	}
	return &v, nil
}

func (r *visualEntityRepository) DeleteVisualEntity(ctx context.Context, id int64) error {
	query := `
		DELETE FROM visual_entities
		WHERE id = $1
	`
	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete visual entity failed: %w", err)
	}
	return nil
}

func (r *visualEntityRepository) GetMaxID(ctx context.Context) (int64, error) {
	var maxID int64
	err := r.pool.QueryRow(ctx, "SELECT COALESCE(MAX(id), 0) FROM visual_entities").Scan(&maxID)
	return maxID, err
}
