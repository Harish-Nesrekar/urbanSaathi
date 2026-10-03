const bcrypt = require("bcrypt");
const db = require("./src/config/db");
require("dotenv").config();

const createAdmin = async () => {
  try {
    const full_name = "UrbanSathi Admin";
    const email = "admin@urbansaathi.com";
    const phone = null;
    const password = "Admin@12345";

    // 1. Check if admin already exists
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      console.log("Admin already exists.");
      process.exit(0);
    }

    // 2. Hash admin password
    const passwordHash = await bcrypt.hash(password, 12);

    // 3. Create admin
    await db.query(
      `INSERT INTO users
       (full_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'ADMIN', 'ACTIVE')`,
      [full_name, email, phone, passwordHash]
    );

    console.log("Admin created successfully.");
    console.log("Email:", email);
    console.log("Password:", password);

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();