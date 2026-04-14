import mongoose from "mongoose";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import AdminActionLog from "../models/AdminActionLog.js";

export const createEvent = async (req, res) => {
  const { title, description, location, startDate, endDate, capacity, priceInCents, currency } = req.body;

  if (!title || !startDate || !endDate || !capacity) {
    return res.status(400).json({ message: "title, startDate, endDate and capacity are required." });
  }

  if (new Date(startDate) >= new Date(endDate)) {
    return res.status(400).json({ message: "endDate must be after startDate." });
  }

  try {
    const eventItem = await Event.create({
      title,
      description: description || "",
      location: location || "Online",
      startDate,
      endDate,
      capacity,
      priceInCents: Number(priceInCents || 0),
      currency: currency || "inr",
      createdBy: req.user.userId,
    });

    await AdminActionLog.create({
      adminUserId: req.user.userId,
      actionType: "CREATE_EVENT",
      targetType: "Event",
      targetId: eventItem._id,
      metadata: {
        title: eventItem.title,
        priceInCents: eventItem.priceInCents,
      },
    });

    return res.status(201).json({ event: eventItem });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create event.", error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "Invalid event ID." });
  }

  try {
    const eventItem = await Event.findById(eventId);

    if (!eventItem || eventItem.status === "deleted") {
      return res.status(404).json({ message: "Event not found." });
    }

    eventItem.status = "deleted";
    await eventItem.save();

    await AdminActionLog.create({
      adminUserId: req.user.userId,
      actionType: "DELETE_EVENT",
      targetType: "Event",
      targetId: eventItem._id,
      metadata: {
        title: eventItem.title,
      },
    });

    return res.status(200).json({ message: "Event deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete event.", error: error.message });
  }
};

export const listAllEvents = async (_req, res) => {
  try {
    const events = await Event.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ events });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch events.", error: error.message });
  }
};

export const listEventRegistrations = async (req, res) => {
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "Invalid event ID." });
  }

  try {
    const registrations = await EventRegistration.find({ eventId, status: "registered" })
      .select("userId paidAt createdAt")
      .populate({ path: "userId", select: "username email role" })
      .lean();

    await AdminActionLog.create({
      adminUserId: req.user.userId,
      actionType: "VIEW_EVENT_REGISTRATIONS",
      targetType: "EventRegistration",
      targetId: new mongoose.Types.ObjectId(eventId),
      metadata: {
        registrationCount: registrations.length,
      },
    });

    const userIds = registrations
      .filter((entry) => entry.userId)
      .map((entry) => ({
        userId: entry.userId._id,
        username: entry.userId.username,
        email: entry.userId.email,
        paidAt: entry.paidAt,
      }));

    return res.status(200).json({ users: userIds });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch registrations.", error: error.message });
  }
};
