const resultService = require("../services/results.service");

const getAllResults = async (req, res) => {
  try {
    const {
      search,
      examId,
      courseId,
      status,
    } = req.query;

    const results = await resultService.getAllResults({
      search,
      examId,
      courseId,
      status,
    });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Get all results error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getResultById = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await resultService.getResultById(
      resultId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get result error:", error);

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;

    const data = await resultService.getStudentResults(
      studentId
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get student results error:", error);

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllResults,
  getResultById,
  getStudentResults,
};