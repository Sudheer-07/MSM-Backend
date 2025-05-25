const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    assignmentId: {
        type: String,
        required: true,
        unique: true
    },
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    base: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['ACTIVE', 'RETURNED', 'LOST', 'DAMAGED']
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    purpose: {
        type: String,
        required: true
    },
    conditionAtAssignment: {
        type: String,
        required: true,
        enum: ['NEW', 'GOOD', 'FAIR', 'POOR']
    },
    conditionAtReturn: {
        type: String,
        enum: ['NEW', 'GOOD', 'FAIR', 'POOR']
    },
    notes: String,
    returnNotes: String,
    documents: [{
        name: String,
        url: String,
        type: String
    }],
    maintenanceRequired: {
        type: Boolean,
        default: false
    },
    maintenanceDetails: {
        description: String,
        cost: Number,
        date: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
assignmentSchema.index({ asset: 1, status: 1 });
assignmentSchema.index({ assignedTo: 1, status: 1 });
assignmentSchema.index({ base: 1, status: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema); 