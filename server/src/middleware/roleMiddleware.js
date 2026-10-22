
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Authentication must run before role authorization.
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (
      allowedRoles.length === 0 ||
      !allowedRoles.every((role) => typeof role === "string")
    ) {
      return res.status(500).json({
        message: "Role authorization is not configured correctly",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return next();
  };
};

module.exports = {
  authorizeRoles,
};
