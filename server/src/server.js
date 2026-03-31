const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDb } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const charityRoutes = require("./routes/charityRoutes");
const drawRoutes = require("./routes/drawRoutes");
const adminRoutes = require("./routes/adminRoutes");
const billingRoutes = require("./routes/billingRoutes");
const { stripeWebhook } = require("./controllers/billingController");

dotenv.config();
const app = express();

// app.use(cors({ origin: process.env.CLIENT_URL || "https://golf-charity-rho-vert.vercel.app" }));

import cors from "cors";

app.use(cors({
  origin: [
    "http://localhost:5173", 
    "https://golf-charity-rho-vert.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
res.setHeader("Access-Control-Allow-Origin", "*");

app.post("/api/billing/webhook", express.raw({ type: "application/json" }), stripeWebhook);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "golf-charity-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/charities", charityRoutes);
app.use("/api/draws", drawRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/billing", billingRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;

connectDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
