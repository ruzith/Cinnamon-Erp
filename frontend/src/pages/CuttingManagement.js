import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  IconButton,
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
  List,
  ListItem,
  ListItemText,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Engineering as WorkerIcon,
  Forest as ForestIcon,
  Assignment as AssignmentIcon,
  Groups as ContractorsIcon,
  Payment as PaymentIcon,
  Done as DoneIcon,
  Print as PrintIcon,
  Money as MoneyIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import axios from "axios";
import SummaryCard from "../components/common/SummaryCard";
import { useSnackbar } from "notistack";
import { useCurrencyFormatter } from "../utils/currencyUtils";

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const CuttingManagement = () => {
  const { formatCurrency } = useCurrencyFormatter();
  const [contractors, setContractors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    contractor_id: "",
    phone: "",
    address: "",
  });
  const [openAssignmentDialog, setOpenAssignmentDialog] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState({
    contractor_id: "",
    land_id: "",
    start_date: "",
    end_date: "",
    status: "active",
    isFromContractor: false,
  });
  const [lands, setLands] = useState([]);
  const [openReassignDialog, setOpenReassignDialog] = useState(false);
  const [contractorToDelete, setContractorToDelete] = useState(null);
  const [newContractorId, setNewContractorId] = useState("");
  const [openCompletionDialog, setOpenCompletionDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [completionFormData, setCompletionFormData] = useState({
    assignment_id: "",
    raw_item_id: "",
    quantity_received: "",
  });
  const [tabValue, setTabValue] = useState(0);
  const [openAdvancePaymentDialog, setOpenAdvancePaymentDialog] =
    useState(false);
  const [advancePaymentFormData, setAdvancePaymentFormData] = useState({
    contractor_id: "",
    amount: "",
    notes: "",
    status: "pending",
  });
  const [openCuttingPaymentDialog, setOpenCuttingPaymentDialog] =
    useState(false);
  const [cuttingPaymentFormData, setCuttingPaymentFormData] = useState({
    contractor_id: "",
    assignment_id: "",
    quantity_kg: "",
    price_per_kg: "",
    total_amount: "",
    company_contribution: "",
    manufacturing_contribution: "",
    notes: "",
    status: "pending",
    isFromAssignment: false,
    id: null,
    raw_item_id: "",
  });
  const [payments, setPayments] = useState([]);
  const [advancePayments, setAdvancePayments] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [reassignDialog, setReassignDialog] = useState(false);
  const [reassignmentData, setReassignmentData] = useState({
    oldContractorId: null,
    newContractorId: "",
    advancePayments: [],
    assignments: [],
    payments: [],
    purchaseInvoices: [],
  });
  const [operationFilters, setOperationFilters] = useState({
    contractor_id: "",
    start_date: "",
    end_date: "",
  });
  const [rawMaterials, setRawMaterials] = useState([]);

  useEffect(() => {
    fetchContractors();
    fetchLands();
    fetchRawMaterials();
    fetchPayments();
    fetchAdvancePayments();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [operationFilters]);

  const fetchContractors = async () => {
    try {
      const response = await axios.get("/api/cutting/contractors");
      setContractors(response.data);
    } catch (error) {
      console.error("Error fetching contractors:", error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const params = new URLSearchParams();
      if (operationFilters.contractor_id) {
        const contractor = contractors.find(
          (c) => c.id === operationFilters.contractor_id
        );
        if (contractor) {
          params.append("contractor_name", contractor.name);
        }
      }
      if (operationFilters.start_date) {
        params.append("start_date", operationFilters.start_date);
      }
      if (operationFilters.end_date) {
        params.append("end_date", operationFilters.end_date);
      }

      const response = await axios.get(
        `/api/cutting/assignments?${params.toString()}`
      );
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const fetchLands = async () => {
    try {
      // Only fetch active lands for the initial load
      const response = await axios.get("/api/lands?status=active");
      setLands(response.data);
    } catch (error) {
      console.error("Error fetching lands:", error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await axios.get("/api/inventory/raw-materials");
      setInventoryItems(response.data);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await axios.get("/api/cutting/payments");
      setPayments(response.data);
    } catch (error) {
      console.error("Error fetching payments:", error);
    }
  };

  const fetchAdvancePayments = async () => {
    try {
      const response = await axios.get("/api/cutting/advance-payments");
      setAdvancePayments(response.data);
    } catch (error) {
      console.error("Error fetching advance payments:", error);
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

  const handleOpenDialog = (contractor = null) => {
    if (contractor) {
      setSelectedContractor(contractor);
      setFormData({
        name: contractor.name,
        contractor_id: contractor.contractor_id,
        phone: contractor.phone,
        address: contractor.address,
      });
    } else {
      setSelectedContractor(null);
      setFormData({
        name: "",
        contractor_id: "",
        phone: "",
        address: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedContractor(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedContractor) {
        await axios.put(`/api/cutting/contractors/${selectedContractor.id}`, formData);
        enqueueSnackbar('Contractor updated successfully', { variant: 'success' });
      } else {
        await axios.post('/api/cutting/contractors', formData);
        enqueueSnackbar('Contractor created successfully', { variant: 'success' });
      }
      handleCloseDialog();
      fetchContractors();
    } catch (error) {
      console.error('Error saving contractor:', error);
      enqueueSnackbar('Error saving contractor', { variant: 'error' });
    }
  };

  const handleReassignAndDelete = async () => {
    try {
      if (!newContractorId) {
        alert("Please select a new contractor");
        return;
      }

      await axios.delete(
        `/api/cutting/contractors/${contractorToDelete}?forceDelete=true&newContractorId=${newContractorId}`
      );
      setOpenReassignDialog(false);
      setContractorToDelete(null);
      setNewContractorId("");
      fetchContractors();
    } catch (error) {
      console.error("Error reassigning and deleting contractor:", error);
      alert(
        error.response?.data?.message ||
          "Error reassigning and deleting contractor"
      );
    }
  };

  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    try {
      const startDate = new Date(assignmentFormData.start_date);
      const endDate = new Date(assignmentFormData.end_date);

      if (endDate <= startDate) {
        alert("End date must be after start date");
        return;
      }

      if (
        !assignmentFormData.contractor_id ||
        !assignmentFormData.land_id ||
        !assignmentFormData.start_date ||
        !assignmentFormData.end_date
      ) {
        alert("Please fill in all required fields");
        return;
      }

      // Remove id and isFromContractor from request body
      const { id, isFromContractor, ...submitData } = assignmentFormData;

      if (assignmentFormData.id) {
        await axios.put(
          `/api/cutting/assignments/${assignmentFormData.id}`,
          submitData
        );
      } else {
        await axios.post("/api/cutting/assignments", submitData);
      }

      // Refresh both assignments and contractors data
      await Promise.all([fetchAssignments(), fetchContractors(), fetchLands()]);

      setOpenAssignmentDialog(false);
      setAssignmentFormData({
        contractor_id: "",
        land_id: "",
        start_date: "",
        end_date: "",
        status: "active",
        isFromContractor: false,
      });
      enqueueSnackbar('Assignment created successfully', { variant: 'success' });
    } catch (error) {
      console.error("Error saving assignment:", error);
      enqueueSnackbar('Error creating assignment', { variant: 'error' });
    }
  };

  const handleOpenCompletionDialog = async (item, isAssignment = false) => {
    try {
      // Fetch raw materials when dialog opens
      await fetchRawMaterials();

      setSelectedAssignment(item);
      setCompletionFormData({
        assignment_id: isAssignment ? item.id : "",
        raw_item_id: "",
        quantity_received: "",
      });
      setOpenCompletionDialog(true);
    } catch (error) {
      console.error("Error preparing completion dialog:", error);
      enqueueSnackbar("Error loading raw materials", { variant: "error" });
    }
  };

  const handleCloseCompletionDialog = () => {
    setOpenCompletionDialog(false);
    setSelectedAssignment(null);
    setCompletionFormData({
      assignment_id: "",
      raw_item_id: "",
      quantity_received: "",
    });
  };

  const handleCompletionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/cutting/assignments/complete", completionFormData);
      handleCloseCompletionDialog();
      // Refresh all relevant data
      await Promise.all([
        fetchAssignments(),
        fetchContractors(),
        fetchInventoryItems(),
        fetchLands(),
      ]);
    } catch (error) {
      console.error("Error completing assignment:", error);
      enqueueSnackbar('Error completing assignment', { variant: 'error' });
    }
  };

  const summaryStats = {
    total_contractors: contractors.length,
    active_contractors: contractors.filter((c) => c.status === "active").length,
    total_assignments: assignments.length,
    active_assignments: assignments.filter((a) => a.status === "active").length,
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenAssignmentDialog = (contractor = null) => {
    // When creating new assignment, fetch only active and unassigned lands
    axios
      .get("/api/lands?status=active&unassigned=true")
      .then((response) => {
        setLands(response.data.filter((land) => land.status === "active"));
        setAssignmentFormData({
          contractor_id: contractor ? contractor.id : "",
          land_id: "",
          start_date: "",
          end_date: "",
          status: "active",
          isFromContractor: !!contractor,
        });
        setOpenAssignmentDialog(true);
      })
      .catch((error) => {
        console.error("Error fetching lands:", error);
        alert("Error loading land data");
      });
  };

  const handleCloseAssignmentDialog = () => {
    setOpenAssignmentDialog(false);
    setAssignmentFormData({
      contractor_id: "",
      land_id: "",
      start_date: "",
      end_date: "",
      status: "active",
      isFromContractor: false,
    });
  };

  const handleOpenAdvancePaymentDialog = (contractor) => {
    setAdvancePaymentFormData({
      contractor_id: contractor.id,
      amount: "",
      notes: "",
      status: "pending",
    });
    setOpenAdvancePaymentDialog(true);
  };

  const handleCloseAdvancePaymentDialog = () => {
    setOpenAdvancePaymentDialog(false);
    setAdvancePaymentFormData({
      contractor_id: "",
      amount: "",
      notes: "",
      status: "pending",
    });
  };

  const handleAdvancePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (advancePaymentFormData.id) {
        await axios.put(
          `/api/cutting/advance-payments/${advancePaymentFormData.id}`,
          advancePaymentFormData
        );
      } else {
        await axios.post(
          "/api/cutting/advance-payments",
          advancePaymentFormData
        );
      }
      handleCloseAdvancePaymentDialog();
      // Refresh both payment lists and contractors
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments(),
      ]);
      enqueueSnackbar('Advance payment processed successfully', { variant: 'success' });
    } catch (error) {
      console.error("Error processing advance payment:", error);
      enqueueSnackbar('Error processing advance payment', { variant: 'error' });
    }
  };

  const handleOpenCuttingPaymentDialog = async (assignment) => {
    try {

      // Set the form data with the assignment details
      setCuttingPaymentFormData({
        contractor_id: assignment.contractor_id,
        assignment_id: assignment.id,
        quantity_kg: assignment.quantity_received || "",
        price_per_kg: "",
        total_amount: "",
        company_contribution: "",
        manufacturing_contribution: "",
        notes: "",
        status: "pending",
        id: null,
        raw_item_id: assignment.raw_item_id || "",
      });

      setOpenCuttingPaymentDialog(true);
    } catch (error) {
      console.error("Error preparing cutting payment dialog:", error);
      enqueueSnackbar("Error preparing payment form", { variant: "error" });
    }
  };

  const handleCloseCuttingPaymentDialog = () => {
    setOpenCuttingPaymentDialog(false);
    setCuttingPaymentFormData({
      contractor_id: "",
      assignment_id: "",
      quantity_kg: "",
      price_per_kg: "",
      total_amount: "",
      company_contribution: "",
      manufacturing_contribution: "",
      notes: "",
      status: "pending",
      isFromAssignment: false,
      id: null,
      raw_item_id: "",
    });
  };

  const handleCuttingPaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        contractor_id: Number(cuttingPaymentFormData.contractor_id),
        assignment_id: Number(cuttingPaymentFormData.assignment_id),
        quantity_kg: Number(cuttingPaymentFormData.quantity_kg),
        price_per_kg: Number(cuttingPaymentFormData.price_per_kg),
        amount: Number(cuttingPaymentFormData.total_amount),
        companyContribution: Number(
          cuttingPaymentFormData.company_contribution
        ),
        manufacturingContribution: Number(
          cuttingPaymentFormData.manufacturing_contribution
        ),
        notes: cuttingPaymentFormData.notes || null,
        status: cuttingPaymentFormData.status || "pending",
      };

      if (cuttingPaymentFormData.id) {
        // Edit existing payment
        await axios.put(
          `/api/cutting/payments/${cuttingPaymentFormData.id}`,
          formattedData
        );
      } else {
        // Create new payment
        await axios.post("/api/cutting/payments", formattedData);
      }
      handleCloseCuttingPaymentDialog();
      // Refresh both payment lists and contractors
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments(),
      ]);
      enqueueSnackbar('Payment processed successfully', { variant: 'success' });
    } catch (error) {
      console.error("Error processing cutting payment:", error);
      enqueueSnackbar('Error processing payment', { variant: 'error' });
    }
  };

  const calculateContributions = (totalAmount) => {
    const total = parseFloat(totalAmount) || 0;
    const manufacturingRatio = 0.4; // 40% for manufacturing
    const manufacturingContribution = total * manufacturingRatio;
    const companyContribution = total - manufacturingContribution;
    return { companyContribution, manufacturingContribution };
  };

  const handleEditAdvancePayment = (payment) => {
    setAdvancePaymentFormData({
      id: payment.id,
      contractor_id: payment.contractor_id,
      amount: payment.amount,
      notes: payment.notes,
      status: payment.status,
    });
    setOpenAdvancePaymentDialog(true);
  };

  const handleEditPayment = (payment) => {
    const price_per_kg = (
      parseFloat(payment.total_amount) / parseFloat(payment.quantity_kg)
    ).toFixed(2); // Calculate price_per_kg
    setCuttingPaymentFormData({
      id: payment.id,
      contractor_id: payment.contractor_id,
      assignment_id: payment.assignment_id,
      quantity_kg: payment.quantity_kg,
      price_per_kg: price_per_kg,
      total_amount: payment.total_amount,
      company_contribution: payment.company_contribution,
      manufacturing_contribution: payment.manufacturing_contribution,
      notes: payment.notes,
      status: payment.status,
    });
    setOpenCuttingPaymentDialog(true);
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment?"))
      return;

    try {
      await axios.delete(`/api/cutting/payments/${paymentId}`);
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments(),
      ]);
    } catch (error) {
      console.error("Error deleting payment:", error);
      enqueueSnackbar('Error deleting payment', { variant: 'error' });
    }
  };

  const handleDeleteAdvancePayment = async (paymentId) => {
    if (
      !window.confirm("Are you sure you want to delete this advance payment?")
    )
      return;

    try {
      await axios.delete(`/api/cutting/advance-payments/${paymentId}`);
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments(),
      ]);
    } catch (error) {
      console.error("Error deleting advance payment:", error);
      enqueueSnackbar('Error deleting advance payment', { variant: 'error' });
    }
  };

  const handleMarkAdvancePaymentAsPaid = async (paymentId) => {
    try {
      await axios.put(`/api/cutting/advance-payments/${paymentId}/mark-paid`);
      enqueueSnackbar("Advance payment marked as paid", { variant: "success" });
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
        fetchAdvancePayments(),
      ]);
    } catch (error) {
      console.error("Error marking advance payment as paid:", error);
      enqueueSnackbar(
        error.response?.data?.message || "Error marking payment as paid",
        { variant: "error" }
      );
    }
  };

  const handleMarkPaymentAsPaid = async (paymentId) => {
    try {
      await axios.put(`/api/cutting/payments/${paymentId}/mark-paid`);
      enqueueSnackbar("Payment marked as paid", { variant: "success" });
      await Promise.all([
        fetchContractors(),
        fetchPayments(),
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

  const handleEditAssignment = (assignment) => {
    // Fetch all active lands including the currently assigned one
    axios
      .get("/api/lands?status=active&includeAssigned=true")
      .then((response) => {
        setLands(
          response.data.filter(
            (land) => land.status === "active" || land.id === assignment.land_id
          )
        );
        setAssignmentFormData({
          id: assignment.id,
          contractor_id: assignment.contractor_id,
          land_id: assignment.land_id,
          start_date: assignment.start_date.split("T")[0],
          end_date: assignment.end_date.split("T")[0],
          status: assignment.status,
        });
        setOpenAssignmentDialog(true);
      })
      .catch((error) => {
        console.error("Error fetching lands:", error);
        alert("Error loading land data");
      });
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to delete this assignment?"))
      return;

    try {
      await axios.delete(`/api/cutting/assignments/${assignmentId}`);
      await Promise.all([fetchAssignments(), fetchContractors(), fetchLands()]);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      enqueueSnackbar('Error deleting assignment', { variant: 'error' });
    }
  };

  const handlePrintPayment = async (payment) => {
    try {
      const paymentResponse = await axios.get(
        `/api/cutting/payments/${payment.id}`
      );
      const paymentDetails = paymentResponse.data;

      const receiptResponse = await axios.post(
        "/api/cutting/payments/receipt",
        {
          payment: paymentDetails,
        }
      );

      // Open print window
      const printWindow = window.open("", "_blank");
      printWindow.document.write(receiptResponse.data.receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error("Error printing payment:", error);
      enqueueSnackbar("Error printing payment receipt", { variant: "error" });
    }
  };

  const handleDeleteContractor = async (contractorId) => {
    if (window.confirm("Are you sure you want to delete this contractor?")) {
      try {
        const response = await axios.delete(
          `/api/cutting/contractors/${contractorId}`
        );
        if (response.status === 200) {
          fetchContractors();
          enqueueSnackbar("Contractor deleted successfully", {
            variant: "success",
          });
        }
      } catch (error) {
        if (
          error.response?.data?.hasAdvancePayments ||
          error.response?.data?.hasAssignments ||
          error.response?.data?.hasPurchaseInvoices ||
          error.response?.data?.hasPayments
        ) {
          // Set the reassignment data and open the dialog
          setReassignmentData({
            oldContractorId: contractorId,
            newContractorId: "",
            advancePayments: error.response.data.advancePayments || [],
            assignments: error.response.data.assignments || [],
            purchaseInvoices: error.response.data.purchaseInvoices || [],
            payments: error.response.data.payments || [],
          });
          setReassignDialog(true);
        } else {
          console.error("Error deleting contractor:", error);
          enqueueSnackbar(
            error.response?.data?.message || "Error deleting contractor",
            {
              variant: "error",
            }
          );
        }
      }
    }
  };

  const handleReassignmentClose = () => {
    setReassignDialog(false);
    setReassignmentData({
      oldContractorId: null,
      newContractorId: "",
      advancePayments: [],
      assignments: [],
      payments: [],
      purchaseInvoices: [],
    });
  };

  const handleReassignmentSubmit = async () => {
    if (!reassignmentData.newContractorId) {
      return;
    }

    try {
      await axios.post(
        `/api/cutting/contractors/${reassignmentData.oldContractorId}/reassign`,
        {
          newContractorId: reassignmentData.newContractorId,
        }
      );

      // Refresh the data
      await Promise.all([
        fetchContractors(),
        fetchAssignments(),
        fetchAdvancePayments(),
        fetchPayments(),
      ]);

      handleReassignmentClose();
    } catch (error) {
      console.error("Error in reassignment:", error);
      enqueueSnackbar('Failed to reassign data and delete contractor', { variant: 'error' });
    }
  };

  const ReassignmentDialog = () => (
    <Dialog
      open={reassignDialog}
      onClose={handleReassignmentClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Reassign Contractor Data</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            This contractor has related data that needs to be reassigned before
            deletion. Please select a new contractor to transfer these to.
          </Alert>

          <FormControl fullWidth sx={{ mb: 2 }}>
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
              {contractors
                .filter((c) => c.id !== reassignmentData.oldContractorId)
                .map((contractor) => (
                  <MenuItem key={contractor.id} value={contractor.id}>
                    {contractor.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {reassignmentData.assignments?.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Assignments ({reassignmentData.assignments.length}):
              </Typography>
              <List dense>
                {reassignmentData.assignments.map((assignment) => (
                  <ListItem key={assignment.id}>
                    <ListItemText
                      primary={`Land: ${assignment.land_number}`}
                      secondary={`Start Date: ${new Date(
                        assignment.start_date
                      ).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {reassignmentData.advancePayments?.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Advance Payments ({reassignmentData.advancePayments.length}):
              </Typography>
              <List dense>
                {reassignmentData.advancePayments.map((payment) => (
                  <ListItem key={payment.id}>
                    <ListItemText
                      primary={`Amount: ${formatCurrency(payment.amount)}`}
                      secondary={`Status: ${payment.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {reassignmentData.payments?.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Payments ({reassignmentData.payments.length}):
              </Typography>
              <List dense>
                {reassignmentData.payments.map((payment) => (
                  <ListItem key={payment.id}>
                    <ListItemText
                      primary={`Receipt Number: ${payment.receipt_number}`}
                      secondary={`Amount: ${formatCurrency(
                        payment.total_amount
                      )} - Status: ${payment.status}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {reassignmentData.purchaseInvoices?.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Purchase Invoices ({reassignmentData.purchaseInvoices.length}):
              </Typography>
              <List dense>
                {reassignmentData.purchaseInvoices.map((invoice, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`Invoice ID: ${invoice.id}`}
                      secondary={`Amount: ${formatCurrency(invoice.amount)}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReassignmentClose}>Cancel</Button>
        <Button
          onClick={handleReassignmentSubmit}
          color="primary"
          disabled={!reassignmentData.newContractorId}
        >
          Reassign and Delete
        </Button>
      </DialogActions>
    </Dialog>
  );

  const handlePrintAdvancePayment = async (payment) => {
    try {
      const receiptResponse = await axios.post("/api/cutting/advance-payments/receipt", {
        payment,
      });

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
          Cutting Management
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
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
            onClick={() => setOpenAssignmentDialog(true)}
            color="primary"
          >
            New Operation
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={WorkerIcon}
            title="Active Contractors"
            value={summaryStats.active_contractors}
            iconColor="#9C27B0"
            gradientColor="secondary"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={ForestIcon}
            title="Active Operations"
            value={summaryStats.active_assignments}
            iconColor="#D32F2F"
            gradientColor="error"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={AssignmentIcon}
            title="Total Operations"
            value={summaryStats.total_assignments}
            iconColor="#ED6C02"
            gradientColor="warning"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            icon={ContractorsIcon}
            title="Total Contractors"
            value={summaryStats.total_contractors}
            iconColor="#0288D1"
            gradientColor="info"
          />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2, pt: 2 }}
        >
          <Tab label="Operations" />
          <Tab label="Contractors" />
          <Tab label="Advanced Payments" />
          <Tab label="Payments" />
        </Tabs>

        {/* Operations Tab */}
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Contractor</InputLabel>
                  <Select
                    value={operationFilters.contractor_id}
                    label="Contractor"
                    onChange={(e) =>
                      setOperationFilters((prev) => ({
                        ...prev,
                        contractor_id: e.target.value,
                      }))
                    }
                    endAdornment={
                      operationFilters.contractor_id && (
                        <IconButton
                          size="small"
                          sx={{ mr: 2 }}
                          onClick={() =>
                            setOperationFilters((prev) => ({
                              ...prev,
                              contractor_id: "",
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
                    {contractors.map((contractor) => (
                      <MenuItem key={contractor.id} value={contractor.id}>
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
                  value={operationFilters.start_date}
                  onChange={(e) =>
                    setOperationFilters((prev) => ({
                      ...prev,
                      start_date: e.target.value,
                    }))
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: operationFilters.start_date && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          setOperationFilters((prev) => ({
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
                  value={operationFilters.end_date}
                  onChange={(e) =>
                    setOperationFilters((prev) => ({
                      ...prev,
                      end_date: e.target.value,
                    }))
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    endAdornment: operationFilters.end_date && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          setOperationFilters((prev) => ({
                            ...prev,
                            end_date: "",
                          }))
                        }
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ),
                    inputProps: {
                      min: operationFilters.start_date || undefined,
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
                  <TableCell>Land Number</TableCell>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id} hover>
                    <TableCell>{assignment.land_number}</TableCell>
                    <TableCell>{assignment.contractor_name}</TableCell>
                    <TableCell>{assignment.location}</TableCell>
                    <TableCell>
                      {new Date(assignment.start_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(assignment.end_date).toLocaleDateString()}
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
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        {assignment.status === "active" && (
                          <Button
                            size="small"
                            color="success"
                            onClick={() =>
                              handleOpenCompletionDialog(assignment, true)
                            }
                          >
                            Completed
                          </Button>
                        )}
                        {assignment.status === "completed" && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenCuttingPaymentDialog(assignment)
                            }
                            sx={{ color: "info.main" }}
                            title="Cutting Payment"
                          >
                            <PaymentIcon />
                          </IconButton>
                        )}
                        {assignment.status !== "completed" && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenAdvancePaymentDialog({
                                ...assignment,
                                id: assignment.contractor_id,
                              })
                            }
                            sx={{ color: "warning.main" }}
                            title="Advance Payment"
                          >
                            <MoneyIcon />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleEditAssignment(assignment)}
                          sx={{ color: "primary.main" }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAssignment(assignment.id)}
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
        </TabPanel>

        {/* Contractors Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contractor ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Active Assignments</TableCell>
                  <TableCell>Assigned Lands</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contractors.map((contractor) => (
                  <TableRow key={contractor.id} hover>
                    <TableCell>{contractor.contractor_id}</TableCell>
                    <TableCell>{contractor.name}</TableCell>
                    <TableCell>{contractor.phone}</TableCell>
                    <TableCell>{contractor.active_assignments}</TableCell>
                    <TableCell>
                      {contractor.assigned_lands
                        ? contractor.assigned_lands
                            .split(",")
                            .map((land, index) => (
                              <Chip
                                key={index}
                                label={land}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))
                        : "None"}
                    </TableCell>
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
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-end",
                          gap: 1,
                        }}
                      >
                        <Button
                          size="small"
                          color="success"
                          onClick={() => handleOpenAssignmentDialog(contractor)}
                        >
                          Assign
                        </Button>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleOpenAdvancePaymentDialog(contractor)
                            }
                            sx={{ color: "warning.main" }}
                            title="Advance Payment"
                          >
                            <MoneyIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(contractor)}
                            sx={{ color: "primary.main" }}
                            title="Edit"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDeleteContractor(contractor.id)
                            }
                            sx={{ color: "error.main" }}
                            title="Delete"
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
        </TabPanel>

        {/* Advanced Payments Tab */}
        <TabPanel value={tabValue} index={2}>
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
        </TabPanel>

        {/* Payments Tab */}
        <TabPanel value={tabValue} index={3}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Receipt Number</TableCell>
                  <TableCell>Contractor</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Company Contribution</TableCell>
                  <TableCell>Manufacturing Contribution</TableCell>
                  <TableCell>Quantity (kg)</TableCell>
                  <TableCell>Payment Date</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} hover>
                    <TableCell>{payment.receipt_number}</TableCell>
                    <TableCell>{payment.contractor_name}</TableCell>
                    <TableCell>
                      {formatCurrency(payment.total_amount, false)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(payment.company_contribution, false)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        payment.manufacturing_contribution,
                        false
                      )}
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
                          onClick={() => handlePrintPayment(payment)}
                          sx={{ color: "warning.main" }}
                        >
                          <PrintIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditPayment(payment)}
                          sx={{ color: "primary.main" }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePayment(payment.id)}
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
        </TabPanel>
      </Paper>

      {/* Contractor Dialog */}
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
          <Button variant="contained" onClick={handleSubmit}>
            {selectedContractor ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAssignmentDialog} onClose={handleCloseAssignmentDialog}>
        <DialogTitle>
          {assignmentFormData.contractor_id
            ? `Assign Land to ${
                contractors.find(
                  (c) => c.id === assignmentFormData.contractor_id
                )?.name
              }`
            : "Assign Land to Contractor"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {!assignmentFormData.isFromContractor && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel required>Contractor</InputLabel>
                  <Select
                    name="contractor_id"
                    value={assignmentFormData.contractor_id}
                    label="Contractor"
                    onChange={(e) =>
                      setAssignmentFormData((prev) => ({
                        ...prev,
                        contractor_id: e.target.value,
                      }))
                    }
                  >
                    {contractors
                      .filter((c) => c.status === "active")
                      .map((contractor) => (
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
                <InputLabel required>Land</InputLabel>
                <Select
                  name="land_id"
                  value={assignmentFormData.land_id}
                  label="Land"
                  onChange={(e) =>
                    setAssignmentFormData((prev) => ({
                      ...prev,
                      land_id: e.target.value,
                    }))
                  }
                >
                  {lands
                    .filter((land) => land.status === "active")
                    .map((land) => (
                      <MenuItem key={land.id} value={land.id}>
                        {land.name} ({land.land_number}) - {land.location}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                name="start_date"
                value={assignmentFormData.start_date}
                required
                onChange={(e) =>
                  setAssignmentFormData((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                name="end_date"
                value={assignmentFormData.end_date}
                required
                onChange={(e) =>
                  setAssignmentFormData((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAssignmentDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignmentSubmit}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openReassignDialog}
        onClose={() => {
          setOpenReassignDialog(false);
          setContractorToDelete(null);
          setNewContractorId("");
        }}
      >
        <DialogTitle>Reassign Assignments</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select New Contractor</InputLabel>
            <Select
              value={newContractorId}
              onChange={(e) => setNewContractorId(e.target.value)}
              label="Select New Contractor"
            >
              {contractors
                .filter(
                  (c) => c.id !== contractorToDelete && c.status === "active"
                )
                .map((contractor) => (
                  <MenuItem key={contractor.id} value={contractor.id}>
                    {contractor.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenReassignDialog(false);
              setContractorToDelete(null);
              setNewContractorId("");
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleReassignAndDelete}>
            Reassign & Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCompletionDialog} onClose={handleCloseCompletionDialog}>
        <DialogTitle>{"Complete Cutting Operation"}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleCompletionSubmit}
            sx={{ mt: 2 }}
          >
            {!completionFormData.assignment_id && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Assignment</InputLabel>
                <Select
                  value={completionFormData.assignment_id}
                  onChange={(e) =>
                    setCompletionFormData({
                      ...completionFormData,
                      assignment_id: e.target.value,
                    })
                  }
                >
                  {assignments
                    .filter(
                      (a) =>
                        a.contractor_id === selectedAssignment?.id &&
                        a.status === "active"
                    )
                    .map((assignment) => (
                      <MenuItem key={assignment.id} value={assignment.id}>
                        Land {assignment.land_number} - {assignment.location}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel
              required
              >Raw Material</InputLabel>
              <Select
                value={completionFormData.raw_item_id}
                onChange={(e) =>
                  setCompletionFormData({
                    ...completionFormData,
                    raw_item_id: e.target.value,
                  })
                }
              >
                {rawMaterials.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.product_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              required
              label="Quantity Received (kg)"
              type="number"
              value={completionFormData.quantity_received}
              onChange={(e) =>
                setCompletionFormData({
                  ...completionFormData,
                  quantity_received: e.target.value,
                })
              }
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompletionDialog}>Cancel</Button>
          <Button
            onClick={handleCompletionSubmit}
            variant="contained"
            disabled={
              !completionFormData.assignment_id ||
              !completionFormData.raw_item_id ||
              !completionFormData.quantity_received
            }
          >
            Complete Operation
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAdvancePaymentDialog}
        onClose={handleCloseAdvancePaymentDialog}
      >
        <DialogTitle>Process Advance Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={advancePaymentFormData.amount}
                required
                onChange={(e) =>
                  setAdvancePaymentFormData((prev) => ({
                    ...prev,
                    amount: e.target.value,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={advancePaymentFormData.notes}
                onChange={(e) =>
                  setAdvancePaymentFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdvancePaymentDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAdvancePaymentSubmit}
            disabled={!advancePaymentFormData.amount}
          >
            Process Advance
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCuttingPaymentDialog}
        onClose={handleCloseCuttingPaymentDialog}
      >
        <DialogTitle>
          {cuttingPaymentFormData.id
            ? "Edit Cutting Payment"
            : "Process Cutting Payment"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Raw Material</InputLabel>
                <Select
                  value={cuttingPaymentFormData.raw_item_id || ""}
                  onChange={(e) =>
                    setCuttingPaymentFormData((prev) => ({
                      ...prev,
                      raw_item_id: e.target.value,
                    }))
                  }
                  label="Raw Material"
                  disabled
                >
                  {rawMaterials.map((material) => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.product_name}
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
                value={cuttingPaymentFormData.quantity_kg || ""}
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
                label="Charge per kg"
                type="number"
                value={cuttingPaymentFormData.price_per_kg}
                onChange={(e) => {
                  const chargePerKg = e.target.value;
                  const total =
                    cuttingPaymentFormData.quantity_kg * chargePerKg;
                  const { companyContribution, manufacturingContribution } =
                    calculateContributions(total);
                  setCuttingPaymentFormData((prev) => ({
                    ...prev,
                    price_per_kg: chargePerKg,
                    total_amount: total,
                    company_contribution: companyContribution,
                    manufacturing_contribution: manufacturingContribution,
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
                value={cuttingPaymentFormData.total_amount}
                onChange={(e) => {
                  const total = e.target.value;
                  const { companyContribution, manufacturingContribution } =
                    calculateContributions(total);
                  setCuttingPaymentFormData((prev) => ({
                    ...prev,
                    total_amount: total,
                    company_contribution: companyContribution,
                    manufacturing_contribution: manufacturingContribution,
                  }));
                }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Contribution"
                type="number"
                value={cuttingPaymentFormData.company_contribution}
                required
                onChange={(e) => {
                  const newCompanyContribution =
                    parseFloat(e.target.value) || 0;
                  const totalAmount =
                    parseFloat(cuttingPaymentFormData.total_amount) || 0;
                  const newManufacturingContribution =
                    totalAmount - newCompanyContribution;

                  if (newManufacturingContribution >= 0) {
                    setCuttingPaymentFormData((prev) => ({
                      ...prev,
                      company_contribution: newCompanyContribution,
                      manufacturing_contribution: newManufacturingContribution,
                    }));
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Manufacturing Contribution"
                type="number"
                value={cuttingPaymentFormData.manufacturing_contribution}
                required
                onChange={(e) => {
                  const newManufacturingContribution =
                    parseFloat(e.target.value) || 0;
                  const totalAmount =
                    parseFloat(cuttingPaymentFormData.total_amount) || 0;
                  const newCompanyContribution =
                    totalAmount - newManufacturingContribution;

                  if (newCompanyContribution >= 0) {
                    setCuttingPaymentFormData((prev) => ({
                      ...prev,
                      manufacturing_contribution: newManufacturingContribution,
                      company_contribution: newCompanyContribution,
                    }));
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={cuttingPaymentFormData.notes}
                onChange={(e) =>
                  setCuttingPaymentFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCuttingPaymentDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCuttingPaymentSubmit}
            disabled={
              !cuttingPaymentFormData.assignment_id ||
              !cuttingPaymentFormData.quantity_kg ||
              !cuttingPaymentFormData.total_amount
            }
          >
            {cuttingPaymentFormData.id ? "Update Payment" : "Process Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      <ReassignmentDialog />
    </Box>
  );
};

export default CuttingManagement;
