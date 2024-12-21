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

      // Calculate totals
      const subTotal = items.reduce((sum, item) => sum + item.total_amount, 0);
      const total = subTotal + (invoiceData.tax_amount || 0);

      // Create invoice
      const [result] = await connection.execute(
        'INSERT INTO purchase_invoices SET ?',
        {
          ...invoiceData,
          invoice_number: invoiceNumber,
          subtotal: subTotal,
          total_amount: total
        }
      );
      const invoiceId = result.insertId;

      // Create items
      for (const item of items) {
        await connection.execute(
          'INSERT INTO purchase_items SET ?',
          { ...item, invoice_id: invoiceId }
        );

        if (invoiceData.status === 'confirmed') {
          // Update product stock
          await connection.execute(
            'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
        }
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
      SELECT pi.*, p.name as product_name
      FROM purchase_items pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.invoice_id = ?
    `, [id]);

    return {
      ...invoice[0],
      items
    };
  }
}

module.exports = new PurchaseInvoice(); 