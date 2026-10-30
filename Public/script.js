/* =====================================================
   SCRIPT.JS — Anastik Manufacturing Pvt Ltd
   Har function ke upar comment me likha hai ki wo kis kaam ke liye hai.

   Sections:
   00 Page start        01 Hero 3D           02 Video
   03 Home products     04 Pages switch      05 Chatbot
   06 Login / Register  07 Navbar + Profile  08 Notifications
   09 Order page        10 Profile photo     11 Payment
   12 Sidebar + Orders  13 Admin panel       14 Featured products
   15 Compatibility aliases
   ===================================================== */


/* ================= 00. PAGE START ================= */

// Page load hote hi saare chhote parts ek saath start karta hai
document.addEventListener("DOMContentLoaded", () => {

    initThreeCanvas();
    initVideoControls();
    initChatEnterKey();
    initAuthPopups();
    initProfileImage();
    initFeaturedProducts();
    updateNavbar();
    updateNotificationCount();

});


/* ================= 01. THREE JS CANVAS ================= */

// Hero section ka rotating 3D wireframe knot banata hai
function initThreeCanvas() {

    const container = document.getElementById("canvas-container");
    if (!container || typeof THREE === "undefined") return;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        85,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);

    container.appendChild(renderer.domElement);

    const geometry = new THREE.TorusKnotGeometry(8, 2.5, 120, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0x00d9ff,
        wireframe: true
    });

    const knot = new THREE.Mesh(geometry, material);
    scene.add(knot);

    camera.position.z = 19;

    function animate() {
        requestAnimationFrame(animate);
        knot.rotation.x += 0.005;
        knot.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    animate();

    // Screen size badalne par canvas ko bhi resize karta hai
    window.addEventListener("resize", () => {
        const w = container.clientWidth;
        const h = container.clientHeight;

        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    });

}


/* ================= 02. VIDEO CONTROLS ================= */

// Dono machine videos ka mute / unmute button chalata hai
function initVideoControls() {
    document.querySelectorAll(".videoBox").forEach(box => {
        const video = box.querySelector(".machineVideo");
        const btn = box.querySelector(".muteBtn");

        if (!video || !btn) return;

        video.muted = true;
        btn.textContent = "🔇";

        btn.addEventListener("click", () => {
            video.muted = !video.muted;
            btn.textContent = video.muted ? "🔇" : "🔊";
        });
    });
}


/* ================= 03. HOMEPAGE PRODUCT DETAILS ================= */

// Home page ke 3 product buttons (Plates / Glasses / Juna): click par us product ka detail box dikhata hai
function showDetail(product) {

    const products = ["plate", "glass", "juna"];

    products.forEach(function (item) {

        const detail = document.getElementById(item + "-detail");

        const button = document.querySelector(
            `.product-btn[onclick="showDetail('${item}')"]`
        );

        if (detail) {
            detail.hidden = item !== product;
            detail.style.display = item === product ? "block" : "none";
        }

        if (button) {
            const isActive = item === product;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        }

    });

}


/* ================= 04. PAGES SWITCH ================= */

// Saare pages (Home, About, Address, Order, My Orders, Admin Panel) ek saath chhupata hai
function hideAllPages() {

    const pageIds = [
        "home-wrapper",
        "about-page",
        "address",
        "order",
        "ordersSection",
        "adminPanel"
    ];

    pageIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

}

// Navbar ke Home / About / Order / Address links: sirf wahi page dikhata hai
function showSection(sectionId) {

    const sections = {
        home: "home-wrapper",
        about: "about-page",
        address: "address",
        order: "order"
    };

    hideAllPages();

    const target = document.getElementById(sections[sectionId]);
    if (target) target.style.display = "block";

    // Order page tabhi load hota hai jab user us par click kare
    if (sectionId === "order") {
        zxInitOrderSection();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}


/* ================= 05. CHATBOT ================= */

let orderStep = 0;

let userOrderData = {
    name: "",
    phone: "",
    address: ""
};

// Chat window kholta / band karta hai
function toggleChatbot() {

    const box = document.getElementById("chatbotBox");

    box.style.display =
        box.style.display === "flex" ? "none" : "flex";

}

// Chat input me Enter dabane par message bhej deta hai
function initChatEnterKey() {

    const input = document.getElementById("userInput");
    if (!input) return;

    input.addEventListener("keypress", function (event) {

        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }

    });

}

// User ka message chat me dikhata hai. Bulk order ke steps (naam, phone, address) yahin chalte hain
function sendMessage() {

    const input = document.getElementById("userInput");
    const message = input.value.trim();

    if (!message) return;

    addMessage(message, "user-message");

    input.value = "";

    if (orderStep === 1) {

        userOrderData.name = message;
        orderStep = 2;

        setTimeout(() => {
            addMessage("Please enter your Mobile Number", "bot-message");
        }, 500);

        return;
    }

    if (orderStep === 2) {

        userOrderData.phone = message;
        orderStep = 3;

        setTimeout(() => {
            addMessage("Please enter your Address", "bot-message");
        }, 500);

        return;
    }

    if (orderStep === 3) {

        userOrderData.address = message;

        setTimeout(() => {
            addMessage("Thank you for contacting Anastik Manufacturing. Our team will connect with you shortly.", "bot-message");
        }, 500);

        orderStep = 0;

        sendEmail(userOrderData);

        return;
    }

    botReply(message);

}

