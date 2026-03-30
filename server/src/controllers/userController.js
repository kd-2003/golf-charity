const User = require("../models/User");
const Charity = require("../models/Charity");
const WinnerProof = require("../models/WinnerProof");
const Draw = require("../models/Draw");
const { nextMonthKey } = require("../utils/monthKey");

const MONTHLY_FEE = 1000;
const YEARLY_FEE = 10000;

async function me(req, res) {
  const user = await User.findById(req.user._id).populate("charity");
  res.json(user);
}

async function updateProfile(req, res) {
  const { name, charityId, charityPercent } = req.body;
  if (charityPercent && charityPercent < 10) {
    return res.status(400).json({ message: "Minimum charity contribution is 10%" });
  }
  if (charityId) {
    const exists = await Charity.findById(charityId);
    if (!exists) return res.status(404).json({ message: "Charity not found" });
    req.user.charity = charityId;
  }
  if (name) req.user.name = name;
  if (charityPercent) req.user.charityPercent = charityPercent;
  await req.user.save();
  res.json(req.user);
}

function sortScoresDesc(user) {
  user.scores.sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function addScore(req, res) {
  const { value, date } = req.body;
  if (value < 1 || value > 45) {
    return res.status(400).json({ message: "Score must be between 1 and 45" });
  }
  req.user.scores.push({ value, date });
  sortScoresDesc(req.user);
  req.user.scores = req.user.scores.slice(0, 5);
  await req.user.save();
  res.json(req.user.scores);
}

async function updateScore(req, res) {
  const idx = Number(req.params.index);
  if (Number.isNaN(idx) || idx < 0 || idx > 4) {
    return res.status(400).json({ message: "Invalid score index (0–4, most recent first)" });
  }
  const { value, date } = req.body;
  if (value < 1 || value > 45) {
    return res.status(400).json({ message: "Score must be between 1 and 45" });
  }
  sortScoresDesc(req.user);
  if (!req.user.scores[idx]) {
    return res.status(404).json({ message: "No score at this index" });
  }
  req.user.scores[idx] = { value, date };
  sortScoresDesc(req.user);
  req.user.scores = req.user.scores.slice(0, 5);
  await req.user.save();
  res.json(req.user.scores);
}

async function donation(req, res) {
  const amount = Number(req.body.amount);
  const charityId = req.body.charityId || req.user.charity;
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Positive donation amount required" });
  }
  if (!charityId) {
    return res.status(400).json({ message: "Select a charity for your donation" });
  }
  const charity = await Charity.findById(charityId);
  if (!charity) return res.status(404).json({ message: "Charity not found" });

  charity.totalContributions = (charity.totalContributions || 0) + amount;
  await charity.save();
  req.user.independentDonationsTotal = (req.user.independentDonationsTotal || 0) + amount;
  await req.user.save();
  res.status(201).json({
    message: "Thank you — donation recorded",
    independentDonationsTotal: req.user.independentDonationsTotal,
  });
}

async function myWinnings(req, res) {
  const draws = await Draw.find({
    published: true,
    winners: { $elemMatch: { user: req.user._id } },
  }).select("monthKey winners");

  const rows = [];
  draws.forEach((d) => {
    d.winners
      .filter((w) => String(w.user) === String(req.user._id))
      .forEach((w) => {
        rows.push({
          drawId: d._id,
          monthKey: d.monthKey,
          matches: w.matches,
          amount: w.amount,
          paymentStatus: w.paymentStatus,
        });
      });
  });
  res.json(rows);
}

async function participationSummary(req, res) {
  const user = await User.findById(req.user._id);
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const upcoming = nextMonthKey(currentMonthKey);
  const lastDraw = await Draw.findOne({ published: true }).sort({ monthKey: -1 }).select("monthKey");

  const fee = user.subscriptionPlan === "yearly" ? YEARLY_FEE : MONTHLY_FEE;
  const subscriptionCharityShare = (fee * (user.charityPercent || 10)) / 100;

  res.json({
    drawsEntered: user.drawsEntered || 0,
    currentMonthKey,
    nextDrawMonthKey: upcoming,
    lastPublishedMonthKey: lastDraw?.monthKey || null,
    eligibleForDraw: user.subscriptionStatus === "active" && user.scores.length >= 5,
    scoresCount: user.scores.length,
    subscriptionCharityShareEstimate: Math.round(subscriptionCharityShare * 100) / 100,
    independentDonationsTotal: user.independentDonationsTotal || 0,
  });
}

async function uploadWinnerProof(req, res) {
  const { drawId, note, proofImageUrl } = req.body;
  const draw = await Draw.findById(drawId);
  if (!draw || !draw.published) {
    return res.status(404).json({ message: "Draw not found" });
  }
  const isWinner = draw.winners.some((w) => String(w.user) === String(req.user._id));
  if (!isWinner) {
    return res.status(403).json({ message: "Proof upload is for draw winners only" });
  }

  const proof = await WinnerProof.create({
    draw: drawId,
    user: req.user._id,
    note,
    proofImageUrl,
  });
  res.status(201).json(proof);
}

module.exports = {
  me,
  updateProfile,
  addScore,
  updateScore,
  donation,
  myWinnings,
  participationSummary,
  uploadWinnerProof,
};
