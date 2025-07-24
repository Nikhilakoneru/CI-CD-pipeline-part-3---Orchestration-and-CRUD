# REST API with DynamoDB and S3 Integration

Basic CRUD API for items with AWS DynamoDB and S3 storage using LocalStack.

## Features

- Data stored in AWS DynamoDB
- JSON copies stored in S3 bucket
- LocalStack for local AWS development
- Docker Compose orchestration

## Endpoints

- `GET /items` - get all
- `GET /items/:id` - get one  
- `POST /items` - create
- `PUT /items/:id` - update
- `DELETE /items/:id` - delete

## Run it

### Using Docker Compose
```bash
./run-stack.sh
```
This starts LocalStack and the API together.

### Or run locally
```bash
npm install
npm start
```
Note: LocalStack must be running for local development.

### Or with docker:
```bash
./run-api.sh
```

## Run Tests

### With Docker Compose
```bash
./run-tests-ci.sh
```
This starts LocalStack, runs tests, and exits with proper status code.

### Or locally(please run LocalStack)
```bash
npm test
```

## Test endpoints

```bash
# Get all items
curl -s http://localhost:3000/items

# Create an item
curl -s -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name": "test item"}'

# Get specific item
curl -s http://localhost:3000/items/1

# Update item
curl -s -X PUT http://localhost:3000/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "updated test item"}'

# Delete item
curl -s -X DELETE http://localhost:3000/items/1

# Test 404 - getting non existent item
curl -s http://localhost:3000/items/999
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| AWS_ENDPOINT | LocalStack endpoint | http://localhost:4566 |
| AWS_REGION | AWS region | us-east-1 |
| DYNAMODB_TABLE_NAME | DynamoDB table name | items |
| S3_BUCKET_NAME | S3 bucket name | items-bucket |

## Architecture

- **Express.js** - REST API framework
- **DynamoDB** - Primary data storage
- **S3** - JSON object backup storage
- **LocalStack** - Local AWS services emulation
- **Docker Compose** - Container orchestration

## CI/CD

Tests run automatically on:
- Push to main branch
- Pull requests
- Manual workflow dispatch

## Services

- API runs on http://localhost:3000
- LocalStack runs on http://localhost:4566