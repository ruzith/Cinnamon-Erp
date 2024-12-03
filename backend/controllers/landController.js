const Land = require('../models/Land');

// @desc    Get all lands
// @route   GET /api/lands
// @access  Private
exports.getLands = async (req, res) => {
  try {
    const lands = await Land.find()
      .sort({ createdAt: -1 }); // Sort by newest first
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
// @access  Private
exports.createLand = async (req, res) => {
  try {
    // Validate required fields
    const {
      parcelNumber,
      location,
      area,
      areaUnit,
      status,
      forestType,
      acquisitionDate
    } = req.body;

    if (!parcelNumber || !location || !area || !areaUnit || !status || !forestType || !acquisitionDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const land = await Land.create({
      ...req.body
    });

    res.status(201).json(land);
  } catch (error) {
    // Handle duplicate parcel number error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Parcel number already exists' });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update land
// @route   PUT /api/lands/:id
// @access  Private
exports.updateLand = async (req, res) => {
  try {
    const land = await Land.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!land) {
      return res.status(404).json({ message: 'Land not found' });
    }
    res.status(200).json(land);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete land
// @route   DELETE /api/lands/:id
// @access  Private
exports.deleteLand = async (req, res) => {
  try {
    const land = await Land.findByIdAndDelete(req.params.id);
    if (!land) {
      return res.status(404).json({ message: 'Land not found' });
    }
    res.status(200).json({ message: 'Land deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 