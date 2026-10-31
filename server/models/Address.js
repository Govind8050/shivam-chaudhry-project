// models/Address.js
// Customer ke saved delivery addresses (table: addresses)
const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Address = sequelize.define(
  "Address",
  {
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING, defaultValue: "Home" },
    fullName: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    line: { type: DataTypes.STRING(500), allowNull: false },
    district: { type: DataTypes.STRING },
    state: { type: DataTypes.STRING },
    pincode: { type: DataTypes.STRING },
    isDefault: { type: DataTypes.BOOLEAN, defaultValue: false }
  },
  { tableName: "addresses", timestamps: true }
);

module.exports = Address;