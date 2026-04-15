#!/bin/bash
# Load environment variables from .env file
set -a
source .env
set +a

# Start Highlights Service
./mvnw spring-boot:run
