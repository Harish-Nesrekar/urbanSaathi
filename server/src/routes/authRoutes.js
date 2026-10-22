const express = require("express");

const {
  registerCitizen,
  verifyCitizenEmail,
  resendVerificationCode,
  loginCitizen,
  loginAdmin,
  loginEmployee,
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

router.post("/employee-login", loginEmployee);

module.exports = router;