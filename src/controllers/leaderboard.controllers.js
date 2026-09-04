const leaderboardService = require("../services/leaderboard.service");

const getLeaderboard = async (req, res, next) => {
	try {
		const leaderboard = await leaderboardService.getLeaderboard();
		return res.status(200).json({
			success: true,
			data: leaderboard,
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	getLeaderboard,
};
