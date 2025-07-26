# TopPlayersofAllSports Backend API

A comprehensive Spring Boot backend service providing RESTful APIs for the TopPlayersofAllSports application.

## 🏗️ Architecture Overview

This backend follows a clean architecture pattern with the following layers:

- **Controller Layer**: REST API endpoints
- **Service Layer**: Business logic and operations
- **Repository Layer**: Data access using Spring Data JPA
- **Model Layer**: Entity classes and database schema
- **Configuration Layer**: Security, CORS, and application configuration

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (ADMIN, MODERATOR, EDITOR, USER)
- Secure password hashing with BCrypt
- Refresh token support

### Sports Content Management
- News articles with categories and search
- Player profiles with statistics
- Video highlights management
- Real-time trending content

### User Management
- User registration and profile management
- Email verification and password reset
- User preferences and favorites
- Activity tracking

### AI Integration
- OpenAI integration for content generation
- Automated content moderation
- Smart content recommendations

## 🛠️ Technology Stack

- **Java 17**
- **Spring Boot 3.2.1**
- **Spring Security 6.x** with JWT
- **Spring Data JPA** with PostgreSQL
- **Maven** for dependency management
- **Docker** for containerization
- **Swagger/OpenAPI** for API documentation

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6+
- PostgreSQL 12+
- Docker (optional)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd topplayersofallsports-backend
```

### 2. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE topplayersofallsports_db;
CREATE USER topplayers_user WITH PASSWORD 'topplayers_password';
GRANT ALL PRIVILEGES ON DATABASE topplayersofallsports_db TO topplayers_user;
```

### 3. Environment Configuration

Update `src/main/resources/application.properties` with your configuration:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/topplayersofallsports_db
spring.datasource.username=topplayers_user
spring.datasource.password=topplayers_password

# JWT Secret (use a strong secret in production)
jwt.secret=your-256-bit-secret-key-here

# OpenAI API Key
openai.api.key=your-openai-api-key-here

# Email Configuration
spring.mail.username=your-email@gmail.com
spring.mail.password=your-email-password
```

### 4. Build and Run

```bash
# Build the application
mvn clean compile

# Run the application
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`

### 5. API Documentation

Once the application is running, access the Swagger UI at:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs

## 📁 Project Structure

```
src/main/java/com/topplayersofallsports/backend/
├── TopPlayersofAllSportsBackendApplication.java  # Main application class
├── config/                                        # Configuration classes
│   ├── SecurityConfig.java                       # Spring Security configuration
│   ├── JwtAuthenticationFilter.java              # JWT filter
│   └── OpenApiConfig.java                        # Swagger/OpenAPI configuration
├── controller/                                    # REST controllers
│   ├── AuthController.java                       # Authentication endpoints
│   └── NewsController.java                       # News management endpoints
├── dto/                                          # Data Transfer Objects
│   ├── AuthDto.java                             # Authentication DTOs
│   └── UserDto.java                             # User response DTOs
├── model/                                        # Entity classes
│   ├── BaseEntity.java                          # Base entity with audit fields
│   ├── User.java                                # User entity
│   ├── NewsArticle.java                         # News article entity
│   ├── Player.java                              # Player entity
│   ├── VideoHighlight.java                      # Video highlight entity
│   ├── Comment.java                             # Comment entity
│   └── UserFavorite.java                        # User favorite entity
├── repository/                                   # Data access layer
│   ├── UserRepository.java                      # User data access
│   ├── NewsArticleRepository.java               # News article data access
│   └── PlayerRepository.java                    # Player data access
└── service/                                      # Business logic layer
    ├── UserService.java                         # User business logic
    ├── JwtService.java                          # JWT token management
    ├── CustomUserDetailsService.java            # Spring Security user details
    └── EmailService.java                        # Email sending service
```

## 🔐 API Authentication

### Public Endpoints (No Authentication Required)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/news/public/**` - Public news endpoints
- `GET /api/players/public/**` - Public player endpoints

### Protected Endpoints (Authentication Required)
- `GET /api/users/profile/**` - User profile management
- `POST /api/comments/**` - Comment management
- `GET /api/favorites/**` - User favorites

### Admin Endpoints (Admin Role Required)
- `GET /api/admin/**` - Admin operations
- `GET /api/users/admin/**` - User administration

## 🧪 Testing

```bash
# Run unit tests
mvn test

# Run integration tests
mvn verify

# Generate test coverage report
mvn jacoco:report
```

## 🐳 Docker Deployment

### Build Docker Image

```bash
# Build the application
mvn clean package -DskipTests

# Build Docker image
docker build -t topplayersofallsports-backend .
```

### Run with Docker Compose

```bash
# Start all services (backend + PostgreSQL)
docker-compose up -d

# Stop all services
docker-compose down
```

## 📊 Monitoring & Health Checks

The application includes Spring Boot Actuator for monitoring:

- **Health Check**: `GET /actuator/health`
- **Application Info**: `GET /actuator/info`
- **Metrics**: `GET /actuator/metrics` (Admin only)

## 🤝 Integration with Frontend

This backend is designed to work seamlessly with the React frontend. Key integration points:

### CORS Configuration
- Configured for `http://localhost:3000` (React dev server)
- Configured for `http://localhost:5173` (Vite dev server)
- Production domains can be added in `SecurityConfig.java`

### API Endpoints Matching Frontend Needs
- `/api/news/public` - Breaking news feed
- `/api/players/public` - Player profiles
- `/api/auth/login` - User authentication
- `/api/auth/register` - User registration

### JWT Token Format
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 86400000,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "USER"
  }
}
```

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY` - OpenAI API key for content generation
- `EMAIL_USERNAME` - Email service username
- `EMAIL_PASSWORD` - Email service password
- `JWT_SECRET` - JWT signing secret (production)

### Application Properties
Key configuration options in `application.properties`:
- Database connection settings
- JWT token expiration times
- File upload limits
- CORS allowed origins
- Cache configuration

## 📈 Performance & Scalability

- **Database Indexing**: Optimized queries with proper indexes
- **Caching**: Spring Cache for frequently accessed data
- **Pagination**: All list endpoints support pagination
- **Connection Pooling**: HikariCP for database connections
- **Async Processing**: Email sending and heavy operations

## 🛡️ Security Features

- **Password Encryption**: BCrypt with configurable strength
- **JWT Security**: HMAC-SHA256 signing with refresh tokens
- **CORS Protection**: Configurable allowed origins
- **SQL Injection Prevention**: Parameterized queries with JPA
- **Rate Limiting**: Can be configured with Spring Security

## 📝 Contributing

1. Follow Java naming conventions
2. Add proper JavaDoc comments
3. Include unit tests for new features
4. Update API documentation
5. Follow the existing code structure

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Email: support@topplayersofallsports.com
- Documentation: [API Docs](http://localhost:8080/swagger-ui.html)
- Issues: [GitHub Issues](link-to-github-issues)
