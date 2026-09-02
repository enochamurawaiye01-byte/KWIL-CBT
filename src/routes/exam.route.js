const express = require("express");

const router = express.Router();

const examController = require("../controllers/exam.controllers");

const authenticate = require("../middleware/auth.middlewares");
const authorize = require("../middleware/role.middlewares");


// Get all exams
router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  examController.getAllExams
);


// Get single exam
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  examController.getExamById
);


// Create exam
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  examController.createExam
);


// Update exam
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  examController.updateExam
);


// Publish exam
router.patch(
  "/:id/publish",
  authenticate,
  authorize("ADMIN"),
  examController.publishExam
);


// Close exam
router.patch(
  "/:id/close",
  authenticate,
  authorize("ADMIN"),
  examController.closeExam
);


// Delete exam
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  examController.deleteExam
);


module.exports = router;