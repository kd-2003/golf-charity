const mongoose = require("mongoose");

const scoreSchema = new mongoose.Schema(
  {
    value: { type: Number, min: 1, max: 45, required: true },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    subscriptionPlan: { type: String, enum: ["monthly", "yearly"], default: "monthly" },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "lapsed", "cancelled"],
      default: "inactive",
    },
    renewalDate: Date,
    charity: { type: mongoose.Schema.Types.ObjectId, ref: "Charity" },
    charityPercent: { type: Number, min: 10, max: 100, default: 10 },
    scores: { type: [scoreSchema], default: [] },
    totalWon: { type: Number, default: 0 },
    drawsEntered: { type: Number, default: 0 },
    independentDonationsTotal: { type: Number, default: 0 },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
