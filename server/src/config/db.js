const mongoose = require("mongoose");

async function connectDb() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/golf-charity";
  await mongoose.connect(uri);
  console.log("MongoDB connected");
}

module.exports = { connectDb };
