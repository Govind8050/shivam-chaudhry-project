// controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");
const Order = require("../models/Order");
const Address = require("../models/Address");
const User = require("../models/User");
const { sendOrderEmails } = require("../utils/Mailer");

/* ================= HELPERS ================= */

function isBcryptHash(str) {
  return typeof str === "string" && /^\$2[aby]\$/.test(str);
}

function signToken(payload, expires) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: expires });
}

// Address ko ek line ke text me badalta hai (orders table me yahi save hota hai)
function formatAddress(a) {
  const main = [a.line, a.district, a.state].filter(Boolean).join(", ");
  return a.pincode ? main + " - " + a.pincode : main;
}

// Address form ka data check karke saaf karta hai. Galat ho to null deta hai
function cleanAddress(a) {
  if (!a) return null;

  const x = {
    label: String(a.label || "Home").trim().slice(0, 30) || "Home",
    fullName: String(a.fullName || "").trim(),
    phone: String(a.phone || "").trim(),
    line: String(a.line || "").trim(),
    district: String(a.district || "").trim(),
    state: String(a.state || "").trim(),
    pincode: String(a.pincode || "").trim()
  };

  if (!x.fullName || !x.phone || !x.line || !x.district || !x.state || !x.pincode) return null;
  if (x.phone.replace(/\D/g, "").length < 10) return null;
  if (!/^\d{6}$/.test(x.pincode)) return null;

  return x;
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

// Sirf customer (requireUser ke baad lagta hai)
exports.requireCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== "customer") {
    return res.status(403).json({ success: false, message: "Only customers can do this" });
  }
  next();
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

/* ================= PROFILE (Profile Information) ================= */

exports.getMe = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.json({ success: true, profile: { name: "Admin", email: req.user.email, role: "admin" } });
    }

    const c = await Customer.findByPk(req.user.id, {
      attributes: ["id", "name", "email", "mobile", "address", "district", "state", "pincode"]
    });

    if (!c) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.json({ success: true, profile: { ...c.toJSON(), role: "customer" } });

  } catch (err) {
    console.log("Get me error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= SAVED ADDRESSES (addresses table) ================= */

async function listAddresses(customerId) {
  return Address.findAll({
    where: { customerId },
    order: [["isDefault", "DESC"], ["id", "ASC"]]
  });
}

// Customer ke saare saved addresses. Pehli baar registration wala address apne aap default ban jata hai
exports.getAddresses = async (req, res) => {
  try {
    let list = await listAddresses(req.user.id);

    if (list.length === 0) {
      const c = await Customer.findByPk(req.user.id);

      if (c && c.address) {
        await Address.create({
          customerId: c.id,
          label: "Home",
          fullName: c.name,
          phone: c.mobile,
          line: c.address,
          district: c.district || "",
          state: c.state || "",
          pincode: c.pincode || "",
          isDefault: true
        });

        list = await listAddresses(req.user.id);
      }
    }

    res.json({ success: true, addresses: list });

  } catch (err) {
    console.log("Get addresses error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const clean = cleanAddress(req.body);

    if (!clean) {
      return res.status(400).json({
        success: false,
        message: "Please fill all address fields correctly (10 digit mobile, 6 digit pin code)"
      });
    }

    const count = await Address.count({ where: { customerId: req.user.id } });
    const makeDefault = count === 0 || req.body.isDefault === true;

    if (makeDefault) {
      await Address.update({ isDefault: false }, { where: { customerId: req.user.id } });
    }

    const created = await Address.create({
      customerId: req.user.id,
      ...clean,
      isDefault: makeDefault
    });

    res.json({ success: true, message: "Address saved", address: created });

  } catch (err) {
    console.log("Add address error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.setDefaultAddress = async (req, res) => {
  try {
    const addr = await Address.findOne({ where: { id: req.params.id, customerId: req.user.id } });

    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    await Address.update({ isDefault: false }, { where: { customerId: req.user.id } });
    addr.isDefault = true;
    await addr.save();

    res.json({ success: true, message: "Default address updated" });

  } catch (err) {
    console.log("Default address error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const addr = await Address.findOne({ where: { id: req.params.id, customerId: req.user.id } });

    if (!addr) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const wasDefault = !!addr.isDefault;
    await addr.destroy();

    // Default wala address hata to koi doosra default bana do
    if (wasDefault) {
      const next = await Address.findOne({ where: { customerId: req.user.id }, order: [["id", "ASC"]] });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    res.json({ success: true, message: "Address deleted" });

  } catch (err) {
    console.log("Delete address error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= ORDERS (orders table) ================= */

// Customer order place karta hai. Saved address (addressId) ya naya address (address) bhej sakta hai
exports.placeOrder = async (req, res) => {
  try {
    const { items, addressId, address, saveAddress, paymentMethod, razorpay } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    /* ---- delivery address ---- */
    let addr;

    if (addressId) {
      addr = await Address.findOne({ where: { id: addressId, customerId: req.user.id } });

      if (!addr) {
        return res.status(400).json({ success: false, message: "Selected address not found" });
      }

    } else {
      const clean = cleanAddress(address);

      if (!clean) {
        return res.status(400).json({
          success: false,
          message: "Please fill the delivery address correctly (10 digit mobile, 6 digit pin code)"
        });
      }

      if (saveAddress) {
        const count = await Address.count({ where: { customerId: req.user.id } });
        addr = await Address.create({ customerId: req.user.id, ...clean, isDefault: count === 0 });
      } else {
        addr = clean;
      }
    }

    /* ---- items aur total (server par nikalte hain) ---- */
    const cleanItems = items.map(i => ({
      id: i.id,
      name: String(i.name || ""),
      price: Number(i.price) || 0,
      qty: Math.max(1, parseInt(i.qty) || 1),
      img: i.img || ""
    }));

    const total = cleanItems.reduce((sum, i) => sum + i.price * i.qty, 0);

    /* ---- payment ---- */
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

    /* ---- save ---- */
    const order = await Order.create({
      customerId: req.user.id,
      customerEmail: req.user.email,
      customerName: addr.fullName,
      phone: addr.phone,
      address: formatAddress(addr),
      items: cleanItems,
      totalAmount: total,
      paymentMethod: method,
      paymentStatus,
      razorpayOrderId: rzpOrderId,
      razorpayPaymentId: rzpPaymentId
    });

    // Customer aur admin ko mail (background me, order ko rokta nahi)
    sendOrderEmails(order.toJSON(), req.user.email)
      .catch(err => console.log("❌ Order email error:", err && err.message ? err.message : err));

    res.json({ success: true, message: "Order placed", orderId: order.id, emailTo: req.user.email });

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