const mongoose = require("mongoose");
const Charity = require("../models/Charity");

async function listCharities(req, res) {
  const q = req.query.q || "";
  const tag = req.query.tag;
  const filter = {
    name: { $regex: q, $options: "i" },
    ...(tag ? { tags: tag } : {}),
  };
  const charities = await Charity.find(filter).sort({ featured: -1, createdAt: -1 });
  res.json(charities);
}

async function getCharity(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(404).json({ message: "Charity not found" });
  }
  const charity = await Charity.findById(req.params.id);
  if (!charity) return res.status(404).json({ message: "Charity not found" });
  res.json(charity);
}

async function createCharity(req, res) {
  const charity = await Charity.create(req.body);
  res.status(201).json(charity);
}

async function updateCharity(req, res) {
  const charity = await Charity.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!charity) return res.status(404).json({ message: "Charity not found" });
  res.json(charity);
}

async function deleteCharity(req, res) {
  await Charity.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}

module.exports = { listCharities, getCharity, createCharity, updateCharity, deleteCharity };
