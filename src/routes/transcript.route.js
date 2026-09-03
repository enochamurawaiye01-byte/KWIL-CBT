const express = require("express");

const {
  listTranscripts,
  generateTranscript,
  downloadTranscript,
} = require("../controllers/transcript.controllers");

const 
  authenticate
 = require("../middleware/auth.middlewares");

const 
  authorize
 = require("../middleware/role.middlewares");

const router = express.Router();

// Everything in this router requires ADMIN
router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/", listTranscripts);

router.get("/:transcriptId/download", downloadTranscript);

router.post(
  "/:resultId/generate",
  generateTranscript
);

module.exports = router;