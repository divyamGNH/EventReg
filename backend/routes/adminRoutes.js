import express from "express";
import {
  createEvent,
  deleteEvent,
  listAllEvents,
  listEventRegistrations,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/events", listAllEvents);
router.post("/events", createEvent);
router.delete("/events/:eventId", deleteEvent);
router.get("/events/:eventId/registrations", listEventRegistrations);

export default router;
