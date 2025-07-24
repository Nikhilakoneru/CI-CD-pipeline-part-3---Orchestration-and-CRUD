const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');

// Get configuration from environment variables
const endpoint = process.env.AWS_ENDPOINT || 'http://localhost:4566';
const region = process.env.AWS_REGION || 'us-east-1';

// Create DynamoDB client
const dynamodbClient = new DynamoDBClient({
  endpoint,
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
  }
});

// Create DocumentClient for easier JSON handling
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

// Create S3 client
const s3Client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true, // Required for LocalStack
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
  }
});

// Export configuration
module.exports = {
  dynamodbClient,
  docClient,
  s3Client,
  tableName: process.env.DYNAMODB_TABLE_NAME || 'items',
  bucketName: process.env.S3_BUCKET_NAME || 'items-bucket'
};