const adminService = require("../services/admin.service");

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
};