// Chat ke quick buttons (Paper Plates, Glasses, Juna, Bulk Order) ka click handle karta hai
function quickReply(message) {

    addMessage(message, "user-message");

    if (message === "Bulk Order") {
        orderStep = 1;

        setTimeout(() => {
            addMessage("Please enter your Name", "bot-message");
        }, 500);

        return;
    }

    botReply(message);

}

// Chat window me ek message bubble jodta hai
function addMessage(text, className) {

    const chatBody = document.getElementById("chatBody");

    const div = document.createElement("div");
    div.className = className;
    div.innerText = text;

    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;

}

// Keyword dekhkar chatbot ka jawab deta hai
function botReply(message) {

    const responses = {
        plate: "We provide 6 inch to 12 inch paper plates.",
        glass: "Our paper glasses range from 100ml to 300ml.",
        juna: "Juna scrubbers are available in bulk packing.",
        "Paper Plates": "We provide 6 inch to 12 inch biodegradable paper plates.",
        "Paper Glasses": "Our paper glasses range from 100ml to 300ml and are leak-proof.",
        "Juna Scrubber": "Our Juna scrubbers are rust-proof and available in bulk packing.",
        "Bulk Order": "For bulk orders please contact us at +91 9XXXXXXXXX."
    };

    let reply = "Thank you for contacting Anastik Manufacturing Pvt Ltd.";

    for (const key in responses) {

        if (message.toLowerCase().includes(key.toLowerCase())) {

            reply = responses[key];
            break;

        }

    }

    setTimeout(() => {

        addMessage(reply, "bot-message");

    }, 500);

}

// Bulk order ki detail server ko bhejta hai, jo owner ko email karta hai
function sendEmail(data) {

    fetch("/api/send-order", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(data)

    }).catch(err => console.log("Email request failed:", err));

}


/* ================= 06. LOGIN / REGISTER ================= */

// Login aur Register dono popup band karta hai
function authHideAll() {

    const popup = document.getElementById("customerLoginPopup");
    const form = document.getElementById("customerLoginForm");

    if (popup) popup.classList.remove("active");
    if (form) form.style.display = "none";

    document.body.style.overflow = "auto";

}

// Navbar ka Login button: login popup kholta hai
function authShowLogin() {

    authHideAll();

    document.getElementById("customerLoginPopup").classList.add("active");
    document.body.style.overflow = "hidden";

    const email = document.getElementById("customerEmail");
    if (email) setTimeout(() => email.focus(), 80);

}

// Login popup ke neeche wala Register button: registration form kholta hai
function authShowRegister() {

    authHideAll();

    document.getElementById("customerLoginForm").style.display = "flex";
    document.body.style.overflow = "hidden";

}

// Password ke saath wala 👁 button: password dikhata / chhupata hai
function authTogglePass(inputId, icon) {

    const input = document.getElementById(inputId);
    if (!input) return;

    const show = input.type === "password";

    input.type = show ? "text" : "password";
    icon.textContent = show ? "🙈" : "👁";

}

// Esc dabane par ya popup ke bahar click karne par login popup band karta hai
function initAuthPopups() {

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") authHideAll();
    });

    const popup = document.getElementById("customerLoginPopup");

    if (popup) {
        popup.addEventListener("click", function (e) {
            if (e.target === popup) authHideAll();
        });
    }

}

// Register form ka data server ko bhejkar naya customer account banata hai (customers table me save hota hai)
async function createCustomerAccount() {

    const inputs = document.querySelectorAll(".customer-form input");

    const name = inputs[0].value.trim();
    const email = inputs[1].value.trim();
    const mobile = inputs[2].value.trim();
    const address = inputs[3].value.trim();
    const district = inputs[4].value.trim();
    const state = inputs[5].value.trim();
    const pincode = inputs[6].value.trim();
    const password = inputs[7].value;

    if (!name || !email || !mobile || !address || !district || !state || !pincode || !password) {
        alert("Please fill all the fields");
        return;
    }

    try {

        const res = await fetch("/api/auth/customer-register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name, email, mobile, address, district, state, pincode, password
            })
        });

        const data = await res.json();

        alert(data.message);

        // Account ban gaya to form saaf karke login popup khol deta hai
        if (data.success) {
            inputs.forEach(input => input.value = "");
            authShowLogin();
        }

    } catch (err) {
        console.log("Register error:", err);
        alert("Server error. Please try again.");
    }

}

