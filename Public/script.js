document.addEventListener("DOMContentLoaded", () => {

    initThreeCanvas();
    initVideoControls();

});


/* ================= THREE JS CANVAS ================= */

function initThreeCanvas(){

    const container = document.getElementById("canvas-container");
    if(!container || typeof THREE === "undefined") return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        85,
        container.clientWidth/container.clientHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true});

    renderer.setSize(container.clientWidth,container.clientHeight);
    renderer.setClearColor(0x000000,0);

    container.appendChild(renderer.domElement);

    const geometry = new THREE.TorusKnotGeometry(8,2.5,120,16);
    const material = new THREE.MeshBasicMaterial({
        color:0x00d9ff,
        wireframe:true
    });

    const knot = new THREE.Mesh(geometry,material);
    scene.add(knot);

    camera.position.z = 19;

    function animate(){
        requestAnimationFrame(animate);
        knot.rotation.x += 0.005;
        knot.rotation.y += 0.01;
        renderer.render(scene,camera);
    }

    animate();

    window.addEventListener("resize",()=>{
        const w = container.clientWidth;
        const h = container.clientHeight;

        renderer.setSize(w,h);
        camera.aspect = w/h;
        camera.updateProjectionMatrix();
    });

}


/* ================= VIDEO MUTE ================= */

function initVideoControls(){

    document.querySelectorAll(".videoBox").forEach(box=>{

        const video = box.querySelector(".machineVideo");
        const btn = box.querySelector(".muteBtn");

        btn.addEventListener("click",()=>{
            video.muted=!video.muted;
            btn.textContent = video.muted ? "🔇":"🔊";
        });

    });

}


/* ================= PRODUCT DETAILS ================= */

function showDetail(id){

    document.querySelectorAll(".details-box")
    .forEach(box=>box.style.display="none");

    const target=document.getElementById(id+"-detail");

    if(target) target.style.display="block";

}


/* ================= NAVBAR SWITCH ================= */

function showSection(sectionId){

    const sections={
        home:"home-wrapper",
        about:"about-page",
        address:"address",
        order:"order"
    };

    Object.values(sections).forEach(id=>{
        const el=document.getElementById(id);
        if(el) el.style.display="none";
    });

    const target=document.getElementById(sections[sectionId]);
    if(target) target.style.display="block";

    // ✅ ONLY LOAD ORDER WHEN CLICKED
    if(sectionId === "order"){
        zxInitOrderSection();
    }

    window.scrollTo({top:0,behavior:"smooth"});
}
/* ================= LOGIN / SIGNUP ================= */

function openLogin(){
    toggleOverlay("login-overlay",true);
}

function closeLogin(){
    toggleOverlay("login-overlay",false);
}

function openSignup(){
    toggleOverlay("login-overlay",false);
    toggleOverlay("signup-overlay",true);
}

function closeSignup(){
    toggleOverlay("signup-overlay",false);
}

function backToLogin(){
    toggleOverlay("signup-overlay",false);
    toggleOverlay("login-overlay",true);
}

function toggleOverlay(id,state){

    const el=document.getElementById(id);
    if(!el) return;

    el.style.display= state ? "flex":"none";
    document.body.style.overflow= state ? "hidden":"auto";

}


/* ================= CHATBOT ================= */
let orderStep = 0;

let userOrderData = {
    name: "",
    phone: "",
    address: ""
};

function toggleChatbot(){

    const box=document.getElementById("chatbotBox");

    box.style.display =
        box.style.display==="flex" ? "none":"flex";

}

function sendMessage(){

    const input=document.getElementById("userInput");
    const message=input.value.trim();

    if(!message) return;

    addMessage(message,"user-message");

    input.value="";

    if(orderStep === 1){

        userOrderData.name = message;
        orderStep = 2;

        setTimeout(()=>{
            addMessage("Please enter your Mobile Number","bot-message");
        },500);

        return;
    }

    if(orderStep === 2){

        userOrderData.phone = message;
        orderStep = 3;

        setTimeout(()=>{
            addMessage("Please enter your Address","bot-message");
        },500);

        return;
    }

    if(orderStep === 3){

        userOrderData.address = message;

        setTimeout(()=>{
            addMessage("Thank you for contacting Anastik Manufacturing. Our team will connect with you shortly.","bot-message");
        },500);

        orderStep = 0;

        sendEmail(userOrderData);

        return;
    }

    botReply(message);

}

