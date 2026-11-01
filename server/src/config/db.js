
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const caCertificate = isProduction
  ? process.env.DB_CA_CERT
  : fs.readFileSync(path.join(__dirname, "../../certs/ca.pem"), "utf8");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  ssl: {
    rejectUnauthorized: true,
    ca: caCertificate,
  },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
