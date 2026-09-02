const express = require("express");

const {
  getAllResults,
  getResultById,
  getStudentResults,
} = require("../controllers/result.controllers");

const authenticate = require("../middleware/auth.middlewares");
const authorize = require("../middleware/role.middlewares");

const router = express.Router();

router.use(authenticate);
router.use(authorize("ADMIN"));


// Get all results
router.get("/", getAllResults);


// Get one result
router.get("/:resultId", getResultById);


// Get all results belonging to one student
router.get(
  "/student/:studentId",
  getStudentResults
);

module.exports = router;