const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const { connectDb } = require("./config/db");
const User = require("./models/User");
const Charity = require("./models/Charity");

dotenv.config();

async function runSeed() {
  await connectDb();

  await Promise.all([User.deleteMany({}), Charity.deleteMany({})]);

  const charities = await Charity.insertMany([
    {
      name: "Fairway Futures Foundation",
      description: "Helps underprivileged junior golfers access coaching and equipment.",
      imageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&q=80",
      featured: true,
      tags: ["youth", "golf"],
      upcomingEvents: ["Junior Golf Day - May 2026"],
    },
    {
      name: "Green Earth Relief",
      description: "Supports tree plantation and eco-restoration projects worldwide.",
      imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80",
      featured: true,
      tags: ["environment"],
      upcomingEvents: ["Community Plantation - June 2026"],
    },
    {
      name: "Health First Trust",
      description: "Funds critical medical support for low-income families.",
      imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
      featured: false,
      tags: ["healthcare"],
      upcomingEvents: ["Charity Golf Drive - July 2026"],
    },
  ]);

  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const userPasswordHash = await bcrypt.hash("User@123", 10);

  await User.insertMany([
    {
      name: "Platform Admin",
      email: "admin@golfcharity.com",
      passwordHash: adminPasswordHash,
      role: "admin",
      subscriptionStatus: "active",
      subscriptionPlan: "yearly",
      renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      charity: charities[0]._id,
      charityPercent: 15,
      scores: [
        { value: 41, date: new Date("2026-03-20") },
        { value: 39, date: new Date("2026-03-15") },
      ],
    },
    {
      name: "Aman Golfer",
      email: "aman@example.com",
      passwordHash: userPasswordHash,
      role: "user",
      subscriptionStatus: "active",
      subscriptionPlan: "monthly",
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      charity: charities[1]._id,
      charityPercent: 12,
      scores: [
        { value: 36, date: new Date("2026-03-28") },
        { value: 34, date: new Date("2026-03-20") },
        { value: 33, date: new Date("2026-03-10") },
      ],
    },
    {
      name: "Riya Player",
      email: "riya@example.com",
      passwordHash: userPasswordHash,
      role: "user",
      subscriptionStatus: "inactive",
      subscriptionPlan: "monthly",
      charity: charities[2]._id,
      charityPercent: 10,
    },
  ]);

  console.log("Seed complete");
  console.log("Admin login: admin@golfcharity.com / Admin@123");
  console.log("User login: aman@example.com / User@123");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Seed failed", err);
  process.exit(1);
});
