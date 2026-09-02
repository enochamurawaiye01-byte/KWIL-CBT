const express = require("express");

const router = express.Router();

const questionController = require("../controllers/question.controller");

const authenticate = require("../middleware/auth.middlewares");
const authorize = require("../middleware/role.middlewares");

router.post(
  "/exam/:examId/bulk",

  authenticate,

  authorize("ADMIN"),

  questionController.bulkCreateQuestions

);

// Get all questions belonging to an exam
router.get(
  "/exam/:examId",
  authenticate,
  authorize("ADMIN"),
  questionController.getQuestionsByExam
);


// Get one question
router.get(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  questionController.getQuestionById
);


// Create question
router.post(
  "/exam/:examId",
  authenticate,
  authorize("ADMIN"),
  questionController.createQuestion
);


// Update question
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  questionController.updateQuestion
);


// Delete question
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  questionController.deleteQuestion
);


module.exports = router;