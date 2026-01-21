# Milano's Pizza - Architecture Documentation

## Overview

Milano's Pizza is a full-stack restaurant ordering platform built with modern technologies and best practices.

## System Architecture

### High-Level Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  Database   │
│  (Next.js)  │     │  (Fastify)  │     │ (Postgres)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Cloudflare │     │   Shift4    │     │    Redis    │
│   CDN/DNS   │     │   Payment   │     │    Cache    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  POS System │
                    │   (Mock)    │
                    └─────────────┘
```

## Technology Stack

### Frontend (apps/web)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **API Client**: Fetch with custom wrapper
- **Hosting**: AWS Amplify

### Backend (apps/api)
- **Framework**: Fastify
- **Language**: TypeScript
- **Database ORM**: Prisma
- **Authentication**: Magic link + session cookies
- **Hosting**: Sevalla

### Database
- **Primary Database**: PostgreSQL
- **Cache/Sessions**: Redis
- **ORM**: Prisma

### External Services
- **Payment Processing**: Shift4 (i4Go + REST API)
- **Email**: AWS SES
- **CDN/DNS**: Cloudflare
- **POS Integration**: Provider interface with mock implementation

## Monorepo Structure

```
web-app/
├── apps/
│   ├── api/          # Backend API (Fastify)
│   └── web/          # Frontend (Next.js)
├── packages/
│   └── shared/       # Shared types, schemas, utils
├── docs/             # Documentation
└── .github/          # CI/CD workflows
```

## Key Features

### 1. Authentication
- Magic link authentication (passwordless)
- Session-based auth with httpOnly cookies
- 30-day session expiry
- Automatic session refresh

### 2. Menu Management
- Hierarchical menu structure (menus → categories → items)
- Modifier groups and modifiers
- Real-time availability tracking (86'ing)
- POS synchronization

### 3. Order Management
- Complete order lifecycle tracking
- Multiple order types (delivery, pickup, dine-in)
- Order scheduling
- Real-time status updates
- POS integration for kitchen display

### 4. Payment Processing
- Shift4 i4Go iframe for PCI compliance
- No CHD (cardholder data) storage
- Sale, refund, and void operations
- Transaction logging with redaction
- Invoice number generation

### 5. Loyalty System
- Points-based rewards (10 points per dollar)
- Four-tier system (Bronze, Silver, Gold, Platinum)
- Stamp cards for frequent purchases
- Referral program
- Birthday rewards
- Point expiration (365 days)

### 6. Delivery Management
- ZIP code-based delivery zones
- Dynamic delivery fees
- Minimum order requirements
- Time slot capacity management
- Estimated delivery times

### 7. POS Integration
- Provider interface pattern
- Mock implementation for development
- Full menu synchronization
- Incremental updates
- Order injection
- Status reconciliation

## Data Flow

### Order Creation Flow

```
1. User selects items + modifiers
2. Cart calculates subtotal + modifiers
3. User proceeds to checkout
4. System calculates tax + delivery fee
5. Shift4 i4Go iframe tokenizes card
6. Backend processes payment via Shift4 REST
7. Order created with "pending" status
8. Order sent to POS system
9. Confirmation email sent
10. Order status updated to "confirmed"
11. Loyalty points awarded on completion
```

### Authentication Flow

```
1. User enters email
2. Magic link generated and emailed
3. User clicks link (valid 15 minutes)
4. Session created (30 days)
5. Session cookie set (httpOnly, secure)
6. User authenticated for all requests
```

## Security Considerations

### PCI Compliance
- No storage of cardholder data (CHD)
- i4Go iframe for tokenization
- All card data handled by Shift4
- Transaction logs redacted

### Authentication
- httpOnly session cookies
- CSRF protection
- Rate limiting
- Secure password-less auth

### Data Protection
- Environment-based secrets
- Sensitive data redaction in logs
- SQL injection prevention (Prisma)
- XSS prevention (React escaping)

## Deployment Architecture

### Production Setup

```
┌─────────────────┐
│   Cloudflare    │
│    CDN/DNS      │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Router  │
    └─┬─────┬──┘
      │     │
┌─────▼─┐ ┌─▼──────┐
│ Amplify│ │ Sevalla│
│  (Web) │ │  (API) │
└────────┘ └────┬───┘
                │
         ┌──────▼──────┐
         │  Managed    │
         │  Postgres   │
         │  + Redis    │
         └─────────────┘
```

### Environment Variables

See `.env.example` files in:
- `/apps/api/.env.example`
- `/apps/web/.env.example`

## Performance Optimizations

1. **Database**
   - Indexed queries
   - Connection pooling
   - Redis caching for sessions

2. **Frontend**
   - Next.js static generation
   - Image optimization
   - Code splitting
   - CDN delivery

3. **API**
   - Response compression
   - Rate limiting
   - Efficient database queries

## Monitoring & Logging

- Structured logging with Pino
- Error tracking
- Performance monitoring
- Transaction logging
- Audit trails

## Future Enhancements

1. Real POS integrations (Toast, Square, etc.)
2. Mobile apps (React Native)
3. Advanced analytics dashboard
4. Push notifications
5. Inventory management
6. Employee scheduling
7. Multi-location management
8. A/B testing framework
