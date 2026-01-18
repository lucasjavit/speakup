# SpeakUp Backend

Backend API for the SpeakUp language practice platform.

## Tech Stack

- Java 21
- Spring Boot 3.3
- PostgreSQL 16
- Redis 7
- Flyway (migrations)
- JWT Authentication
- OAuth2 (Google, GitHub)

## Prerequisites

- Java 21+
- Docker & Docker Compose
- Maven 3.9+

## Quick Start

### 1. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker-compose up -d
```

### 2. Run Application

```bash
# Using Maven wrapper
./mvnw spring-boot:run

# Or with specific profile
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### 3. Access

- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui.html
- API Docs: http://localhost:8080/api-docs

## Project Structure

```
src/main/java/com/speakup/
├── domain/           # Domain entities, repositories, exceptions
│   ├── shared/       # Base classes
│   └── user/         # User domain
├── application/      # Application services, DTOs
│   └── user/
├── infrastructure/   # External implementations
│   ├── config/       # Spring configurations
│   └── persistence/  # JPA repositories
└── presentation/     # REST controllers
    ├── api/
    └── exception/
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | speakup |
| DB_USERNAME | Database user | speakup |
| DB_PASSWORD | Database password | speakup123 |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| JWT_SECRET | JWT signing key | (dev default) |
| GOOGLE_CLIENT_ID | Google OAuth client ID | - |
| GOOGLE_CLIENT_SECRET | Google OAuth secret | - |
| GITHUB_CLIENT_ID | GitHub OAuth client ID | - |
| GITHUB_CLIENT_SECRET | GitHub OAuth secret | - |

## Testing

```bash
# Run all tests
./mvnw test

# Run with coverage
./mvnw test jacoco:report
```

## Docker

```bash
# Build image
docker build -t speakup-backend .

# Run with compose (full stack)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```
