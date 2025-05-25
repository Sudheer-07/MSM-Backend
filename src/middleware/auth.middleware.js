const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/user.model');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        const user = await User.findOne({ _id: decoded.userId, isActive: true });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Insufficient permissions'
            });
        }
        next();
    };
};

const baseAccess = (req, res, next) => {
    if (req.user.role === config.roles.ADMIN) {
        return next();
    }

    const requestedBase = req.params.base || req.body.base;
    if (req.user.base !== requestedBase) {
        return res.status(403).json({
            success: false,
            message: 'Access denied: Base access restricted'
        });
    }
    next();
};

module.exports = {
    auth,
    authorize,
    baseAccess
}; 