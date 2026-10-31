const express = require("express");
const sequelize = require("./db");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");

const authRoutes = require("./routes/authRoutes");

require("./models/Customer");
require("./models/Admin");
require("./models/Order");
require("./models/Address");
const seedAdmin = require("./models/seedAdmin");

const app = express();

/* ================= STARTUP CHECK ================= */

["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD"].forEach(key => {
  if (!process.env[key]) {
    console.log(`⚠️ Missing environment variable: ${key}`);
  }
});

/* ================= MIDDLEWARE ================= */

app.use(express.json({ limit: "10mb" }));
app.use(cors());

/* ================= STATIC WEBSITE ================= */

app.use(express.static(path.join(__dirname, "../Public")));

/* ================= DATABASE ================= */

sequelize.authenticate()
  .then(() => {
    console.log("✅ MySQL Connected");
    return sequelize.sync();      // admins, customers, orders tables ban jayengi
  })
  .then(() => seedAdmin())        // fixed admin row
  .then(() => console.log("🔥 DB READY"))
  .catch(err => console.log("❌ Database Error:", err));

/* ================= API ROUTES ================= */

app.use("/api/auth", authRoutes);

/* ================= BULK ORDER EMAIL API ================= */

app.post("/api/send-order", async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ message: "All fields required" });
    }

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
      subject: "🛒 New Bulk Order Request",
      text: `
New Customer Contact Request

Name: ${name}
Phone: ${phone}
Address: ${address}

Customer wants to place a bulk order.
`
    });

    res.json({ success: true, message: "Email sent successfully" });

  } catch (error) {
    console.log("❌ Email Error:", error);
    res.status(500).json({ success: false, message: "Email failed" });
  }
});

/* ================= RAZORPAY ================= */

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.post("/api/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR"
    });

    res.json(order);

  } catch (err) {
    console.log("RAZORPAY ERROR:", err);
    res.status(500).json({ error: "Order failed" });
  }
});

/* ================= HOME ROUTE ================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Public/index.html"));
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server Running on http://localhost:${PORT}`);
});