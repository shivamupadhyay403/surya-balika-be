// Run once with: npm run seed:admin
// Reads SEED_ADMIN_* values from .env and creates the first admin account
// (skips if an admin with that username already exists).
require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const username = (process.env.SEED_ADMIN_USERNAME).toLowerCase();
    const existing = await Admin.findOne({ username });
    if (existing) {
      console.log(`Admin "${username}" already exists. Skipping.`);
      process.exit(0);
    }

    const admin = await Admin.create({
      name: process.env.SEED_ADMIN_NAME,
      username,
      password: process.env.SEED_ADMIN_PASSWORD,
    });

    console.log(`Admin created: ${admin.username}`);
    console.log("You can now log in at /admin/login with this username and the password from your .env file.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exit(1);
  }
})();
