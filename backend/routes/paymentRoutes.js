import express from "express";
import {
  createCheckoutSession,
  getCheckoutStatus,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/events/:eventId/checkout", createCheckoutSession);
router.get("/checkout-status/:sessionId", getCheckoutStatus);

export default router;
