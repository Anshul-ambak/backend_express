const { Sequelize } = require("sequelize");

const sequelize = new Sequelize("crud_complex", "root", "Anshul@123", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

module.exports = sequelize;

