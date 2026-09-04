const adminService = require("../services/admin.service");
const authService = require("../services/auth.service");

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

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters and contain a letter and a number",
      });
    }

    await authService.changeAdminPassword(req.user.userId, currentPassword, newPassword);
    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  getDashboardStats,
  changePassword,
};
