const Stripe = require("stripe");
const User = require("../models/User");

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

function getPriceId(plan) {
  if (plan === "yearly") return process.env.STRIPE_YEARLY_PRICE_ID;
  return process.env.STRIPE_MONTHLY_PRICE_ID;
}

async function createCheckoutSession(req, res) {
  const stripe = getStripe();
  if (!stripe) return res.status(400).json({ message: "Stripe secret key is not configured" });

  const { plan = "monthly" } = req.body;
  const priceId = getPriceId(plan);
  if (!priceId) {
    return res.status(400).json({ message: "Stripe price ID not configured for selected plan" });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: req.user.email,
    metadata: {
      userId: String(req.user._id),
      plan,
    },
    success_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard?checkout=success`,
    cancel_url: `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard?checkout=cancel`,
  });

  return res.json({ url: session.url });
}

async function createPortalSession(req, res) {
  const stripe = getStripe();
  if (!stripe) return res.status(400).json({ message: "Stripe secret key is not configured" });

  const user = await User.findById(req.user._id);
  if (!user?.stripeCustomerId) {
    return res.status(400).json({
      message: "No billing account yet. Complete a subscription checkout first.",
    });
  }

  const returnUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/dashboard`;
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  });

  return res.json({ url: session.url });
}

async function stripeWebhook(req, res) {
  const stripe = getStripe();
  if (!stripe) return res.status(400).send("Stripe secret key missing");

  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(400).send("Webhook secret missing");

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    if (userId) {
      const plan = session.metadata?.plan || "monthly";
      const renewalDate = new Date();
      renewalDate.setMonth(renewalDate.getMonth() + (plan === "yearly" ? 12 : 1));
      await User.findByIdAndUpdate(userId, {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        renewalDate,
        stripeCustomerId: session.customer || null,
        stripeSubscriptionId: session.subscription || null,
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    await User.findOneAndUpdate(
      { stripeSubscriptionId: sub.id },
      { subscriptionStatus: "cancelled" }
    );
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object;
    const statusMap = {
      active: "active",
      canceled: "cancelled",
      unpaid: "lapsed",
      past_due: "lapsed",
      incomplete: "inactive",
      incomplete_expired: "inactive",
      trialing: "active",
      paused: "inactive",
    };
    const next = statusMap[sub.status] || "inactive";
    await User.findOneAndUpdate(
      { stripeSubscriptionId: sub.id },
      { subscriptionStatus: next }
    );
  }

  return res.json({ received: true });
}

module.exports = { createCheckoutSession, createPortalSession, stripeWebhook };
