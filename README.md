# KL-Eats 

Campus food, without the queue. Pre-order, pay, and pick up. Built on Next.js 15 + React 18 with a slick Tailwind/shadcn UI.

## ✨ Highlights
- App Router + server/client components
- Mobile-first UI with bottom navigation
- Categories, search, canteen menus, cart, and orders
- Dark mode (next-themes) and buttery animations (framer-motion)

## � Quickstart
Prereqs: Node 18+, pnpm or npm

Dev on localhost:
- pnpm: install + dev
- npm: install + run dev

Build/start:
- pnpm build → next build
- pnpm start → custom HTTPS server (server.mjs)

Scripts (package.json):
- dev: Next dev server
- build: Next build
- start: node server.mjs (expects Linux certs at /etc/letsencrypt by default)
- lint: next lint

## � Env vars
Create `.env.local` for backend and payments:
- NEXT_PUBLIC_API_URL=http://localhost:3000
- NEXT_PUBLIC_CASHFREE=TRUE | FALSE (optional)
- NEXT_PUBLIC_CASHFREE_MODE=sandbox | production

Server-only (used by `server.mjs`, optional):
- SSL_KEY_PATH, SSL_CERT_PATH (default to Let’s Encrypt paths)
- BACKEND_ORIGIN (for webhook proxy target)
- ENABLE_SERVER_WEBHOOK_PROXY=true to forward `/cashfree/webhook`
- CASHFREE_WEBHOOK_PATH=/cashfree/webhook

## 🗂️ Folders you’ll care about
- app/ — routes (home, canteens, category, orders, payment, etc.)
- components/ — UI and reusable bits (shadcn/ui inside)
- hooks/ — cart, auth, orders, etc.
- lib/ — api client, utils
- services/ — canteen service (API-ready)

## 🧱 Stack
Next.js 15 • React 18 • TypeScript • Tailwind • shadcn/ui (Radix) • framer-motion • lucide-react

Notes:
- Lint/TS errors are ignored during build (see `next.config.mjs`) for DX.
- Image optimization disabled in dev (`images.unoptimized`).

## 💳 Payments (Cashfree, optional)
Enable with `NEXT_PUBLIC_CASHFREE=TRUE`. Backend returns a hosted URL or `payment_session_id`; the app loads the Cashfree SDK and redirects. Webhooks can be proxied by `server.mjs` if enabled.

## � License
Copyright © Equitech Lab Private Limited. All rights reserved.
