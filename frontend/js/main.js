console.log("EV CHARGEHUB JS LOADED");

function isAdminUser() {
  const user = checkAuthStatus();

  return !!user && String(user.role || "").toUpperCase() === "ADMIN";
}

function renderAdminAccess() {
  const adminNavbarLink =
    document.getElementById("admin-dashboard-link");

  const adminProfileLink =
    document.getElementById("admin-profile-link");

  const admin = isAdminUser();

  if (adminNavbarLink) {
    adminNavbarLink.classList.toggle("hidden", !admin);
  }

  if (adminProfileLink) {
    adminProfileLink.classList.toggle("hidden", !admin);
  }
}

window.addEventListener("error", function (e) {
  console.error("GLOBAL JS ERROR:", e.error || e.message);
});
function handleResetPasswordLink() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    return;
  }

  console.log("RESET TOKEN FOUND:", token);

  // Reset link se aane wale user ko login page par le jao
  loadPage("login");

  // login page load hone ke baad modal open karo
  setTimeout(() => {
    openResetPasswordModal(token);
  }, 300);
}

document.addEventListener("DOMContentLoaded", function () {
console.log("DOM CONTENT LOADED");
  document.getElementById("footer-year").textContent =
    new Date().getFullYear();

  applyTheme(
    getStorage(CONFIG.THEME_KEY, "light") === "dark"
  );

  renderNavbarAuthState();
renderAdminAccess();

async function loadAdminDashboard() {
  const token = localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);

  if (!token || !isAdminUser()) {
    console.warn("ADMIN DASHBOARD: Unauthorized");
    return;
  }

  console.log("ADMIN DASHBOARD: Loading data...");

  try {

    // =========================================
    // 1. DASHBOARD STATS
    // =========================================
    const statsResponse = await fetch(
      `${CONFIG.API_BASE_URL}/admin/stats`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (!statsResponse.ok) {
      throw new Error(
        `Stats API failed: ${statsResponse.status}`
      );
    }

    const stats = await statsResponse.json();

    console.log("ADMIN STATS:", stats);

    const totalUsers =
      document.getElementById("admin-total-users");

    const totalStations =
      document.getElementById("admin-total-stations");

    const totalBookings =
      document.getElementById("admin-total-bookings");

    const stationCount =
      document.getElementById("admin-station-count");

    const availabilityCount =
      document.getElementById("admin-availability-count");

    if (totalUsers) {
      totalUsers.textContent = stats.totalUsers ?? 0;
    }

    if (totalStations) {
      totalStations.textContent = stats.totalStations ?? 0;
    }

    if (totalBookings) {
      totalBookings.textContent = stats.totalBookings ?? 0;
    }

    if (stationCount) {
      stationCount.textContent = stats.totalStations ?? 0;
    }

    if (availabilityCount) {
      availabilityCount.textContent =
        stats.availableStations ?? 0;
    }


    // =========================================
    // 2. GET ALL STATIONS
    // =========================================
    const stationsResponse = await fetch(
      `${CONFIG.API_BASE_URL}/stations`,
      {
        method: "GET"
      }
    );

    if (stationsResponse.ok) {

      const stations = await stationsResponse.json();

      console.log("ADMIN STATIONS:", stations);

      renderAdminStations(stations);

      let chargerCount = 0;

      stations.forEach(station => {

        const totalSlots =
          Number(station.totalSlots) || 0;

        chargerCount += totalSlots;
      });

      const chargerCountElement =
        document.getElementById("admin-charger-count");

      if (chargerCountElement) {
        chargerCountElement.textContent = chargerCount;
      }
    }


    // =========================================
    // 3. GET ALL USERS
    // =========================================
    const usersResponse = await fetch(
      `${CONFIG.API_BASE_URL}/admin/users`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (usersResponse.ok) {

      const users = await usersResponse.json();

      console.log("ADMIN USERS:", users);

      renderAdminUsers(users);
    }


    // =========================================
    // 4. GET ALL BOOKINGS
    // =========================================
    const bookingsResponse = await fetch(
      `${CONFIG.API_BASE_URL}/admin/bookings`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (bookingsResponse.ok) {

      const bookings = await bookingsResponse.json();

      console.log("ADMIN BOOKINGS:", bookings);

      renderAdminBookings(bookings);
    }


    console.log("ADMIN DASHBOARD: Data loaded successfully");

  } catch (error) {

    console.error(
      "ADMIN DASHBOARD ERROR:",
      error
    );

    if (typeof showToast === "function") {
      showToast(
        "Admin dashboard data load failed.",
        "error"
      );
    }
  }
}

// =========================================
// ADMIN - LOAD USERS
// =========================================
async function adminLoadUsers() {

  const token =
    localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);

  if (!token || !isAdminUser()) {
    showToast("Admin login required.", "error");
    return;
  }

  try {

    console.log("ADMIN: Loading users...");

    const response = await fetch(
      `${CONFIG.API_BASE_URL}/admin/users`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Users API failed: ${response.status}`
      );
    }

    const users = await response.json();

    console.log("ADMIN USERS:", users);

    renderAdminUsers(users);

    const container =
      document.getElementById("admin-users-list");

    if (container) {
      container.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

  } catch (error) {

    console.error(
      "ADMIN USERS ERROR:",
      error
    );

    showToast(
      "Unable to load users.",
      "error"
    );
  }
}


// =========================================
// ADMIN - LOAD STATIONS
// =========================================
async function adminLoadStations() {

  const token =
    localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);

  if (!token || !isAdminUser()) {
    showToast("Admin login required.", "error");
    return;
  }

  try {

    console.log("ADMIN: Loading stations...");

    const response = await fetch(
      `${CONFIG.API_BASE_URL}/stations`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Stations API failed: ${response.status}`
      );
    }

    const stations = await response.json();

    console.log("ADMIN STATIONS:", stations);

    renderAdminStations(stations);

    const container =
      document.getElementById(
        "admin-stations-table"
      );

    if (container) {
      container.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

  } catch (error) {

    console.error(
      "ADMIN STATIONS ERROR:",
      error
    );

    showToast(
      "Unable to load stations.",
      "error"
    );
  }
}


// =========================================
// ADMIN - LOAD BOOKINGS
// =========================================
async function adminLoadBookings() {

  const token =
    localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);

  if (!token || !isAdminUser()) {
    showToast("Admin login required.", "error");
    return;
  }

  try {

    console.log("ADMIN: Loading bookings...");

    const response = await fetch(
      `${CONFIG.API_BASE_URL}/admin/bookings`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Bookings API failed: ${response.status}`
      );
    }

    const bookings = await response.json();

    console.log("ADMIN BOOKINGS:", bookings);

    renderAdminBookings(bookings);

    const container =
      document.getElementById(
        "admin-bookings-list"
      );

    if (container) {
      container.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

  } catch (error) {

    console.error(
      "ADMIN BOOKINGS ERROR:",
      error
    );

    showToast(
      "Unable to load bookings.",
      "error"
    );
  }
}


// =========================================
// ADMIN - IMPORT REAL STATIONS
// =========================================
async function adminImportStations() {

  const token =
    localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);

  if (!token || !isAdminUser()) {
    showToast("Admin login required.", "error");
    return;
  }

  const button =
    document.getElementById("admin-import-btn");

  const oldText =
    button ? button.innerHTML : "";

  try {

    if (button) {
      button.disabled = true;
      button.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Importing...';
    }

    showToast(
      "Importing real charging stations...",
      "info"
    );

    console.log(
      "ADMIN: Importing real stations..."
    );

    const response = await fetch(
      `${CONFIG.API_BASE_URL}/admin/import-real`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Import API failed: ${response.status}`
      );
    }

    const result = await response.text();

    console.log(
      "IMPORT RESULT:",
      result
    );

    showToast(
      result || "Stations imported successfully.",
      "info"
    );

    // Dashboard stats refresh
    await loadAdminDashboard();

  } catch (error) {

    console.error(
      "ADMIN IMPORT ERROR:",
      error
    );

    showToast(
      "Real station import failed.",
      "error"
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.innerHTML = oldText;
    }

  }
}

// =========================================
// RENDER STATIONS
// =========================================
function renderAdminStations(stations) {

  const table =
    document.getElementById("admin-stations-table");

  if (!table) {
    console.warn(
      "admin-stations-table not found"
    );
    return;
  }

  // Agar actual element TABLE hai to tbody use karo
  let container = table;

  if (table.tagName === "TABLE") {

    container = table.querySelector("tbody");

    if (!container) {

      container = document.createElement("tbody");

      table.appendChild(container);
    }
  }

  if (!stations || stations.length === 0) {

    container.innerHTML = `
      ${
        table.tagName === "TABLE"
          ? `
            <tr>
              <td
                colspan="8"
                class="p-6 text-center text-text-muted"
              >
                No stations found.
              </td>
            </tr>
          `
          : `
            <div class="p-6 text-center text-text-muted">
              No stations found.
            </div>
          `
      }
    `;

    return;
  }

  if (table.tagName === "TABLE") {

    container.innerHTML = stations.map(station => {

      return `
        <tr class="border-b border-border text-sm">

          <td class="px-4 py-3 font-medium">
            ${escapeAdminHtml(
              station.stationName || "Unknown"
            )}
          </td>

          <td class="px-4 py-3">
            ${escapeAdminHtml(
              station.location || "-"
            )}
          </td>

          <td class="px-4 py-3">
            ${escapeAdminHtml(
              station.chargerType || "-"
            )}
          </td>

          <td class="px-4 py-3">
            ${
              station.available
                ? "Available"
                : "Unavailable"
            }
          </td>

          <td class="px-4 py-3">
            ${station.availableSlots ?? 0}
            /
            ${station.totalSlots ?? 0}
          </td>

        </tr>
      `;

    }).join("");

  } else {

    container.innerHTML = stations.map(station => {

      return `
        <div
          class="grid grid-cols-5 gap-4 p-4 border-b border-border text-sm"
        >

          <div class="font-medium">
            ${escapeAdminHtml(
              station.stationName || "Unknown"
            )}
          </div>

          <div>
            ${escapeAdminHtml(
              station.location || "-"
            )}
          </div>

          <div>
            ${escapeAdminHtml(
              station.chargerType || "-"
            )}
          </div>

          <div>
            ${
              station.available
                ? "Available"
                : "Unavailable"
            }
          </div>

          <div>
            ${station.availableSlots ?? 0}
            /
            ${station.totalSlots ?? 0}
          </div>

        </div>
      `;

    }).join("");
  }
}

// =========================================
// RENDER USERS
// =========================================
function renderAdminUsers(users) {

  const container =
    document.getElementById("admin-users-list");

  if (!container) {
    console.warn(
      "admin-users-list not found"
    );
    return;
  }

  if (!users || users.length === 0) {

    container.innerHTML = `
      <div class="p-4 text-center text-text-muted">
        No users found.
      </div>
    `;

    return;
  }

  container.innerHTML = users.map(user => {

    const role =
      String(user.role || "USER").toUpperCase();

    return `
      <div
        class="flex items-center justify-between p-4 border-b border-border"
      >

        <div>
          <div class="font-semibold text-text">
            ${escapeAdminHtml(
              user.name || "Unknown"
            )}
          </div>

          <div class="text-sm text-text-muted">
            ${escapeAdminHtml(
              user.email || "-"
            )}
          </div>
        </div>

        <span
          class="px-3 py-1 rounded-full text-xs font-semibold
          ${
            role === "ADMIN"
              ? "bg-primary/10 text-primary"
              : "bg-bg text-text-muted"
          }"
        >
          ${escapeAdminHtml(role)}
        </span>

      </div>
    `;

  }).join("");
}


// =========================================
// RENDER BOOKINGS
// =========================================
function renderAdminBookings(bookings) {

  const container =
    document.getElementById("admin-bookings-list");

  if (!container) {
    console.warn(
      "admin-bookings-list not found"
    );
    return;
  }

  if (!bookings || bookings.length === 0) {

    container.innerHTML = `
      <div class="p-4 text-center text-text-muted">
        No bookings found.
      </div>
    `;

    return;
  }

  container.innerHTML = bookings.map(booking => {

    return `
      <div
        class="p-4 border-b border-border"
      >

        <div class="flex justify-between gap-4">

          <div>

            <div class="font-semibold text-text">
              Booking ID:
              ${escapeAdminHtml(
                booking.id ||
                booking._id ||
                "-"
              )}
            </div>

            <div class="text-sm text-text-muted mt-1">
              User:
              ${escapeAdminHtml(
                booking.userId || "-"
              )}
            </div>

            <div class="text-sm text-text-muted">
              Station:
              ${escapeAdminHtml(
                booking.stationId || "-"
              )}
            </div>

          </div>

          <div class="text-sm text-text-muted">
            ${escapeAdminHtml(
              booking.bookingDate || "-"
            )}
          </div>

        </div>

      </div>
    `;

  }).join("");
}


// =========================================
// HTML ESCAPE
// =========================================
function escapeAdminHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadPage("home");
handleResetPasswordLink();

  document.body.addEventListener("click", function (e) {

    // =========================================
    // NIGHT DRIVE MODE
    // =========================================
    const themeRow = e.target.closest("#theme-toggle-row");

    if (themeRow) {

      const themeToggle =
        document.getElementById("theme-toggle-input");

      if (!themeToggle) return;

      // Direct checkbox click
      if (e.target.id === "theme-toggle-input") {
        applyTheme(themeToggle.checked);
        return;
      }

      // Row/text click
      themeToggle.checked = !themeToggle.checked;

      applyTheme(themeToggle.checked);

      return;
    }

    /* ================= ADMIN ACTIONS ================= */

    if (e.target.closest("#admin-users-btn") ||
        e.target.closest("#admin-users-card")) {

      e.preventDefault();
      e.stopPropagation();

      adminLoadUsers();
      return;
    }

    if (e.target.closest("#admin-stations-btn") ||
        e.target.closest("#admin-stations-card")) {

      e.preventDefault();
      e.stopPropagation();

      adminLoadStations();
      return;
    }

    if (e.target.closest("#admin-bookings-btn") ||
        e.target.closest("#admin-bookings-card")) {

      e.preventDefault();
      e.stopPropagation();

      adminLoadBookings();
      return;
    }

    if (e.target.closest("#admin-import-btn") ||
        e.target.closest("#admin-import-card")) {

      e.preventDefault();
      e.stopPropagation();

      adminImportStations();
      return;
    }
    // =========================================
    // PAGE NAVIGATION
    // =========================================
   const pageLink = e.target.closest("[data-page]");

if (pageLink) {

  e.preventDefault();

  const requestedPage = pageLink.dataset.page;

  // =========================================
  // ADMIN PAGE PROTECTION
  // =========================================
  if (requestedPage === "admin" && !isAdminUser()) {

    console.warn("ADMIN ACCESS DENIED");

    if (typeof showToast === "function") {
      showToast(
        "Admin access required.",
        "error"
      );
    }

    loadPage("home");

    return;
  }

  loadPage(requestedPage);

  if (requestedPage === "admin") {
  setTimeout(() => {
    loadAdminDashboard();
  }, 500);
}

  document
    .getElementById("navbar-links")
    .classList.remove("open");

  document
    .getElementById("profile-dropdown")
    .classList.remove("open");

  return;
}


    // =========================================
    // LOGOUT
    // =========================================
  if (e.target.closest("#btn-logout")) {

  e.preventDefault();

  logoutUser();

  renderNavbarAuthState();
  renderAdminAccess();

  loadPage("home");

  return;
}


    // =========================================
    // PROFILE DROPDOWN
    // =========================================
    if (e.target.closest("#profile-trigger")) {

      document
        .getElementById("profile-dropdown")
        .classList.toggle("open");

      document
        .getElementById("notification-dropdown")
        .classList.remove("open");

      return;
    }


    // =========================================
    // NOTIFICATION DROPDOWN
    // =========================================
    if (e.target.closest("#notification-trigger")) {

      const dropdown =
        document.getElementById("notification-dropdown");

      const opening =
        !dropdown.classList.contains("open");

      dropdown.classList.toggle("open");

      document
        .getElementById("profile-dropdown")
        .classList.remove("open");

      if (opening) {
        markAllNotificationsRead();
      }

      return;
    }


    // =========================================
    // MOBILE MENU
    // =========================================
    if (e.target.closest("#navbar-burger")) {

      document
        .getElementById("navbar-links")
        .classList.toggle("open");

      return;
    }


    // =========================================
    // MODAL CLOSE
    // =========================================
    if (e.target.closest("#modal-close-btn")) {

      closeModal();
      return;
    }

    if (e.target.id === "modal-overlay") {

      closeModal();
      return;
    }


    // =========================================
    // CLOSE DROPDOWNS
    // =========================================
    if (!e.target.closest("#profile-menu")) {

      document
        .getElementById("profile-dropdown")
        .classList.remove("open");
    }

    if (!e.target.closest("#notification-menu")) {

      document
        .getElementById("notification-dropdown")
        .classList.remove("open");
    }

  });

});

