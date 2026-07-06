package repository

import (
	"context"
	"fmt"
	"vector-search-project/internal/model"
	"vector-search-project/internal/model/response"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/pgvector/pgvector-go"
)

type DocumentRepository interface {
	Migrate(ctx context.Context) error
	CreateDocument(ctx context.Context, doc *model.Document) error
	GetDocument(ctx context.Context, name string) (*model.Document, error)
	CreateChunk(ctx context.Context, chunk *model.DocumentChunk) error
	CreateChunks(ctx context.Context, chunks []*model.DocumentChunk) error
	SearchChunks(ctx context.Context, embedding pgvector.Vector, limit int) ([]response.ChunkRes, error)
	SearchChunksInScope(ctx context.Context, embedding pgvector.Vector, docScope []string, limit int) ([]response.ChunkRes, error)
	SearchDocuments(ctx context.Context, embedding pgvector.Vector, limit int) ([]response.DocumentRes, error)
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
		CREATE TABLE IF NOT EXISTS documents (
			id            bigserial PRIMARY KEY,
			name          text NOT NULL UNIQUE,
			file_size     bigint NOT NULL,
			file_type     text NOT NULL,
			created_at    timestamp with time zone DEFAULT CURRENT_TIMESTAMP
		);

		CREATE TABLE IF NOT EXISTS document_chunks (
			id            bigserial PRIMARY KEY,
			document_name text NOT NULL,
			page_number   integer DEFAULT 1,
			content       text NOT NULL,
			embedding     halfvec(384) NOT NULL,
			image_url     text
		);

		ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS image_url text;

		DO $$ 
		BEGIN 
			IF EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'document_chunks' AND column_name = 'embedding' AND udt_name = 'vector'
			) THEN 
				ALTER TABLE document_chunks ALTER COLUMN embedding TYPE halfvec(384);
			END IF;
		END $$;

		CREATE INDEX IF NOT EXISTS document_chunks_embedding_cosine_idx 
		ON document_chunks USING hnsw (embedding halfvec_cosine_ops);
	`
	if _, err := r.pool.Exec(ctx, setupSQL); err != nil {
		return fmt.Errorf("document database migration failed: %w", err)
	}
	return nil
}

func (r *documentRepository) CreateDocument(ctx context.Context, doc *model.Document) error {
	query := `
		INSERT INTO documents (name, file_size, file_type)
		VALUES ($1, $2, $3)
		ON CONFLICT (name) DO UPDATE 
		SET file_size = EXCLUDED.file_size, file_type = EXCLUDED.file_type, created_at = CURRENT_TIMESTAMP
		RETURNING id, created_at
	`
	err := r.pool.QueryRow(ctx, query, doc.Name, doc.FileSize, doc.FileType).Scan(&doc.ID, &doc.CreatedAt)
	if err != nil {
		return fmt.Errorf("create document failed: %w", err)
	}
	return nil
}

func (r *documentRepository) GetDocument(ctx context.Context, name string) (*model.Document, error) {
	query := `
		SELECT id, name, file_size, file_type, created_at
		FROM documents
		WHERE name = $1
	`
	row := r.pool.QueryRow(ctx, query, name)
	var doc model.Document
	err := row.Scan(&doc.ID, &doc.Name, &doc.FileSize, &doc.FileType, &doc.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("get document metadata failed: %w", err)
	}
	return &doc, nil
}

func (r *documentRepository) CreateChunk(ctx context.Context, chunk *model.DocumentChunk) error {
	query := `
		INSERT INTO document_chunks (document_name, page_number, content, embedding, image_url)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`
	err := r.pool.QueryRow(ctx, query, chunk.DocumentName, chunk.PageNumber, chunk.Content, chunk.Embedding, chunk.ImageURL).Scan(&chunk.ID)
	if err != nil {
		return fmt.Errorf("create document chunk failed: %w", err)
	}
	return nil
}

func (r *documentRepository) CreateChunks(ctx context.Context, chunks []*model.DocumentChunk) error {
	if len(chunks) == 0 {
		return nil
	}

	_, err := r.pool.CopyFrom(
		ctx,
		pgx.Identifier{"document_chunks"},
		[]string{"document_name", "page_number", "content", "embedding", "image_url"},
		pgx.CopyFromSlice(len(chunks), func(i int) ([]any, error) {
			return []any{
				chunks[i].DocumentName,
				chunks[i].PageNumber,
				chunks[i].Content,
				chunks[i].Embedding,
				chunks[i].ImageURL,
			}, nil
		}),
	)
	if err != nil {
		return fmt.Errorf("create document chunks batch failed: %w", err)
	}
	return nil
}

func (r *documentRepository) SearchChunks(ctx context.Context, embedding pgvector.Vector, limit int) ([]response.ChunkRes, error) {
	query := `
		SELECT id, document_name, page_number, content, image_url,
		       ROUND((1 - (embedding <=> $1))::numeric * 100, 0) as similarity
		FROM document_chunks
		ORDER BY embedding <=> $1
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, embedding, limit)
	if err != nil {
		return nil, fmt.Errorf("document search chunks failed: %w", err)
	}
	defer rows.Close()

	var chunks []response.ChunkRes
	for rows.Next() {
		var c response.ChunkRes
		var imgURL *string
		err := rows.Scan(&c.ID, &c.DocumentName, &c.PageNumber, &c.Content, &imgURL, &c.Similarity)
		if err != nil {
			return nil, fmt.Errorf("scan document chunk failed: %w", err)
		}
		if imgURL != nil {
			c.ImageURL = *imgURL
		}
		chunks = append(chunks, c)
	}
	return chunks, nil
}

