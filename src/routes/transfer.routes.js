const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transfer.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const config = require('../config/config');

// All routes require authentication
router.use(auth);

// Get all transfers
router.get('/', transferController.getTransfers);

// Get transfer by ID
router.get('/:id', transferController.getTransferById);

// Create new transfer (Logistics Officer only)
router.post('/',
    authorize(config.roles.LOGISTICS_OFFICER),
    transferController.createTransfer
);

// Update transfer status (Admin and Base Commander only)
router.patch('/:id/status',
    authorize(config.roles.ADMIN, config.roles.BASE_COMMANDER),
    transferController.updateTransferStatus
);

module.exports = router; 