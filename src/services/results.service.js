const prisma = require("../config/database");
const { calculateGrade } = require("./examSession.service");

const refreshStoredGrades = async () => {
  const results = await prisma.result.findMany({
    select: {
      id: true,
      sessionId: true,
      percentage: true,
      grade: true,
    },
  });

  const updates = results
    .map((result) => ({
      ...result,
      currentGrade: calculateGrade(result.percentage),
    }))
    .filter((result) => result.grade !== result.currentGrade);

  if (!updates.length) return;

  const grades = [...new Set(updates.map((result) => result.currentGrade))];

  await Promise.all(
    grades.flatMap((grade) => {
      const gradeUpdates = updates.filter((result) => result.currentGrade === grade);
      const resultIds = gradeUpdates.map((result) => result.id);
      const sessionIds = gradeUpdates.map((result) => result.sessionId);

      return [
        prisma.result.updateMany({
          where: { id: { in: resultIds } },
          data: { grade },
        }),
        prisma.examSession.updateMany({
          where: { id: { in: sessionIds } },
          data: { grade },
        }),
      ];
    })
  );
};

const getAllResults = async (filters = {}) => {
  const {
    search,
    examId,
    courseId,
    status,
  } = filters;

  const where = {};

  // Filter by exam
  if (examId) {
    where.examId = examId;
  }

  // Filter by course through exam
  if (courseId) {
    where.exam = {
      courseId,
    };
  }

  // PASS / FAIL
  if (status) {
    if (!["PASS", "FAIL"].includes(status)) {
      throw new Error("Invalid result status");
    }

    where.status = status;
  }

  // Search by student name or registration number
  if (search) {
    where.student = {
      OR: [
        {
          fullName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          registrationNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    };
  }

  await refreshStoredGrades();

  const results = await prisma.result.findMany({
    where,

    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          registrationNumber: true,
          phoneNumber: true,
          profileImage: true,
        },
      },

      exam: {
        select: {
          id: true,
          title: true,
          totalMarks: true,

          course: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },

      transcript: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          generatedAt: true,
        },
      },
    },

    orderBy: {
      submittedAt: "desc",
    },
  });

  return results;
};
const getResultById = async (resultId) => {
  await refreshStoredGrades();

  const result = await prisma.result.findUnique({
    where: {
      id: resultId,
    },

    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          registrationNumber: true,
          phoneNumber: true,
          profileImage: true,
        },
      },

      exam: {
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          totalMarks: true,
          passMark: true,

          course: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },

      session: {
        select: {
          id: true,
          startedAt: true,
          submittedAt: true,
          status: true,
        },
      },

      transcript: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          generatedAt: true,
        },
      },
    },
  });

  if (!result) {
    throw new Error("Result not found");
  }

  return result;
};

const getStudentResults = async (studentId) => {
  await refreshStoredGrades();

  const student = await prisma.student.findUnique({
    where: {
      id: studentId,
    },
    select: {
      id: true,
      fullName: true,
      registrationNumber: true,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const results = await prisma.result.findMany({
    where: {
      studentId,
    },

    include: {
      exam: {
        select: {
          id: true,
          title: true,
          totalMarks: true,
          passMark: true,

          course: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },

      transcript: {
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          generatedAt: true,
        },
      },
    },

    orderBy: {
      submittedAt: "desc",
    },
  });

  return {
    student,
    results,
  };
};

module.exports = {
  getAllResults,
  getResultById,
  getStudentResults,
};
