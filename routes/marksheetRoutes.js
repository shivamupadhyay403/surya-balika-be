const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const Marksheet = require("../models/Marksheet");
const Student = require("../models/Student");
const { protectAdmin } = require("../middleware/auth");
const { upload, allowedMimeTypes } = require("../middleware/upload");
const { VALID_CLASSES } = require("../config/constants");

// @route   GET /api/marksheets/search?class=8&rollNumber=12
// @route   GET /api/marksheets/search?class=8&name=meera
// @desc    Public search: find a student's marksheets by class + roll number, or class + name
// @access  Public
router.get("/search", async (req, res) => {
  try {
    const { class: className, rollNumber, name } = req.query;

    if (!className || !VALID_CLASSES.includes(className)) {
      return res.status(400).json({ message: "Please select a valid class." });
    }
    if (!rollNumber && !name) {
      return res.status(400).json({ message: "Please provide a roll number or student name." });
    }

    const studentFilter = { class: className };
    if (rollNumber) studentFilter.rollNumber = rollNumber.trim();
    if (name) studentFilter.name = { $regex: name.trim(), $options: "i" };

    const students = await Student.find(studentFilter).limit(20);
    if (students.length === 0) {
      return res.status(404).json({ message: "No student found matching that class and roll number/name." });
    }

    const studentIds = students.map((s) => s._id);
    const marksheets = await Marksheet.find({ student: { $in: studentIds } })
      .populate("student", "name rollNumber class section")
      .sort({ session: -1, createdAt: -1 });

    res.json({ students, marksheets });
  } catch (err) {
    res.status(500).json({ message: "Search failed.", error: err.message });
  }
});

// @route   POST /api/marksheets
// @desc    Upload a marksheet (PDF/image) for a student
// @access  Private (admin)
router.post("/", protectAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please attach a PDF or image file." });
    }
    const { studentId, examName, session } = req.body;
    if (!studentId || !examName || !session) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "studentId, examName, and session are required." });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "Student not found." });
    }

    const marksheet = await Marksheet.create({
      student: student._id,
      class: student.class,
      examName,
      session,
      fileUrl: `/uploads/marksheets/${req.file.filename}`,
      originalFileName: req.file.originalname,
      fileType: allowedMimeTypes[req.file.mimetype],
      uploadedBy: req.admin._id,
    });

    res.status(201).json(marksheet);
  } catch (err) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    if (err.code === 11000) {
      return res.status(409).json({ message: "A marksheet for this student, exam, and session already exists. Delete it first to replace." });
    }
    res.status(500).json({ message: "Upload failed.", error: err.message });
  }
});

// @route   GET /api/marksheets?class=8&studentId=...
// @desc    List marksheets (admin panel management view)
// @access  Private (admin)
router.get("/", protectAdmin, async (req, res) => {
  try {
    const { class: className, studentId } = req.query;
    const filter = {};
    if (className) filter.class = className;
    if (studentId) filter.student = studentId;
    const marksheets = await Marksheet.find(filter)
      .populate("student", "name rollNumber class section")
      .sort({ createdAt: -1 })
      .limit(300);
    res.json(marksheets);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch marksheets.", error: err.message });
  }
});

// @route   DELETE /api/marksheets/:id
// @desc    Remove a marksheet (and its file)
// @access  Private (admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const marksheet = await Marksheet.findByIdAndDelete(req.params.id);
    if (!marksheet) return res.status(404).json({ message: "Marksheet not found." });

    const filePath = path.join(__dirname, "..", marksheet.fileUrl);
    fs.unlink(filePath, () => {}); // best-effort cleanup, ignore errors

    res.json({ message: "Marksheet removed." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete marksheet.", error: err.message });
  }
});

module.exports = router;
