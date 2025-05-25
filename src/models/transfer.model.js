const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
    transferId: {
        type: String,
        required: true,
        unique: true
    },
    assets: [{
        asset: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Asset',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        }
    }],
    fromBase: {
        type: String,
        required: true
    },
    toBase: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED']
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reason: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        required: true,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    actualTransferDate: {
        type: Date
    },
    transportDetails: {
        method: String,
        vehicleId: String,
        driver: String,
        escort: String
    },
    notes: String,
    documents: [{
        name: String,
        url: String,
        type: String
    }]
}, {
    timestamps: true
});

// Indexes for efficient querying
transferSchema.index({ fromBase: 1, toBase: 1 });
transferSchema.index({ status: 1 });
transferSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model('Transfer', transferSchema); 