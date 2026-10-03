const express = require("express");

const {
  registerCitizen,
  verifyCitizenEmail,
  resendVerificationCode,
  loginCitizen,
  loginAdmin,
} = require("../controllers/authController");

const router = express.Router();

// Citizen registration
router.post("/register", registerCitizen);

router.post("/verify-email", verifyCitizenEmail);

router.post("/resend-verification", resendVerificationCode);

// Citizen login
router.post("/login", loginCitizen);

// Admin login
router.post("/admin-login", loginAdmin);

module.exports = router;