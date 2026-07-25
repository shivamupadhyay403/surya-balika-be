const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const { protectAdmin } = require("../middleware/auth");
const { VALID_CLASSES } = require("../config/constants");

// @route   GET /api/students?class=8&search=meera
// @desc    List/search students (used by admin panel and public search-assist)
// @access  Public read (no marks or personal contact info is exposed, just name/roll/class)
router.get("/", async (req, res) => {
  try {
    const { class: className, search } = req.query;
    const filter = {};
    if (className) {
      if (!VALID_CLASSES.includes(className)) {
        return res.status(400).json({ message: "Invalid class." });
      }
      filter.class = className;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { rollNumber: { $regex: search, $options: "i" } },
      ];
    }
    const students = await Student.find(filter).sort({ class: 1, rollNumber: 1 }).limit(200);
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students.", error: err.message });
  }
});

// @route   POST /api/students
// @desc    Add a student
// @access  Private (admin)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { name, rollNumber, class: className, section, fatherName } = req.body;
    if (!name || !rollNumber || !className) {
      return res.status(400).json({ message: "Name, roll number, and class are required." });
    }
    if (!VALID_CLASSES.includes(className)) {
      return res.status(400).json({ message: "Invalid class." });
    }
    const student = await Student.create({ name, rollNumber, class: className, section, fatherName });
    res.status(201).json(student);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "A student with this roll number already exists in this class." });
    }
    res.status(500).json({ message: "Failed to add student.", error: err.message });
  }
});

// @route   PUT /api/students/:id
// @desc    Update a student
// @access  Private (admin)
router.put("/:id", protectAdmin, async (req, res) => {
  try {
    const { name, rollNumber, class: className, section, fatherName } = req.body;
    if (className && !VALID_CLASSES.includes(className)) {
      return res.status(400).json({ message: "Invalid class." });
    }
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { name, rollNumber, class: className, section, fatherName },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ message: "Student not found." });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: "Failed to update student.", error: err.message });
  }
});

// @route   DELETE /api/students/:id
// @desc    Remove a student
// @access  Private (admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });
    res.json({ message: "Student removed." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete student.", error: err.message });
  }
});

module.exports = router;
