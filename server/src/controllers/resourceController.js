
const db = require("../config/db");

// GET /api/admin/resources
const getResources = async (req, res) => {
  try {
    const { search = "", type = "ALL", status = "ALL", condition = "ALL" } =
      req.query;

    let sql = `
      SELECT
        id,
        resource_name AS resourceName,
        resource_type AS resourceType,
        description,
        address,
        latitude,
        longitude,
        condition_status AS conditionStatus,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM city_resources
      WHERE 1 = 1
    `;

    const params = [];

    if (search.trim()) {
      sql += ` AND (
        resource_name LIKE ?
        OR address LIKE ?
        OR description LIKE ?
      )`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (type !== "ALL") {
      sql += " AND resource_type = ?";
      params.push(type);
    }

    if (status !== "ALL") {
      sql += " AND status = ?";
      params.push(status);
    }

    if (condition !== "ALL") {
      sql += " AND condition_status = ?";
      params.push(condition);
    }

    sql += " ORDER BY created_at DESC";

    const [resources] = await db.execute(sql, params);

    return res.status(200).json({
      success: true,
      resources,
    });
  } catch (error) {
    console.error("Get resources error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch city resources",
    });
  }
};

// POST /api/admin/resources
const createResource = async (req, res) => {
  try {
    const {
      resourceName,
      resourceType = "OTHER",
      description = "",
      address,
      latitude = null,
      longitude = null,
      conditionStatus = "GOOD",
      status = "ACTIVE",
    } = req.body;

    const validTypes = [
      "ROAD",
      "STREETLIGHT",
      "WATER_SUPPLY",
      "DRAINAGE",
      "WASTE_BIN",
      "PUBLIC_FACILITY",
      "OTHER",
    ];

    const validConditions = [
      "GOOD",
      "NEEDS_MAINTENANCE",
      "DAMAGED",
    ];

    if (
      typeof resourceName !== "string" ||
      !resourceName.trim() ||
      !address ||
      typeof address !== "string" ||
      !address.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Resource name and address are required",
      });
    }

    if (!validTypes.includes(resourceType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource type",
      });
    }

    if (!validConditions.includes(conditionStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid condition",
      });
    }

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource status",
      });
    }

    const validCoordinate = (value, min, max) =>
      value === null ||
      value === "" ||
      (Number.isFinite(Number(value)) &&
        Number(value) >= min &&
        Number(value) <= max);

    if (
      !validCoordinate(latitude, -90, 90) ||
      !validCoordinate(longitude, -180, 180)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid GPS coordinates",
      });
    }

    const lat =
      latitude === null || latitude === "" ? null : Number(latitude);
    const lng =
      longitude === null || longitude === "" ? null : Number(longitude);

    const createdBy = req.user?.id ?? null;

    const [result] = await db.execute(
      `INSERT INTO city_resources
       (resource_name, resource_type, description, address,
        latitude, longitude, condition_status, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resourceName.trim(),
        resourceType,
        description,
        address.trim(),
        lat,
        lng,
        conditionStatus,
        status,
        createdBy,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "City resource created successfully",
      resourceId: result.insertId,
    });
  } catch (error) {
    console.error("Create resource error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create city resource",
    });
  }
};

// PATCH /api/admin/resources/:id
const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      resourceName,
      resourceType,
      description,
      address,
      latitude,
      longitude,
      conditionStatus,
      status,
    } = req.body;

    const [existing] = await db.execute(
      "SELECT id FROM city_resources WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "City resource not found",
      });
    }

    const validTypes = [
      "ROAD",
      "STREETLIGHT",
      "WATER_SUPPLY",
      "DRAINAGE",
      "WASTE_BIN",
      "PUBLIC_FACILITY",
      "OTHER",
    ];

    const validConditions = ["GOOD", "NEEDS_MAINTENANCE", "DAMAGED"];
    const validStatuses = ["ACTIVE", "INACTIVE"];

    if (
      resourceType !== undefined &&
      !validTypes.includes(resourceType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource type",
      });
    }

    if (
      conditionStatus !== undefined &&
      !validConditions.includes(conditionStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid condition",
      });
    }

    if (status !== undefined && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource status",
      });
    }

    if (
      latitude !== undefined &&
      latitude !== null &&
      latitude !== "" &&
      (!Number.isFinite(Number(latitude)) ||
        Number(latitude) < -90 ||
        Number(latitude) > 90)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude",
      });
    }

    if (
      longitude !== undefined &&
      longitude !== null &&
      longitude !== "" &&
      (!Number.isFinite(Number(longitude)) ||
        Number(longitude) < -180 ||
        Number(longitude) > 180)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude",
      });
    }

    const fields = {
      resource_name: resourceName,
      resource_type: resourceType,
      description,
      address,
      latitude:
        latitude === "" ? null :
        latitude === undefined ? undefined :
        latitude === null ? null : Number(latitude),
      longitude:
        longitude === "" ? null :
        longitude === undefined ? undefined :
        longitude === null ? null : Number(longitude),
      condition_status: conditionStatus,
      status,
    };

    const updates = [];
    const params = [];

    for (const [column, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${column} = ?`);
        params.push(
          typeof value === "string" &&
            ["resource_name", "address"].includes(column)
            ? value.trim()
            : value
        );
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    if (
      resourceName !== undefined &&
      (typeof resourceName !== "string" || !resourceName.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Resource name cannot be empty",
      });
    }

    if (
      address !== undefined &&
      (typeof address !== "string" || !address.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Address cannot be empty",
      });
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(id);

    await db.execute(
      `UPDATE city_resources SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    return res.status(200).json({
      success: true,
      message: "City resource updated successfully",
    });
  } catch (error) {
    console.error("Update resource error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update city resource",
    });
  }
};

module.exports = {
  getResources,
  createResource,
  updateResource,
};
