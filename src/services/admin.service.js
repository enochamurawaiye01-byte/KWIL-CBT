const prisma = require("../config/database");

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
};
