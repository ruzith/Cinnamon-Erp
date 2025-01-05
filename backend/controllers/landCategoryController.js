const LandCategory = require('../models/domain/LandCategory');
const { validateLandCategory } = require('../validators/landCategoryValidator');
const Land = require('../models/domain/Land');

// @desc    Get all land categories
// @route   GET /api/land-categories
// @access  Private
exports.getLandCategories = async (req, res) => {
  try {
    const categories = await LandCategory.getAllWithLandCount();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active land categories
// @route   GET /api/land-categories/active
// @access  Private
exports.getActiveCategories = async (req, res) => {
  try {
    const categories = await LandCategory.getActiveCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single land category
// @route   GET /api/land-categories/:id
// @access  Private
exports.getLandCategory = async (req, res) => {
  try {
    const category = await LandCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create land category
// @route   POST /api/land-categories
// @access  Private
exports.createLandCategory = async (req, res) => {
  try {
    const { error } = validateLandCategory(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingCategory = await LandCategory.findByName(req.body.name);
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const category = await LandCategory.create({
      ...req.body,
      created_by: req.user.id
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update land category
// @route   PUT /api/land-categories/:id
// @access  Private
exports.updateLandCategory = async (req, res) => {
  try {
    const { error } = validateLandCategory(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingCategory = await LandCategory.findByName(req.body.name);
    if (existingCategory && existingCategory.id !== parseInt(req.params.id)) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    const category = await LandCategory.update(req.params.id, req.body);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete land category
// @route   DELETE /api/land-categories/:id
// @access  Private
exports.deleteLandCategory = async (req, res) => {
  try {
    const category = await LandCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category is being used by any lands
    const [lands] = await LandCategory.pool.execute(
      'SELECT COUNT(*) as count FROM lands WHERE category_id = ?',
      [req.params.id]
    );

    if (lands[0].count > 0 && !req.query.force) {
      return res.status(400).json({
        message: 'Cannot delete category that is being used by lands. Please reassign the lands first.'
      });
    }

    await LandCategory.delete(req.params.id);
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reassign lands to a new category and delete old category
// @route   POST /api/land-categories/:id/reassign
// @access  Private
exports.reassignLandsAndDelete = async (req, res) => {
  try {
    const { newCategoryId } = req.body;
    const oldCategoryId = req.params.id;

    if (!newCategoryId) {
      return res.status(400).json({ message: 'New category ID is required' });
    }

    // Start a transaction
    const connection = await Land.pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update all lands from old category to new category
      await connection.execute(
        'UPDATE lands SET category_id = ? WHERE category_id = ?',
        [newCategoryId, oldCategoryId]
      );

      // Delete the old category
      await connection.execute(
        'DELETE FROM land_categories WHERE id = ?',
        [oldCategoryId]
      );

      // Commit the transaction
      await connection.commit();
      connection.release();

      res.status(200).json({ message: 'Lands reassigned and category deleted successfully' });
    } catch (error) {
      // If anything fails, rollback the transaction
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};