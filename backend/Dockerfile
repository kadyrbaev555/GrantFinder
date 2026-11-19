FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -o /out/api ./cmd/api && \
    CGO_ENABLED=0 go build -trimpath -o /out/migrate ./cmd/migrate

FROM scratch
WORKDIR /app
COPY --from=build /out/ ./
COPY migrations/ ./migrations/
USER 65532:65532
CMD ["/app/api"]
