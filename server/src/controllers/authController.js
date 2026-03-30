const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Charity = require("../models/Charity");

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
}

async function register(req, res) {
  const { name, email, password, charityId, charityPercent } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  if (charityPercent != null && charityPercent < 10) {
    return res.status(400).json({ message: "Minimum charity contribution is 10%" });
  }
  if (charityId) {
    const ch = await Charity.findById(charityId);
    if (!ch) return res.status(400).json({ message: "Invalid charity" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    ...(charityId && { charity: charityId }),
    ...(charityPercent != null && { charityPercent }),
  });
  const populated = await User.findById(user._id).populate("charity");
  const token = signToken(user._id);
  res.status(201).json({ token, user: populated });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).populate("charity");
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken(user._id);
  res.json({ token, user });
}

module.exports = { register, login };
