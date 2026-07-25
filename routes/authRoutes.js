const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");
const { protectAdmin } = require("../middleware/auth");

// @route   POST /api/auth/login
// @desc    Admin login
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const admin = await Admin.findOne({ username: username.toLowerCase().trim() });
    if (!admin) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    res.json({
      token: generateToken(admin._id),
      admin: { id: admin._id, name: admin.name, username: admin.username },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed.", error: err.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get currently logged in admin (used to verify token on app load)
// @access  Private
router.get("/me", protectAdmin, async (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
