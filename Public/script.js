/* =====================================================
   SCRIPT.JS — Anastik Manufacturing Pvt Ltd
   Har function ke upar comment me likha hai ki wo kis kaam ke liye hai.

   Sections:
   00 Page start        01 Hero 3D           02 Video
   03 Home products     04 Pages switch      05 Chatbot
   06 Login / Register  07 Navbar + Helpers 08 Notifications
   09 Order page + Checkout                  10 Profile photo
   11 Payment           12 Account panel (profile, orders, addresses, notifications)
   13 Admin panel       14 Featured products 15 Compatibility aliases
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

// Saare pages (Home, About, Address, Order, Admin Panel) ek saath chhupata hai
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

// Esc dabane par ya popup ke bahar click karne par login popup / account panel band karta hai
function initAuthPopups() {

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            authHideAll();
            closeAccountPanel();
        }
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
// Koi aur email/password (customers table) -> account panel khulta hai.
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

        // Login token (order dene aur account panel ke liye server ko bhejna padta hai)
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

        const checkoutOpen = document.getElementById("zxCheckoutView")?.style.display === "block";

        if (isAdmin) {
            openAdminPanel();
        } else if (checkoutOpen) {
            // Checkout par login kiya to wahi checkout form dikha do
            zxRenderCheckout();
        } else {
            openAccountPanel();
        }

    } catch (err) {
        console.log("Login error:", err);
        alert("Server error. Please try again.");
    }

}


/* ================= 07. NAVBAR + HELPERS ================= */

// Admin login hai ya nahi
function isAdminUser() {

    return localStorage.getItem("owner") === "true" && !!getAdminToken();

}

// Login hone par navbar badalta hai (profile photo dikhata hai, Login button chhupata hai).
// Logout hone par ulta karta hai.
function updateNavbar() {

    const user = JSON.parse(localStorage.getItem("user"));
    const loginBtn = document.getElementById("loginBtn");
    const profileArea = document.getElementById("profileArea");

    if (user) {

        if (loginBtn) loginBtn.style.display = "none";
        if (profileArea) profileArea.style.display = "flex";

        const nameEl = document.getElementById("accName");
        const emailEl = document.getElementById("accEmail");
        const roleEl = document.getElementById("accRole");

        if (nameEl) nameEl.textContent = user.name || "";
        if (emailEl) emailEl.textContent = user.email || "";
        if (roleEl) roleEl.textContent = isAdminUser() ? "Admin" : "Customer";

    } else {

        if (loginBtn) loginBtn.style.display = "inline-block";
        if (profileArea) profileArea.style.display = "none";

    }

    updateNotificationCount();
}

// Logout: saved user, admin flag aur dono token hatakar page reload karta hai
function logoutUser() {

    localStorage.removeItem("user");
    localStorage.removeItem("owner");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("authToken");

    location.reload();

}

// Current user ka login token (customer ya admin dono ka)
function getAuthToken() {

    return localStorage.getItem("authToken");

}

// Current user ki pehchan (mobile ya email). Profile photo isi key se save hoti hai
function getUserKey() {

    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return "guest";
    return user.mobile || user.email;

}

// Login token ke saath server ko request bhejta hai.
// Token purana ho to logout karwa deta hai. Result JSON deta hai (ya null)
async function authFetch(url, options = {}) {

    const token = getAuthToken();

    if (!token) {
        authShowLogin();
        return null;
    }

    try {

        const res = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
                Authorization: "Bearer " + token
            }
        });

        if (res.status === 401) {
            alert("Session expired. Please login again.");
            logoutUser();
            return null;
        }

        return await res.json();

    } catch (err) {
        console.log("Request error:", url, err);
        return { success: false, message: "Server error. Please try again." };
    }

}

// Text ko HTML me safe banata hai (XSS se bachav)
function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[ch]));

}


/* ================= 08. NOTIFICATIONS ================= */

// Notification.js ki list deta hai (nahi mili to khaali list)
function getNotificationList() {

    return (typeof customNotifications !== "undefined" && Array.isArray(customNotifications))
        ? customNotifications
        : [];

}

// Profile photo ke upar chhota badge: kitni notifications hain
function updateNotificationCount() {

    const badge = document.getElementById("profileBadge");
    if (!badge) return;

    const n = isAdminUser() ? 0 : getNotificationList().length;

    badge.textContent = n;
    badge.style.display = n ? "flex" : "none";

}


/* ================= 09. ORDER PAGE + CHECKOUT ================= */

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

// Cart ka total paisa
function zxCartTotal() {

    return zxCart.reduce((sum, item) => sum + item.price * item.qty, 0);

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

/* ---------- CHECKOUT ---------- */

let myAddresses = [];     // customer ke saved addresses (server se)
let coAddrId = "new";     // checkout me chuna hua address ("new" = naya address)
let coMethod = "cod";     // checkout me chuna hua payment ("cod" ya "online")

// Checkout page kholta hai (pichhli screen history me jodta hai) aur form banata hai
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

    zxRenderCheckout();
}

