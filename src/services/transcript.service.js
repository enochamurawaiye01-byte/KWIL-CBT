const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const prisma = require("../config/database");

const generateTranscript = async (resultId) => {
  // Get result and all required information
  const result = await prisma.result.findUnique({
    where: {
      id: resultId,
    },

    include: {
      student: {
        include: {
          enrollments: {
            include: {
              course: true,
            },
          },
        },
      },

      exam: {
        include: {
          course: true,
        },
      },

      transcript: true,
    },
  });

  if (!result) {
    throw new Error("Result not found");
  }

  // If transcript already exists, return it
  if (result.transcript) {
    return result.transcript;
  }

  const student = result.student;
  const exam = result.exam;

  // Create transcript directory
  const transcriptDirectory = path.join(
    process.cwd(),
    "uploads",
    "transcripts"
  );

  if (!fs.existsSync(transcriptDirectory)) {
    fs.mkdirSync(transcriptDirectory, {
      recursive: true,
    });
  }

  // Safe filename
  const safeName = student.fullName
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();

  const fileName = `${student.registrationNumber}_${safeName}_transcript.pdf`;

  const filePath = path.join(
    transcriptDirectory,
    fileName
  );

  // Create PDF
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // Header
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("Tech2Grassroots Africa", {
      align: "center",
    });

  doc
    .moveDown(0.5)
    .fontSize(11)
    .font("Helvetica")
    .text("STUDENT ACADEMIC TRANSCRIPT", {
      align: "center",
    });

  doc.moveDown(2);

  // Student information
  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("STUDENT INFORMATION");

  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .font("Helvetica")
    .text(`Full Name: ${student.fullName}`)
    .text(
      `Registration Number: ${student.registrationNumber}`
    )
    .text(`Phone Number: ${student.phoneNumber}`)
    .text(`Course: ${exam.course.name}`)
    .text(`Course Code: ${exam.course.code}`);

  doc.moveDown(1.5);

  // Examination information
  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .text("EXAMINATION RESULT");

  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .font("Helvetica")
    .text(`Examination: ${exam.title}`)
    .text(
      `Date Submitted: ${result.submittedAt.toLocaleDateString()}`
    );

  doc.moveDown(1);

  // Result table
  const tableTop = doc.y;

  doc
    .font("Helvetica-Bold")
    .text("Description", 60, tableTop)
    .text("Result", 350, tableTop);

  doc.moveDown(0.5);

  doc.font("Helvetica");

  const rows = [
    ["Total Questions", result.totalQuestions],
    ["Questions Answered", result.answeredQuestions],
    ["Correct Answers", result.correctAnswers],
    ["Score", `${result.score}/${result.totalMarks}`],
    ["Percentage", `${result.percentage}%`],
    ["Grade", result.grade],
    ["Result Status", result.status],
  ];

  rows.forEach(([label, value]) => {
    doc
      .text(label, 60)
      .text(String(value), 350);
  });

  doc.moveDown(2);

  // Certification statement
  doc
    .fontSize(11)
    .text(
      "This transcript is an official record of the student's examination result."
    );

  doc.moveDown(3);

  doc
    .font("Helvetica-Bold")
    .text("Authorized Officer");

  doc
    .font("Helvetica")
    .text("Tech2Grassroots Africa");

  // Finish PDF
  doc.end();

  // Wait for file to finish writing
  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  // Save transcript record
  const transcript = await prisma.transcript.create({
    data: {
      studentId: student.id,
      resultId: result.id,
      fileUrl: `/uploads/transcripts/${fileName}`,
      fileName,
    },
  });

  return transcript;
};

module.exports = {
  generateTranscript,
};