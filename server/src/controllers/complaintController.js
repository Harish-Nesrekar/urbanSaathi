const db = require("../config/db");
const crypto = require("crypto");

// Get active complaint categories with their mapped active departments.
// GET /api/complaints/categories
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         cc.id,
         cc.name,
         cc.description,
         d.id AS department_id,
         d.name AS department_name
       FROM complaint_categories cc
       LEFT JOIN complaint_category_departments ccd
         ON ccd.category_id = cc.id
       LEFT JOIN departments d
         ON d.id = ccd.department_id
         AND d.is_active = TRUE
       WHERE cc.is_active = TRUE
       ORDER BY cc.name ASC, d.name ASC`
    );

    const categoryMap = new Map();

    for (const row of rows) {
      if (!categoryMap.has(row.id)) {
        categoryMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          departments: [],
        });
      }

      if (row.department_id !== null) {
        categoryMap.get(row.id).departments.push({
          id: row.department_id,
          name: row.department_name,
        });
      }
    }

    return res.status(200).json({
      categories: Array.from(categoryMap.values()),
    });
  } catch (error) {
    console.error("Get complaint categories error:", error.message);

    return res.status(500).json({
      message: "Unable to load complaint categories",
    });
  }
};

// Get complaints for the authenticated citizen.
// GET /api/complaints/my
exports.getMyComplaints = async (req, res) => {
  try {
    const userId = req.user.id;

    const [citizens] = await db.query(
      `SELECT id
       FROM citizens
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (citizens.length === 0) {
      return res.status(404).json({
        message: "Citizen profile not found",
      });
    }

    const [complaints] = await db.query(
      `SELECT
         c.id,
         c.department_id,
         c.complaint_number,
         c.title,
         c.description,
         c.priority,
         c.status,
         c.address,
         c.latitude,
         c.longitude,
         cc.name AS category,
         c.created_at,
         c.updated_at,
         c.resolved_at
       FROM complaints c
       INNER JOIN complaint_categories cc
         ON cc.id = c.category_id
       WHERE c.citizen_id = ?
       ORDER BY c.created_at DESC, c.id DESC`,
      [citizens[0].id]
    );

    return res.status(200).json({
      complaints,
    });
  } catch (error) {
    console.error("Get citizen complaints error:", error.message);

    return res.status(500).json({
      message: "Unable to load your complaints",
    });
  }
};