// Checkout ka form banata hai: login check -> saved addresses laata hai -> design dikhata hai
async function zxRenderCheckout() {

    const chk = document.getElementById("zxCheckoutView");
    if (!chk) return;

    // Login nahi hai
    if (!getAuthToken()) {
        chk.innerHTML = `
            <div class="co-card co-center">
                <div class="co-big-icon">🔐</div>
                <h2>Login to continue</h2>
                <p>Please login or create an account to place your order.</p>
                <button class="co-place" onclick="authShowLogin()">Login / Register</button>
                <button class="co-back" onclick="zxGoBack()">⬅ Back</button>
            </div>`;
        return;
    }

    // Admin order nahi kar sakta
    if (isAdminUser()) {
        chk.innerHTML = `
            <div class="co-card co-center">
                <div class="co-big-icon">🛠️</div>
                <h2>Admin account</h2>
                <p>Orders can be placed only from a customer account. Please logout and login as a customer.</p>
                <button class="co-back" onclick="zxGoBack()">⬅ Back</button>
            </div>`;
        return;
    }

    chk.innerHTML = `<div class="co-card co-center"><p>Loading checkout...</p></div>`;

    await loadAddresses();

    // Default address pehle se chuna hua dikhe, nahi hai to naya address form
    const def = myAddresses.find(a => a.isDefault) || myAddresses[0];
    coAddrId = def ? String(def.id) : "new";
    coMethod = "cod";

    const user = JSON.parse(localStorage.getItem("user")) || {};

    const addrCards = myAddresses.map(a => `
        <label class="co-addr ${String(a.id) === coAddrId ? "selected" : ""}" data-id="${a.id}">
            <input type="radio" name="coAddr" value="${a.id}" ${String(a.id) === coAddrId ? "checked" : ""}
                   onchange="coSelectAddr('${a.id}')">
            <div>
                <div class="co-addr-top">
                    <span class="co-tag">${escapeHTML(a.label || "Home")}</span>
                    ${a.isDefault ? '<span class="co-tag co-tag-def">Default</span>' : ""}
                </div>
                <b>${escapeHTML(a.fullName)}</b> <span class="co-phone">${escapeHTML(a.phone)}</span>
                <p>${formatAddressLine(a)}</p>
            </div>
        </label>
    `).join("");

    const items = zxCart.map(i => `
        <div class="co-item">
            <img src="${escapeHTML(i.img)}" alt="">
            <div>
                <b>${escapeHTML(i.name)}</b>
                <small>Qty ${i.qty} × ₹${i.price}</small>
            </div>
            <span>₹${i.price * i.qty}</span>
        </div>
    `).join("");

    chk.innerHTML = `
    <div class="co-wrap">

        <div class="co-main">

            <div class="co-card">
                <div class="co-step"><span>1</span><h3>Delivery Address</h3></div>

                <div class="co-addr-list">
                    ${addrCards}

                    <label class="co-addr co-addr-new ${coAddrId === "new" ? "selected" : ""}" data-id="new">
                        <input type="radio" name="coAddr" value="new" ${coAddrId === "new" ? "checked" : ""}
                               onchange="coSelectAddr('new')">
                        <div><b>＋ Deliver to a new address</b><p>Enter a different delivery address</p></div>
                    </label>
                </div>

                <div id="coNewForm" style="display:${coAddrId === "new" ? "block" : "none"};">
                    ${addressFormHTML("coNew", { name: user.name, phone: user.mobile })}
                    <label class="co-check">
                        <input type="checkbox" id="coSaveAddr" checked>
                        Save this address for my next orders
                    </label>
                </div>
            </div>

            <div class="co-card">
                <div class="co-step"><span>2</span><h3>Payment Method</h3></div>

                <div class="co-pay">
                    <label class="co-pay-opt selected" data-method="cod">
                        <input type="radio" name="coPay" value="cod" checked onchange="coSelectPay('cod')">
                        <div><b>💰 Cash on Delivery</b><small>Pay when your order arrives</small></div>
                    </label>

                    <label class="co-pay-opt" data-method="online">
                        <input type="radio" name="coPay" value="online" onchange="coSelectPay('online')">
                        <div><b>💳 Pay Online</b><small>UPI, Card or Net Banking (secure)</small></div>
                    </label>
                </div>
            </div>

        </div>

        <aside class="co-card co-summary">
            <h3>Order Summary</h3>

            <div class="co-items">${items}</div>

            <div class="co-row"><span>Subtotal</span><span>₹${zxCartTotal()}</span></div>
            <div class="co-row"><span>Delivery</span><span class="co-free">FREE</span></div>
            <div class="co-row co-total"><span>Total</span><span>₹${zxCartTotal()}</span></div>

            <button class="co-place" id="coPlaceBtn" onclick="coSubmit()">${coButtonLabel()}</button>
            <button class="co-back" onclick="zxGoBack()">⬅ Back</button>

            <p class="co-secure">🔒 Your details are safe. A confirmation email will be sent after the order.</p>
        </aside>

    </div>`;
}

// Checkout button par kya likha dikhe (payment method ke hisaab se)
function coButtonLabel() {

    return coMethod === "online"
        ? `Pay ₹${zxCartTotal()} & Place Order`
        : `Place Order • ₹${zxCartTotal()}`;

}

// Saved address chunne par card highlight karta hai. "new" par naya address form kholta hai
function coSelectAddr(id) {

    coAddrId = String(id);

    document.querySelectorAll(".co-addr").forEach(el => {
        el.classList.toggle("selected", el.dataset.id === coAddrId);
    });

    const form = document.getElementById("coNewForm");
    if (form) form.style.display = coAddrId === "new" ? "block" : "none";

}

// Payment method chunne par card highlight karta hai aur button ka text badalta hai
function coSelectPay(method) {

    coMethod = method;

    document.querySelectorAll(".co-pay-opt").forEach(el => {
        el.classList.toggle("selected", el.dataset.method === method);
    });

    const btn = document.getElementById("coPlaceBtn");
    if (btn) btn.textContent = coButtonLabel();

}

// Checkout ka data jodta hai (chuna hua address + payment). Form adhura ho to null deta hai
function coCollect() {

    const payload = { paymentMethod: coMethod };

    if (coAddrId !== "new") {
        payload.addressId = Number(coAddrId);
        return payload;
    }

    const address = readAddressForm("coNew");
    if (!address) return null;

    payload.address = address;
    payload.saveAddress = !!document.getElementById("coSaveAddr")?.checked;

    return payload;
}