function quickReply(message){

    addMessage(message,"user-message");

    if(message === "Bulk Order"){
        orderStep = 1;

        setTimeout(()=>{
            addMessage("Please enter your Name","bot-message");
        },500);

        return;
    }

    botReply(message);

}

function addMessage(text,className){

    const chatBody=document.getElementById("chatBody");

    const div=document.createElement("div");
    div.className=className;
    div.innerText=text;

    chatBody.appendChild(div);
    chatBody.scrollTop=chatBody.scrollHeight;

}

function botReply(message){

    const responses={
        plate:"We provide 6 inch to 12 inch paper plates.",
        glass:"Our paper glasses range from 100ml to 300ml.",
        juna:"Juna scrubbers are available in bulk packing.",
        "Paper Plates":"We provide 6 inch to 12 inch biodegradable paper plates.",
        "Paper Glasses":"Our paper glasses range from 100ml to 300ml and are leak-proof.",
        "Juna Scrubber":"Our Juna scrubbers are rust-proof and available in bulk packing.",
        "Bulk Order":"For bulk orders please contact us at +91 9XXXXXXXXX."
    };

    let reply="Thank you for contacting Anastik Manufacturing Pvt Ltd.";

    for(const key in responses){

        if(message.toLowerCase().includes(key.toLowerCase())){

            reply=responses[key];
            break;

        }

    }

    setTimeout(()=>{

        addMessage(reply,"bot-message");

    },500);

}

function sendEmail(data){

fetch("/send-order",{

    method:"POST",

    headers:{
        "Content-Type":"application/json"
    },

    body:JSON.stringify(data)

});

}

/* ================= SIGNUP ================= */
async function createAccount(){

const fullName = document.getElementById("signupName").value;
const email = document.getElementById("signupEmail").value;
const username = document.getElementById("signupUsername").value;
const password = document.getElementById("signupPassword").value;
const confirmPassword = document.getElementById("signupConfirmPassword").value;

if(password !== confirmPassword){
alert("Password not match");
return;
}

const res = await fetch("/api/auth/signup",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
name:fullName,
email,
username,
password
})
});

const data = await res.json();

if(data.success){
alert("Account Created Successfully");
document.getElementById("signup-overlay").style.display="none";
}else{
alert(data.message);
}

}


/* ================= LOGIN ================= */

async function loginUser(){

const username = document.getElementById("loginUsername").value;
const password = document.getElementById("loginPassword").value;

const res = await fetch("/api/auth/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({username,password})
});

const data = await res.json();

if(data.success){

alert("Login Successful");

/* SAVE USER (UPDATED) */
localStorage.setItem("user",JSON.stringify({
name: data.user.name,
email: data.user.email,
MobileNumber: data.user.username,
UserName: data.user.mobile,     // ✅ added
address: data.user.address    // ✅ added
}));

/* NAVBAR UPDATE */
updateNavbar();

/* CLOSE LOGIN */
document.getElementById("login-overlay").style.display="none";

}else{
alert(data.message);
}

}

/* ================= PROFILE ================= */

function showProfile(user){

    const profileHTML=`

    <div class="profile-box">

        <h2>Welcome ${user.name}</h2>

        <img src="default-profile.png">

        <p>Email : ${user.email}</p>

        <p>Username : ${user.username}</p>

    </div>

    `;

    document.body.insertAdjacentHTML("beforeend",profileHTML);

}


function updateNavbar(){

const user = JSON.parse(localStorage.getItem("user"));

if(user){

document.getElementById("loginBtn").style.display="none";

document.getElementById("profileArea").style.display="inline-block";

/* SAFE DATA SHOW */
document.getElementById("pName").innerText = user.name || "";
document.getElementById("pEmail").innerText = user.email || "";
document.getElementById("pUsername").innerText = user.username || "";
document.getElementById("pAddress").innerText = user.address || "";

}

}

