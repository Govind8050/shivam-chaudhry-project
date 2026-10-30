const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");
const Order = require("../models/Order");
const User = require("../models/User");

function isBcryptHash(str) {
  return typeof str === "string" && /^\$2[aby]\$/.test(str);
}

function signToken(payload, expires) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expires });
}

/* ================= REGISTER (customers table) ================= */

exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, mobile, address, district, state, pincode, password } = req.body;

    if (!name || !email || !mobile || !address || !district || !state || !pincode || !password) {
      return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    // Admin ka email customer ke roop me register nahi ho sakta
    const isAdminEmail = await Admin.findOne({ where: { email: cleanEmail } });
    if (isAdminEmail) {
      return res.status(400).json({ success: false, message: "This email cannot be registered" });
    }

    const exists = await Customer.findOne({ where: { email: cleanEmail } });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    await Customer.create({
      name: String(name).trim(),
      email: cleanEmail,
      mobile: String(mobile).trim(),
      address: String(address).trim(),
      district: String(district).trim(),
      state: String(state).trim(),
      pincode: String(pincode).trim(),
      password: await bcrypt.hash(String(password), 10)
    });

    res.json({ success: true, message: "Account created successfully. Please login." });

  } catch (err) {
    console.log("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= EK HI LOGIN (admins table + customers table) ================= */

exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const cleanEmail = String(email).trim().toLowerCase();

    /* 1) Pehle admins table me dekho */
    const admin = await Admin.findOne({ where: { email: cleanEmail } });

    if (admin) {
      const ok = await bcrypt.compare(String(password), admin.password);

      if (!ok) {
        return res.status(401).json({ success: false, message: "Invalid email or password" });
      }

      return res.json({
        success: true,
        role: "admin",
        token: signToken({ role: "admin", email: admin.email }, "8h"),
        customer: { name: "Admin", email: admin.email, mobile: "", address: "" }
      });
    }

    /* 2) Admin nahi hai to customers table */
    const customer = await Customer.findOne({ where: { email: cleanEmail } });

    if (!customer) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    let ok = false;

    if (isBcryptHash(customer.password)) {
      ok = await bcrypt.compare(String(password), customer.password);
    } else {
      // purane plain-text password wale customers
      ok = String(password) === customer.password;
      if (ok) {
        customer.password = await bcrypt.hash(String(password), 10);
        await customer.save();
      }
    }

    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    User.create({ ownerId: customer.email }).catch(() => {});

    res.json({
      success: true,
      role: "customer",
      token: signToken({ role: "customer", id: customer.id, email: customer.email }, "7d"),
      customer: {
        name: customer.name,
        email: customer.email,
        mobile: customer.mobile,
        address: customer.address
      }
    });

  } catch (err) {
    console.log("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= TOKEN CHECK (middleware) ================= */

function readToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

// Koi bhi logged-in user (customer ya admin)
exports.requireUser = (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) return res.status(401).json({ success: false, message: "Please login first" });

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Session expired. Please login again." });
  }
};

// Sirf admin
exports.requireAdmin = (req, res, next) => {
  try {
    const token = readToken(req);
    if (!token) return res.status(401).json({ success: false, message: "Admin login required" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

/* ================= ORDERS (orders table) ================= */

// Customer order place karta hai
exports.placeOrder = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({ success: false, message: "Only customers can place orders" });
    }

    const { items, name, phone, address, paymentMethod, razorpay } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, message: "Name, phone and address are required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Sirf zaroori fields rakhte hain aur total server par nikalte hain
    const cleanItems = items.map(i => ({
      id: i.id,
      name: String(i.name || ""),
      price: Number(i.price) || 0,
      qty: Math.max(1, parseInt(i.qty) || 1),
      img: i.img || ""
    }));

    const total = cleanItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    const method = paymentMethod === "online" ? "online" : "cod";
    let paymentStatus = "pending";
    let rzpOrderId = null;
    let rzpPaymentId = null;

    if (method === "online") {

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = razorpay || {};

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment details missing" });
      }

      const expected = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + "|" + razorpay_payment_id)
        .digest("hex");

      if (expected !== razorpay_signature) {
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }

      const dup = await Order.findOne({ where: { razorpayPaymentId: razorpay_payment_id } });
      if (dup) {
        return res.status(400).json({ success: false, message: "Order already recorded" });
      }

      paymentStatus = "paid";
      rzpOrderId = razorpay_order_id;
      rzpPaymentId = razorpay_payment_id;
    }

    const order = await Order.create({
      customerId: req.user.id,
      customerEmail: req.user.email,
      customerName: String(name).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      items: cleanItems,
      totalAmount: total,
      paymentMethod: method,
      paymentStatus,
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId
    });

    res.json({ success: true, message: "Order placed", orderId: order.id });

  } catch (err) {
    console.log("Place order error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Customer apne orders dekhta hai
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { customerEmail: req.user.email },
      order: [["id", "DESC"]]
    });

    res.json({ success: true, orders });

  } catch (err) {
    console.log("My orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= ADMIN ================= */

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: ["id", "name", "email", "mobile", "address", "district", "state", "pincode"],
      order: [["id", "DESC"]]
    });

    res.json({ success: true, customers });

  } catch (err) {
    console.log("Admin customers error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({ order: [["id", "DESC"]] });
    res.json({ success: true, orders });

  } catch (err) {
    console.log("Admin orders error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getLoginStats = async (req, res) => {
  try {
    const logs = await User.findAll();
    const stats = {};
    logs.forEach(log => { stats[log.date] = (stats[log.date] || 0) + 1; });
    res.json(stats);

  } catch (err) {
    console.log("Stats error:", err);
    res.status(500).json({ message: "Error fetching stats" });
  }
};