// "Place Order" button: COD ho to seedha order, online ho to pehle payment
function coSubmit() {

    const payload = coCollect();
    if (!payload) return;

    if (coMethod === "online") {
        payNow(payload);
    } else {
        zxPlaceOrder(null, payload);
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
function showSuccessPopup(orderId, email) {

    const msg = document.getElementById("successMsg");

    if (msg) {
        msg.textContent = orderId
            ? `Order #${orderId} is confirmed 🎉` + (email ? ` A confirmation email has been sent to ${email}.` : "")
            : "Your order has been confirmed 🎉";
    }

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

// Success popup ka "View My Orders" button: popup band karke account panel ke My Orders me le jata hai
function viewOrdersFromPopup() {

    closeSuccessPopup();
    openAccountPanel("orders");

}

// Order ko server par bhejta hai (orders table me save hota hai + customer aur admin ko mail jaati hai).
// payload = coCollect() ka data, paymentInfo = online payment ho to Razorpay ka response
async function zxPlaceOrder(paymentInfo, payload) {

    if (!getAuthToken()) {
        alert("Please login to place an order");
        authShowLogin();
        return;
    }

    if (!payload) {
        payload = coCollect();
        if (!payload) return;
    }

    if (zxCart.length === 0) {
        alert("Cart is empty");
        return;
    }

    const btn = document.getElementById("coPlaceBtn");

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Placing your order...";
    }

    const data = await authFetch("/api/auth/orders", {
        method: "POST",
        body: JSON.stringify({
            items: zxCart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, img: i.img })),
            ...payload,
            razorpay: payload.paymentMethod === "online" ? paymentInfo : null
        })
    });

    if (!data || !data.success) {

        if (btn) {
            btn.disabled = false;
            btn.textContent = coButtonLabel();
        }

        if (data) {
            const paid = payload.paymentMethod === "online" && paymentInfo && paymentInfo.razorpay_payment_id;

            alert(paid
                ? (data.message || "Order failed") + "\nYour payment id is " + paymentInfo.razorpay_payment_id + ". Please contact support."
                : (data.message || "Order failed"));
        }

        return;
    }

    zxCart = [];
    zxUpdateCartCount();

    showSuccessPopup(data.orderId, data.emailTo);

}


/* ---------- ADDRESS FORM (checkout aur account panel dono me use hota hai) ---------- */

// Address ka form (prefix se ids banti hain, jaise coNewName, accNewName)
function addressFormHTML(p, d = {}) {

    return `
    <div class="af-grid">
        <div class="af-field">
            <label>Full Name</label>
            <input id="${p}Name" type="text" placeholder="Receiver's name" value="${escapeHTML(d.name || "")}">
        </div>
        <div class="af-field">
            <label>Mobile Number</label>
            <input id="${p}Phone" type="tel" maxlength="13" placeholder="10 digit mobile" value="${escapeHTML(d.phone || "")}">
        </div>
        <div class="af-field af-full">
            <label>Address (house no, street, area)</label>
            <input id="${p}Line" type="text" placeholder="House no, street, area">
        </div>
        <div class="af-field">
            <label>District</label>
            <input id="${p}District" type="text" placeholder="District">
        </div>
        <div class="af-field">
            <label>State</label>
            <input id="${p}State" type="text" placeholder="State">
        </div>
        <div class="af-field">
            <label>Pin Code</label>
            <input id="${p}Pin" type="text" inputmode="numeric" maxlength="6" placeholder="6 digit pin code">
        </div>
        <div class="af-field">
            <label>Save as</label>
            <select id="${p}Label">
                <option>Home</option>
                <option>Work</option>
                <option>Other</option>
            </select>
        </div>
    </div>`;

}

// Address form se data padhta hai aur check karta hai. Galat ho to message dikhakar null deta hai
function readAddressForm(p) {

    const v = id => (document.getElementById(p + id)?.value || "").trim();

    const a = {
        fullName: v("Name"),
        phone: v("Phone"),
        line: v("Line"),
        district: v("District"),
        state: v("State"),
        pincode: v("Pin"),
        label: v("Label") || "Home"
    };

    if (!a.fullName || !a.phone || !a.line || !a.district || !a.state || !a.pincode) {
        alert("Please fill all address fields");
        return null;
    }

    if (a.phone.replace(/\D/g, "").length < 10) {
        alert("Please enter a valid 10 digit mobile number");
        return null;
    }

    if (!/^\d{6}$/.test(a.pincode)) {
        alert("Please enter a valid 6 digit pin code");
        return null;
    }

    return a;
}

// Address ko ek line me likhta hai (HTML safe)
function formatAddressLine(a) {

    const main = [a.line, a.district, a.state].filter(Boolean).join(", ");
    return escapeHTML(a.pincode ? main + " - " + a.pincode : main);

}

