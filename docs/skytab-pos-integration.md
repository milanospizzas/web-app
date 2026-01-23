# SkyTab POS Integration Guide

This document provides comprehensive setup instructions, API documentation, and troubleshooting guidance for the SkyTab POS integration with Milano's Pizza.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Configuration](#configuration)
4. [API Endpoints](#api-endpoints)
5. [Webhook Configuration](#webhook-configuration)
6. [Menu Synchronization](#menu-synchronization)
7. [Order Flow](#order-flow)
8. [Error Handling](#error-handling)
9. [Troubleshooting](#troubleshooting)
10. [Testing](#testing)

## Overview

The SkyTab POS integration enables Milano's Pizza to:
- Sync menu items, categories, and modifiers from SkyTab POS
- Send online orders directly to kitchen display systems
- Receive real-time order status updates via webhooks
- Manage item availability (86'd items) across systems
- Track inventory and stock levels

### Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Web App        │────▶│   API Server     │────▶│   SkyTab POS     │
│   (Next.js)      │     │   (Fastify)      │     │   (Shift4)       │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                         ┌──────────────┐        ┌──────────────┐
                         │  PostgreSQL  │        │   Webhooks   │
                         │  (Database)  │◀───────│   (Events)   │
                         └──────────────┘        └──────────────┘
```

## Prerequisites

1. **SkyTab Account**: Active SkyTab POS account with API access
2. **API Credentials**: API Key and Secret from Shift4 Marketplace
3. **Location GUID**: Your restaurant location identifier in SkyTab
4. **Webhook Endpoint**: Public HTTPS URL for receiving webhooks

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# SkyTab POS Configuration
SKYTAB_API_KEY=your_api_key_here
SKYTAB_API_SECRET=your_api_secret_here
SKYTAB_LOCATION_ID=your_location_guid_here
SKYTAB_WEBHOOK_SECRET=your_webhook_signing_secret
SKYTAB_SYNC_INTERVAL_MINUTES=5

# Shift4 Environment (shared with payments)
SHIFT4_ENVIRONMENT=sandbox  # or 'production'
```

### Database Setup

Run the Prisma migration to create POS-related tables:

```bash
cd apps/api
npx prisma db push
```

This creates the following tables:
- `pos_sync_logs` - Menu sync history
- `pos_webhook_events` - Webhook event tracking
- `pos_failed_requests` - Failed request retry queue

### Location Configuration

Update your location record to use SkyTab:

```sql
UPDATE locations
SET
  pos_system_type = 'skytab',
  pos_location_id = 'your_location_guid_here'
WHERE id = 'your_location_id';
```

## API Endpoints

### Sync Menu

Pulls menu data from SkyTab and updates local database.

```http
POST /api/pos/skytab/sync-menu
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "locationId": "location_id",
  "fullSync": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Menu sync completed successfully",
    "syncLogId": "sync_123",
    "itemCount": 42,
    "modifierCount": 15
  }
}
```

### Send Order to POS

Sends an order to SkyTab kitchen display.

```http
POST /api/pos/skytab/send-order
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "orderId": "order_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Order sent to POS successfully",
    "posOrderId": "ticket_guid",
    "success": true
  }
}
```

### POS Status

Check SkyTab connectivity and recent activity.

```http
GET /api/pos/skytab/status?locationId=location_id
Authorization: Bearer <session_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "connected",
    "provider": "skytab",
    "lastSync": {
      "id": "sync_123",
      "status": "completed",
      "itemsSynced": 42,
      "completedAt": "2024-01-15T17:00:00Z"
    },
    "recentSyncs": [...],
    "pendingRetries": 0,
    "recentWebhooks": [...]
  }
}
```

### Update Item Availability

Mark an item as available or 86'd.

```http
POST /api/pos/skytab/availability
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "itemId": "menu_item_id",
  "isAvailable": false
}
```

### Get Unavailable Items

List all 86'd items at a location.

```http
GET /api/pos/skytab/unavailable?locationId=location_id
Authorization: Bearer <session_token>
```

### Webhook Handler

Receives events from SkyTab POS (no authentication required but signature verified).

```http
POST /api/pos/skytab/webhook
X-SkyTab-Signature: <hmac_signature>
Content-Type: application/json

{
  "eventType": "ticket.status_changed",
  "eventId": "event_guid",
  "timestamp": "2024-01-15T17:00:00Z",
  "locationGuid": "location_guid",
  "data": {
    "ticketGuid": "ticket_guid",
    "externalReference": "order_id",
    "status": "PREPARING"
  },
  "signature": "..."
}
```

### Retry Failed Requests

Manually trigger retry of failed POS requests.

```http
POST /api/pos/skytab/retry-failed
Authorization: Bearer <session_token>
```

### Sync History

Get menu sync history.

```http
GET /api/pos/skytab/sync-history?locationId=location_id&limit=20&offset=0
Authorization: Bearer <session_token>
```

## Webhook Configuration

### Setting Up Webhooks in SkyTab

1. Log into SkyTab Marketplace Portal
2. Navigate to **Integrations** > **Webhooks**
3. Add a new webhook endpoint:
   - **URL**: `https://your-domain.com/api/pos/skytab/webhook`
   - **Events**: Select all relevant events
   - **Secret**: Generate and save for `SKYTAB_WEBHOOK_SECRET`

### Supported Webhook Events

| Event Type | Description |
|------------|-------------|
| `ticket.created` | New order created in POS |
| `ticket.updated` | Order details modified |
| `ticket.status_changed` | Order status updated |
| `ticket.cancelled` | Order cancelled |
| `menu.updated` | Menu items/categories changed |
| `menu.item_availability_changed` | Item 86'd or un-86'd |
| `stock.updated` | Inventory levels changed |
| `location.hours_changed` | Operating hours modified |

### Webhook Signature Verification

All webhooks include an `X-SkyTab-Signature` header. The signature is computed as:

```javascript
const signature = crypto
  .createHmac('sha256', SKYTAB_WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## Menu Synchronization

### Full Sync

Pulls complete menu from SkyTab:

```javascript
// Called via API or scheduler
POST /api/pos/skytab/sync-menu
{
  "locationId": "location_id",
  "fullSync": true
}
```

### Incremental Sync

Pulls only items changed since last sync:

```javascript
POST /api/pos/skytab/sync-menu
{
  "locationId": "location_id",
  "fullSync": false
}
```

### Automatic Sync

Set up a cron job or scheduler to sync menu regularly:

```javascript
// Example: Every 5 minutes
0 */5 * * * * curl -X POST https://api.example.com/api/pos/skytab/sync-menu \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locationId":"location_id","fullSync":false}'
```

### Data Mapping

| SkyTab Field | Local Field |
|--------------|-------------|
| `guid` | `posItemId` |
| `name` | `name` |
| `price` | `price` |
| `categoryGuid` | `category.posCategoryId` |
| `isActive && isAvailable` | `isAvailable` |
| `sku` | `sku` |

## Order Flow

### 1. Order Created

When a customer places an order:

```
Customer → Web App → API → Database (pending)
```

### 2. Payment Processed

After successful payment:

```
API → SkyTab POS (sendOrder)
    ├── Success: Order appears on KDS
    └── Failure: Queued for retry
```

### 3. Order Status Updates

SkyTab sends webhooks as order progresses:

```
SkyTab → Webhook → Database → WebSocket → Customer
         │
         └── PENDING → CONFIRMED → PREPARING → READY → COMPLETED
```

### Order Status Mapping

| SkyTab Status | Local Status |
|--------------|--------------|
| `PENDING` | `pending` |
| `CONFIRMED` | `confirmed` |
| `PREPARING` | `preparing` |
| `READY` | `ready` |
| `OUT_FOR_DELIVERY` | `out-for-delivery` |
| `COMPLETED` | `completed` |
| `CANCELLED` | `cancelled` |

## Error Handling

### Retry Logic

The integration uses exponential backoff for transient failures:

| Retry | Delay |
|-------|-------|
| 1 | 1 second |
| 2 | 2 seconds |
| 3 | 4 seconds |
| 4 | 8 seconds |
| 5 | 16 seconds |
| Max | 30 seconds |

### Failed Request Queue

Failed requests are stored in `pos_failed_requests` table:

```sql
-- View pending retries
SELECT * FROM pos_failed_requests
WHERE status IN ('pending', 'retrying');

-- Manual retry trigger
POST /api/pos/skytab/retry-failed
```

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `AUTHENTICATION_FAILED` | Invalid credentials | Check API key/secret |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `RESOURCE_NOT_FOUND` | Invalid GUID | Verify location/item ID |
| `SERVICE_UNAVAILABLE` | SkyTab down | Auto-retry queued |
| `MENU_SYNC_FAILED` | Sync error | Check logs, retry |
| `ORDER_SUBMIT_FAILED` | Order failed | Check item availability |

## Troubleshooting

### Common Issues

#### 1. Authentication Errors

**Symptom**: `AUTHENTICATION_FAILED` errors

**Check**:
```bash
# Verify environment variables
echo $SKYTAB_API_KEY
echo $SKYTAB_API_SECRET
echo $SHIFT4_ENVIRONMENT
```

**Solution**: Ensure credentials match those in SkyTab Marketplace portal.

#### 2. Menu Sync Failures

**Symptom**: Items not appearing in menu

**Check**:
```sql
-- Check sync status
SELECT * FROM pos_sync_logs
ORDER BY created_at DESC
LIMIT 5;

-- Check for error messages
SELECT error_message, error_details
FROM pos_sync_logs
WHERE status = 'failed';
```

**Solution**: Run full sync and check error logs.

#### 3. Orders Not Reaching POS

**Symptom**: Orders stuck in `pending` status

**Check**:
```sql
-- Check POS sync status
SELECT id, order_number, pos_sync_status, pos_error_message
FROM orders
WHERE pos_sync_status = 'failed';

-- Check failed request queue
SELECT * FROM pos_failed_requests
WHERE request_type = 'order_submit';
```

**Solution**:
1. Verify SkyTab connectivity: `GET /api/pos/skytab/status`
2. Check if items are available in SkyTab
3. Trigger manual retry: `POST /api/pos/skytab/retry-failed`

#### 4. Webhook Events Not Processing

**Symptom**: Order status not updating from POS

**Check**:
```sql
-- Check recent webhook events
SELECT event_type, status, error_message
FROM pos_webhook_events
ORDER BY created_at DESC
LIMIT 10;
```

**Solution**:
1. Verify webhook URL is accessible
2. Check webhook secret matches
3. Review application logs for signature verification failures

#### 5. 86'd Items Still Showing

**Symptom**: Unavailable items appearing in menu

**Check**:
```sql
-- Check item status
SELECT id, name, is_86ed, is_available, pos_item_id
FROM menu_items
WHERE is_86ed = true;
```

**Solution**: Trigger menu sync or manually update availability.

### Viewing Logs

```bash
# API logs
tail -f logs/api.log | grep skytab

# Filter by log level
tail -f logs/api.log | grep -E "error|warn" | grep skytab
```

### Health Check

```bash
# Check POS connectivity
curl -X GET "https://api.example.com/api/pos/skytab/status" \
  -H "Authorization: Bearer $TOKEN"

# Verify menu sync
curl -X POST "https://api.example.com/api/pos/skytab/sync-menu" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"locationId":"your_location_id","fullSync":true}'
```

## Testing

### Unit Tests

```bash
cd apps/api
npm test -- --filter=skytab
```

### Integration Tests

```bash
# Run with sandbox environment
SHIFT4_ENVIRONMENT=sandbox npm test:integration
```

### Mock Provider

For local development without SkyTab, use the mock provider:

```sql
UPDATE locations
SET pos_system_type = 'mock'
WHERE id = 'your_location_id';
```

### Sandbox Environment

Use sandbox credentials for testing:
- Orders won't appear on real POS
- Menu data is simulated
- All API features available

## Support

For SkyTab API issues:
- SkyTab Developer Portal: https://conecto-api.shift4payments.com/docs/
- Shift4 Support: support@shift4.com

For integration issues:
- Check application logs
- Review database records
- Contact development team
