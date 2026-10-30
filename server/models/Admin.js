const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Admin = sequelize.define(
  "Admin",
  {
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false }
  },
  { tableName: "admins", timestamps: false }
);

module.exports = Admin;