// Server se customer ke saved addresses laata hai
async function loadAddresses() {

    const data = await authFetch("/api/auth/addresses");

    if (data && data.success) {
        myAddresses = data.addresses || [];
        return true;
    }

    myAddresses = [];
    return false;
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

// Profile photo badalne ke saare tareeke: panel me photo par click -> Camera / Gallery options, aur unka kaam
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

// Online payment: server se Razorpay order banwata hai aur payment window kholta hai.
// Payment safal hone par Razorpay ka response server ko bhejkar order save karta hai (server signature verify karta hai).
// payload = coCollect() ka data (chuna hua address + payment method)
// NOTE: key naya generate karo to yahan "key" bhi badalna (key_id public hoti hai, secret server me hi rehta hai)
async function payNow(payload) {

    if (!getAuthToken()) {
        alert("Please login to place an order");
        authShowLogin();
        return;
    }

    if (!payload) {
        payload = coCollect();
        if (!payload) return;
    }

    const user = JSON.parse(localStorage.getItem("user")) || {};

    try {

        const res = await fetch("/api/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: zxCartTotal() })
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
                zxPlaceOrder(response, payload);
            },

            prefill: {
                name: user.name || "",
                email: user.email || "",
                contact: user.mobile || ""
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


/* ================= 12. ACCOUNT PANEL =================
   Profile photo par click -> right side panel khulta hai.
   Usme: Profile Information, My Orders, Saved Addresses, Notifications (sab usi panel ke andar)
   ===================================================== */

let accView = "menu";
let myOrdersCache = [];

// Account panel kholta hai (view = "menu", "profile", "orders", "addresses", "notifications")
function openAccountPanel(view) {

    if (!getAuthToken()) {
        authShowLogin();
        return;
    }

    document.getElementById("accountPanel").classList.add("active");
    document.getElementById("accountOverlay").classList.add("active");

    showAccountView(typeof view === "string" ? view : "menu");

}

// Account panel band karta hai
function closeAccountPanel() {

    const panel = document.getElementById("accountPanel");
    const overlay = document.getElementById("accountOverlay");
    const imgOptions = document.getElementById("imgOptions");

    if (panel) panel.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
    if (imgOptions) imgOptions.classList.remove("active");

}

// Panel ke andar ek screen dikhata hai (menu / profile / orders / orderDetail / addresses / notifications)
function showAccountView(name, arg) {

    accView = name;

    const body = document.getElementById("accBody");
    if (!body) return;

    body.scrollTop = 0;

    if (name === "profile") return renderAccountProfile(body);
    if (name === "orders") return renderAccountOrders(body);
    if (name === "orderDetail") return renderAccountOrderDetail(body, arg);
    if (name === "addresses") return renderAccountAddresses(body);
    if (name === "notifications") return renderAccountNotifications(body);

    renderAccountMenu(body);

}

// Menu me kisi option par click: Admin Panel alag page hai, baaki panel ke andar khulte hain
function accGo(view) {

    if (view === "admin") {
        closeAccountPanel();
        openAdminPanel();
        return;
    }

    showAccountView(view);

}

// Sub-screen ka upar wala "← Back" header
function accSubHead(title) {

    return `
    <div class="acct-sub">
        <button onclick="showAccountView('menu')" aria-label="Back">←</button>
        <h4>${escapeHTML(title)}</h4>
    </div>`;

}

// Panel ka main menu
function renderAccountMenu(body) {

    const admin = isAdminUser();
    const notifCount = getNotificationList().length;

    const items = admin
        ? [
            ["👤", "Profile Information", "Your account details", "profile", 0],
            ["🛠️", "Admin Panel", "Customers and orders", "admin", 0]
        ]
        : [
            ["👤", "Profile Information", "Your account details", "profile", 0],
            ["📦", "My Orders", "Track and view your orders", "orders", 0],
            ["📍", "Saved Addresses", "Manage delivery addresses", "addresses", 0],
            ["🔔", "Notifications", "Updates and offers", "notifications", notifCount]
        ];

    body.innerHTML = `
    <div class="acct-menu">
        ${items.map(it => `
            <button class="acct-item" onclick="accGo('${it[3]}')">
                <span class="acct-item-icon">${it[0]}</span>
                <span class="acct-item-text">
                    <b>${it[1]}</b>
                    <small>${it[2]}</small>
                </span>
                ${it[4] ? `<span class="acct-count">${it[4]}</span>` : ""}
                <span class="acct-arrow">›</span>
            </button>
        `).join("")}
    </div>

    <button class="acct-logout" onclick="logoutUser()">🚪 Logout</button>`;

}

// Profile Information: login wale user ki saari details (server se)
async function renderAccountProfile(body) {

    body.innerHTML = accSubHead("Profile Information") + `<p class="acct-muted">Loading...</p>`;

    const data = await authFetch("/api/auth/me");
    if (accView !== "profile") return;

    if (!data || !data.success) {
        body.innerHTML = accSubHead("Profile Information") + `<p class="acct-muted">${escapeHTML(data?.message || "Could not load profile")}</p>`;
        return;
    }

    const p = data.profile;

    const rows = p.role === "admin"
        ? [["Name", p.name], ["Email", p.email], ["Role", "Administrator"]]
        : [
            ["Full Name", p.name],
            ["Email", p.email],
            ["Mobile Number", p.mobile],
            ["Address", p.address],
            ["District", p.district],
            ["State", p.state],
            ["Pin Code", p.pincode]
        ];

    body.innerHTML = accSubHead("Profile Information") + `
        <div class="acct-info">
            ${rows.map(r => `
                <div class="acct-info-row">
                    <span>${r[0]}</span>
                    <b>${escapeHTML(r[1] || "-")}</b>
                </div>
            `).join("")}
        </div>`;

}

// My Orders: customer ke saare orders ki list (server se)
async function renderAccountOrders(body) {

    body.innerHTML = accSubHead("My Orders") + `<p class="acct-muted">Loading...</p>`;

    const data = await authFetch("/api/auth/my-orders");
    if (accView !== "orders") return;

    if (!data || !data.success) {
        body.innerHTML = accSubHead("My Orders") + `<p class="acct-muted">${escapeHTML(data?.message || "Could not load orders")}</p>`;
        return;
    }

    myOrdersCache = data.orders || [];

    if (myOrdersCache.length === 0) {
        body.innerHTML = accSubHead("My Orders") + `
            <div class="acct-empty">
                <div>📦</div>
                <p>No orders yet</p>
                <button class="acct-btn" onclick="closeAccountPanel();showSection('order')">Start Shopping</button>
            </div>`;
        return;
    }

    const placeholder = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%23dfe6ee'/></svg>";

    body.innerHTML = accSubHead("My Orders") + myOrdersCache.map((o, i) => {

        const first = Array.isArray(o.items) ? o.items[0] : null;
        const img = (first && first.img) || placeholder;
        const date = getOrderTime(o).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

        return `
        <div class="acct-order" onclick="showAccountView('orderDetail', ${i})">
            <img src="${escapeHTML(img)}" alt="">
            <div class="acct-order-info">
                <b>Order #${escapeHTML(o.id)}</b>
                <span>₹${escapeHTML(o.totalAmount)} • ${o.items.length} item${o.items.length > 1 ? "s" : ""}</span>
                <small>${date}</small>
            </div>
            <em class="acct-status">${escapeHTML(o.status)}</em>
        </div>`;

    }).join("");

}

// Order ki date ko sahi Date me badalta hai
function getOrderTime(order) {

    const time = new Date(order.createdAt || order.date);
    return isNaN(time.getTime()) ? new Date() : time;

}

// Ek order ki detail: items, address, payment aur tracking (Placed -> Dispatched -> Out -> Delivered)
function renderAccountOrderDetail(body, index) {

    const o = myOrdersCache[index];

    if (!o) {
        showAccountView("orders");
        return;
    }

    const days = Math.floor((Date.now() - getOrderTime(o)) / (1000 * 60 * 60 * 24));

    let status = "Order Placed";
    let progress = 25;

    if (days >= 1) { status = "Dispatched 🚚"; progress = 50; }
    if (days >= 3) { status = "Out for Delivery 🚴"; progress = 75; }
    if (days >= 5) { status = "Delivered ✅"; progress = 100; }

    const items = o.items.map(i => `
        <div class="acct-line">
            <span>${escapeHTML(i.name)} × ${i.qty}</span>
            <b>₹${i.price * i.qty}</b>
        </div>`).join("");

    body.innerHTML = `
    <div class="acct-sub">
        <button onclick="showAccountView('orders')" aria-label="Back">←</button>
        <h4>Order #${escapeHTML(o.id)}</h4>
    </div>

    <div class="acct-box">
        ${items}
        <div class="acct-line acct-line-total"><span>Total</span><b>₹${escapeHTML(o.totalAmount)}</b></div>
    </div>

    <div class="acct-box">
        <div class="acct-box-title">Delivery address</div>
        <p>${escapeHTML(o.customerName)} · ${escapeHTML(o.phone)}</p>
        <p class="acct-muted">${escapeHTML(o.address)}</p>
    </div>

    <div class="acct-box">
        <div class="acct-box-title">Payment</div>
        <p>${o.paymentMethod === "online" ? "Paid online (" + escapeHTML(o.paymentStatus) + ")" : "Cash on Delivery"}</p>
    </div>

    <div class="acct-box">
        <div class="tracker">
            <div class="step ${progress >= 25 ? "active" : ""}">Placed</div>
            <div class="step ${progress >= 50 ? "active" : ""}">Dispatched</div>
            <div class="step ${progress >= 75 ? "active" : ""}">Out</div>
            <div class="step ${progress >= 100 ? "active" : ""}">Delivered</div>

            <div class="line">
                <div class="line-progress" style="width:${progress}%"></div>
            </div>
        </div>
        <p class="status-text">${status}</p>
    </div>`;

}

// Saved Addresses: addresses ki list + naya address jodne ka form
async function renderAccountAddresses(body) {

    body.innerHTML = accSubHead("Saved Addresses") + `<p class="acct-muted">Loading...</p>`;

    await loadAddresses();
    if (accView !== "addresses") return;

    const user = JSON.parse(localStorage.getItem("user")) || {};

    const cards = myAddresses.map(a => `
        <div class="acct-addr">
            <div class="acct-addr-top">
                <span class="acct-tag">${escapeHTML(a.label || "Home")}</span>
                ${a.isDefault ? '<span class="acct-tag acct-tag-def">Default</span>' : ""}
            </div>
            <b>${escapeHTML(a.fullName)}</b> <span class="acct-muted">· ${escapeHTML(a.phone)}</span>
            <p>${formatAddressLine(a)}</p>
            <div class="acct-addr-actions">
                ${a.isDefault ? "" : `<button onclick="accSetDefault(${a.id})">Set as default</button>`}
                <button class="danger" onclick="accDeleteAddress(${a.id})">Delete</button>
            </div>
        </div>`).join("");

    body.innerHTML = accSubHead("Saved Addresses") + (cards || `<p class="acct-muted">No saved address yet</p>`) + `
        <button class="acct-btn-outline" onclick="accToggleAddrForm()">＋ Add New Address</button>

        <div id="accAddrForm" class="acct-form" style="display:none;">
            ${addressFormHTML("accNew", { name: user.name, phone: user.mobile })}
            <label class="co-check">
                <input type="checkbox" id="accNewDefault"> Make this my default address
            </label>
            <button class="acct-btn" onclick="accSaveAddress()">Save Address</button>
        </div>`;

}

// "+ Add New Address" par form kholta / band karta hai
function accToggleAddrForm() {

    const f = document.getElementById("accAddrForm");
    if (f) f.style.display = f.style.display === "none" ? "block" : "none";

}

// Naya address server me save karta hai
async function accSaveAddress() {

    const a = readAddressForm("accNew");
    if (!a) return;

    a.isDefault = !!document.getElementById("accNewDefault")?.checked;

    const data = await authFetch("/api/auth/addresses", {
        method: "POST",
        body: JSON.stringify(a)
    });

    if (!data) return;

    if (!data.success) {
        alert(data.message || "Could not save address");
        return;
    }

    zxShowToast("✅ Address saved");
    showAccountView("addresses");

}

// Kisi address ko default banata hai
async function accSetDefault(id) {

    const data = await authFetch("/api/auth/addresses/" + id + "/default", { method: "PUT" });
    if (!data) return;

    if (!data.success) {
        alert(data.message || "Could not update");
        return;
    }

    showAccountView("addresses");

}

// Address delete karta hai
async function accDeleteAddress(id) {

    if (!confirm("Delete this address?")) return;

    const data = await authFetch("/api/auth/addresses/" + id, { method: "DELETE" });
    if (!data) return;

    if (!data.success) {
        alert(data.message || "Could not delete");
        return;
    }

    showAccountView("addresses");

}

// Notifications: Notification.js ki list, click karne par message khulta hai
function renderAccountNotifications(body) {

    const list = getNotificationList();

    if (!list.length) {
        body.innerHTML = accSubHead("Notifications") + `<p class="acct-muted">No notifications</p>`;
        return;
    }

    body.innerHTML = accSubHead("Notifications") + list.map(n => `
        <div class="acct-notif" onclick="this.classList.toggle('open')">
            <div class="acct-notif-top">
                <b>${escapeHTML(n.title)}</b>
                <span>${escapeHTML(n.date)}</span>
            </div>
            <p>${escapeHTML(n.message)}</p>
        </div>`).join("");

}


/* ================= 13. ADMIN PANEL ================= */

let adminCustomersCache = [];

// Admin login ke baad mila token (har admin request ke saath server ko bhejna padta hai)
function getAdminToken() {
    return localStorage.getItem("adminToken");
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
function toggleProfile() { openAccountPanel(); }
function closeProfile() { closeAccountPanel(); }
function toggleNotifications() { openAccountPanel("notifications"); }

// Purane sidebar ke options (ab sab account panel me khulte hain)
function openSection(type) {

    if (type === "admin") { openAdminPanel(); return; }
    if (type === "orders") { openAccountPanel("orders"); return; }
    if (type === "address") { openAccountPanel("addresses"); return; }
    if (type === "payment") { alert("Payment Methods feature coming soon"); return; }

    openAccountPanel("profile");

}


/* =====================================================
   ADMIN PANEL (Orders + delivery tracking update, Customers)
   script.js ke bilkul END me paste karo.
   Isme purane admin functions (openAdminPanel, closeAdminPanel, loadAdminCustomers,
   updateAdminStats, filterAdminCustomers, renderAdminCustomers, loadAdminOrders,
   renderAdminOrders) ke naye versions hain. Neeche paste karne se purane apne aap
   replace ho jate hain (jo function sabse neeche likha ho wahi chalta hai).
   Ye block script.js ke kisi aur helper par depend nahi karta, sirf logoutUser() chahiye.
   ===================================================== */

// Server ke addresses (orders ka route alag ho to sirf ye line badlo)
const ADMIN_API_CUSTOMERS = "/api/auth/admin/customers";
const ADMIN_API_ORDERS = "/api/auth/admin/orders";

// Delivery tracking ke 4 steps (key wahi hai jo database me save hoti hai)
const ADMIN_STATUS_LIST = [
    { key: "placed",           short: "Placed",     label: "Order Placed",     icon: "📝" },
    { key: "dispatched",       short: "Dispatched", label: "Dispatched",       icon: "🚚" },
    { key: "out_for_delivery", short: "Out",        label: "Out for Delivery", icon: "🚴" },
    { key: "delivered",        short: "Delivered",  label: "Delivered",        icon: "✅" }
];

// Admin panel ka data (customers, orders) aur abhi kaunsa tab khula hai
const ADMIN_UI = { customers: [], orders: [], tab: "orders" };


/* ---------- chhote helpers ---------- */

// Admin login ke baad mila token
function admToken() {
    return localStorage.getItem("adminToken");
}

// Text ko HTML me safe banata hai (customer ke likhe naam/address page ko na tode)
function admEsc(value) {
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
}

// 1500 -> ₹1,500
function admMoney(n) {
    return "₹" + Number(n || 0).toLocaleString("en-IN");
}

// Order ki date ko padhne layak banata hai
function admDate(value) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

// Order ka status (khaali ya galat ho to "placed")
function admStatusOf(order) {
    const key = String(order && order.status || "placed");
    return ADMIN_STATUS_LIST.some(s => s.key === key) ? key : "placed";
}

// Order ke items ko array me badalta hai (database se string ya array dono aa sakte hain)
function admItems(order) {
    let items = order && order.items;

    if (typeof items === "string") {
        try { items = JSON.parse(items); } catch (e) { items = []; }
    }

    return Array.isArray(items) ? items : [];
}

// Screen ke kone me chhota message dikhata hai (hara = safal, laal = error)
function admToast(message, isError) {
    const toast = document.createElement("div");
    toast.className = "adm-toast" + (isError ? " error" : "");
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
}

// Admin token ke saath server se baat karta hai. Token galat ho to dobara login karwata hai
async function adminFetch(url, options = {}) {

    const token = admToken();

    if (!token) {
        alert("Admin session not found. Please login again.");
        logoutUser();
        return null;
    }

    const res = await fetch(url, {
        ...options,
        headers: { ...(options.headers || {}), Authorization: "Bearer " + token }
    });

    if (res.status === 401 || res.status === 403) {
        alert("Admin session expired. Please login again.");
        logoutUser();
        return null;
    }

    return res;
}


/* ---------- panel kholna / band karna ---------- */

// Admin Panel kholta hai (sirf admin ke liye) aur customers + orders DB se mangwata hai
function openAdminPanel() {

    if (localStorage.getItem("owner") !== "true" || !admToken()) {
        alert("Admin login required");
        return;
    }

    if (typeof closeAccountPanel === "function") closeAccountPanel();

    ["home-wrapper", "about-page", "address", "order", "ordersSection", "adminPanel"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = "none";
    });

    document.getElementById("adminPanel").style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });

    adminTab(ADMIN_UI.tab);
    refreshAdminPanel();
}

// "Back to Website": Admin Panel band karke Home page dikhata hai
function closeAdminPanel() {

    const panel = document.getElementById("adminPanel");
    const home = document.getElementById("home-wrapper");

    if (panel) panel.style.display = "none";
    if (home) home.style.display = "block";

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// "Refresh" button: customers aur orders dono dobara laata hai
function refreshAdminPanel() {
    return Promise.all([loadAdminCustomers(), loadAdminOrders()]);
}

// Orders aur Customers tab ke beech badalta hai
function adminTab(name) {

    ADMIN_UI.tab = name === "customers" ? "customers" : "orders";

    const showOrders = ADMIN_UI.tab === "orders";

    document.getElementById("adminTabOrders").style.display = showOrders ? "block" : "none";
    document.getElementById("adminTabCustomers").style.display = showOrders ? "none" : "block";

    document.getElementById("adminTabBtnOrders").classList.toggle("active", showOrders);
    document.getElementById("adminTabBtnCustomers").classList.toggle("active", !showOrders);
}


/* ---------- upar ke stats ---------- */

// 5 stat cards: customers, states, orders, in progress, total sales, aur sabse naya customer
function updateAdminStats() {

    const customers = ADMIN_UI.customers;
    const orders = ADMIN_UI.orders;

    const states = new Set(
        customers.map(c => String(c.state || "").trim().toLowerCase()).filter(Boolean)
    );

    const inProgress = orders.filter(o => admStatusOf(o) !== "delivered").length;
    const sales = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    document.getElementById("adminTotalCustomers").innerText = customers.length;
    document.getElementById("adminTotalStates").innerText = states.size;
    document.getElementById("adminTotalOrders").innerText = orders.length;
    document.getElementById("adminPendingOrders").innerText = inProgress;
    document.getElementById("adminTotalSales").innerText = admMoney(sales);
    document.getElementById("adminLatestCustomer").innerText = customers[0] ? customers[0].name : "-";

    document.getElementById("adminTabOrdersCount").innerText = orders.length;
    document.getElementById("adminTabCustomersCount").innerText = customers.length;
}


/* ---------- CUSTOMERS ---------- */

// Server se saare registered customers laata hai
async function loadAdminCustomers() {

    const empty = document.getElementById("adminEmpty");

    try {

        const res = await adminFetch(ADMIN_API_CUSTOMERS);
        if (!res) return;

        const data = await res.json();

        if (!data.success) {
            empty.style.display = "block";
            empty.innerText = data.message || "Could not load customers";
            return;
        }

        ADMIN_UI.customers = data.customers || [];

        updateAdminStats();
        filterAdminCustomers();

    } catch (err) {
        console.log("Admin customers error:", err);
        empty.style.display = "block";
        empty.innerText = "Server error. Please try again.";
    }
}

// Search box ke hisaab se customers chhanta hai
function filterAdminCustomers() {

    const search = document.getElementById("adminSearch");
    const q = search ? search.value.trim().toLowerCase() : "";

    const list = !q
        ? ADMIN_UI.customers
        : ADMIN_UI.customers.filter(c =>
            [c.name, c.email, c.mobile, c.address, c.district, c.state, c.pincode]
                .some(v => String(v || "").toLowerCase().includes(q))
        );

    renderAdminCustomers(list);
}

// Customers ki table banata hai
function renderAdminCustomers(list) {

    const body = document.getElementById("adminCustomerRows");
    const empty = document.getElementById("adminEmpty");
    const count = document.getElementById("adminCount");

    count.innerText = `Showing ${list.length} of ${ADMIN_UI.customers.length} customers`;

    if (!list.length) {
        body.innerHTML = "";
        empty.style.display = "block";
        empty.innerText = "No customers found.";
        return;
    }

    empty.style.display = "none";

    body.innerHTML = list.map(c => `
        <tr>
            <td>#${admEsc(c.id)}</td>
            <td>${admEsc(c.name)}</td>
            <td>${admEsc(c.email)}</td>
            <td>${admEsc(c.mobile)}</td>
            <td>${admEsc(c.address)}</td>
            <td>${admEsc(c.district)}</td>
            <td>${admEsc(c.state)}</td>
            <td>${admEsc(c.pincode)}</td>
        </tr>
    `).join("");
}


/* ---------- ORDERS + TRACKING ---------- */

// Server se saare orders laata hai (har order ke saath uska tracking status bhi aata hai)
async function loadAdminOrders() {

    const empty = document.getElementById("adminOrderEmpty");

    try {

        const res = await adminFetch(ADMIN_API_ORDERS);
        if (!res) return;

        const data = await res.json();

        if (!data.success) {
            empty.style.display = "block";
            empty.innerText = data.message || "Could not load orders";
            return;
        }

        ADMIN_UI.orders = data.orders || [];

        updateAdminStats();
        filterAdminOrders();

    } catch (err) {
        console.log("Admin orders error:", err);
        empty.style.display = "block";
        empty.innerText = "Server error. Please try again.";
    }
}

// Search aur status filter ke hisaab se orders chhanta hai
function filterAdminOrders() {

    const search = document.getElementById("adminOrderSearch");
    const filter = document.getElementById("adminOrderFilter");

    const q = search ? search.value.trim().toLowerCase() : "";
    const status = filter ? filter.value : "all";

    const list = ADMIN_UI.orders.filter(o => {

        if (status !== "all" && admStatusOf(o) !== status) return false;
        if (!q) return true;

        const names = admItems(o).map(i => i.name);

        return [o.id, o.customerName, o.customerEmail, o.phone, o.address, ...names]
            .some(v => String(v || "").toLowerCase().includes(q));
    });

    renderAdminOrders(list);
}

// Ek order ka payment badge (COD / Paid Online / Online pending)
function admPayBadge(order) {

    if (order.paymentMethod === "online") {
        return order.paymentStatus === "paid"
            ? '<span class="adm-badge adm-badge-green">Paid Online</span>'
            : `<span class="adm-badge adm-badge-orange">Online · ${admEsc(order.paymentStatus || "pending")}</span>`;
    }

    return '<span class="adm-badge adm-badge-gold">Cash on Delivery</span>';
}

// Ek order ka poora card banata hai: customer, items, total aur tracking update ka hissa
function admOrderCard(order) {

    const id = Number(order.id);
    const status = admStatusOf(order);
    const current = ADMIN_STATUS_LIST.findIndex(s => s.key === status);
    const currentInfo = ADMIN_STATUS_LIST[current];

    const items = admItems(order).map(i => `
        <li>
            <span>${admEsc(i.name)}</span>
            <b>× ${admEsc(i.qty)}</b>
            <em>${admMoney(Number(i.price) * Number(i.qty))}</em>
        </li>
    `).join("");

    const steps = ADMIN_STATUS_LIST.map((s, n) => `
        <div class="adm-step ${n < current ? "done" : ""} ${n === current ? "current" : ""}">
            <span class="adm-dot">${s.icon}</span>
            <small>${s.short}</small>
        </div>
    `).join("");

    const options = ADMIN_STATUS_LIST.map(s =>
        `<option value="${s.key}" ${s.key === status ? "selected" : ""}>${s.label}</option>`
    ).join("");

    return `
    <article class="adm-order" id="admOrder-${id}">

        <div class="adm-order-main">
            <div class="adm-order-head">
                <span class="adm-order-id">Order #${id}</span>
                <span class="adm-order-date">${admEsc(admDate(order.createdAt))}</span>
                <div class="adm-badges">${admPayBadge(order)}</div>
            </div>

            <div class="adm-cust">
                <b>${admEsc(order.customerName)}</b>
                <p>📞 ${admEsc(order.phone)} &nbsp;·&nbsp; ✉ ${admEsc(order.customerEmail)}</p>
                <p>📍 ${admEsc(order.address)}</p>
            </div>

            <ul class="adm-items">${items}</ul>

            <div class="adm-total">
                <span>Total Amount</span>
                <b>${admMoney(order.totalAmount)}</b>
            </div>
        </div>

        <div class="adm-order-side">
            <div class="adm-side-top">
                <span class="adm-side-title">DELIVERY TRACKING</span>
                <span class="adm-pill adm-pill-${status}">${currentInfo.label}</span>
            </div>

            <div class="adm-track ${status === "delivered" ? "is-delivered" : ""}">${steps}</div>

            <label class="adm-side-label" for="admStatus-${id}">Update order status</label>

            <div class="adm-update">
                <select id="admStatus-${id}" class="adm-select">${options}</select>
                <button type="button" class="adm-save" id="admSave-${id}" onclick="saveOrderStatus(${id})">Update</button>
            </div>

            <p class="adm-side-note">The customer sees this status in their order tracking right away.</p>
        </div>

    </article>
    `;
}

// Orders ke cards screen par dikhata hai
function renderAdminOrders(list) {

    const box = document.getElementById("adminOrderList");
    const empty = document.getElementById("adminOrderEmpty");
    const count = document.getElementById("adminOrderCount");

    count.innerText = `Showing ${list.length} of ${ADMIN_UI.orders.length} orders`;

    if (!list.length) {
        box.innerHTML = "";
        empty.style.display = "block";
        empty.innerText = ADMIN_UI.orders.length
            ? "No orders match your search."
            : "No orders yet. New orders will appear here.";
        return;
    }

    empty.style.display = "none";
    box.innerHTML = list.map(admOrderCard).join("");
}

// "Update" button: chuna hua status DB me save karta hai.
// Isi status se customer ke site par uska tracking badal jata hai.
async function saveOrderStatus(id) {

    const select = document.getElementById("admStatus-" + id);
    const button = document.getElementById("admSave-" + id);
    if (!select || !button) return;

    const status = select.value;

    button.disabled = true;
    button.innerText = "Saving...";

    try {

        const res = await adminFetch(`${ADMIN_API_ORDERS}/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });

        if (!res) return;

        const data = await res.json();

        if (!data.success) {
            admToast(data.message || "Could not update status", true);
            button.disabled = false;
            button.innerText = "Update";
            return;
        }

        const order = ADMIN_UI.orders.find(o => Number(o.id) === Number(id));
        if (order) order.status = status;

        const label = ADMIN_STATUS_LIST.find(s => s.key === status).label;

        updateAdminStats();
        filterAdminOrders();

        admToast(`Order #${id} is now "${label}"`);

    } catch (err) {
        console.log("Update status error:", err);
        admToast("Server error. Please try again.", true);
        button.disabled = false;
        button.innerText = "Update";
    }
}

// Customer ke "My Orders" me tracking dikhane ke kaam aata hai: status se progress % aur naam deta hai
function orderTrackingFromStatus(status) {

    const index = Math.max(0, ADMIN_STATUS_LIST.findIndex(s => s.key === status));

    return {
        index,
        progress: (index + 1) * 25,
        label: ADMIN_STATUS_LIST[index].label
    };
}