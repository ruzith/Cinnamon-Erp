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
  InputAdornment,
  TableSortLabel,
  FormHelperText,
  List,
  ListItem,
  ListItemText,
  Checkbox,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Factory as FactoryIcon,
  Inventory as ProductIcon,
  Engineering as WorkerIcon,
  Grade as QualityIcon,
  CreditCard as CreditCardIcon,
  ShoppingCart as ShoppingCartIcon,
  Speed as SpeedIcon,
  Grade as GradeIcon,
  Print as PrintIcon,
  Clear as ClearIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Money as MoneyIcon,
  Paid as PaidIcon,
  Assignment as AssignmentIcon,
  Groups as ContractorsIcon,
} from "@mui/icons-material";
import axios from "axios";
import PurchaseInvoiceForm from "../components/manufacturing/PurchaseInvoiceForm";
import { useCurrencyFormatter } from "../utils/currencyUtils";
import { formatDate, getCurrentDateTime } from "../utils/dateUtils";
import SummaryCard from "../components/common/SummaryCard";
import { fetchCuttingContractors } from "../features/cutting/cuttingSlice";
import { useSnackbar } from "notistack";

const STATUS_OPTIONS = ["planned", "in_progress", "completed", "cancelled"];

const ADVANCE_PAYMENT_STATUSES = {
  pending: { color: "warning", label: "Pending" },
  paid: { color: "success", label: "Paid" },
  used: { color: "info", label: "Used" },
  cancelled: { color: "error", label: "Cancelled" },
};

