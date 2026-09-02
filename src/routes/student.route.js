const express = require("express");
const prisma = require("../config/database");

const authenticate = require("../middleware/auth.middlewares");

const router = express.Router();

router.get("/me", authenticate, async (req, res) => {
  try {
    // Get the student's ID from the authenticated JWT
    const studentId = req.user.studentId;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID not found in authentication token",
      });
    }

    // Get the student and all relevant information
    const student = await prisma.student.findUnique({
      where: {
        id: studentId,
      },

      select: {
        id: true,
        registrationNumber: true,
        fullName: true,
        phoneNumber: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,

        // Account information
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },

        // Courses the student is enrolled in
        enrollments: {
          select: {
            id: true,
            status: true,
            enrolledAt: true,
            completedAt: true,

            course: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
                duration: true,
                isActive: true,
              },
            },
          },
        },

        // Exams the student has started
        examSessions: {
          select: {
            id: true,
            startedAt: true,
            expiresAt: true,
            submittedAt: true,
            status: true,
            score: true,
            percentage: true,
            grade: true,

            exam: {
              select: {
                id: true,
                title: true,
                description: true,
                duration: true,
                totalMarks: true,
                passMark: true,
                status: true,
                startTime: true,
                endTime: true,

                course: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },

        // Student's examination results
        results: {
          select: {
            id: true,
            totalQuestions: true,
            answeredQuestions: true,
            correctAnswers: true,
            score: true,
            totalMarks: true,
            percentage: true,
            grade: true,
            status: true,
            submittedAt: true,

            exam: {
              select: {
                id: true,
                title: true,

                course: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
        },

        // Generated transcripts
        transcripts: {
          select: {
            id: true,
            fileUrl: true,
            fileName: true,
            generatedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged-in student data retrieved successfully",
      data: student,
    });
  } catch (error) {
    console.error("Get current student error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve student data",
    });
  }
});

module.exports = router;