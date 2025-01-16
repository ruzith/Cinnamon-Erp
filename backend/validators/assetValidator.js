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

  if (!assetData.category?.trim()) {
    errors.category = 'Category is required';
  }

  if (!assetData.type?.trim()) {
    errors.type = 'Type is required';
  }

  if (!assetData.purchaseDate) {
    errors.purchaseDate = 'Purchase date is required';
  }

  if (!assetData.purchasePrice || assetData.purchasePrice <= 0) {
    errors.purchasePrice = 'Valid purchase price is required';
  }

  if (!assetData.currentValue || assetData.currentValue < 0) {
    errors.currentValue = 'Valid current value is required';
  }

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