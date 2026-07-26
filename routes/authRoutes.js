const express = require("express");
const router = express.Router();

const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");
const { protectAdmin } = require("../middleware/auth");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required.",
      });
    }

    const admin = await Admin.findOne({
      username: username.toLowerCase().trim(),
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    const valid = await admin.comparePassword(password);

    if (!valid) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    res.json({
      token: generateToken(admin._id),
      admin: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.get("/me", protectAdmin, (req, res) => {
  res.json({
    admin: req.admin,
  });
});

router.put("/profile", protectAdmin, async (req, res) => {
  try {
    const { name, username } = req.body;

    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (
      username &&
      username.trim().toLowerCase() !== admin.username
    ) {
      const exists = await Admin.findOne({
        username: username.trim().toLowerCase(),
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Username already exists.",
        });
      }

      admin.username = username.trim().toLowerCase();
    }

    admin.name = name.trim();

    await admin.save();

    res.json({
      success: true,
      message: "Profile updated successfully.",
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

router.put("/change-password", protectAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.admin._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    const valid = await admin.comparePassword(currentPassword);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    admin.password = newPassword;

    await admin.save();

    res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;