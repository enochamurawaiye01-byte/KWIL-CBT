const courseService = require("../services/course.service");

const createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body);

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

const getCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getCourses();

    return res.status(200).json({
      success: true,
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

const activateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourseStatus(
      req.params.id,
      true
    );

    return res.status(200).json({
      success: true,
      message: "Course activated successfully",
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

const deactivateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourseStatus(
      req.params.id,
      false
    );

    return res.status(200).json({
      success: true,
      message: "Course deactivated successfully",
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    await courseService.deleteCourse(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  activateCourse,
  deactivateCourse,
  deleteCourse,
};