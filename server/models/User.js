const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const User = sequelize.define(
  "User",
  {
    ownerId: { type: DataTypes.STRING },
    date: {
      type: DataTypes.STRING,
      defaultValue: () => new Date().toLocaleDateString("en-IN")
    },
    loginTime: {
      type: DataTypes.STRING,
      defaultValue: () =>
        new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    },
    profileImage: { type: DataTypes.TEXT("long") }
  },
  { tableName: "users", timestamps: true }
);

module.exports = User;