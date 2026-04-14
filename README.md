# Event Registration Platform

A full-stack event registration system with role-based access, Stripe payments, and webhook-driven database updates.

This project includes:
- user registration and login
- admin and user dashboards
- event creation and soft deletion (admin)
- one-time event payment via Stripe Checkout
- webhook-based payment confirmation and registration activation
- user subscription/registration history
- normalized MongoDB schema design for academic DBMS review

## Tech Stack

Frontend:
- React (Vite)
- React Router
- Axios
- Tailwind CSS

Backend:
- Node.js
- Express
- MongoDB + Mongoose
- JWT (cookie-based auth)
- Stripe API + Webhooks

## Project Structure

- `frontend/` -> React app
- `backend/` -> Express API

## Core Flow

1. User registers and logs in.
2. Backend sets an HTTP-only cookie token.
3. Admin creates events with capacity, schedule, and pricing.
4. User starts event registration checkout.
5. Stripe webhook confirms payment and marks registration as `registered`.
6. Users can view their registrations and payments.
7. Admin can view registered user IDs per event.

## Data Model (6 Normalized Schemas)

Collections:
- `users`
- `events`
- `eventregistrations`
- `payments`
- `webhookevents`
- `adminactionlogs`

Design highlights:
- one registration per `(userId, eventId)` pair (unique index)
- one payment record per registration (unique index)
- webhook idempotency via unique Stripe event ID
- references instead of nested payment/event blobs
- audit trail for admin actions

## API Overview

Auth routes:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/check`

Payment routes:
- `POST /api/payments/events/:eventId/checkout`

User event routes:
- `GET /api/events`
- `GET /api/events/:eventId`
- `GET /api/events/my-registrations`
- `GET /api/events/my-payments`

Admin routes:
- `GET /api/admin/events`
- `POST /api/admin/events`
- `DELETE /api/admin/events/:eventId`
- `GET /api/admin/events/:eventId/registrations`

Webhook route:
- `POST /api/webhook`

## Environment Variables

Create `backend/.env` with values like:

```env
PORT=3000
MONGO_URL=mongodb://127.0.0.1:27017/golf
JWT_SECRET_KEY=your_jwt_secret
STRIPE_SECRET_KEY=your_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=http://localhost:5173
```

## Run Locally

Install dependencies:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Start backend:

```bash
cd backend
node server.js
```

Start frontend:

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173` and backend runs on `http://localhost:3000`.

## Notes

- This is a training/internship project focused on full-stack concepts.
- Stripe webhook endpoint must be reachable by Stripe (use Stripe CLI in local development).
- To create an admin account, register normally and update that user's `role` to `admin` in MongoDB.