function toggleProfile(){

document.getElementById("profilePanel").classList.add("active");

document.getElementById("profileOverlay").classList.add("active");

}

function logoutUser(){

localStorage.removeItem("user");

location.reload();

}

function closeProfile(){

document.getElementById("profilePanel").classList.remove("active");

document.getElementById("profileOverlay").classList.remove("active");

}

window.onload = function(){
updateNavbar();
}
// Customer Login Form
function openCustomerLogin(){
    document.getElementById("customerLoginForm").style.display="flex";
}
function closeCustomerLogin(){

    document.getElementById("customerLoginForm").style.display="none";

    document.body.style.overflow = "auto";
}
function openCustomerLogin(){

    document.getElementById("customerLoginForm").style.display="flex";

    document.body.style.overflow = "hidden";
}
// Customer Login Form End


/* ================= CREATE ACCOUNT FORM ================= */

function openCustomerForm(){

document.getElementById("customerLoginForm").style.display="flex"
document.body.style.overflow="hidden"

}

function closeCustomerForm(){

document.getElementById("customerLoginForm").style.display="none"
document.body.style.overflow="auto"

}

/* ================= LOGIN POPUP ================= */

function openLoginPopup(){

document.getElementById("customerLoginPopup").classList.add("active")

}

function closeLoginPopup(){

document.getElementById("customerLoginPopup").classList.remove("active")

}


/* ================= CREATE ACCOUNT ================= */

async function createCustomerAccount(){

const inputs = document.querySelectorAll(".customer-form input")

const name = inputs[0].value
const email = inputs[1].value
const mobile = inputs[2].value
const address = inputs[3].value
const district = inputs[4].value
const state = inputs[5].value
const pincode = inputs[6].value
const password = inputs[7].value

const res = await fetch("/api/auth/customer-register",{

method:"POST",
headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
name,email,mobile,address,district,state,pincode,password
})

})

const data = await res.json()

alert(data.message)

}


/* ================= CUSTOMER LOGIN ================= */

async function customerLogin(){

const email = document.getElementById("customerEmail").value
const password = document.getElementById("customerPassword").value

const res = await fetch("/api/auth/customer-login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,password
})
})

const data = await res.json()

if(data.success){

alert("Customer Login Successful")

/* ✅ CORRECT SAVE */
localStorage.setItem("user",JSON.stringify({
name: data.customer.name,
email: data.customer.email,
username: data.customer.mobile,   // mobile = username (as per your logic
mobile:data.customer.mobile,
address: data.customer.address
}))

updateNavbar()
toggleProfile()

closeLoginPopup()
closeCustomerForm()

}else{
alert(data.message)
}

}

function switchToLogin(){

// Create Account form close
document.getElementById("customerLoginForm").style.display="none";

// Login popup open
document.getElementById("customerLoginPopup").classList.add("active");

// body scroll normal
document.body.style.overflow="auto";

}

function closeLoginPopup(){

document.getElementById("customerLoginPopup").classList.remove("active")

}

async function customerLogin(){

const email = document.getElementById("customerEmail").value
const password = document.getElementById("customerPassword").value

const res = await fetch("/api/auth/customer-login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
email,password
})
})

const data = await res.json()

if(data.success){

alert("Customer Login Successful")

/* ✅ FINAL CORRECT SAVE */
localStorage.setItem("user",JSON.stringify({
name: data.customer.name,
email: data.customer.email,
username: data.customer.mobile,   // mobile = username
mobile: data.customer.mobile,
address: data.customer.address    // ✅ THIS IS THE MAIN FIX
}))

updateNavbar()
toggleProfile()

closeLoginPopup()
closeCustomerForm()

}else{
alert(data.message)
}

}
document.addEventListener("DOMContentLoaded", () => {


    document.getElementById("userInput").addEventListener("keypress", function(event){

        if(event.key === "Enter"){
            event.preventDefault();
            sendMessage();
        }

    });

});




