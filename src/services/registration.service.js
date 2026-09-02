const bcrypt = require("bcryptjs");

const prisma = require("../config/database");
const generateRegistrationNumber = require("../utils/generateRegistrationNumber");

const registerStudent = async ({
  fullName,
  phoneNumber,
  courseId,
  password,
}) => {
  // Check that the course exists and is active
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      isActive: true,
    },
  });

  if (!course) {
    const error = new Error("Selected course does not exist or is inactive");
    error.statusCode = 404;
    throw error;
  }

  // Check if phone number already exists
  const existingPhone = await prisma.user.findUnique({
    where: {
      phone: phoneNumber,
    },
  });

  if (existingPhone) {
    const error = new Error(
      "A student with this phone number already exists"
    );

    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Generate registration number
  const registrationNumber = generateRegistrationNumber();

  // Create everything in one transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create user
    const user = await tx.user.create({
      data: {
        phone: phoneNumber,
        passwordHash,
        role: "STUDENT",
      },
    });

    // Create student
    const student = await tx.student.create({
      data: {
        userId: user.id,
        registrationNumber,
        fullName,
        phoneNumber,
      },
    });

    // Create enrollment
    const enrollment = await tx.enrollment.create({
      data: {
        studentId: student.id,
        courseId: course.id,
        status: "ACTIVE",
      },
    });

    return {
      user,
      student,
      enrollment,
    };
  });

  return {
    studentId: result.student.id,
    fullName: result.student.fullName,
    registrationNumber: result.student.registrationNumber,
    course: {
      id: course.id,
      name: course.name,
      code: course.code,
    },
  };
};

module.exports = {
  registerStudent,
};