// EK HI LOGIN: server batata hai ki ye admin hai ya customer.
// Admin (DB ke admins table ka email/password) -> Admin Panel khulta hai.
// Koi aur email/password (customers table) -> normal customer ka page (profile panel) khulta hai.
async function customerLogin() {

    const email = document.getElementById("customerEmail").value.trim();
    const password = document.getElementById("customerPassword").value;

    if (!email || !password) {
        alert("Please enter email and password");
        return;
    }

    try {

        const res = await fetch("/api/auth/customer-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        const account = data.customer;

        // Navbar / profile ke liye user ki detail browser me save hoti hai
        localStorage.setItem("user", JSON.stringify({
            name: account.name,
            email: account.email,
            username: account.mobile,
            mobile: account.mobile,
            address: account.address
        }));

        // Login token (order dene aur My Orders dekhne ke liye server ko bhejna padta hai)
        localStorage.setItem("authToken", data.token);

        const isAdmin = data.role === "admin";

        if (isAdmin) {
            localStorage.setItem("owner", "true");
            localStorage.setItem("adminToken", data.token);
        } else {
            localStorage.removeItem("owner");
            localStorage.removeItem("adminToken");
        }

        // Password field saaf kar do
        document.getElementById("customerPassword").value = "";

        alert(isAdmin ? "Admin Login Successful" : "Customer Login Successful");

        updateNavbar();
        loadProfileImage();
        authHideAll();

        if (isAdmin) {
            openAdminPanel();
        } else {
            toggleProfile();
        }

    } catch (err) {
        console.log("Login error:", err);
        alert("Server error. Please try again.");
    }

}


/* ================= 07. NAVBAR + PROFILE ================= */

// Login hone par navbar badalta hai (profile icon, bell, menu dikhata hai, Login button chhupata hai).
// Logout hone par ulta karta hai. Admin ho to sidebar me "Admin Panel" bhi dikhata hai.
function updateNavbar() {

    const user = JSON.parse(localStorage.getItem("user"));
    const notifIcon = document.getElementById("notificationIcon");
    const menuBtn = document.getElementById("menuBtn");
    const adminMenu = document.getElementById("adminMenuItem");

    const isAdmin = localStorage.getItem("owner") === "true" && !!getAdminToken();

    if (user) {

        document.getElementById("loginBtn").style.display = "none";
        document.getElementById("profileArea").style.display = "inline-block";

        if (notifIcon) notifIcon.style.display = "inline-block";
        if (menuBtn) menuBtn.style.display = "block";
        if (adminMenu) adminMenu.style.display = isAdmin ? "block" : "none";

        document.getElementById("pName").innerText = user.name || "";
        document.getElementById("pEmail").innerText = user.email || "";
        document.getElementById("pUsername").innerText = user.username || "";
        document.getElementById("pAddress").innerText = user.address || "";

    } else {

        document.getElementById("loginBtn").style.display = "inline-block";
        document.getElementById("profileArea").style.display = "none";

        if (notifIcon) notifIcon.style.display = "none";
        if (menuBtn) menuBtn.style.display = "none";
        if (adminMenu) adminMenu.style.display = "none";
    }
}

// Profile panel (right side) kholta hai
function toggleProfile() {

    document.getElementById("profilePanel").classList.add("active");
    document.getElementById("profileOverlay").classList.add("active");

}

// Profile panel band karta hai
function closeProfile() {

    document.getElementById("profilePanel").classList.remove("active");
    document.getElementById("profileOverlay").classList.remove("active");

}

// Logout: saved user, admin flag aur dono token hatakar page reload karta hai
function logoutUser() {

    localStorage.removeItem("user");
    localStorage.removeItem("owner");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("authToken");

    location.reload();

}

// Current user ka login token (customer ya admin dono ka). Order aur My Orders ke liye chahiye
function getAuthToken() {

    return localStorage.getItem("authToken");

}

// Current user ki pehchan (mobile ya email). Profile photo isi key se save hoti hai
function getUserKey() {

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return "guest";
    return user.mobile || user.email;

}


/* ================= 08. NOTIFICATIONS ================= */

// Notification panel kholta / band karta hai
function toggleNotifications() {

    const panel = document.getElementById("notificationPanel");
    panel.classList.toggle("active");
    loadNotifications();

}

// Notification list ko panel me dikhata hai (data Notification.js ke customNotifications se aata hai)
function loadNotifications() {

    const list = document.getElementById("notifList");

    list.innerHTML = "";

    const hasData = typeof customNotifications !== "undefined"
        && customNotifications
        && customNotifications.length > 0;

    if (!hasData) {
        list.innerHTML = "<p>No Notifications</p>";
        return;
    }

    customNotifications.forEach((notif, index) => {

        list.innerHTML += `
        <div class="notif-card" onclick="toggleNotifDetail(${index})">

            <div class="notif-title">
                <b>${notif.title}</b>
                <span>${notif.date}</span>
            </div>

            <div class="notif-detail" id="notif-${index}" style="display:none;">
                <p>${notif.message}</p>
            </div>

        </div>
        `;
    });

}

// Ek notification par click karne par uski detail kholta hai, baaki band karta hai
function toggleNotifDetail(index) {

    const allDetails = document.querySelectorAll(".notif-detail");

    allDetails.forEach(el => {
        if (el.id !== "notif-" + index) {
            el.style.display = "none";
        }
    });

    const target = document.getElementById("notif-" + index);

    if (target) {
        target.style.display =
            target.style.display === "block" ? "none" : "block";
    }

}

// Bell icon ke upar notifications ki ginti dikhata hai
function updateNotificationCount() {

    const countEl = document.getElementById("notifCount");
    if (!countEl) return;

    const hasList = typeof customNotifications !== "undefined" && customNotifications;
    countEl.innerText = hasList ? customNotifications.length : 0;

}


/* ================= 09. ORDER PAGE ================= */

let zxHistory = [];
let zxCart = [];
let zxCurrentProductId = null;

// Order page par pehli baar click hone par hi products load karta hai
function zxInitOrderSection() {

    const list = document.getElementById("zxProductList");
    if (!list) return;

    if (list.innerHTML.trim() !== "") return;

    zxLoadProducts();
    zxUpdateCartCount();

    ["zxDetailView", "zxCartView", "zxCheckoutView"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });
}

