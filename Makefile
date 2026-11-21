.DEFAULT_GOAL := up
.PHONY: up backend frontend down

ifeq ($(OS),Windows_NT)
NPM := npm.cmd
COPY_ENV := cmd /c copy
else
NPM := npm
COPY_ENV := cp
endif

up: backend
	$(MAKE) frontend

backend: .env
	docker compose up --build -d

frontend: frontend/node_modules/.package-lock.json
	$(NPM) --prefix frontend run dev

frontend/node_modules/.package-lock.json: frontend/package.json frontend/package-lock.json
	$(NPM) --prefix frontend ci

.env:
	$(COPY_ENV) .env.example .env

down: .env
	docker compose down
