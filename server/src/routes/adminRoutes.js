
const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  getOverview,
  createEmployee,
  getDepartments,
  getEmployees,
  getCitizens,
  getCitizenComplaints,
  updateCitizenStatus,
} = require("../controllers/adminController");

const {
  getResources,
  createResource,
  updateResource,
} = require("../controllers/resourceController");

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/overview", getOverview);

router.get("/departments", getDepartments);

router.get("/employees", getEmployees);
router.post("/employees", createEmployee);

// Citizen Management
router.get("/citizens", getCitizens);
router.get("/citizens/:citizenId/complaints", getCitizenComplaints);
router.patch("/citizens/:citizenId/status", updateCitizenStatus);

router.get("/resources", getResources);
router.post("/resources", createResource);
router.patch("/resources/:id", updateResource);

module.exports = router;
