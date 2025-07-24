#!/bin/bash

echo "Testing REST API endpoints"

# Test GET all items (should be empty initially)
echo "1. Getting all items:"
curl -s http://localhost:3000/items
echo -e "\n"

# Test POST - create item
echo "2. Creating item:"
curl -s -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" \
  -d '{"name": "test item"}'
echo -e "\n"

# Test GET specific item
echo "3. Getting item with id 1:"
curl -s http://localhost:3000/items/1
echo -e "\n"

# Test PUT - update item
echo "4. Updating item:"
curl -s -X PUT http://localhost:3000/items/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "updated test item"}'
echo -e "\n"

# Test GET all items again
echo "5. Getting all items after update:"
curl -s http://localhost:3000/items
echo -e "\n"

# Test DELETE
echo "6. Deleting item:"
curl -s -X DELETE http://localhost:3000/items/1
echo -e "\n"

# Test GET all items after delete
echo "7. Getting all items after delete:"
curl -s http://localhost:3000/items
echo -e "\n"

# Test 404 cases
echo "8. Testing 404 - getting non existent item:"
curl -s http://localhost:3000/items/999
echo -e "\n"
