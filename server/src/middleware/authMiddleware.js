
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authentication token is required",
    });
  }

  const bearerMatch = authHeader.match(/^Bearer\s+(\S+)$/i);

  if (!bearerMatch) {
    return res.status(401).json({
      message: "Invalid authentication format",
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured.");

    return res.status(500).json({
      message: "Authentication service is not configured",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(
      bearerMatch[1],
      process.env.JWT_SECRET
    );
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }

  if (
    !decoded ||
    typeof decoded !== "object" ||
    !Number.isInteger(Number(decoded.id)) ||
    Number(decoded.id) <= 0
  ) {
    return res.status(401).json({
      message: "Invalid authentication token",
    });
  }

  try {
    const [users] = await db.query(
      `SELECT id, role, status
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [Number(decoded.id)]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Account not found",
      });
    }

    const user = users[0];

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Your account is not active",
      });
    }

    // Use the current database role, not the role in the JWT.
    req.user = {
      id: user.id,
      role: user.role,
    };

    return next();
  } catch (error) {
    console.error(
      "Authentication database check failed:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to verify your account",
    });
  }
};

module.exports = {
  authenticateToken,
};
