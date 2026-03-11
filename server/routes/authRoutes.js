const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");

router.post("/signup",authController.signup);
router.post("/login",authController.login);

router.post("/customer-register",authController.registerCustomer);
router.post("/customer-login",authController.loginCustomer);

module.exports = router;