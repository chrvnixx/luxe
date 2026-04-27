# Luxe Storefront (Vite + React)

Frontend for the Luxe e-commerce backend in `backend/`.

## Run

1. Start backend (in repo root): `npm run dev`
2. Start frontend (in this folder): `npm run dev`

Vite proxies `/api/*` to `http://localhost:4000` (see `vite.config.ts`), so cookies and auth work without extra CORS setup.

## Optional Env

If you want to run without the proxy, set `VITE_API_URL` (see `.env.example`).
