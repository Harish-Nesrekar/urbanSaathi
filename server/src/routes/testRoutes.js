const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

// Protected route — any authenticated user
router.get("/protected", authenticateToken, (req, res) => {
  res.json({
    message: "You have access to this protected route",
    user: req.user,
  });
});

// Admin-only route
router.get(
  "/admin-only",
  authenticateToken,
  authorizeRoles("ADMIN"),
  (req, res) => {
    res.json({
      message: "You have access to the admin-only route",
      user: req.user,
    });
  }
);

module.exports = router;