# EventReg - Event Registration & Management Platform

A modern, full-stack event registration and management platform built with **React 19**, **Vite**, **Express 5**, **PostgreSQL**, and **Stripe Integration**. `EventReg` enables users to discover events, register for free or paid events via Stripe Checkout, manage registrations, and view payment history. It also provides administrators with powerful tools to create events, set capacity limits, view attendee lists, and monitor audit logs.

---

## ✨ Features

### 👤 User Features
- **User Authentication**: Secure Sign Up & Login powered by JWT tokens stored in HTTP-Only cookies or authorization headers.
- **Event Catalog**: Browse active events filtered by category, date, price, and capacity.
- **Registration System**: Instant registration for free events and Stripe Checkout integration for paid events.
- **My Registrations**: Track active and past event registrations along with status (`registered`, `pending_payment`, `cancelled`).
- **My Payments**: Detailed transaction history displaying payment statuses (`paid`, `pending`, `failed`), transaction IDs, and amount breakdowns.

### 👑 Admin Features
- **Event Creation & Management**: Create events with custom titles, descriptions, location, category, image URL, start/end dates, price (in INR/currency), and capacity limits.
- **Soft Deletion**: Safely soft-delete events (`status = 'deleted'`) while retaining registration history.
- **Attendee Tracking**: View full attendee registration lists per event with payment details and registration timestamps.
- **Audit Logging**: Automatic tracking of administrative actions (`CREATE_EVENT`, `DELETE_EVENT`, `VIEW_EVENT_REGISTRATIONS`) in `admin_action_logs`.

### 💳 Payment & Webhook Architecture
- **Stripe Checkout**: Seamless payment flow for ticket purchases.
- **Stripe Webhooks**: Signature-verified webhook endpoint (`/api/webhook`) handling async payment events (`checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`).
- **Idempotency & Resilience**: Idempotent webhook handling backed by `webhook_events` tracking and payment state transition logging in `payment_logs`.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM v7
- **Data Fetching & State**: TanStack React Query v5 + Axios

### Backend
- **Runtime**: Node.js (ES Modules)
- **Web Framework**: Express v5
- **Database**: PostgreSQL (`pg` connection pool with prepared SQL queries & transaction support)
- **Authentication**: JSON Web Tokens (JWT) + `bcryptjs` + `cookie-parser`
- **Payment Gateway**: Stripe Node SDK

---

## 📁 Repository Structure

```text
EventReg/
├── backend/
│   ├── config/          # System configuration (Stripe SDK setup)
│   ├── controllers/     # Route logic (auth, events, payments, admin, webhook)
│   ├── db/              # PostgreSQL pool client, connector, schema DDL & triggers
│   ├── middlewares/     # Auth verification & admin role-based access control
│   ├── routes/          # Express API route declarations
│   ├── services/        # Payment log & webhook business logic
│   ├── server.js        # Main Express server entrypoint
│   └── package.json     # Backend node dependencies
├── frontend/
│   ├── public/          # Static web assets
│   ├── src/
│   │   ├── components/  # React components & UI views (Dashboard, User & Admin pages)
│   │   ├── App.jsx      # React router configuration & auth state
│   │   ├── main.jsx     # React DOM entry point
│   │   └── index.css    # Tailwind CSS v4 imports
│   ├── index.html       # Single Page Application HTML shell
│   ├── vite.config.js   # Vite builder configuration
│   └── package.json     # Frontend node dependencies
├── package.json         # Root configuration
└── README.md            # Project documentation
```

---

## 🗄️ Database Schema

The PostgreSQL database automatically initializes on startup with tables, triggers, and indices:

- **`users`**: Stores user accounts, hashed credentials, and roles (`user` / `admin`).
- **`events`**: Contains event details, location, schedule, capacity limits, pricing, and active/deleted status.
- **`event_registrations`**: Links users to events with registration status (`pending_payment`, `registered`, `cancelled`).
- **`payments`**: Payment transaction status (`pending`, `paid`, `failed`, `expired`, `refunded`) and Stripe session IDs.
- **`webhook_events`**: Logs incoming Stripe webhooks for idempotent event processing.
- **`payment_logs`**: Complete audit trail of payment status state transitions.
- **`admin_action_logs`**: Logs for administrative creation, deletion, and attendee viewing actions.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+)
- **PostgreSQL** database instance (Local PostgreSQL server or cloud services like Supabase, Neon, Render)
- **Stripe Account** (Optional for testing paid ticket checkout flow)

---

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install backend dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   # Server Port
   PORT=3000

   # PostgreSQL Connection URI (Required)
   DATABASE_URL=postgresql://postgres:password@localhost:5432/eventreg

   # JWT Secret (Required)
   JWT_SECRET_KEY=your_super_secret_jwt_key

   # Allowed CORS Origins
   FRONTEND_URL=http://localhost:5173
   CORS_ORIGIN=http://localhost:5173

   # Stripe Credentials (Optional for local testing)
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Optional Test Admin Seed
   TEST_ADMIN_EMAIL=admin@eventreg.com
   TEST_ADMIN_PASSWORD=admin12345
   TEST_ADMIN_USERNAME=Test Admin
   ```

4. **Start the Backend Server**:
   ```bash
   node server.js
   ```
   *(Or run with `npx nodemon server.js` for hot reloading during development)*

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. **Start Vite Development Server**:
   ```bash
   npm run dev
   ```

5. Open your browser and go to `http://localhost:5173`.

---

## 📡 API Endpoints Overview

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Log in user and set auth cookie | Public |
| `POST` | `/api/auth/logout` | Log out user and clear cookie | Authenticated |
| `GET` | `/api/auth/check` | Verify current session and retrieve user role | Authenticated |
| `POST` | `/api/auth/test-admin/ensure` | Seed test admin account (development helper) | Public |

### User Events (`/api/events`)
| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/api/events` | List all active events | Authenticated |
| `GET` | `/api/events/:eventId` | Get detailed information for a specific event | Authenticated |
| `GET` | `/api/events/my-registrations` | View authenticated user's registrations | Authenticated |
| `GET` | `/api/events/my-payments` | View authenticated user's payment records | Authenticated |

### Payments (`/api/payments`)
| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/api/payments/events/:eventId/checkout` | Create Stripe Checkout session for paid event | Authenticated |
| `GET` | `/api/payments/checkout-status/:sessionId` | Check payment session status | Authenticated |

### Webhook (`/api/webhook`)
| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `POST` | `/api/webhook` | Stripe webhook listener for automated payment fulfillment | Stripe Service |

### Admin (`/api/admin`)
| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| `GET` | `/api/admin/events` | List all events (including soft-deleted events) | Admin Only |
| `POST` | `/api/admin/events` | Create a new event | Admin Only |
| `DELETE` | `/api/admin/events/:eventId` | Soft-delete an event | Admin Only |
| `GET` | `/api/admin/events/:eventId/registrations` | View attendee registrations for an event | Admin Only |

---

## 📄 License
This project is open source and available under the [ISC License](backend/package.json).


