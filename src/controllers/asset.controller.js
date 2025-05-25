const Asset = require('../models/asset.model');
const config = require('../config/config');
const Transfer = require('../models/transfer.model');
const Assignment = require('../models/assignment.model');

exports.createAsset = async (req, res) => {
    try {
        console.log('Creating asset with data:', req.body);
        console.log('User:', req.user);

        // For admin users, use the base from the request body
        // For non-admin users, use their assigned base
        const currentBase = req.user.role === config.roles.ADMIN 
            ? req.body.currentBase 
            : req.user.base;

        if (!currentBase) {
            return res.status(400).json({
                success: false,
                message: 'Base is required for asset creation'
            });
        }

        const asset = new Asset({
            ...req.body,
            currentBase
        });

        console.log('Asset object before save:', asset);

        await asset.save();

        res.status(201).json({
            success: true,
            message: 'Asset created successfully',
            data: asset
        });
    } catch (error) {
        console.error('Error creating asset:', error);
        console.error('Validation errors:', error.errors);
        res.status(500).json({
            success: false,
            message: 'Error creating asset',
            error: error.message,
            details: error.errors
        });
    }
};

exports.getAssets = async (req, res) => {
    try {
        const { type, status, base } = req.query;
        const query = {};

        if (type) query.type = type;
        if (status) query.status = status;
        if (base) query.currentBase = base;
        if (req.user.role !== config.roles.ADMIN) {
            query.currentBase = req.user.base;
        }

        const assets = await Asset.find(query)
            .populate('assignedTo', 'username fullName')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: assets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching assets',
            error: error.message
        });
    }
};

exports.getAssetById = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id)
            .populate('assignedTo', 'username fullName');

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }

        if (req.user.role !== config.roles.ADMIN && asset.currentBase !== req.user.base) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Asset belongs to different base'
            });
        }

        res.json({
            success: true,
            data: asset
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching asset',
            error: error.message
        });
    }
};

exports.updateAsset = async (req, res) => {
    try {
        console.log('Updating asset with data:', req.body);
        console.log('Asset ID:', req.params.id);

        const updates = Object.keys(req.body);
        const allowedUpdates = [
            'name', 'type', 'category', 'status', 'condition',
            'specifications', 'maintenanceHistory', 'currentBase'
        ];
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));

        if (!isValidOperation) {
            return res.status(400).json({
                success: false,
                message: 'Invalid updates',
                allowedUpdates
            });
        }

        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }

        // Check base access
        if (req.user.role !== config.roles.ADMIN) {
            // Non-admin users can only update assets in their base
            if (asset.currentBase !== req.user.base) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Asset belongs to different base'
                });
            }
            // Non-admin users cannot change the base
            if (req.body.currentBase && req.body.currentBase !== req.user.base) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: Cannot change asset base'
                });
            }
        }

        // Apply updates
        updates.forEach(update => {
            if (update === 'purchaseDate' && req.body[update]) {
                asset[update] = new Date(req.body[update]);
            } else if (update === 'purchasePrice' && req.body[update]) {
                asset[update] = Number(req.body[update]);
            } else {
                asset[update] = req.body[update];
            }
        });

        console.log('Asset object before save:', asset);
        await asset.save();

        res.json({
            success: true,
            message: 'Asset updated successfully',
            data: asset
        });
    } catch (error) {
        console.error('Error updating asset:', error);
        console.error('Validation errors:', error.errors);
        res.status(500).json({
            success: false,
            message: 'Error updating asset',
            error: error.message,
            details: error.errors
        });
    }
};

exports.deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (!asset) {
            return res.status(404).json({
                success: false,
                message: 'Asset not found'
            });
        }

        if (req.user.role !== config.roles.ADMIN && asset.currentBase !== req.user.base) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Asset belongs to different base'
            });
        }

        await asset.remove();

        res.json({
            success: true,
            message: 'Asset deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting asset',
            error: error.message
        });
    }
};

exports.getAssetMetrics = async (req, res) => {
    try {
        console.log('Getting metrics for user:', req.user);

        // Base query for assets
        const assetQuery = {};
        if (req.user.role !== config.roles.ADMIN) {
            assetQuery.currentBase = req.user.base;
        }

        // Get total assets
        const totalAssets = await Asset.countDocuments(assetQuery);

        // Get active assets (status = AVAILABLE)
        const activeAssets = await Asset.countDocuments({
            ...assetQuery,
            status: 'AVAILABLE'
        });

        // Get pending transfers
        const transferQuery = {
            status: 'PENDING'
        };
        if (req.user.role !== config.roles.ADMIN) {
            transferQuery.$or = [
                { fromBase: req.user.base },
                { toBase: req.user.base }
            ];
        }
        const pendingTransfers = await Transfer.countDocuments(transferQuery);

        // Get active assignments
        const assignmentQuery = {
            status: 'ACTIVE'
        };
        if (req.user.role !== config.roles.ADMIN) {
            assignmentQuery.base = req.user.base;
        }
        const activeAssignments = await Assignment.countDocuments(assignmentQuery);

        // Get asset status distribution
        const statusDistribution = await Asset.aggregate([
            { $match: assetQuery },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format status distribution for chart
        const formattedStatusDistribution = statusDistribution.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                totalAssets,
                activeAssets,
                pendingTransfers,
                activeAssignments,
                statusDistribution: formattedStatusDistribution
            }
        });
    } catch (error) {
        console.error('Error getting asset metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting asset metrics',
            error: error.message
        });
    }
}; 