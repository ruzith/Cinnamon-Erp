import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  IconButton,
  LinearProgress,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Pending as PendingIcon,
  Schedule as InProgressIcon,
  Cancel as CancelIcon,
  PersonAdd as AssignIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Schedule,
  Clear as ClearIcon,
} from "@mui/icons-material";
import axios from "axios";
import SummaryCard from "../components/common/SummaryCard";
import { useSnackbar } from "notistack";

const TaskManagement = () => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium",
    status: "pending",
    due_date: "",
    category_id: "",
    estimated_hours: "",
    notes: "",
  });
  const [activeTab, setActiveTab] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [taskReportDialog, setTaskReportDialog] = useState(false);
  const [selectedTaskReport, setSelectedTaskReport] = useState(null);
  const [taskReport, setTaskReport] = useState(null);
  const [taskReports, setTaskReports] = useState([]);
  const [filters, setFilters] = useState({
    employee: "",
    startDate: null,
    endDate: null,
    category: "",
  });
  const [reassignDialog, setReassignDialog] = useState(false);
  const [reassignmentData, setReassignmentData] = useState({
    oldCategoryId: null,
    newCategoryId: "",
    affectedTasks: [],
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchCategories();
    fetchTaskReports();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/task-categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get("/api/tasks");
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchTaskReports = async () => {
    try {
      let url = "/api/tasks/reports?";
      const params = new URLSearchParams();

      if (filters.employee) {
        params.append("employee", filters.employee);
      }
      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }
      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }
      if (filters.category) {
        params.append("category", filters.category);
      }

      const response = await axios.get(`${url}${params.toString()}`);
      setTaskReports(response.data);
    } catch (error) {
      console.error("Error fetching task reports:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 2) {
      fetchTaskReports();
    }
  }, [filters, activeTab]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setSelectedTask(task);
      setFormData({
        title: task.title,
        description: task.description,
        assigned_to: task.assigned_to || "",
        priority: task.priority,
        status: task.status,
        due_date: task.due_date?.split("T")[0] || "",
        category_id: task.category_id || "",
        estimated_hours: task.estimated_hours,
        notes: task.notes,
      });
    } else {
      setSelectedTask(null);
      setFormData({
        title: "",
        description: "",
        assigned_to: "",
        priority: "medium",
        status: "pending",
        due_date: "",
        category_id: "",
        estimated_hours: "",
        notes: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedTask) {
        await axios.put(`/api/tasks/${selectedTask.id}`, formData);
        enqueueSnackbar("Task updated successfully", { variant: "success" });
      } else {
        await axios.post("/api/tasks", formData);
        enqueueSnackbar("Task created successfully", { variant: "success" });
      }
      handleCloseDialog();
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      enqueueSnackbar("Error saving task", { variant: "error" });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        fetchTasks();
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  const handleCancelTask = async (taskId) => {
    if (window.confirm("Are you sure you want to cancel this task?")) {
      try {
        await axios.put(`/api/tasks/${taskId}`, { status: "cancelled" });
        fetchTasks();
      } catch (error) {
        console.error("Error cancelling task:", error);
      }
    }
  };

  // Calculate summary statistics
  const summaryStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((task) => task.status === "completed").length,
    pendingTasks: tasks.filter((task) => task.status === "pending").length,
    inProgressTasks: tasks.filter((task) => task.status === "in_progress")
      .length,
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "in_progress":
        return "info";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return "default";

    switch (priority.toLowerCase()) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getCategoryColor = (categoryName) => {
    if (!categoryName) return "default";

    // Find the category object by name to get its ID
    const category = categories.find((c) => c.name === categoryName);
    if (!category) return "default";

    // List of available MUI colors
    const colors = [
      "primary",
      "secondary",
      "success",
      "warning",
      "error",
      "info",
    ];

    // Use the category ID to consistently assign a color
    return colors[category.id % colors.length];
  };

  const handleOpenCategoryDialog = (category = null) => {
    if (category) {
      setSelectedCategory(category);
      setCategoryFormData({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setSelectedCategory(null);
      setCategoryFormData({
        name: "",
        description: "",
      });
    }
    setCategoryDialog(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialog(false);
    setSelectedCategory(null);
  };

  const handleCategoryInputChange = (e) => {
    setCategoryFormData({
      ...categoryFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedCategory) {
        await axios.put(
          `/api/task-categories/${selectedCategory.id}`,
          categoryFormData
        );
      } else {
        await axios.post("/api/task-categories", categoryFormData);
      }
      await fetchCategories();
      handleCloseCategoryDialog();
    } catch (error) {
      console.error("Error saving task category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await axios.delete(`/api/task-categories/${categoryId}`);
        await fetchCategories();
      } catch (error) {
        if (error.response?.data?.hasTasks) {
          // Get tasks using this category
          const tasksResponse = await axios.get(`/api/tasks`, {
            params: {
              category_id: categoryId,
            },
          });
          setReassignmentData({
            oldCategoryId: categoryId,
            newCategoryId: "",
            affectedTasks: tasksResponse.data.filter(
              (task) => task.category_id === categoryId
            ),
          });
          setReassignDialog(true);
        } else {
          console.error("Error deleting category:", error);
          alert("Failed to delete category");
        }
      }
    }
  };

  const handleReassignmentClose = () => {
    setReassignDialog(false);
    setReassignmentData({
      oldCategoryId: null,
      newCategoryId: "",
      affectedTasks: [],
    });
  };

  const handleReassignmentSubmit = async () => {
    if (!reassignmentData.newCategoryId) {
      return;
    }

    try {
      // Single API call to reassign tasks and delete category
      await axios.post(
        `/api/task-categories/${reassignmentData.oldCategoryId}/reassign`,
        {
          newCategoryId: reassignmentData.newCategoryId,
        }
      );

      // Refresh the data
      await fetchCategories();
      await fetchTasks();
      handleReassignmentClose();
    } catch (error) {
      console.error("Error in reassignment:", error);
      alert("Failed to reassign tasks and delete category");
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleOpenAssignDialog = (task) => {
    setSelectedTask(task);
    setSelectedEmployee(task.assigned_to?.id || "");
    setAssignDialog(true);
  };

  const handleCloseAssignDialog = () => {
    setAssignDialog(false);
    setSelectedTask(null);
    setSelectedEmployee("");
  };

  const handleAssignTask = async () => {
    try {
      await axios.put(`/api/tasks/${selectedTask.id}/assign`, {
        employee_id: selectedEmployee,
      });
      handleCloseAssignDialog();
      fetchTasks();
      enqueueSnackbar("Task assigned successfully", { variant: "success" });
    } catch (error) {
      console.error("Error assigning task:", error);
      enqueueSnackbar("Error assigning task", { variant: "error" });
    }
  };

  const handleOpenTaskReport = async (task) => {
    setSelectedTaskReport(task);
    try {
      // Fetch task report data
      const response = await axios.get(`/api/tasks/${task.id}/report`);
      setTaskReport(response.data);
      setTaskReportDialog(true);
    } catch (error) {
      console.error("Error fetching task report:", error);
    }
  };

  const handleCloseTaskReport = () => {
    setTaskReportDialog(false);
    setSelectedTaskReport(null);
    setTaskReport(null);
  };

  const handleClearFilter = (fieldName) => {
    setFilters((prev) => ({
      ...prev,
      [fieldName]: fieldName.includes("date") ? null : "",
    }));
  };

  const TaskReportDialog = () => (
    <Dialog
      open={taskReportDialog}
      onClose={handleCloseTaskReport}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Task Report - {selectedTaskReport?.title}</DialogTitle>
      <DialogContent>
        {taskReport && (
          <Box>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Estimated Hours"
                  value={`${taskReport.estimated_hours || 0} hrs`}
                  icon={TimelineIcon}
                  iconColor="primary.main"
                  gradientColor="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Progress"
                  value={`${taskReport.progress || 0}%`}
                  icon={AssessmentIcon}
                  iconColor="info.main"
                  gradientColor="info"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Days Remaining"
                  value={taskReport.days_remaining}
                  icon={Schedule}
                  iconColor="warning.main"
                  gradientColor="warning"
                />
              </Grid>
            </Grid>

            {/* Task Details */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              Task Details
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Description
                    </Typography>
                    <Typography>
                      {taskReport.description || "No description"}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category
                    </Typography>
                    <Chip
                      label={taskReport.category_name || "No Category"}
                      size="small"
                      color={getCategoryColor(taskReport.category_name)}
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography>
                      {taskReport.due_date
                        ? new Date(taskReport.due_date).toLocaleDateString()
                        : "Not set"}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Notes
                    </Typography>
                    <Typography>{taskReport.notes || "No notes"}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Assigned To
                    </Typography>
                    <Typography>
                      {taskReport.assigned_to_name || "Unassigned"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Priority
                      </Typography>
                      <Chip
                        label={taskReport.priority || "Not Set"}
                        color={getPriorityColor(taskReport.priority)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={taskReport.status}
                        color={getStatusColor(taskReport.status)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Task History */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              History & Updates
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Updated By</TableCell>
                    <TableCell>Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {taskReport.history?.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={entry.status}
                          color={getStatusColor(entry.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{entry.updated_by}</TableCell>
                      <TableCell>{entry.comments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseTaskReport}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  const ReassignmentDialog = () => (
    <Dialog
      open={reassignDialog}
      onClose={handleReassignmentClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Reassign Tasks</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This category has tasks assigned to it. Please select a new category
            for these tasks before deleting.
          </Alert>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>New Category</InputLabel>
            <Select
              value={reassignmentData.newCategoryId}
              onChange={(e) =>
                setReassignmentData((prev) => ({
                  ...prev,
                  newCategoryId: e.target.value,
                }))
              }
              label="New Category"
            >
              {categories
                .filter((c) => c.id !== reassignmentData.oldCategoryId)
                .map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Affected Tasks ({reassignmentData.affectedTasks.length}):
          </Typography>
          <List dense>
            {reassignmentData.affectedTasks.map((task) => (
              <ListItem key={task.id}>
                <ListItemText
                  primary={task.title}
                  secondary={task.description}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReassignmentClose}>Cancel</Button>
        <Button
          onClick={handleReassignmentSubmit}
          color="primary"
          disabled={!reassignmentData.newCategoryId}
        >
          Reassign and Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Task Management
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenCategoryDialog()}
          >
            New Category
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Task
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={TaskIcon}
            title="Total Tasks"
            value={summaryStats.totalTasks}
            iconColor="#1976d2"
            gradientColor="primary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={CompletedIcon}
            title="Completed"
            value={summaryStats.completedTasks}
            iconColor="#2e7d32"
            gradientColor="success"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={PendingIcon}
            title="Pending"
            value={summaryStats.pendingTasks}
            iconColor="#ed6c02"
            gradientColor="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={InProgressIcon}
            title="In Progress"
            value={summaryStats.inProgressTasks}
            iconColor="#0288d1"
            gradientColor="info"
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 2 }}
        >
          <Tab label="Tasks" />
          <Tab label="Categories" />
          <Tab label="Reports" />
        </Tabs>

        {/* Tasks Tab Content */}
        {activeTab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: "35%", maxWidth: "400px" }}>
                    Title
                  </TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell
                      sx={{
                        width: "35%",
                        maxWidth: "400px",
                        "& .MuiTypography-root": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        },
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {task.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {task.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {task.category_name && (
                        <Chip
                          label={task.category_name}
                          size="small"
                          color={getCategoryColor(task.category_name)}
                          sx={{ textTransform: "capitalize" }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {task.assigned_to_name || "Unassigned"}
                    </TableCell>
                    <TableCell>
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.priority || "Not Set"}
                        color={getPriorityColor(task.priority)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.status}
                        color={getStatusColor(task.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        {task.status !== "cancelled" && (
                          <Button
                            size="small"
                            color="warning"
                            onClick={() => handleCancelTask(task.id)}
                          >
                            Cancel
                          </Button>
                        )}
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {task.status !== "cancelled" && (
                            <IconButton
                              size="small"
                              onClick={() => handleOpenAssignDialog(task)}
                              sx={{ color: "info.main" }}
                              title="Assign Task"
                            >
                              <AssignIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(task)}
                            sx={{ color: "primary.main" }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTask(task.id)}
                            sx={{ color: "error.main" }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Categories Tab Content */}
        {activeTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Task Count</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description || "-"}</TableCell>
                    <TableCell>{category.task_count || 0}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenCategoryDialog(category)}
                        sx={{ color: "primary.main" }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteCategory(category.id)}
                        sx={{ color: "error.main", ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Task Reports Tab Content */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            {/* Filters Section */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Employee</InputLabel>
                    <Select
                      value={filters.employee}
                      label="Employee"
                      onChange={(e) =>
                        handleFilterChange("employee", e.target.value)
                      }
                      endAdornment={
                        filters.employee && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() => handleClearFilter("employee")}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>All Employees</em>
                      </MenuItem>
                      {employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={filters.category}
                      label="Category"
                      onChange={(e) =>
                        handleFilterChange("category", e.target.value)
                      }
                      endAdornment={
                        filters.category && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() => handleClearFilter("category")}
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>All Categories</em>
                      </MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: filters.startDate && (
                        <IconButton
                          size="small"
                          onClick={() => handleClearFilter("startDate")}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: filters.endDate && (
                        <IconButton
                          size="small"
                          onClick={() => handleClearFilter("endDate")}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                      inputProps: {
                        min: filters.startDate || undefined,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Reports Grid */}
            <Grid container spacing={3}>
              {taskReports.map((task) => (
                <Grid item xs={12} md={6} lg={4} key={task.id}>
                  <Paper
                    sx={{
                      p: 2,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: "action.hover",
                      },
                    }}
                    onClick={() => handleOpenTaskReport(task)}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {task.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {task.description}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Status
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={task.status}
                            color={getStatusColor(task.status)}
                            size="small"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Priority
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={task.priority || "Not Set"}
                            color={getPriorityColor(task.priority)}
                            size="small"
                          />
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Assigned To
                      </Typography>
                      <Typography variant="body2">
                        {task.assigned_to_name || "Unassigned"}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: "auto", pt: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AssessmentIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTaskReport(task);
                        }}
                      >
                        View Report
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Task Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTask ? "Edit Task" : "Create New Task"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Task Title"
                fullWidth
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  name="assigned_to"
                  value={formData.assigned_to || ""}
                  label="Assigned To"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {employees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="due_date"
                label="Due Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.due_date}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  label="Priority"
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  label="Status"
                  onChange={handleInputChange}
                  required
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category_id"
                  value={formData.category_id || ""}
                  label="Category"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">
                    <em>No Category</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="estimated_hours"
                label="Estimated Hours"
                type="number"
                fullWidth
                value={formData.estimated_hours || ""}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 0, step: 0.5 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} color="primary">
            {selectedTask ? "Update Task" : "Create Task"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog
        open={assignDialog}
        onClose={handleCloseAssignDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Assign Task</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel required>Assign To</InputLabel>
              <Select
                value={selectedEmployee}
                label="Assign To"
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                {employees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignTask}
            color="primary"
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={categoryDialog}
        onClose={handleCloseCategoryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedCategory ? "Edit Category" : "New Category"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Category Name"
                fullWidth
                value={categoryFormData.name}
                onChange={handleCategoryInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={categoryFormData.description}
                onChange={handleCategoryInputChange}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCategoryDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCategorySubmit}
            color="primary"
          >
            {selectedCategory ? "Update Category" : "Create Category"}
          </Button>
        </DialogActions>
      </Dialog>

      <TaskReportDialog />
      <ReassignmentDialog />
    </Box>
  );
};

export default TaskManagement;
