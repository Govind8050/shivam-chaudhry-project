const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");

const app = express();

/* ================= MIDDLEWARE ================= */

app.use(express.json());
app.use(cors());

/* ================= STATIC WEBSITE ================= */

app.use(express.static(path.join(__dirname, "../Public")));

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("MongoDB Atlas Connected");
})
.catch((err)=>{
    console.log("Database Error:", err);
});

/* ================= API ROUTES ================= */

app.use("/api/auth", authRoutes);

/* ================= HOME ROUTE ================= */

app.get("/", (req,res)=>{
    res.sendFile(path.join(__dirname,"../Public/index.html"));
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=>{
    console.log(`Server Running on ${PORT}`);
});