// Saare products ke cards (image, naam, price) order page par dikhata hai
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

// Ek product ka poora detail page (price, quantity, Add to Cart, Buy Now, delivery, similar products)
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

// Cart button ke upar total quantity ki ginti update karta hai
function zxUpdateCartCount() {

    const count = document.getElementById("zxCartCount");

    let totalQty = 0;
    zxCart.forEach(item => totalQty += item.qty);

    if (count) {
        count.innerText = totalQty;
    }
}

// "Buy Now": sirf ye ek product cart me rakhkar seedha checkout kholta hai
function zxBuyNow(id) {

    const product = zxProducts.find(p => p.id === id);
    const qty = parseInt(document.getElementById("zxQty").value) || 1;

    zxCart = [{ ...product, qty }];

    zxUpdateCartCount();

    zxHistory.push("detail");

    window.scrollTo({ top: 0, behavior: "smooth" });

    zxCheckout();
}

// "Use My Location": GPS se address nikalkar address box me bhar deta hai
function zxGetLocation() {

    const output = document.getElementById("zxLiveAddress");

    if (!navigator.geolocation) {
        output.innerText = "Location not supported";
        return;
    }

    navigator.geolocation.getCurrentPosition(async position => {

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {

            // Reverse Geocoding API (OpenStreetMap)
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
            const data = await res.json();

            const address = data.display_name;

            document.getElementById("zxAddressInput").value = address;
            output.innerText = "📍 " + address;

        } catch (err) {
            output.innerText = "Could not fetch address";
        }

    }, () => {
        output.innerText = "Location permission denied";
    });
}

// "Add to Cart": product ko cart me jodta hai (pehle se hai to quantity badhata hai)
function zxAddToCart(id) {

    const qty = parseInt(document.getElementById("zxQty").value) || 1;
    const product = zxProducts.find(p => p.id === id);

    const existing = zxCart.find(item => item.id === id);

    if (existing) {
        existing.qty += qty;
    } else {
        zxCart.push({ ...product, qty });
    }

    zxUpdateCartCount();
    zxShowToast("✅ Added to cart successfully!");
}

