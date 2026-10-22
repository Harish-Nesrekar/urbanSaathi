
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const db = require("../config/db");
const {
  hashPassword,
  verifyPassword,
} = require("../services/passwordService");
const {
  sendVerificationEmail,
} = require("../services/emailService");

const isStrongPassword = (password) => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password) &&
    !/\s/.test(password)
  );
};

const normalizeEmail = (email) => {
  return typeof email === "string"
    ? email.trim().toLowerCase()
    : "";
};

// Upgrade legacy bcrypt hashes or outdated Argon2id hashes
// after a successful password verification.
const upgradePasswordHashIfNeeded = async (
  user,
  password,
  passwordResult
) => {
  if (!passwordResult.needsRehash) {
    return;
  }

  const upgradedHash = await hashPassword(password);

  await db.query(
    `UPDATE users
     SET password_hash = ?
     WHERE id = ? AND password_hash = ?`,
    [upgradedHash, user.id, user.password_hash]
  );
};

const registerCitizen = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Full name, email and password are required",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, special character, and no spaces",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail.endsWith("@gmail.com")) {
      return res.status(400).json({
        message: "Citizen email must be a Gmail address",
      });
    }

    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // Store new citizen passwords using Argon2id.
    const passwordHash = await hashPassword(password);

    const [result] = await db.query(
      `INSERT INTO users
       (full_name, email, phone, password_hash, role, status, email_verified)
       VALUES (?, ?, ?, ?, 'CITIZEN', 'ACTIVE', FALSE)`,
      [
        full_name.trim(),
        normalizedEmail,
        phone || null,
        passwordHash,
      ]
    );

    const userId = result.insertId;

    // Generate a cryptographically secure six-digit OTP.
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      "DELETE FROM email_verification_otps WHERE user_id = ?",
      [userId]
    );

    await db.query(
      `INSERT INTO email_verification_otps
       (user_id, otp_hash, expires_at, attempts)
       VALUES (?, ?, ?, 0)`,
      [userId, otpHash, expiresAt]
    );

    await sendVerificationEmail(normalizedEmail, otp);

    return res.status(201).json({
      message:
        "Registration successful. Verification code sent to your email.",
      requiresVerification: true,
      user: {
        id: userId,
        full_name: full_name.trim(),
        email: normalizedEmail,
        role: "CITIZEN",
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Registration failed",
    });
  }
};

const verifyCitizenEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (
      typeof email !== "string" ||
      typeof otp !== "string" ||
      !email.trim() ||
      !otp
    ) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "Verification code must be 6 digits",
      });
    }

    const [users] = await db.query(
      `SELECT id, email_verified
       FROM users
       WHERE email = ? AND role = 'CITIZEN'
       LIMIT 1`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "Citizen account not found",
      });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    const [otpRecords] = await db.query(
      `SELECT id, otp_hash, expires_at, attempts
       FROM email_verification_otps
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({
        message:
          "Verification code not found. Please request a new code.",
      });
    }

    const otpRecord = otpRecords[0];

    if (new Date() > new Date(otpRecord.expires_at)) {
      await db.query(
        "DELETE FROM email_verification_otps WHERE id = ?",
        [otpRecord.id]
      );

      return res.status(400).json({
        message:
          "Verification code has expired. Please request a new code.",
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        message:
          "Too many verification attempts. Please request a new code.",
      });
    }

    const otpMatch = await bcrypt.compare(
      otp,
      otpRecord.otp_hash
    );

    if (!otpMatch) {
      await db.query(
        `UPDATE email_verification_otps
         SET attempts = attempts + 1
         WHERE id = ? AND attempts < 5`,
        [otpRecord.id]
      );

      return res.status(400).json({
        message: "Invalid verification code",
      });
    }

    await db.query(
      `UPDATE users
       SET email_verified = TRUE
       WHERE id = ? AND role = 'CITIZEN'`,
      [user.id]
    );

    await db.query(
      "DELETE FROM email_verification_otps WHERE id = ?",
      [otpRecord.id]
    );

    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: normalizedEmail,
        role: "CITIZEN",
      },
    });
  } catch (error) {
    console.error(
      "Email verification error:",
      error.message
    );

    return res.status(500).json({
      message: "Email verification failed",
    });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const [users] = await db.query(
      `SELECT id, email, email_verified
       FROM users
       WHERE email = ? AND role = 'CITIZEN'
       LIMIT 1`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: "Citizen account not found",
      });
    }

    const user = users[0];

    if (user.email_verified) {
      return res.status(400).json({
        message: "Email is already verified",
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      "DELETE FROM email_verification_otps WHERE user_id = ?",
      [user.id]
    );

    await db.query(
      `INSERT INTO email_verification_otps
       (user_id, otp_hash, expires_at, attempts)
       VALUES (?, ?, ?, 0)`,
      [user.id, otpHash, expiresAt]
    );

    await sendVerificationEmail(normalizedEmail, otp);

    return res.status(200).json({
      message: "A new verification code has been sent to your email",
    });
  } catch (error) {
    console.error(
      "Resend verification error:",
      error.message
    );

    return res.status(500).json({
      message: "Failed to resend verification code",
    });
  }
};

const loginCitizen = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    const [users] = await db.query(
      `SELECT *
       FROM users
       WHERE email = ? AND role = 'CITIZEN'
       LIMIT 1`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    const passwordResult = await verifyPassword(
      user.password_hash,
      password
    );

    if (!passwordResult.valid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Your account is not active",
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    await upgradePasswordHashIfNeeded(
      user,
      password,
      passwordResult
    );

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        message: "Authentication service is not configured",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: "CITIZEN" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await db.query(
      `UPDATE users
       SET last_login = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [user.id]
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: "CITIZEN",
      },
    });
  } catch (error) {
    console.error("Citizen login error:", error.message);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail.endsWith("@urbansaathi.com")) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const [users] = await db.query(
      `SELECT *
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const user = users[0];

    if (user.role !== "ADMIN") {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const passwordResult = await verifyPassword(
      user.password_hash,
      password
    );

    if (!passwordResult.valid) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Admin account is not active",
      });
    }

    await upgradePasswordHashIfNeeded(
      user,
      password,
      passwordResult
    );

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        message: "Authentication service is not configured",
      });
    }

    const token = jwt.sign(
      { id: user.id, role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await db.query(
      `UPDATE users
       SET last_login = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [user.id]
    );

    return res.status(200).json({
      message: "Admin login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: "ADMIN",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);

    return res.status(500).json({
      message: "Admin login failed",
    });
  }
};


const loginEmployee = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const [employees] = await db.query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.password_hash,
         u.status,
         e.id AS employee_id,
         e.employee_code,
         e.is_active AS employee_active,
         d.id AS department_id,
         d.name AS department_name,
         d.is_active AS department_active
       FROM users u
       INNER JOIN employees e ON e.user_id = u.id
       INNER JOIN departments d ON d.id = e.department_id
       WHERE u.email = ?
         AND u.role = 'EMPLOYEE'
       LIMIT 1`,
      [email]
    );

    if (employees.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = employees[0];

    const passwordCheck = await verifyPassword(
      user.password_hash,
      password
    );

    if (!passwordCheck.valid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (
      user.status !== "ACTIVE" ||
      !user.employee_active ||
      !user.department_active
    ) {
      return res.status(403).json({
        message: "Your employee account or department is inactive",
      });
    }

   await upgradePasswordHashIfNeeded(
  user,
  password,
  passwordCheck
);

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        message: "Authentication is temporarily unavailable",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: "EMPLOYEE",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    await db.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id]
    );

    return res.status(200).json({
      message: "Employee login successful",
      token,
      user: {
        id: user.id,
        employee_id: user.employee_id,
        employee_code: user.employee_code,
        full_name: user.full_name,
        email: user.email,
        role: "EMPLOYEE",
        department: {
          id: user.department_id,
          name: user.department_name,
        },
      },
    });
  } catch (error) {
    console.error("Employee login error:", error.message);

    return res.status(500).json({
      message: "Employee login failed",
    });
  }
};


module.exports = {
  registerCitizen,
  verifyCitizenEmail,
  resendVerificationCode,
  loginCitizen,
  loginAdmin,
  loginEmployee,
};