// Employee Login Start
/* ================= CONFIG ================= */
const OWNER_ID = "2313020292";
const OWNER_PASSWORD = "8050";
const OWNER_EMAIL = "gm085913@gmail.com";

let generatedOTP = null;

/* ================= OPEN / CLOSE ================= */

/* Open only when clicked */
function openOwnerLogin() {
  document.getElementById("ownerLoginOverlayX").style.display = "flex";
}

/* Close both popups */
function closeOwnerLogin() {
  document.getElementById("ownerLoginOverlayX").style.display = "none";
  document.getElementById("forgotOverlayX").style.display = "none";
}

/* Forgot Password Open */
function openForgotX() {
  document.getElementById("ownerLoginOverlayX").style.display = "none";
  document.getElementById("forgotOverlayX").style.display = "flex";

  /* MASK EMAIL */
  let email = OWNER_EMAIL;
  let masked = email.slice(0, 4) + "****" + email.slice(email.indexOf("@"));
  document.getElementById("maskedEmailX").innerText = "Email: " + masked;
}

/* Close Forgot */
function closeForgotX() {
  document.getElementById("forgotOverlayX").style.display = "none";
}

/* ================= LOGIN ================= */

async function ownerLogin() {

const id = document.getElementById("ownerIdX").value;
const pass = document.getElementById("ownerPassX").value;
const profileImg = document.querySelector(".profile-big")?.src || "";

const res = await fetch("/api/auth/owner-login", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ 
    id, 
    password: pass,
    profileImage: profileImg   // ✅ ADD THIS
})
});

async function saveImageToDB(image){

    const user = JSON.parse(localStorage.getItem("user"));

    if(!user) return;

    await fetch("/api/auth/save-profile-image",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            userId: user._id,   // ⚠️ ensure backend sends _id
            image
        })
    });

}

const data = await res.json();

if (data.success) {

alert("Login Success");

// ✅ OWNER FLAG
localStorage.setItem("owner", "true");

// ✅ SAVE USER (PROFILE KE LIYE)
localStorage.setItem("user", JSON.stringify({
name: "Shivam Chaudhry",
email: "Anastik@gmail.com",
username: id,
mobile: id,
address: "Kanthudih Hanuman, Mandir."
}));

// ✅ NAVBAR UPDATE
updateNavbar();

// ✅ AUTO OPEN PROFILE
toggleProfile();

// ✅ CLOSE LOGIN
closeOwnerLogin();

} else {
alert(data.message);
}

}

/* ================= OTP ================= */
async function generateOTP() {

  const res = await fetch("http://localhost:5000/api/auth/send-otp", {
    method: "POST"
  });

  const data = await res.json();

  if (data.success) {
    generatedOTP = data.otp;
    alert("OTP sent to your email");
  } else {
    alert("Failed to send OTP");
  }
}

function verifyOTP() {

const userOTP = document.getElementById("otpInputX").value;

if (userOTP == generatedOTP) {

alert("OTP Verified - Login Success");

// ✅ COUNT
let count = localStorage.getItem("ownerLoginCount") || 0;
count++;
localStorage.setItem("ownerLoginCount", count);

// ✅ OWNER LOGIN
localStorage.setItem("owner", "true");

// ✅ SAVE USER
localStorage.setItem("user", JSON.stringify({
name: "Owner",
email: "Anastik@gmail.com",
OwnerId: "Owner",
}));

// ✅ NAVBAR UPDATE
updateNavbar();

// ✅ AUTO PROFILE OPEN
toggleProfile();

// ✅ CLOSE
closeOwnerLogin();

} else {
alert("Invalid OTP");
}

}
/* ================= IMPORTANT FIX ================= */

/* Page load par popup hide rahe */
window.onload = function () {
  document.getElementById("ownerLoginOverlayX").style.display = "none";
  document.getElementById("forgotOverlayX").style.display = "none";
};
window.addEventListener("load", function(){

updateNavbar();

// OWNER POPUP HIDE
const owner = document.getElementById("ownerLoginOverlayX");
const forgot = document.getElementById("forgotOverlayX");

if(owner) owner.style.display = "none";
if(forgot) forgot.style.display = "none";

});


