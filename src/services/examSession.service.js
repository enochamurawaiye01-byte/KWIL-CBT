const prisma = require("../config/database");

const QUESTIONS_PER_SESSION = 30;
const EXAM_MARKS = 70;
const ATTENDANCE_MARKS = 30;
const TOTAL_MARKS = EXAM_MARKS + ATTENDANCE_MARKS;

function getSessionQuestions(questions, sessionId) {
  let seed = 0;
  for (const character of sessionId) {
    seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  }

  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const randomIndex = seed % (index + 1);
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, Math.min(QUESTIONS_PER_SESSION, shuffled.length));
}


const getAvailableExams = async (studentId) => {
  console.log("=================================");
  console.log("GET AVAILABLE EXAMS");
  console.log("Student ID:", studentId);

  // 1. Find student's active enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: {
      studentId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      studentId: true,
      courseId: true,
      status: true,
      course: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  console.log("ACTIVE ENROLLMENTS:");
  console.dir(enrollments, { depth: null });

  const courseIds = enrollments.map(
    (enrollment) => enrollment.courseId
  );

  console.log("COURSE IDS:", courseIds);

  if (courseIds.length === 0) {
    console.log("❌ Student has no ACTIVE enrollment");
    return [];
  }

  // 2. Find published exams for those courses
  const exams = await prisma.exam.findMany({
    where: {
      courseId: {
        in: courseIds,
      },
      status: "PUBLISHED",
    },
    include: {
      course: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log("PUBLISHED EXAMS:");
  console.dir(exams, { depth: null });

  // 3. Check previous attempts
  const sessions = await prisma.examSession.findMany({
    where: {
      studentId,
      examId: {
        in: exams.map((exam) => exam.id),
      },
    },
    select: {
      examId: true,
      status: true,
      score: true,
      percentage: true,
      grade: true,
    },
  });

  console.log("EXISTING SESSIONS:");
  console.dir(sessions, { depth: null });

  const sessionMap = new Map(
    sessions.map((session) => [session.examId, session])
  );

  const result = exams.map((exam) => {
    const session = sessionMap.get(exam.id);

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      passMark: exam.passMark,
      startTime: exam.startTime,
      endTime: exam.endTime,

      course: exam.course,

      totalQuestions: exam._count.questions,

      attempt: session
        ? {
            status: session.status,
          }
        : null,
    };
  });

  console.log("FINAL AVAILABLE EXAMS:");
  console.dir(result, { depth: null });

  console.log("=================================");

  return result;
};



const startExam = async (studentId, examId) => {
  const exam = await prisma.exam.findUnique({
    where: {
      id: examId,
    },
    include: {
      questions: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  if (exam.status !== "PUBLISHED") {
    throw new Error("This exam is not available");
  }

  if (exam.questions.length === 0) {
    throw new Error("This exam has no questions");
  }

  // Check student's enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId,
        courseId: exam.courseId,
      },
    },
  });

  if (!enrollment || enrollment.status !== "ACTIVE") {
    throw new Error(
      "You are not enrolled in the course for this exam"
    );
  }

  // Check if student already has a session
  const existingSession = await prisma.examSession.findUnique({
    where: {
      examId_studentId: {
        examId,
        studentId,
      },
    },
  });

  if (existingSession) {
    if (existingSession.status === "IN_PROGRESS") {
      return existingSession;
    }

    throw new Error("You have already completed this exam");
  }

  // Check scheduled time
  const now = new Date();

  if (exam.startTime && now < exam.startTime) {
    throw new Error("This exam has not started yet");
  }

  if (exam.endTime && now > exam.endTime) {
    throw new Error("This exam has ended");
  }

  // Calculate expiry time
  const expiresAt = new Date(
    now.getTime() + exam.duration * 60 * 1000
  );

  // If exam has a fixed end time, don't allow session
  // to go beyond the exam's end time.
  const finalExpiresAt =
    exam.endTime && exam.endTime < expiresAt
      ? exam.endTime
      : expiresAt;

  const session = await prisma.examSession.create({
    data: {
      examId,
      studentId,
      startedAt: now,
      expiresAt: finalExpiresAt,
      status: "IN_PROGRESS",
    },
  });

  return session;
};

const getExamQuestions = async (studentId, sessionId) => {
  // Find the session
  const session = await prisma.examSession.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      exam: {
        select: {
          id: true,
          title: true,
          description: true,
          duration: true,
          totalMarks: true,
          passMark: true,
          status: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Exam session not found");
  }

  // Make sure this session belongs to the logged-in student
  if (session.studentId !== studentId) {
    throw new Error("You are not authorized to access this exam");
  }

  // Session must still be active
  if (session.status !== "IN_PROGRESS") {
    throw new Error("This exam session is no longer active");
  }

  // Check whether time has expired
  const now = new Date();

  if (now >= session.expiresAt) {
    await prisma.examSession.update({
      where: {
        id: session.id,
      },
      data: {
        status: "EXPIRED",
      },
    });

    throw new Error("Your exam time has expired");
  }

  // Get questions
  const allQuestions = await prisma.question.findMany({
    where: {
      examId: session.examId,
    },
    orderBy: {
      order: "asc",
    },
    select: {
      id: true,
      questionText: true,
      marks: true,
      type: true,
      order: true,

      // IMPORTANT:
      // Do NOT select isCorrect
      options: {
        select: {
          id: true,
          text: true,
          order: true,
        },
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  const questions = getSessionQuestions(allQuestions, session.id);

  // Get student's already saved answers
  const answers = await prisma.examAnswer.findMany({
    where: {
      sessionId: session.id,
    },
    select: {
      questionId: true,
      selectedOptionId: true,
    },
  });

  const answerMap = new Map(
    answers.map((answer) => [
      answer.questionId,
      answer.selectedOptionId,
    ])
  );

  const formattedQuestions = questions.map((question) => ({
    id: question.id,
    order: question.order,
    questionText: question.questionText,
    marks: question.marks,
    type: question.type,

    options: question.options,

    selectedOptionId: answerMap.get(question.id) || null,
  }));

  // Calculate remaining time in seconds
  const remainingTime = Math.max(
    0,
    Math.floor(
      (session.expiresAt.getTime() - now.getTime()) / 1000
    )
  );

  return {
    session: {
      id: session.id,
      examId: session.examId,
      startedAt: session.startedAt,
      expiresAt: session.expiresAt,
      remainingTime,
    },

    exam: session.exam,

    questions: formattedQuestions,
  };
};

const saveAnswer = async (
  studentId,
  sessionId,
  questionId,
  selectedOptionId
) => {
  // Find the exam session
  const session = await prisma.examSession.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      exam: true,
    },
  });

  if (!session) {
    throw new Error("Exam session not found");
  }

  // Make sure the session belongs to this student
  if (session.studentId !== studentId) {
    throw new Error("You are not authorized to access this exam");
  }

  // Session must still be active
  if (session.status !== "IN_PROGRESS") {
    throw new Error("This exam session is no longer active");
  }

  // Check server-side expiry
  const now = new Date();

  if (now >= session.expiresAt) {
    await prisma.examSession.update({
      where: {
        id: sessionId,
      },
      data: {
        status: "EXPIRED",
      },
    });

    throw new Error("Your exam time has expired");
  }

  // Make sure the question belongs to this exam
  const question = await prisma.question.findFirst({
    where: {
      id: questionId,
      examId: session.examId,
    },
  });

  if (!question) {
    throw new Error("Question does not belong to this exam");
  }

  // Make sure the selected option belongs to this question
  const option = await prisma.option.findFirst({
    where: {
      id: selectedOptionId,
      questionId: questionId,
    },
  });

  if (!option) {
    throw new Error("Invalid option for this question");
  }

  // Create or update answer
  const answer = await prisma.examAnswer.upsert({
    where: {
      sessionId_questionId: {
        sessionId,
        questionId,
      },
    },

    create: {
      sessionId,
      questionId,
      selectedOptionId,
    },

    update: {
      selectedOptionId,
      answeredAt: now,
    },

    select: {
      id: true,
      sessionId: true,
      questionId: true,
      selectedOptionId: true,
      answeredAt: true,
      updatedAt: true,
    },
  });

  return answer;
};

const submitExam = async (studentId, sessionId) => {
  // Find session
  const session = await prisma.examSession.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      exam: true,
    },
  });

  if (!session) {
    throw new Error("Exam session not found");
  }

  // Security check
  if (session.studentId !== studentId) {
    throw new Error("You are not authorized to submit this exam");
  }

  // Prevent duplicate submission
  if (session.status === "SUBMITTED") {
    throw new Error("This exam has already been submitted");
  }

  if (session.status === "EXPIRED") {
    throw new Error("This exam session has expired");
  }

  const now = new Date();

  /*
   * Determine whether the student submitted before
   * the server-side expiry time.
   */
  const isExpired = now >= session.expiresAt;

  // Get all questions and their correct answers
  const allQuestions = await prisma.question.findMany({
    where: {
      examId: session.examId,
    },
    include: {
      options: {
        select: {
          id: true,
          isCorrect: true,
        },
      },
    },
    orderBy: {
      order: "asc",
    },
  });

  const questions = getSessionQuestions(allQuestions, session.id);

  // Get student's answers
  const answers = await prisma.examAnswer.findMany({
    where: {
      sessionId: session.id,
    },
    select: {
      questionId: true,
      selectedOptionId: true,
    },
  });

  const answerMap = new Map(
    answers.map((answer) => [
      answer.questionId,
      answer.selectedOptionId,
    ])
  );

  let rawScore = 0;
  let correctAnswers = 0;
  let answeredQuestions = 0;

  // Mark every question
  for (const question of questions) {
    const selectedOptionId = answerMap.get(question.id);

    // No answer
    if (!selectedOptionId) {
      continue;
    }

    answeredQuestions++;

    const selectedOption = question.options.find(
      (option) => option.id === selectedOptionId
    );

    if (selectedOption && selectedOption.isCorrect) {
      correctAnswers++;
      rawScore += question.marks;
    }
  }

  const totalQuestions = questions.length;
  const rawTotalMarks = questions.reduce(
    (total, question) => total + question.marks,
    0
  );

  const questionPercentage = rawTotalMarks > 0
    ? rawScore / rawTotalMarks
    : 0;
  const questionScore = questionPercentage * EXAM_MARKS;
  const score = Math.round(ATTENDANCE_MARKS + questionScore);
  const totalMarks = TOTAL_MARKS;
  const percentage = Number(((score / totalMarks) * 100).toFixed(2));

  // Grade calculation
  const grade = calculateGrade(percentage);

  // PASS / FAIL
  const status =
    score >= session.exam.passMark
      ? "PASS"
      : "FAIL";

  /*
   * Everything below happens in one transaction.
   * Either the entire result is saved or nothing is saved.
   */
  const result = await prisma.$transaction(async (tx) => {
    const finalStatus = isExpired
      ? "EXPIRED"
      : "SUBMITTED";

    // Update exam session
    await tx.examSession.update({
      where: {
        id: session.id,
      },
      data: {
        status: finalStatus,
        submittedAt: now,
        score,
        percentage,
        grade,
      },
    });

    // Save result
    const savedResult = await tx.result.create({
      data: {
        sessionId: session.id,
        studentId: session.studentId,
        examId: session.examId,

        totalQuestions,
        answeredQuestions,
        correctAnswers,

        score,
        totalMarks,
        percentage,
        grade,

        status,
        submittedAt: now,
      },
      select: {
        id: true,
        sessionId: true,
        totalQuestions: true,
        answeredQuestions: true,
        correctAnswers: true,
        score: true,
        totalMarks: true,
        percentage: true,
        grade: true,
        status: true,
        submittedAt: true,
      },
    });

    return savedResult;
  });

  return result;
};

const calculateGrade = (percentage) => {
  if (percentage >= 70) {
    return "A";
  }

  if (percentage >= 60) {
    return "B";
  }

  if (percentage >= 50) {
    return "C";
  }

  if (percentage >= 45) {
    return "D";
  }

  if (percentage >= 40) {
    return "E";
  }

  return "F";
};

module.exports = {
  getAvailableExams,
  startExam,
  getExamQuestions,
  saveAnswer,
  submitExam,
  calculateGrade,
};
