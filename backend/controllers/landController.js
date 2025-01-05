const Land = require('../models/domain/Land');
const { validateLand } = require('../validators/landValidator');

// @desc    Get all lands
// @route   GET /api/lands
// @access  Private
exports.getLands = async (req, res) => {
  try {
    const { status, unassigned } = req.query;
    let query = 'SELECT l.* FROM lands l';
    const params = [];

    if (status || unassigned === 'true') {
      query += ' WHERE 1=1';

      if (status) {
        query += ' AND l.status = ?';
        params.push(status);
      }

      if (unassigned === 'true') {
        query += ` AND NOT EXISTS (
          SELECT 1 FROM land_assignments la
          WHERE la.land_id = l.id
          AND la.status = 'active'
        )`;
      }
    }

    query += ' ORDER BY l.created_at DESC';

    const [lands] = await Land.pool.execute(query, params);
    res.status(200).json(lands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single land
// @route   GET /api/lands/:id
// @access  Private
exports.getLand = async (req, res) => {
  try {
    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({ message: 'Land not found' });
    }
    res.status(200).json(land);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create land
// @route   POST /api/lands
// @access  Private/Admin
exports.createLand = async (req, res) => {
  try {
    const { error } = validateLand(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check for duplicate land number
    const existingLand = await Land.findByLandNumber(req.body.land_number);
    if (existingLand) {
      return res.status(400).json({ message: 'Land number already exists' });
    }

    const land = await Land.create({
      ...req.body,
      created_by: req.user.id
    });

    res.status(201).json(land);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update land
// @route   PUT /api/lands/:id
// @access  Private/Admin
exports.updateLand = async (req, res) => {
  try {
    const { error } = validateLand(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({ message: 'Land not found' });
    }

    // Check for duplicate land number if it's being changed
    if (req.body.land_number && req.body.land_number !== land.land_number) {
      const existingLand = await Land.findByLandNumber(req.body.land_number);
      if (existingLand) {
        return res.status(400).json({ message: 'Land number already exists' });
      }
    }

    const updatedLand = await Land.update(req.params.id, req.body);
    res.status(200).json(updatedLand);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete land
// @route   DELETE /api/lands/:id
// @access  Private/Admin
exports.deleteLand = async (req, res) => {
  try {
    const { forceDelete } = req.query;
    const land = await Land.findById(req.params.id);

    if (!land) {
      return res.status(404).json({ message: 'Land not found' });
    }

    // Check for active assignments
    const [assignments] = await Land.pool.execute(`
      SELECT la.*, cc.name as contractor_name
      FROM land_assignments la
      JOIN cutting_contractors cc ON la.contractor_id = cc.id
      WHERE la.land_id = ? AND la.status = 'active'`,
      [req.params.id]
    );

    if (assignments.length > 0) {
      if (forceDelete === 'true') {
        // Get all assignment IDs for this land
        const [allAssignments] = await Land.pool.execute(
          'SELECT id FROM land_assignments WHERE land_id = ?',
          [req.params.id]
        );
        const assignmentIds = allAssignments.map(a => a.id);

        if (assignmentIds.length > 0) {
          // Delete related cutting_payments first
          await Land.pool.execute(
            `DELETE FROM cutting_payments WHERE assignment_id IN (${assignmentIds.map(() => '?').join(',')})`,
            assignmentIds
          );
        }

        // Now safe to delete all assignments for this land
        await Land.pool.execute(
          'DELETE FROM land_assignments WHERE land_id = ?',
          [req.params.id]
        );
      } else {
        return res.status(400).json({
          message: 'Cannot delete land with active assignments',
          activeAssignments: assignments.map(a => ({
            id: a.id,
            contractor: a.contractor_name,
            start_date: a.start_date,
            end_date: a.end_date
          }))
        });
      }
    } else {
      // Even if there are no active assignments, we still need to delete any completed/cancelled assignments
      // and their related payments
      const [allAssignments] = await Land.pool.execute(
        'SELECT id FROM land_assignments WHERE land_id = ?',
        [req.params.id]
      );
      const assignmentIds = allAssignments.map(a => a.id);

      if (assignmentIds.length > 0) {
        // Delete related cutting_payments first
        await Land.pool.execute(
          `DELETE FROM cutting_payments WHERE assignment_id IN (${assignmentIds.map(() => '?').join(',')})`,
          assignmentIds
        );

        // Then delete the assignments
        await Land.pool.execute(
          'DELETE FROM land_assignments WHERE land_id = ?',
          [req.params.id]
        );
      }
    }

    // Now safe to delete the land
    await Land.delete(req.params.id);
    res.status(200).json({ message: 'Land deleted successfully' });
  } catch (error) {
    console.error('Error deleting land:', error);
    res.status(500).json({ message: error.message });
  }
};