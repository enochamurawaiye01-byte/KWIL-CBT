const prisma = require("../config/database");
const {
  calculateGrade,
  getSessionQuestions,
} = require("./examSession.service");

const EXAM_MARKS = 70;
const ATTENDANCE_MARKS = 30;
const TOTAL_MARKS = EXAM_MARKS + ATTENDANCE_MARKS;

const calculateHistoricalResult = (result) => {
  const questions = getSessionQuestions(result.session.exam.questions, result.sessionId);
  const answers = new Map(
    result.session.answers.map((answer) => [answer.questionId, answer.selectedOptionId])
  );

  let rawScore = 0;
  let answeredQuestions = 0;
  let correctAnswers = 0;

  for (const question of questions) {
    const selectedOptionId = answers.get(question.id);
    if (!selectedOptionId) continue;

    answeredQuestions++;
    const selectedOption = question.options.find((option) => option.id === selectedOptionId);
    if (selectedOption?.isCorrect) {
      correctAnswers++;
      rawScore += question.marks;
    }
  }

  const rawTotalMarks = questions.reduce((total, question) => total + question.marks, 0);
  const questionPercentage = rawTotalMarks > 0 ? rawScore / rawTotalMarks : 0;
  const score = Math.round(ATTENDANCE_MARKS + questionPercentage * EXAM_MARKS);
  const percentage = Number(((score / TOTAL_MARKS) * 100).toFixed(2));
  const grade = calculateGrade(percentage);
  const status = score >= result.session.exam.passMark ? "PASS" : "FAIL";

  return {
    totalQuestions: questions.length,
    answeredQuestions,
    correctAnswers,
    score,
    totalMarks: TOTAL_MARKS,
    percentage,
    grade,
    status,
  };
};

const refreshStoredGrades = async () => {
  const results = await prisma.result.findMany({
    select: {
      id: true,
      sessionId: true,
      session: {
        select: {
          exam: {
            select: {
              passMark: true,
              questions: {
                select: {
                  id: true,
                  marks: true,
                  options: {
                    select: {
                      id: true,
                      isCorrect: true,
                    },
                  },
                },
              },
            },
          },
          answers: {
            select: {
              questionId: true,
              selectedOptionId: true,
            },
          },
        },
      },
    },
  });

  const updates = results.map((result) => ({
    id: result.id,
    sessionId: result.sessionId,
    data: calculateHistoricalResult(result),
  }));

  if (!updates.length) return;

  await Promise.all(
    updates.map((update) =>
      prisma.result.update({
        where: { id: update.id },
        data: update.data,
      })
    )
  );

  await Promise.all(
    updates.map((update) =>
      prisma.examSession.update({
        where: { id: update.sessionId },
        data: {
          score: update.data.score,
          percentage: update.data.percentage,
          grade: update.data.grade,
        },
      })
    )
  );
};

const getAllResults = async (filters = {}) => {
  await refreshStoredGrades();

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
