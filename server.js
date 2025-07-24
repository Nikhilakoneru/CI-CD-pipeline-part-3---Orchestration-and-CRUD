const express = require('express');
const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { PutCommand, GetCommand, ScanCommand, DeleteCommand} = require('@aws-sdk/lib-dynamodb');
const { CreateBucketCommand, HeadBucketCommand, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { dynamodbClient, docClient, s3Client, tableName, bucketName } = require('./aws-config');

const app = express();
app.use(express.json());

// Initialize AWS resources
async function initializeAWS() {
  try {
    // Create DynamoDB table if it doesn't exist
    try {
      await dynamodbClient.send(new DescribeTableCommand({ TableName: tableName }));
      console.log(`DynamoDB table ${tableName} already exists`);
    } catch (error) {
      if (error.name === 'ResourceNotFoundException') {
        console.log(`Creating DynamoDB table ${tableName}...`);
        await dynamodbClient.send(new CreateTableCommand({
          TableName: tableName,
          KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' }
          ],
          AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' }
          ],
          BillingMode: 'PAY_PER_REQUEST'
        }));
        console.log(`DynamoDB table ${tableName} created`);
      }
    }

    // Create S3 bucket if it doesn't exist
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log(`S3 bucket ${bucketName} already exists`);
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        console.log(`Creating S3 bucket ${bucketName}...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`S3 bucket ${bucketName} created`);
      }
    }
  } catch (error) {
    console.error('Error initializing AWS resources:', error);
  }
}

// GET /items - Get all items
app.get('/items', async (req, res) => {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: tableName
    }));
    
    res.status(200).json(response.Items || []);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /items/:id - Get specific item
app.get('/items/:id', async (req, res) => {
  try {
    const response = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { id: req.params.id }
    }));
    
    if (!response.Item) {
      return res.status(404).json({ error: 'not found' });
    }
    
    res.status(200).json(response.Item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /items - Create new item
app.post('/items', async (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'name required' });
  }
  
  // Generate unique ID
  const id = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
  const item = { id, name };
  
  try {
    // Store in DynamoDB
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: 'attribute_not_exists(id)'
    }));
    
    // Store in S3
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: `items/${id}.json`,
      Body: JSON.stringify(item),
      ContentType: 'application/json'
    }));
    
    res.status(201).json(item);
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      return res.status(409).json({ error: 'Item already exists' });
    }
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /items/:id - Update existing item
app.put('/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'name required' });
  }
  
  try {
    // Check if item exists
    const getResponse = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { id }
    }));
    
    if (!getResponse.Item) {
      return res.status(404).json({ error: 'not found' });
    }
    
    // Update in DynamoDB
    const updatedItem = { id, name };
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: updatedItem
    }));
    
    // Update in S3
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: `items/${id}.json`,
      Body: JSON.stringify(updatedItem),
      ContentType: 'application/json'
    }));
    
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /items/:id - Delete item
app.delete('/items/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if item exists
    const getResponse = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { id }
    }));
    
    if (!getResponse.Item) {
      return res.status(404).json({ error: 'not found' });
    }
    
    // Delete from DynamoDB
    await docClient.send(new DeleteCommand({
      TableName: tableName,
      Key: { id }
    }));
    
    // Delete from S3
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: `items/${id}.json`
    }));
    
    res.status(200).json({ message: 'deleted' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  initializeAWS().then(() => {
    app.listen(PORT, () => {
      console.log('Server running on port ' + PORT);
    });
  });
}

module.exports = app;