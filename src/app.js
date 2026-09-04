const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const authRoutes = require("./routes/auth.route");
const courseRoutes = require("./routes/courses.route");
const studentRoutes = require("./routes/student.route");
const examRoutes = require("./routes/exam.route");
const questionRoutes = require("./routes/question.route");
const examSessionRoutes = require("./routes/examSession.route");
const resultRoutes = require("./routes/result.route");
const transcriptRoutes = require("./routes/transcript.route");
const adminRoutes = require("./routes/admin.route");
const leaderboardRoutes = require("./routes/leadearboard.route");

const app = express();

// Security
app.use(helmet());

// CORS
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Examination System API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/exam-sessions", examSessionRoutes);
app.use("/api/admin/results", resultRoutes);
app.use("/api/admin/transcripts", transcriptRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/leaderboard", leaderboardRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;