const mongoose = require("mongoose");
const { VALID_CLASSES } = require("../config/constants");

const periodSchema = new mongoose.Schema(
  {
    periodNumber: { type: Number, required: true },
    startTime: { type: String, default: "" }, // e.g. "09:00"
    endTime: { type: String, default: "" }, // e.g. "09:45"
    subject: { type: String, required: true, trim: true },
    teacher: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      required: true,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    periods: [periodSchema],
  },
  { _id: false }
);

const timetableSchema = new mongoose.Schema(
  {
    class: { type: String, required: true, enum: VALID_CLASSES, unique: true },
    section: { type: String, trim: true, default: "" },
    days: [daySchema],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);
