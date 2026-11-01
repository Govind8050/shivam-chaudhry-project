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

    // pending / paid / refunded / refund_pending
    paymentStatus: { type: DataTypes.STRING, defaultValue: "pending" },
    razorpayOrderId: { type: DataTypes.STRING },
    razorpayPaymentId: { type: DataTypes.STRING },

    // Delivery tracking: placed -> dispatched -> out_for_delivery -> delivered
    // ya cancelled (admin panel se badalta hai, customer ke My Orders me yahi dikhta hai)
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "placed" },

    // Cancel hone par: kyu, kisne (customer / admin) aur kab
    cancelReason: { type: DataTypes.STRING(500) },
    cancelledBy: { type: DataTypes.STRING(20) },
    cancelledAt: { type: DataTypes.DATE }
  },
  { tableName: "orders", timestamps: true }
);

module.exports = Order;