// =========================================================
// ADMIN STATION MANAGEMENT
// =========================================================

function getAdminStationApiBase() {
  let base = "http://localhost:8081";

  try {
    if (typeof API_BASE_URL !== "undefined" && API_BASE_URL) {
      base = API_BASE_URL;
    }
  } catch (error) {
    // Keep fallback URL
  }

  return String(base).replace(/\/+$/, "");
}


function getAdminStationToken() {
  return localStorage.getItem("ev_chargehub_token") || "";
}


function adminStationHeaders(includeJson = false) {

  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  const token = getAdminStationToken();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}


function adminStationEscapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function showAdminStationMessage(message, type = "success") {

  const box = document.getElementById("admin-station-message");

  if (!box) {
    return;
  }

  box.className =
    "mt-4 rounded-lg p-4 text-sm border";

  if (type === "success") {
    box.classList.add(
      "bg-primary-soft",
      "border-primary",
      "text-primary"
    );
  } else {
    box.classList.add(
      "bg-red-50",
      "border-red-300",
      "text-red-700"
    );
  }

  box.textContent = message;
  box.classList.remove("hidden");
}


function showAdminStationFormMessage(message, type = "error") {

  const box = document.getElementById(
    "admin-station-form-message"
  );

  if (!box) {
    return;
  }

  box.className =
    "rounded-lg p-4 text-sm border";

  if (type === "success") {

    box.classList.add(
      "bg-primary-soft",
      "border-primary",
      "text-primary"
    );

  } else {

    box.classList.add(
      "bg-red-50",
      "border-red-300",
      "text-red-700"
    );

  }

  box.textContent = message;
  box.classList.remove("hidden");
}


