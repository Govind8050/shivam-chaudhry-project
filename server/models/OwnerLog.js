const mongoose = require("mongoose");

const ownerLogSchema = new mongoose.Schema({
  ownerId: String,
  date: String,
  loginTime: {
    type: String,
    default: () => {
      return new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
      });
    }
  }
});

module.exports = mongoose.model("OwnerLog", ownerLogSchema);