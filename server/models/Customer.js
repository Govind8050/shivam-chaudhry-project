const mongoose = require("mongoose")

const customerSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

email:{
type:String,
required:true
},

mobile:{
type:String,
required:true
},

address:String,

district:String,

state:String,

pincode:String,

password:{
type:String,
required:true
},
 profileImage: {
        type: String,
        default: ""
    }

})

module.exports = mongoose.model("Customer",customerSchema)