const express = require("express");
const leaderboardController = require("../controllers/leaderboard.controllers");
const authenticate = require("../middleware/auth.middlewares");
const authorize = require("../middleware/role.middlewares");

const router = express.Router();

router.get("/", authenticate, authorize("ADMIN"), leaderboardController.getLeaderboard);

module.exports = router;
