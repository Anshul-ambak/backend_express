const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/db');  // Make sure your db connection is correctly imported

// Import all models
const User = require('./User');
const RefreshToken = require('./RefreshToken');

// Associate models
User.hasMany(RefreshToken, { foreignKey: 'userId' });
RefreshToken.belongsTo(User, { foreignKey: 'userId' });

module.exports = { User, RefreshToken, sequelize }; // Export models
