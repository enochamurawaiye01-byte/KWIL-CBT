const registrationService = require("./registration.service");
const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

const prisma = require("../config/database");

const registerStudent = async (data) => {
  return await registrationService.registerStudent(data);
};

const loginStudent = async ({ registrationNumber, password }) => { 

  // Find student

  const student = await prisma.student.findUnique({

    where: {

      registrationNumber,

    },

    include: {

      user: true,

      enrollments: {

        include: {

          course: true,

        },

      },

    },

  });

  if (!student) {

    const error = new Error("Invalid registration number or password");

    error.statusCode = 401;

    throw error;

  }

  // Check if account is active

  if (!student.user.isActive) {

    const error = new Error("Your account has been deactivated");

    error.statusCode = 403;

    throw error;

  }

  // Compare password

  const passwordMatch = await bcrypt.compare(

    password,

    student.user.passwordHash

  );

  if (!passwordMatch) {

    const error = new Error("Invalid registration number or password");

    error.statusCode = 401;

    throw error;

  }

  // Generate JWT

  const token = jwt.sign(

    {

      userId: student.user.id,

      studentId: student.id,

      role: student.user.role,

    },

    process.env.JWT_SECRET,

    {

      expiresIn: process.env.JWT_EXPIRES_IN || "7d",

    }

  );

  return {

    token,

    student: {

      id: student.id,

      fullName: student.fullName,

      registrationNumber: student.registrationNumber,

      phoneNumber: student.phoneNumber,

      courses: student.enrollments.map((enrollment) => ({

        id: enrollment.course.id,

        name: enrollment.course.name,

        code: enrollment.course.code,

      })),

    },

  };

};

const loginAdmin = async ({ email, password }) => {
  const admin = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!admin.isActive) {
    const error = new Error("Admin account has been deactivated");
    error.statusCode = 403;
    throw error;
  }

  const passwordMatch = await bcrypt.compare(
    password,
    admin.passwordHash
  );

  if (!passwordMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      userId: admin.id,
      role: admin.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

  return {
    token,
    admin: {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    },
  };
};

const changeAdminPassword = async (userId, currentPassword, newPassword) => {
  const admin = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!admin || admin.role !== "ADMIN") {
    const error = new Error("Admin account not found");
    error.statusCode = 404;
    throw error;
  }

  const currentPasswordMatches = await bcrypt.compare(
    currentPassword,
    admin.passwordHash
  );

  if (!currentPasswordMatches) {
    const error = new Error("Current password is incorrect");
    error.statusCode = 400;
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error("New password must be different from the current password");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: admin.id },
    data: { passwordHash },
  });
};

module.exports = {
  registerStudent,
  loginStudent,
  loginAdmin,
  changeAdminPassword,
};