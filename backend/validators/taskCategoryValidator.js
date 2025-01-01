const validateTaskCategory = (req, res, next) => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  if (name.length > 100) {
    return res.status(400).json({ message: 'Category name must be less than 100 characters' });
  }

  next();
};

module.exports = {
  validateTaskCategory
};