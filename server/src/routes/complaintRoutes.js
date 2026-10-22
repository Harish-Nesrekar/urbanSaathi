
const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const complaintController = require("../controllers/complaintController");
const attachmentController = require("../controllers/complaintAttachmentController");

router.get(
  "/categories",
  authenticateToken,
  complaintController.getCategories
);

router.get(
  "/my",
  authenticateToken,
  authorizeRoles("CITIZEN"),
  complaintController.getMyComplaints
);
router.get(
  "/department",
  authenticateToken,
  authorizeRoles("EMPLOYEE"),
  complaintController.getDepartmentComplaints
);

router.get(
  "/:complaintId",
  authenticateToken,
  complaintController.getComplaintDetails
);
router.get(
  "/:complaintId/attachments/:attachmentId",
  authenticateToken,
  authorizeRoles("CITIZEN", "ADMIN", "EMPLOYEE"),
  attachmentController.getAttachment
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("CITIZEN"),
  complaintController.createComplaint
);

router.get(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  complaintController.getAllComplaints
);

router.post(
  "/:complaintId/attachments",
  authenticateToken,
  authorizeRoles("CITIZEN"),
  upload.array("images", 3),
  attachmentController.uploadAttachments
);


router.get(
  "/:complaintId/attachments/:attachmentId",
  authenticateToken,
  authorizeRoles("CITIZEN", "ADMIN"),
  attachmentController.getAttachment
);
router.patch(
  "/:complaintId/status",
  authenticateToken,
  authorizeRoles("ADMIN"),
  complaintController.updateComplaintStatus
);
router.patch(
  "/department/:complaintId/status",
  authenticateToken,
  authorizeRoles("EMPLOYEE"),
  complaintController.updateDepartmentComplaintStatus
);

router.patch(
  "/:complaintId/status",
  authenticateToken,
  authorizeRoles("ADMIN"),
  complaintController.updateComplaintStatus
);

module.exports = router;
