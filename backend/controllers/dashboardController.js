const Dashboard = require('../models/domain/Dashboard');

const getDashboardData = async (req, res) => {
  try {
    const [
      totalLands,
      ownedLands,
      rentedLands,
      totalArea,
      activeEmployees,
      pendingTasks,
      monthlyRevenue,
      revenueData,
      monthlyTarget,
      taskCompletionRate,
      totalUsers,
      activeUsers,
      managerUsers,
      adminUsers,
      totalEmployees,
      monthlySalaryCost,
      departmentsCount,
      completedTasks,
      inProgressTasks,
      totalAdvances,
      approvedAdvances,
      pendingAdvances,
      totalPayrolls,
      activeContractors,
      activeOperations,
      totalOperations,
      totalContractors,
      manufacturingStats,
      inventoryStats,
      totalSales,
      totalRevenue,
      totalCustomers,
      pendingSales,
      activeAssets,
      totalAssetValue,
      pendingMaintenance,
      avgMaintenanceCost,
      accountingSummary,
      loanSummary
    ] = await Promise.all([
      Dashboard.getLandsCount(),
      Dashboard.getOwnedLandsCount(),
      Dashboard.getRentedLandsCount(),
      Dashboard.getTotalLandArea(),
      Dashboard.getActiveEmployeesCount(),
      Dashboard.getPendingTasksCount(),
      Dashboard.getMonthlyRevenue(),
      Dashboard.getRevenueData(),
      Dashboard.getMonthlyTarget(),
      Dashboard.getTaskCompletionRate(),
      Dashboard.getTotalUsers(),
      Dashboard.getActiveUsers(),
      Dashboard.getManagerUsers(),
      Dashboard.getAdminUsers(),
      Dashboard.getTotalEmployees(),
      Dashboard.getMonthlySalaryCost(),
      Dashboard.getDepartmentsCount(),
      Dashboard.getCompletedTasksCount(),
      Dashboard.getInProgressTasksCount(),
      Dashboard.getTotalAdvances(),
      Dashboard.getApprovedAdvances(),
      Dashboard.getPendingAdvances(),
      Dashboard.getTotalPayrolls(),
      Dashboard.getActiveContractors(),
      Dashboard.getActiveOperations(),
      Dashboard.getTotalOperations(),
      Dashboard.getTotalContractors(),
      Dashboard.getManufacturingStats(),
      Dashboard.getInventoryStats(),
      Dashboard.getTotalSales(),
      Dashboard.getTotalRevenue(),
      Dashboard.getTotalCustomers(),
      Dashboard.getPendingSales(),
      Dashboard.getActiveAssets(),
      Dashboard.getTotalAssetValue(),
      Dashboard.getPendingMaintenance(),
      Dashboard.getAvgMaintenanceCost(),
      Dashboard.getAccountingSummary(),
      Dashboard.getLoanSummary()
    ]);

    res.json({
      summary: {
        totalLands,
        ownedLands,
        rentedLands,
        totalArea,
        activeEmployees,
        pendingTasks,
        monthlyRevenue,
        totalUsers,
        activeUsers,
        managerUsers,
        adminUsers,
        totalEmployees,
        monthlySalaryCost,
        departmentsCount,
        completedTasks,
        inProgressTasks,
        totalTasks: completedTasks + inProgressTasks + pendingTasks,
        totalAdvances,
        approvedAdvances,
        pendingAdvances,
        totalPayrolls,
        activeContractors,
        activeOperations,
        totalOperations,
        totalContractors,
        // Manufacturing stats
        totalOrders: manufacturingStats.totalOrders,
        inProgressOrders: manufacturingStats.inProgressOrders,
        completedOrders: manufacturingStats.completedOrders,
        avgProductionEfficiency: manufacturingStats.avgProductionEfficiency,
        avgDefectRate: manufacturingStats.avgDefectRate,
        totalDowntime: manufacturingStats.totalDowntime,
        activeAssignments: manufacturingStats.activeAssignments,
        totalAssignedQuantity: manufacturingStats.totalAssignedQuantity,
        // Inventory stats
        activeItems: inventoryStats.activeItems,
        lowStockItems: inventoryStats.lowStockItems,
        inventoryOrders: inventoryStats.inventoryOrders,
        totalInventoryValue: inventoryStats.totalInventoryValue,
        // Sales stats
        totalSales,
        totalRevenue,
        totalCustomers,
        pendingSales,
        // Asset stats
        activeAssets,
        totalAssetValue,
        pendingMaintenance,
        avgMaintenanceCost,
        // Accounting summary
        totalIncome: accountingSummary.totalIncome,
        totalExpenses: accountingSummary.totalExpenses,
        netIncome: accountingSummary.netIncome,
        cashBalance: accountingSummary.cashBalance,
        // Loan summary
        activeLoans: loanSummary.activeLoans,
        overdueLoans: loanSummary.overdueLoans,
        totalLoaned: loanSummary.totalLoaned,
        totalRepaid: loanSummary.totalRepaid,
        outstandingAmount: loanSummary.outstandingAmount
      },
      revenueData: revenueData.reverse(),
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
