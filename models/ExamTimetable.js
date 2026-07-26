const mongoose = require("mongoose");
const { VALID_CLASSES } = require("../config/constants");

const examTimetableSchema = new mongoose.Schema(
  {
    class: { type: String, required: true, enum: VALID_CLASSES },
    subject: { type: String, required: true, trim: true },
    examName: { type: String, required: true, trim: true }, // e.g. "Half Yearly 2026", "Final 2026"
    session: { type: String, required: true, trim: true }, // e.g. "2025-26"
    examDate: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true }, // "10:00 AM"
    endTime: { type: String, required: true, trim: true },
    room: { type: String, trim: true, default: "TBA" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

// one slot per subject, per class, per exam+session — mirrors the Marksheet duplicate guard
examTimetableSchema.index({ class: 1, examName: 1, session: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model("ExamTimetable", examTimetableSchema);