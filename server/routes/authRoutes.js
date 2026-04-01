const express = require("express");
const router = express.Router();

/* SINGLE IMPORT */
const authController = require("../controllers/authController");

/* OWNER ROUTES */
router.post("/owner-login", authController.ownerLogin);
router.get("/login-stats", authController.getLoginStats);
router.post("/send-otp", authController.sendOTP);

/* CUSTOMER ROUTES */
router.post("/customer-register", authController.registerCustomer);
router.post("/customer-login", authController.loginCustomer);

// Image Added
router.post("/save-profile-image", authController.saveProfileImage);

module.exports = router;