package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/pgvector/pgvector-go"
)

type ItemRepository struct {
	conn *pgx.Conn
}

func NewItemRepository(conn *pgx.Conn) *ItemRepository {
	return &ItemRepository{conn: conn}
}

func (r *ItemRepository) Migrate(ctx context.Context) error {
	setupSQL := `
		CREATE TABLE IF NOT EXISTS items (
			id bigserial PRIMARY KEY, 
			embedding vector(3)
		);
	`
	if _, err := r.conn.Exec(ctx, setupSQL); err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}
	return nil
}

func (r *ItemRepository) InsertItem(ctx context.Context, vec pgvector.Vector) error {
	_, err := r.conn.Exec(ctx, "INSERT INTO items (embedding) VALUES ($1)", vec)
	if err != nil {
		return fmt.Errorf("insert failed: %w", err)
	}
	return nil
}

func (r *ItemRepository) GetNearestNeighbors(ctx context.Context, vec pgvector.Vector, limit int) ([]int64, error) {
	rows, err := r.conn.Query(ctx, "SELECT id FROM items ORDER BY embedding <-> $1 LIMIT $2", vec, limit)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan failed: %w", err)
		}
		ids = append(ids, id)
	}
	return ids, nil
}
