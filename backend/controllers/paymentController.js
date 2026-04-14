import stripe from "../config/stripe.js";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import Payment from "../models/Payment.js";

const resolveBaseUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

export default async function paymentController(req, res) {
  const { eventId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID." });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ error: "Missing Stripe secret key configuration." });
    }

    if (!req.user?.userId || !req.user?.email) {
      return res.status(401).json({ error: "User is not authorized." });
    }

    const eventItem = await Event.findOne({ _id: eventId, status: "active" });
    if (!eventItem) {
      return res.status(404).json({ error: "Event not found." });
    }

    if (eventItem.seatsBooked >= eventItem.capacity) {
      return res.status(400).json({ error: "Event is sold out." });
    }

    let registration = await EventRegistration.findOne({ userId: req.user.userId, eventId });

    if (registration?.status === "registered") {
      return res.status(200).json({
        alreadyRegistered: true,
        message: "You are already registered for this event.",
      });
    }

    if (!registration) {
      registration = await EventRegistration.create({
        userId: req.user.userId,
        eventId,
        status: "pending_payment",
      });
    }

    let paymentRecord = await Payment.findOne({ registrationId: registration._id });

    if (paymentRecord?.status === "paid") {
      registration.status = "registered";
      registration.paidAt = registration.paidAt || new Date();
      registration.paymentId = paymentRecord._id;
      await registration.save();

      return res.status(200).json({
        alreadyRegistered: true,
        message: "Payment already completed for this event.",
      });
    }

    if (!paymentRecord) {
      paymentRecord = await Payment.create({
        userId: req.user.userId,
        eventId,
        registrationId: registration._id,
        amountInCents: eventItem.priceInCents,
        currency: eventItem.currency,
        status: "pending",
      });
    }

    const baseUrl = resolveBaseUrl();
    const successUrl = `${baseUrl}/home?payment=success&eventId=${eventId}`;
    const cancelUrl = `${baseUrl}/home?payment=cancel&eventId=${eventId}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: req.user.email,
      client_reference_id: req.user.userId,
      metadata: {
        userId: req.user.userId,
        userEmail: req.user.email,
        eventId,
        registrationId: String(registration._id),
        paymentRecordId: String(paymentRecord._id),
      },

      line_items: [
        {
          price_data: {
            currency: eventItem.currency,
            product_data: {
              name: eventItem.title,
              description: eventItem.description || "Event registration",
            },
            unit_amount: eventItem.priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    paymentRecord.stripeCheckoutSessionId = session.id;
    paymentRecord.status = "pending";
    await paymentRecord.save();

    return res.status(200).json({ url: session.url, alreadyRegistered: false });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
