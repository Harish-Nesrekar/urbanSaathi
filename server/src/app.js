const express = require("express");
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "UrbanSathi API is running",
  });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT DATABASE() AS database_name"
    );

    res.json({
      message: "MySQL connection successful",
      database: rows[0].database_name,
    });
  } catch (error) {
    console.error("Database error:", error);

    res.status(500).json({
      message: "MySQL connection failed",
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`UrbanSathi server running on port ${PORT}`);
});