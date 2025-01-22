import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Grid,
  Paper,
  Typography,
  Box,
  IconButton,
  TextField,
  Button,
  Divider,
  Fade,
  Tab,
  Tabs,
  useMediaQuery,
  Chip,
  LinearProgress,
  Card,
  alpha,
  Avatar,
} from '@mui/material';
import axios from 'axios';
import {
  People as PeopleIcon,
  Terrain as TerrainIcon,
  Assignment as TaskIcon,
  AccountBalance as AccountIcon,
  TrendingUp,
  TrendingDown,
  Edit,
  Home as OwnedIcon,
  Assignment as RentedIcon,
  Agriculture as AreaIcon,
  Group as UsersIcon,
  AdminPanelSettings as AdminIcon,
  Person as ActiveUserIcon,
  SupervisorAccount as ManagerIcon,
  Business as BusinessIcon,
  AttachMoney as SalaryIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Schedule as InProgressIcon,
  Engineering as WorkerIcon,
  Forest as ForestIcon,
  Assignment as AssignmentIcon,
  Groups as ContractorsIcon,
  MonetizationOn as AdvanceIcon,
  CheckCircle as ApprovedIcon,
  Assessment as PendingAdvanceIcon,
  Receipt as PayrollIcon,
  Factory as FactoryIcon,
  Speed as SpeedIcon,
  Grade as QualityIcon,
  Inventory as ProductIcon,
  Inventory as InventoryIcon,
  Warning as AlertIcon,
  AttachMoney as ValueIcon,
  ManageAccounts as ManageIcon,
  Factory as ManufacturingIcon,
  AttachMoney,
  People,
  ShoppingCart,
  Build,
  Timeline,
  Construction,
  AccountBalance as AccountBalanceIcon,
  Payments as PaymentsIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useCurrencyFormatter } from '../utils/currencyUtils';
import SummaryCard from '../components/common/SummaryCard';
import { motion } from 'framer-motion';

const GlassCard = ({ children, elevation = 0, ...props }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={elevation}
      sx={{
        background: alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        ...props.sx
      }}
      {...props}
    >
      {children}
    </Paper>
  );
};

const AnimatedNumber = ({ value, duration = 1000, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startValue = displayValue;
    const endValue = Number(value);
    const startTime = Date.now();

    const updateValue = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    };

    requestAnimationFrame(updateValue);
  }, [value]);

  return <>{prefix}{displayValue.toLocaleString()}{suffix}</>;
};

const ProgressCard = ({ title, value, target, color, period, isMonetary }) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [newTarget, setNewTarget] = useState(target);
  const [loading, setLoading] = useState(false);
  const { formatCurrency } = useCurrencyFormatter();

  useEffect(() => {
    setNewTarget(target);
  }, [target]);

  const handleUpdateTarget = async () => {
    try {
      setLoading(true);
      await axios.put(`/api/dashboard/monthly-target/${period}`, {
        target_amount: newTarget
      });
      window.location.reload();
    } catch (error) {
      console.error('Error updating target:', error);
      alert('Failed to update target');
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  };

  const formatValue = (val) => {
    if (isMonetary) {
      return formatCurrency(val);
    }
    return val;
  };

  const progress = Math.min((value / target) * 100, 100);

  return (
    <GlassCard sx={{ p: 3, height: '100%', position: 'relative' }}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="textSecondary">
          {title}
        </Typography>
        {title === 'Monthly Target' && (
          <IconButton
            size="small"
            onClick={() => setIsEditing(true)}
            sx={{ opacity: 0.7 }}
          >
            <Edit fontSize="small" />
          </IconButton>
        )}
      </Box>

      {isEditing ? (
        <Box sx={{ mb: 2 }}>
          <TextField
            size="small"
            type="number"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            sx={{ width: '100%', mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              onClick={handleUpdateTarget}
              disabled={loading}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setIsEditing(false);
                setNewTarget(target);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Typography variant="h4" sx={{ mb: 2 }}>
            {formatValue(value)}
            <Typography
              component="span"
              variant="body2"
              color="textSecondary"
              sx={{ ml: 1 }}
            >
              / {formatValue(target)}
            </Typography>
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: `rgba(${color}, 0.1)`,
              '& .MuiLinearProgress-bar': {
                bgcolor: `rgba(${color}, 1)`,
                borderRadius: 4,
              },
            }}
          />
        </>
      )}
    </GlassCard>
  );
};

