// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const c = require("../controllers/authController");

/* REGISTER + EK HI LOGIN (admin + customer) */
router.post("/customer-register", c.registerCustomer);
router.post("/customer-login", c.loginCustomer);

/* PROFILE (logged-in user) */
router.get("/me", c.requireUser, c.getMe);

/* SAVED ADDRESSES (customer) */
router.get("/addresses", c.requireUser, c.requireCustomer, c.getAddresses);
router.post("/addresses", c.requireUser, c.requireCustomer, c.addAddress);
router.put("/addresses/:id/default", c.requireUser, c.requireCustomer, c.setDefaultAddress);
router.delete("/addresses/:id", c.requireUser, c.requireCustomer, c.deleteAddress);

/* ORDERS (customer) */
router.post("/orders", c.requireUser, c.requireCustomer, c.placeOrder);
router.get("/my-orders", c.requireUser, c.requireCustomer, c.getMyOrders);

/* ADMIN (admin token zaroori) */
router.get("/admin/customers", c.requireAdmin, c.getAllCustomers);
router.get("/admin/orders", c.requireAdmin, c.getAllOrders);
router.get("/login-stats", c.requireAdmin, c.getLoginStats);

module.exports = router;