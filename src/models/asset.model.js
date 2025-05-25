const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    assetId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['WEAPON', 'VEHICLE', 'AMMUNITION', 'EQUIPMENT']
    },
    category: {
        type: String,
        required: true
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true
    },
    currentBase: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'DECOMMISSIONED']
    },
    condition: {
        type: String,
        required: true,
        enum: ['NEW', 'GOOD', 'FAIR', 'POOR']
    },
    purchaseDate: {
        type: Date,
        required: true
    },
    purchasePrice: {
        type: Number,
        required: true
    },
    supplier: {
        type: String,
        required: true
    },
    specifications: {
        type: Map,
        of: String
    },
    maintenanceHistory: [{
        date: Date,
        description: String,
        performedBy: String,
        cost: Number
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    transferHistory: [{
        fromBase: String,
        toBase: String,
        date: Date,
        authorizedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String
    }]
}, {
    timestamps: true
});

// Index for efficient querying
assetSchema.index({ assetId: 1, currentBase: 1 });
assetSchema.index({ type: 1, status: 1 });
assetSchema.index({ serialNumber: 1 });

module.exports = mongoose.model('Asset', assetSchema); 