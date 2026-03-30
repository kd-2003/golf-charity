const mongoose = require("mongoose");

const winnerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    matches: { type: Number, enum: [3, 4, 5], required: true },
    amount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
  },
  { _id: false }
);

const drawSchema = new mongoose.Schema(
  {
    monthKey: { type: String, required: true, unique: true },
    drawNumbers: { type: [Number], default: [] },
    mode: { type: String, enum: ["random", "algorithmic"], default: "random" },
    simulatedNumbers: { type: [Number], default: [] },
    published: { type: Boolean, default: false },
    activeSubscribers: { type: Number, default: 0 },
    prizePoolTotal: { type: Number, default: 0 },
    tierPools: {
      match5: { type: Number, default: 0 },
      match4: { type: Number, default: 0 },
      match3: { type: Number, default: 0 },
      rollover5: { type: Number, default: 0 },
    },
    winners: { type: [winnerSchema], default: [] },
    jackpotCarryIn: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Draw", drawSchema);
