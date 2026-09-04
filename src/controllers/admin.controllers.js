const adminService = require("../services/admin.service");

const getReports = async (req, res, next) => {
  try {
    const reports = await adminService.getReports();
    return res.status(200).json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

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
  getReports,
  getDashboardStats,
};