const DashboardSection = ({ title, children, delay = 0 }) => {
  const theme = useTheme();
  return (
    <Fade in timeout={1000} style={{ transitionDelay: `${delay}ms` }}>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -8,
              left: 0,
              width: '100%',
              height: '1px',
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0)} 100%)`,
            }
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -8,
                left: 0,
                width: 60,
                height: 3,
                borderRadius: 1.5,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${alpha(theme.palette.primary.main, 0.5)})`,
              }
            }}
          >
            {title}
          </Typography>
        </Box>
        {children}
      </Box>
    </Fade>
  );
};

const EnhancedSummaryCard = (props) => {
  const theme = useTheme();

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard
        sx={{
          p: 2.5,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            transition: 'transform 0.3s ease-in-out',
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '150px',
            height: '150px',
            background: `linear-gradient(45deg, ${alpha(theme.palette[props.gradientColor].main, 0.1)} 0%, ${alpha(theme.palette[props.gradientColor].main, 0)} 100%)`,
            borderRadius: '0 0 0 100%',
            zIndex: 0,
          }}
        />
        <SummaryCard {...props} />
      </GlassCard>
    </motion.div>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalLands: 0,
      ownedLands: 0,
      rentedLands: 0,
      totalArea: 0,
      activeEmployees: 0,
      pendingTasks: 0,
      monthlyRevenue: 0,
      totalUsers: 0,
      activeUsers: 0,
      managerUsers: 0,
      adminUsers: 0,
      totalEmployees: 0,
      monthlySalaryCost: 0,
      departmentsCount: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      totalTasks: 0,
      totalAdvances: 0,
      approvedAdvances: 0,
      pendingAdvances: 0,
      totalPayrolls: 0,
      activeContractors: 0,
      activeOperations: 0,
      totalOperations: 0,
      totalContractors: 0,
      activeAssignments: 0,
      totalAssignments: 0,
      activeItems: 0,
      lowStockItems: 0,
      inventoryOrders: 0,
      totalInventoryValue: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      pendingSales: 0,
      activeAssets: 0,
      totalAssetValue: 0,
      pendingMaintenance: 0,
      avgMaintenanceCost: 0,
      totalIncome: 0,
      totalExpenses: 0,
      netIncome: 0,
      cashBalance: 0,
      totalLoaned: 0,
      totalRepaid: 0,
      outstandingAmount: 0,
      activeLoans: 0,
      overdueLoans: 0,
      manufacturingContractors: 0,
      activeManufacturingContractors: 0,
      inactiveManufacturingContractors: 0,
      totalManufacturingAssignments: 0,
      activeManufacturingAssignments: 0,
      completedManufacturingAssignments: 0,
      cancelledManufacturingAssignments: 0,
      cuttingContractors: 0,
      activeCuttingContractors: 0,
      inactiveCuttingContractors: 0,
      totalCuttingOperations: 0,
      activeCuttingOperations: 0,
      completedCuttingOperations: 0,
      cancelledCuttingOperations: 0,
    },
    revenueData: [],
    monthlyTarget: {
      achieved: 0,
      target: 30000
    },
    taskCompletion: {
      value: 0,
      target: 100
    }
  });
  const { formatCurrency } = useCurrencyFormatter();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        flexGrow: 1,
        p: { xs: 2, sm: 3 },
        minHeight: '100vh',
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            Dashboard Overview
          </Typography>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 600 }}
          >
            Welcome back! Here's what's happening with your business today.
          </Typography>
        </motion.div>
      </Box>

      {/* Key Metrics Section */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <GlassCard
              sx={{
                p: 3,
                height: '100%',
                background: alpha(theme.palette.background.paper, 0.8),
              }}
            >
              <Typography variant="h6" sx={{ mb: 3 }}>Revenue Trends</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={dashboardData.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis
                    dataKey="month"
                    stroke={theme.palette.text.secondary}
                    tick={{ fill: theme.palette.text.secondary }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatCurrency(value)}
                    stroke={theme.palette.text.secondary}
                    tick={{ fill: theme.palette.text.secondary }}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px',
                      boxShadow: theme.shadows[3],
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={theme.palette.primary.main}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ProgressCard
                  title="Monthly Target"
                  value={dashboardData.monthlyTarget.achieved}
                  target={dashboardData.monthlyTarget.target}
                  color="25, 118, 210"
                  period={new Date().toISOString().split('T')[0].substring(0, 7) + '-01'}
                  isMonetary={true}
                />
              </Grid>
              <Grid item xs={12}>
                <ProgressCard
                  title="Task Completion"
                  value={dashboardData.summary.completedTasks}
                  target={dashboardData.summary.totalTasks}
                  color="46, 125, 50"
                  isMonetary={false}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* Navigation Tabs */}
      <GlassCard
        sx={{
          mb: 4,
          borderRadius: 2,
          boxShadow: 'none',
          p: 1,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: 48,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              minHeight: 48,
              flex: 1,
              mx: 0.5,
              borderRadius: 2,
              color: theme.palette.text.secondary,
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
              },
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.04),
              },
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          }}
        >
          <Tab
            icon={<TerrainIcon sx={{ fontSize: '1.1rem' }} />}
            label="Operations"
            iconPosition="start"
          />
          <Tab
            icon={<AccountBalanceIcon sx={{ fontSize: '1.1rem' }} />}
            label="Finance"
            iconPosition="start"
          />
          <Tab
            icon={<PeopleIcon sx={{ fontSize: '1.1rem' }} />}
            label="HR"
            iconPosition="start"
          />
          <Tab
            icon={<InventoryIcon sx={{ fontSize: '1.1rem' }} />}
            label="Inventory"
            iconPosition="start"
          />
        </Tabs>
      </GlassCard>

      {/* Operations Tab */}
      {activeTab === 0 && (
        <>
          <DashboardSection title="Land Management" delay={100}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Total Lands"
                  value={dashboardData.summary.totalLands.toString()}
                  icon={TerrainIcon}
                  gradientColor="secondary"
                  iconColor="#9C27B0"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Owned Lands"
                  value={dashboardData.summary.ownedLands.toString()}
                  icon={OwnedIcon}
                  gradientColor="error"
                  iconColor="#D32F2F"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Rented Lands"
                  value={dashboardData.summary.rentedLands.toString()}
                  icon={RentedIcon}
                  gradientColor="warning"
                  iconColor="#ED6C02"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Total Area"
                  value={`${Number(dashboardData.summary.totalArea).toFixed(2)} ha`}
                  icon={AreaIcon}
                  gradientColor="info"
                  iconColor="#0288D1"
                />
              </Grid>
            </Grid>
          </DashboardSection>

          <DashboardSection title="Cutting Management" delay={200}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={WorkerIcon}
                  title="Active Contractors"
                  value={dashboardData.summary.cuttingStats?.activeCuttingContractors || 0}
                  subtitle={`${dashboardData.summary.cuttingStats?.activeCuttingOperations || 0} Active Operations`}
                  iconColor="#9C27B0"
                  gradientColor="secondary"
                  trend={`${dashboardData.summary.cuttingStats?.cuttingContractors || 0} Total Contractors`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={AssignmentIcon}
                  title="Active Operations"
                  value={dashboardData.summary.cuttingStats?.activeCuttingOperations || 0}
                  subtitle="In Progress"
                  iconColor="#D32F2F"
                  gradientColor="error"
                  trend={`${dashboardData.summary.cuttingStats?.completedCuttingOperations || 0} Completed`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={ForestIcon}
                  title="Total Operations"
                  value={dashboardData.summary.cuttingStats?.totalCuttingOperations || 0}
                  subtitle="All Time"
                  iconColor="#ED6C02"
                  gradientColor="warning"
                  trend={`${dashboardData.summary.cuttingStats?.cancelledCuttingOperations || 0} Cancelled`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={ContractorsIcon}
                  title="Total Contractors"
                  value={dashboardData.summary.cuttingStats?.cuttingContractors || 0}
                  subtitle={`${dashboardData.summary.cuttingStats?.inactiveCuttingContractors || 0} Inactive`}
                  iconColor="#0288D1"
                  gradientColor="info"
                  trend={`${dashboardData.summary.cuttingStats?.activeCuttingContractors || 0} Active`}
                />
              </Grid>
            </Grid>
          </DashboardSection>

          <DashboardSection title="Manufacturing Management" delay={300}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={WorkerIcon}
                  title="Active Contractors"
                  value={dashboardData.summary.manufacturingStats?.activeManufacturingContractors || 0}
                  subtitle={`${dashboardData.summary.manufacturingStats?.activeManufacturingAssignments || 0} Active Assignments`}
                  iconColor="#9C27B0"
                  gradientColor="secondary"
                  trend={`${dashboardData.summary.manufacturingStats?.manufacturingContractors || 0} Total Contractors`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={AssignmentIcon}
                  title="Active Assignments"
                  value={dashboardData.summary.manufacturingStats?.activeManufacturingAssignments || 0}
                  subtitle="In Progress"
                  iconColor="#D32F2F"
                  gradientColor="error"
                  trend={`${dashboardData.summary.manufacturingStats?.completedManufacturingAssignments || 0} Completed`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={ProductIcon}
                  title="Total Assignments"
                  value={dashboardData.summary.manufacturingStats?.totalManufacturingAssignments || 0}
                  subtitle="All Time"
                  iconColor="#ED6C02"
                  gradientColor="warning"
                  trend={`${dashboardData.summary.manufacturingStats?.cancelledManufacturingAssignments || 0} Cancelled`}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={ContractorsIcon}
                  title="Total Contractors"
                  value={dashboardData.summary.manufacturingStats?.manufacturingContractors || 0}
                  subtitle={`${dashboardData.summary.manufacturingStats?.inactiveManufacturingContractors || 0} Inactive`}
                  iconColor="#0288D1"
                  gradientColor="info"
                  trend={`${dashboardData.summary.manufacturingStats?.activeManufacturingContractors || 0} Active`}
                />
              </Grid>
            </Grid>
          </DashboardSection>

          <DashboardSection title="Task Management" delay={400}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Total Tasks"
                  value={dashboardData.summary.totalTasks.toString()}
                  icon={TaskIcon}
                  gradientColor="primary"
                  iconColor="#1976D2"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Completed Tasks"
                  value={dashboardData.summary.completedTasks.toString()}
                  icon={CompletedIcon}
                  gradientColor="success"
                  iconColor="#2E7D32"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Pending Tasks"
                  value={dashboardData.summary.pendingTasks.toString()}
                  icon={PendingIcon}
                  gradientColor="warning"
                  iconColor="#ED6C02"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="In Progress"
                  value={dashboardData.summary.inProgressTasks.toString()}
                  icon={InProgressIcon}
                  gradientColor="info"
                  iconColor="#0288D1"
                />
              </Grid>
            </Grid>
          </DashboardSection>
        </>
      )}

      {/* Finance Tab */}
      {activeTab === 1 && (
        <>
          <DashboardSection title="Financial Overview" delay={100}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={AccountBalanceIcon}
                  title="Total Revenue"
                  value={formatCurrency(dashboardData.summary.accountingSummary?.totalIncome || 0)}
                  iconColor="#9C27B0"
                  gradientColor="secondary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={PaymentsIcon}
                  title="Total Expenses"
                  value={formatCurrency(dashboardData.summary.accountingSummary?.totalExpenses || 0)}
                  iconColor="#D32F2F"
                  gradientColor="error"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={TrendingUp}
                  title="Net Income"
                  value={formatCurrency(dashboardData.summary.accountingSummary?.netIncome || 0)}
                  iconColor="#ED6C02"
                  gradientColor="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={AccountBalanceWalletIcon}
                  title="Cash Balance"
                  value={formatCurrency(dashboardData.summary.accountingSummary?.cashBalance || 0)}
                  iconColor="#0288D1"
                  gradientColor="info"
                />
              </Grid>
            </Grid>
          </DashboardSection>

          <DashboardSection title="Loan Management" delay={200}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={AccountBalanceIcon}
                  title="Active Loans"
                  value={dashboardData.summary.loanSummary?.activeLoans || 0}
                  iconColor="#D32F2F"
                  gradientColor="error"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={AccountBalanceIcon}
                  title="Total Loan Amount"
                  value={formatCurrency(dashboardData.summary.loanSummary?.totalLoaned || 0)}
                  iconColor="#9C27B0"
                  gradientColor="secondary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={PaymentsIcon}
                  title="Total Repaid"
                  value={formatCurrency(dashboardData.summary.loanSummary?.totalRepaid || 0)}
                  iconColor="#ED6C02"
                  gradientColor="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={WarningIcon}
                  title="Outstanding Balance"
                  value={formatCurrency(dashboardData.summary.loanSummary?.outstandingAmount || 0)}
                  iconColor="#0288D1"
                  gradientColor="info"
                />
              </Grid>
            </Grid>
          </DashboardSection>
        </>
      )}

      {/* HR Tab */}
      {activeTab === 2 && (
        <>
          <DashboardSection title="Employee Overview" delay={100}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Total Employees"
                  value={dashboardData.summary.totalEmployees.toString()}
                  icon={PeopleIcon}
                  gradientColor="primary"
                  iconColor="#1976D2"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Active Employees"
                  value={dashboardData.summary.activeEmployees.toString()}
                  icon={ActiveUserIcon}
                  gradientColor="success"
                  iconColor="#2E7D32"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Monthly Salary Cost"
                  value={formatCurrency(dashboardData.summary.monthlySalaryCost)}
                  icon={SalaryIcon}
                  gradientColor="secondary"
                  iconColor="#9C27B0"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Departments"
                  value={dashboardData.summary.departmentsCount.toString()}
                  icon={BusinessIcon}
                  gradientColor="info"
                  iconColor="#0288D1"
                />
              </Grid>
            </Grid>
          </DashboardSection>

          <DashboardSection title="HR Management" delay={200}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Total Advances"
                  value={dashboardData.summary.totalAdvances.toString()}
                  icon={AdvanceIcon}
                  gradientColor="primary"
                  iconColor="#1976D2"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Approved Advances"
                  value={dashboardData.summary.approvedAdvances.toString()}
                  icon={ApprovedIcon}
                  gradientColor="success"
                  iconColor="#2E7D32"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Pending Advances"
                  value={dashboardData.summary.pendingAdvances.toString()}
                  icon={PendingAdvanceIcon}
                  gradientColor="warning"
                  iconColor="#ED6C02"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  title="Total Payrolls"
                  value={dashboardData.summary.totalPayrolls.toString()}
                  icon={PayrollIcon}
                  gradientColor="info"
                  iconColor="#0288D1"
                />
              </Grid>
            </Grid>
          </DashboardSection>
        </>
      )}

      {/* Inventory Tab */}
      {activeTab === 3 && (
        <>
          <DashboardSection title="Inventory Status" delay={100}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={InventoryIcon}
                  title="Total Items"
                  value={dashboardData.summary.inventoryStats?.activeItems || 0}
                  iconColor="#9C27B0"
                  gradientColor="secondary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={AlertIcon}
                  title="Low Stock Items"
                  value={dashboardData.summary.inventoryStats?.lowStockItems || 0}
                  iconColor="#D32F2F"
                  gradientColor="error"
                  tooltip={dashboardData.summary.inventoryStats?.lowStockItems > 0 ?
                    "Items below minimum stock level" : "No items below minimum stock level"}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={ManufacturingIcon}
                  title="Total Transactions"
                  value={dashboardData.summary.inventoryStats?.totalTransactions || 0}
                  iconColor="#ED6C02"
                  gradientColor="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={ValueIcon}
                  title="Total Value"
                  value={formatCurrency(dashboardData.summary.inventoryStats?.totalInventoryValue || 0)}
                  iconColor="#0288D1"
                  gradientColor="info"
                />
              </Grid>
            </Grid>
          </DashboardSection>

          <DashboardSection title="Asset Management" delay={200}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={Build}
                  title="Active Assets"
                  value={dashboardData.summary.activeAssets || 0}
                  iconColor="#9C27B0"
                  gradientColor="secondary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={AttachMoney}
                  title="Total Asset Value"
                  value={formatCurrency(dashboardData.summary.totalAssetValue || 0)}
                  iconColor="#D32F2F"
                  gradientColor="error"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={Timeline}
                  title="Pending Maintenance"
                  value={dashboardData.summary.pendingMaintenance || 0}
                  iconColor="#ED6C02"
                  gradientColor="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <EnhancedSummaryCard
                  icon={Construction}
                  title="Avg Maintenance Cost"
                  value={formatCurrency(dashboardData.summary.avgMaintenanceCost || 0)}
                  iconColor="#0288D1"
                  gradientColor="info"
                />
              </Grid>
            </Grid>
          </DashboardSection>
        </>
      )}
    </Box>
  );
};

export default Dashboard;