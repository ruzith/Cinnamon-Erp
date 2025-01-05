const BaseModel = require('../base/BaseModel');

class Inventory extends BaseModel {
  constructor() {
    super('inventory');
  }

  async findByProductName(productName) {
    const [rows] = await this.pool.execute(
      'SELECT * FROM inventory WHERE product_name = ?',
      [productName]
    );
    return rows[0];
  }

  async updateQuantity(id, quantity) {
    await this.pool.execute(
      'UPDATE inventory SET quantity = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
      [quantity, id]
    );
    const [rows] = await this.pool.execute('SELECT * FROM inventory WHERE id = ?', [id]);
    return rows[0];
  }

  async getLowStockItems() {
    const [rows] = await this.pool.execute(
      'SELECT * FROM inventory WHERE quantity <= min_stock_level ORDER BY product_name'
    );
    return rows;
  }

  async getTransactionHistory(id) {
    const [rows] = await this.pool.execute(`
      SELECT it.*, i.product_name
      FROM inventory_transactions it
      JOIN inventory i ON it.item_id = i.id
      WHERE it.item_id = ?
      ORDER BY it.created_at DESC
    `, [id]);
    return rows;
  }

  async allocateToManufacturing(orderId, materials) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const material of materials) {
        // Check stock availability
        const [inventory] = await connection.execute(
          'SELECT * FROM inventory WHERE id = ? AND product_type = "raw_material"',
          [material.material_id]
        );

        if (!inventory[0] || inventory[0].quantity < material.quantity_used) {
          throw new Error(`Insufficient stock for material ID: ${material.material_id}`);
        }

        // Deduct from inventory
        await connection.execute(
          'UPDATE inventory SET quantity = quantity - ? WHERE id = ?',
          [material.quantity_used, material.material_id]
        );

        // Record material usage
        await connection.execute(
          'INSERT INTO manufacturing_materials SET ?',
          {
            order_id: orderId,
            material_id: material.material_id,
            quantity_used: material.quantity_used,
            unit_cost: inventory[0].purchase_price
          }
        );

        // Create inventory transaction
        await connection.execute(
          'INSERT INTO inventory_transactions SET ?',
          {
            item_id: material.material_id,
            type: 'OUT',
            quantity: material.quantity_used,
            reference: `MO-${orderId}`,
            notes: 'Allocated to manufacturing'
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

  async addManufacturedProduct(orderId, productData) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      // Calculate total material cost
      const [materials] = await connection.execute(
        'SELECT SUM(quantity_used * unit_cost) as total_cost FROM manufacturing_materials WHERE order_id = ?',
        [orderId]
      );

      const totalMaterialCost = materials[0].total_cost || 0;
      const suggestedSellingPrice = totalMaterialCost * 1.3; // 30% markup, adjust as needed

      // Create or update finished good in inventory
      const [existing] = await connection.execute(
        'SELECT * FROM inventory WHERE product_name = ? AND product_type = "finished_good"',
        [productData.product_name]
      );

      if (existing[0]) {
        await connection.execute(
          `UPDATE inventory
           SET quantity = quantity + ?,
               purchase_price = (purchase_price * quantity + ? * ?) / (quantity + ?),
               selling_price = ?
           WHERE id = ?`,
          [
            productData.quantity,
            totalMaterialCost / productData.quantity, // unit cost
            productData.quantity,
            productData.quantity,
            suggestedSellingPrice,
            existing[0].id
          ]
        );
      } else {
        await connection.execute(
          'INSERT INTO inventory SET ?',
          {
            ...productData,
            product_type: 'finished_good',
            purchase_price: totalMaterialCost / productData.quantity,
            selling_price: suggestedSellingPrice
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

  async addFinishedGood(connection, data) {
    try {
      // Check if product exists in inventory
      const [existingProduct] = await connection.execute(
        'SELECT * FROM inventory WHERE product_id = ? AND product_type = "finished_good"',
        [data.product_id]
      );

      if (existingProduct[0]) {
        // Update existing inventory
        await connection.execute(
          'UPDATE inventory SET quantity = quantity + ? WHERE product_id = ? AND product_type = "finished_good"',
          [data.quantity, data.product_id]
        );
      } else {
        // Create new inventory entry
        await connection.execute(
          `INSERT INTO inventory
           (product_id, product_type, quantity, min_stock, max_stock, notes)
           VALUES (?, "finished_good", ?, 0, 0, ?)`,
          [data.product_id, data.quantity, data.notes || '']
        );
      }

      // Create inventory transaction record
      await connection.execute(
        `INSERT INTO inventory_transactions
         (item_id, type, quantity, reference, notes)
         VALUES (?, "IN", ?, ?, ?)`,
        [
          data.product_id,
          data.quantity,
          `MO-${data.manufacturing_order_id}`,
          data.notes || 'Manufacturing production'
        ]
      );

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new Inventory();