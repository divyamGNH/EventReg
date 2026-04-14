import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

import connectDB from "./db/db.js";
import authRoutes from "./routes/userRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

import authMiddleware from "./middlewares/authMiddleware.js";
import { requireAdmin } from "./middlewares/roleMiddleware.js";

dotenv.config();
connectDB();

const PORT = process.env.PORT || 3000;

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  webhookRoutes,
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

app.use("/api/auth", authRoutes);
app.use("/api/events", authMiddleware, eventRoutes);
app.use("/api/payments", authMiddleware, paymentRoutes);
app.use("/api/admin", authMiddleware, requireAdmin, adminRoutes);
// app.use("/",isAuthorized,);

app.listen(PORT, () => {
  console.log(`Server listening on PORT:${PORT}`);
});
