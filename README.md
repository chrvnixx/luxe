# Luxe Backend (E-commerce API)

Production-style Node/Express + MongoDB backend with auth (JWT cookie), catalog, cart, and orders.

## Quick Start

1. Create a `.env` from `.env.example` and set at least `MONGODB_URI` and `JWT_SECRET`.
2. Install deps: `npm install`
3. Run API: `npm run dev` (or `npm start`)

## Frontend (Vite + React)

1. Start backend (repo root): `npm run dev`
2. Start frontend: `cd frontend && npm install && npm run dev`

The frontend dev server proxies `/api/*` to `http://localhost:4000` (see `frontend/vite.config.ts`).

## Admin Bootstrap

Create (or promote) an admin user:

`npm run create-admin -- admin@example.com password123 "Admin" "0000000000"`

## API Routes

- `GET /api/health`
- Auth: `POST /api/auth/signup`, `POST /api/auth/verify-email`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Categories: `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id` (admin)
- Products: `GET /api/products`, `GET /api/products/:id`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` (admin)
- Cart: `GET /api/cart`, `POST /api/cart/items`, `PATCH /api/cart/items/:itemId`, `DELETE /api/cart/items/:itemId`, `DELETE /api/cart`
- Orders: `POST /api/orders`, `GET /api/orders/my`, `GET /api/orders/:id`, `PATCH /api/orders/:id/pay`, `PATCH /api/orders/:id/deliver` (admin)
- Users: `GET /api/users`, `GET /api/users/:id`, `PATCH /api/users/:id` (admin) and `PATCH /api/users/me` (auth)
