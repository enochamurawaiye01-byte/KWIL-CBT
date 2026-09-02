
const prisma = require("../config/database");
const { randomUUID } = require("crypto");

const LETTERS = ["A", "B", "C", "D"];

 const bulkCreateQuestions = async (examId, payload) => {
  // 1. Check exam
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  if (!exam) {
    throw new Error("Exam not found");
  }

  // Only allow importing into a draft exam
  if (exam.status !== "DRAFT") {
    throw new Error(
      "Questions can only be imported into a DRAFT exam"
    );
  }

  // Prevent accidental duplicate imports
  if (exam._count.questions > 0) {
    throw new Error(
      "This exam already contains questions. Create a new exam or remove the existing questions before importing."
    );
  }

  // 2. Validate questions array
  if (!payload || !Array.isArray(payload.questions)) {
    throw new Error("questions must be an array");
  }

  if (payload.questions.length === 0) {
    throw new Error("At least one question is required");
  }

  const questions = payload.questions;

  // 3. Validate totalQuestions
  if (
    payload.totalQuestions !== undefined &&
    Number(payload.totalQuestions) !== questions.length
  ) {
    throw new Error(
      `totalQuestions says ${payload.totalQuestions}, but ${questions.length} questions were provided`
    );
  }

  // 4. Validate each question
  const orders = new Set();
  let calculatedTotalMarks = 0;

  for (const question of questions) {
    if (!question.order) {
      throw new Error("Every question must have an order");
    }

    if (orders.has(question.order)) {
      throw new Error(
        `Duplicate question order: ${question.order}`
      );
    }

    orders.add(question.order);

    if (
      typeof question.question !== "string" ||
      question.question.trim() === ""
    ) {
      throw new Error(
        `Question ${question.order} has no question text`
      );
    }

    if (!question.options || typeof question.options !== "object") {
      throw new Error(
        `Question ${question.order} must have options`
      );
    }

    // Make sure A-D exist
    for (const letter of LETTERS) {
      if (
        typeof question.options[letter] !== "string" ||
        question.options[letter].trim() === ""
      ) {
        throw new Error(
          `Question ${question.order} is missing option ${letter}`
        );
      }
    }

    if (!LETTERS.includes(question.correctAnswer)) {
      throw new Error(
        `Question ${question.order} has an invalid correctAnswer`
      );
    }

    const marks = Number(question.marks);

    if (!Number.isInteger(marks) || marks <= 0) {
      throw new Error(
        `Question ${question.order} must have valid marks`
      );
    }

    calculatedTotalMarks += marks;
  }

  // 5. Validate totalMarks if supplied
  if (
    payload.totalMarks !== undefined &&
    Number(payload.totalMarks) !== calculatedTotalMarks
  ) {
    throw new Error(
      `totalMarks says ${payload.totalMarks}, but the questions add up to ${calculatedTotalMarks}`
    );
  }

  // 6. Prepare database records
  const questionRows = [];
  const optionRows = [];

  for (const question of questions) {
    const questionId = randomUUID();

    questionRows.push({
      id: questionId,
      examId,
      questionText: question.question.trim(),
      marks: Number(question.marks),
      type: "MULTIPLE_CHOICE",
      order: Number(question.order),
    });

    for (const letter of LETTERS) {
      optionRows.push({
        id: randomUUID(),
        questionId,
        text: question.options[letter].trim(),
        isCorrect: letter === question.correctAnswer,
        order: LETTERS.indexOf(letter) + 1,
      });
    }
  }

  // 7. Insert everything atomically
  const result = await prisma.$transaction(async (tx) => {
    await tx.question.createMany({
      data: questionRows,
    });

    await tx.option.createMany({
      data: optionRows,
    });

    // IMPORTANT:
    // Calculate totalMarks from the actual questions
    // instead of blindly adding to the existing value.
    const updatedExam = await tx.exam.update({
      where: {
        id: examId,
      },
      data: {
        totalMarks: calculatedTotalMarks,
      },
    });

    return updatedExam;
  });

  return {
    examId: result.id,
    totalImported: questions.length,
    totalMarks: calculatedTotalMarks,
    failed: 0,
  };
};



