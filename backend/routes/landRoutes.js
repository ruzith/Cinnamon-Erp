const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getLands,
  getLand,
  createLand,
  updateLand,
  deleteLand
} = require('../controllers/landController');
const Land = require('../models/domain/Land');

// Get land reports
router.get('/reports', protect, async (req, res) => {
  const connection = await Land.pool.getConnection();

  try {
    const { landId, startDate, endDate, minCuttings, maxCuttings, minTasks, maxTasks, contractorId } = req.query;

    let query = `
      SELECT
        l.*,
        lc.name as category_name,
        COUNT(DISTINCT la.id) as total_assignments,
        COUNT(DISTINCT ct.id) as total_cuttings,
        SUM(ct.area_covered) as total_area_covered
      FROM lands l
      LEFT JOIN land_categories lc ON l.category_id = lc.id
      LEFT JOIN land_assignments la ON l.id = la.id
      LEFT JOIN cutting_tasks ct ON la.id = ct.assignment_id
      WHERE 1=1
    `;

    const params = [];

    if (landId) {
      query += ` AND l.id = ?`;
      params.push(landId);
    }

    if (startDate) {
      query += ` AND (ct.date >= ? OR ct.date IS NULL)`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND (ct.date <= ? OR ct.date IS NULL)`;
      params.push(endDate);
    }

    if (contractorId) {
      query += ` AND cc.id = ?`;
      params.push(contractorId);
    }

    query += ` GROUP BY l.id`;

    // Having clause for filtering by aggregated values
    const havingConditions = [];
    if (minCuttings) {
      havingConditions.push(`COUNT(DISTINCT ct.id) >= ${parseInt(minCuttings)}`);
    }
    if (maxCuttings) {
      havingConditions.push(`COUNT(DISTINCT ct.id) <= ${parseInt(maxCuttings)}`);
    }
    if (minTasks) {
      havingConditions.push(`COUNT(DISTINCT la.id) >= ${parseInt(minTasks)}`);
    }
    if (maxTasks) {
      havingConditions.push(`COUNT(DISTINCT la.id) <= ${parseInt(maxTasks)}`);
    }

    if (havingConditions.length > 0) {
      query += ` HAVING ${havingConditions.join(' AND ')}`;
    }

    query += ` ORDER BY l.name`;

    const [lands] = await connection.execute(query, params);

    // Get additional details for each land
    const landReports = await Promise.all(lands.map(async (land) => {
      // Get active contractors
      const [contractors] = await connection.execute(`
        SELECT DISTINCT cc.name, cc.contractor_id
        FROM land_assignments la
        JOIN cutting_contractors cc ON la.contractor_id = cc.id
        WHERE la.land_id = ? AND la.status = 'active'
      `, [land.id]);

      return {
        ...land,
        contractors: contractors.map(c => ({
          name: c.name,
          contractor_id: c.contractor_id
        }))
      };
    }));

    connection.release();
    res.json(landReports);
  } catch (error) {
    connection.release();
    console.error('Error getting land reports:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get specific land report
router.get('/:id/report', protect, async (req, res) => {
  const connection = await Land.pool.getConnection();

  try {
    const [landDetails] = await connection.execute(`
      SELECT
        l.*,
        lc.name as category_name,
        COUNT(DISTINCT la.id) as total_assignments,
        COUNT(DISTINCT ct.id) as total_cuttings,
        SUM(ct.area_covered) as total_area_covered
      FROM lands l
      LEFT JOIN land_categories lc ON l.category_id = lc.id
      LEFT JOIN land_assignments la ON l.id = la.id
      LEFT JOIN cutting_tasks ct ON la.id = ct.assignment_id
      WHERE l.id = ?
      GROUP BY l.id
    `, [req.params.id]);

    if (!landDetails[0]) {
      connection.release();
      return res.status(404).json({ message: 'Land not found' });
    }

    // Get cutting history
    const [cuttingHistory] = await connection.execute(`
      SELECT
        ct.*,
        cc.name as contractor_name,
        cc.contractor_id
      FROM cutting_tasks ct
      JOIN land_assignments la ON ct.assignment_id = la.id
      JOIN cutting_contractors cc ON la.contractor_id = cc.id
      WHERE la.land_id = ?
      ORDER BY ct.date DESC
    `, [req.params.id]);

    const report = {
      ...landDetails[0],
      cutting_history: cuttingHistory
    };

    connection.release();
    res.json(report);
  } catch (error) {
    connection.release();
    console.error('Error getting land report:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, getLands);
router.get('/:id', protect, getLand);
router.post('/', protect, authorize('admin', 'manager'), createLand);
router.put('/:id', protect, authorize('admin', 'manager'), updateLand);
router.delete('/:id', protect, authorize('admin'), deleteLand);

module.exports = router;