// Get details, attachments, and status history for one complaint.
// GET /api/complaints/:complaintId
exports.getComplaintDetails = async (req, res) => {
  try {
    const complaintId = Number(req.params.complaintId);

    if (!Number.isInteger(complaintId) || complaintId <= 0) {
      return res.status(400).json({
        message: "Invalid complaint ID",
      });
    }

    let ownershipFilter = "";
    const queryParams = [complaintId];

    // Citizens can only access their own complaints.
    if (req.user.role === "CITIZEN") {
      ownershipFilter = "AND citizen.user_id = ?";
      queryParams.push(req.user.id);
    }

    const [complaints] = await db.query(
      `SELECT
         c.id,
         c.complaint_number,
         c.title,
         c.description,
         c.priority,
         c.status,
         c.address,
         c.latitude,
         c.longitude,
         c.created_at,
         c.updated_at,
         c.resolved_at,
         cc.name AS category,
         citizen.user_id AS citizen_user_id,
         citizen_user.full_name AS citizen_name,
         citizen_user.email AS citizen_email,
         admin_user.full_name AS assigned_admin_name
       FROM complaints c
       INNER JOIN complaint_categories cc
         ON cc.id = c.category_id
       INNER JOIN citizens citizen
         ON citizen.id = c.citizen_id
       INNER JOIN users citizen_user
         ON citizen_user.id = citizen.user_id
       LEFT JOIN admins assigned_admin
         ON assigned_admin.id = c.assigned_admin_id
       LEFT JOIN users admin_user
         ON admin_user.id = assigned_admin.user_id
       WHERE c.id = ? ${ownershipFilter}
       LIMIT 1`,
      queryParams
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    const complaint = complaints[0];

    delete complaint.citizen_user_id;

    const [attachments] = await db.query(
      `SELECT
         id,
         file_name,
         mime_type,
         file_size_bytes,
         created_at
       FROM complaint_attachments
       WHERE complaint_id = ?
       ORDER BY created_at ASC, id ASC`,
      [complaintId]
    );

    const [history] = await db.query(
      `SELECT
         h.id,
         h.previous_status,
         h.new_status,
         h.changed_by_user_id,
         h.note,
         h.created_at,
         u.full_name AS changed_by_name
       FROM complaint_status_history h
       LEFT JOIN users u
         ON u.id = h.changed_by_user_id
       WHERE h.complaint_id = ?
       ORDER BY h.created_at ASC, h.id ASC`,
      [complaintId]
    );

    return res.status(200).json({
      complaint,
      attachments,
      history,
    });
  } catch (error) {
    console.error("Get complaint details error:", error.message);

    return res.status(500).json({
      message: "Unable to load complaint details",
    });
  }
};

// Get all complaints for administrators.
// GET /api/complaints
exports.getAllComplaints = async (req, res) => {
  try {
    const [complaints] = await db.query(
      `SELECT
         c.id,
         c.department_id,
         c.complaint_number,
         c.title,
         c.description,
         c.priority,
         c.status,
         c.address,
         c.latitude,
         c.longitude,
         c.created_at,
         c.updated_at,
         c.resolved_at,
         cc.name AS category,
         u.full_name AS citizen_name,
         u.email AS citizen_email,
         admin_user.full_name AS assigned_admin_name
       FROM complaints c
       INNER JOIN citizens citizen
         ON citizen.id = c.citizen_id
       INNER JOIN users u
         ON u.id = citizen.user_id
       INNER JOIN complaint_categories cc
         ON cc.id = c.category_id
       LEFT JOIN admins assigned_admin
         ON assigned_admin.id = c.assigned_admin_id
       LEFT JOIN users admin_user
         ON admin_user.id = assigned_admin.user_id
       ORDER BY c.created_at DESC, c.id DESC`
    );

    return res.status(200).json({
      complaints,
      total: complaints.length,
    });
  } catch (error) {
    console.error("Get all complaints error:", error.message);

    return res.status(500).json({
      message: "Unable to load complaints",
    });
  }
};

// Create a complaint for the authenticated citizen.
// POST /api/complaints
exports.createComplaint = async (req, res) => {
  let connection;
  let transactionStarted = false;

  try {
    connection = await db.getConnection();

    const userId = req.user.id;

    const {
      title,
      description,
      categoryId,
      departmentId,
      priority = "MEDIUM",
      address = null,
      latitude = null,
      longitude = null,
    } = req.body || {};

    // Validate title.
    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 150
    ) {
      return res.status(400).json({
        message: "Title is required and must not exceed 150 characters",
      });
    }

    // Validate description.
    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.trim().length > 10000
    ) {
      return res.status(400).json({
        message:
          "Description is required and must not exceed 10000 characters",
      });
    }

    // Validate category ID.
    const parsedCategoryId = Number(categoryId);

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      return res.status(400).json({
        message: "A valid complaint category is required",
      });
    }

    // Validate department ID.
    const parsedDepartmentId = Number(departmentId);

    if (!Number.isInteger(parsedDepartmentId) || parsedDepartmentId <= 0) {
      return res.status(400).json({
        message: "A valid department is required",
      });
    }

    // Validate priority.
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    if (
      typeof priority !== "string" ||
      !allowedPriorities.includes(priority.toUpperCase())
    ) {
      return res.status(400).json({
        message: "Priority must be LOW, MEDIUM, HIGH, or URGENT",
      });
    }

    // Validate address.
    if (
      address !== null &&
      (typeof address !== "string" || address.trim().length > 500)
    ) {
      return res.status(400).json({
        message: "Address must not exceed 500 characters",
      });
    }

    // Validate coordinates.
    const parsedLatitude =
      latitude === null || latitude === "" ? null : Number(latitude);

    const parsedLongitude =
      longitude === null || longitude === "" ? null : Number(longitude);

    if (
      (parsedLatitude !== null &&
        (!Number.isFinite(parsedLatitude) ||
          parsedLatitude < -90 ||
          parsedLatitude > 90)) ||
      (parsedLongitude !== null &&
        (!Number.isFinite(parsedLongitude) ||
          parsedLongitude < -180 ||
          parsedLongitude > 180))
    ) {
      return res.status(400).json({
        message: "Invalid latitude or longitude",
      });
    }

    if ((parsedLatitude === null) !== (parsedLongitude === null)) {
      return res.status(400).json({
        message: "Provide both latitude and longitude, or neither",
      });
    }

    // Start transaction.
    await connection.beginTransaction();
    transactionStarted = true;

    // Resolve the authenticated user to their citizen profile.
    const [citizens] = await connection.query(
      `SELECT id
       FROM citizens
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (citizens.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "Citizen profile not found. Please contact support.",
      });
    }

    // Verify the selected department belongs to the selected active category.
    const [categoryDepartmentRows] = await connection.query(
      `SELECT cc.id
       FROM complaint_categories cc
       INNER JOIN complaint_category_departments ccd
         ON ccd.category_id = cc.id
       INNER JOIN departments d
         ON d.id = ccd.department_id
       WHERE cc.id = ?
         AND ccd.department_id = ?
         AND cc.is_active = TRUE
         AND d.is_active = TRUE
       LIMIT 1`,
      [parsedCategoryId, parsedDepartmentId]
    );

    if (categoryDepartmentRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "Selected department is not available for this category",
      });
    }

    // Generate a unique public reference.
    const complaintNumber = `US-${Date.now()}-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    const normalizedPriority = priority.toUpperCase();

    // Save the complaint with the citizen's selected department.
    const [result] = await connection.query(
      `INSERT INTO complaints (
         complaint_number,
         citizen_id,
         category_id,
         department_id,
         title,
         description,
         priority,
         status,
         address,
         latitude,
         longitude
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?, ?)`,
      [
        complaintNumber,
        citizens[0].id,
        parsedCategoryId,
        parsedDepartmentId,
        title.trim(),
        description.trim(),
        normalizedPriority,
        address?.trim() || null,
        parsedLatitude,
        parsedLongitude,
      ]
    );

    // Record the initial complaint status.
    await connection.query(
      `INSERT INTO complaint_status_history (
         complaint_id,
         previous_status,
         new_status,
         changed_by_user_id,
         note
       )
       VALUES (?, NULL, 'SUBMITTED', ?, ?)`,
      [result.insertId, userId, "Complaint submitted"]
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      message: "Complaint submitted successfully",
      complaint: {
        id: result.insertId,
        complaintNumber,
        title: title.trim(),
        categoryId: parsedCategoryId,
        departmentId: parsedDepartmentId,
        priority: normalizedPriority,
        status: "SUBMITTED",
      },
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Complaint transaction rollback error:",
          rollbackError.message
        );
      }
    }

    console.error("Create complaint error:", error.message);

    return res.status(500).json({
      message: "Unable to submit complaint",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Update complaint status (ADMIN only)
exports.updateComplaintStatus = async (req, res) => {
  const complaintId = Number(req.params.complaintId);
  const { status, note } = req.body || {};

  const allowedStatuses = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "ASSIGNED",
    "IN_PROGRESS",
    "RESOLVED",
    "REJECTED",
    "REOPENED",
  ];

  if (!Number.isSafeInteger(complaintId) || complaintId <= 0) {
    return res.status(400).json({ message: "Invalid complaint ID." });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid complaint status." });
  }

  if (
    note !== undefined &&
    (typeof note !== "string" || note.length > 1000)
  ) {
    return res.status(400).json({
      message: "The note must be under 1000 characters.",
    });
  }

  let connection;
  let transactionStarted = false;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [rows] = await connection.query(
      "SELECT id, status FROM complaints WHERE id = ? FOR UPDATE",
      [complaintId]
    );

    if (!rows.length) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({ message: "Complaint not found." });
    }

    const previousStatus = rows[0].status;

    if (previousStatus === status) {
      await connection.commit();
      transactionStarted = false;

      return res.status(200).json({
        message: "Complaint already has this status.",
        complaint: { id: complaintId, status },
      });
    }

    await connection.query(
      `UPDATE complaints
       SET status = ?,
           resolved_at = CASE
             WHEN ? = 'RESOLVED' THEN CURRENT_TIMESTAMP
             ELSE NULL
           END
       WHERE id = ?`,
      [status, status, complaintId]
    );

    await connection.query(
      `INSERT INTO complaint_status_history
       (complaint_id, previous_status, new_status, changed_by_user_id, note)
       VALUES (?, ?, ?, ?, ?)`,
      [
        complaintId,
        previousStatus,
        status,
        req.user.id,
        typeof note === "string" && note.trim() ? note.trim() : null,
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(200).json({
      message: "Complaint status updated successfully.",
      complaint: {
        id: complaintId,
        previousStatus,
        status,
      },
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Complaint status rollback failed:", rollbackError);
      }
    }

    console.error("Update complaint status error:", error);

    return res.status(500).json({
      message: "Unable to update complaint status.",
    });
  } finally {
    if (connection) connection.release();
  }
};

// List complaints assigned to the logged-in employee's department.
exports.getDepartmentComplaints = async (req, res) => {
  try {
    // Find the employee's active department assignment.
    const [employeeRows] = await db.query(
      `SELECT
         e.department_id,
         d.name AS department_name
       FROM employees e
       INNER JOIN departments d
         ON d.id = e.department_id
       INNER JOIN users u
         ON u.id = e.user_id
       WHERE e.user_id = ?
         AND e.is_active = 1
         AND d.is_active = 1
         AND u.role = 'EMPLOYEE'
         AND u.status = 'ACTIVE'
       LIMIT 1`,
      [req.user.id]
    );

    if (employeeRows.length === 0) {
      return res.status(403).json({
        message: "No active employee department assignment found.",
      });
    }

    const employee = employeeRows[0];

    // Return only complaints belonging to this employee's department.
    const [complaints] = await db.query(
      `SELECT
         c.id,
         c.department_id,
         c.complaint_number,
         c.title,
         c.description,
         c.priority,
         c.status,
         c.address,
         c.latitude,
         c.longitude,
         cc.name AS category,
         c.created_at,
         c.updated_at,
         c.resolved_at,
         COALESCE(
           (
             SELECT JSON_ARRAYAGG(
               JSON_OBJECT(
                 'id', ca.id,
                 'mime_type', ca.mime_type
               )
             )
             FROM complaint_attachments ca
             WHERE ca.complaint_id = c.id
           ),
           JSON_ARRAY()
         ) AS attachments
       FROM complaints c
       INNER JOIN complaint_categories cc
         ON cc.id = c.category_id
       WHERE c.department_id = ?
       ORDER BY c.created_at DESC, c.id DESC`,
      [employee.department_id]
    );

    return res.status(200).json({
      department: {
        id: Number(employee.department_id),
        name: employee.department_name,
      },
      complaints,
      total: complaints.length,
    });
  } catch (error) {
    console.error("Get department complaints error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve department complaints.",
    });
  }
};

