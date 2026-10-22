const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const profileController = require("../controllers/profileController");

const router = express.Router();

router.use(authenticateToken, authorizeRoles("CITIZEN"));

router.get("/", profileController.getMyProfile);

// All account changes begin with an OTP request.
router.post("/request-update", profileController.requestProfileUpdate);

// Only this endpoint applies the pending changes.
router.post("/verify-update", profileController.verifyProfileUpdate);

// Do not expose an endpoint that changes a password without OTP.
module.exports = router;