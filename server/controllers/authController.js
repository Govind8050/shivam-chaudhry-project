const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Customer = require("../models/Customer");
const nodemailer = require("nodemailer");

/* ================= OWNER CONFIG ================= */

const OWNER_ID = "2313020292";
const OWNER_PASSWORD = "8050";

/* ================= OWNER LOGIN ================= */

exports.ownerLogin = async (req, res) => {
  try {

    const { id, password } = req.body;

    if (!id || !password) {
      return res.json({
        success: false,
        message: "All fields required"
      });
    }

    if (id === OWNER_ID && password === OWNER_PASSWORD) {

      const today = new Date().toLocaleDateString();

      let newLog;

      try {
        newLog = await User.create({
          ownerId: id,
          date: today,
          profileImage: req.body.profileImage || ""
        });

        console.log("Saved to DB:", newLog);

      } catch (dbErr) {
        console.log("DB ERROR:", dbErr);
      }

      return res.json({
        success: true,
        message: "Login success",
        user: {
          _id: newLog?._id,   // ✅ REAL ID
          name: "Owner",
          email: "owner@gmail.com",
          profileImage: newLog?.profileImage || ""
        }
      });
    }

    return res.json({
      success: false,
      message: "Invalid credentials"
    });

  } catch (err) {
    console.log("SERVER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/* ================= LOGIN STATS ================= */

exports.getLoginStats = async (req, res) => {
  try {

    const logs = await User.find();

    let stats = {};

    logs.forEach(log => {
      if (!stats[log.date]) {
        stats[log.date] = 0;
      }
      stats[log.date]++;
    });

    res.json(stats);

  } catch (err) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};

/* ================= SEND OTP ================= */

exports.sendOTP = async (req, res) => {
  try {

    const otp = Math.floor(1000 + Math.random() * 9000);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Your Login OTP",
      text: `Your OTP is: ${otp}`
    });

    res.json({ success: true, otp });

  } catch (err) {
    console.log("OTP Error:", err);
    res.json({ success: false });
  }
};

/* ================= CUSTOMER REGISTER ================= */

exports.registerCustomer = async (req, res) => {
  try {

    const { name, email, mobile, address, district, state, pincode, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const customer = new Customer({
      name,
      email,
      mobile,
      address,
      district,
      state,
      pincode,
      password: hashedPassword,
      profileImage: ""
    });

    await customer.save();

    res.json({
      success: true,
      message: "Customer Account Created"
    });

  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Error creating account"
    });
  }
};

/* ================= CUSTOMER LOGIN ================= */

exports.loginCustomer = async (req, res) => {
  try {

    const { email, password } = req.body;

    const customer = await Customer.findOne({ email });

    if (!customer) {
      return res.json({
        success: false,
        message: "Customer not found"
      });
    }

    const isMatch = await bcrypt.compare(password, customer.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Wrong password"
      });
    }

    res.json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        address: customer.address,
        profileImage: customer.profileImage
      }
    });

  } catch (err) {
    res.json({
      success: false,
      message: "Login error"
    });
  }
};

/* ================= SAVE PROFILE IMAGE ================= */

exports.saveProfileImage = async (req, res) => {
  try {

    const { userId, image } = req.body;

    // 🔥 पहले User में check करो (owner/employee)
    let user = await User.findById(userId);

    if (user) {
      user.profileImage = image;
      await user.save();

      return res.json({
        success: true,
        message: "Image saved (User)"
      });
    }

    // 🔥 अगर User में नहीं मिला → Customer में check करो
    const customer = await Customer.findById(userId);

    if (!customer) {
      return res.json({
        success: false,
        message: "User not found"
      });
    }

    customer.profileImage = image;
    await customer.save();

    res.json({
      success: true,
      message: "Image saved (Customer)"
    });

  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: "Error saving image"
    });
  }
};