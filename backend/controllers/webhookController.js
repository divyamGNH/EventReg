import stripe from "../config/stripe.js";
import mongoose from "mongoose";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import Payment from "../models/Payment.js";
import WebhookEvent from "../models/WebhookEvent.js";

export default async function webhookController(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const persistWebhookEvent = async () => {
    try {
      const existing = await WebhookEvent.findOne({ stripeEventId: event.id }).lean();
      if (existing?.processed) {
        return { alreadyProcessed: true };
      }

      if (!existing) {
        await WebhookEvent.create({
          stripeEventId: event.id,
          type: event.type,
          processed: false,
          payload: event,
        });
      }

      return { alreadyProcessed: false };
    } catch (error) {
      if (error?.code === 11000) {
        return { alreadyProcessed: true };
      }
      throw error;
    }
  };

  const markWebhookComplete = async () => {
    await WebhookEvent.updateOne(
      { stripeEventId: event.id },
      {
        $set: {
          processed: true,
          processingError: "",
        },
      }
    );
  };

  const markWebhookFailed = async (message) => {
    await WebhookEvent.updateOne(
      { stripeEventId: event.id },
      {
        $set: {
          processed: false,
          processingError: message || "Unknown webhook error",
        },
      }
    );
  };

  const markPaymentAsCompleted = async (session) => {
    const metadata = session.metadata || {};
    const paymentRecordId = metadata.paymentRecordId;
    const registrationId = metadata.registrationId;
    const eventId = metadata.eventId;
    const userId = metadata.userId;

    if (!registrationId || !eventId || !userId) {
      return;
    }

    if (
      !mongoose.Types.ObjectId.isValid(registrationId) ||
      !mongoose.Types.ObjectId.isValid(eventId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return;
    }

    const registration = await EventRegistration.findById(registrationId);
    if (!registration) {
      return;
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
    payment.stripePaymentIntentId = session.payment_intent || payment.stripePaymentIntentId;
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
        { new: true }
      );

      // If no seat was available at webhook time, keep the registration pending for manual review.
      if (!updatedEvent) {
        registration.status = "pending_payment";
        await registration.save();
      }
    }
  };

  const markPaymentAsExpired = async (session) => {
    const registrationId = session.metadata?.registrationId;
    if (!registrationId || !mongoose.Types.ObjectId.isValid(registrationId)) {
      return;
    }

    const payment = await Payment.findOne({ registrationId });
    if (payment && payment.status !== "paid") {
      payment.status = "expired";
      await payment.save();
    }
  };

  try {
    const persistenceResult = await persistWebhookEvent();
    if (persistenceResult.alreadyProcessed) {
      return res.json({ received: true, duplicate: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.mode === "payment" && session.payment_status === "paid") {
        await markPaymentAsCompleted(session);
      }
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      if (session.mode === "payment") {
        await markPaymentAsExpired(session);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      await Payment.updateOne(
        { stripePaymentIntentId: paymentIntent.id },
        { $set: { status: "failed" } }
      );
    }

    await markWebhookComplete();

    return res.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    await markWebhookFailed(err.message);
    return res.status(500).send("Server error");
  }
}