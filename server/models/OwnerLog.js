const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const OwnerLog = sequelize.define(
  "OwnerLog",
  {
    ownerId: { type: DataTypes.STRING },
    date: { type: DataTypes.STRING },
    loginTime: {
      type: DataTypes.STRING,
      defaultValue: () =>
        new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    },
    profileImage: { type: DataTypes.TEXT("long") }
  },
  { tableName: "owner_logs", timestamps: false }
);

module.exports = OwnerLog;