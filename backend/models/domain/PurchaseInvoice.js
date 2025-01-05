const BaseModel = require('../base/BaseModel');

class PurchaseInvoice extends BaseModel {
  constructor() {
    super('purchase_invoices');
  }

  async generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    const [result] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM purchase_invoices WHERE YEAR(created_at) = YEAR(CURRENT_DATE)'
    );
    const count = result[0].count + 1;

    return `PUR${year}${month}${count.toString().padStart(4, '0')}`;
  }

  async createWithItems(invoiceData, items) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Calculate totals from the frontend data
      const totalAmount = invoiceData.totalAmount || 0;

      // Create invoice with fields matching the database schema
      const [result] = await connection.execute(
        `INSERT INTO purchase_invoices (
          invoice_number, supplier_id, invoice_date, due_date,
          subtotal, tax_amount, total_amount, paid_amount,
          status, notes, created_by, created_at
        ) VALUES (?, ?, CURRENT_DATE, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY),
          ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          invoiceNumber,
          invoiceData.supplier_id || 1, // Default supplier if not provided
          totalAmount, // subtotal
          0, // tax_amount
          totalAmount, // total_amount
          0, // paid_amount
          invoiceData.status || 'draft',
          invoiceData.notes || '',
          1 // created_by (default to 1 for now)
        ]
      );
      const invoiceId = result.insertId;

      // Create items with fields matching the database schema
      for (const item of items) {
        await connection.execute(
          `INSERT INTO purchase_items (
            invoice_id, grade_id, total_weight,
            deduct_weight1, deduct_weight2, net_weight,
            rate, amount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId,
            item.grade, // grade is now the inventory item id
            item.totalWeight || 0,
            item.deductWeight1 || 0,
            item.deductWeight2 || 0,
            item.netWeight || 0,
            item.rate || 0,
            item.amount || 0
          ]
        );
      }

      await connection.commit();
      return this.getWithDetails(invoiceId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async getWithDetails(id) {
    const [invoice] = await this.pool.execute(`
      SELECT pi.*,
             c.name as supplier_name,
             u.name as created_by_name
      FROM purchase_invoices pi
      LEFT JOIN customers c ON pi.supplier_id = c.id
      LEFT JOIN users u ON pi.created_by = u.id
      WHERE pi.id = ?
    `, [id]);

    if (!invoice[0]) return null;

    const [items] = await this.pool.execute(`
      SELECT pi.*, i.product_name as grade_name
      FROM purchase_items pi
      JOIN inventory i ON pi.grade_id = i.id
      WHERE pi.invoice_id = ?
    `, [id]);

    return {
      ...invoice[0],
      items
    };
  }
}

module.exports = PurchaseInvoice;