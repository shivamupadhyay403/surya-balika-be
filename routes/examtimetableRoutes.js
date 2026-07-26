const express = require("express");
const router = express.Router();
const ExamTimetable = require("../models/ExamTimetable");
const { protectAdmin } = require("../middleware/auth");
const { VALID_CLASSES } = require("../config/constants");
// @route   GET /api/timetable/search?class=8
// @desc    Public: student view of the exam timetable for a class
// @access  Public
router.get("/search", async (req, res) => {
  try {
    const { class: className } = req.query;

    if (!className || !VALID_CLASSES.includes(className)) {
      return res.status(400).json({ message: "Please select a valid class." });
    }

    const timetable = await ExamTimetable.find({ class: className }).sort({ examDate: 1, startTime: 1 });

    if (timetable.length === 0) {
      return res.status(404).json({ message: "No exam timetable has been published for this class yet." });
    }

    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch timetable.", error: err.message });
  }
});

// @route   GET /api/timetable?class=8
// @desc    Admin: list timetable entries for the management view
// @access  Private (admin)
router.get("/", protectAdmin, async (req, res) => {
  try {
    const { class: className } = req.query;
    const filter = {};
    if (className) filter.class = className;

    const timetable = await ExamTimetable.find(filter).sort({ class: 1, examDate: 1, startTime: 1 });
    res.json(timetable);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch timetable.", error: err.message });
  }
});

// @route   POST /api/timetable
// @desc    Admin: add a single exam slot manually
// @access  Private (admin)
router.post("/", protectAdmin, async (req, res) => {
  try {
    const { class: className, subject, examName, session, examDate, startTime, endTime, room } = req.body;

    if (!className || !subject || !examName || !session || !examDate || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "class, subject, examName, session, examDate, startTime and endTime are required." });
    }
    if (!VALID_CLASSES.includes(className)) {
      return res.status(400).json({ message: "Please select a valid class." });
    }
    const parsedDate = new Date(examDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "examDate is not a valid date." });
    }

    const entry = await ExamTimetable.create({
      class: className,
      subject: subject.trim(),
      examName: examName.trim(),
      session: session.trim(),
      examDate: parsedDate,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      room: room ? room.trim() : "TBA",
      uploadedBy: req.admin._id,
    });

    res.status(201).json(entry);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This subject already has a slot for this class, exam, and session." });
    }
    res.status(500).json({ message: "Failed to add exam slot.", error: err.message });
  }
});

// @route   PUT /api/timetable/:id
// @desc    Admin: edit an exam slot
// @access  Private (admin)
router.put("/update/:id", protectAdmin, async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.class && !VALID_CLASSES.includes(updates.class)) {
      return res.status(400).json({ message: "Please select a valid class." });
    }
    if (updates.examDate) {
      const parsedDate = new Date(updates.examDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ message: "examDate is not a valid date." });
      }
      updates.examDate = parsedDate;
    }

    const entry = await ExamTimetable.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!entry) return res.status(404).json({ message: "Exam slot not found." });

    res.json(entry);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Another slot already exists for this subject, class, exam and session." });
    }
    res.status(500).json({ message: "Failed to update exam slot.", error: err.message });
  }
});

// @route   DELETE /api/timetable/:id
// @desc    Admin: remove a single exam slot
// @access  Private (admin)
router.delete("/:id", protectAdmin, async (req, res) => {
  try {
    const entry = await ExamTimetable.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: "Exam slot not found." });
    res.json({ message: "Exam slot removed." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete exam slot.", error: err.message });
  }
});

module.exports = router;