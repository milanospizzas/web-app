# Milano's Pizza - Web App

> State-of-the-art restaurant e-commerce + online ordering platform for milanos.pizza
> Built for conversion, SEO dominance, and operational excellence.

## 🎯 Mission

Build a "money-making machine" restaurant ordering site that:
- Increases online sales + repeat customers via best-in-class UX
- Ranks #1 locally for pizza + Italian food searches
- Integrates deeply with Shift4 SkyTab POS and Shift4 Payments
- Provides custom-branded ordering (NOT embedded SkyTab)
- Optimized for mobile-first, fast (Core Web Vitals), SEO-dominant

## 🏗️ Architecture

### Monorepo Structure
```
web-app/
├── apps/
│   ├── web/           # Next.js frontend (AWS Amplify)
│   └── api/           # Fastify backend (Sevalla)
├── packages/
│   └── shared/        # Shared types, utilities, validation
├── docs/              # Architecture, API specs, deployment
└── .github/           # CI/CD workflows
```

### Tech Stack

**Frontend (AWS Amplify)**
- Next.js 14+ (App Router)
- React 18+ + TypeScript
- Tailwind CSS + custom design system
- SEO-first: SSR/SSG, structured data, sitemaps

**Backend (Sevalla)**
- Node.js 20+ + TypeScript
- Fastify (chosen for: performance, built-in validation, plugin system)
- PostgreSQL (users, orders, loyalty, content, menu mirror)
- Redis (sessions, rate limiting, caching)

