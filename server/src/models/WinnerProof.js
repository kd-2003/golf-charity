const mongoose = require("mongoose");

const winnerProofSchema = new mongoose.Schema(
  {
    draw: { type: mongoose.Schema.Types.ObjectId, ref: "Draw", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: String,
    proofImageUrl: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminComment: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("WinnerProof", winnerProofSchema);
