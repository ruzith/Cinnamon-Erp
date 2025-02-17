const BaseModel = require('../base/BaseModel');

class ManufacturingContractor extends BaseModel {
  constructor() {
    super('manufacturing_contractors');
  }

  async findByContractorId(contractorId) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM manufacturing_contractors WHERE contractor_id = ?',
      [contractorId]
    );
    return rows[0];
  }

  async getActiveWithAssignments() {
    const [rows] = await this.pool.execute(`
      SELECT mc.*,
             COUNT(ca.id) as active_assignments,
             SUM(CASE WHEN ca.status = 'active' THEN ca.quantity ELSE 0 END) as total_assigned_quantity
      FROM manufacturing_contractors mc
      LEFT JOIN cinnamon_assignments ca ON mc.id = ca.contractor_id AND ca.status = 'active'
      WHERE mc.status = 'active'
      GROUP BY mc.id
      ORDER BY mc.name ASC
    `);
    return rows;
  }

  async delete(id, forceDelete = false, newContractorId = null) {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check if contractor exists
      const [contractor] = await connection.execute(
        'SELECT * FROM manufacturing_contractors WHERE id = ?',
        [id]
      );

      if (!contractor[0]) {
        throw new Error('Contractor not found');
      }

      if (forceDelete && newContractorId) {
        // Update cinnamon_assignments
        await connection.execute(
          'UPDATE cinnamon_assignments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, id]
        );

        // Update manufacturing_advance_payments
        await connection.execute(
          'UPDATE manufacturing_advance_payments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, id]
        );

        // Update manufacturing_payments
        await connection.execute(
          'UPDATE manufacturing_payments SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, id]
        );

        // Update purchase_invoices
        await connection.execute(
          'UPDATE purchase_invoices SET contractor_id = ? WHERE contractor_id = ?',
          [newContractorId, id]
        );

        // Delete the contractor
        await connection.execute(
          'DELETE FROM manufacturing_contractors WHERE id = ?',
          [id]
        );
      } else {
        // Check for related data if not force deleting
        const [assignments] = await connection.execute(
          'SELECT COUNT(*) as count FROM cinnamon_assignments WHERE contractor_id = ?',
          [id]
        );

        const [advancePayments] = await connection.execute(
          'SELECT COUNT(*) as count FROM manufacturing_advance_payments WHERE contractor_id = ?',
          [id]
        );

        const [manufacturingPayments] = await connection.execute(
          'SELECT COUNT(*) as count FROM manufacturing_payments WHERE contractor_id = ?',
          [id]
        );

        const [purchaseInvoices] = await connection.execute(
          'SELECT COUNT(*) as count FROM purchase_invoices WHERE contractor_id = ?',
          [id]
        );

        if (assignments[0].count > 0 || advancePayments[0].count > 0 ||
            manufacturingPayments[0].count > 0 || purchaseInvoices[0].count > 0) {
          throw new Error('Cannot delete contractor with related data. Use force delete with new contractor ID.');
        }

        // If no related data, delete the contractor
        await connection.execute(
          'DELETE FROM manufacturing_contractors WHERE id = ?',
          [id]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new ManufacturingContractor();