// All Order Section
let zxHistory = [];
let zxCart = [];
let zxCurrentProductId = null;
/* ================= INIT ONLY WHEN ORDER CLICK ================= */
function zxInitOrderSection(){
    const list = document.getElementById("zxProductList");
    if(!list) return;

    if(list.innerHTML.trim() !== "") return;

    zxLoadProducts();
    zxUpdateCartCount(); // ✅ important

    ["zxDetailView","zxCartView","zxCheckoutView"].forEach(id=>{
        const el = document.getElementById(id);
        if(el) el.style.display = "none";
    });
}


/* ================= LOAD PRODUCTS ================= */
function zxLoadProducts() {
    const list = document.getElementById("zxProductList");
    if (!list) return;

    list.innerHTML = "";

    zxProducts.forEach(p => {
        list.innerHTML += `
        <div class="zxCard" onclick="zxShowDetail(${p.id})">
            <img src="${p.img}">
            <h3>${p.name}</h3>
            <p>₹${p.price}</p>
        </div>`;
    });
}

/* ================= SHOW DETAIL ================= */
function zxShowDetail(id) {

    zxHistory.push("products");
    zxCurrentProductId = id; 

    const p = zxProducts.find(item => item.id === id);

    const list = document.getElementById("zxProductList");
    const box = document.getElementById("zxDetailView");

    list.style.display = "none";
    box.style.display = "block";

    box.innerHTML = `
<div class="zxDetailContainer">

    <!-- LEFT -->
    <div class="zxLeft">
        <img src="${p.img}" class="zxMainImg">
    </div>

    <!-- RIGHT -->
    <div class="zxRight">

        <h2 class="zxProductTitle">${p.name}</h2>
        <p class="zxDesc">${p.desc}</p>

        <div class="zxPriceBox">
            <span class="zxDiscount">82% OFF</span>
            <span class="zxOldPrice">₹${p.price + 800}</span>
            <span class="zxPrice">₹${p.price}</span>
        </div>

        <input type="number" id="zxQty" class="zxInput" value="1" min="1">

        <div class="zxBtnGroup">
            <button class="zxBtn" onclick="zxAddToCart(${p.id})">Add to Cart</button>
           <button class="zxBtn buyBtn" onclick="zxBuyNow(${p.id})">Buy Now</button>
            <button class="zxBtn backBtn" onclick="zxGoBack()">⬅ Back</button>
        </div>

        <!-- DELIVERY BOX -->
        <div class="zxDeliveryBox">
            <h3>📦 Delivery Details</h3>

            <div class="zxAddress">
                <input type="text" id="zxAddressInput" placeholder="Enter your address" class="zxInput">
                <button class="zxBtn smallBtn" onclick="zxGetLocation()">📍 Use My Location</button>
            </div>

            <p id="zxLiveAddress">No location selected</p>

            <div class="zxDeliveryInfo">
                <div>🚚 Delivery in 3-5 Days</div>
                <div>💰 Cash on Delivery Available</div>
                <div>🔁 7-Day Easy Return</div>
                <div>✔ Verified Seller</div>
            </div>
        </div>

    </div>
</div>

<!-- HIGHLIGHTS -->
<div class="zxHighlights">
    <h3>Product Highlights</h3>

    <div class="zxHighlightGrid">
        <div><span>Material</span><b>Stainless Steel</b></div>
        <div><span>Type</span><b>Eco Friendly</b></div>
        <div><span>Reusable</span><b>Yes</b></div>
        <div><span>Dishwasher Safe</span><b>Yes</b></div>
        <div><span>Warranty</span><b>6 Months</b></div>
        <div><span>Brand</span><b>JS Tech</b></div>
    </div>
</div>
<!-- SUGGESTIONS -->
<div class="zxSuggest">
    <h3>Similar Products</h3>

    <div class="zxGrid">
        ${
            zxProducts
            .filter(item => item.id !== p.id)
            .map(item => `
                <div class="zxCard" onclick="zxShowDetail(${item.id})">
                    <img src="${item.img}">
                    <h3>${item.name}</h3>
                    <p>₹${item.price}</p>
                </div>
            `).join("")
        }
    </div>
</div>
`;
}
let total = 0;

