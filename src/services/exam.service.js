const prisma = require("../config/database");

const createExam = async ({
  courseId,
  title,
  description,
  duration,
  totalMarks,
  passMark,
  startTime,
  endTime,
}) => {
  // Check that course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }

  // Validate duration
  if (!duration || duration <= 0) {
    const error = new Error("Exam duration must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  // Validate marks
  if (!totalMarks || totalMarks <= 0) {
    const error = new Error("Total marks must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  if (passMark < 0 || passMark > totalMarks) {
    const error = new Error(
      "Pass mark cannot be greater than total marks"
    );
    error.statusCode = 400;
    throw error;
  }

  // Validate time range
  if (startTime && endTime) {
    if (new Date(startTime) >= new Date(endTime)) {
      const error = new Error("End time must be after start time");
      error.statusCode = 400;
      throw error;
    }
  }

  const exam = await prisma.exam.create({
    data: {
      courseId,
      title,
      description,
      duration,
      totalMarks,
      passMark,
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : null,
    },
    include: {
      course: true,
    },
  });

  return exam;
};


const getAllExams = async () => {
  return await prisma.exam.findMany({
    orderBy: {
      createdAt: "desc",
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
          sessions: true,
          results: true,
        },
      },
    },
  });
};


const getExamById = async (id) => {
  const exam = await prisma.exam.findUnique({
    where: { id },
    include: {
      course: true,
      _count: {
        select: {
          questions: true,
          sessions: true,
          results: true,
        },
      },
    },
  });

  if (!exam) {
    const error = new Error("Exam not found");
    error.statusCode = 404;
    throw error;
  }

  return exam;
};


const updateExam = async (
  id,
  {
    title,
    description,
    duration,
    totalMarks,
    passMark,
    startTime,
    endTime,
  }
) => {
  const exam = await getExamById(id);

  // Don't allow editing archived exams
  if (exam.status === "ARCHIVED") {
    const error = new Error("Archived exams cannot be edited");
    error.statusCode = 400;
    throw error;
  }

  if (duration !== undefined && duration <= 0) {
    const error = new Error("Duration must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  if (totalMarks !== undefined && totalMarks <= 0) {
    const error = new Error("Total marks must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  const newTotalMarks =
    totalMarks !== undefined ? totalMarks : exam.totalMarks;

  const newPassMark =
    passMark !== undefined ? passMark : exam.passMark;

  if (newPassMark < 0 || newPassMark > newTotalMarks) {
    const error = new Error(
      "Pass mark cannot be greater than total marks"
    );
    error.statusCode = 400;
    throw error;
  }

  const newStartTime =
    startTime !== undefined
      ? startTime
        ? new Date(startTime)
        : null
      : exam.startTime;

  const newEndTime =
    endTime !== undefined
      ? endTime
        ? new Date(endTime)
        : null
      : exam.endTime;

  if (newStartTime && newEndTime && newStartTime >= newEndTime) {
    const error = new Error("End time must be after start time");
    error.statusCode = 400;
    throw error;
  }

  return await prisma.exam.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(duration !== undefined && { duration }),
      ...(totalMarks !== undefined && { totalMarks }),
      ...(passMark !== undefined && { passMark }),
      ...(startTime !== undefined && { startTime: newStartTime }),
      ...(endTime !== undefined && { endTime: newEndTime }),
    },
    include: {
      course: true,
    },
  });
};


const publishExam = async (id) => {
  const exam = await getExamById(id);

  if (exam.status === "PUBLISHED") {
    const error = new Error("Exam is already published");
    error.statusCode = 400;
    throw error;
  }

  if (exam.status === "CLOSED") {
    const error = new Error("A closed exam cannot be published");
    error.statusCode = 400;
    throw error;
  }

  if (exam.status === "ARCHIVED") {
    const error = new Error("Archived exams cannot be published");
    error.statusCode = 400;
    throw error;
  }

  // Make sure exam has questions
  if (exam._count.questions === 0) {
    const error = new Error(
      "You cannot publish an exam without questions"
    );
    error.statusCode = 400;
    throw error;
  }

  return await prisma.exam.update({
    where: { id },
    data: {
      status: "PUBLISHED",
    },
  });
};


const closeExam = async (id) => {
  const exam = await getExamById(id);

  if (exam.status !== "PUBLISHED") {
    const error = new Error(
      "Only published exams can be closed"
    );
    error.statusCode = 400;
    throw error;
  }

  return await prisma.exam.update({
    where: { id },
    data: {
      status: "CLOSED",
    },
  });
};


const deleteExam = async (id) => {
  const exam = await getExamById(id);

  // Don't delete exams that have already been attempted
  if (exam._count.sessions > 0) {
    const error = new Error(
      "This exam cannot be deleted because students have already started it"
    );
    error.statusCode = 400;
    throw error;
  }

  return await prisma.exam.delete({
    where: { id },
  });
};


module.exports = {
  createExam,
  getAllExams,
  getExamById,
  updateExam,
  publishExam,
  closeExam,
  deleteExam,
};