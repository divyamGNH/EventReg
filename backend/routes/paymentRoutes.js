import express from "express";
import paymentController from "../controllers/paymentController.js";

const router = express.Router();

router.post("/events/:eventId/checkout", paymentController);

export default router;