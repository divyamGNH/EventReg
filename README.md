# Golf Internship Project

A full-stack golf app built during training.

This project includes:
- user registration and login
- role-based access (user/admin)
- Stripe subscription checkout
- score submission and tracking (latest 5 scores)
- admin-triggered weighted lottery draw

## Tech Stack

Frontend:
- React (Vite)
- React Router
- Axios
- TanStack Query
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
3. User can subscribe using Stripe Checkout.
4. Stripe webhook updates subscription status in MongoDB.
5. User submits golf scores.
6. System stores only the latest 5 scores per user.
7. Admin can run a weighted lottery from submitted scores.

## API Overview

Auth routes:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/check`
- `GET /api/auth/dashboard`
- `GET /api/auth/admin`

Payment routes:
- `POST /api/payments/create-checkout-session`

Webhook route:
- `POST /api/webhook`

Lottery routes:
- `GET /api/lottery/scores`
- `POST /api/lottery/submit-score`
- `POST /api/lottery/draw-weighted`

## Environment Variables

Create `backend/.env` with values like:

```env
PORT=3000
MONGO_URL=mongodb://127.0.0.1:27017/golf
JWT_SECRET_KEY=your_jwt_secret
STRIPE_PUBLISHABLE_KEY=your_publishable_key
STRIPE_SECRET_KEY=your_secret_key
SUCCESS_URL=http://localhost:5173/home
PRICE_ID=your_price_id
STRIPE_WEBHOOK_SECRET=your_webhook_secret
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
- Lottery draw is weighted using score frequency logic in the backend.
- Stripe webhook endpoint must be reachable by Stripe (use Stripe CLI in local development).
