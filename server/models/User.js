const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  ownerId: String,
  date: String,
  loginTime: {
    type: Date,
    default: Date.now
  },
   profileImage: {
        type: String,
        default: ""
    }
});

module.exports = mongoose.model("User", userSchema);