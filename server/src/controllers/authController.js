const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const db = require("../config/db");
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

const registerCitizen = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name || !email || !password) {
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

const normalizedEmail = email.toLowerCase().trim();

    

    if (!normalizedEmail.endsWith("@gmail.com")) {
      return res.status(400).json({
        message: "Citizen email must be a Gmail address",
      });
    }

    const [existingUsers] = await db.query(
      "SELECT id, email_verified FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create the citizen account as unverified
    const [result] = await db.query(
      `INSERT INTO users
       (full_name, email, phone, password_hash, role, status, email_verified)
       VALUES (?, ?, ?, ?, 'CITIZEN', 'ACTIVE', FALSE)`,
      [
        full_name,
        normalizedEmail,
        phone || null,
        passwordHash,
      ]
    );

    const userId = result.insertId;

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash the OTP before storing it
    const otpHash = await bcrypt.hash(otp, 10);

    // OTP expires after 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Remove any previous OTPs for this user
    await db.query(
      "DELETE FROM email_verification_otps WHERE user_id = ?",
      [userId]
    );

    // Store the new hashed OTP
    await db.query(
      `INSERT INTO email_verification_otps
       (user_id, otp_hash, expires_at, attempts)
       VALUES (?, ?, ?, 0)`,
      [
        userId,
        otpHash,
        expiresAt,
      ]
    );

    // Send OTP to the citizen's Gmail
    await sendVerificationEmail(normalizedEmail, otp);

    res.status(201).json({
      message: "Registration successful. Verification code sent to your email.",
      requiresVerification: true,
      user: {
        id: userId,
        full_name,
        email: normalizedEmail,
        role: "CITIZEN",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed",
    });
  }
};
const verifyCitizenEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and verification code are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "Verification code must be 6 digits",
      });
    }

    const [users] = await db.query(
      "SELECT id, email_verified FROM users WHERE email = ? AND role = 'CITIZEN'",
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
      `SELECT *
       FROM email_verification_otps
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({
        message: "Verification code not found. Please request a new code.",
      });
    }

    const otpRecord = otpRecords[0];

    if (new Date() > new Date(otpRecord.expires_at)) {
      await db.query(
        "DELETE FROM email_verification_otps WHERE id = ?",
        [otpRecord.id]
      );

      return res.status(400).json({
        message: "Verification code has expired. Please request a new code.",
      });
    }

    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        message: "Too many verification attempts. Please request a new code.",
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
         WHERE id = ?`,
        [otpRecord.id]
      );

      return res.status(400).json({
        message: "Invalid verification code",
      });
    }

    await db.query(
      `UPDATE users
       SET email_verified = TRUE
       WHERE id = ?`,
      [user.id]
    );

    await db.query(
      "DELETE FROM email_verification_otps WHERE id = ?",
      [otpRecord.id]
    );

    res.status(200).json({
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: normalizedEmail,
        role: "CITIZEN",
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);

    res.status(500).json({
      message: "Email verification failed",
    });
  }
};

const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [users] = await db.query(
      `SELECT id, full_name, email, email_verified
       FROM users
       WHERE email = ? AND role = 'CITIZEN'`,
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

    // Generate a new 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Hash the OTP before storing it
    const otpHash = await bcrypt.hash(otp, 10);

    // New OTP expires after 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete previous OTP
    await db.query(
      "DELETE FROM email_verification_otps WHERE user_id = ?",
      [user.id]
    );

    // Store new OTP
    await db.query(
      `INSERT INTO email_verification_otps
       (user_id, otp_hash, expires_at, attempts)
       VALUES (?, ?, ?, 0)`,
      [
        user.id,
        otpHash,
        expiresAt,
      ]
    );

    // Send new OTP
    await sendVerificationEmail(
      normalizedEmail,
      otp
    );

    res.status(200).json({
      message: "A new verification code has been sent to your email",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    res.status(500).json({
      message: "Failed to resend verification code",
    });
  }
};

const loginCitizen = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [normalizedEmail]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Your account is not active",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!email.toLowerCase().endsWith("@urbansaathi.com")) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const user = users[0];

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access denied",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Admin account is not active",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      message: "Admin login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      message: "Admin login failed",
    });
  }
};

module.exports = {
  registerCitizen,
  verifyCitizenEmail,
  resendVerificationCode,
  loginCitizen,
  loginAdmin,
};