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
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const admin = await Admin.findOne({
      username: username.toLowerCase().trim(),
    });
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

router.put("/change-password", protectAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const valid = await admin.comparePassword(currentPassword);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    admin.password = newPassword;

    await admin.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});
// PUT /api/auth/profile
router.put("/profile", protectAdmin, async (req, res) => {
  try {
    const { name, username } = req.body;

    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // check username already exists
    if (username && username.toLowerCase().trim() !== admin.username) {
      const exists = await Admin.findOne({
        username: username.toLowerCase().trim(),
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }

      admin.username = username.toLowerCase().trim();
    }

    admin.name = name;

    await admin.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      admin: {
        name: admin.name,
        username: admin.username,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// @route   GET /api/auth/me
// @desc    Get currently logged in admin (used to verify token on app load)
// @access  Private
router.get("/me", protectAdmin, async (req, res) => {
  res.json({ admin: req.admin });
});

module.exports = router;
