const mongoose = require("mongoose");

const ownerLogSchema = new mongoose.Schema({
  ownerId: String,
  date: String,
  loginTime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("OwnerLog", ownerLogSchema);