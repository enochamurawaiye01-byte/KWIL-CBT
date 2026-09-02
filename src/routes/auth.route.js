const express = require("express");

const authController = require("../controllers/auth.controllers");
const validate = require("../middleware/validate.middlewares");

const {
  studentRegistrationSchema,
  studentLoginSchema,
  adminLoginSchema
} = require("../validators/auth.validator");

const router = express.Router();

router.post(
  "/student/register",
  validate(studentRegistrationSchema),
  authController.registerStudent
);
router.post(
  "/student/login",
  validate(studentLoginSchema),
  authController.loginStudent
);
router.post(
  "/admin/login",
  validate(adminLoginSchema),
  authController.loginAdmin
);

module.exports = router;