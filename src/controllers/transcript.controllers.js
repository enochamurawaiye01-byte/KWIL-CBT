const transcriptService = require("../services/transcript.service");

const generateTranscript = async (req, res) => {
  try {
    const { resultId } = req.params;

    const transcript =
      await transcriptService.generateTranscript(resultId);

    return res.status(201).json({
      success: true,
      message: "Transcript generated successfully",
      data: transcript,
    });
  } catch (error) {
    console.error("Generate transcript error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateTranscript,
};