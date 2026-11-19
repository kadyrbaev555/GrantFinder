package main

import (
	"context"
	"log"
	"os"

	"github.com/kadyrbaev555/GrantFinder/backend/internal/database"
	"github.com/pressly/goose/v3"
)

func main() {
	if len(os.Args) != 2 {
		log.Fatal("usage: migrate up|down|status")
	}
	command := os.Args[1]
	switch command {
	case "up", "down", "status":
	default:
		log.Fatalf("unknown migration command %q", command)
	}
	if err := run(command); err != nil {
		log.Fatal(err)
	}
}

func run(command string) error {
	db, err := database.Open(context.Background())
	if err != nil {
		return err
	}
	defer db.Close()
	if err := goose.SetDialect("postgres"); err != nil {
		return err
	}
	return goose.Run(command, db.DB, "migrations")
}
