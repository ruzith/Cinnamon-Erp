const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getLandCategories,
  getActiveCategories,
  getLandCategory,
  createLandCategory,
  updateLandCategory,
  deleteLandCategory,
  reassignLandsAndDelete
} = require('../controllers/landCategoryController');

router.use(protect);

router.route('/')
  .get(getLandCategories)
  .post(createLandCategory);

router.get('/active', getActiveCategories);

router.route('/:id')
  .get(getLandCategory)
  .put(updateLandCategory)
  .delete(deleteLandCategory);

router.post('/:id/reassign', reassignLandsAndDelete);

module.exports = router;