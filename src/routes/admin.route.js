const express = require("express");
const adminController = require("../controllers/admin.controllers");
const authenticate = require("../middleware/auth.middlewares");
const authorize = require("../middleware/role.middlewares");

const router = express.Router();

router.get(
	"/dashboard",
	authenticate,
	authorize("ADMIN"),
	adminController.getDashboardStats
);

module.exports = router;
