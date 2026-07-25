const mongoose = require("mongoose");
const { VALID_CLASSES } = require("../config/constants");

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, trim: true },
    class: { type: String, required: true, enum: VALID_CLASSES },
    section: { type: String, trim: true, default: "" }, // optional, e.g. "A"
    fatherName: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

// A roll number only needs to be unique within a class (two different classes
// can both have roll number 1).
studentSchema.index({ class: 1, rollNumber: 1 }, { unique: true });
studentSchema.index({ class: 1, name: "text" });

module.exports = mongoose.model("Student", studentSchema);
