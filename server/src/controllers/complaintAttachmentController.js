
const db = require("../config/db");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { fileTypeFromBuffer } = require("file-type");

const UPLOAD_DIR = path.resolve(
  process.cwd(),
  "uploads",
  "complaints"
);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// POST /api/complaints/:complaintId/attachments
exports.uploadAttachments = async (req, res) => {
  const files = req.files || [];
  const complaintId = Number(req.params.complaintId);

  let connection;
  let transactionStarted = false;
  const savedFiles = [];

  try {
    if (!Number.isSafeInteger(complaintId) || complaintId <= 0) {
      return res.status(400).json({ message: "Invalid complaint ID" });
    }

    if (files.length === 0) {
      return res.status(400).json({
        message: "Select at least one image",
      });
    }

    // Validate file size, declared MIME type, and actual file contents.
    const validatedFiles = [];

    for (const file of files) {
      if (
        !ALLOWED_TYPES.has(file.mimetype) ||
        file.size > MAX_FILE_SIZE
      ) {
        return res.status(400).json({
          message: "Only JPG, PNG, and WebP images up to 5 MB are allowed",
        });
      }

      const detected = await fileTypeFromBuffer(file.buffer);

      if (!detected || !ALLOWED_TYPES.has(detected.mime)) {
        return res.status(400).json({
          message: "An uploaded file is not a supported image",
        });
      }

      validatedFiles.push({
        buffer: file.buffer,
        mimeType: detected.mime,
        size: file.size,
      });
    }

    connection = await db.getConnection();

    // Confirm that the authenticated citizen owns this complaint.
    const [complaints] = await connection.query(
      `SELECT c.id
       FROM complaints c
       JOIN citizens ci ON ci.id = c.citizen_id
       WHERE c.id = ? AND ci.user_id = ?
       LIMIT 1`,
      [complaintId, req.user.id]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const attachmentRecords = validatedFiles.map((file) => ({
      fileName: `${crypto.randomUUID()}${EXTENSIONS[file.mimeType]}`,
      mimeType: file.mimeType,
      size: file.size,
      buffer: file.buffer,
    }));

    // Save images using generated filenames.
    for (const file of attachmentRecords) {
      const fullPath = path.join(UPLOAD_DIR, file.fileName);

      await fs.writeFile(fullPath, file.buffer, { flag: "wx" });
      savedFiles.push(fullPath);
    }

    await connection.beginTransaction();
    transactionStarted = true;

    const attachments = [];

    for (const file of attachmentRecords) {
      const storagePath = path.relative(
        process.cwd(),
        path.join(UPLOAD_DIR, file.fileName)
      );

      const [result] = await connection.query(
        `INSERT INTO complaint_attachments
          (complaint_id, file_name, storage_path, mime_type, file_size_bytes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          complaintId,
          file.fileName,
          storagePath,
          file.mimeType,
          file.size,
        ]
      );

      attachments.push({
        id: result.insertId,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
      });
    }

    await connection.commit();
    transactionStarted = false;

    return res.status(201).json({
      message: "Complaint images uploaded successfully",
      attachments,
    });
  } catch (error) {
    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Attachment rollback error:", rollbackError.message);
      }
    }

    // Remove saved files if the operation failed.
    await Promise.all(
      savedFiles.map((filePath) =>
        fs.unlink(filePath).catch(() => {})
      )
    );

    if (
      error.code === "LIMIT_FILE_SIZE" ||
      error.code === "LIMIT_FILE_COUNT"
    ) {
      return res.status(400).json({
        message: "Upload up to 3 images, each no larger than 5 MB",
      });
    }

    console.error("Upload attachments error:", error.message);

    return res.status(500).json({
      message: "Unable to upload complaint images",
    });
  } finally {
    if (connection) connection.release();
  }
};

// GET /api/complaints/:complaintId/attachments/:attachmentId
exports.getAttachment = async (req, res) => {
  try {
    const complaintId = Number(req.params.complaintId);
    const attachmentId = Number(req.params.attachmentId);

    if (
      !Number.isSafeInteger(complaintId) ||
      complaintId <= 0 ||
      !Number.isSafeInteger(attachmentId) ||
      attachmentId <= 0
    ) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const [rows] = await db.query(
      `SELECT
         ca.id,
         ca.storage_path,
         ca.mime_type,
         ci.user_id AS citizen_user_id
       FROM complaint_attachments ca
       JOIN complaints c ON c.id = ca.complaint_id
       JOIN citizens ci ON ci.id = c.citizen_id
       WHERE c.id = ? AND ca.id = ?
       LIMIT 1`,
      [complaintId, attachmentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Image not found",
      });
    }

    const attachment = rows[0];

    // Citizens can only view their own complaint images.
    // Admins must still authenticate through the route middleware.
    // Citizens can only view their own complaint images.
if (
  req.user.role === "CITIZEN" &&
  Number(attachment.citizen_user_id) !== Number(req.user.id)
) {
  return res.status(404).json({
    message: "Image not found",
  });
}

// Employees can only view images for complaints assigned
// to their active department.
if (req.user.role === "EMPLOYEE") {
  const [employeeRows] = await db.query(
    `SELECT e.department_id
     FROM employees e
     INNER JOIN departments d ON d.id = e.department_id
     INNER JOIN users u ON u.id = e.user_id
     INNER JOIN complaints c ON c.department_id = d.id
     WHERE e.user_id = ?
       AND c.id = ?
       AND e.is_active = 1
       AND d.is_active = 1
       AND u.role = 'EMPLOYEE'
       AND u.status = 'ACTIVE'
     LIMIT 1`,
    [req.user.id, complaintId]
  );

  if (employeeRows.length === 0) {
    return res.status(404).json({
      message: "Image not found",
    });
  }
}

    if (!ALLOWED_TYPES.has(attachment.mime_type)) {
      return res.status(404).json({
        message: "Image not found",
      });
    }

    const filePath = path.resolve(
      process.cwd(),
      attachment.storage_path
    );

    // Prevent stored paths from escaping the upload directory.
    if (!filePath.startsWith(UPLOAD_DIR + path.sep)) {
      return res.status(404).json({
        message: "Image not found",
      });
    }

    await fs.access(filePath);

    res.set({
      "Content-Type": attachment.mime_type,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    });

    return res.sendFile(filePath, (error) => {
      if (error && !res.headersSent) {
        res.status(404).json({
          message: "Image not found",
        });
      }
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(404).json({
        message: "Image not found",
      });
    }

    console.error("Get attachment error:", error.message);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Unable to retrieve complaint image",
      });
    }
  }
};
