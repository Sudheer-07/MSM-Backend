const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { auth, authorize } = require('../middleware/auth.middleware');
const config = require('../config/config');

// All routes require authentication
router.use(auth);

// Get all assignments
router.get('/', assignmentController.getAssignments);

// Get assignment by ID
router.get('/:id', assignmentController.getAssignmentById);

// Create new assignment (Logistics Officer only)
router.post('/',
    authorize(config.roles.LOGISTICS_OFFICER),
    assignmentController.createAssignment
);

// Update assignment status (Admin, Base Commander, and Logistics Officer)
router.patch('/:id/status',
    authorize(config.roles.ADMIN, config.roles.BASE_COMMANDER, config.roles.LOGISTICS_OFFICER),
    assignmentController.updateAssignmentStatus
);

module.exports = router; 