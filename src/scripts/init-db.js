require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Asset = require('../models/asset.model');
const config = require('../config/config');

const initializeDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongoUri);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Asset.deleteMany({});
        console.log('Cleared existing data');

        // Create admin user
        const adminUser = await User.create({
            username: 'admin',
            password: 'admin123',
            email: 'admin@military.gov',
            fullName: 'System Administrator',
            role: config.roles.ADMIN,
            isActive: true
        });
        console.log('Created admin user');

        // Create base commander
        const commanderUser = await User.create({
            username: 'commander',
            password: 'commander123',
            email: 'commander@military.gov',
            fullName: 'Base Commander',
            role: config.roles.BASE_COMMANDER,
            base: 'Alpha Base',
            isActive: true
        });
        console.log('Created base commander');

        // Create logistics officer
        const logisticsUser = await User.create({
            username: 'logistics',
            password: 'logistics123',
            email: 'logistics@military.gov',
            fullName: 'Logistics Officer',
            role: config.roles.LOGISTICS_OFFICER,
            base: 'Alpha Base',
            isActive: true
        });
        console.log('Created logistics officer');

        // Create sample assets
        const assets = await Asset.create([
            {
                assetId: 'AST001',
                name: 'M4 Carbine',
                type: 'WEAPON',
                category: 'Rifle',
                serialNumber: 'SN001',
                currentBase: 'Alpha Base',
                status: 'AVAILABLE',
                condition: 'NEW',
                purchaseDate: new Date(),
                purchasePrice: 1200,
                supplier: 'Military Supplies Inc.'
            },
            {
                assetId: 'AST002',
                name: 'Humvee',
                type: 'VEHICLE',
                category: 'Transport',
                serialNumber: 'SN002',
                currentBase: 'Alpha Base',
                status: 'AVAILABLE',
                condition: 'GOOD',
                purchaseDate: new Date(),
                purchasePrice: 50000,
                supplier: 'Military Vehicles Corp.'
            }
        ]);
        console.log('Created sample assets');

        console.log('Database initialization completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

initializeDatabase(); 