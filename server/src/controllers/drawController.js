const Draw = require("../models/Draw");
const User = require("../models/User");
const { randomNumbers, algorithmicNumbers, countMatches } = require("../utils/drawEngine");
const { prevMonthKey, nextMonthKey } = require("../utils/monthKey");
const { sendDrawPublishedEmail } = require("../services/email");

const MONTHLY_FEE = 1000;
const YEARLY_FEE = 10000;

async function listDraws(_req, res) {
  const draws = await Draw.find({ published: true }).sort({ monthKey: -1 }).limit(24);
  res.json(draws);
}

async function simulateDraw(req, res) {
  const { mode = "random" } = req.body;
  const users = await User.find({ subscriptionStatus: "active" });
  const allScores = users.flatMap((u) => u.scores.map((s) => s.value));
  const numbers = mode === "algorithmic" ? algorithmicNumbers(allScores) : randomNumbers();
  res.json({ mode, simulatedNumbers: numbers });
}

async function saveDraft(req, res) {
  const { monthKey, mode = "random" } = req.body;
  if (!monthKey) return res.status(400).json({ message: "monthKey required (YYYY-MM)" });

  const users = await User.find({ subscriptionStatus: "active" });
  const allScores = users.flatMap((u) => u.scores.map((s) => s.value));
  const simulatedNumbers =
    mode === "algorithmic" ? algorithmicNumbers(allScores) : randomNumbers();

  const draw = await Draw.findOneAndUpdate(
    { monthKey },
    {
      monthKey,
      mode,
      simulatedNumbers,
      published: false,
      drawNumbers: [],
      winners: [],
    },
    { upsert: true, new: true }
  );

  res.status(201).json(draw);
}

function poolTotals(activeSubscribers, planCounts) {
  let totalPool = 0;
  totalPool += (planCounts.monthly || 0) * MONTHLY_FEE;
  totalPool += (planCounts.yearly || 0) * YEARLY_FEE;
  return { activeSubscribers, totalPool };
}

async function publishMonthlyDraw(req, res) {
  const { monthKey, mode = "random", drawNumbers: overrideNumbers } = req.body;
  if (!monthKey) return res.status(400).json({ message: "monthKey required (YYYY-MM)" });

  const existingPublished = await Draw.findOne({ monthKey, published: true });
  if (existingPublished) {
    return res.status(400).json({ message: "Draw for this month is already published" });
  }

  let draft = await Draw.findOne({ monthKey });
  const users = await User.find({ subscriptionStatus: "active" });
  const allScores = users.flatMap((u) => u.scores.map((s) => s.value));

  let drawMode = mode;
  let drawNumbers =
    Array.isArray(overrideNumbers) && overrideNumbers.length === 5
      ? [...overrideNumbers].sort((a, b) => a - b)
      : null;

  if (!drawNumbers) {
    if (draft?.simulatedNumbers?.length === 5) {
      drawNumbers = [...draft.simulatedNumbers].sort((a, b) => a - b);
      drawMode = draft.mode || mode;
    } else {
      drawMode = mode;
      drawNumbers =
        drawMode === "algorithmic" ? algorithmicNumbers(allScores) : randomNumbers();
    }
  }

  const prevKey = prevMonthKey(monthKey);
  const prevDraw = prevKey ? await Draw.findOne({ monthKey: prevKey, published: true }) : null;
  const jackpotCarryIn = prevDraw?.tierPools?.rollover5 || 0;

  const activeSubscribers = users.length;
  let monthly = 0;
  let yearly = 0;
  users.forEach((u) => {
    if (u.subscriptionPlan === "yearly") yearly += 1;
    else monthly += 1;
  });
  const { totalPool } = poolTotals(activeSubscribers, { monthly, yearly });

  const pools = {
    match5: totalPool * 0.4 + jackpotCarryIn,
    match4: totalPool * 0.35,
    match3: totalPool * 0.25,
    rollover5: 0,
  };

  const grouped = { 5: [], 4: [], 3: [] };
  users.forEach((u) => {
    const latestValues = u.scores.map((s) => s.value);
    const matches = countMatches(latestValues, drawNumbers);
    if ([3, 4, 5].includes(matches)) grouped[matches].push(u);
  });

  const winners = [];
  [5, 4, 3].forEach((tier) => {
    const list = grouped[tier];
    const key = `match${tier}`;
    if (tier === 5 && list.length === 0) {
      pools.rollover5 = pools.match5;
      pools.match5 = 0;
      return;
    }
    if (list.length) {
      const each = pools[key] / list.length;
      list.forEach((u) =>
        winners.push({ user: u._id, matches: tier, amount: each, paymentStatus: "pending" })
      );
    }
  });

  const draw = await Draw.findOneAndUpdate(
    { monthKey },
    {
      monthKey,
      drawNumbers,
      mode: drawMode,
      simulatedNumbers: draft?.simulatedNumbers?.length ? draft.simulatedNumbers : drawNumbers,
      published: true,
      activeSubscribers,
      prizePoolTotal: totalPool,
      tierPools: pools,
      winners,
      jackpotCarryIn,
    },
    { upsert: true, new: true }
  );

  const eligible = users.filter((u) => u.scores.length >= 5);
  await Promise.all(
    eligible.map((u) => User.findByIdAndUpdate(u._id, { $inc: { drawsEntered: 1 } }))
  );

  await Promise.all(
    winners.map((w) => User.findByIdAndUpdate(w.user, { $inc: { totalWon: w.amount } }))
  );

  await sendDrawPublishedEmail({ monthKey, winnerCount: winners.length });

  res.status(201).json(draw);
}

async function listUpcomingInfo(_req, res) {
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const next = nextMonthKey(monthKey);
  res.json({
    currentMonthKey: monthKey,
    nextDrawMonthKey: next,
    message: "One official draw is published per calendar month.",
  });
}

module.exports = {
  listDraws,
  listUpcomingInfo,
  simulateDraw,
  saveDraft,
  publishMonthlyDraw,
};
