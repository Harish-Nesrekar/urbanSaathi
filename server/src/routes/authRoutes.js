const express = require("express");

const {
  registerCitizen,
  loginCitizen,
  loginAdmin,
} = require("../controllers/authController");

const router = express.Router();

// Citizen registration
router.post("/register", registerCitizen);

// Citizen login
router.post("/login", loginCitizen);

// Admin login
router.post("/admin-login", loginAdmin);

module.exports = router;