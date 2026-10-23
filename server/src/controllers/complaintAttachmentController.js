
const db = require("../config/db");
const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { fileTypeFromBuffer } = require("file-type");
const ImageKit = require("imagekit");
const ImageKitClient = require("@imagekit/nodejs");

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "complaints");
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

// Existing SDK: uploads and file deletion.
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// New SDK: generate signed URLs for private image delivery.
const imagekitClient = new ImageKitClient({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

function readStorageRecord(storagePath) {
  try {
    const value = JSON.parse(storagePath);

    if (
      value?.provider === "imagekit" &&
      typeof value.fileId === "string" &&
      typeof value.filePath === "string"
    ) {
      return value;
    }
  } catch {
    // Existing local-disk records are supported below.
  }

  return null;
}

// POST /api/complaints/:complaintId/attachments
exports.uploadAttachments = async (req, res) => {
  const files = req.files || [];
  const complaintId = Number(req.params.complaintId);

  let connection;
  let transactionStarted = false;
  const uploadedFiles = [];

  try {
    if (!Number.isSafeInteger(complaintId) || complaintId <= 0) {
      return res.status(400).json({
        message: "Invalid complaint ID",
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        message: "Select at least one image",
      });
    }

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

      // Verify actual file contents, not only the supplied MIME type.
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

    // Only the citizen who owns the complaint can upload attachments.
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

    const attachmentRecords = [];

    for (const file of validatedFiles) {
      const fileName =
        `${crypto.randomUUID()}${EXTENSIONS[file.mimeType]}`;

      const result = await imagekit.upload({
        file: file.buffer,
        fileName,
        folder: "/urban-sathi/complaints",
        isPrivateFile: true,
      });

      uploadedFiles.push(result.fileId);

      attachmentRecords.push({
        fileName,
        mimeType: file.mimeType,
        size: file.size,
        storagePath: JSON.stringify({
          provider: "imagekit",
          fileId: result.fileId,
          filePath: result.filePath,
        }),
      });
    }

    await connection.beginTransaction();
    transactionStarted = true;

    const attachments = [];

    for (const file of attachmentRecords) {
      const [result] = await connection.query(
        `INSERT INTO complaint_attachments
          (complaint_id, file_name, storage_path, mime_type, file_size_bytes)
         VALUES (?, ?, ?, ?, ?)`,
        [
          complaintId,
          file.fileName,
          file.storagePath,
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
        console.error(
          "Attachment rollback error:",
          rollbackError.message
        );
      }
    }

    // Remove uploaded cloud files if the operation failed.
    await Promise.all(
      uploadedFiles.map((fileId) =>
        imagekit.deleteFile(fileId).catch((cleanupError) => {
          console.error(
            "ImageKit cleanup error:",
            cleanupError.message
          );
        })
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
      return res.status(400).json({
        message: "Invalid ID",
      });
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

    // Citizens can access only images attached to their own complaints.
    if (
      req.user.role === "CITIZEN" &&
      Number(attachment.citizen_user_id) !== Number(req.user.id)
    ) {
      return res.status(404).json({
        message: "Image not found",
      });
    }

    // Employees must be active and belong to the complaint's department.
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

    const cloudFile = readStorageRecord(attachment.storage_path);

    if (cloudFile) {
      // Generate a signed URL using the newer ImageKit SDK.
      const signedUrl = imagekitClient.helper.buildSrc({
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
        src: cloudFile.filePath,
        signed: true,
      });

      const imageResponse = await fetch(signedUrl);

      if (!imageResponse.ok) {
        // Log the upstream status for debugging without exposing
        // signed URLs or credentials.
        console.error(
          "ImageKit image delivery failed:",
          imageResponse.status
        );

        return res.status(502).json({
          message: "Unable to retrieve complaint image from storage",
        });
      }

      const imageBuffer = Buffer.from(
        await imageResponse.arrayBuffer()
      );

      res.set({
        "Content-Type": attachment.mime_type,
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      });

      return res.status(200).send(imageBuffer);
    }

    // Backward compatibility for attachments saved on local disk.
    const filePath = path.resolve(
      process.cwd(),
      attachment.storage_path
    );

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
