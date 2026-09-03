const adminService = require("../services/admin.service");

const getAllStudents = async (req, res, next) => {
  try {
    const students = await adminService.getAllStudents(req.query.search);

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

const getStudentById = async (req, res, next) => {
  try {
    const student = await adminService.getStudentById(req.params.studentId);

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
};
