const User = require("../models/User");
const Charity = require("../models/Charity");
const Draw = require("../models/Draw");
const WinnerProof = require("../models/WinnerProof");

async function dashboard(req, res) {
  const [users, draws, charities] = await Promise.all([
    User.countDocuments(),
    Draw.find(),
    Charity.find(),
  ]);
  const totalPrizePool = draws.reduce((sum, d) => sum + d.prizePoolTotal, 0);
  const charityTotal = charities.reduce((sum, c) => sum + c.totalContributions, 0);
  const publishedDraws = draws.filter((d) => d.published).length;
  res.json({
    totalUsers: users,
    totalPrizePool,
    charityTotal,
    draws: draws.length,
    publishedDraws,
    draftDraws: draws.length - publishedDraws,
  });
}

async function listUsers(_req, res) {
  const users = await User.find().populate("charity").sort({ createdAt: -1 });
  res.json(users);
}

async function updateUser(req, res) {
  const allowed = [
    "name",
    "email",
    "charity",
    "charityPercent",
    "subscriptionPlan",
    "subscriptionStatus",
    "renewalDate",
  ];
  const patch = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  });
  const user = await User.findByIdAndUpdate(req.params.id, patch, { new: true }).populate("charity");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
}

async function adminSetUserScores(req, res) {
  const { scores } = req.body;
  if (!Array.isArray(scores)) {
    return res.status(400).json({ message: "scores must be an array of { value, date }" });
  }
  const cleaned = scores.slice(0, 5).map((s) => ({
    value: Number(s.value),
    date: new Date(s.date),
  }));
  for (const s of cleaned) {
    if (s.value < 1 || s.value > 45 || Number.isNaN(s.value)) {
      return res.status(400).json({ message: "Each score must be 1–45" });
    }
  }
  cleaned.sort((a, b) => new Date(b.date) - new Date(a.date));
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { scores: cleaned.slice(0, 5) },
    { new: true }
  );
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
}

async function listDrawsAdmin(_req, res) {
  const draws = await Draw.find().sort({ monthKey: -1 }).limit(48);
  res.json(draws);
}

async function markWinnerPayment(req, res) {
  const { userId, paymentStatus = "paid" } = req.body;
  if (!userId) return res.status(400).json({ message: "userId required" });

  const draw = await Draw.findById(req.params.drawId);
  if (!draw) return res.status(404).json({ message: "Draw not found" });

  const idx = draw.winners.findIndex((w) => String(w.user) === String(userId));
  if (idx === -1) return res.status(404).json({ message: "User is not a winner on this draw" });

  draw.winners[idx].paymentStatus = paymentStatus;
  await draw.save();
  res.json(draw);
}

async function updateUserSubscription(req, res) {
  const { active, plan } = req.body;
  const nextStatus = active ? "active" : "inactive";
  const renewalDate = active ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;
  const update = { subscriptionStatus: nextStatus, renewalDate };
  if (plan && ["monthly", "yearly"].includes(plan)) update.subscriptionPlan = plan;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json(user);
}

async function listWinnerProofs(_req, res) {
  const proofs = await WinnerProof.find().populate("user draw").sort({ createdAt: -1 });
  res.json(proofs);
}

async function reviewWinnerProof(req, res) {
  const { status, adminComment } = req.body;
  const proof = await WinnerProof.findByIdAndUpdate(
    req.params.id,
    { status, adminComment },
    { new: true }
  );
  if (!proof) return res.status(404).json({ message: "Proof not found" });
  res.json(proof);
}

module.exports = {
  dashboard,
  listUsers,
  updateUser,
  adminSetUserScores,
  updateUserSubscription,
  listDrawsAdmin,
  markWinnerPayment,
  listWinnerProofs,
  reviewWinnerProof,
};
