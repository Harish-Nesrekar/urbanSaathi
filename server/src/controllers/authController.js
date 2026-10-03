const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

const registerCitizen = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    // 1. Validate required fields
    if (!full_name || !email || !password) {
      return res.status(400).json({
        message: "Full name, email and password are required",
      });
    }

    // 2. Citizen email must be a Gmail address
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      return res.status(400).json({
        message: "Citizen email must be a Gmail address",
      });
    }

    // 3. Check if email already exists
    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // 4. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 5. Create citizen
    const [result] = await db.query(
      `INSERT INTO users
       (full_name, email, phone, password_hash, role, status)
       VALUES (?, ?, ?, ?, 'CITIZEN', 'ACTIVE')`,
      [full_name, email, phone || null, passwordHash]
    );

    // 6. Send registration response
    res.status(201).json({
      message: "Citizen registered successfully",
      user: {
        id: result.insertId,
        full_name,
        email,
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

const loginCitizen = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Find user
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = users[0];

    // 3. Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 4. Check account status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Your account is not active",
      });
    }

    // 5. Create JWT
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

    // 6. Send login response
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

    // 1. Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Admin email must use @urbansaathi.com
    if (!email.toLowerCase().endsWith("@urbansaathi.com")) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    // 3. Find user
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

    // 4. Verify that the account is actually an ADMIN
    if (user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Admin access denied",
      });
    }

    // 5. Check password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    // 6. Check account status
    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        message: "Admin account is not active",
      });
    }

    // 7. Create ADMIN JWT
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

    // 8. Send response
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
  loginCitizen,
  loginAdmin,
};