const Payroll = require('../models/domain/Payroll'); // Correct path to Payroll model

// existing functions...

// Function to delete a payroll record
const deletePayroll = async (req, res) => {
    const { id } = req.params;
    const payrollModel = new Payroll(); // Create an instance of the Payroll model
    try {
        // Check if the payroll record exists
        const payroll = await payrollModel.findById(id);
        if (!payroll) {
            return res.status(404).json({ message: 'Payroll record not found' });
        }

        // Proceed to delete the payroll record
        await payrollModel.findByIdAndDelete(id);
        res.status(200).json({ message: 'Payroll record deleted successfully' });
    } catch (error) {
        console.error('Error deleting payroll:', error); // Log the error details
        res.status(500).json({ message: 'Error deleting payroll', error: error.message });
    }
};

// existing functions...

module.exports = {
    // existing exports...
    deletePayroll,
};