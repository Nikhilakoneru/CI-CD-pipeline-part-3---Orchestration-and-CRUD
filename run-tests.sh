#!/bin/bash

echo "Building test Docker image..."
docker build -f Dockerfile.test -t simple-rest-api-tests .

echo "Running tests..."
docker run --rm simple-rest-api-tests

if [ $? -eq 0 ]; then
    echo "All tests passed!"
    exit 0
else
    echo "Tests failed!"
    exit 1
fi