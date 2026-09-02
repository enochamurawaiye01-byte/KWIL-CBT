const express = require("express");

const {
  getAvailableExams,
  startExam,
  getExamQuestions,
  saveAnswer,       
  submitExam
} = require("../controllers/examSession.controllers");
const authenticate = require("../middleware/auth.middlewares");
const authorize = require("../middleware/role.middlewares");

const router = express.Router();

router.get(
  "/available",
  authenticate,
  authorize("STUDENT"),
  getAvailableExams
);

router.post(
  "/:examId/start",
  authenticate,
  authorize("STUDENT"),
  startExam
);

router.get(
  "/:sessionId/questions",
  authenticate,
  authorize("STUDENT"),
  getExamQuestions
);

router.post(
  "/:sessionId/answers",
  authenticate,
  authorize("STUDENT"),
  saveAnswer
);
router.post(
  "/:sessionId/submit",
  authenticate,
  authorize("STUDENT"),
  submitExam
);

module.exports = router;