// Update complaint status by an employee assigned to its department.
exports.updateDepartmentComplaintStatus = async (req, res) => {
  const complaintId = Number(req.params.complaintId);
  const { status, note } = req.body || {};

  const allowedStatuses = [
    "UNDER_REVIEW",
    "IN_PROGRESS",
    "RESOLVED",
    "REJECTED",
  ];

  if (!Number.isSafeInteger(complaintId) || complaintId <= 0) {
    return res.status(400).json({ message: "Invalid complaint ID." });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid employee complaint status.",
    });
  }

  if (
    note !== undefined &&
    (typeof note !== "string" || note.length > 1000)
  ) {
    return res.status(400).json({
      message: "The note must be under 1000 characters.",
    });
  }

  let connection;
  let transactionStarted = false;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    // Verify the employee still has an active department assignment.
    const [employeeRows] = await connection.query(
      `SELECT e.department_id
       FROM employees e
       INNER JOIN departments d ON d.id = e.department_id
       INNER JOIN users u ON u.id = e.user_id
       WHERE e.user_id = ?
         AND e.is_active = 1
         AND d.is_active = 1
         AND u.role = 'EMPLOYEE'
         AND u.status = 'ACTIVE'
       LIMIT 1`,
      [req.user.id]
    );

    if (employeeRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(403).json({
        message: "No active employee department assignment found.",
      });
    }

    const departmentId = employeeRows[0].department_id;

    // Lock the complaint while checking its department and updating it.
    const [complaintRows] = await connection.query(
      `SELECT id, status, department_id
       FROM complaints
       WHERE id = ?
       FOR UPDATE`,
      [complaintId]
    );

    if (complaintRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        message: "Complaint not found.",
      });
    }

    const complaint = complaintRows[0];

    // Employees cannot update complaints belonging to another department.
    if (Number(complaint.department_id) !== Number(departmentId)) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(403).json({
        message: "You cannot update complaints assigned to another department.",
      });
    }

    const previousStatus = complaint.status;

    if (previousStatus === status) {
      await connection.commit();
      transactionStarted = false;

      return res.status(200).json({
        message: "Complaint already has this status.",
        complaint: { id: complaintId, status },
      });
    }

    await connection.query(
      `UPDATE complaints
       SET status = ?,
           resolved_at = CASE
             WHEN ? = 'RESOLVED' THEN CURRENT_TIMESTAMP
             ELSE NULL
           END
       WHERE id = ?`,
      [status, status, complaintId]
    );

    await connection.query(
      `INSERT INTO complaint_status_history
       (complaint_id, previous_status, new_status, changed_by_user_id, note)
       VALUES (?, ?, ?, ?, ?)`,
      [
        complaintId,
        previousStatus,
        status,
        req.user.id,
        typeof note === "string" && note.trim() ? note.trim() : null,
      ]
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(200).json({
      message: "Complaint status updated successfully.",
      complaint: {
        id: complaintId,
        previousStatus,
        status,
      },
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Employee status rollback failed:", rollbackError);
      }
    }

    console.error("Employee complaint status update error:", error);

    return res.status(500).json({
      message: "Unable to update complaint status.",
    });
  } finally {
    if (connection) connection.release();
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
         SUM(
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
         ) AS active_complaints,
         SUM(
           CASE
             WHEN c.status = 'RESOLVED'
             THEN 1 ELSE 0
           END
         ) AS resolved_complaints
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