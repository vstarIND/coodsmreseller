// ================================
// COIND PANEL — SCRIPT.JS (FIXED)
// ================================

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycby-ViEMEamzKsIvPS08-UyJpKdlp_BHQHH42nIWlz0X4AzmDu8NsLfZhq_2-A1P4PIs/exec";

// ================================
// UNIVERSAL API CALL (GET BASED)
// ================================
async function callAPI(params) {
  const query = new URLSearchParams(params).toString();
  const url = `${WEB_APP_URL}?${query}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow"
    });

    const text = await res.text();

    try {
      return JSON.parse(text);
    } catch {
      console.log("RAW RESPONSE:", text);
      return { success: false, message: "Invalid JSON" };
    }

  } catch (err) {
    console.error("API ERROR:", err);
    return { success: false, message: "Fetch failed" };
  }
}

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
// LOGIN (FIXED)
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

  if (!user_id || !password) {
    showAlert(alertBox, alertMsg, "Please fill all fields");
    return;
  }

  spinner.classList.remove("hidden");
  btnText.textContent = "Signing in...";
  btn.disabled = true;

  const data = await callAPI({
    action: "login",
    user_id,
    password
  });

  if (data.success) {
    localStorage.setItem("coindUser", JSON.stringify(data.user));
    window.location.href = "dashboard.html";
  } else {
    showAlert(alertBox, alertMsg, data.message || "Invalid credentials");
  }

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

  document.getElementById("greetingName").textContent = user.name || "User";
  document.getElementById("user-id-display").textContent = user.user_id;
  document.getElementById("balance-display").textContent = `₹${user.balance || 0}`;
  document.getElementById("balanceDisplay").textContent = `₹${user.balance || 0}`;
  document.getElementById("total-orders-display").textContent = user.total_orders || 0;

  loadServices();
}

// ================================
// LOAD SERVICES (FIXED)
// ================================
async function loadServices() {
  const serviceSelect = document.getElementById("service");

  const data = await callAPI({
    action: "services"
  });

  if (data.success && Array.isArray(data.services)) {
    serviceSelect.innerHTML = `<option value="">Select Service</option>`;

    data.services.forEach(service => {
      const option = document.createElement("option");
      option.value = service.id;
      option.textContent = `${service.name} — ₹${service.rate}/1000`;
      option.dataset.rate = service.rate;
      serviceSelect.appendChild(option);
    });
  }
}

// ================================
// ORDER SUBMIT (FIXED)
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

  if (!email || !service || !link || !quantity) {
    showOrderResult(resultBox, resultMsg, resultIcon, "Fill all fields", false);
    return;
  }

  const selectedOption = document.querySelector("#service option:checked");
  const rate = selectedOption?.dataset.rate || 0;

  const cost = ((Number(quantity) / 1000) * Number(rate)).toFixed(2);

  spinner.classList.remove("hidden");
  btnText.textContent = "Processing...";
  btn.disabled = true;

  const data = await callAPI({
    action: "order",
    user_id: user.user_id,
    email,
    service,
    link,
    quantity,
    cost
  });

  if (data.success) {
    showOrderResult(resultBox, resultMsg, resultIcon, "Order placed successfully", true);

    user.balance = data.new_balance;
    user.total_orders = data.total_orders;

    localStorage.setItem("coindUser", JSON.stringify(user));
    loadDashboardData();

    document.getElementById("order-form").reset();
  } else {
    showOrderResult(resultBox, resultMsg, resultIcon, data.message || "Order failed", false);
  }

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
