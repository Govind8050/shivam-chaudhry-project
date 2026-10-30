const express = require("express");
const router = express.Router();
const c = require("../controllers/authController");

/* CUSTOMER */
router.post("/customer-register", c.registerCustomer);
router.post("/customer-login", c.loginCustomer);   // ek hi login: admin + customer

/* ORDERS (login zaroori) */
router.post("/orders", c.requireUser, c.placeOrder);
router.get("/my-orders", c.requireUser, c.getMyOrders);

/* ADMIN (admin token zaroori) */
router.get("/admin/customers", c.requireAdmin, c.getAllCustomers);
router.get("/admin/orders", c.requireAdmin, c.getAllOrders);
router.get("/login-stats", c.requireAdmin, c.getLoginStats);

module.exports = router;