zxCart.forEach(item => {
    total += item.price * item.qty;
});

let html = `<h3>Total: ₹${total}</h3>`;

function zxUpdateCartCount(){
    const count = document.getElementById("zxCartCount");

    let totalQty = 0;
    zxCart.forEach(item => totalQty += item.qty);

    if(count){
        count.innerText = totalQty;
    }
}

function zxBuyNow(id){

    const product = zxProducts.find(p => p.id === id);
    const qty = parseInt(document.getElementById("zxQty").value) || 1;

    zxCart = [{ ...product, qty }];

    zxUpdateCartCount();

    zxHistory.push("detail"); // ✅ correct

    window.scrollTo({ top: 0, behavior: "smooth" });

    zxCheckout();
}


function zxGetLocation(){

    const output = document.getElementById("zxLiveAddress");

    if(!navigator.geolocation){
        output.innerText = "Location not supported";
        return;
    }

    navigator.geolocation.getCurrentPosition(async position => {

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        // Reverse Geocoding API (OpenStreetMap)
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();

        const address = data.display_name;

        document.getElementById("zxAddressInput").value = address;
        output.innerText = "📍 " + address;

    }, () => {
        output.innerText = "Location permission denied";
    });
}


/* ================= BACK ================= */
function zxBackToProducts() {

    const list = document.getElementById("zxProductList");
    const detail = document.getElementById("zxDetailView");
    const cart = document.getElementById("zxCartView");
    const checkout = document.getElementById("zxCheckoutView");

    // ✅ Sab hide karo
    if (detail) {
        detail.style.display = "none";
        detail.innerHTML = "";
    }

    if (cart) {
        cart.style.display = "none";
        cart.innerHTML = "";
    }

    if (checkout) {
        checkout.style.display = "none";
        checkout.innerHTML = "";
    }

    // ✅ Sirf product list show
    if (list) list.style.display = "grid";
}


/* ================= ADD TO CART ================= */
function zxAddToCart(id){

    const qty = parseInt(document.getElementById("zxQty").value) || 1;
    const product = zxProducts.find(p => p.id === id);

    const existing = zxCart.find(item => item.id === id);

    if(existing){
        existing.qty += qty;
    } else {
        zxCart.push({ ...product, qty });
    }

    zxUpdateCartCount();
    zxShowToast("✅ Added to cart successfully!");

    // ❌ yahan zxCheckout() call nahi hona chahiye
}

function zxShowToast(msg){

    let toast = document.createElement("div");
    toast.innerText = msg;
    toast.className = "zxToast";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}
/* ================= SHOW CART ================= */
function zxShowCart() {

    const detail = document.getElementById("zxDetailView");
    const cartBox = document.getElementById("zxCartView");

    zxHistory.push("detail");

    if (detail) detail.style.display = "none";
    cartBox.style.display = "block";

    let html = "<h2>Your Cart</h2>";

    let total = 0;

    zxCart.forEach(item => {
        total += item.price * item.qty;

        html += `
            <p>
                ${item.name} × ${item.qty}
                <span>₹${item.price * item.qty}</span>
            </p>
        `;
    });

    html += `<h3>Total: ₹${total}</h3>`;

    html += `
        <button class="zxBtn" onclick="zxCheckout()">Proceed to Checkout</button>
        <button class="zxBtn backBtn" onclick="zxGoBack()">⬅ Back</button>
    `;

    cartBox.innerHTML = html;
}

