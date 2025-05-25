const Assignment = require('../models/assignment.model');
const Asset = require('../models/asset.model');
const User = require('../models/user.model');
const config = require('../config/config');

exports.createAssignment = async (req, res) => {
    try {
        const { assetId, assignedToId, purpose, conditionAtAssignment } = req.body;

        // Validate asset
        const asset = await Asset.findById(assetId);
        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }

        if (asset.currentBase !== req.user.base) {
            return res.status(403).json({
                success: false,
                message: 'Asset belongs to different base'
            });
        }

        if (asset.status !== 'AVAILABLE') {
            return res.status(400).json({
                success: false,
                message: 'Asset is not available for assignment'
            });
        }

        // Validate assignee
        const assignee = await User.findById(assignedToId);
        if (!assignee) {
            return res.status(404).json({
                success: false,
                message: 'Assignee not found'
            });
        }

        if (assignee.base !== req.user.base) {
            return res.status(403).json({
                success: false,
                message: 'Assignee belongs to different base'
            });
        }

        // Create assignment
        const assignment = new Assignment({
            asset: assetId,
            assignedTo: assignedToId,
            assignedBy: req.user._id,
            base: req.user.base,
            purpose,
            conditionAtAssignment,
            status: 'ACTIVE',
            startDate: new Date()
        });

        // Update asset status
        asset.status = 'ASSIGNED';
        asset.assignedTo = assignedToId;
        await asset.save();

        await assignment.save();

        res.status(201).json({
            success: true,
            message: 'Asset assigned successfully',
            data: assignment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating assignment',
            error: error.message
        });
    }
};

exports.getAssignments = async (req, res) => {
    try {
        const { status, base } = req.query;
        const query = {};

        if (status) query.status = status;
        if (base) query.base = base;
        if (req.user.role !== config.roles.ADMIN) {
            query.base = req.user.base;
        }

        const assignments = await Assignment.find(query)
            .populate('asset')
            .populate('assignedTo', 'username fullName')
            .populate('assignedBy', 'username fullName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: assignments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching assignments',
            error: error.message
        });
    }
};

exports.getAssignmentById = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id)
            .populate('asset')
            .populate('assignedTo', 'username fullName')
            .populate('assignedBy', 'username fullName');

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        if (req.user.role !== config.roles.ADMIN && assignment.base !== req.user.base) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Assignment belongs to different base'
            });
        }

        res.json({
            success: true,
            data: assignment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching assignment',
            error: error.message
        });
    }
};

exports.updateAssignmentStatus = async (req, res) => {
    try {
        const { status, conditionAtReturn, returnNotes, maintenanceRequired, maintenanceDetails } = req.body;
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        if (req.user.role !== config.roles.ADMIN && assignment.base !== req.user.base) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Assignment belongs to different base'
            });
        }

        // Update assignment
        assignment.status = status;
        assignment.endDate = new Date();
        assignment.conditionAtReturn = conditionAtReturn;
        assignment.returnNotes = returnNotes;
        assignment.maintenanceRequired = maintenanceRequired;
        if (maintenanceDetails) {
            assignment.maintenanceDetails = maintenanceDetails;
        }

        // Update asset status
        const asset = await Asset.findById(assignment.asset);
        asset.status = maintenanceRequired ? 'MAINTENANCE' : 'AVAILABLE';
        asset.assignedTo = null;
        if (maintenanceDetails) {
            asset.maintenanceHistory.push({
                date: new Date(),
                description: maintenanceDetails.description,
                performedBy: req.user._id,
                cost: maintenanceDetails.cost
            });
        }
        await asset.save();

        await assignment.save();

        res.json({
            success: true,
            message: 'Assignment status updated successfully',
            data: assignment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating assignment status',
            error: error.message
        });
    }
}; 