// Screen ke kone me 2 second ke liye chhota hara message dikhata hai
function zxShowToast(msg) {

    let toast = document.createElement("div");
    toast.innerText = msg;
    toast.className = "zxToast";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// Cart page: sab items aur total dikhata hai
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

// Checkout page: naam, address, phone aur payment method (COD / Net Banking)
function zxCheckout() {

    if (zxCart.length === 0) {
        zxShowToast("⚠️ Cart is empty!");
        return;
    }

    zxHistory.push("cart");

    const list = document.getElementById("zxProductList");
    const detail = document.getElementById("zxDetailView");
    const cart = document.getElementById("zxCartView");
    const chk = document.getElementById("zxCheckoutView");

    list.style.display = "none";
    detail.style.display = "none";
    cart.style.display = "none";

    chk.style.display = "block";

    window.scrollTo({ top: 0, behavior: "smooth" });

    let total = 0;
    zxCart.forEach(item => total += item.price * item.qty);

    chk.innerHTML = `
        <h2>Checkout</h2>

        <h3>Total Amount: ₹${total}</h3>

        <input class="zxInput" id="zxCheckoutName" placeholder="Full Name">
        <input class="zxInput" id="zxCheckoutAddress" placeholder="Address">
        <input class="zxInput" id="zxCheckoutPhone" placeholder="Phone">

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

// Payment method ke hisaab se "Place Order" ya "Pay Now" button dikhata hai
function togglePayButton() {

    const method = document.getElementById("paymentMethod").value;

    const placeBtn = document.getElementById("placeOrderBtn");
    const payBtn = document.getElementById("payNowBtn");

    if (method === "online") {
        placeBtn.style.display = "none";
        payBtn.style.display = "block";
    } else {
        placeBtn.style.display = "block";
        payBtn.style.display = "none";
    }
}

// Order page ka "Back" button: pichhli screen (products / detail / cart) par wapas le jaata hai
function zxGoBack() {

    const last = zxHistory.pop();

    const list = document.getElementById("zxProductList");
    const detail = document.getElementById("zxDetailView");
    const cart = document.getElementById("zxCartView");
    const checkout = document.getElementById("zxCheckoutView");

    list.style.display = "none";
    detail.style.display = "none";
    cart.style.display = "none";
    checkout.style.display = "none";

    if (!last) {
        list.style.display = "grid";
        return;
    }

    if (last === "products") {
        list.style.display = "grid";
    }
    else if (last === "detail") {
        zxShowDetail(zxCurrentProductId);
    }
    else if (last === "cart") {
        zxShowCart();
    }
}

// Order place hone ke baad hara "Order Placed Successfully" popup dikhata hai
function showSuccessPopup() {
    document.getElementById("successPopup").style.display = "flex";
}

// Success popup band karke order page ko shuru wali screen par wapas laata hai
function closeSuccessPopup() {

    document.getElementById("successPopup").style.display = "none";

    zxHistory = [];

    document.getElementById("zxProductList").style.display = "grid";
    document.getElementById("zxDetailView").style.display = "none";
    document.getElementById("zxCartView").style.display = "none";
    document.getElementById("zxCheckoutView").style.display = "none";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Order ko server par bhejta hai (DB ke orders table me save hota hai), phir cart khaali karke success popup dikhata hai.
// Login zaroori hai. Online payment ho to Razorpay ka response (paymentInfo) bhi saath jaata hai.
async function zxPlaceOrder(paymentInfo) {

    const token = getAuthToken();

    if (!token) {
        alert("Please login to place an order");
        authShowLogin();
        return;
    }

    const name = document.getElementById("zxCheckoutName")?.value.trim();
    const address = document.getElementById("zxCheckoutAddress")?.value.trim();
    const phone = document.getElementById("zxCheckoutPhone")?.value.trim();
    const paymentMethod = document.getElementById("paymentMethod")?.value || "cod";

    if (!name || !address || !phone) {
        alert("Please fill name, address and phone");
        return;
    }

    if (zxCart.length === 0) {
        alert("Cart is empty");
        return;
    }

    try {

        const res = await fetch("/api/auth/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({
                items: zxCart,
                name,
                phone,
                address,
                paymentMethod,
                razorpay: paymentMethod === "online" ? paymentInfo : null
            })
        });

        if (res.status === 401) {
            alert("Session expired. Please login again.");
            logoutUser();
            return;
        }

        const data = await res.json();

        if (!data.success) {
            alert(data.message || "Order failed");
            return;
        }

        zxCart = [];
        zxUpdateCartCount();

        showSuccessPopup();
        updateNotificationCount();

    } catch (err) {
        console.log("Order error:", err);
        alert("Server error. Order not placed.");
    }
}


/* ================= 10. PROFILE PHOTO ================= */

// Profile photo (panel aur navbar icon) browser me save ki hui photo se set karta hai, nahi mili to default photo lagata hai
function loadProfileImage() {

    const profileImg = document.querySelector(".profile-big");
    const profileIcon = document.querySelector(".profile-icon");
    const defaultImg = "https://i.imgur.com/6VBx3io.png";

    const saved = localStorage.getItem("profile_" + getUserKey());
    const src = saved || defaultImg;

    if (profileImg) profileImg.src = src;
    if (profileIcon) profileIcon.src = src;

}

// Profile photo badalne ke saare tareeke: photo par click -> Camera / Gallery options, aur unka kaam
function initProfileImage() {

    const profileImg = document.querySelector(".profile-big");
    const profileIcon = document.querySelector(".profile-icon");
    const imgOptions = document.getElementById("imgOptions");

    // Gallery ke liye chhupa hua file input
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    // Photo par click karne par Camera / Gallery options kholta hai
    if (profileImg && imgOptions) {
        profileImg.addEventListener("click", function (e) {
            e.stopPropagation();
            imgOptions.classList.toggle("active");
        });
    }

    // Options ke andar click karne par band nahi hota
    if (imgOptions) {
        imgOptions.addEventListener("click", function (e) {
            e.stopPropagation();
        });
    }

    // Bahar click karne par options band ho jate hain
    document.addEventListener("click", function () {
        if (imgOptions) {
            imgOptions.classList.remove("active");
        }
    });

    // "Open Camera": camera kholkar photo khinchne deta hai
    window.openCamera = async function () {

        try {
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
            closeBtnP.className = "close-btnP";
            closeBtnP.innerText = "❌ Close";

            const controls = document.createElement("div");
            controls.className = "camera-controls";

            controls.appendChild(captureBtn);
            controls.appendChild(closeBtnP);

            overlay.appendChild(video);
            overlay.appendChild(controls);

            document.body.appendChild(overlay);

            captureBtn.onclick = function () {

                try {

                    const canvas = document.createElement("canvas");
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(video, 0, 0);

                    const imgData = canvas.toDataURL("image/png");

                    if (profileImg) profileImg.src = imgData;
                    if (profileIcon) profileIcon.src = imgData;

                    const user = JSON.parse(localStorage.getItem("user"));
                    if (user) {
                        localStorage.setItem("profile_" + getUserKey(), imgData);
                    }

                    // Agar saveImageToDB function bana ho to DB me bhi save karega
                    if (typeof saveImageToDB === "function") {
                        saveImageToDB(imgData);
                    }

                } catch (err) {
                    console.log("Capture Error:", err);
                }

                stream.getTracks().forEach(track => track.stop());
                overlay.remove();
            };

            closeBtnP.onclick = function () {
                stream.getTracks().forEach(track => track.stop());
                overlay.remove();
            };

        } catch (err) {
            alert("Camera not allowed");
        }
    };

    // "Open Gallery": phone / computer se photo chunne deta hai
    window.openGallery = function () {
        fileInput.click();
    };

    // Gallery se photo chunne ke baad usse profile photo bana deta hai
    fileInput.addEventListener("change", function (e) {

        const file = e.target.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (event) {

                try {

                    const imgData = event.target.result;

                    if (profileImg) profileImg.src = imgData;
                    if (profileIcon) profileIcon.src = imgData;

                    localStorage.setItem("profile_" + getUserKey(), imgData);

                    if (typeof saveImageToDB === "function") {
                        saveImageToDB(imgData);
                    }

                } catch (err) {
                    console.log("Gallery Error:", err);
                }
            };

            reader.readAsDataURL(file);
        }
    });

    // Page khulte hi save ki hui photo dikhata hai
    loadProfileImage();

}


/* ================= 11. PAYMENT (RAZORPAY) ================= */

// "Pay Now": pehle login aur checkout details check karta hai, phir server se Razorpay order banwata hai
// aur payment window kholta hai. Payment safal hone par Razorpay ka response server ko bhejkar order save karta hai
// (server signature verify karta hai).
// NOTE: key naya generate karo to yahan "key" bhi badalna (key_id public hoti hai, secret server me hi rehta hai)
async function payNow() {

    if (!getAuthToken()) {
        alert("Please login to place an order");
        authShowLogin();
        return;
    }

    const name = document.getElementById("zxCheckoutName")?.value.trim();
    const address = document.getElementById("zxCheckoutAddress")?.value.trim();
    const phone = document.getElementById("zxCheckoutPhone")?.value.trim();

    if (!name || !address || !phone) {
        alert("Please fill name, address and phone");
        return;
    }

    let total = 0;
    zxCart.forEach(item => total += item.price * item.qty);

    try {

        const res = await fetch("/api/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: total })
        });

        const data = await res.json();

        const options = {
            key: "rzp_test_SZrtnIsjkGoAmE",
            amount: data.amount,
            currency: "INR",
            name: "Anastik payment web",
            description: "Order Payment",
            order_id: data.id,

            handler: function (response) {
                // response me razorpay_order_id, razorpay_payment_id, razorpay_signature hote hain
                zxPlaceOrder(response);
            },

            prefill: {
                name: name,
                email: "",
                contact: phone
            },

            theme: {
                color: "#3399cc"
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();

    } catch (err) {
        console.log(err);
        alert("Payment failed");
    }
}


/* ================= 12. SIDEBAR + MY ORDERS ================= */

// ☰ menu (left sidebar) kholta / band karta hai aur upar naam-email bharta hai
function toggleSidebar() {

    document.getElementById("sidebar").classList.toggle("active");

    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
        document.getElementById("sideName").innerText = user.name;
        document.getElementById("sideEmail").innerText = user.email;
    }
}

// Sidebar ke options: Admin Panel, My Profile, My Orders, Saved Address, Payment Methods
function openSection(type) {

    document.getElementById("sidebar").classList.remove("active");

    if (type === "orders") {
        hideAllPages();
        document.getElementById("ordersSection").style.display = "block";
        loadMyOrders();
        return;
    }

    if (type === "admin") {
        openAdminPanel();
        return;
    }

    // Profile panel me user ka saved address bhi dikhta hai
    if (type === "profile" || type === "address") {
        toggleProfile();
        return;
    }

    if (type === "payment") {
        alert("Payment Methods feature coming soon");
    }
}

// Order ki date ko sahi Date me badalta hai
function getOrderTime(order) {

    const time = new Date(order.createdAt || order.date);
    return isNaN(time.getTime()) ? new Date() : time;

}

// Server se laaye gaye orders yahan rakhe jate hain (order par click karne par detail ke liye)
let myOrdersCache = [];

// "My Orders" list banata hai: logged-in customer ke orders server (orders table) se aate hain
async function loadMyOrders() {

    const box = document.getElementById("myOrdersList");
    const token = getAuthToken();

    if (!token) {
        box.innerHTML = "<p>Please login to see your orders</p>";
        return;
    }

    box.innerHTML = "<p>Loading...</p>";

    try {

        const res = await fetch("/api/auth/my-orders", {
            headers: { Authorization: "Bearer " + token }
        });

        if (res.status === 401) {
            alert("Session expired. Please login again.");
            logoutUser();
            return;
        }

        const data = await res.json();
        myOrdersCache = data.orders || [];

    } catch (err) {
        console.log("My orders error:", err);
        box.innerHTML = "<p>Server error. Please try again.</p>";
        return;
    }

    if (myOrdersCache.length === 0) {
        box.innerHTML = "<p>No Orders Found</p>";
        return;
    }

    const placeholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%23dfe6ee'/></svg>";

    box.innerHTML = myOrdersCache.map((order, index) => {

        const firstItem = order.items[0];
        const img = (firstItem && firstItem.img) || placeholder;

        const deliveryDate = getOrderTime(order);
        deliveryDate.setDate(deliveryDate.getDate() + 5);

        return `
        <div class="order-row" onclick="openOrderDetail(${index})">

            <img src="${escapeHTML(img)}" class="order-img">

            <div class="order-info">
                <h3>Order #${order.id}</h3>
                <p>₹${order.totalAmount} • ${order.items.length} items</p>
                <span class="delivery">Delivery by: ${deliveryDate.toDateString()}</span>
            </div>

            <div class="order-status">📦 ${escapeHTML(order.status)}</div>

        </div>
        `;

    }).join("");
}

// Ek order par click karne par uski items aur tracking (Placed -> Dispatched -> Out -> Delivered) dikhata hai
function openOrderDetail(index) {

    const order = myOrdersCache[index];
    if (!order) return;

    const box = document.getElementById("myOrdersList");

    const itemsHTML = order.items.map(i =>
        `<p>${escapeHTML(i.name)} × ${i.qty} = ₹${i.price * i.qty}</p>`
    ).join("");

    const days = Math.floor((Date.now() - getOrderTime(order)) / (1000 * 60 * 60 * 24));

    let status = "Order Placed";
    let progress = 25;

    if (days >= 1) {
        status = "Dispatched 🚚";
        progress = 50;
    }
    if (days >= 3) {
        status = "Out for Delivery 🚴";
        progress = 75;
    }
    if (days >= 5) {
        status = "Delivered ✅";
        progress = 100;
    }

    box.innerHTML = `
        <h2>📦 Order #${order.id}</h2>

        ${itemsHTML}

        <p><b>Total:</b> ₹${order.totalAmount} (${order.paymentMethod === "online" ? "Paid online" : "Cash on Delivery"})</p>
        <p><b>Address:</b> ${escapeHTML(order.address)}</p>

        <div class="tracker">

            <div class="step ${progress >= 25 ? 'active' : ''}">Placed</div>
            <div class="step ${progress >= 50 ? 'active' : ''}">Dispatched</div>
            <div class="step ${progress >= 75 ? 'active' : ''}">Out</div>
            <div class="step ${progress >= 100 ? 'active' : ''}">Delivered</div>

            <div class="line">
                <div class="line-progress" style="width:${progress}%"></div>
            </div>

        </div>

        <p class="status-text">${status}</p>

        <button id="LastOrder" onclick="loadMyOrders()">⬅ Back</button>
        `;
}

// "My Orders" band karke Home page wapas dikhata hai
function closeOrders() {

    hideAllPages();
    document.getElementById("home-wrapper").style.display = "block";

}


/* ================= 13. ADMIN PANEL ================= */

let adminCustomersCache = [];

// Admin login ke baad mila token (har admin request ke saath server ko bhejna padta hai)
function getAdminToken() {
    return localStorage.getItem("adminToken");
}

// Text ko HTML me safe banata hai, taaki customer ka likha naam/address page ko na tode (XSS se bachav)
function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));

}

// Admin Panel kholta hai (sirf admin ke liye) aur customers + orders ki list DB se mangwata hai
function openAdminPanel() {

    if (localStorage.getItem("owner") !== "true" || !getAdminToken()) {
        alert("Admin login required");
        return;
    }

    hideAllPages();
    document.getElementById("adminPanel").style.display = "block";

    window.scrollTo({ top: 0, behavior: "smooth" });

    loadAdminCustomers();
    loadAdminOrders();

}

// "Back to Website": Admin Panel band karke Home page dikhata hai
function closeAdminPanel() {

    hideAllPages();
    document.getElementById("home-wrapper").style.display = "block";

    window.scrollTo({ top: 0, behavior: "smooth" });

}

// Server se saare registered customers laata hai (admin token ke saath) aur table + stats bharta hai
async function loadAdminCustomers() {

    const empty = document.getElementById("adminEmpty");
    const token = getAdminToken();

    if (!token) {
        alert("Admin session not found. Please login again.");
        logoutUser();
        return;
    }

    empty.style.display = "block";
    empty.innerText = "Loading customers...";

    try {

        const res = await fetch("/api/auth/admin/customers", {
            headers: { Authorization: "Bearer " + token }
        });

        // Token purana ya galat ho to dobara login karwata hai
        if (res.status === 401 || res.status === 403) {
            alert("Admin session expired. Please login again.");
            logoutUser();
            return;
        }

        const data = await res.json();

        if (!data.success) {
            empty.innerText = data.message || "Could not load customers";
            return;
        }

        adminCustomersCache = data.customers || [];

        updateAdminStats();
        filterAdminCustomers();

    } catch (err) {
        console.log("Admin load error:", err);
        empty.innerText = "Server error. Please try again.";
    }

}

// Admin Panel ke upar ke 3 cards: total customers, kitne states, sabse naya customer
function updateAdminStats() {

    const total = adminCustomersCache.length;

    const states = new Set(
        adminCustomersCache
            .map(c => String(c.state || "").trim().toLowerCase())
            .filter(Boolean)
    );

    const latest = adminCustomersCache[0];

    document.getElementById("adminTotalCustomers").innerText = total;
    document.getElementById("adminTotalStates").innerText = states.size;
    document.getElementById("adminLatestCustomer").innerText = latest ? latest.name : "-";

}

// Search box me jo likha ho uske hisaab se customers ki list chhanta hai (naam, email, mobile, district, state, pin)
function filterAdminCustomers() {

    const search = document.getElementById("adminSearch");
    const q = search ? search.value.trim().toLowerCase() : "";

    const filtered = !q
        ? adminCustomersCache
        : adminCustomersCache.filter(c =>
            [c.name, c.email, c.mobile, c.district, c.state, c.pincode]
                .some(v => String(v || "").toLowerCase().includes(q))
        );

    renderAdminCustomers(filtered);

}

// Customers ki table banata hai (har row me ID, naam, email, mobile, address, district, state, pin)
function renderAdminCustomers(list) {

    const body = document.getElementById("adminCustomerRows");
    const empty = document.getElementById("adminEmpty");
    const count = document.getElementById("adminCount");

    if (count) {
        count.innerText = `Showing ${list.length} of ${adminCustomersCache.length}`;
    }

    if (!list.length) {
        body.innerHTML = "";
        empty.style.display = "block";
        empty.innerText = "No customers found.";
        return;
    }

    empty.style.display = "none";

    body.innerHTML = list.map(c => `
        <tr>
            <td>${escapeHTML(c.id)}</td>
            <td>${escapeHTML(c.name)}</td>
            <td>${escapeHTML(c.email)}</td>
            <td>${escapeHTML(c.mobile)}</td>
            <td>${escapeHTML(c.address)}</td>
            <td>${escapeHTML(c.district)}</td>
            <td>${escapeHTML(c.state)}</td>
            <td>${escapeHTML(c.pincode)}</td>
        </tr>
    `).join("");

}

// Server se saare orders laata hai (admin token ke saath) aur Admin Panel ki Orders table bharta hai
async function loadAdminOrders() {

    const body = document.getElementById("adminOrderRows");
    const token = getAdminToken();

    if (!body || !token) return;

    body.innerHTML = `<tr><td colspan="8">Loading orders...</td></tr>`;

    try {

        const res = await fetch("/api/auth/admin/orders", {
            headers: { Authorization: "Bearer " + token }
        });

        if (res.status === 401 || res.status === 403) {
            alert("Admin session expired. Please login again.");
            logoutUser();
            return;
        }

        const data = await res.json();

        if (!data.success) {
            body.innerHTML = `<tr><td colspan="8">${escapeHTML(data.message || "Could not load orders")}</td></tr>`;
            return;
        }

        const orders = data.orders || [];

        if (!orders.length) {
            body.innerHTML = `<tr><td colspan="8">No orders yet</td></tr>`;
            return;
        }

        body.innerHTML = orders.map(o => `
            <tr>
                <td>${escapeHTML(o.id)}</td>
                <td>${escapeHTML(o.customerName)}<br><small>${escapeHTML(o.customerEmail)}</small></td>
                <td>${escapeHTML(o.phone)}</td>
                <td>${escapeHTML(o.address)}</td>
                <td>${o.items.map(i => escapeHTML(i.name) + " × " + escapeHTML(i.qty)).join("<br>")}</td>
                <td>₹${escapeHTML(o.totalAmount)}</td>
                <td>${escapeHTML(o.paymentMethod)} / ${escapeHTML(o.paymentStatus)}</td>
                <td>${escapeHTML(new Date(o.createdAt).toLocaleString())}</td>
            </tr>
        `).join("");

    } catch (err) {
        console.log("Admin orders error:", err);
        body.innerHTML = `<tr><td colspan="8">Server error</td></tr>`;
    }

}


/* ================= 14. FEATURED PRODUCTS ================= */

// Home page ke "Featured Products" cards banata hai (Order page ke products se) aur unhe 3 second me ghumata hai
function initFeaturedProducts() {

    const track = document.getElementById("featuredProductTrack");

    if (!track || typeof zxProducts === "undefined") return;
    if (track.dataset.initialized === "true") return;

    track.dataset.initialized = "true";

    zxProducts.forEach(product => {
        const card = document.createElement("div");
        card.className = "featured-card";

        const img = document.createElement("img");
        img.src = product.img;
        img.alt = product.name;
        img.loading = "lazy";
        // Image na mile to khaali dabba nahi dikhata
        img.onerror = function () {
            this.style.visibility = "hidden";
        };

        const name = document.createElement("h3");
        name.textContent = product.name;

        const price = document.createElement("p");
        price.textContent = `₹${product.price}`;

        const button = document.createElement("button");
        button.textContent = "View Product";

        button.addEventListener("click", () => {
            showSection("order");

            // Order list load hone ke baad product details kholta hai
            setTimeout(() => {
                zxShowDetail(product.id);
            }, 100);
        });

        card.append(img, name, price, button);
        track.appendChild(card);
    });

    // Har 3 second me pehla card end me chala jata hai
    if (zxProducts.length > 4) {
        setInterval(() => {
            const firstCard = track.firstElementChild;
            if (!firstCard) return;

            const gap = 20;
            const distance = firstCard.getBoundingClientRect().width + gap;

            track.style.transform = `translateX(-${distance}px)`;

            setTimeout(() => {
                track.style.transition = "none";
                track.appendChild(firstCard);
                track.style.transform = "translateX(0)";

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        track.style.transition = "transform 0.5s ease";
                    });
                });
            }, 500);
        }, 3000);
    }

}


/* ================= 15. COMPATIBILITY ALIASES ================= */

// Purane function ke naam, agar Order.js ya Notification.js inhe call karti ho to tutega nahi.
// Agar in dono files me in naamon ka koi use nahi hai to ye poora block hata sakte ho.
function openCustomerLogin() { authShowLogin(); }
function closeCustomerLogin() { authHideAll(); }
function openLoginPopup() { authShowLogin(); }
function closeLoginPopup() { authHideAll(); }
function openCustomerForm() { authShowRegister(); }
function closeCustomerForm() { authHideAll(); }
function switchToLogin() { authShowLogin(); }