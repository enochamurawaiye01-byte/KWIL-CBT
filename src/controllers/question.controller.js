const questionService = require("../services/question.service");

 const bulkCreateQuestions = async (req, res) => {
  try {
    const { examId } = req.params;

    const result = await questionService.bulkCreateQuestions(
      examId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Questions imported successfully",
      data: result,
    });
  } catch (error) {
    console.error("Bulk question import error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const createQuestion = async (req, res, next) => {
  try {
    const question = await questionService.createQuestion({
      examId: req.params.examId,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};


const getQuestionsByExam = async (req, res, next) => {
  try {
    const questions = await questionService.getQuestionsByExam(
      req.params.examId
    );

    res.status(200).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    next(error);
  }
};


const getQuestionById = async (req, res, next) => {
  try {
    const question = await questionService.getQuestionById(
      req.params.id
    );

    res.status(200).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
};


const updateQuestion = async (req, res, next) => {
  try {
    const question = await questionService.updateQuestion(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Question updated successfully",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};


const deleteQuestion = async (req, res, next) => {
  try {
    await questionService.deleteQuestion(req.params.id);

    res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
    bulkCreateQuestions,
  createQuestion,
  getQuestionsByExam,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
};