**Payments & POS**
- Shift4 i4Go (iframe tokenization - CHD never touches our servers)
- Shift4 REST API (sale, refund, void, invoice flows)
- SkyTab POS integration (menu sync, order injection, status, 86'ing)

**Email & Marketing**
- AWS SES (transactional emails)
- Klaviyo (Phase 2 - marketing automation + SMS)

**Infrastructure**
- Cloudflare: DNS, SSL, WAF, bot protection, caching, rate limiting
- GitHub Actions: CI/CD, preview builds, security audits

## 🚀 Quick Start

### Prerequisites
```bash
node >= 20.0.0
npm >= 10.0.0
postgresql >= 15
redis >= 7
```

### Local Development

1. **Clone and install**
```bash
git clone https://github.com/milanospizzas/web-app.git
cd web-app
npm install
```

2. **Set up environment variables**
```bash
# Frontend (.env.local in apps/web)
cp apps/web/.env.example apps/web/.env.local

# Backend (.env in apps/api)
cp apps/api/.env.example apps/api/.env
```

3. **Run database migrations**
```bash
cd apps/api
npm run db:migrate
npm run db:seed # Optional: seed test data
```

4. **Start development servers**
```bash
# Terminal 1 - Frontend (http://localhost:3000)
cd apps/web
npm run dev

# Terminal 2 - Backend (http://localhost:4000)
cd apps/api
npm run dev
```

## 📦 Project Structure

### Frontend (`apps/web`)
```
apps/web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (marketing)/     # Marketing pages (Home, About, etc.)
│   │   ├── (ordering)/      # Ordering flow
│   │   ├── (account)/       # User account, loyalty
│   │   └── (admin)/         # Admin panel
│   ├── components/
│   │   ├── ui/              # Design system components
│   │   ├── forms/           # Form components
│   │   ├── layout/          # Layout components
│   │   └── domain/          # Domain-specific components
│   ├── lib/
│   │   ├── api/             # API client
│   │   ├── hooks/           # React hooks
│   │   ├── utils/           # Utilities
│   │   └── schemas/         # Zod validation schemas
│   └── styles/
│       └── globals.css      # Tailwind + custom styles
└── public/
    ├── images/
    └── fonts/
```

### Backend (`apps/api`)
```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/            # Magic link, sessions
│   │   ├── menu/            # Menu sync, items, modifiers
│   │   ├── cart/            # Cart, pricing, validation
│   │   ├── checkout/        # Checkout, i4Go, Shift4 REST
│   │   ├── orders/          # Order management, status
│   │   ├── payments/        # Payment flows, refunds, voids
│   │   ├── loyalty/         # Points, tiers, stamps, referrals
│   │   ├── delivery/        # Zones, fees, capacity
│   │   ├── pos/             # POS provider interface
│   │   ├── email/           # SES templates, sending
│   │   └── admin/           # Admin CRUD operations
│   ├── shared/
│   │   ├── database/        # Prisma client, migrations
│   │   ├── middleware/      # Auth, validation, logging
│   │   └── utils/           # Helpers, logging, errors
│   └── index.ts             # Fastify app entry
└── prisma/
    ├── schema.prisma        # Database schema
    ├── migrations/
    └── seed.ts
```

## 🔐 Security & Compliance

### PCI DSS Compliance
- **CHD never touches our servers** - all card entry via i4Go iframe
- Only tokens and metadata stored
- Access Tokens stored securely per merchant
- Shift4 ClientGUID stable (safe to hardcode in config)
- Transaction logging with full redaction of sensitive fields

### Trust Boundaries
```
Browser ↔ i4Go iframe: CHD flows directly to Shift4
Browser ↔ Backend: only tokens, last4, brand, masked data
Backend ↔ Shift4 REST: Access Token + payment tokens
Database: tokens encrypted at rest, strong access controls
```

### Authentication
- Magic-link email login (passwordless)
- httpOnly, Secure, SameSite=Lax cookies
- CSRF protection on all state-changing endpoints
- Rate limiting on auth endpoints

## 🎨 Design System

### Brand Colors
```css
/* Primary - Milano's Red */
--primary: 220 75% 50%;
--primary-foreground: 0 0% 100%;

/* Secondary - Italian Green */
--secondary: 142 71% 45%;
--secondary-foreground: 0 0% 100%;

/* Accent - Warm Gold */
--accent: 38 92% 50%;
--accent-foreground: 0 0% 0%;
```

### Typography
- Headings: Inter (weights: 700, 800)
- Body: Inter (weights: 400, 500, 600)
- Mono: JetBrains Mono

### Component Library
- Button, Card, Modal, Input, Select, Checkbox, Radio
- Toast notifications, Loading states, Skeleton loaders
- Badge, Tag, Tooltip, Dropdown, Accordion

## 📊 Database Schema

Key tables:
- `locations` - Multi-location support
- `menus`, `menu_categories`, `menu_items`, `modifier_groups`, `modifiers`
- `users`, `auth_magic_links`, `sessions`
- `orders`, `order_items`, `order_item_modifiers`
- `payment_transactions` - PCI-safe transaction log
- `loyalty_accounts`, `loyalty_events`, `referral_invites`
- `delivery_zones`, `delivery_capacity_slots`
- `content_pages`, `blog_posts`
- `audit_logs`, `transaction_logs`

See `docs/database-schema.md` for complete schema.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/magic-link/request` - Request magic link
- `GET /api/auth/magic-link/consume` - Consume magic link
- `POST /api/auth/logout` - Logout

### Menu
- `GET /api/menu` - Get menu (SSR-friendly)
- `GET /api/menu/item/:slug` - Item detail
- `POST /api/admin/menu/sync` - Sync from POS

### Ordering
- `POST /api/cart/price` - Calculate totals
- `POST /api/checkout/init` - Initialize checkout
- `POST /api/checkout/i4go/authorize` - Get i4Go iframe config
- `POST /api/checkout/complete` - Complete payment + inject to POS

### Orders
- `GET /api/orders/:id` - Order details
- `GET /api/orders/:id/status` - Order status (polling)
- `POST /api/admin/orders/:id/refund` - Refund order
- `POST /api/admin/orders/:id/void` - Void order

### Loyalty
- `GET /api/loyalty/account` - Loyalty account
- `POST /api/loyalty/redeem` - Redeem reward
- `POST /api/loyalty/referral/send` - Send referral

See `docs/api-spec.md` for complete API documentation.

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all tests
npm test:watch             # Watch mode
npm test:coverage          # Coverage report
```

### Integration Tests
```bash
npm run test:integration   # Backend API tests
```

### E2E Tests
```bash
npm run test:e2e           # Full ordering flow
```

### Shift4 Certification Tests
- See `docs/shift4-test-script.md` for certification test cases
- Covers: AVS/CVV scenarios, invoice flows, timeout handling

## 🚀 Deployment

### Frontend (AWS Amplify)
```bash
# Amplify auto-deploys on push to main
# Preview builds on PR branches
```

### Backend (Sevalla)
```bash
cd apps/api
npm run build
npm run deploy:staging
npm run deploy:production
```

### Database Migrations
```bash
npm run db:migrate:staging
npm run db:migrate:production
```

## 🔧 Configuration

### Cloudflare Setup
- DNS: `milanos.pizza` → Amplify, `api.milanos.pizza` → Sevalla
- SSL: Full (strict)
- WAF: OWASP core ruleset + custom rules
- Rate limiting: Auth + checkout endpoints
- Caching: Static assets aggressive, API bypass

### Environment Variables

**Frontend**
```bash
NEXT_PUBLIC_API_URL=https://api.milanos.pizza
NEXT_PUBLIC_I4GO_SERVER=https://checkout.shift4test.com
NEXT_PUBLIC_MAPS_API_KEY=
```

**Backend**
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SHIFT4_CLIENT_GUID=
SHIFT4_API_BASE=https://api.shift4test.com
SES_REGION=us-east-1
SES_FROM_EMAIL=orders@milanos.pizza
JWT_SECRET=
```

## 📖 Documentation

- [Architecture Overview](docs/architecture.md)
- [Database Schema](docs/database-schema.md)
- [API Specification](docs/api-spec.md)
- [Shift4 Integration](docs/shift4-integration.md)
- [POS Integration](docs/pos-integration.md)
- [Loyalty System](docs/loyalty-system.md)
- [SEO Strategy](docs/seo-strategy.md)
- [Deployment Guide](docs/deployment.md)
- [Security Checklist](docs/security-checklist.md)

## 🤝 Contributing

### Branch Strategy
- `main` - production
- `develop` - integration branch
- `feature/*` - feature branches
- `fix/*` - bug fix branches

### PR Process
1. Create feature branch from `develop`
2. Make changes, commit using conventional commits
3. Push and create PR using template
4. Wait for CI checks + 1 approval
5. Merge to `develop`, then `develop` → `main` for release

### Conventional Commits
```
feat: add loyalty stamp card feature
fix: resolve cart total calculation
docs: update API spec
chore: upgrade dependencies
test: add checkout integration tests
```

## 📞 Support

- **Tech Lead**: [Your Name]
- **Email**: dev@milanospizzas.com
- **Slack**: #milano-dev

## 📝 License

Proprietary - Milano's Pizza © 2026
