require('dotenv').config();

const config = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/military-assets',
    jwtSecret: process.env.JWT_SECRET || 'military_asset_management_secret_key_2024',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    roles: {
        ADMIN: 'admin',
        BASE_COMMANDER: 'base_commander',
        LOGISTICS_OFFICER: 'logistics_officer'
    },
    assetTypes: {
        WEAPON: 'weapon',
        VEHICLE: 'vehicle',
        EQUIPMENT: 'equipment',
        AMMUNITION: 'ammunition'
    },
    assetStatus: {
        AVAILABLE: 'available',
        ASSIGNED: 'assigned',
        MAINTENANCE: 'maintenance',
        DECOMMISSIONED: 'decommissioned'
    },
    transferStatus: {
        PENDING: 'pending',
        APPROVED: 'approved',
        REJECTED: 'rejected',
        COMPLETED: 'completed'
    },
    assignmentStatus: {
        ACTIVE: 'active',
        COMPLETED: 'completed',
        CANCELLED: 'cancelled'
    }
};

module.exports = config; 