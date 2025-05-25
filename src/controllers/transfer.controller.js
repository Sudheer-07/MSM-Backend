const Transfer = require('../models/transfer.model');
const Asset = require('../models/asset.model');
const config = require('../config/config');

exports.createTransfer = async (req, res) => {
    try {
        console.log('Creating transfer with data:', req.body);
        console.log('User:', req.user);

        const { assets, toBase, reason, priority, scheduledDate, transportDetails } = req.body;

        // Validate required fields
        if (!assets || !Array.isArray(assets) || assets.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one asset is required'
            });
        }

        if (!toBase) {
            return res.status(400).json({
                success: false,
                message: 'Destination base is required'
            });
        }

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Reason is required'
            });
        }

        if (!priority) {
            return res.status(400).json({
                success: false,
                message: 'Priority is required'
            });
        }

        if (!scheduledDate) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled date is required'
            });
        }

        // Validate assets
        for (const assetData of assets) {
            if (!assetData.asset) {
                return res.status(400).json({
                    success: false,
                    message: 'Asset ID is required for each asset'
                });
            }

            const asset = await Asset.findById(assetData.asset);
            if (!asset) {
                return res.status(404).json({
                    success: false,
                    message: `Asset ${assetData.asset} not found`
                });
            }

            if (asset.currentBase !== req.user.base) {
                return res.status(403).json({
                    success: false,
                    message: `Asset ${asset.assetId} belongs to different base`
                });
            }

            if (asset.status !== 'AVAILABLE') {
                return res.status(400).json({
                    success: false,
                    message: `Asset ${asset.assetId} is not available for transfer`
                });
            }
        }

        // Generate transfer ID
        const transferId = `TRF${Date.now().toString().slice(-6)}`;

        const transfer = new Transfer({
            transferId,
            assets,
            fromBase: req.user.base,
            toBase,
            reason,
            priority,
            scheduledDate,
            transportDetails,
            requestedBy: req.user._id,
            status: 'PENDING'
        });

        console.log('Transfer object before save:', transfer);
        await transfer.save();

        res.status(201).json({
            success: true,
            message: 'Transfer request created successfully',
            data: transfer
        });
    } catch (error) {
        console.error('Error creating transfer:', error);
        console.error('Validation errors:', error.errors);
        res.status(500).json({
            success: false,
            message: 'Error creating transfer request',
            error: error.message,
            details: error.errors
        });
    }
};

exports.getTransfers = async (req, res) => {
    try {
        const { status, base } = req.query;
        const query = {};

        if (status) query.status = status;
        if (base) {
            query.$or = [
                { fromBase: base },
                { toBase: base }
            ];
        }
        if (req.user.role !== config.roles.ADMIN) {
            query.$or = [
                { fromBase: req.user.base },
                { toBase: req.user.base }
            ];
        }

        const transfers = await Transfer.find(query)
            .populate('requestedBy', 'username fullName')
            .populate('approvedBy', 'username fullName')
            .populate('assets.asset')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: transfers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching transfers',
            error: error.message
        });
    }
};

exports.getTransferById = async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id)
            .populate('requestedBy', 'username fullName')
            .populate('approvedBy', 'username fullName')
            .populate('assets.asset');

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: 'Transfer not found'
            });
        }

        if (req.user.role !== config.roles.ADMIN &&
            transfer.fromBase !== req.user.base &&
            transfer.toBase !== req.user.base) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Transfer belongs to different base'
            });
        }

        res.json({
            success: true,
            data: transfer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching transfer',
            error: error.message
        });
    }
};

exports.updateTransferStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const transfer = await Transfer.findById(req.params.id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: 'Transfer not found'
            });
        }

        // Validate status transition
        const validTransitions = {
            'PENDING': ['APPROVED', 'CANCELLED'],
            'APPROVED': ['IN_TRANSIT', 'CANCELLED'],
            'IN_TRANSIT': ['COMPLETED', 'CANCELLED']
        };

        if (!validTransitions[transfer.status]?.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${transfer.status} to ${status}`
            });
        }

        // Update transfer status
        transfer.status = status;
        if (status === 'APPROVED') {
            transfer.approvedBy = req.user._id;
        }
        if (status === 'IN_TRANSIT') {
            transfer.actualTransferDate = new Date();
        }
        if (status === 'COMPLETED') {
            // Update asset locations
            for (const assetData of transfer.assets) {
                const asset = await Asset.findById(assetData.asset);
                asset.currentBase = transfer.toBase;
                asset.transferHistory.push({
                    fromBase: transfer.fromBase,
                    toBase: transfer.toBase,
                    date: new Date(),
                    authorizedBy: req.user._id,
                    reason: transfer.reason
                });
                await asset.save();
            }
        }

        await transfer.save();

        res.json({
            success: true,
            message: 'Transfer status updated successfully',
            data: transfer
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating transfer status',
            error: error.message
        });
    }
}; 