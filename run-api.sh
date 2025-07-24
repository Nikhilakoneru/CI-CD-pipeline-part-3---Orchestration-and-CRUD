#!/bin/bash

echo "Building API Docker image..."
docker build -t simple-rest-api .

echo "Running API container..."
docker run -p 3000:3000 simple-rest-api