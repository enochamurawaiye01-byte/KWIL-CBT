const prisma = require("../config/database");

const studentSelect = {
  id: true,
  fullName: true,
  registrationNumber: true,
  phoneNumber: true,
  profileImage: true,
  createdAt: true,
  user: {
    select: {
      isActive: true,
    },
  },
  enrollments: {
    where: {
      status: "ACTIVE",
    },
    select: {
      status: true,
      course: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  },
};

const getAllStudents = async (search) => {
  const normalizedSearch = typeof search === "string" ? search.trim() : "";
  const where = normalizedSearch
    ? {
        OR: [
          { fullName: { contains: normalizedSearch, mode: "insensitive" } },
          { registrationNumber: { contains: normalizedSearch, mode: "insensitive" } },
          { phoneNumber: { contains: normalizedSearch, mode: "insensitive" } },
        ],
      }
    : undefined;

  return prisma.student.findMany({
    where,
    select: studentSelect,
    orderBy: { createdAt: "desc" },
  });
};

const getStudentById = async (studentId) => {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: studentSelect,
  });

  if (!student) {
    const error = new Error("Student not found");
    error.statusCode = 404;
    throw error;
  }

  return student;
};

const getDashboardStats = async () => {
  const [totalStudents, totalCourses, activeExams, completedExams, passedResults, totalResults] =
    await Promise.all([
      prisma.student.count(),
      prisma.course.count(),
      prisma.exam.count({
        where: {
          status: "PUBLISHED",
        },
      }),
      prisma.examSession.count({
        where: {
          status: {
            in: ["SUBMITTED", "EXPIRED"],
          },
        },
      }),
      prisma.result.count({
        where: {
          status: "PASS",
        },
      }),
      prisma.result.count(),
    ]);

  return {
    totalStudents,
    totalCourses,
    activeExams,
    completedExams,
    passRate: totalResults > 0
      ? Number(((passedResults / totalResults) * 100).toFixed(2))
      : 0,
  };
};

module.exports = {
  getDashboardStats,
  getAllStudents,
  getStudentById,
};