const createQuestion = async ({
  examId,
  questionText,
  marks = 1,
  type = "MULTIPLE_CHOICE",
  options,
}) => {
  // Check exam exists
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    const error = new Error("Exam not found");
    error.statusCode = 404;
    throw error;
  }

  // Don't allow questions to be added to closed/archived exams
  if (exam.status === "CLOSED" || exam.status === "ARCHIVED") {
    const error = new Error(
      "Questions cannot be added to a closed or archived exam"
    );
    error.statusCode = 400;
    throw error;
  }

  if (!questionText || !questionText.trim()) {
    const error = new Error("Question text is required");
    error.statusCode = 400;
    throw error;
  }

  if (!marks || marks <= 0) {
    const error = new Error("Question marks must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(options) || options.length < 2) {
    const error = new Error(
      "A multiple choice question must have at least 2 options"
    );
    error.statusCode = 400;
    throw error;
  }

  // Find correct options
  const correctOptions = options.filter(
    (option) => option.isCorrect === true
  );

  if (correctOptions.length !== 1) {
    const error = new Error(
      "A question must have exactly one correct option"
    );
    error.statusCode = 400;
    throw error;
  }

  // Make sure every option has text
  for (const option of options) {
    if (!option.text || !option.text.trim()) {
      const error = new Error("Every option must have text");
      error.statusCode = 400;
      throw error;
    }
  }

  // Determine next question order
  const lastQuestion = await prisma.question.findFirst({
    where: { examId },
    orderBy: {
      order: "desc",
    },
  });

  const nextOrder = lastQuestion ? lastQuestion.order + 1 : 1;

  const question = await prisma.question.create({
    data: {
      examId,
      questionText: questionText.trim(),
      marks,
      type,
      order: nextOrder,

      options: {
        create: options.map((option, index) => ({
          text: option.text.trim(),
          isCorrect: option.isCorrect === true,
          order: index + 1,
        })),
      },
    },

    include: {
      options: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  // Update exam total marks
  await prisma.exam.update({
    where: { id: examId },
    data: {
      totalMarks: {
        increment: marks,
      },
    },
  });

  return question;
};


const getQuestionsByExam = async (examId) => {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
  });

  if (!exam) {
    const error = new Error("Exam not found");
    error.statusCode = 404;
    throw error;
  }

  return await prisma.question.findMany({
    where: { examId },
    orderBy: {
      order: "asc",
    },
    include: {
      options: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });
};


const getQuestionById = async (id) => {
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      options: {
        orderBy: {
          order: "asc",
        },
      },
      exam: true,
    },
  });

  if (!question) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }

  return question;
};


const updateQuestion = async (
  id,
  {
    questionText,
    marks,
    options,
  }
) => {
  const question = await getQuestionById(id);

  if (
    question.exam.status === "CLOSED" ||
    question.exam.status === "ARCHIVED"
  ) {
    const error = new Error(
      "Questions cannot be edited in a closed or archived exam"
    );
    error.statusCode = 400;
    throw error;
  }

  if (marks !== undefined && marks <= 0) {
    const error = new Error(
      "Question marks must be greater than 0"
    );
    error.statusCode = 400;
    throw error;
  }

  // If options are being updated
  if (options !== undefined) {
    if (!Array.isArray(options) || options.length < 2) {
      const error = new Error(
        "A question must have at least 2 options"
      );
      error.statusCode = 400;
      throw error;
    }

    const correctOptions = options.filter(
      (option) => option.isCorrect === true
    );

    if (correctOptions.length !== 1) {
      const error = new Error(
        "A question must have exactly one correct option"
      );
      error.statusCode = 400;
      throw error;
    }

    for (const option of options) {
      if (!option.text || !option.text.trim()) {
        const error = new Error("Every option must have text");
        error.statusCode = 400;
        throw error;
      }
    }
  }

  const oldMarks = question.marks;
  const newMarks = marks !== undefined ? marks : oldMarks;

  const updatedQuestion = await prisma.$transaction(async (tx) => {
    const updated = await tx.question.update({
      where: { id },

      data: {
        ...(questionText !== undefined && {
          questionText: questionText.trim(),
        }),

        ...(marks !== undefined && {
          marks,
        }),
      },
    });

    if (options !== undefined) {
      // Remove old options
      await tx.option.deleteMany({
        where: {
          questionId: id,
        },
      });

      // Create new options
      await tx.option.createMany({
        data: options.map((option, index) => ({
          questionId: id,
          text: option.text.trim(),
          isCorrect: option.isCorrect === true,
          order: index + 1,
        })),
      });
    }

    // Keep exam total marks synchronized
    if (oldMarks !== newMarks) {
      await tx.exam.update({
        where: {
          id: question.examId,
        },
        data: {
          totalMarks: {
            increment: newMarks - oldMarks,
          },
        },
      });
    }

    return updated;
  });

  return await getQuestionById(updatedQuestion.id);
};


const deleteQuestion = async (id) => {
  const question = await getQuestionById(id);

  if (
    question.exam.status === "CLOSED" ||
    question.exam.status === "ARCHIVED"
  ) {
    const error = new Error(
      "Questions cannot be deleted from a closed or archived exam"
    );
    error.statusCode = 400;
    throw error;
  }

  const deleted = await prisma.$transaction(async (tx) => {
    await tx.question.delete({
      where: { id },
    });

    await tx.exam.update({
      where: { id: question.examId },
      data: {
        totalMarks: {
          decrement: question.marks,
        },
      },
    });

    return question;
  });

  return deleted;
};


module.exports = {
    bulkCreateQuestions,
  createQuestion,
  getQuestionsByExam,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
};