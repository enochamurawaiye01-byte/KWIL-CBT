const express = require("express");

const courseController = require("../controllers/course.controllers");

const authenticate = require("../middleware/auth.middlewares");
const authorize = require("../middleware/role.middlewares");

const router = express.Router();

// Anyone authenticated can view courses
router.get(
  "/",
  courseController.getCourses
);

router.get(
  "/:id",
  authenticate,
  courseController.getCourseById
);

// Admin only
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  courseController.createCourse
);

router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  courseController.updateCourse
);

router.patch(
  "/:id/activate",
  authenticate,
  authorize("ADMIN"),
  courseController.activateCourse
);

router.patch(
  "/:id/deactivate",
  authenticate,
  authorize("ADMIN"),
  courseController.deactivateCourse
);

router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  courseController.deleteCourse
);

module.exports = router;