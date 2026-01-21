# Milano's Pizza - API Specification

Base URL: `https://api.milanos.pizza` (Production) | `http://localhost:3001` (Development)

## Authentication

All authenticated endpoints require a session cookie (`session_token`) set via the login flow.

### POST /api/auth/magic-link

Send magic link to email.

**Request:**
```json
{
  "email": "user@example.com",
  "redirectUrl": "https://milanos.pizza/menu" // optional
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Magic link sent to your email"
  }
}
```

### POST /api/auth/verify

Verify magic link and create session.

**Request:**
```json
{
  "token": "magic-link-token"
}
```

**Response:** `200 OK` + Sets `session_token` cookie
```json
{
  "success": true,
  "data": {
    "user": { /* User object */ },
    "session": { /* Session object */ }
  }
}
```

### GET /api/auth/me

Get current user (requires authentication).

**Response:** `200 OK`
```json
{
  "success": true,
  "data": { /* User with addresses and loyalty account */ }
}
```

### POST /api/auth/logout

Logout current session.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

## Menu

### GET /api/menu/locations/:locationId/menus

Get all menus for a location.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "menu-id",
      "name": "Main Menu",
      "categories": [
        {
          "id": "category-id",
          "name": "Pizzas",
          "items": [
            {
              "id": "item-id",
              "name": "Margherita Pizza",
              "price": 12.99,
              "modifierGroups": [ /* Modifier groups */ ]
            }
          ]
        }
      ]
    }
  ]
}
```

### GET /api/menu/items/:itemId

Get menu item details.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "item-id",
    "name": "Margherita Pizza",
    "description": "Fresh mozzarella, basil, tomato sauce",
    "price": 12.99,
    "modifierGroups": [ /* Full modifier groups with modifiers */ ]
  }
}
```

## Orders

### POST /api/orders

Create a new order.

**Request:**
```json
{
  "locationId": "location-id",
  "orderType": "delivery",
  "items": [
    {
      "menuItemId": "item-id",
      "quantity": 1,
      "specialInstructions": "Extra crispy",
      "modifiers": [
        {
          "modifierId": "modifier-id",
          "quantity": 1
        }
      ]
    }
  ],
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "5551234567",
  "deliveryAddress": {
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  },
  "tip": 5.00,
  "specialInstructions": "Ring doorbell"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "order-id",
    "orderNumber": "202401211234",
    "status": "pending",
    "total": 29.99,
    /* ... full order object ... */
  }
}
```

### GET /api/orders/:orderId

Get order details.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "order-id",
    "orderNumber": "202401211234",
    "status": "preparing",
    "items": [ /* Order items with modifiers */ ],
    "payments": [ /* Payment transactions */ ],
    "statusHistory": [ /* Status change history */ ]
  }
}
```

### POST /api/orders/:orderId/payment

Process payment for an order.

**Request:**
```json
{
  "orderId": "order-id",
  "amount": 29.99,
  "i4goToken": "shift4-token-from-iframe"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "paymentTransactionId": "transaction-id",
    "authCode": "AUTH123"
  }
}
```

### POST /api/orders/:orderId/cancel

Cancel an order.

**Request:**
```json
{
  "reason": "Changed mind"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": { /* Updated order object */ }
}
```

### GET /api/orders/user/me

Get current user's orders (requires authentication).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [ /* Array of orders */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* Optional additional details */ }
  }
}
```

### Common Error Codes

- `AUTH_UNAUTHORIZED`: Authentication required or invalid
- `AUTH_TOKEN_EXPIRED`: Session expired
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource not found
- `PAYMENT_FAILED`: Payment processing failed
- `ORDER_ERROR`: Order-related error
- `INTERNAL_SERVER_ERROR`: Server error

### HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

- 100 requests per minute per IP
- Returns `429 Too Many Requests` when exceeded
- Headers include:
  - `X-RateLimit-Limit`: Max requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Webhooks (Future)

Future webhook support for:
- Order status changes
- Payment events
- Loyalty events

## Pagination

Paginated endpoints return:

```json
{
  "success": true,
  "data": [ /* Array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Query parameters:
- `page`: Page number (starts at 1)
- `limit`: Items per page (max: 100)
