const prisma = require("../config/database");

const createCourse = async ({
  name,
  code,
  description,
  duration,
}) => {
  const existingCourse = await prisma.course.findUnique({
    where: {
      code,
    },
  });

  if (existingCourse) {
    const error = new Error(
      "A course with this code already exists"
    );

    error.statusCode = 409;
    throw error;
  }

  return await prisma.course.create({
    data: {
      name,
      code,
      description,
      duration,
    },
  });
};

const getCourses = async () => {
  return await prisma.course.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getCourseById = async (id) => {
  const course = await prisma.course.findUnique({
    where: {
      id,
    },
  });

  if (!course) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }

  return course;
};

const updateCourse = async (
  id,
  {
    name,
    code,
    description,
    duration,
  }
) => {
  const course = await getCourseById(id);

  if (code && code !== course.code) {
    const existingCourse = await prisma.course.findUnique({
      where: {
        code,
      },
    });

    if (existingCourse) {
      const error = new Error(
        "A course with this code already exists"
      );

      error.statusCode = 409;
      throw error;
    }
  }

  return await prisma.course.update({
    where: {
      id,
    },
    data: {
      ...(name !== undefined && { name }),
      ...(code !== undefined && { code }),
      ...(description !== undefined && { description }),
      ...(duration !== undefined && { duration }),
    },
  });
};

const updateCourseStatus = async (id, isActive) => {
  await getCourseById(id);

  return await prisma.course.update({
    where: {
      id,
    },
    data: {
      isActive,
    },
  });
};

const deleteCourse = async (id) => {
  await getCourseById(id);

  return await prisma.course.delete({
    where: {
      id,
    },
  });
};

module.exports = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
};