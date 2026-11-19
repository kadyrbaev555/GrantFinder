package database

import (
	"context"
	"errors"
	"os"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// Open loads optional local settings and connects using PostgreSQL's PG* variables.
func Open(ctx context.Context) (*sqlx.DB, error) {
	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		return nil, err
	}
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	return sqlx.ConnectContext(ctx, "postgres", "")
}
