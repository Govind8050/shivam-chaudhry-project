const express = require("express");
const sequelize = require("./db");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const nodemailer = require("nodemailer");

const authRoutes = require("./routes/authRoutes");

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(cors());

/* ================= STATIC WEBSITE ================= */

app.use(express.static(path.join(__dirname, "../Public")));

/* ================= DATABASE ================= */

sequelize.authenticate()
.then(() => {
  console.log("✅ MySQL Connected");
  // tables apne aap ban jayengi (customers, users)
  return sequelize.sync();
})
.then(() => {
  console.log("🔥 DB READY");
})
.catch(err => {
  console.log("❌ Database Error:", err);
});

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

/* ================= LOGIN STATS ================= */

app.get("/api/login-stats", async (req, res) => {
  try {
    const User = require("./models/User");

    const logs = await User.findAll();

    let stats = {};

    logs.forEach(log => {
      if (!stats[log.date]) {
        stats[log.date] = 0;
      }
      stats[log.date]++;
    });

    res.json(stats);

  } catch (err) {
    console.log("❌ Stats Error:", err);
    res.status(500).json({ message: "Error fetching stats" });
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


const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// ✅ THIS ROUTE IS MISSING / WRONG
app.post("/api/create-order", async (req, res) => {
  try {

    const { amount } = req.body;

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR"
    });

    res.json(order);

  } catch (err) {
    console.log("RAZORPAY ERROR:", err);
    res.status(500).json({ error: "Order failed" });
  }
});