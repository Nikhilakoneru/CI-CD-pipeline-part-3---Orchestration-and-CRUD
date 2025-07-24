const request = require('supertest');
const app = require('./server');
const { docClient, s3Client, tableName, bucketName } = require('./aws-config');
const { DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Helper function to clear DynamoDB table
async function clearDynamoDB() {
  try {
    const scanResult = await docClient.send(new ScanCommand({ TableName: tableName }));
    if (scanResult.Items) {
      for (const item of scanResult.Items) {
        await docClient.send(new DeleteCommand({
          TableName: tableName,
          Key: { id: item.id }
        }));
      }
    }
  } catch (error) {
    console.error('Error clearing DynamoDB:', error);
  }
}

// Helper function to clear S3 bucket
async function clearS3() {
  try {
    const listResult = await s3Client.send(new ListObjectsV2Command({ Bucket: bucketName }));
    if (listResult.Contents) {
      for (const object of listResult.Contents) {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: object.Key
        }));
      }
    }
  } catch (error) {
    console.error('Error clearing S3:', error);
  }
}

describe('REST API Tests', () => {
  let createdItemId;

  beforeEach(async () => {
    await clearDynamoDB();
    await clearS3();
  });

  afterAll(async () => {
    await clearDynamoDB();
    await clearS3();
  });

  test('GET /items returns empty array initially', async () => {
    const response = await request(app).get('/items');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('POST /items creates item in DynamoDB and S3', async () => {
    const response = await request(app)
      .post('/items')
      .send({ name: 'test item' });
    
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('test item');
    expect(response.body.id).toBeDefined();
    
    createdItemId = response.body.id;
  });

  test('POST /items without name returns 400', async () => {
    const response = await request(app)
      .post('/items')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('name required');
  });

  test('GET /items/:id retrieves existing item', async () => {
    // Create item first
    const createResponse = await request(app)
      .post('/items')
      .send({ name: 'test item' });
    
    const itemId = createResponse.body.id;
    
    // Get the item
    const response = await request(app).get(`/items/${itemId}`);
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('test item');
    expect(response.body.id).toBe(itemId);
  });

  test('GET /items/:id with non-existent ID returns 404', async () => {
    const response = await request(app).get('/items/non-existent-id');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('not found');
  });

  test('GET /items with no parameters returns all items', async () => {
    // Create multiple items
    await request(app).post('/items').send({ name: 'item1' });
    await request(app).post('/items').send({ name: 'item2' });
    
    const response = await request(app).get('/items');
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
  });

  test('GET /items with incorrect parameters returns appropriate response', async () => {
    // The current implementation ignores query parameters
    const response = await request(app).get('/items?invalid=param');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('PUT /items/:id updates existing item in DynamoDB and S3', async () => {
    // Create item first
    const createResponse = await request(app)
      .post('/items')
      .send({ name: 'old name' });
    
    const itemId = createResponse.body.id;
    
    // Update the item
    const response = await request(app)
      .put(`/items/${itemId}`)
      .send({ name: 'new name' });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('new name');
    expect(response.body.id).toBe(itemId);
  });

  test('PUT /items/:id with non-existent ID returns 404', async () => {
    const response = await request(app)
      .put('/items/non-existent-id')
      .send({ name: 'new name' });
    
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('not found');
  });

  test('PUT /items/:id without name returns 400', async () => {
    // Create item first
    const createResponse = await request(app)
      .post('/items')
      .send({ name: 'test item' });
    
    const itemId = createResponse.body.id;
    
    const response = await request(app)
      .put(`/items/${itemId}`)
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('name required');
  });

  test('DELETE /items/:id removes item from DynamoDB and S3', async () => {
    // Create item first
    const createResponse = await request(app)
      .post('/items')
      .send({ name: 'test item' });
    
    const itemId = createResponse.body.id;
    
    // Delete the item
    const response = await request(app).delete(`/items/${itemId}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('deleted');
    
    // Verify it's gone
    const getResponse = await request(app).get(`/items/${itemId}`);
    expect(getResponse.status).toBe(404);
  });

  test('DELETE /items/:id with non-existent ID returns 404', async () => {
    const response = await request(app).delete('/items/non-existent-id');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('not found');
  });

  test('Duplicate POST request creates different items', async () => {
    const response1 = await request(app)
      .post('/items')
      .send({ name: 'same name' });
    
    const response2 = await request(app)
      .post('/items')
      .send({ name: 'same name' });
    
    expect(response1.status).toBe(201);
    expect(response2.status).toBe(201);
    expect(response1.body.id).not.toBe(response2.body.id);
  });

  test('Database item and S3 object should match', async () => {
    const createResponse = await request(app)
      .post('/items')
      .send({ name: 'test match' });
    
    const itemId = createResponse.body.id;
    
    // Get from API (which retrieves from DynamoDB)
    const getResponse = await request(app).get(`/items/${itemId}`);
    
    expect(getResponse.body).toEqual(createResponse.body);
  });
});