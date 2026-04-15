#!/bin/bash
# Load environment variables from .env file
set -a
source .env
set +a

# Start News Service
./mvnw spring-boot:run
