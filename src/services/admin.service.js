const prisma = require("../config/database");

const getReports = async () => {
  const [courses, exams, enrollments] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        exams: {
          select: {
            results: {
              select: {
                percentage: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.exam.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        course: { select: { name: true } },
        sessions: { select: { status: true } },
        results: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.enrollment.findMany({
      select: { enrolledAt: true },
      orderBy: { enrolledAt: "asc" },
    }),
  ]);

  const performanceByCourse = courses.map((course) => {
    const results = course.exams.flatMap((exam) => exam.results);
    const resultCount = results.length;
    const totalPercentage = results.reduce(
      (total, result) => total + (Number(result.percentage) || 0),
      0
    );

    return {
      course: { id: course.id, name: course.name, code: course.code },
      attempts: resultCount,
      averageScore: resultCount ? Number((totalPercentage / resultCount).toFixed(2)) : 0,
      passRate: resultCount
        ? Number(((results.filter((result) => result.status === "PASS").length / resultCount) * 100).toFixed(2))
        : 0,
    };
  });

  const examSummary = exams.map((exam) => ({
    exam: { id: exam.id, title: exam.title, course: exam.course },
    status: exam.status,
    completed: exam.sessions.filter((session) => ["SUBMITTED", "EXPIRED"].includes(session.status)).length,
    passed: exam.results.filter((result) => result.status === "PASS").length,
    failed: exam.results.filter((result) => result.status === "FAIL").length,
  }));

  const enrollmentByMonth = new Map();
  for (const enrollment of enrollments) {
    const date = new Date(enrollment.enrolledAt);
    const month = date.toISOString().slice(0, 7);
    enrollmentByMonth.set(month, (enrollmentByMonth.get(month) || 0) + 1);
  }

  return {
    performanceByCourse,
    examSummary,
    enrollmentTrend: [...enrollmentByMonth.entries()].map(([month, enrollments]) => ({
      month,
      enrollments,
    })),
  };
};

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
  getReports,
  getDashboardStats,
  getAllStudents,
  getStudentById,
};
