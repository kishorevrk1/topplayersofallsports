# HighlightsSvc - Video Highlights Microservice

## Overview
Production-grade microservice for ingesting, storing, and serving sports video highlights from YouTube and other platforms using Temporal for durable execution.

## Architecture
- **Framework**: Spring Boot 3.x
- **Workflow Engine**: Temporal
- **Database**: PostgreSQL
- **Cache**: Redis (optional)
- **API**: REST (OpenAPI 3.0)

## Project Structure
```
highlights-service/
├── src/
│   ├── main/
│   │   ├── java/com/topplayersofallsports/highlights/
│   │   │   ├── api/              # REST controllers
│   │   │   ├── domain/           # Domain models & business logic
│   │   │   ├── infrastructure/   # External integrations
│   │   │   ├── temporal/         # Temporal workflows & activities
│   │   │   ├── repository/       # Data access layer
│   │   │   ├── service/          # Application services
│   │   │   ├── config/           # Configuration classes
│   │   │   └── HighlightsApplication.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-local.yml
│   │       ├── application-prod.yml
│   │       └── db/migration/     # Flyway migrations
│   └── test/
│       └── java/com/topplayersofallsports/highlights/
│           ├── api/              # API tests
│           ├── temporal/         # Workflow tests
│           └── integration/      # Integration tests
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml        # Local dev environment
├── k8s/                          # Kubernetes manifests
├── .env.example
├── pom.xml
└── README.md
```

## Local Development

### Prerequisites
- Java 17+
- Docker & Docker Compose
- Maven 3.8+

### Setup
```bash
# Start local infrastructure (Postgres, Redis, Temporal)
docker-compose up -d

# Run migrations
mvn flyway:migrate

# Start service
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

### Environment Variables
See `.env.example` for required configuration.

## Production Deployment
- Designed for AWS ECS/EKS
- Uses AWS Secrets Manager for sensitive config
- Supports horizontal scaling
- Health checks and readiness probes included

## API Documentation
OpenAPI spec available at `/api/docs` when service is running.
