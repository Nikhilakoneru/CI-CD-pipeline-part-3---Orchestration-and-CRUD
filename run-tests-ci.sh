#!/bin/bash
set -e
echo "Running tests..."
docker compose -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from test
docker compose -f docker-compose.test.yml down