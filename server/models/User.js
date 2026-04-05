// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//   ownerId: String,
//   date: String,
//   loginTime: {
//     type: Date,
//     default: Date.now
//   },
//    profileImage: {
//         type: String,
//         default: ""
//     }
// });

// module.exports = mongoose.model("User", userSchema);

// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
  
//   ownerId: String,

//   date: {
//     type: String,
//     default: () => new Date().toLocaleDateString("en-IN")
//   },

//   loginTime: {
//     type: String,
//     default: () => {
//       return new Date().toLocaleString("en-IN", {
//         timeZone: "Asia/Kolkata"
//       });
//     }
//   },

//   profileImage: {
//     type: String,
//     default: ""
//   }

// }, { timestamps: true });

// module.exports = mongoose.model("User", userSchema);



const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  
  ownerId: String,

  date: {
    type: String,
    default: () => new Date().toLocaleDateString("en-IN")
  },

  loginTime: {
    type: String,
    default: () => {
      return new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata"
      });
    }
  },

  profileImage: {
    type: String,
    default: ""
  }

}, { timestamps: true });

// ✅ IMPORTANT FIX
module.exports = mongoose.models.User || mongoose.model("User", userSchema);