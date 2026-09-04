const express = require("express");
const adminController = require("../controllers/admin.controllers");
const studentController = require("../controllers/student.controllers");
const authenticate = require("../middleware/auth.middlewares");
const authorize = require("../middleware/role.middlewares");

const router = express.Router();

router.get(
	"/dashboard",
	authenticate,
	authorize("ADMIN"),
	adminController.getDashboardStats
);

router.patch(
	"/settings/password",
	authenticate,
	authorize("ADMIN"),
	adminController.changePassword
);

router.get(
	"/reports",
	authenticate,
	authorize("ADMIN"),
	adminController.getReports
);

router.get(
	"/students",
	authenticate,
	authorize("ADMIN"),
	studentController.getAllStudents
);

router.get(
	"/students/:studentId",
	authenticate,
	authorize("ADMIN"),
	studentController.getStudentById
);

module.exports = router;
