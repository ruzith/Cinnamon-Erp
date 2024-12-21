const Dashboard = require('../models/domain/Dashboard');

const getDashboardData = async (req, res) => {
  try {
    const [
      totalLands,
      activeEmployees,
      pendingTasks,
      monthlyRevenue,
      revenueData,
      monthlyTarget,
      taskCompletionRate
    ] = await Promise.all([
      Dashboard.getLandsCount(),
      Dashboard.getActiveEmployeesCount(),
      Dashboard.getPendingTasksCount(),
      Dashboard.getMonthlyRevenue(),
      Dashboard.getRevenueData(),
      Dashboard.getMonthlyTarget(),
      Dashboard.getTaskCompletionRate()
    ]);

    res.json({
      summary: {
        totalLands,
        activeEmployees,
        pendingTasks,
        monthlyRevenue
      },
      revenueData: revenueData.reverse(), // Reverse to show oldest to newest
      monthlyTarget,
      taskCompletion: {
        value: taskCompletionRate,
        target: 100
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateMonthlyTarget = async (req, res) => {
  try {
    const { period } = req.params;
    const { target_amount } = req.body;
    
    if (!target_amount || isNaN(target_amount)) {
      return res.status(400).json({ message: 'Invalid target amount' });
    }

    await Dashboard.updateMonthlyTarget(period, target_amount, req.user.id);
    res.json({ message: 'Monthly target updated successfully' });
  } catch (error) {
    console.error('Error updating monthly target:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardData,
  updateMonthlyTarget
};
