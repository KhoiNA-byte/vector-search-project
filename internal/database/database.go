package database

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	pgxvec "github.com/pgvector/pgvector-go/pgx"
)

type Service interface {
	Health() map[string]string
	Close() error
	Pool() *pgxpool.Pool
}

type service struct {
	pool *pgxpool.Pool
}

var (
	dsn        = os.Getenv("DATABASE_URL")
	dbInstance *service
	once       sync.Once
)

func New() Service {
	once.Do(func() {
		if dsn == "" {
			dsn = "postgres://postgres:admin@localhost:5433/test_db?sslmode=disable"
		}

		ctx := context.Background()
		config, err := pgxpool.ParseConfig(dsn)
		if err != nil {
			log.Fatalf("unable to parse dsn: %v", err)
		}

		config.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
			// Ensure the vector extension exists
			_, err := conn.Exec(ctx, "CREATE EXTENSION IF NOT EXISTS vector")
			if err != nil {
				return fmt.Errorf("unable to create vector extension: %w", err)
			}
			// Register pgvector types
			return pgxvec.RegisterTypes(ctx, conn)
		}

		pool, err := pgxpool.NewWithConfig(ctx, config)
		if err != nil {
			log.Fatalf("unable to connect to pool: %v", err)
		}

		dbInstance = &service{
			pool: pool,
		}

		log.Println("Successfully connected to PostgreSQL Pool with pgvector support")
	})

	return dbInstance
}

func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)

	err := s.pool.Ping(ctx)
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		return stats
	}

	stats["status"] = "up"
	stats["message"] = "It's healthy"
	stats["total_connections"] = strconv.Itoa(int(s.pool.Stat().TotalConns()))

	return stats
}

func (s *service) Close() error {
	s.pool.Close()
	return nil
}

func (s *service) Pool() *pgxpool.Pool {
	return s.pool
}
