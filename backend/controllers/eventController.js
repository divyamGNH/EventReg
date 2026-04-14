import mongoose from "mongoose";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import Payment from "../models/Payment.js";

export const listActiveEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: "active" })
      .select("title description location startDate endDate capacity seatsBooked priceInCents currency")
      .sort({ startDate: 1 })
      .lean();

    const userRegistrations = await EventRegistration.find({
      userId: req.user.userId,
      eventId: { $in: events.map((eventItem) => eventItem._id) },
    })
      .select("eventId status")
      .lean();

    const registrationMap = new Map(
      userRegistrations.map((registration) => [String(registration.eventId), registration.status])
    );

    const data = events.map((eventItem) => ({
      ...eventItem,
      availableSeats: Math.max(eventItem.capacity - eventItem.seatsBooked, 0),
      isRegistered: registrationMap.get(String(eventItem._id)) === "registered",
      registrationStatus: registrationMap.get(String(eventItem._id)) || "not_registered",
    }));

    return res.status(200).json({ events: data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch events.", error: error.message });
  }
};

export const listMyRegistrations = async (req, res) => {
  try {
    const registrations = await EventRegistration.find({ userId: req.user.userId })
      .populate({
        path: "eventId",
        select: "title location startDate endDate priceInCents currency status",
      })
      .populate({
        path: "paymentId",
        select: "status amountInCents currency stripeCheckoutSessionId stripePaymentIntentId updatedAt",
      })
      .sort({ createdAt: -1 })
      .lean();

    const data = registrations
      .filter((entry) => entry.eventId)
      .map((entry) => ({
        registrationId: entry._id,
        status: entry.status,
        paidAt: entry.paidAt,
        event: entry.eventId,
        payment: entry.paymentId || null,
      }));

    return res.status(200).json({ registrations: data });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch registrations.", error: error.message });
  }
};

export const getEventById = async (req, res) => {
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ message: "Invalid event ID." });
  }

  try {
    const eventItem = await Event.findOne({ _id: eventId, status: "active" }).lean();

    if (!eventItem) {
      return res.status(404).json({ message: "Event not found." });
    }

    const registration = await EventRegistration.findOne({ userId: req.user.userId, eventId }).lean();

    return res.status(200).json({
      event: {
        ...eventItem,
        availableSeats: Math.max(eventItem.capacity - eventItem.seatsBooked, 0),
      },
      registrationStatus: registration?.status || "not_registered",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch event.", error: error.message });
  }
};

export const listMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .select("eventId status amountInCents currency stripeCheckoutSessionId stripePaymentIntentId createdAt updatedAt")
      .populate({ path: "eventId", select: "title startDate" })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ payments });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch payments.", error: error.message });
  }
};
