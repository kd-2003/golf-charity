const mongoose = require("mongoose");

const charitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: String,
    featured: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    upcomingEvents: { type: [String], default: [] },
    totalContributions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Charity", charitySchema);