function hideAdminStationFormMessage() {

  const box = document.getElementById(
    "admin-station-form-message"
  );

  if (box) {
    box.classList.add("hidden");
    box.textContent = "";
  }
}


function openAdminStationModal(editStation = null) {

  const modal =
    document.getElementById("admin-station-modal");

  const form =
    document.getElementById("admin-station-form");

  if (!modal || !form) {
    return;
  }

  hideAdminStationFormMessage();

  form.reset();

  const idInput =
    document.getElementById("admin-station-id");

  const title =
    document.getElementById("admin-station-modal-title");

  const saveButtonText =
    document.querySelector(
      "#admin-station-save-btn span"
    );

  const availableCheckbox =
    document.getElementById("admin-station-available");

  if (editStation) {

    title.textContent =
      "Update Charging Station";

    if (saveButtonText) {
      saveButtonText.textContent =
        "Update Station";
    }

    idInput.value =
      editStation.id || "";

    document.getElementById(
      "admin-station-name"
    ).value =
      editStation.stationName || "";

    document.getElementById(
      "admin-station-location"
    ).value =
      editStation.location || "";

    document.getElementById(
      "admin-station-latitude"
    ).value =
      editStation.latitude ?? "";

    document.getElementById(
      "admin-station-longitude"
    ).value =
      editStation.longitude ?? "";

    document.getElementById(
      "admin-station-charger-type"
    ).value =
      editStation.chargerType || "";

    document.getElementById(
      "admin-station-total-slots"
    ).value =
      editStation.totalSlots ?? "";

    document.getElementById(
      "admin-station-available-slots"
    ).value =
      editStation.availableSlots ?? "";

    document.getElementById(
      "admin-station-price"
    ).value =
      editStation.pricePerUnit ?? "";

    availableCheckbox.checked =
      Boolean(editStation.available);

  } else {

    title.textContent =
      "Add Charging Station";

    if (saveButtonText) {
      saveButtonText.textContent =
        "Save Station";
    }

    idInput.value = "";

    availableCheckbox.checked = true;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}


function closeAdminStationModal() {

  const modal =
    document.getElementById("admin-station-modal");

  if (!modal) {
    return;
  }

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  hideAdminStationFormMessage();
}


async function fetchAdminStations() {

  const response = await fetch(
    `${getAdminStationApiBase()}/stations`,
    {
      method: "GET",
      headers: adminStationHeaders()
    }
  );

  if (!response.ok) {

    let errorMessage =
      "Unable to load stations.";

    try {

      const text =
        await response.text();

      if (text) {
        errorMessage = text;
      }

    } catch (error) {
      // Ignore parsing error
    }

    throw new Error(errorMessage);
  }

  return response.json();
}


function renderAdminStations(stations) {

  const tbody =
    document.getElementById(
      "admin-station-table-body"
    );

  if (!tbody) {
    return;
  }

  const total =
    document.getElementById(
      "admin-station-page-total"
    );

  const available =
    document.getElementById(
      "admin-station-page-available"
    );

  const slots =
    document.getElementById(
      "admin-station-page-slots"
    );

  const totalSlots =
    stations.reduce(
      (sum, station) =>
        sum + Number(station.totalSlots || 0),
      0
    );

  const availableStations =
    stations.filter(
      station => Boolean(station.available)
    ).length;

  if (total) {
    total.textContent = stations.length;
  }

  if (available) {
    available.textContent = availableStations;
  }

  if (slots) {
    slots.textContent = totalSlots;
  }


  if (!stations.length) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center">

          <div class="flex flex-col items-center">

            <div class="w-14 h-14 rounded-full bg-bg text-text-muted flex items-center justify-center text-xl mb-4">
              <i class="fa-solid fa-charging-station"></i>
            </div>

            <p class="font-semibold text-text">
              No charging stations found
            </p>

            <p class="text-sm text-text-muted mt-1">
              Add a station to start managing your charging network.
            </p>

          </div>

        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML = stations.map(station => {

    const available =
      Boolean(station.available);

    const statusBadge = available
      ? `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-soft text-primary">
          <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
          Available
        </span>
      `
      : `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">
          <span class="w-1.5 h-1.5 rounded-full bg-red-600"></span>
          Unavailable
        </span>
      `;

    return `
      <tr class="border-b border-border hover:bg-bg transition">

        <td class="px-4 py-4">

          <div>
            <p class="font-semibold text-text">
              ${adminStationEscapeHtml(station.stationName)}
            </p>

            <p class="text-xs text-text-muted mt-1">
              ID: ${adminStationEscapeHtml(station.id)}
            </p>
          </div>

        </td>


        <td class="px-4 py-4 text-text-muted">
          ${adminStationEscapeHtml(station.location)}
        </td>


        <td class="px-4 py-4">

          <span class="text-text">
            ${adminStationEscapeHtml(station.chargerType)}
          </span>

        </td>


        <td class="px-4 py-4 text-center">

          <span class="font-semibold text-text">
            ${Number(station.availableSlots || 0)}
            /
            ${Number(station.totalSlots || 0)}
          </span>

        </td>


        <td class="px-4 py-4 text-right font-semibold text-text">
          ₹${Number(station.pricePerUnit || 0).toFixed(2)}
        </td>


        <td class="px-4 py-4 text-center">
          ${statusBadge}
        </td>


        <td class="px-4 py-4">

          <div class="flex items-center justify-end gap-2">

            <button
              type="button"
              class="admin-station-edit-btn w-9 h-9 rounded-lg border border-border bg-surface text-text-muted hover:text-primary hover:border-primary transition cursor-pointer"
              data-id="${adminStationEscapeHtml(station.id)}"
              title="Edit Station">

              <i class="fa-solid fa-pen"></i>

            </button>


            <button
              type="button"
              class="admin-station-delete-btn w-9 h-9 rounded-lg border border-border bg-surface text-text-muted hover:text-red-600 hover:border-red-400 transition cursor-pointer"
              data-id="${adminStationEscapeHtml(station.id)}"
              title="Delete Station">

              <i class="fa-solid fa-trash"></i>

            </button>

          </div>

        </td>

      </tr>
    `;

  }).join("");
}


let adminStationsCache = [];


async function loadAdminStations() {

  const tbody =
    document.getElementById(
      "admin-station-table-body"
    );

  if (!tbody) {
    return;
  }

  tbody.innerHTML = `
    <tr>
      <td colspan="7" class="py-12 text-center text-text-muted">
        <i class="fa-solid fa-spinner fa-spin mr-2"></i>
        Loading stations...
      </td>
    </tr>
  `;

  try {

    const stations =
      await fetchAdminStations();

    adminStationsCache =
      Array.isArray(stations)
        ? stations
        : [];

    renderAdminStations(
      adminStationsCache
    );

  } catch (error) {

    console.error(
      "Admin station loading error:",
      error
    );

    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-12 text-center text-red-600">
          ${adminStationEscapeHtml(
            error.message || "Unable to load stations."
          )}
        </td>
      </tr>
    `;
  }
}


async function submitAdminStationForm(event) {

  event.preventDefault();

  const saveButton =
    document.getElementById(
      "admin-station-save-btn"
    );

  const saveButtonText =
    saveButton?.querySelector("span");

  hideAdminStationFormMessage();

  const id =
    document.getElementById(
      "admin-station-id"
    ).value.trim();

  const station = {

    stationName:
      document.getElementById(
        "admin-station-name"
      ).value.trim(),

    location:
      document.getElementById(
        "admin-station-location"
      ).value.trim(),

    latitude:
      Number(
        document.getElementById(
          "admin-station-latitude"
        ).value
      ),

    longitude:
      Number(
        document.getElementById(
          "admin-station-longitude"
        ).value
      ),

    chargerType:
      document.getElementById(
        "admin-station-charger-type"
      ).value.trim(),

    totalSlots:
      Number(
        document.getElementById(
          "admin-station-total-slots"
        ).value
      ),

    availableSlots:
      Number(
        document.getElementById(
          "admin-station-available-slots"
        ).value
      ),

    available:
      document.getElementById(
        "admin-station-available"
      ).checked,

    pricePerUnit:
      Number(
        document.getElementById(
          "admin-station-price"
        ).value
      )
  };


  if (!station.stationName ||
      !station.location ||
      !station.chargerType) {

    showAdminStationFormMessage(
      "Please fill all required station fields."
    );

    return;
  }


  if (station.totalSlots < 0 ||
      station.availableSlots < 0) {

    showAdminStationFormMessage(
      "Slots cannot be negative."
    );

    return;
  }


  if (
    station.availableSlots >
    station.totalSlots
  ) {

    showAdminStationFormMessage(
      "Available slots cannot be greater than total slots."
    );

    return;
  }


  if (
    Number.isNaN(station.latitude) ||
    Number.isNaN(station.longitude)
  ) {

    showAdminStationFormMessage(
      "Please enter valid latitude and longitude."
    );

    return;
  }


  if (saveButton) {
    saveButton.disabled = true;
    saveButton.classList.add(
      "opacity-60",
      "cursor-not-allowed"
    );
  }

  if (saveButtonText) {
    saveButtonText.textContent =
      id ? "Updating..." : "Saving...";
  }


  try {

    const isEdit = Boolean(id);

    const url = isEdit
      ? `${getAdminStationApiBase()}/stations/${encodeURIComponent(id)}`
      : `${getAdminStationApiBase()}/stations`;

    const response = await fetch(
      url,
      {
        method: isEdit ? "PUT" : "POST",
        headers: adminStationHeaders(true),
        body: JSON.stringify(station)
      }
    );


    if (!response.ok) {

      let message =
        isEdit
          ? "Unable to update station."
          : "Unable to add station.";

      try {

        const text =
          await response.text();

        if (text) {
          message = text;
        }

      } catch (error) {
        // Ignore parsing error
      }

      throw new Error(message);
    }


    closeAdminStationModal();

    showAdminStationMessage(
      isEdit
        ? "Charging station updated successfully."
        : "Charging station added successfully.",
      "success"
    );

    await loadAdminStations();


  } catch (error) {

    console.error(
      "Admin station save error:",
      error
    );

    showAdminStationFormMessage(
      error.message ||
      "Unable to save charging station."
    );

  } finally {

    if (saveButton) {
      saveButton.disabled = false;
      saveButton.classList.remove(
        "opacity-60",
        "cursor-not-allowed"
      );
    }

    if (saveButtonText) {
      saveButtonText.textContent =
        id
          ? "Update Station"
          : "Save Station";
    }
  }
}


async function editAdminStation(stationId) {

  const station =
    adminStationsCache.find(
      item => String(item.id) === String(stationId)
    );

  if (station) {
    openAdminStationModal(station);
    return;
  }


  try {

    const response = await fetch(
      `${getAdminStationApiBase()}/stations/${encodeURIComponent(stationId)}`,
      {
        method: "GET",
        headers: adminStationHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(
        "Unable to load station information."
      );
    }

    const stationData =
      await response.json();

    openAdminStationModal(stationData);

  } catch (error) {

    console.error(
      "Edit station error:",
      error
    );

    showAdminStationMessage(
      error.message ||
      "Unable to open station.",
      "error"
    );
  }
}


async function deleteAdminStation(stationId) {

  const station =
    adminStationsCache.find(
      item => String(item.id) === String(stationId)
    );

  const stationName =
    station?.stationName ||
    "this charging station";


  const confirmed =
    window.confirm(
      `Are you sure you want to delete "${stationName}"?`
    );

  if (!confirmed) {
    return;
  }


  try {

    const response = await fetch(
      `${getAdminStationApiBase()}/stations/${encodeURIComponent(stationId)}`,
      {
        method: "DELETE",
        headers: adminStationHeaders()
      }
    );


    if (!response.ok) {

      let message =
        "Unable to delete station.";

      try {

        const text =
          await response.text();

        if (text) {
          message = text;
        }

      } catch (error) {
        // Ignore parsing error
      }

      throw new Error(message);
    }


    showAdminStationMessage(
      "Charging station deleted successfully.",
      "success"
    );

    await loadAdminStations();


  } catch (error) {

    console.error(
      "Delete station error:",
      error
    );

    showAdminStationMessage(
      error.message ||
      "Unable to delete charging station.",
      "error"
    );
  }
}


function searchAdminStations() {

  const input =
    document.getElementById(
      "admin-station-search"
    );

  if (!input) {
    return;
  }

  const searchTerm =
    input.value.trim().toLowerCase();

  if (!searchTerm) {

    renderAdminStations(
      adminStationsCache
    );

    return;
  }


  const filtered =
    adminStationsCache.filter(station => {

      const name =
        String(
          station.stationName || ""
        ).toLowerCase();

      const location =
        String(
          station.location || ""
        ).toLowerCase();

      const chargerType =
        String(
          station.chargerType || ""
        ).toLowerCase();

      return (
        name.includes(searchTerm) ||
        location.includes(searchTerm) ||
        chargerType.includes(searchTerm)
      );
    });


  renderAdminStations(filtered);
}


function bindAdminStationManagement() {

  const panel =
    document.getElementById(
      "station-admin-management"
    );

  if (!panel) {
    return;
  }


  // Prevent duplicate listeners
  if (panel.dataset.initialized === "true") {
    return;
  }

  panel.dataset.initialized = "true";


  // Add
  document
    .getElementById("admin-add-station-btn")
    ?.addEventListener(
      "click",
      () => openAdminStationModal()
    );


  // Close
  document
    .getElementById("admin-station-modal-close")
    ?.addEventListener(
      "click",
      closeAdminStationModal
    );


  document
    .getElementById("admin-station-cancel-btn")
    ?.addEventListener(
      "click",
      closeAdminStationModal
    );


  // Modal outside click
  document
    .getElementById("admin-station-modal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "admin-station-modal"
        ) {
          closeAdminStationModal();
        }
      }
    );


  // Form
  document
    .getElementById("admin-station-form")
    ?.addEventListener(
      "submit",
      submitAdminStationForm
    );


  // Search
  document
    .getElementById("admin-station-search-btn")
    ?.addEventListener(
      "click",
      searchAdminStations
    );


  document
    .getElementById("admin-station-search")
    ?.addEventListener(
      "keydown",
      event => {

        if (event.key === "Enter") {

          event.preventDefault();

          searchAdminStations();
        }
      }
    );


  // Clear search
  document
    .getElementById("admin-station-clear-search")
    ?.addEventListener(
      "click",
      () => {

        const input =
          document.getElementById(
            "admin-station-search"
          );

        if (input) {
          input.value = "";
        }

        renderAdminStations(
          adminStationsCache
        );
      }
    );


  // Table action buttons
  document
    .getElementById(
      "admin-station-table-body"
    )
    ?.addEventListener(
      "click",
      event => {

        const editButton =
          event.target.closest(
            ".admin-station-edit-btn"
          );

        if (editButton) {

          editAdminStation(
            editButton.dataset.id
          );

          return;
        }


        const deleteButton =
          event.target.closest(
            ".admin-station-delete-btn"
          );

        if (deleteButton) {

          deleteAdminStation(
            deleteButton.dataset.id
          );
        }
      }
    );


  // Availability label
  document
    .getElementById(
      "admin-station-available"
    )
    ?.addEventListener(
      "change",
      event => {

        const label =
          document.getElementById(
            "admin-station-available-label"
          );

        if (label) {
          label.textContent =
            event.target.checked
              ? "Available"
              : "Unavailable";
        }
      }
    );


  loadAdminStations();
}


function initStationAdminManagement() {

  const user =
    typeof checkAuthStatus === "function"
      ? checkAuthStatus()
      : null;


  const panel =
    document.getElementById(
      "station-admin-management"
    );

  if (!panel) {
    return;
  }


  const isAdmin =
    !!user &&
    String(user.role || "").toUpperCase() === "ADMIN";


  if (!isAdmin) {
    panel.classList.add("hidden");
    return;
  }


  panel.classList.remove("hidden");

  bindAdminStationManagement();
}