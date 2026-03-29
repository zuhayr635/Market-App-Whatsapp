#!/bin/bash

# Test: Create a new product with variations
echo "=== Testing Product Creation with Variations ==="

# 1. Create product
echo "1. Creating product..."
PRODUCT=$(curl -s -X POST http://localhost:3003/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "slug": "test-product-'$(date +%s)'",
    "sku": "TEST-'$(date +%s)'",
    "priceUsd": 100,
    "priceTl": 1000,
    "status": "DRAFT"
  }')

PRODUCT_ID=$(echo $PRODUCT | jq -r '.id' 2>/dev/null)
echo "Product ID: $PRODUCT_ID"

if [ "$PRODUCT_ID" = "null" ] || [ -z "$PRODUCT_ID" ]; then
  echo "ERROR: Failed to create product"
  echo "Response: $PRODUCT"
  exit 1
fi

# 2. Save variations for the product
echo "2. Saving variations..."
VARIATIONS=$(curl -s -X POST http://localhost:3003/api/admin/products/$PRODUCT_ID/variations \
  -H "Content-Type: application/json" \
  -d '{
    "variations": [
      {
        "combination": {"Renk": "Kırmızı"},
        "sku": "RED-001",
        "priceDiff": 50,
        "salePrice": 120,
        "stock": 10,
        "status": true
      },
      {
        "combination": {"Renk": "Mavi"},
        "sku": "BLUE-001",
        "priceDiff": -25,
        "salePrice": 95,
        "stock": 5,
        "status": true
      }
    ]
  }')

echo "Variations Response:"
echo $VARIATIONS | jq '.' 2>/dev/null || echo "Invalid JSON: $VARIATIONS"

# 3. Verify variations were saved
echo "3. Fetching variations..."
FETCH=$(curl -s http://localhost:3003/api/admin/products/$PRODUCT_ID/variations)
echo "Fetched Variations:"
echo $FETCH | jq '.' 2>/dev/null || echo "Invalid JSON: $FETCH"

echo "=== Test Complete ==="
