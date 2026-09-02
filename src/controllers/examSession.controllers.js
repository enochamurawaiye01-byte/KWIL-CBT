const examSessionService = require("../services/examSession.service.js");

const getAvailableExams = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const exams =
      await examSessionService.getAvailableExams(studentId);

    return res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const startExam = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const { examId } = req.params;

    const session = await examSessionService.startExam(
      studentId,
      examId
    );

    return res.status(201).json({
      success: true,
      message: "Exam started successfully",
      data: session,
    });
  } catch (error) {
    console.error(error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


const getExamQuestions = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const { sessionId } = req.params;

    const data = await examSessionService.getExamQuestions(
      studentId,
      sessionId
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get exam questions error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const saveAnswer = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const { sessionId } = req.params;

    const {
      questionId,
      selectedOptionId,
    } = req.body;

    if (!questionId) {
      return res.status(400).json({
        success: false,
        message: "questionId is required",
      });
    }

    if (!selectedOptionId) {
      return res.status(400).json({
        success: false,
        message: "selectedOptionId is required",
      });
    }

    const answer = await examSessionService.saveAnswer(
      studentId,
      sessionId,
      questionId,
      selectedOptionId
    );

    return res.status(200).json({
      success: true,
      message: "Answer saved successfully",
      data: answer,
    });
  } catch (error) {
    console.error("Save answer error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const submitExam = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const { sessionId } = req.params;

    const result = await examSessionService.submitExam(
      studentId,
      sessionId
    );

    return res.status(200).json({
      success: true,
      message: "Exam submitted successfully",
      data: result,
    });
  } catch (error) {
    console.error("Submit exam error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAvailableExams,
  startExam,
  getExamQuestions,
  saveAnswer,
  submitExam,
};