/**
 * Asset validator module
 * Handles all asset-related validations
 */

/**
 * Validate asset ID
 * @param {string|number} id - The asset ID to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateAssetId = (id) => {
  const numId = Number(id);
  return !isNaN(numId) && numId > 0 && Number.isInteger(numId);
};

/**
 * Validate asset status
 * @param {string} status - The asset status to validate
 * @returns {boolean} - True if valid, false otherwise
 */
const validateAssetStatus = (status) => {
  const validStatuses = ['active', 'maintenance', 'retired'];
  return validStatuses.includes(status);
};

/**
 * Validate asset data for creation/update
 * @param {Object} assetData - The asset data to validate
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
const validateAssetData = (assetData) => {
  const errors = {};

  // Required fields
  if (!assetData.name?.trim()) {
    errors.name = 'Asset name is required';
  }

  if (!assetData.purchaseDate) {
    errors.purchaseDate = 'Purchase date is required';
  } else {
    const purchaseDate = new Date(assetData.purchaseDate);
    if (isNaN(purchaseDate.getTime())) {
      errors.purchaseDate = 'Invalid purchase date format';
    }
    // Optional: Validate that purchase date is not in the future
    if (purchaseDate > new Date()) {
      errors.purchaseDate = 'Purchase date cannot be in the future';
    }
  }

  // Validate numeric fields
  if (assetData.purchasePrice) {
    const price = parseFloat(assetData.purchasePrice);
    if (isNaN(price) || price < 0) {
      errors.purchasePrice = 'Purchase price must be a valid positive number';
    }
  }

  if (assetData.currentValue) {
    const value = parseFloat(assetData.currentValue);
    if (isNaN(value) || value < 0) {
      errors.currentValue = 'Current value must be a valid positive number';
    }
  }

  // Validate status if provided
  if (assetData.status && !validateAssetStatus(assetData.status)) {
    errors.status = 'Invalid asset status';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateAssetId,
  validateAssetStatus,
  validateAssetData
};