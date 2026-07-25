const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

// Protects a route: only requests with a valid admin JWT (in the
// Authorization: Bearer <token> header) are allowed through.
const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized. Please log in as admin." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ message: "Admin account no longer exists." });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
  }
};

module.exports = { protectAdmin };
