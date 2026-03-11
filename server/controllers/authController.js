const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Customer = require("../models/Customer")

/* ================= SIGNUP ================= */

exports.signup = async (req,res)=>{

try{

const {name,email,username,password} = req.body;

/* CHECK USER EXIST */

const existingUser = await User.findOne({
$or:[{email},{username}]
});

if(existingUser){
return res.json({
success:false,
message:"Email or Username already exists"
});
}

/* HASH PASSWORD */

const hashedPassword = await bcrypt.hash(password,10);

/* CREATE USER */

const newUser = new User({
name,
email,
username,
password:hashedPassword
});

await newUser.save();

console.log("NEW USER REGISTERED:",username);

res.json({
success:true,
message:"Account created successfully"
});

}catch(err){

console.log(err);

res.json({
success:false,
message:"Signup failed"
});

}

}


/* ================= LOGIN ================= */

exports.login = async (req,res)=>{

try{

const {username,password} = req.body;

const user = await User.findOne({username});

if(!user){

return res.json({
success:false,
message:"User not found"
});

}

const validPass = await bcrypt.compare(password,user.password);

if(!validPass){

return res.json({
success:false,
message:"Wrong password"
});

}

res.json({
success:true,
message:"Login successful",
user:{
name:user.name,
email:user.email,
username:user.username
}
});

}catch(err){

console.log(err);

res.json({
success:false,
message:"Login failed"
});

}

}


// CUSTOMER REGISTER

exports.registerCustomer = async (req,res)=>{

try{

const {name,email,mobile,address,district,state,pincode,password}=req.body

const customer = new Customer({
name,
email,
mobile,
address,
district,
state,
pincode,
password
})

await customer.save()

res.json({
success:true,
message:"Customer Account Created"
})

}catch(err){

res.json({
success:false,
message:"Error creating account"
})

}

}


// CUSTOMER LOGIN

exports.loginCustomer = async (req,res)=>{

try{

const {email,password}=req.body

const customer = await Customer.findOne({email})

if(!customer){

return res.json({
success:false,
message:"Customer not found"
})

}

if(customer.password !== password){

return res.json({
success:false,
message:"Wrong password"
})

}

res.json({
success:true,
customer
})

}catch(err){

res.json({
success:false,
message:"Login error"
})

}

}