const examService = require("../services/exam.service");

const createExam = async (req, res, next) => {
  try {
    const exam = await examService.createExam(req.body);

    res.status(201).json({
      success: true,
      message: "Exam created successfully",
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};


const getAllExams = async (req, res, next) => {
  try {
    const exams = await examService.getAllExams();

    res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    next(error);
  }
};


const getExamById = async (req, res, next) => {
  try {
    const exam = await examService.getExamById(req.params.id);

    res.status(200).json({
      success: true,
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};


const updateExam = async (req, res, next) => {
  try {
    const exam = await examService.updateExam(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Exam updated successfully",
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};


const publishExam = async (req, res, next) => {
  try {
    const exam = await examService.publishExam(req.params.id);

    res.status(200).json({
      success: true,
      message: "Exam published successfully",
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};


const closeExam = async (req, res, next) => {
  try {
    const exam = await examService.closeExam(req.params.id);

    res.status(200).json({
      success: true,
      message: "Exam closed successfully",
      data: exam,
    });
  } catch (error) {
    next(error);
  }
};


const deleteExam = async (req, res, next) => {
  try {
    await examService.deleteExam(req.params.id);

    res.status(200).json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  publishExam,
  closeExam,
  deleteExam,
};