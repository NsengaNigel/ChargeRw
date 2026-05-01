# ChargeRW

EV charging web app for Rwanda. Find nearby charging stations, start a session, and pay via MTN Mobile Money or Airtel Money.

## Project structure

```
/ChargeRw
  /web        React + Vite + TypeScript + Tailwind + Leaflet
  /backend    Node.js + Express + PostgreSQL
```

---

## Running locally

### Prerequisites

- Node.js 18+
- PostgreSQL (only needed for the full backend flow; the web app runs with mock data without it)

---

### 1. Web app

```bash
cd web
npm install
npm run dev
```

Opens at **http://localhost:3000**

The app works fully without the backend — it falls back to hardcoded mock station data automatically.

---

### 2. Backend API (optional)

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/chargerw
PORT=4000
```

Then:

```bash
npm install
npm run db:seed   # creates tables and inserts 8 Kigali stations
npm run dev       # starts API at http://localhost:4000
```

The web app proxies `/api` to `http://localhost:4000` in dev mode.

---

## Pages

| URL | Page |
|-----|------|
| `/` | Map — Leaflet/OSM map of Kigali with live station markers |
| `/stations/:id` | Station detail — specs, price, CO₂ impact, directions |
| `/stations/:id/pay` | Payment — MTN / Airtel Mobile Money sandbox flow |
| `/sessions/:id` | Active session — progress, live cost, stop + receipt |

---

## Deployment (Vercel)

The `/web` folder is deployed to Vercel. A `vercel.json` in that folder handles SPA routing:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

To redeploy:

```bash
cd web
npx vercel login   # first time only
npx vercel --prod
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Maps | Leaflet.js + OpenStreetMap (no API key) |
| Routing | React Router v6 |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Payments | MTN MoMo sandbox, Airtel Money sandbox |
