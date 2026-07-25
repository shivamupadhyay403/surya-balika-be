const express = require("express");
const router = express.Router();
const Timetable = require("../models/Timetable");
const { protectAdmin } = require("../middleware/auth");
const { VALID_CLASSES } = require("../config/constants");

// @route   GET /api/timetable/:className
// @desc    Get the timetable for one class
// @access  Public
router.get("/:className", async (req, res) => {
  try {
    const { className } = req.params;
    if (!VALID_CLASSES.includes(className)) {
      return res.status(400).json({ message: "Invalid class." });
    }
    const timetable = await Timetable.findOne({ class: className });
    if (!timetable) {
      return res.status(404).json({ message: "Timetable not published yet for this class." });
    }
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch timetable.", error: err.message });
  }
});

// @route   GET /api/timetable
// @desc    List all published timetables (admin management view)
// @access  Private (admin)
router.get("/", protectAdmin, async (req, res) => {
  try {
    const timetables = await Timetable.find().sort({ class: 1 });
    res.json(timetables);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch timetables.", error: err.message });
  }
});

// @route   PUT /api/timetable/:className
// @desc    Create or replace the timetable for a class (upsert)
// @access  Private (admin)
router.put("/:className", protectAdmin, async (req, res) => {
  try {
    const { className } = req.params;
    if (!VALID_CLASSES.includes(className)) {
      return res.status(400).json({ message: "Invalid class." });
    }
    const { section, days } = req.body;
    if (!Array.isArray(days) || days.length === 0) {
      return res.status(400).json({ message: "Provide at least one day with periods." });
    }

    const timetable = await Timetable.findOneAndUpdate(
      { class: className },
      { class: className, section, days, updatedBy: req.admin._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: "Failed to save timetable.", error: err.message });
  }
});

// @route   DELETE /api/timetable/:className
// @desc    Remove a class's timetable
// @access  Private (admin)
router.delete("/:className", protectAdmin, async (req, res) => {
  try {
    const timetable = await Timetable.findOneAndDelete({ class: req.params.className });
    if (!timetable) return res.status(404).json({ message: "Timetable not found." });
    res.json({ message: "Timetable removed." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete timetable.", error: err.message });
  }
});

module.exports = router;
