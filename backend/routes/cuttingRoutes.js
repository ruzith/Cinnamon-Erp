const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getContractors,
  getContractor,
  createContractor,
  updateContractor,
  deleteContractor,
  reassignContractor,
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getPayments,
  getPayment,
  createPayment,
  getPaymentsByContractor,
  completeAssignment,
  createAdvancePayment,
  getAdvancePayments,
  getAdvancePaymentsByContractor,
  deletePayment,
  deleteAdvancePayment,
  updateAdvancePayment,
  updatePayment,
  generateReceipt,
  getContractorAdvancePayments,
  markAdvancePaymentAsPaid,
  markPaymentAsPaid,
} = require("../controllers/cuttingController");
const { generateAdvancePaymentReceipt } = require("../utils/pdfTemplates");
const pool = require("../config/database");

router.use(protect);

// Contractor routes
router
  .route("/contractors")
  .get(getContractors)
  .post(authorize("admin"), createContractor);

router
  .route("/contractors/:id")
  .get(getContractor)
  .put(authorize("admin"), updateContractor)
  .delete(authorize("admin"), deleteContractor);

// Add new reassignment route
router
  .route("/contractors/:id/reassign")
  .post(authorize("admin"), reassignContractor);

// Assignment routes
router
  .route("/assignments")
  .get(getAssignments)
  .post(authorize("admin"), createAssignment);

router
  .route("/assignments/:id")
  .put(authorize("admin"), updateAssignment)
  .delete(authorize("admin"), deleteAssignment);

router
  .route("/assignments/complete")
  .post(authorize("admin"), completeAssignment);

// Task routes
router.route("/tasks").get(getTasks).post(createTask);

router
  .route("/tasks/:id")
  .get(getTask)
  .put(updateTask)
  .delete(authorize("admin"), deleteTask);

// Payment routes
router
  .route("/payments")
  .get(getPayments)
  .post(authorize(["admin", "accountant"]), createPayment);

router.route("/payments/receipt").post(generateReceipt);

router
  .route("/payments/:id")
  .get(getPayment)
  .put(authorize(["admin", "accountant"]), updatePayment)
  .delete(authorize(["admin", "accountant"]), deletePayment);

router.route("/payments/contractor/:id").get(getPaymentsByContractor);

// Advance Payment routes
router
  .route("/advance-payments")
  .get(getAdvancePayments)
  .post(authorize(["admin", "accountant"]), createAdvancePayment);

router
  .route("/advance-payments/:id")
  .put(authorize(["admin", "accountant"]), updateAdvancePayment)
  .delete(authorize(["admin", "accountant"]), deleteAdvancePayment);

router.route("/advance-payments/receipt").post(protect, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { payment } = req.body;

    // Get company settings and currency
    const [settingsResult] = await connection.execute(`
      SELECT s.*, c.symbol as currency_symbol
      FROM settings s
      JOIN currencies c ON s.default_currency = c.id
      WHERE c.status = 'active'
      LIMIT 1
    `);
    const settings = settingsResult[0] || {};

    const receiptHtml = await generateAdvancePaymentReceipt(payment, settings);
    res.json({ receiptHtml });
  } catch (error) {
    console.error("Error generating receipt:", error);
    res.status(500).json({ message: "Error generating receipt" });
  } finally {
    if (connection) connection.release();
  }
});

router
  .route("/advance-payments/contractor/:id")
  .get(getAdvancePaymentsByContractor);

// Add this route
router.get(
  "/contractors/:id/advance-payments",
  protect,
  getContractorAdvancePayments
);

// Add these new routes
router.put(
  "/advance-payments/:id/mark-paid",
  protect,
  authorize(["admin", "accountant"]),
  markAdvancePaymentAsPaid
);
router.put(
  "/payments/:id/mark-paid",
  protect,
  authorize(["admin", "accountant"]),
  markPaymentAsPaid
);

module.exports = router;
