import stripe from "../config/stripe.js";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import Payment from "../models/Payment.js";

const resolveBaseUrl = () =>
  process.env.FRONTEND_URL || "http://localhost:5173";
const normalizeTier = (value) =>
  String(value || "standard").toLowerCase() === "vip" ? "vip" : "standard";
const tierMultiplier = (tier) => (tier === "vip" ? 2 : 1);

const finalizeSuccessfulSession = async (session) => {
  const metadata = session.metadata || {};
  const paymentRecordId = metadata.paymentRecordId;
  const registrationId = metadata.registrationId;
  const eventId = metadata.eventId;
  const userId = metadata.userId;

  if (!registrationId || !eventId || !userId) {
    return { updated: false };
  }

  if (
    !mongoose.Types.ObjectId.isValid(registrationId) ||
    !mongoose.Types.ObjectId.isValid(eventId) ||
    !mongoose.Types.ObjectId.isValid(userId)
  ) {
    return { updated: false };
  }

  const registration = await EventRegistration.findById(registrationId);
  if (!registration) {
    return { updated: false };
  }

  let payment = null;

  if (paymentRecordId && mongoose.Types.ObjectId.isValid(paymentRecordId)) {
    payment = await Payment.findById(paymentRecordId);
  }

  if (!payment && session.id) {
    payment = await Payment.findOne({ stripeCheckoutSessionId: session.id });
  }

  if (!payment) {
    payment = await Payment.create({
      userId,
      eventId,
      registrationId,
      amountInCents: session.amount_total || 0,
      currency: session.currency || "inr",
      status: "pending",
    });
  }

  payment.status = "paid";
  payment.stripeCheckoutSessionId = session.id;
  payment.stripePaymentIntentId =
    session.payment_intent || payment.stripePaymentIntentId;
  payment.stripeCustomerId = session.customer || payment.stripeCustomerId;
  await payment.save();

  const wasAlreadyRegistered = registration.status === "registered";
  registration.status = "registered";
  registration.paidAt = registration.paidAt || new Date();
  registration.paymentId = payment._id;
  await registration.save();

  if (!wasAlreadyRegistered) {
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: "active",
        $expr: {
          $lt: ["$seatsBooked", "$capacity"],
        },
      },
      { $inc: { seatsBooked: 1 } },
      { new: true },
    );

    if (!updatedEvent) {
      registration.status = "pending_payment";
      await registration.save();
    }
  }

  return { updated: true, registrationStatus: registration.status };
};

export const createCheckoutSession = async (req, res) => {
  const { eventId } = req.params;
  const ticketTier = normalizeTier(req.body?.ticketTier);

  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return res.status(400).json({ error: "Invalid event ID." });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res
        .status(500)
        .json({ error: "Missing Stripe secret key configuration." });
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

    let registration = await EventRegistration.findOne({
      userId: req.user.userId,
      eventId,
    });

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

    let paymentRecord = await Payment.findOne({
      registrationId: registration._id,
    });

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
        amountInCents: Math.round(
          eventItem.priceInCents * tierMultiplier(ticketTier),
        ),
        currency: eventItem.currency,
        status: "pending",
      });
    }

    paymentRecord.amountInCents = Math.round(
      eventItem.priceInCents * tierMultiplier(ticketTier),
    );
    paymentRecord.currency = eventItem.currency;
    await paymentRecord.save();

    const baseUrl = resolveBaseUrl();
    const successUrl = `${baseUrl}/dashboard/events?payment=success&eventId=${eventId}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/dashboard/events?payment=cancel&eventId=${eventId}`;

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
        ticketTier,
      },

      line_items: [
        {
          price_data: {
            currency: eventItem.currency,
            product_data: {
              name: `${eventItem.title} (${ticketTier === "vip" ? "VIP" : "Standard"})`,
              description: eventItem.description || "Event registration",
            },
            unit_amount: Math.round(
              eventItem.priceInCents * tierMultiplier(ticketTier),
            ),
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
};

export const getCheckoutStatus = async (req, res) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({ error: "Missing checkout session id." });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res
        .status(500)
        .json({ error: "Missing Stripe secret key configuration." });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ error: "User is not authorized." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session) {
      return res.status(404).json({ error: "Checkout session not found." });
    }

    if (String(session.metadata?.userId || "") !== String(req.user.userId)) {
      return res
        .status(403)
        .json({ error: "Forbidden: session does not belong to this user." });
    }

    if (session.mode !== "payment") {
      return res
        .status(400)
        .json({ error: "Unsupported checkout session mode." });
    }

    if (session.payment_status === "paid") {
      const result = await finalizeSuccessfulSession(session);
      return res.status(200).json({
        paymentStatus: "paid",
        registrationStatus: result.registrationStatus || "registered",
      });
    }

    return res
      .status(200)
      .json({ paymentStatus: session.payment_status || "unpaid" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export default createCheckoutSession;
