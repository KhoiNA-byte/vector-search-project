package repository

import (
	"context"
	"fmt"
	"vector-search-project/internal/model"
	"vector-search-project/internal/model/response"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pgvector/pgvector-go"
)

type DocumentRepository interface {
	Migrate(ctx context.Context) error
	CreateChunk(ctx context.Context, chunk *model.DocumentChunk) error
	SearchChunks(ctx context.Context, embedding pgvector.Vector, limit int) ([]response.ChunkRes, error)
	GetAllChunks(ctx context.Context) ([]response.ChunkRes, error)
	GetChunksByDocument(ctx context.Context, docName string) ([]response.ChunkRes, error)
	GetChunk(ctx context.Context, id int64) (*response.ChunkRes, error)
	UpdateChunk(ctx context.Context, id int64, content string, embedding pgvector.Vector) error
	DeleteChunk(ctx context.Context, id int64) error
	DeleteDocument(ctx context.Context, docName string) error
	GetDistinctDocuments(ctx context.Context) ([]response.DocumentRes, error)
}

type documentRepository struct {
	pool *pgxpool.Pool
}

func NewDocumentRepository(pool *pgxpool.Pool) DocumentRepository {
	return &documentRepository{pool: pool}
}

func (r *documentRepository) Migrate(ctx context.Context) error {
	setupSQL := `
		CREATE TABLE IF NOT EXISTS document_chunks (
			id            bigserial PRIMARY KEY,
			document_name text NOT NULL,
			page_number   integer DEFAULT 1,
			content       text NOT NULL,
			embedding     vector(3072) NOT NULL
		);
	`
	if _, err := r.pool.Exec(ctx, setupSQL); err != nil {
		return fmt.Errorf("document_chunks migration failed: %w", err)
	}
	return nil
}

func (r *documentRepository) CreateChunk(ctx context.Context, chunk *model.DocumentChunk) error {
	query := `
		INSERT INTO document_chunks (document_name, page_number, content, embedding)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`
	err := r.pool.QueryRow(ctx, query, chunk.DocumentName, chunk.PageNumber, chunk.Content, chunk.Embedding).Scan(&chunk.ID)
	if err != nil {
		return fmt.Errorf("create document chunk failed: %w", err)
	}
	return nil
}

func (r *documentRepository) SearchChunks(ctx context.Context, embedding pgvector.Vector, limit int) ([]response.ChunkRes, error) {
	query := `
		SELECT id, document_name, page_number, content,
		       ROUND((1 - (embedding <=> $1))::numeric * 100, 0) as similarity
		FROM document_chunks
		ORDER BY embedding <=> $1
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, embedding, limit)
	if err != nil {
		return nil, fmt.Errorf("document search failed: %w", err)
	}
	defer rows.Close()

	var chunks []response.ChunkRes
	for rows.Next() {
		var c response.ChunkRes
		err := rows.Scan(&c.ID, &c.DocumentName, &c.PageNumber, &c.Content, &c.Similarity)
		if err != nil {
			return nil, fmt.Errorf("scan document chunk failed: %w", err)
		}
		chunks = append(chunks, c)
	}
	return chunks, nil
}

func (r *documentRepository) GetAllChunks(ctx context.Context) ([]response.ChunkRes, error) {
	query := `
		SELECT id, document_name, page_number, content
		FROM document_chunks
		ORDER BY id ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get all document chunks failed: %w", err)
	}
	defer rows.Close()

	var chunks []response.ChunkRes
	for rows.Next() {
		var c response.ChunkRes
		err := rows.Scan(&c.ID, &c.DocumentName, &c.PageNumber, &c.Content)
		if err != nil {
			return nil, fmt.Errorf("scan document chunk failed: %w", err)
		}
		chunks = append(chunks, c)
	}
	return chunks, nil
}

func (r *documentRepository) GetChunksByDocument(ctx context.Context, docName string) ([]response.ChunkRes, error) {
	query := `
		SELECT id, document_name, page_number, content
		FROM document_chunks
		WHERE document_name = $1
		ORDER BY id ASC
	`
	rows, err := r.pool.Query(ctx, query, docName)
	if err != nil {
		return nil, fmt.Errorf("get chunks by document failed: %w", err)
	}
	defer rows.Close()

	var chunks []response.ChunkRes
	for rows.Next() {
		var c response.ChunkRes
		err := rows.Scan(&c.ID, &c.DocumentName, &c.PageNumber, &c.Content)
		if err != nil {
			return nil, fmt.Errorf("scan document chunk failed: %w", err)
		}
		chunks = append(chunks, c)
	}
	return chunks, nil
}

func (r *documentRepository) GetChunk(ctx context.Context, id int64) (*response.ChunkRes, error) {
	query := `
		SELECT id, document_name, page_number, content
		FROM document_chunks
		WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, id)
	var c response.ChunkRes
	err := row.Scan(&c.ID, &c.DocumentName, &c.PageNumber, &c.Content)
	if err != nil {
		return nil, fmt.Errorf("get chunk failed: %w", err)
	}
	return &c, nil
}

func (r *documentRepository) UpdateChunk(ctx context.Context, id int64, content string, embedding pgvector.Vector) error {
	query := `
		UPDATE document_chunks
		SET content = $1, embedding = $2
		WHERE id = $3
	`
	_, err := r.pool.Exec(ctx, query, content, embedding, id)
	if err != nil {
		return fmt.Errorf("update chunk failed: %w", err)
	}
	return nil
}

func (r *documentRepository) DeleteChunk(ctx context.Context, id int64) error {
	query := `
		DELETE FROM document_chunks
		WHERE id = $1
	`
	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete chunk failed: %w", err)
	}
	return nil
}

func (r *documentRepository) DeleteDocument(ctx context.Context, docName string) error {
	query := `
		DELETE FROM document_chunks
		WHERE document_name = $1
	`
	_, err := r.pool.Exec(ctx, query, docName)
	if err != nil {
		return fmt.Errorf("delete document failed: %w", err)
	}
	return nil
}

func (r *documentRepository) GetDistinctDocuments(ctx context.Context) ([]response.DocumentRes, error) {
	query := `
		SELECT document_name, COUNT(*) as chunk_count
		FROM document_chunks
		GROUP BY document_name
		ORDER BY document_name ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get distinct documents failed: %w", err)
	}
	defer rows.Close()

	var docs []response.DocumentRes
	for rows.Next() {
		var d response.DocumentRes
		err := rows.Scan(&d.Name, &d.ChunkCount)
		if err != nil {
			return nil, fmt.Errorf("scan distinct documents failed: %w", err)
		}
		docs = append(docs, d)
	}
	return docs, nil
}
