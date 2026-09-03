const transcriptService = require("../services/transcript.service");

const listTranscripts = async (req, res, next) => {
  try {
    const transcripts = await transcriptService.listTranscripts(req.query.search);

    return res.status(200).json({
      success: true,
      data: transcripts,
    });
  } catch (error) {
    next(error);
  }
};

const generateTranscript = async (req, res, next) => {
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
    next(error);
  }
};

const downloadTranscript = async (req, res, next) => {
  try {
    const transcript = await transcriptService.getTranscriptFile(req.params.transcriptId);
    return res.download(transcript.filePath, transcript.fileName);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTranscripts,
  generateTranscript,
  downloadTranscript,
};