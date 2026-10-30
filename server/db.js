require("dotenv").config();
const { Sequelize } = require("sequelize");

// Render pe DB_SSL=true set karna hai (Aiven ke liye SSL zaroori hai)
// Local XAMPP me DB_SSL set nahi hoga to SSL band rahega
const useSSL = process.env.DB_SSL === "true";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    timezone: "+05:30",
    dialectOptions: useSSL
      ? {
          ssl: {
            // DB_CA optional hai. Na do to bhi connection chalega
            ca: process.env.DB_CA
              ? process.env.DB_CA.replace(/\\n/g, "\n")
              : undefined,
            rejectUnauthorized: !!process.env.DB_CA
          }
        }
      : {}
  }
);

module.exports = sequelize;