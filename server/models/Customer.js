const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Customer = sequelize.define(
  "Customer",
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false },
    mobile: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING },
    district: { type: DataTypes.STRING },
    state: { type: DataTypes.STRING },
    pincode: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING, allowNull: false },
    profileImage: { type: DataTypes.TEXT("long") }
  },
  { tableName: "customers", timestamps: false }
);

module.exports = Customer;