/* ================= CHECKOUT ================= */
function zxCheckout() {

    if(zxCart.length === 0){
        zxShowToast("⚠️ Cart is empty!");
        return;
    }

    zxHistory.push("cart");

    const list = document.getElementById("zxProductList");
    const detail = document.getElementById("zxDetailView");
    const cart = document.getElementById("zxCartView");
    const chk = document.getElementById("zxCheckoutView");

    // 🔥 sab hide (IMPORTANT)
    list.style.display = "none";
    detail.style.display = "none";
    cart.style.display = "none";

    chk.style.display = "block";

    // 🔥 scroll top
    window.scrollTo({ top: 0, behavior: "smooth" });

    let total = 0;
    zxCart.forEach(item => total += item.price * item.qty);

    chk.innerHTML = `
        <h2>Checkout</h2>

        <h3>Total Amount: ₹${total}</h3>

        <input class="zxInput" placeholder="Full Name">
        <input class="zxInput" placeholder="Address">
        <input class="zxInput" placeholder="Phone">

        <h3>Payment Method</h3>

        <select class="zxInput" id="paymentMethod" onchange="togglePayButton()">
            <option value="cod">Cash on Delivery</option>
            <option value="online">Net Banking</option>
        </select>

        <button class="zxBtn buyBtn" id="placeOrderBtn" onclick="zxPlaceOrder()">Place Order</button>
        <button class="zxBtn buyBtn" id="payNowBtn" style="display:none;" onclick="payNow()">💳 Pay Now</button>
        <button class="zxBtn backBtn" onclick="zxGoBack()">⬅ Back</button>
    `;
}
function togglePayButton(){
    const method = document.getElementById("paymentMethod").value;

    const placeBtn = document.getElementById("placeOrderBtn");
    const payBtn = document.getElementById("payNowBtn");

    if(method === "online"){
        placeBtn.style.display = "none";
        payBtn.style.display = "block";
    }else{
        placeBtn.style.display = "block";
        payBtn.style.display = "none";
    }
}
function zxGoBack(){

    const last = zxHistory.pop();

    const list = document.getElementById("zxProductList");
    const detail = document.getElementById("zxDetailView");
    const cart = document.getElementById("zxCartView");
    const checkout = document.getElementById("zxCheckoutView");

    // sab hide
    list.style.display = "none";
    detail.style.display = "none";
    cart.style.display = "none";
    checkout.style.display = "none";

    if(!last){
        list.style.display = "grid";
        return;
    }

    if(last === "products"){
        list.style.display = "grid";
    }
    else if(last === "detail"){
        zxShowDetail(zxCurrentProductId); // 🔥 RELOAD DETAIL
    }
    else if(last === "cart"){
        zxShowCart(); // 🔥 RELOAD CART
    }
}

/* ================= PLACE ORDER ================= */
function zxPlaceOrder() {
    alert("🎉 Order Placed Successfully!");
    zxCart = [];
    location.reload();
}
function showImgOptions(){

    const box = document.getElementById("imgOptions");

    box.style.position = "absolute";
    box.style.zIndex = "999";

    box.style.display = box.style.display === "flex" ? "none" : "flex";
}

