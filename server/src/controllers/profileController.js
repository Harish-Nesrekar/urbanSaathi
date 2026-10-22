const bcrypt = require("bcrypt");
const crypto = require("crypto");
const db = require("../config/db");
const {
  hashPassword,
  verifyPassword,
} = require("../services/passwordService");
const {
  sendVerificationEmail,
} = require("../services/emailService");

const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9\s]/.test(password) &&
  !/\s/.test(password);

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const getMyProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT full_name, email, original_email, phone, created_at
       FROM users
       WHERE id = ? AND role = 'CITIZEN'
       LIMIT 1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.json({
      profile: {
        ...rows[0],
        original_email: rows[0].original_email || rows[0].email,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error.message);
    return res.status(500).json({ message: "Could not load profile" });
  }
};

const requestProfileUpdate = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      currentPassword,
      newPassword,
    } = req.body;

    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      full_name.trim().length > 100
    ) {
      return res.status(400).json({
        message: "Enter a valid name of up to 100 characters",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail.endsWith("@gmail.com")) {
      return res.status(400).json({
        message: "Enter a valid Gmail address",
      });
    }

    if (
      phone != null &&
      (typeof phone !== "string" ||
        phone.length > 15 ||
        (phone && !/^[+\d\s()-]+$/.test(phone)))
    ) {
      return res.status(400).json({
        message: "Enter a valid phone number",
      });
    }

    const changingPassword =
      typeof newPassword === "string" && newPassword.length > 0;

    if (changingPassword && !isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain uppercase, lowercase, a number and a special character, with no spaces",
      });
    }

    if (changingPassword && !currentPassword) {
      return res.status(400).json({
        message: "Enter your current password",
      });
    }

    const [users] = await db.query(
      `SELECT id, full_name, email, original_email, phone, password_hash
       FROM users
       WHERE id = ? AND role = 'CITIZEN'
         AND status = 'ACTIVE' AND email_verified = TRUE
       LIMIT 1`,
      [req.user.id]
    );

    if (!users.length) {
      return res.status(403).json({
        message: "An active, verified citizen account is required",
      });
    }

    const user = users[0];
    const originalEmail = normalizeEmail(
      user.original_email || user.email
    );

    if (!originalEmail) {
      return res.status(400).json({
        message: "Your original registered email is unavailable",
      });
    }

    if (changingPassword) {
      const verification = await verifyPassword(
        user.password_hash,
        currentPassword
      );

      if (!verification.valid) {
        return res.status(401).json({
          message: "Your current password is incorrect",
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          message: "Your new password must differ from your current password",
        });
      }
    }

    if (normalizedEmail !== normalizeEmail(user.email)) {
      const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
        [normalizedEmail, user.id]
      );

      if (existing.length) {
        return res.status(409).json({
          message: "That email address is already registered",
        });
      }
    }

    // Prepare pending data. Nothing in users is changed here.
    const pendingPasswordHash = changingPassword
      ? await hashPassword(newPassword)
      : null;

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      "DELETE FROM profile_update_otps WHERE user_id = ?",
      [user.id]
    );

    await db.query(
      `INSERT INTO profile_update_otps
       (user_id, otp_hash, pending_full_name, pending_phone,
        pending_email, pending_password_hash, expires_at, attempts)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        user.id,
        otpHash,
        full_name.trim(),
        phone?.trim() || null,
        normalizedEmail,
        pendingPasswordHash,
        expiresAt,
      ]
    );

    try {
      // Always send the code to the original registration email.
      await sendVerificationEmail(originalEmail, otp);
    } catch (emailError) {
      await db.query(
        "DELETE FROM profile_update_otps WHERE user_id = ?",
        [user.id]
      );
      throw emailError;
    }

    return res.json({
      message: `Verification code sent to your original registered Gmail address (${originalEmail})`,
      expiresInSeconds: 600,
    });
  } catch (error) {
    console.error("Request account update error:", error.message);
    return res.status(500).json({
      message: "Could not send the verification code",
    });
  }
};

const verifyProfileUpdate = async (req, res) => {
  try {
    const { otp } = req.body;

    if (typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        message: "Enter the six-digit verification code",
      });
    }

    const [records] = await db.query(
      `SELECT id, otp_hash, pending_full_name, pending_phone,
              pending_email, pending_password_hash, expires_at, attempts
       FROM profile_update_otps
       WHERE user_id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (!records.length) {
      return res.status(400).json({
        message: "No pending update. Request a new verification code.",
      });
    }

    const record = records[0];

    if (new Date(record.expires_at).getTime() <= Date.now()) {
      await db.query(
        "DELETE FROM profile_update_otps WHERE id = ?",
        [record.id]
      );
      return res.status(400).json({
        message: "Verification code expired. Request a new one.",
      });
    }

    if (record.attempts >= 5) {
      await db.query(
        "DELETE FROM profile_update_otps WHERE id = ?",
        [record.id]
      );
      return res.status(429).json({
        message: "Too many attempts. Request a new verification code.",
      });
    }

    const matches = await bcrypt.compare(otp, record.otp_hash);

    if (!matches) {
      await db.query(
        `UPDATE profile_update_otps
         SET attempts = attempts + 1
         WHERE id = ? AND attempts < 5`,
        [record.id]
      );

      return res.status(400).json({
        message: "Incorrect verification code",
      });
    }

    // Check email uniqueness again at the moment of saving.
    const [duplicateEmail] = await db.query(
      `SELECT id FROM users
       WHERE email = ? AND id <> ?
       LIMIT 1`,
      [record.pending_email, req.user.id]
    );

    if (duplicateEmail.length) {
      await db.query(
        "DELETE FROM profile_update_otps WHERE id = ?",
        [record.id]
      );
      return res.status(409).json({
        message: "That email address is already registered. Request a new update.",
      });
    }

    // Apply changes only after the OTP has been verified.
    const [result] = await db.query(
      `UPDATE users
       SET full_name = ?,
           email = ?,
           phone = ?,
           password_hash = COALESCE(?, password_hash)
       WHERE id = ? AND role = 'CITIZEN' AND status = 'ACTIVE'`,
      [
        record.pending_full_name,
        record.pending_email,
        record.pending_phone,
        record.pending_password_hash,
        req.user.id,
      ]
    );

    if (!result.affectedRows) {
      return res.status(403).json({
        message: "The account could not be updated",
      });
    }

    await db.query(
      "DELETE FROM profile_update_otps WHERE id = ?",
      [record.id]
    );

    return res.json({
      message: "Account updated successfully",
      profile: {
        full_name: record.pending_full_name,
        email: record.pending_email,
        phone: record.pending_phone,
      },
    });
  } catch (error) {
    console.error("Verify account update error:", error.message);
    return res.status(500).json({
      message: "Could not verify and save your account",
    });
  }
};

module.exports = {
  getMyProfile,
  requestProfileUpdate,
  verifyProfileUpdate,
};