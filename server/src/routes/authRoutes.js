
const express = require("express");

const {
  registerCitizen,
  verifyCitizenEmail,
  resendVerificationCode,
  loginCitizen,
  loginAdmin,
  loginEmployee,
  sendCitizenPasswordResetOtp,
  verifyCitizenPasswordResetOtp,
  resetCitizenPassword,
} = require("../controllers/authController");

const router = express.Router();

// Citizen registration
router.post("/register", registerCitizen);
router.post("/verify-email", verifyCitizenEmail);
router.post("/resend-verification", resendVerificationCode);

// Citizen login
router.post("/login", loginCitizen);

// Citizen password recovery
router.post("/forgot-password", sendCitizenPasswordResetOtp);
router.post("/verify-reset-otp", verifyCitizenPasswordResetOtp);
router.post("/reset-password", resetCitizenPassword);

// Admin login — unchanged
router.post("/admin-login", loginAdmin);

// Employee login — unchanged
router.post("/employee-login", loginEmployee);

module.exports = router;