document.addEventListener("DOMContentLoaded", function(){

    const profileImg = document.querySelector(".profile-big");
    const profileIcon = document.querySelector(".profile-icon");
    const imgOptions = document.getElementById("imgOptions");

    // 👉 Hidden input (Gallery)
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    /* =========================
       🔥 CLICK → SHOW OPTIONS
    ========================= */
    if(profileImg && imgOptions){
        profileImg.addEventListener("click", function(e){
            e.stopPropagation();
            imgOptions.classList.toggle("active");
        });
    }

    /* =========================
       🔥 CLICK INSIDE OPTIONS
    ========================= */
    if(imgOptions){
        imgOptions.addEventListener("click", function(e){
            e.stopPropagation();
        });
    }

    /* =========================
       🔥 CLICK OUTSIDE → CLOSE
    ========================= */
    document.addEventListener("click", function(){
        if(imgOptions){
            imgOptions.classList.remove("active");
        }
    });

    /* =========================
       📸 CAMERA
    ========================= */
    window.openCamera = async function(){

        try{
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });

            const overlay = document.createElement("div");
            overlay.className = "camera-overlay";

            const video = document.createElement("video");
            video.className = "camera-video";
            video.srcObject = stream;
            video.autoplay = true;

            const captureBtn = document.createElement("button");
            captureBtn.className = "capture-btn";
            captureBtn.innerText = "📸 Capture";

            const closeBtnP = document.createElement("button");
            closeBtnP.className = "close-btn";
            closeBtnP.innerText = "❌ Close";

            const controls = document.createElement("div");
            controls.className = "camera-controls";

            controls.appendChild(captureBtn);
            controls.appendChild(closeBtnP);

            overlay.appendChild(video);
            overlay.appendChild(controls);

            document.body.appendChild(overlay);

            // 📸 Capture
            captureBtn.onclick = function(){

                try{

                    const canvas = document.createElement("canvas");
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(video, 0, 0);

                    const imgData = canvas.toDataURL("image/png");

                    if(profileImg) profileImg.src = imgData;
                    if(profileIcon) profileIcon.src = imgData;

                    const user = JSON.parse(localStorage.getItem("user"));
                    if(user){
                        const userKey = user.mobile || user.username || user.email;
                        localStorage.setItem("profile_" + userKey, imgData);
                    }

                    // ✅ SAFE DB SAVE
                    if(typeof saveImageToDB === "function"){
                        saveImageToDB(imgData);
                    }

                }catch(err){
                    console.log("Capture Error:", err);
                }

                stream.getTracks().forEach(track => track.stop());
                overlay.remove();
            };

            // ❌ Close
            closeBtnP.onclick = function(){
                stream.getTracks().forEach(track => track.stop());
                overlay.remove();
            };

        }catch(err){
            alert("Camera not allowed");
        }
    };

    /* =========================
       🖼️ GALLERY
    ========================= */
    window.openGallery = function(){
        fileInput.click();
    };

    /* =========================
       🔑 USER KEY
    ========================= */
    function getUserKey(){
        const user = JSON.parse(localStorage.getItem("user"));
        if(!user) return null;
        return user.mobile || user.username || user.email;
    }

    /* =========================
       🖼️ SAVE IMAGE
    ========================= */
    fileInput.addEventListener("change", function(e){

        const file = e.target.files[0];

        if(file){
            const reader = new FileReader();

            reader.onload = function(event){

                try{

                    const imgData = event.target.result;

                    if(profileImg) profileImg.src = imgData;
                    if(profileIcon) profileIcon.src = imgData;

                    const userKey = getUserKey();

                    if(userKey){
                        localStorage.setItem("profile_" + userKey, imgData);
                    }

                    // ✅ SAFE DB SAVE
                    if(typeof saveImageToDB === "function"){
                        saveImageToDB(imgData);
                    }

                }catch(err){
                    console.log("Gallery Error:", err);
                }
            };

            reader.readAsDataURL(file);
        }
    });

    /* =========================
       🔄 LOAD IMAGE
    ========================= */
    function loadProfileImage(){

        const userKey = getUserKey();
        const defaultImg = "https://i.imgur.com/6VBx3io.png";

        if(userKey){
            const saved = localStorage.getItem("profile_" + userKey);

            if(saved){
                if(profileImg) profileImg.src = saved;
                if(profileIcon) profileIcon.src = saved;
            }else{
                if(profileImg) profileImg.src = defaultImg;
                if(profileIcon) profileIcon.src = defaultImg;
            }
        }
    }

    // 👉 PAGE LOAD
    loadProfileImage();

});

// razorpay Integration
async function payNow(){

    let total = 0;
    zxCart.forEach(item => total += item.price * item.qty);

    try{

        const res = await fetch("/api/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: total })
        });

        const data = await res.json();

        const options = {
            key: "rzp_test_SZrtnIsjkGoAmE", // ✅ FIXED
            amount: data.amount,
            currency: "INR",
            name: "Anastik payment web",
            description: "Order Payment",
            order_id: data.id,

            handler: function (response) {
                alert("✅ Payment Successful!");
                zxPlaceOrder();
            },

            prefill: {
                name: "Customer",
                email: "test@gmail.com",
                contact: "9999999999"
            },

            theme: {
                color: "#3399cc"
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    }catch(err){
        console.log(err);
        alert("Payment failed");
    }
}