const Manufacturing = () => {
  const [manufacturingOrders, setManufacturingOrders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contractor_id: "",
    phone: "",
    address: "",
    status: "active",
  });
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [orderFormData, setOrderFormData] = useState({
    product_id: "",
    quantity: "",
    status: "planned",
    priority: "normal",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    notes: "",
  });
  const [products, setProducts] = useState([]);
  const [assignmentFormData, setAssignmentFormData] = useState({
    contractor_id: "",
    duration: 1,
    duration_type: "day",
    start_date: new Date().toISOString().split("T")[0],
    raw_material_id: "",
    raw_material_quantity: "",
    notes: "",
  });
  const [advancePaymentData, setAdvancePaymentData] = useState({
    amount: "",
    notes: "",
  });
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [manufacturingContractors, setManufacturingContractors] = useState([]);
  const [cuttingContractors, setCuttingContractors] = useState([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [openPurchaseDialog, setOpenPurchaseDialog] = useState(false);
  const { formatCurrency } = useCurrencyFormatter();
  const [openReassignDialog, setOpenReassignDialog] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState(null);
  const [newContractorId, setNewContractorId] = useState("");
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openInvoiceDialog, setOpenInvoiceDialog] = useState(false);
  const [assignmentFilters, setAssignmentFilters] = useState({
    contractor_name: "",
    start_date: "",
    end_date: "",
  });
  const [reportData, setReportData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [assignmentDialogSource, setAssignmentDialogSource] = useState(null);
  const [openCompletionDialog, setOpenCompletionDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [completionFormData, setCompletionFormData] = useState({
    assignment_id: "",
    raw_item_id: "",
    finished_good_id: "",
    quantity_received: "",
  });
  const [finishedGoods, setFinishedGoods] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [advancePayments, setAdvancePayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [reassignDialog, setReassignDialog] = useState(false);
  const [reassignmentData, setReassignmentData] = useState({
    oldContractorId: null,
    newContractorId: "",
    advancePayments: [],
    assignments: [],
    manufacturingPayments: [],
    purchaseInvoices: [] // Keep this for backward compatibility
  });
  const [openManufacturingPaymentDialog, setOpenManufacturingPaymentDialog] =
    useState(false);
  const [manufacturingPaymentFormData, setManufacturingPaymentFormData] =
    useState({
      contractor_id: "",
      assignment_id: "",
      quantity_kg: "",
      price_per_kg: "",
      total_amount: "",
      notes: "",
      status: "pending",
      id: null,
      finished_good_id: "",
      selectedAdvancePayments: [],
    });
  const [manufacturingPayments, setManufacturingPayments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchManufacturingContractors();
    fetchCuttingContractors();
    fetchAssignments();
    fetchRawMaterials();
    fetchPurchases();
    fetchFinishedGoods();
    fetchAdvancePayments();
    fetchManufacturingPayments();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("/api/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchManufacturingContractors = async () => {
    try {
      const response = await axios.get(
        "/api/manufacturing/contractors?include_contribution=true"
      );
      setManufacturingContractors(response.data);
    } catch (error) {
      console.error("Error fetching manufacturing contractors:", error);
    }
  };

  const fetchCuttingContractors = async () => {
    try {
      const response = await axios.get(
        "/api/cutting/contractors?include_contribution=true"
      );
      setCuttingContractors(response.data);
    } catch (error) {
      console.error("Error fetching cutting contractors:", error);
    }
  };

  const fetchFinishedGoods = async () => {
    try {
      const response = await axios.get("/api/inventory/finished-goods");
      setFinishedGoods(response.data);
    } catch (error) {
      console.error("Error fetching finished goods:", error);
    }
  };

  const fetchAdvancePayments = async () => {
    try {
      const response = await axios.get("/api/manufacturing/advance-payments");
      setAdvancePayments(response.data);
    } catch (error) {
      console.error("Error fetching advance payments:", error);
    }
  };

  const fetchManufacturingPayments = async () => {
    try {
      const response = await axios.get("/api/manufacturing/payments");
      setManufacturingPayments(response.data);
    } catch (error) {
      console.error("Error fetching manufacturing payments:", error);
      enqueueSnackbar("Error fetching manufacturing payments", {
        variant: "error",
      });
    }
  };

  const handleOpenDialog = (contractor = null) => {
    if (contractor) {
      setSelectedContractor(contractor);
      setFormData({
        name: contractor.name,
        contractor_id: contractor.contractor_id,
        phone: contractor.phone,
        address: contractor.address,
        status: contractor.status || "active",
      });
    } else {
      setSelectedContractor(null);
      setFormData({
        name: "",
        contractor_id: "",
        phone: "",
        address: "",
        status: "active",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "assignedWorkers"
          ? typeof value === "string"
            ? value.split(",")
            : value
          : value,
    }));
  };

  const handleContractorSubmit = async () => {
    try {
      const response = await axios[selectedContractor ? "put" : "post"](
        `/api/manufacturing/contractors${
          selectedContractor ? `/${selectedContractor.id}` : ""
        }`,
        formData
      );

      if (response.status === 200 || response.status === 201) {
        setOpenDialog(false);
        setSelectedContractor(null);
        setFormData({
          name: "",
          contractor_id: "",
          phone: "",
          address: "",
          status: "active",
        });
        fetchManufacturingContractors();
      }
    } catch (error) {
      console.error("Error submitting contractor:", error);
      alert(error.response?.data?.message || "Error submitting contractor");
    }
  };

  const handleDeleteContractor = async (contractorId) => {
    try {
      const response = await axios.get(
        `/api/manufacturing/contractors/${contractorId}/related-data`
      );
      const relatedData = response.data;

      if (relatedData.hasRelatedData) {
        setReassignmentData({
          oldContractorId: contractorId,
          newContractorId: "",
          advancePayments: relatedData.advancePayments || [],
          assignments: relatedData.assignments || [],
          manufacturingPayments: relatedData.manufacturingPayments || [],
          purchaseInvoices: [] // Keep this for backward compatibility
        });
        setReassignDialog(true);
      } else {
        await axios.delete(`/api/manufacturing/contractors/${contractorId}`);
        enqueueSnackbar("Contractor deleted successfully", {
          variant: "success",
        });
        fetchManufacturingContractors();
      }
    } catch (error) {
      console.error("Error deleting contractor:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error deleting contractor",
        {
          variant: "error",
        }
      );
    }
  };

  const calculateAverageQuality = (orders) => {
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    );
    if (!completedOrders.length) return 0;

    const qualityMap = { A: 4, B: 3, C: 2, D: 1 };
    const sum = completedOrders.reduce(
      (acc, order) => acc + (qualityMap[order.qualityGrade] || 0),
      0
    );
    return (sum / completedOrders.length).toFixed(1);
  };

  const summaryStats = {
    totalOrders: manufacturingOrders.length,
    activeOrders: manufacturingOrders.filter(
      (order) => order.status === "in_progress"
    ).length,
    completedOrders: manufacturingOrders.filter(
      (order) => order.status === "completed"
    ).length,
    averageQuality: calculateAverageQuality(manufacturingOrders),
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "success";
      case "in_progress":
      case "active":
        return "info";
      case "pending":
      case "planned":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const handleOpenAssignmentDialog = (assignment = null, contractor = null) => {
    setAssignmentDialogSource(contractor ? "table" : "header");

    setAssignmentFormData({
      contractor_id: contractor ? contractor.id : "",
      duration: 1,
      duration_type: "day",
      start_date: formatDate(getCurrentDateTime(), "YYYY-MM-DD"),
      raw_material_id: "",
      raw_material_quantity: "",
      notes: "",
    });

    if (assignment) {
      setAssignmentFormData({
        id: assignment.id,
        contractor_id: assignment.contractor_id,
        duration: assignment.duration,
        duration_type: assignment.duration_type,
        start_date: assignment.start_date
          ? formatDate(assignment.start_date, "YYYY-MM-DD")
          : formatDate(getCurrentDateTime(), "YYYY-MM-DD"),
        raw_material_id: assignment.raw_material_id,
        raw_material_quantity: assignment.raw_material_quantity,
        notes: assignment.notes || "",
      });
    }

    setOpenAssignmentDialog(true);
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (assignmentFormData.id) {
        response = await axios.put(
          `/api/manufacturing/assignments/${assignmentFormData.id}`,
          assignmentFormData
        );
      } else {
        response = await axios.post(
          "/api/manufacturing/assignments",
          assignmentFormData
        );
      }

      await Promise.all([
        fetchAssignments(),
        fetchManufacturingContractors(),
        fetchRawMaterials(),
      ]);

      setOpenAssignmentDialog(false);
      setAssignmentDialogSource(null);
      setAssignmentFormData({
        id: null,
        contractor_id: "",
        duration: 1,
        duration_type: "day",
        start_date: new Date().toISOString().split("T")[0],
        raw_material_id: "",
        raw_material_quantity: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error saving assignment:", error);
      alert(error.response?.data?.message || "Error saving assignment");
    }
  };

  const handleOpenAdvancePaymentDialog = (contractor = null) => {
    if (contractor) {
      setAdvancePaymentData({
        contractor_id: contractor.id,
        amount: "",
        notes: "",
      });
    } else {
      setAdvancePaymentData({
        contractor_id: "",
        amount: "",
        notes: "",
      });
    }
    setOpenPaymentDialog(true);
  };

  const handleAdvancePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        ...advancePaymentData,
        contractor_id: parseInt(advancePaymentData.contractor_id),
      };

      if (selectedPayment) {
        // Update existing payment
        await axios.put(
          `/api/manufacturing/advance-payments/${selectedPayment.id}`,
          paymentData
        );
        enqueueSnackbar("Advance payment updated successfully", {
          variant: "success",
        });
      } else {
        // Create new payment
        const response = await axios.post(
          "/api/manufacturing/advance-payments",
          paymentData
        );

        if (response.data.receiptHtml) {
          const receiptWindow = window.open("", "_blank");
          if (receiptWindow) {
            receiptWindow.document.write(response.data.receiptHtml);
            receiptWindow.document.close();
            receiptWindow.onload = function () {
              receiptWindow.print();
            };
          } else {
            enqueueSnackbar("Please allow pop-ups to print receipts", {
              variant: "warning",
            });
          }
        }
        enqueueSnackbar("Advance payment processed successfully", {
          variant: "success",
        });
      }

      setOpenPaymentDialog(false);
      setSelectedPayment(null);
      setAdvancePaymentData({
        amount: "",
        notes: "",
      });
      await Promise.all([
        fetchAdvancePayments(),
        fetchManufacturingContractors(),
      ]);
    } catch (error) {
      console.error("Error processing advance payment:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error processing advance payment",
        {
          variant: "error",
        }
      );
    }
  };

  const fetchAssignments = async () => {
    try {
      const params = new URLSearchParams();
      if (assignmentFilters.contractor_name) {
        params.append("contractor_name", assignmentFilters.contractor_name);
      }
      if (assignmentFilters.start_date) {
        params.append("start_date", assignmentFilters.start_date);
      }
      if (assignmentFilters.end_date) {
        params.append("end_date", assignmentFilters.end_date);
      }

      const response = await axios.get(
        `/api/manufacturing/assignments?${params.toString()}`
      );
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleProcessPayment = (contractor) => {
    setManufacturingPaymentFormData({
      contractor_id: contractor.id,
      assignment_id: "",
      quantity_kg: "",
      price_per_kg: "",
      total_amount: "",
      notes: "",
      status: "pending",
    });
    setOpenManufacturingPaymentDialog(true);
  };

  const renderContractorActions = (contractor) => (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
      <Button
        size="small"
        color="success"
        onClick={() => handleOpenAssignmentDialog(null, contractor)}
      >
        Assign
      </Button>
      <Box sx={{ display: "flex", gap: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => handleOpenAdvancePaymentDialog(contractor)}
          sx={{ color: "warning.main" }}
          title="Advance Payment"
        >
          <MoneyIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleOpenDialog(contractor)}
          sx={{ color: "primary.main", ml: 1 }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleDeleteContractor(contractor.id)}
          sx={{ color: "error.main", ml: 1 }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    </Box>
  );

  const handleReassignAndDelete = async () => {
    if (!reassignmentData.newContractorId) {
      enqueueSnackbar("Please select a new contractor", { variant: "error" });
      return;
    }

    try {
      await axios.delete(
        `/api/manufacturing/contractors/${reassignmentData.oldContractorId}?forceDelete=true&newContractorId=${reassignmentData.newContractorId}`
      );
      setReassignDialog(false);
      setReassignmentData({
        oldContractorId: null,
        newContractorId: "",
        advancePayments: [],
        assignments: [],
        manufacturingPayments: [],
        purchaseInvoices: [] // Keep this for backward compatibility
      });
      enqueueSnackbar("Contractor deleted and data reassigned successfully", {
        variant: "success",
      });
      fetchManufacturingContractors();
      fetchAssignments();
    } catch (error) {
      console.error("Error in reassignment:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Failed to reassign tasks and delete contractor",
        { variant: "error" }
      );
    }
  };

  const fetchRawMaterials = async () => {
    try {
      const response = await axios.get("/api/inventory/raw-materials");
      setRawMaterials(response.data);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
    }
  };

  const handlePrintInvoice = async (purchase) => {
    try {
      const response = await axios.get(
        `/api/manufacturing/invoices/${purchase.id}/print`
      );

      const invoiceWindow = window.open("", "_blank");
      if (invoiceWindow) {
        invoiceWindow.document.write(response.data.invoiceHtml);
        invoiceWindow.document.close();

        invoiceWindow.onload = function () {
          invoiceWindow.print();
        };
      } else {
        alert("Please allow pop-ups to print invoices");
      }
    } catch (error) {
      console.error("Error printing invoice:", error);
      alert(error.response?.data?.message || "Error printing invoice");
    }
  };

  const generateReport = async () => {
    try {
      setReportError(null);
      const params = new URLSearchParams();
      if (assignmentFilters.contractor_name) {
        params.append("contractor_name", assignmentFilters.contractor_name);
      }
      if (assignmentFilters.start_date) {
        params.append("start_date", assignmentFilters.start_date);
      }
      if (assignmentFilters.end_date) {
        params.append("end_date", assignmentFilters.end_date);
      }

      const response = await axios.get(
        `/api/manufacturing/reports/assignments?${params.toString()}`
      );
      setReportData(response.data);
    } catch (error) {
      console.error("Error generating report:", error);
      setReportError(
        error.response?.data?.message || "Error generating report"
      );
    }
  };

  useEffect(() => {
    if (currentTab === 5) {
      generateReport();
    }
    if (currentTab === 2) {
      fetchPurchases();
    }
    if (currentTab === 0) {
      fetchManufacturingContractors();
      fetchAssignments();
    }
  }, [currentTab]);

  const handleOpenReport = (assignment) => {
    setSelectedReport(assignment);
    setReportDialog(true);
  };

  const handleCloseReport = () => {
    setReportDialog(false);
    setSelectedReport(null);
  };

  const handlePrintReport = async (assignment) => {
    try {
      const response = await axios.get(
        `/api/manufacturing/assignments/${assignment.id}/report`
      );

      const reportWindow = window.open("", "_blank");
      reportWindow.document.write(response.data.reportHtml);
      reportWindow.document.close();

      reportWindow.onload = function () {
        reportWindow.print();
      };
    } catch (error) {
      console.error("Error printing assignment report:", error);
      alert(error.response?.data?.message || "Error printing report");
    }
  };

  const ReportDialog = () => (
    <Dialog
      open={reportDialog}
      onClose={handleCloseReport}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Assignment Report - {selectedReport?.contractor_name}
      </DialogTitle>
      <DialogContent>
        {selectedReport && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Raw Material"
                  value={`${selectedReport.raw_material_quantity} kg`}
                  icon={ProductIcon}
                  iconColor="primary.main"
                  gradientColor="primary"
                  subtitle={selectedReport.raw_material_name}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Finished Product"
                  value={`${selectedReport.quantity} kg`}
                  icon={ProductIcon}
                  iconColor="success.main"
                  gradientColor="success"
                  subtitle="Expected Output"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <SummaryCard
                  title="Efficiency"
                  value={
                    selectedReport.efficiency === "N/A"
                      ? "N/A"
                      : selectedReport.efficiency.endsWith("*")
                      ? `${selectedReport.efficiency.slice(0, -1)}%`
                      : `${selectedReport.efficiency}%`
                  }
                  icon={SpeedIcon}
                  iconColor="warning.main"
                  gradientColor="warning"
                  subtitle={
                    selectedReport.status === "active"
                      ? "Target Efficiency"
                      : selectedReport.status === "completed"
                      ? "Actual Efficiency"
                      : "Not Applicable"
                  }
                />
              </Grid>
            </Grid>

            <Typography variant="h6" sx={{ mb: 2 }}>
              Assignment Details
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contract Information
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Contractor ID:</strong>{" "}
                      {selectedReport.contractor_id}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Phone:</strong> {selectedReport.contractor_phone}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Start Date:</strong>{" "}
                      {new Date(selectedReport.start_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>End Date:</strong>{" "}
                      {new Date(selectedReport.end_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Production Details
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Raw Material:</strong>{" "}
                      {selectedReport.raw_material_name}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Duration:</strong> {selectedReport.duration}{" "}
                      {selectedReport.duration_type}(s)
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Status:</strong>
                      <Chip
                        size="small"
                        label={
                          selectedReport.status === "completed"
                            ? "Completed"
                            : selectedReport.status === "active"
                            ? "Active"
                            : "Not Applicable"
                        }
                        color={
                          selectedReport.status === "completed"
                            ? "success"
                            : selectedReport.status === "active"
                            ? "primary"
                            : "default"
                        }
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography variant="body2">
                      <strong>Notes:</strong> {selectedReport.notes || "N/A"}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {selectedReport.status === "completed" && (
              <Typography
                variant="body1"
                color="success.main"
                sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <CheckCircleIcon /> Assignment completed successfully
              </Typography>
            )}

            {selectedReport.status === "cancelled" && (
              <Typography
                variant="body1"
                color="error.main"
                sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <CancelIcon /> Assignment was cancelled
              </Typography>
            )}

            {selectedReport.status === "active" && (
              <Typography
                variant="body1"
                color="primary.main"
                sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}
              >
                <TimelineIcon /> Assignment is in progress
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseReport}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  useEffect(() => {
    fetchAssignments();
  }, [assignmentFilters]);

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;

    try {
      await axios.delete(`/api/manufacturing/assignments/${assignmentId}`);
      await Promise.all([
        fetchAssignments(),
        fetchManufacturingContractors(),
        fetchRawMaterials(),
      ]);
      enqueueSnackbar("Assignment deleted successfully", { variant: "success" });
    } catch (error) {
      console.error("Error deleting assignment:", error);
      if (error.response?.data?.relatedPayments) {
        enqueueSnackbar(
          "Cannot delete assignment with related payments. Please delete the payments first.",
          { variant: "error" }
        );
      } else {
        enqueueSnackbar(
          error.response?.data?.message || "Error deleting assignment",
          { variant: "error" }
        );
      }
    }
  };

  const handleUpdateAssignmentStatus = async (assignmentId, newStatus) => {
    try {
      await axios.put(`/api/manufacturing/assignments/${assignmentId}/status`, {
        status: newStatus,
      });
      await Promise.all([
        fetchAssignments(),
        fetchManufacturingContractors(),
        fetchRawMaterials(),
      ]);
    } catch (error) {
      console.error("Error updating assignment status:", error);
      alert(
        error.response?.data?.message || "Error updating assignment status"
      );
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await axios.get("/api/manufacturing/purchases");
      setPurchases(response.data);
    } catch (error) {
      console.error("Error fetching purchases:", error);
    }
  };

  const handlePurchaseSuccess = async () => {
    await Promise.all([
      fetchRawMaterials(),
      fetchCuttingContractors(),
      fetchManufacturingContractors(),
      fetchPurchases(),
    ]);
    setOpenPurchaseDialog(false);
  };

  const handleMarkPurchaseAsPaid = async (purchaseId) => {
    try {
      await axios.put(`/api/manufacturing/purchases/${purchaseId}/mark-paid`);
      fetchPurchases();
    } catch (error) {
      console.error("Error marking purchase as paid:", error);
      alert(error.response?.data?.message || "Error marking purchase as paid");
    }
  };

  const handleCloseAssignmentDialog = () => {
    setOpenAssignmentDialog(false);
    setAssignmentDialogSource(null);
  };

  const handleOpenCompletionDialog = (assignment) => {
    setSelectedAssignment(assignment);
    setCompletionFormData({
      assignment_id: assignment.id,
      raw_item_id: assignment.raw_material_id,
      finished_good_id: "",
      quantity_received: "",
    });
    setOpenCompletionDialog(true);
  };

  const handleCloseCompletionDialog = () => {
    setOpenCompletionDialog(false);
    setSelectedAssignment(null);
    setCompletionFormData({
      assignment_id: "",
      raw_item_id: "",
      finished_good_id: "",
      quantity_received: "",
    });
  };

  const handleCompletionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "/api/manufacturing/assignments/complete",
        completionFormData
      );
      handleCloseCompletionDialog();
      // Refresh all relevant data
      await Promise.all([
        fetchAssignments(),
        fetchManufacturingContractors(),
        fetchRawMaterials(),
      ]);
      enqueueSnackbar("Assignment completed successfully", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error completing assignment:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error completing assignment",
        { variant: "error" }
      );
    }
  };

  const handleMarkAdvancePaymentAsPaid = async (paymentId) => {
    try {
      await axios.put(
        `/api/manufacturing/advance-payments/${paymentId}/mark-paid`
      );
      enqueueSnackbar("Advance payment marked as paid", { variant: "success" });
      await fetchAdvancePayments();
    } catch (error) {
      console.error("Error marking advance payment as paid:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error marking payment as paid",
        { variant: "error" }
      );
    }
  };

  const handleDeleteAdvancePayment = async (paymentId) => {
    if (
      !window.confirm("Are you sure you want to delete this advance payment?")
    )
      return;

    try {
      await axios.delete(`/api/manufacturing/advance-payments/${paymentId}`);
      enqueueSnackbar("Advance payment deleted successfully", {
        variant: "success",
      });
      await fetchAdvancePayments();
    } catch (error) {
      console.error("Error deleting advance payment:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error deleting advance payment",
        {
          variant: "error",
        }
      );
    }
  };

  const handleEditAdvancePayment = (payment) => {
    setSelectedPayment(payment);
    setAdvancePaymentData({
      amount: payment.amount,
      notes: payment.notes || "",
    });
    setOpenPaymentDialog(true);
  };

  const handleCloseAdvancePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setSelectedPayment(null);
    setAdvancePaymentData({
      amount: "",
      notes: "",
    });
  };

  const handleReassignmentClose = () => {
    setReassignDialog(false);
    setReassignmentData({
      oldContractorId: null,
      newContractorId: "",
      advancePayments: [],
      assignments: [],
      manufacturingPayments: [],
      purchaseInvoices: [] // Keep this for backward compatibility
    });
  };

  const handleReassignmentSubmit = async () => {
    if (!reassignmentData.newContractorId) {
      enqueueSnackbar("Please select a new contractor", { variant: "error" });
      return;
    }

    try {
      await axios.delete(
        `/api/manufacturing/contractors/${reassignmentData.oldContractorId}?forceDelete=true&newContractorId=${reassignmentData.newContractorId}`
      );

      // Refresh the data
      await Promise.all([
        fetchManufacturingContractors(),
        fetchAssignments(),
        fetchAdvancePayments(),
      ]);

      handleReassignmentClose();
      enqueueSnackbar("Contractor data reassigned and deleted successfully", {
        variant: "success",
      });
    } catch (error) {
      console.error("Error in reassignment:", error);
      enqueueSnackbar("Failed to reassign data and delete contractor", {
        variant: "error",
      });
    }
  };

  const ReassignmentDialog = () => (
    <Dialog
      open={reassignDialog}
      onClose={handleReassignmentClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Reassign Contractor Data</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This contractor has related data that needs to be reassigned before
            deletion. Please select a new contractor to transfer the following
            items:
          </Alert>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>New Contractor</InputLabel>
            <Select
              value={reassignmentData.newContractorId}
              onChange={(e) =>
                setReassignmentData((prev) => ({
                  ...prev,
                  newContractorId: e.target.value,
                }))
              }
              label="New Contractor"
            >
              {manufacturingContractors
                .filter(
                  (c) =>
                    c.id !== reassignmentData.oldContractorId &&
                    c.status === "active"
                )
                .map((contractor) => (
                  <MenuItem key={contractor.id} value={contractor.id}>
                    {contractor.name} ({contractor.contractor_id})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <List>
            {reassignmentData.assignments.length > 0 && (
              <ListItem>
                <ListItemText
                  primary={`${reassignmentData.assignments.length} Active Assignments`}
                  secondary={reassignmentData.assignments
                    .map(
                      (a) =>
                        `Assignment #${a.id}: ${a.raw_material_quantity}kg of ${
                          a.raw_material_name || "material"
                        }`
                    )
                    .join(", ")}
                />
              </ListItem>
            )}

            {reassignmentData.advancePayments.length > 0 && (
              <ListItem>
                <ListItemText
                  primary={`${reassignmentData.advancePayments.length} Advance Payments`}
                  secondary={reassignmentData.advancePayments
                    .map(
                      (p) =>
                        `Payment #${p.receipt_number}: ${formatCurrency(
                          p.amount
                        )}`
                    )
                    .join(", ")}
                />
              </ListItem>
            )}

            {reassignmentData.purchaseInvoices.length > 0 && (
              <ListItem>
                <ListItemText
                  primary={`${reassignmentData.purchaseInvoices.length} Purchase Invoices`}
                  secondary={reassignmentData.purchaseInvoices
                    .map(
                      (i) =>
                        `Invoice #${i.invoice_number}: ${formatCurrency(
                          i.total_amount
                        )}`
                    )
                    .join(", ")}
                />
              </ListItem>
            )}
          </List>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReassignmentClose}>Cancel</Button>
        <Button
          onClick={handleReassignmentSubmit}
          variant="contained"
          color="primary"
          disabled={!reassignmentData.newContractorId}
        >
          Reassign and Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  const handleOpenManufacturingPaymentDialog = async (assignment) => {
    try {
      // Fetch available advance payments for this contractor
      const response = await axios.get(
        `/api/manufacturing/contractors/${assignment.contractor_id}/advance-payments?status=paid`
      );
      const contractorAdvancePayments = response.data.payments || [];

      // Set the form data with the assignment details
      setManufacturingPaymentFormData({
        contractor_id: assignment.contractor_id,
        assignment_id: assignment.id,
        quantity_kg: assignment.completed_quantity || assignment.quantity || "",
        price_per_kg: "",
        total_amount: "",
        notes: "",
        status: "pending",
        id: null,
        finished_good_id: assignment.finished_good_id || "",
        selectedAdvancePayments: [],
      });

      // Update the advance payments state with only this contractor's payments
      setAdvancePayments(contractorAdvancePayments);

      setOpenManufacturingPaymentDialog(true);
    } catch (error) {
      console.error("Error preparing manufacturing payment dialog:", error);
      enqueueSnackbar("Error preparing payment form", { variant: "error" });
    }
  };

  const handleCloseManufacturingPaymentDialog = () => {
    setOpenManufacturingPaymentDialog(false);
    setManufacturingPaymentFormData({
      contractor_id: "",
      assignment_id: "",
      quantity_kg: "",
      price_per_kg: "",
      total_amount: "",
      notes: "",
      status: "pending",
      id: null,
      finished_good_id: "",
      selectedAdvancePayments: [],
    });
    // Reset advance payments to empty array
    setAdvancePayments([]);
  };

  const handleManufacturingPaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        contractor_id: Number(manufacturingPaymentFormData.contractor_id),
        assignment_id: Number(manufacturingPaymentFormData.assignment_id),
        quantity_kg: Number(manufacturingPaymentFormData.quantity_kg),
        price_per_kg: Number(manufacturingPaymentFormData.price_per_kg),
        amount: Number(manufacturingPaymentFormData.total_amount),
        notes: manufacturingPaymentFormData.notes || null,
        status: manufacturingPaymentFormData.status || "pending",
        // Add selected advance payments
        advance_payment_ids:
          manufacturingPaymentFormData.selectedAdvancePayments || [],
      };

      if (manufacturingPaymentFormData.id) {
        // Edit existing payment
        await axios.put(
          `/api/manufacturing/payments/${manufacturingPaymentFormData.id}`,
          formattedData
        );
        enqueueSnackbar("Manufacturing payment updated successfully", {
          variant: "success",
        });
      } else {
        // Create new payment
        const response = await axios.post(
          "/api/manufacturing/payments",
          formattedData
        );
        if (response.data.receiptHtml) {
          const receiptWindow = window.open("", "_blank");
          if (receiptWindow) {
            receiptWindow.document.write(response.data.receiptHtml);
            receiptWindow.document.close();
            receiptWindow.onload = function () {
              receiptWindow.print();
            };
          } else {
            enqueueSnackbar("Please allow pop-ups to print receipts", {
              variant: "warning",
            });
          }
        }
        enqueueSnackbar("Manufacturing payment processed successfully", {
          variant: "success",
        });
      }

      handleCloseManufacturingPaymentDialog();
      // Refresh data
      await Promise.all([
        fetchManufacturingContractors(),
        fetchAssignments(),
        fetchAdvancePayments(),
        fetchManufacturingPayments(),
      ]);
    } catch (error) {
      console.error("Error processing manufacturing payment:", error);
      enqueueSnackbar(
        error.response?.data?.message ||
          "Error processing manufacturing payment",
        { variant: "error" }
      );
    }
  };

  const handleEditManufacturingPayment = (payment) => {
    const price_per_kg = (
      parseFloat(payment.amount) / parseFloat(payment.quantity_kg)
    ).toFixed(2);
    setManufacturingPaymentFormData({
      id: payment.id,
      contractor_id: payment.contractor_id,
      assignment_id: payment.assignment_id,
      quantity_kg: payment.quantity_kg,
      price_per_kg: price_per_kg,
      total_amount: payment.amount,
      notes: payment.notes,
      status: payment.status,
    });
    setOpenManufacturingPaymentDialog(true);
  };

  const handleDeleteManufacturingPayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment?"))
      return;

    try {
      await axios.delete(`/api/manufacturing/payments/${paymentId}`);
      enqueueSnackbar("Manufacturing payment deleted successfully", {
        variant: "success",
      });
      await Promise.all([
        fetchManufacturingContractors(),
        fetchAssignments(),
        fetchAdvancePayments(),
        fetchManufacturingPayments(),
      ]);
    } catch (error) {
      console.error("Error deleting payment:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error deleting payment",
        { variant: "error" }
      );
    }
  };

  const handleMarkManufacturingPaymentAsPaid = async (paymentId) => {
    try {
      await axios.put(`/api/manufacturing/payments/${paymentId}/mark-paid`);
      enqueueSnackbar("Manufacturing payment marked as paid", {
        variant: "success",
      });
      await Promise.all([
        fetchManufacturingContractors(),
        fetchAssignments(),
        fetchAdvancePayments(),
      ]);
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error marking payment as paid",
        { variant: "error" }
      );
    }
  };

  useEffect(() => {
    if (
      manufacturingPaymentFormData.quantity_kg &&
      manufacturingPaymentFormData.price_per_kg
    ) {
      const quantity = parseFloat(manufacturingPaymentFormData.quantity_kg);
      const pricePerKg = parseFloat(manufacturingPaymentFormData.price_per_kg);
      const total = quantity * pricePerKg;

      setManufacturingPaymentFormData((prev) => ({
        ...prev,
        total_amount: total,
      }));
    }
  }, [
    manufacturingPaymentFormData.quantity_kg,
    manufacturingPaymentFormData.price_per_kg,
  ]);

  const handleAssignmentChange = (e) => {
    const assignmentId = e.target.value;
    const selectedAssignment = assignments.find((a) => a.id === assignmentId);

    setManufacturingPaymentFormData((prev) => ({
      ...prev,
      assignment_id: assignmentId,
      // Pre-fill quantity from the selected assignment
      quantity_kg:
        selectedAssignment?.completed_quantity ||
        selectedAssignment?.quantity ||
        "",
    }));
  };

  // First, add these handler functions if they don't exist

  const handlePrintPaymentReceipt = async (payment) => {
    try {
      const receiptResponse = await axios.post(
        "/api/manufacturing/payments/receipt",
        {
          payment,
        }
      );

      const receiptHtml = receiptResponse.data.receiptHtml;
      const printWindow = window.open("", "_blank");
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Error generating receipt:", error);
      enqueueSnackbar("Error generating receipt", { variant: "error" });
    }
  };

  const handleMarkPaymentAsPaid = async (paymentId) => {
    try {
      await axios.put(`/api/manufacturing/payments/${paymentId}/mark-paid`);
      enqueueSnackbar("Payment marked as paid successfully", {
        variant: "success",
      });
      fetchManufacturingPayments();
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error marking payment as paid",
        {
          variant: "error",
        }
      );
    }
  };

  // Add this function with other handler functions
  const handlePrintAdvancePayment = async (payment) => {
    try {
      const receiptResponse = await axios.post(
        "/api/manufacturing/advance-payments/receipt",
        {
          payment,
        }
      );

      const receiptHtml = receiptResponse.data.receiptHtml;
      const printWindow = window.open("", "_blank");
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.print();
    } catch (error) {
      console.error("Error generating receipt:", error);
      enqueueSnackbar("Error generating receipt", { variant: "error" });
    }
  };

  const handleOrderSubmit = async () => {
    try {
      if (selectedOrder) {
        await axios.put(`/api/manufacturing/orders/${selectedOrder.id}`, orderFormData);
        enqueueSnackbar('Order updated successfully', { variant: 'success' });
      } else {
        await axios.post('/api/manufacturing/orders', orderFormData);
        enqueueSnackbar('Order created successfully', { variant: 'success' });
      }
      handleCloseOrderDialog();
      fetchOrders();
    } catch (error) {
      console.error('Error saving order:', error);
      enqueueSnackbar('Error saving order', { variant: 'error' });
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      await axios.post('/api/manufacturing/payments', manufacturingPaymentFormData);
      handleClosePaymentDialog();
      fetchPayments();
      enqueueSnackbar('Payment processed successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error processing payment:', error);
      enqueueSnackbar('Error processing payment', { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(`/api/manufacturing/orders/${id}`);
        fetchOrders();
        enqueueSnackbar('Order deleted successfully', { variant: 'success' });
      } catch (error) {
        console.error('Error deleting order:', error);
        enqueueSnackbar('Error deleting order', { variant: 'error' });
      }
    }
  };

  // Add these functions before the return statement
  const handleCloseOrderDialog = () => {
    setOpenOrderDialog(false);
    setSelectedOrder(null);
  };

  const handleClosePaymentDialog = () => {
    setOpenPaymentDialog(false);
    setPaymentFormData({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/manufacturing/orders');
      setManufacturingOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      enqueueSnackbar('Error fetching orders', { variant: 'error' });
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get('/api/manufacturing/payments');
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      enqueueSnackbar('Error fetching payments', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Manufacturing Management
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              if (cuttingContractors.length > 0) {
                setSelectedContractor(cuttingContractors[0]);
                setOpenPurchaseDialog(true);
              } else {
                alert("Please add cutting contractors first");
              }
            }}
          >
            New Purchase
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            New Contractor
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenAssignmentDialog()}
          >
            New Assignment
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={WorkerIcon}
            title="Active Contractors"
            value={manufacturingContractors.filter(c => c.status === 'active').length}
            subtitle={`${assignments.filter(a => a.status === 'active').length} Active Assignments`}
            iconColor="#9C27B0"
            gradientColor="secondary"
            trend={`${manufacturingContractors.length} Total Contractors`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AssignmentIcon}
            title="Active Assignments"
            value={assignments.filter(a => a.status === 'active').length}
            subtitle="In Progress"
            iconColor="#D32F2F"
            gradientColor="error"
            trend={`${assignments.filter(a => a.status === 'completed').length} Completed`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={ProductIcon}
            title="Total Assignments"
            value={assignments.length}
            subtitle="All Time"
            iconColor="#ED6C02"
            gradientColor="warning"
            trend={`${assignments.filter(a => a.status === 'cancelled').length} Cancelled`}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={ContractorsIcon}
            title="Total Contractors"
            value={manufacturingContractors.length}
            subtitle={`${manufacturingContractors.filter(c => c.status === 'inactive').length} Inactive`}
            iconColor="#0288D1"
            gradientColor="info"
            trend={`${manufacturingContractors.filter(c => c.status === 'active').length} Active`}
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 2 }}
        >
          <Tab label="Assignments" />
          <Tab label="Contractors" />
          <Tab label="Purchases" />
          <Tab label="Advanced Payments" />
          <Tab label="Payments" />
          <Tab label="Reports" />
        </Tabs>

        {currentTab === 0 && (
          <>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Contractor</InputLabel>
                    <Select
                      value={assignmentFilters.contractor_name}
                      label="Contractor"
                      onChange={(e) =>
                        setAssignmentFilters((prev) => ({
                          ...prev,
                          contractor_name: e.target.value,
                        }))
                      }
                      endAdornment={
                        assignmentFilters.contractor_name && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() =>
                              setAssignmentFilters((prev) => ({
                                ...prev,
                                contractor_name: "",
                              }))
                            }
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>All Contractors</em>
                      </MenuItem>
                      {manufacturingContractors.map((contractor) => (
                        <MenuItem key={contractor.id} value={contractor.name}>
                          {contractor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={assignmentFilters.start_date}
                    onChange={(e) =>
                      setAssignmentFilters((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: assignmentFilters.start_date && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setAssignmentFilters((prev) => ({
                              ...prev,
                              start_date: "",
                            }))
                          }
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={assignmentFilters.end_date}
                    onChange={(e) =>
                      setAssignmentFilters((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: assignmentFilters.end_date && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setAssignmentFilters((prev) => ({
                              ...prev,
                              end_date: "",
                            }))
                          }
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                      inputProps: {
                        min: assignmentFilters.start_date || undefined,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contractor</TableCell>
                    <TableCell>Raw Material</TableCell>
                    <TableCell>Raw Material Qty</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id} hover>
                      <TableCell>
                        {manufacturingContractors.find(
                          (c) => c.id === assignment.contractor_id
                        )?.name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {rawMaterials.find(
                          (r) => r.id === assignment.raw_material_id
                        )?.product_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {assignment.raw_material_quantity || "N/A"}
                      </TableCell>
                      <TableCell>{`${assignment.duration} ${assignment.duration_type}(s)`}</TableCell>
                      <TableCell>
                        {new Date(assignment.start_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={assignment.status}
                          color={getStatusColor(assignment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            justifyContent: "flex-end",
                          }}
                        >
                          {assignment.status === "active" && (
                            <Button
                              size="small"
                              color="success"
                              onClick={() =>
                                handleOpenCompletionDialog(assignment)
                              }
                            >
                              Completed
                            </Button>
                          )}
                          {assignment.status === "completed" && (
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleOpenManufacturingPaymentDialog(assignment)
                              }
                              sx={{ color: "info.main" }}
                              title="Manufacturing Payment"
                            >
                              <CreditCardIcon />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenAdvancePaymentDialog({
                                id: assignment.contractor_id,
                                name: assignment.contractor_name,
                              })
                            }
                            sx={{ color: "warning.main" }}
                            title="Advance Payment"
                          >
                            <MoneyIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenAssignmentDialog(assignment)
                            }
                            sx={{ color: "primary.main" }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeleteAssignment(assignment.id)
                            }
                            sx={{ color: "error.main" }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {currentTab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contractor ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Active Assignments</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {manufacturingContractors.map((contractor) => (
                  <TableRow key={contractor.id} hover>
                    <TableCell>{contractor.contractor_id}</TableCell>
                    <TableCell>{contractor.name}</TableCell>
                    <TableCell>{contractor.phone}</TableCell>
                    <TableCell>{contractor.active_assignments || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={contractor.status}
                        color={
                          contractor.status === "active" ? "success" : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {renderContractorActions(contractor)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {currentTab === 2 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Invoice No</TableCell>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Cutting Rate</TableCell>
                  <TableCell>Advance Payment</TableCell>
                  <TableCell>Final Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id} hover>
                    <TableCell>
                      {new Date(purchase.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{purchase.invoice_number}</TableCell>
                    <TableCell>{purchase.contractor_name}</TableCell>
                    <TableCell>{`${purchase.product_name} - ${purchase.quantity} ${purchase.unit}`}</TableCell>
                    <TableCell>
                      {formatCurrency(purchase.total_amount)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(purchase.cutting_rate)}/kg
                    </TableCell>
                    <TableCell>
                      {formatCurrency(purchase.advance_payment)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(purchase.final_amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={purchase.status}
                        color={
                          purchase.status === "paid"
                            ? "success"
                            : purchase.status === "confirmed"
                            ? "info"
                            : purchase.status === "cancelled"
                            ? "error"
                            : "default"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          justifyContent: "flex-end",
                        }}
                      >
                        {purchase.status !== "paid" && (
                          <Button
                            size="small"
                            color="success"
                            onClick={() =>
                              handleMarkPurchaseAsPaid(purchase.id)
                            }
                          >
                            Paid
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handlePrintInvoice(purchase)}
                          sx={{ color: "warning.main" }}
                        >
                          <PrintIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {currentTab === 3 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {advancePayments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{payment.contractor_name}</TableCell>
                    <TableCell>
                      {formatCurrency(payment.amount, false)}
                    </TableCell>
                    <TableCell>
                      {new Date(payment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{payment.notes}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        color={
                          payment.status === "paid"
                            ? "success"
                            : payment.status === "approved"
                            ? "info"
                            : payment.status === "pending"
                            ? "warning"
                            : "error"
                        }
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
                        {payment.status !== "paid" &&
                          payment.status !== "used" && (
                            <Button
                              size="small"
                              color="success"
                              onClick={() =>
                                handleMarkAdvancePaymentAsPaid(payment.id)
                              }
                            >
                              Paid
                            </Button>
                          )}
                        <IconButton
                          size="small"
                          onClick={() => handlePrintAdvancePayment(payment)}
                          sx={{ color: "warning.main" }}
                        >
                          <PrintIcon />
                        </IconButton>
                        {payment.status !== "used" && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleEditAdvancePayment(payment)}
                              sx={{ color: "primary.main" }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDeleteAdvancePayment(payment.id)
                              }
                              sx={{ color: "error.main" }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {currentTab === 4 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Receipt Number</TableCell>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Quantity (kg)</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {manufacturingPayments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{payment.receipt_number}</TableCell>
                    <TableCell>{payment.contractor_name}</TableCell>
                    <TableCell>
                      {formatCurrency(payment.amount, false)}
                    </TableCell>
                    <TableCell>{payment.quantity_kg}</TableCell>
                    <TableCell>
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{payment.notes}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status}
                        color={
                          payment.status === "paid"
                            ? "success"
                            : payment.status === "pending"
                            ? "warning"
                            : "error"
                        }
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
                        {payment.status !== "paid" && (
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleMarkPaymentAsPaid(payment.id)}
                          >
                            Paid
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handlePrintPaymentReceipt(payment)}
                          sx={{ color: "warning.main" }}
                        >
                          <PrintIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setManufacturingPaymentFormData({
                              ...payment,
                              id: payment.id,
                            });
                            setOpenManufacturingPaymentDialog(true);
                          }}
                          sx={{ color: "primary.main" }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() =>
                            handleDeleteManufacturingPayment(payment.id)
                          }
                          sx={{ color: "error.main" }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {currentTab === 5 && (
          <Box>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Contractor</InputLabel>
                    <Select
                      value={assignmentFilters.contractor_name}
                      label="Contractor"
                      onChange={(e) =>
                        setAssignmentFilters((prev) => ({
                          ...prev,
                          contractor_name: e.target.value,
                        }))
                      }
                      endAdornment={
                        assignmentFilters.contractor_name && (
                          <IconButton
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={() =>
                              setAssignmentFilters((prev) => ({
                                ...prev,
                                contractor_name: "",
                              }))
                            }
                          >
                            <ClearIcon fontSize="small" />
                          </IconButton>
                        )
                      }
                    >
                      <MenuItem value="">
                        <em>All Contractors</em>
                      </MenuItem>
                      {manufacturingContractors.map((contractor) => (
                        <MenuItem key={contractor.id} value={contractor.name}>
                          {contractor.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={assignmentFilters.start_date}
                    onChange={(e) =>
                      setAssignmentFilters((prev) => ({
                        ...prev,
                        start_date: e.target.value,
                      }))
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: assignmentFilters.start_date && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setAssignmentFilters((prev) => ({
                              ...prev,
                              start_date: "",
                            }))
                          }
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={assignmentFilters.end_date}
                    onChange={(e) =>
                      setAssignmentFilters((prev) => ({
                        ...prev,
                        end_date: e.target.value,
                      }))
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: assignmentFilters.end_date && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setAssignmentFilters((prev) => ({
                              ...prev,
                              end_date: "",
                            }))
                          }
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      ),
                      inputProps: {
                        min: assignmentFilters.start_date || undefined,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>

            {reportError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {reportError}
              </Alert>
            )}

            <Grid container spacing={3}>
              {reportData.map((assignment) => (
                <Grid item xs={12} md={6} lg={4} key={assignment.id}>
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
                    onClick={() => handleOpenReport(assignment)}
                  >
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {assignment.contractor_name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {assignment.raw_material_name} • {assignment.status}
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Raw Material
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={`${assignment.raw_material_quantity} ${assignment.raw_material_unit}`}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Finished Product
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={`${assignment.quantity} kg`}
                            color="success"
                            size="small"
                          />
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Efficiency
                      </Typography>
                      <Typography variant="body2">
                        {assignment.efficiency}% • Duration:{" "}
                        {assignment.duration} {assignment.duration_type}(s)
                      </Typography>
                    </Box>

                    <Box sx={{ mt: "auto", pt: 2 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<AssessmentIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReport(assignment);
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

      <Dialog open={openAssignmentDialog} onClose={handleCloseAssignmentDialog}>
        <DialogTitle>Assign Raw Material to Contractor</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {(assignmentDialogSource === "header" ||
              !assignmentFormData.contractor_id) && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel required>Contractor</InputLabel>
                  <Select
                    value={assignmentFormData.contractor_id}
                    onChange={(e) =>
                      setAssignmentFormData((prev) => ({
                        ...prev,
                        contractor_id: e.target.value,
                      }))
                    }
                    required
                  >
                    {manufacturingContractors.map((contractor) => (
                      <MenuItem key={contractor.id} value={contractor.id}>
                        {contractor.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel required>Raw Material</InputLabel>
                <Select
                  value={assignmentFormData.raw_material_id}
                  onChange={(e) =>
                    setAssignmentFormData((prev) => ({
                      ...prev,
                      raw_material_id: e.target.value,
                    }))
                  }
                  required
                >
                  {rawMaterials.map((material) => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.product_name} (Stock: {material.quantity}{" "}
                      {material.unit})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Raw Material Quantity"
                type="number"
                value={assignmentFormData.raw_material_quantity}
                onChange={(e) =>
                  setAssignmentFormData((prev) => ({
                    ...prev,
                    raw_material_quantity: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Duration"
                type="number"
                value={assignmentFormData.duration}
                onChange={(e) =>
                  setAssignmentFormData((prev) => ({
                    ...prev,
                    duration: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Duration Type</InputLabel>
                <Select
                  value={assignmentFormData.duration_type}
                  onChange={(e) =>
                    setAssignmentFormData((prev) => ({
                      ...prev,
                      duration_type: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="day">Days</MenuItem>
                  <MenuItem value="week">Weeks</MenuItem>
                  <MenuItem value="month">Months</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={assignmentFormData.start_date}
                onChange={(e) =>
                  setAssignmentFormData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={assignmentFormData.notes}
                onChange={(e) =>
                  setAssignmentFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignmentDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignmentSubmit}
            disabled={
              !assignmentFormData.contractor_id ||
              !assignmentFormData.raw_material_id ||
              !assignmentFormData.raw_material_quantity ||
              !assignmentFormData.duration
            }
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openPaymentDialog}
        onClose={handleCloseAdvancePaymentDialog}
      >
        <DialogTitle>
          {selectedPayment ? "Edit Advance Payment" : "Process Advance Payment"}
        </DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleAdvancePaymentSubmit}
            sx={{ mt: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={advancePaymentData.amount}
                  onChange={(e) =>
                    setAdvancePaymentData((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={advancePaymentData.notes}
                  onChange={(e) =>
                    setAdvancePaymentData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdvancePaymentDialog}>Cancel</Button>
          <Button
            onClick={handleAdvancePaymentSubmit}
            variant="contained"
            disabled={!advancePaymentData.amount}
          >
            {selectedPayment ? "Update Payment" : "Process Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedContractor ? "Edit Contractor" : "New Contractor"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contractor ID"
                name="contractor_id"
                value={formData.contractor_id}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleContractorSubmit}>
            {selectedContractor ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <PurchaseInvoiceForm
        open={openPurchaseDialog}
        onClose={() => {
          setOpenPurchaseDialog(false);
          setSelectedContractor(null);
        }}
        selectedContractor={selectedContractor}
        onSuccess={handlePurchaseSuccess}
        contractors={cuttingContractors}
      />

      <ReassignmentDialog />

      <ReportDialog />

      <Dialog open={openCompletionDialog} onClose={handleCloseCompletionDialog}>
        <DialogTitle>Complete Manufacturing Assignment</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleCompletionSubmit}
            sx={{ mt: 2 }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel required>Finished Good</InputLabel>
                  <Select
                    value={completionFormData.finished_good_id}
                    onChange={(e) =>
                      setCompletionFormData({
                        ...completionFormData,
                        finished_good_id: e.target.value,
                      })
                    }
                    required
                  >
                    {finishedGoods.map((good) => (
                      <MenuItem key={good.id} value={good.id}>
                        {good.product_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Quantity Received (kg)"
                  type="number"
                  value={completionFormData.quantity_received}
                  required
                  onChange={(e) =>
                    setCompletionFormData({
                      ...completionFormData,
                      quantity_received: e.target.value,
                    })
                  }
                />
                {selectedAssignment && (
                  <FormHelperText>
                    Original assigned quantity:{" "}
                    {selectedAssignment.raw_material_quantity} kg
                  </FormHelperText>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompletionDialog}>Cancel</Button>
          <Button
            onClick={handleCompletionSubmit}
            variant="contained"
            disabled={
              !completionFormData.quantity_received ||
              !completionFormData.finished_good_id
            }
          >
            Complete Assignment
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openManufacturingPaymentDialog}
        onClose={handleCloseManufacturingPaymentDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {manufacturingPaymentFormData.id
            ? "Edit Manufacturing Payment"
            : "Process Manufacturing Payment"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Finished Good</InputLabel>
                <Select
                  value={manufacturingPaymentFormData.finished_good_id || ""}
                  onChange={(e) =>
                    setManufacturingPaymentFormData((prev) => ({
                      ...prev,
                      finished_good_id: e.target.value,
                    }))
                  }
                  label="Finished Good"
                  disabled // Disable since it should come from the assignment
                >
                  {finishedGoods.map((good) => (
                    <MenuItem key={good.id} value={good.id}>
                      {good.product_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity (kg)"
                type="number"
                value={manufacturingPaymentFormData.quantity_kg || ""}
                InputProps={{
                  readOnly: true,
                }}
                disabled
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price per kg"
                type="number"
                value={manufacturingPaymentFormData.price_per_kg}
                onChange={(e) => {
                  setManufacturingPaymentFormData((prev) => ({
                    ...prev,
                    price_per_kg: e.target.value,
                  }));
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Total Amount"
                type="number"
                value={manufacturingPaymentFormData.total_amount}
                onChange={(e) =>
                  setManufacturingPaymentFormData((prev) => ({
                    ...prev,
                    total_amount: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={manufacturingPaymentFormData.notes}
                onChange={(e) =>
                  setManufacturingPaymentFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </Grid>
            {/* Add advance payments section */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Available Advance Payments</InputLabel>
                <Select
                  multiple
                  value={
                    manufacturingPaymentFormData.selectedAdvancePayments || []
                  }
                  onChange={(e) =>
                    setManufacturingPaymentFormData((prev) => ({
                      ...prev,
                      selectedAdvancePayments: e.target.value,
                    }))
                  }
                  label="Available Advance Payments"
                  renderValue={(selected) => {
                    const selectedPayments = advancePayments.filter((payment) =>
                      selected.includes(payment.id)
                    );
                    return selectedPayments
                      .map(
                        (payment) =>
                          `${formatCurrency(payment.amount, false)} (${new Date(
                            payment.payment_date
                          ).toLocaleDateString()})`
                      )
                      .join(", ");
                  }}
                >
                  {advancePayments
                    .filter((payment) => payment.status === "paid")
                    .map((payment) => (
                      <MenuItem key={payment.id} value={payment.id}>
                        <Checkbox
                          checked={
                            manufacturingPaymentFormData.selectedAdvancePayments?.includes(
                              payment.id
                            ) || false
                          }
                        />
                        <ListItemText
                          primary={`${formatCurrency(payment.amount, false)}`}
                          secondary={`Date: ${new Date(
                            payment.payment_date
                          ).toLocaleDateString()}`}
                        />
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseManufacturingPaymentDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleManufacturingPaymentSubmit}
            disabled={!manufacturingPaymentFormData.assignment_id}
          >
            {manufacturingPaymentFormData.id
              ? "Update Payment"
              : "Process Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Manufacturing;
