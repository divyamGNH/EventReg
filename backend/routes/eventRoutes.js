import express from "express";
import {
  getEventById,
  listActiveEvents,
  listMyPayments,
  listMyRegistrations,
} from "../controllers/eventController.js";

const router = express.Router();

router.get("/", listActiveEvents);
router.get("/my-registrations", listMyRegistrations);
router.get("/my-payments", listMyPayments);
router.get("/:eventId", getEventById);

export default router;