func (r *documentRepository) SearchChunksInScope(ctx context.Context, embedding pgvector.Vector, docScope []string, limit int) ([]response.ChunkRes, error) {
	var query string
	var rows interface {
		Close()
		Next() bool
		Scan(dest ...any) error
	}
	var err error

	if len(docScope) > 0 {
		query = `
			SELECT id, document_name, page_number, content, image_url,
			       ROUND((1 - (embedding <=> $1))::numeric * 100, 0) as similarity
			FROM document_chunks
			WHERE document_name = ANY($2)
			ORDER BY embedding <=> $1
			LIMIT $3
		`
		rows, err = r.pool.Query(ctx, query, embedding, docScope, limit)
	} else {
		query = `
			SELECT id, document_name, page_number, content, image_url,
			       ROUND((1 - (embedding <=> $1))::numeric * 100, 0) as similarity
			FROM document_chunks
			ORDER BY embedding <=> $1
			LIMIT $2
		`
		rows, err = r.pool.Query(ctx, query, embedding, limit)
	}

	if err != nil {
		return nil, fmt.Errorf("scoped semantic search failed: %w", err)
	}
	defer rows.Close()

	var chunks []response.ChunkRes
	for rows.Next() {
		var c response.ChunkRes
		var imgURL *string
		err := rows.Scan(&c.ID, &c.DocumentName, &c.PageNumber, &c.Content, &imgURL, &c.Similarity)
		if err != nil {
			return nil, fmt.Errorf("scan document chunk failed: %w", err)
		}
		if imgURL != nil {
			c.ImageURL = *imgURL
		}
		chunks = append(chunks, c)
	}
	return chunks, nil
}

func (r *documentRepository) SearchDocuments(ctx context.Context, embedding pgvector.Vector, limit int) ([]response.DocumentRes, error) {
	query := `
		SELECT d.name, d.file_type, d.created_at, d.file_size,
		       COUNT(c.id) as chunk_count,
		       COALESCE(MAX(ROUND((1 - (c.embedding <=> $1))::numeric * 100, 0)), 0) as max_similarity
		FROM documents d
		LEFT JOIN document_chunks c ON d.name = c.document_name
		GROUP BY d.name, d.file_type, d.created_at, d.file_size
		ORDER BY max_similarity DESC, d.created_at DESC
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, embedding, limit)
	if err != nil {
		return nil, fmt.Errorf("document vector search failed: %w", err)
	}
	defer rows.Close()

	var docs []response.DocumentRes
	for rows.Next() {
		var d response.DocumentRes
		err := rows.Scan(&d.Name, &d.FileType, &d.UploadDate, &d.FileSize, &d.ChunkCount, &d.Similarity)
		if err != nil {
			return nil, fmt.Errorf("scan document res failed: %w", err)
		}
		docs = append(docs, d)
	}
	return docs, nil
}

func (r *documentRepository) GetAllChunks(ctx context.Context) ([]response.ChunkRes, error) {
	query := `
		SELECT id, document_name, page_number, content, image_url
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
		var imgURL *string
		err := rows.Scan(&c.ID, &c.DocumentName, &c.PageNumber, &c.Content, &imgURL)
		if err != nil {
			return nil, fmt.Errorf("scan document chunk failed: %w", err)
		}
		if imgURL != nil {
			c.ImageURL = *imgURL
		}
		chunks = append(chunks, c)
	}
	return chunks, nil
}

func (r *documentRepository) GetChunksByDocument(ctx context.Context, docName string) ([]response.ChunkRes, error) {
	query := `
		SELECT id, document_name, page_number, content, image_url
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
		var imgURL *string
		err := rows.Scan(&c.ID, &c.DocumentName, &c.PageNumber, &c.Content, &imgURL)
		if err != nil {
			return nil, fmt.Errorf("scan document chunk failed: %w", err)
		}
		if imgURL != nil {
			c.ImageURL = *imgURL
		}
		chunks = append(chunks, c)
	}
	return chunks, nil
}

func (r *documentRepository) GetChunk(ctx context.Context, id int64) (*response.ChunkRes, error) {
	query := `
		SELECT id, document_name, page_number, content, image_url
		FROM document_chunks
		WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, id)
	var c response.ChunkRes
	var imgURL *string
	err := row.Scan(&c.ID, &c.DocumentName, &c.PageNumber, &c.Content, &imgURL)
	if err != nil {
		return nil, fmt.Errorf("get chunk failed: %w", err)
	}
	if imgURL != nil {
		c.ImageURL = *imgURL
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
	// Delete chunks
	_, err := r.pool.Exec(ctx, "DELETE FROM document_chunks WHERE document_name = $1", docName)
	if err != nil {
		return fmt.Errorf("delete document chunks failed: %w", err)
	}
	// Delete metadata
	_, err = r.pool.Exec(ctx, "DELETE FROM documents WHERE name = $1", docName)
	if err != nil {
		return fmt.Errorf("delete document metadata failed: %w", err)
	}
	return nil
}

func (r *documentRepository) GetDistinctDocuments(ctx context.Context) ([]response.DocumentRes, error) {
	query := `
		SELECT d.name, d.file_type, d.created_at, d.file_size,
		       COUNT(c.id) as chunk_count
		FROM documents d
		LEFT JOIN document_chunks c ON d.name = c.document_name
		GROUP BY d.name, d.file_type, d.created_at, d.file_size
		ORDER BY d.created_at DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("get distinct documents failed: %w", err)
	}
	defer rows.Close()

	var docs []response.DocumentRes
	for rows.Next() {
		var d response.DocumentRes
		err := rows.Scan(&d.Name, &d.FileType, &d.UploadDate, &d.FileSize, &d.ChunkCount)
		if err != nil {
			return nil, fmt.Errorf("scan distinct documents failed: %w", err)
		}
		docs = append(docs, d)
	}
	return docs, nil
}
