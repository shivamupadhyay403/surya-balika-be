const express = require("express");
const router = express.Router();
const Announcement = require("../models/Announcement");
const { protectAdmin } = require("../middleware/auth");

// @route   GET /api/announcements
// @desc    Get active announcements for the public notice strip
// @access  Public
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("text dot createdAt");
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: "Failed to load announcements.", error: err.message });
  }
});

// @route   GET /api/announcements/all
// @desc    Get all announcements, including hidden ones (admin dashboard view)
// @access  Private
router.get("/all", protectAdmin, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: "Failed to load announcements.", error: err.message });
  }
});

// @route   POST /api/announcements
// @desc    Create a new announcement
// @access  Private
router.post("/add", protectAdmin, async (req, res) => {
  try {
    const { text, dot } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Announcement text is required." });
    }

    const announcement = await Announcement.create({
      text: text.trim(),
      dot: dot || "#5f8a5c",
      createdBy: req.admin?._id,
    });

    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: "Failed to create announcement.", error: err.message });
  }
});

// @route   PATCH /api/announcements/:id
// @desc    Update an announcement (e.g. toggle isActive, edit text)
// @access  Private
router.patch("/update/:id", protectAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: "Failed to update announcement.", error: err.message });
  }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete an announcement
// @access  Private
router.delete("/delete/:id", protectAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    res.json({ message: "Announcement deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete announcement.", error: err.message });
  }
});

module.exports = router;