
const { hashPassword } = require("./src/services/passwordService");
const db = require("./src/config/db");
require("dotenv").config();

const createAdmin = async () => {
  try {
    const full_name = process.argv[2]?.trim();
    const email = process.argv[3]?.trim().toLowerCase();
    const password = process.argv[4];
    const admin_level = process.argv[5] || "ADMIN";
    const department = process.argv[6]?.trim() || null;

    if (!full_name || !email || !password) {
      console.log(
        'Usage: node createAdmin.js "Full Name" "Email" "Password" ["ADMIN_LEVEL"] ["Department"]'
      );
      process.exitCode = 1;
      return;
    }

    if (!email.endsWith("@urbansaathi.com")) {
      throw new Error(
        "Admin email must end with @urbansaathi.com"
      );
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(admin_level)) {
      throw new Error(
        "Admin level must be ADMIN or SUPER_ADMIN"
      );
    }

    const isStrongPassword =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9\s]/.test(password) &&
      !/\s/.test(password);

    if (!isStrongPassword) {
      throw new Error(
        "Password must have at least 8 characters, uppercase, lowercase, a number, a special character, and no spaces."
      );
    }

    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existingUsers.length > 0) {
      throw new Error(
        "An account with this email already exists. No changes were made."
      );
    }

    // New administrator passwords use Argon2id.
    const passwordHash = await hashPassword(password);

    // Keep user creation and admin profile creation atomic.
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [userResult] = await connection.query(
        `INSERT INTO users
         (full_name, email, phone, password_hash, role, status, email_verified)
         VALUES (?, ?, NULL, ?, 'ADMIN', 'ACTIVE', TRUE)`,
        [full_name, email, passwordHash]
      );

      const userId = userResult.insertId;

      await connection.query(
        `INSERT INTO admins
         (user_id, admin_level, department)
         VALUES (?, ?, ?)`,
        [userId, admin_level, department]
      );

      await connection.commit();

      console.log("Admin created successfully.");
      console.log("User ID:", userId);
      console.log("Name:", full_name);
      console.log("Email:", email);
      console.log("Role: ADMIN");
      console.log("Admin Level:", admin_level);
      console.log("Department:", department || "Not specified");
      console.log("Password storage: Argon2id hash");
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    // Close the MySQL pool so the CLI can exit cleanly.
    await db.end().catch((error) => {
      console.error("Database shutdown error:", error.message);
      process.exitCode = 1;
    });
  }
};

createAdmin();
