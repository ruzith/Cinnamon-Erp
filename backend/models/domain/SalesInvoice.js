const BaseModel = require('../base/BaseModel');

class SalesInvoice extends BaseModel {
  constructor() {
    super('sales_invoices');
  }

  async generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    const [result] = await this.pool.execute(
      'SELECT COUNT(*) as count FROM sales_invoices WHERE YEAR(created_at) = YEAR(CURRENT_DATE)'
    );
    const count = result[0].count + 1;
    
    return `SAL${year}${month}${count.toString().padStart(4, '0')}`;
  }

  async findByInvoiceNumber(invoiceNumber) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM sales_invoices WHERE invoice_number = ?',
      [invoiceNumber]
    );
    return rows[0];
  }

  async getWithDetails(id) {
    const [invoice] = await this.pool.execute(`
      SELECT si.*, 
             u.name as created_by_name,
             JSON_OBJECT(
               'name', si.customer_name,
               'address', si.customer_address,
               'phone', si.customer_phone,
               'email', si.customer_email
             ) as customer
      FROM sales_invoices si
      LEFT JOIN users u ON si.created_by = u.id
      WHERE si.id = ?
    `, [id]);

    if (!invoice[0]) return null;

    const [items] = await this.pool.execute(`
      SELECT si.*, i.product_name, i.unit
      FROM sales_items si
      JOIN inventory i ON si.product_id = i.id
      WHERE si.invoice_id = ?
    `, [id]);

    return {
      ...invoice[0],
      items
    };
  }

  async createWithItems(invoiceData, items) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Validate stock availability
      for (const item of items) {
        const [inventory] = await connection.execute(
          'SELECT quantity FROM inventory WHERE id = ? AND product_type = "finished_good"',
          [item.product_id]
        );

        if (!inventory[0] || inventory[0].quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ID: ${item.product_id}`);
        }
      }

      // Calculate totals
      const subTotal = items.reduce((sum, item) => sum + item.sub_total, 0);
      let total = subTotal - (invoiceData.discount || 0);
      if (invoiceData.tax) {
        total += (total * invoiceData.tax) / 100;
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();
      
      // Create invoice
      const [result] = await connection.execute(
        'INSERT INTO sales_invoices SET ?',
        { 
          ...invoiceData, 
          invoice_number: invoiceNumber,
          sub_total: subTotal,
          total: total
        }
      );
      const invoiceId = result.insertId;

      // Create items and update inventory
      for (const item of items) {
        await connection.execute(
          'INSERT INTO sales_items SET ?',
          { ...item, invoice_id: invoiceId }
        );

        if (invoiceData.status === 'confirmed') {
          // Update inventory
          await connection.execute(
            'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );

          // Create inventory transaction record
          await connection.execute(
            'INSERT INTO inventory_transactions SET ?',
            {
              item_id: item.product_id,
              type: 'OUT',
              quantity: item.quantity,
              reference: invoiceNumber,
              notes: 'Sales Invoice'
            }
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

  async processSaleReturn(invoiceId, returnedItems) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const [invoice] = await connection.execute(
        'SELECT invoice_number FROM sales_invoices WHERE id = ?',
        [invoiceId]
      );

      if (!invoice[0]) {
        throw new Error('Invoice not found');
      }

      for (const item of returnedItems) {
        // Update inventory quantity
        await connection.execute(
          'UPDATE inventory SET quantity = quantity + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Create return transaction record
        await connection.execute(
          'INSERT INTO inventory_transactions SET ?',
          {
            item_id: item.product_id,
            type: 'IN',
            quantity: item.quantity,
            reference: invoice[0].invoice_number,
            notes: 'Sales Return'
          }
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = new SalesInvoice(); 