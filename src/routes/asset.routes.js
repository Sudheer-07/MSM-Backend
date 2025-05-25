const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const config = require('../config/config');

// All routes require authentication
router.use(auth);

// Get asset metrics
router.get('/metrics', assetController.getAssetMetrics);

// Get all assets
router.get('/', assetController.getAssets);

// Get asset by ID
router.get('/:id', assetController.getAssetById);

// Create new asset (Admin and Logistics Officer only)
router.post('/',
    authorize(config.roles.ADMIN, config.roles.LOGISTICS_OFFICER),
    assetController.createAsset
);

// Update asset (Admin and Logistics Officer only)
router.patch('/:id',
    authorize(config.roles.ADMIN, config.roles.LOGISTICS_OFFICER),
    assetController.updateAsset
);

// Delete asset (Admin only)
router.delete('/:id',
    authorize(config.roles.ADMIN),
    assetController.deleteAsset
);

module.exports = router; 