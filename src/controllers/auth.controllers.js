const authService = require("../services/auth.service");

const registerStudent = async (req, res, next) => {
  try {
    const student = await authService.registerStudent(req.body);

    return res.status(201).json({
      success: true,
      message: "Student registration successful",
      registrationNumber: student.registrationNumber,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};
const loginStudent = async (req, res, next) => {

  try {

    const result = await authService.loginStudent(req.body);

    return res.status(200).json({

      success: true,

      message: "Login successful",

      data: result,

    });

  } catch (error) {

    next(error);

  }

};

const loginAdmin = async (req, res, next) => {
  try {
    const result = await authService.loginAdmin(req.body);

    return res.status(200).json({
      success: true,
      message: "Admin login successful",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  loginAdmin
};