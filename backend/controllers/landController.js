const Land = require('../models/Land');
const { validateLand } = require('../validators/landValidator');

// @desc    Get all lands
// @route   GET /api/lands
// @access  Private
exports.getLands = async (req, res) => {
  try {
    const lands = await Land.findAll({
      orderBy: 'created_at DESC'
    });
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

    // Check for duplicate parcel number
    const existingLand = await Land.findByParcelNumber(req.body.parcel_number);
    if (existingLand) {
      return res.status(400).json({ message: 'Parcel number already exists' });
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

    // Check for duplicate parcel number if it's being changed
    if (req.body.parcel_number && req.body.parcel_number !== land.parcel_number) {
      const existingLand = await Land.findByParcelNumber(req.body.parcel_number);
      if (existingLand) {
        return res.status(400).json({ message: 'Parcel number already exists' });
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
    const land = await Land.findById(req.params.id);
    if (!land) {
      return res.status(404).json({ message: 'Land not found' });
    }

    await Land.delete(req.params.id);
    res.status(200).json({ message: 'Land deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 