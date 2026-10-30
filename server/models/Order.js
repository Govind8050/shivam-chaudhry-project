const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Order = sequelize.define(
  "Order",
  {
    customerId: { type: DataTypes.INTEGER },
    customerEmail: { type: DataTypes.STRING, allowNull: false },
    customerName: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING(500), allowNull: false },
    items: { type: DataTypes.JSON, allowNull: false },
    totalAmount: { type: DataTypes.INTEGER, allowNull: false },
    paymentMethod: { type: DataTypes.STRING, defaultValue: "cod" },
    paymentStatus: { type: DataTypes.STRING, defaultValue: "pending" },
    razorpayOrderId: { type: DataTypes.STRING },
    razorpayPaymentId: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: "Placed" }
  },
  { tableName: "orders", timestamps: true }
);

module.exports = Order;