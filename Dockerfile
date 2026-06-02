FROM golang:alpine AS builder

WORKDIR /app

# Download Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy the source code
COPY . .

# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -o api ./cmd/api

# Run stage
FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/api .
COPY --from=builder /app/frontend/public/visualEntities ./frontend/public/visualEntities

EXPOSE 8080
CMD ["./api"]
