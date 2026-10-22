const db = require("../config/db");
const { hashPassword } = require("../services/passwordService");
const crypto = require("crypto");

async function tableExists(tableName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );

  return Number(rows[0]?.total || 0) > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return Number(rows[0]?.total || 0) > 0;
}

async function getComplaintStats() {
  const exists = await tableExists("complaints");

  if (!exists || !(await columnExists("complaints", "status"))) {
    return {
      available: false,
      total: null,
      pending: null,
      resolved: null,
    };
  }

  const [rows] = await db.query(`
    SELECT
      COUNT(*) AS total,

      SUM(
        CASE
          WHEN LOWER(REPLACE(status, '-', '_'))
            IN ('pending', 'open', 'submitted', 'in_progress')
          THEN 1 ELSE 0
        END
      ) AS pending,

      SUM(
        CASE
          WHEN LOWER(REPLACE(status, '-', '_'))
            IN ('resolved', 'closed', 'completed')
          THEN 1 ELSE 0
        END
      ) AS resolved

    FROM complaints
  `);

  return {
    available: true,
    total: Number(rows[0]?.total || 0),
    pending: Number(rows[0]?.pending || 0),
    resolved: Number(rows[0]?.resolved || 0),
  };
}

exports.getOverview = async (req, res) => {
  try {
    // Fetch the real number of citizen accounts.
    const [citizenRows] = await db.query(`
      SELECT COUNT(*) AS total
      FROM users
      WHERE role = 'CITIZEN'
    `);

    // Complaint statistics are loaded only if the table exists.
    const complaints = await getComplaintStats();

    // Fetch recent citizen registrations.
    const [recentRows] = await db.query(`
      SELECT
        id,
        full_name,
        email,
        status,
        created_at
      FROM users
      WHERE role = 'CITIZEN'
      ORDER BY created_at DESC, id DESC
      LIMIT 5
    `);

    return res.status(200).json({
      stats: {
        totalCitizens: Number(citizenRows[0]?.total || 0),
        totalComplaints: complaints.total,
        pendingComplaints: complaints.pending,
        resolvedComplaints: complaints.resolved,
      },

      availability: {
        complaints: complaints.available,
      },

      recentCitizens: recentRows.map((user) => ({
        userId: user.id,
        fullName: user.full_name,
        email: user.email,
        status: user.status,
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    console.error("Admin overview error:", error.message);

    return res.status(500).json({
      message: "Unable to load admin dashboard data",
    });
  }
};


exports.createEmployee = async (req, res) => {
  let connection;

  try {
    const { full_name, email, password, department_id } = req.body;

    if (
      typeof full_name !== "string" ||
      !full_name.trim() ||
      full_name.trim().length > 100 ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password ||
      !Number.isInteger(Number(department_id)) ||
      Number(department_id) <= 0
    ) {
      return res.status(400).json({
        message: "Valid name, email, password, and department are required",
      });
    }

    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[^A-Za-z0-9]/.test(password) ||
      /\s/.test(password)
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character, with no spaces",
      });
    }

    const normalizedName = full_name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [departments] = await connection.query(
      `SELECT id, name
       FROM departments
       WHERE id = ? AND is_active = 1
       LIMIT 1`,
      [Number(department_id)]
    );

    if (departments.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        message: "Selected department does not exist or is inactive",
      });
    }

    const [existingUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const passwordHash = await hashPassword(password);
    const employeeCode = `EMP-${crypto.randomUUID()
      .replace(/-/g, "")
      .slice(0, 12)
      .toUpperCase()}`;

    const [userResult] = await connection.query(
      `INSERT INTO users
        (full_name, email, password_hash, role, status, email_verified)
       VALUES (?, ?, ?, 'EMPLOYEE', 'ACTIVE', 1)`,
      [normalizedName, normalizedEmail, passwordHash]
    );

    await connection.query(
      `INSERT INTO employees
        (user_id, department_id, employee_code, is_active)
       VALUES (?, ?, ?, 1)`,
      [userResult.insertId, Number(department_id), employeeCode]
    );

    await connection.commit();

    return res.status(201).json({
      message: "Employee created successfully",
      employee: {
        user_id: userResult.insertId,
        employee_code: employeeCode,
        full_name: normalizedName,
        email: normalizedEmail,
        department_id: Number(department_id),
        department_name: departments[0].name,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "An account or employee code already exists",
      });
    }

    console.error("Create employee error:", error.message);

    return res.status(500).json({
      message: "Could not create employee",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const [departments] = await db.query(
      `SELECT
         d.id,
         d.name,
         d.description,
         COUNT(c.id) AS total_complaints,
         COALESCE(SUM(
           CASE
             WHEN c.status IN (
               'SUBMITTED',
               'UNDER_REVIEW',
               'ASSIGNED',
               'IN_PROGRESS',
               'REOPENED'
             )
             THEN 1 ELSE 0
           END
         ), 0) AS active_complaints,
         COALESCE(SUM(
           CASE
             WHEN c.status = 'RESOLVED'
             THEN 1 ELSE 0
           END
         ), 0) AS resolved_complaints
       FROM departments d
       LEFT JOIN complaints c
         ON c.department_id = d.id
       WHERE d.is_active = 1
       GROUP BY d.id, d.name, d.description
       ORDER BY d.name ASC`
    );

    return res.status(200).json({
      departments: departments.map((department) => ({
        id: Number(department.id),
        name: department.name,
        description: department.description,
        totalComplaints: Number(department.total_complaints || 0),
        activeComplaints: Number(department.active_complaints || 0),
        resolvedComplaints: Number(department.resolved_complaints || 0),
      })),
    });
  } catch (error) {
    console.error("Get admin departments error:", error.message);

    return res.status(500).json({
      message: "Unable to load departments",
    });
  }
};
// Get all employees for the administrator's employee directory.
exports.getEmployees = async (req, res) => {
  try {
    const [employees] = await db.query(
      `SELECT
         e.id AS employee_id,
         e.user_id,
         e.employee_code,
         e.department_id,
         e.is_active,
         e.created_at,
         u.full_name,
         u.email,
         u.status AS account_status,
         d.name AS department_name,
         (
           SELECT COUNT(*)
           FROM complaints c
           WHERE c.department_id = e.department_id
             AND c.status NOT IN ('RESOLVED', 'REJECTED')
         ) AS active_complaints,
         (
           SELECT COUNT(*)
           FROM complaints c
           WHERE c.department_id = e.department_id
             AND c.status = 'RESOLVED'
         ) AS resolved_complaints
       FROM employees e
       INNER JOIN users u
         ON u.id = e.user_id
       INNER JOIN departments d
         ON d.id = e.department_id
       ORDER BY e.created_at DESC, e.id DESC`
    );

    return res.status(200).json({
      employees: employees.map((employee) => ({
        employeeId: Number(employee.employee_id),
        userId: Number(employee.user_id),
        employeeCode: employee.employee_code,
        fullName: employee.full_name,
        email: employee.email,
        departmentId: Number(employee.department_id),
        departmentName: employee.department_name,
        isActive: Boolean(employee.is_active),
        accountStatus: employee.account_status,
        activeComplaints: Number(employee.active_complaints || 0),
        resolvedComplaints: Number(employee.resolved_complaints || 0),
        createdAt: employee.created_at,
      })),
    });
  } catch (error) {
    console.error("Get employees error:", error.message);

    return res.status(500).json({
      message: "Unable to load employees",
    });
  }
};


// GET /api/admin/citizens
// List citizen accounts with complaint statistics.
exports.getCitizens = async (req, res) => {
  try {
    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim().slice(0, 100)
        : "";

    const status =
      typeof req.query.status === "string"
        ? req.query.status.toUpperCase()
        : "ALL";

    if (!["ALL", "ACTIVE", "INACTIVE", "BLOCKED"].includes(status)) {
      return res.status(400).json({
        message: "Invalid citizen account status",
      });
    }

    const conditions = ["u.role = 'CITIZEN'"];
    const params = [];

    if (search) {
      conditions.push("(u.full_name LIKE ? OR u.email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status !== "ALL") {
      conditions.push("u.status = ?");
      params.push(status);
    }

    const [rows] = await db.query(
      `SELECT
         u.id AS user_id,
         u.full_name,
         u.email,
         u.phone,
         u.status,
         u.created_at,
         COUNT(c.id) AS total_complaints,
         COALESCE(SUM(
           CASE
             WHEN c.status IN (
               'SUBMITTED',
               'UNDER_REVIEW',
               'ASSIGNED',
               'IN_PROGRESS',
               'REOPENED'
             )
             THEN 1 ELSE 0
           END
         ), 0) AS active_complaints,
         COALESCE(SUM(
           CASE WHEN c.status = 'RESOLVED'
           THEN 1 ELSE 0 END
         ), 0) AS resolved_complaints
       FROM users u
       LEFT JOIN citizens ci ON ci.user_id = u.id
       LEFT JOIN complaints c ON c.citizen_id = ci.id
       WHERE ${conditions.join(" AND ")}
       GROUP BY
         u.id, u.full_name, u.email, u.phone,
         u.status, u.created_at
       ORDER BY u.created_at DESC, u.id DESC`,
      params
    );

    return res.status(200).json({
      citizens: rows.map((row) => ({
        userId: Number(row.user_id),
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        status: row.status,
        createdAt: row.created_at,
        totalComplaints: Number(row.total_complaints || 0),
        activeComplaints: Number(row.active_complaints || 0),
        resolvedComplaints: Number(row.resolved_complaints || 0),
      })),
      total: rows.length,
    });
  } catch (error) {
    console.error("Get citizens error:", error.message);

    return res.status(500).json({
      message: "Unable to load citizens",
    });
  }
};


// GET /api/admin/citizens/:citizenId/complaints
// Return the complaint history for one citizen.
exports.getCitizenComplaints = async (req, res) => {
  try {
    const citizenId = Number(req.params.citizenId);

    if (!Number.isInteger(citizenId) || citizenId <= 0) {
      return res.status(400).json({
        message: "Invalid citizen ID",
      });
    }

    const [citizens] = await db.query(
      `SELECT id, full_name, email
       FROM users
       WHERE id = ? AND role = 'CITIZEN'
       LIMIT 1`,
      [citizenId]
    );

    if (citizens.length === 0) {
      return res.status(404).json({
        message: "Citizen not found",
      });
    }

    const [complaints] = await db.query(
      `SELECT
         c.id,
         c.complaint_number,
         c.title,
         c.status,
         c.priority,
         c.address,
         c.created_at,
         cc.name AS category_name
       FROM complaints c
       INNER JOIN citizens ci ON ci.id = c.citizen_id
       LEFT JOIN complaint_categories cc ON cc.id = c.category_id
       WHERE ci.user_id = ?
       ORDER BY c.created_at DESC, c.id DESC`,
      [citizenId]
    );

    return res.status(200).json({
      citizen: {
        userId: Number(citizens[0].id),
        fullName: citizens[0].full_name,
        email: citizens[0].email,
      },
      complaints,
      total: complaints.length,
    });
  } catch (error) {
    console.error("Get citizen complaints error:", error.message);

    return res.status(500).json({
      message: "Unable to load citizen complaint history",
    });
  }
};


// PATCH /api/admin/citizens/:citizenId/status
// Activate or deactivate a citizen account.
exports.updateCitizenStatus = async (req, res) => {
  try {
    const citizenId = Number(req.params.citizenId);
    const { status } = req.body;

    if (!Number.isInteger(citizenId) || citizenId <= 0) {
      return res.status(400).json({
        message: "Invalid citizen ID",
      });
    }

    if (!["ACTIVE", "INACTIVE", "BLOCKED"].includes(status)) {
      return res.status(400).json({
        message: "Status must be ACTIVE, INACTIVE, or BLOCKED",
      });
    }

    const [result] = await db.query(
      `UPDATE users
       SET status = ?
       WHERE id = ? AND role = 'CITIZEN'`,
      [status, citizenId]
    );

    if (result.affectedRows === 0) {
      const [existing] = await db.query(
        `SELECT id
         FROM users
         WHERE id = ? AND role = 'CITIZEN'
         LIMIT 1`,
        [citizenId]
      );

      if (existing.length === 0) {
        return res.status(404).json({
          message: "Citizen not found",
        });
      }
    }

    return res.status(200).json({
      message: `Citizen account status set to ${status}`,
      citizen: {
        userId: citizenId,
        status,
      },
    });
  } catch (error) {
    console.error("Update citizen status error:", error.message);

    return res.status(500).json({
      message: "Unable to update citizen status",
    });
  }
};
