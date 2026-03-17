// ================================
// COIND PANEL — SCRIPT.JS
// ================================

// 🔗 Replace with your Apps Script URL
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx-UKilDtExSHQ0x1KBCGICH-gD3QH3fv7ltXTmONXZcuZSKo9YXE9pSqHWhv9QfXhr/exec";

// ================================
// INIT
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const isLoginPage = document.getElementById("login-form");
  const isDashboard = document.getElementById("order-form");

  if (isLoginPage) {
    document.getElementById("login-form").addEventListener("submit", handleLogin);
  }

  if (isDashboard) {
    checkAuth();
    loadDashboardData();

    document.getElementById("order-form").addEventListener("submit", handleOrderSubmit);
    document.getElementById("logout-btn").addEventListener("click", handleLogout);
  }
});

// ================================
// AUTH CHECK
// ================================
function checkAuth() {
  const user = JSON.parse(localStorage.getItem("coindUser"));
  if (!user) {
    window.location.href = "index.html";
  }
}

// ================================
// LOGIN
// ================================
async function handleLogin(e) {
  e.preventDefault();

  const user_id = document.getElementById("user_id").value.trim();
  const password = document.getElementById("password").value.trim();

  const alertBox = document.getElementById("loginAlert");
  const alertMsg = document.getElementById("loginAlertMsg");

  const btn = document.getElementById("loginBtn");
  const btnText = document.getElementById("loginBtnText");
  const spinner = document.getElementById("loginSpinner");

  // Validation
  if (!user_id || !password) {
    showAlert(alertBox, alertMsg, "Please fill all fields");
    return;
  }

  // Loading UI
  spinner.classList.remove("hidden");
  btnText.textContent = "Signing in...";
  btn.disabled = true;

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        user_id,
        password
      })
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("coindUser", JSON.stringify(data.user));
      window.location.href = "dashboard.html";
    } else {
      showAlert(alertBox, alertMsg, data.message || "Invalid credentials");
    }

  } catch (err) {
    showAlert(alertBox, alertMsg, "Server error. Try again.");
  }

  // Reset UI
  spinner.classList.add("hidden");
  btnText.textContent = "Login";
  btn.disabled = false;
}

// ================================
// LOAD DASHBOARD
// ================================
async function loadDashboardData() {
  const user = JSON.parse(localStorage.getItem("coindUser"));

  if (!user) return;

  // Fill UI
  document.getElementById("greetingName").textContent = user.name || "User";
  document.getElementById("user-id-display").textContent = user.user_id;
  document.getElementById("balance-display").textContent = `₹${user.balance || 0}`;
  document.getElementById("balanceDisplay").textContent = `₹${user.balance || 0}`;
  document.getElementById("total-orders-display").textContent = user.total_orders || 0;

  // Load services
  loadServices();
}

// ================================
// LOAD SERVICES (DYNAMIC)
// ================================
async function loadServices() {
  const serviceSelect = document.getElementById("service");

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "services"
      })
    });

    const data = await res.json();

    if (data.success && Array.isArray(data.services)) {
      data.services.forEach(service => {
        const option = document.createElement("option");
        option.value = service.id;
        option.textContent = `${service.name} — ₹${service.rate}/1000`;
        option.dataset.rate = service.rate;
        serviceSelect.appendChild(option);
      });
    }

  } catch (err) {
    console.log("Service load error");
  }
}

// ================================
// ORDER SUBMIT
// ================================
async function handleOrderSubmit(e) {
  e.preventDefault();

  const user = JSON.parse(localStorage.getItem("coindUser"));

  const email = document.getElementById("email").value.trim();
  const service = document.getElementById("service").value;
  const link = document.getElementById("link").value.trim();
  const quantity = document.getElementById("quantity").value;

  const btn = document.getElementById("orderSubmitBtn");
  const btnText = document.getElementById("orderBtnText");
  const spinner = document.getElementById("orderSpinner");

  const resultBox = document.getElementById("orderResult");
  const resultMsg = document.getElementById("orderResultMsg");
  const resultIcon = document.getElementById("orderResultIcon");

  // Validation
  if (!email || !service || !link || !quantity) {
    showOrderResult(resultBox, resultMsg, resultIcon, "Fill all fields", false);
    return;
  }

  // Get rate
  const selectedOption = document.querySelector("#service option:checked");
  const rate = selectedOption?.dataset.rate || 0;

const cost = ((Number(quantity) / 1000) * Number(rate)).toFixed(2);
  

  // Loading UI
  spinner.classList.remove("hidden");
  btnText.textContent = "Processing...";
  btn.disabled = true;

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "order",
        user_id: user.user_id,
        email,
        service,
        link,
        quantity,
        cost
      })
    });

    const data = await res.json();

    if (data.success) {
      showOrderResult(resultBox, resultMsg, resultIcon, "Order placed successfully", true);

      // Update UI balance
      user.balance = data.new_balance;
      user.total_orders = data.total_orders;

      localStorage.setItem("coindUser", JSON.stringify(user));
      loadDashboardData();

      document.getElementById("order-form").reset();

    } else {
      showOrderResult(resultBox, resultMsg, resultIcon, data.message || "Order failed", false);
    }

  } catch (err) {
    showOrderResult(resultBox, resultMsg, resultIcon, "Server error", false);
  }

  // Reset UI
  spinner.classList.add("hidden");
  btnText.textContent = "Place Order";
  btn.disabled = false;
}

// ================================
// LOGOUT
// ================================
function handleLogout() {
  localStorage.removeItem("coindUser");
  window.location.href = "index.html";
}

// ================================
// UI HELPERS
// ================================
function showAlert(box, msgEl, message) {
  msgEl.textContent = message;
  box.classList.add("visible");

  setTimeout(() => {
    box.classList.remove("visible");
  }, 3000);
}

function showOrderResult(box, msgEl, iconEl, message, success) {
  msgEl.textContent = message;

  if (success) {
    box.classList.remove("error");
    box.classList.add("success");
    iconEl.textContent = "✔️";
  } else {
    box.classList.remove("success");
    box.classList.add("error");
    iconEl.textContent = "❌";
  }

  box.classList.add("visible");

  setTimeout(() => {
    box.classList.remove("visible");
  }, 4000);
}