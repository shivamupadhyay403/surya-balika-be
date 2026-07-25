const mongoose = require("mongoose");
const { VALID_CLASSES } = require("../config/constants");

const marksheetSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    class: { type: String, required: true, enum: VALID_CLASSES }, // duplicated for fast filtering
    examName: { type: String, required: true, trim: true }, // e.g. "Half Yearly 2026", "Final 2026"
    session: { type: String, required: true, trim: true }, // e.g. "2025-26"
    fileUrl: { type: String, required: true }, // path served by /uploads
    originalFileName: { type: String, required: true },
    fileType: { type: String, enum: ["pdf", "image"], required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

marksheetSchema.index({ student: 1, examName: 1, session: 1 }, { unique: true });

module.exports = mongoose.model("Marksheet", marksheetSchema);
