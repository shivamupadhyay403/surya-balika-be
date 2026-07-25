require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const marksheetRoutes = require("./routes/marksheetRoutes");
const timetableRoutes = require("./routes/timetableRoutes");

connectDB();

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Serve uploaded marksheet files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", school: "Surya Balika Intermediate College" });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/marksheets", marksheetRoutes);
app.use("/api/timetable", timetableRoutes);

// Multer / general error handler
app.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ message: err.message || "Something went wrong." });
  }
  next();
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
