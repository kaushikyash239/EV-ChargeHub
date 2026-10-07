const BTN_BASE =
  "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap cursor-pointer border border-transparent rounded-md transition duration-150 active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_PRIMARY = BTN_BASE + " text-base px-5.5 py-3 text-white bg-primary hover:bg-primary-dark";
const BTN_PRIMARY_SM = BTN_BASE + " text-sm px-3.5 py-2 text-white bg-primary hover:bg-primary-dark";
const BTN_OUTLINE_SM = BTN_BASE + " text-sm px-3.5 py-2 bg-surface text-text border-border hover:border-primary hover:text-primary";
const BTN_DANGER_SM = BTN_BASE + " text-sm px-3.5 py-2 bg-surface text-danger border-[#fecaca] hover:bg-[#fef2f2]";
const INPUT_BASE =
  "w-full font-sans text-base px-3.5 py-3 border border-border rounded-md bg-surface text-text outline-none transition duration-150 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-soft)]";
const FORM_STATUS_BASE = "mt-3 text-sm min-h-[1.2em]";

const pageCache = {};
const appContent = document.getElementById("app-content");

let pendingStationSearch = null;

async function loadPage(pageName) {
  if (!pageCache[pageName]) {
    const res = await fetch("pages/" + pageName + ".html");
    if (!res.ok) {
      appContent.innerHTML = "<p>Sorry, this page could not be loaded.</p>";
      return;
    }
    pageCache[pageName] = await res.text();
  }

  appContent.innerHTML = pageCache[pageName];
  setActiveNavLink(pageName);
  window.scrollTo({ top: 0, behavior: "instant" });

  if (pageName === "home") initHomePage();
  if (pageName === "stations"){ 
    initStationsPage();
    initStationAdminManagement();
  }
  if (pageName === "bookings") initBookingsPage();
  if (pageName === "contact") initContactPage();
  if (pageName === "profile") initProfilePage();
  if (pageName === "login") initLoginPage();
}

const setActiveNavLink = pageName => {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === pageName);
  });
};

const getInitials = name => {
  if (!name || !name.trim()) return "EV";
  const parts = name.trim().split(/\s+/);
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
  return (first + last).toUpperCase();
};

function renderNavbarAuthState() {
  let user = checkAuthStatus();
  const loginBtn = document.getElementById("btn-login");
  const registerBtn = document.getElementById("btn-register");
  const profileMenu = document.getElementById("profile-menu");
  const notificationMenu = document.getElementById("notification-menu");
  const usernameEl = document.getElementById("navbar-username");
  const avatarEl = document.getElementById("navbar-avatar");

  if (user) {
    loginBtn.classList.add("!hidden");
    registerBtn.classList.add("!hidden");
    profileMenu.classList.remove("hidden");
    notificationMenu.classList.remove("hidden");
    usernameEl.textContent = user.name || "Account";
    avatarEl.textContent = getInitials(user.name);
    renderNotificationBell();
  } else {
    loginBtn.classList.remove("!hidden");
    registerBtn.classList.remove("!hidden");
    profileMenu.classList.add("hidden");
    notificationMenu.classList.add("hidden");
  }
}

function applyTheme(isDark) {
  document.documentElement.classList.toggle("dark", isDark);
  const checkbox = document.getElementById("theme-toggle-input");
  if (checkbox) checkbox.checked = isDark;
  if (typeof setMapTheme === "function" && typeof stationMap !== "undefined" && stationMap) {
    setMapTheme(isDark);
  }
  setStorage(CONFIG.THEME_KEY, isDark ? "dark" : "light");
}

function showToast(message, type) {
  const stack = document.getElementById("toast-stack");
  if (!stack) return;

  let icon = type === "cancel" ? "fa-circle-xmark" : type === "error" ? "fa-triangle-exclamation" : "fa-circle-check";
  const isCancel = type === "cancel" || type === "error";
  const toast = document.createElement("div");
  toast.className =
    "flex items-start rounded-md shadow-card bg-surface border border-border px-4 py-3 text-sm text-text gap-2.5 animate-[toast-in_0.2s_ease] " +
    (isCancel ? "border-l-4 border-l-danger" : "border-l-4 border-l-primary");
  toast.innerHTML =
    '<i class="fa-solid ' + icon + " mt-0.5 " + (isCancel ? "text-danger" : "text-primary") + '"></i><span>' + message + "</span>";

  stack.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

function renderNotificationBell() {
  const badge = document.getElementById("notification-badge");
  let listEl = document.getElementById("notification-list");
  if (!badge || !listEl) return;

  const notifications = getStoredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (unreadCount > 0) {
    badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
    badge.classList.remove("!hidden");
  } else {
    badge.classList.add("!hidden");
  }

  if (!notifications.length) {
    listEl.innerHTML = '<p class="text-center px-4 py-12 text-text-muted">No notifications yet.</p>';
    return;
  }

  let iconFor = { booking: "fa-calendar-check", cancel: "fa-calendar-xmark", profile: "fa-user-pen", contact: "fa-envelope" };

  listEl.innerHTML = notifications
    .map(n => {
      let icon = iconFor[n.type] || "fa-bell";
      const itemCls =
        "flex items-start gap-2.5 px-4 py-3 border-b border-border last:border-b-0 text-sm" +
        (n.read ? "" : " bg-primary-soft");
      return (
        '<div class="' + itemCls + '">' +
          '<i class="fa-solid ' + icon + ' text-primary mt-0.5"></i>' +
          '<div>' +
            '<p class="m-0 mb-1 text-text">' + n.message + "</p>" +
            '<span class="text-xs text-text-muted">' + n.time + "</span>" +
          "</div>" +
        "</div>"
      );
    })
    .join("");
}

function openModal(title, bodyHtml) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-body").innerHTML = bodyHtml;
  document.getElementById("modal-overlay").classList.add("open");
}

function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
}

/* ---------- Home page ---------- */
function initHomePage() {
  const findBtn = document.getElementById("home-find-btn");
  const searchInput = document.getElementById("home-search-input");

  const goSearchStations = () => {
    pendingStationSearch = searchInput.value.trim() || null;
    loadPage("stations");
  };

  if (findBtn) findBtn.addEventListener("click", goSearchStations);
  if (searchInput) {
    searchInput.addEventListener("keyup", e => {
      if (e.key === "Enter") goSearchStations();
    });
  }
}

/* ---------- Find Stations page ---------- */
async function initStationsPage() {

  let listEl = document.getElementById("station-list");

  if (!listEl) return;

  listEl.innerHTML =
    '<p class="text-center px-4 py-12 text-text-muted">' +
    'Loading stations...' +
    '</p>';

  /*
   * ---------------------------------------------------------
   * INITIAL STATIONS
   * ---------------------------------------------------------
   *
   * Home page se city search aayi hai to directly OCM
   * nearby stations load karo.
   *
   * Otherwise current backend stations load karo.
   */
  let stations = [];

  if (pendingStationSearch) {

    try {

      stations = await fetchNearbyStations(
        pendingStationSearch
      );

      /*
       * fetchNearbyStations() se distance ko UI ke expected
       * distanceKm field me convert kar rahe hain.
       */
      stations = stations.map(station => ({
        ...station,
        distanceKm:
          station.distanceKm !== undefined
            ? station.distanceKm
            : station.distance || 0
      }));

      console.log(
        "REAL OCM STATIONS FOR:",
        pendingStationSearch,
        stations
      );

    } catch (err) {

      console.error(
        "Unable to load nearby OCM stations:",
        err
      );

      stations = [];
    }

  } else {

    /*
     * Normal stations page open hone par existing backend
     * stations load honge.
     */
    stations = await fetchStations();

  }

  let currentTab = "all";
  let currentFiltered = stations;

  /*
   * ---------------------------------------------------------
   * MAP
   * ---------------------------------------------------------
   */
  initStationMap(
    stations,
    handleMarkerClick
  );

  /*
   * ---------------------------------------------------------
   * FILTERS
   * ---------------------------------------------------------
   */
  const getActiveFilters = () => ({

    distances:
      Array.from(
        document.querySelectorAll(
          'input[name="distance"]:checked'
        )
      ).map(cb =>
        parseInt(cb.value, 10)
      ),

    chargerTypes:
      Array.from(
        document.querySelectorAll(
          'input[name="chargerType"]:checked'
        )
      ).map(cb => cb.value),

    connectors:
      Array.from(
        document.querySelectorAll(
          'input[name="connector"]:checked'
        )
      ).map(cb => cb.value),

    speeds:
      Array.from(
        document.querySelectorAll(
          'input[name="speed"]:checked'
        )
      ).map(cb => cb.value)

  });

  /*
   * ---------------------------------------------------------
   * RENDER + FILTER
   * ---------------------------------------------------------
   */
  function applyFiltersAndRender() {

    const searchInput =
      document.getElementById(
        "station-search-input"
      );

    const query =
      searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";

    const filters = getActiveFilters();

    let base = stations;

    /*
     * "mine" tab
     */
    if (currentTab === "mine") {

      base = stations.filter(
        station => station.available > 0
      );

    }

    /*
     * "nearby" tab
     */
    if (currentTab === "nearby") {

      base = [...stations].sort(
        (a, b) =>
          (a.distanceKm || Infinity) -
          (b.distanceKm || Infinity)
      );

    }

    let filtered = base.filter(station => {

      /*
       * Search text
       */
      if (
        query &&
        !(
          String(station.name || "")
            .toLowerCase()
            .includes(query) ||

          String(station.address || "")
            .toLowerCase()
            .includes(query)
        )
      ) {
        return false;
      }

      /*
       * Charger type
       */
      if (
        filters.chargerTypes.length &&
        !filters.chargerTypes.includes(
          station.chargerType
        )
      ) {
        return false;
      }

      /*
       * Connector
       */
      if (
        filters.connectors.length &&
        !filters.connectors.includes(
          station.connector
        )
      ) {
        return false;
      }

      /*
       * Speed
       */
      if (
        filters.speeds.length &&
        !filters.speeds.includes(
          station.speed
        )
      ) {
        return false;
      }

      /*
       * Distance filter
       */
      if (filters.distances.length) {

        const stationDistance =
          station.distanceKm;

        if (
          stationDistance === undefined ||
          stationDistance === null
        ) {
          return false;
        }

        let maxDist =
          Math.max(...filters.distances);

        if (stationDistance > maxDist) {
          return false;
        }
      }

      return true;
    });

    currentFiltered = filtered;

    renderStationCards(filtered);

    plotStations(
      filtered,
      handleMarkerClick
    );

    if (query && filtered.length) {
      fitMapToStations(filtered);
    }

    return filtered;
  }

  /*
   * ---------------------------------------------------------
   * CITY SEARCH
   * ---------------------------------------------------------
   */
  async function handleSearch() {

    const input =
      document.getElementById(
        "station-search-input"
      );

    const searchBtn =
      document.getElementById(
        "station-search-btn"
      );

    const query =
      input
        ? input.value.trim()
        : "";

    if (!query) {

      applyFiltersAndRender();

      return;
    }

    const originalLabel =
      searchBtn
        ? searchBtn.innerHTML
        : "";

    if (searchBtn) {

      searchBtn.disabled = true;

      searchBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i>';

    }

    try {

      showToast(
        "Finding real charging stations near " +
        query +
        "...",
        "info"
      );

      /*
       * IMPORTANT:
       * MongoDB stations use nahi kar rahe.
       *
       * Direct OCM nearby search.
       */
      let nearbyStations =
        await fetchNearbyStations(query);

      /*
       * Backend response ko UI format me normalize karo.
       */
      nearbyStations =
        nearbyStations.map(station => ({

          ...station,

          distanceKm:
            station.distanceKm !== undefined
              ? station.distanceKm
              : station.distance || 0

        }));

      /*
       * IMPORTANT:
       * Purane MongoDB stations replace.
       */
      stations = nearbyStations;

      /*
       * Current result save.
       */
      window.currentStations = stations;

      window.currentSearchCity = query;

      /*
       * Nearby tab active.
       */
      currentTab = "nearby";

      document
        .querySelectorAll(
          ".stations-tabs .tab-btn"
        )
        .forEach(tab => {

          tab.classList.remove("active");

        });

      const nearbyTab =
        document.querySelector(
          '.stations-tabs .tab-btn[data-tab="nearby"]'
        );

      if (nearbyTab) {
        nearbyTab.classList.add("active");
      }

      /*
       * Render REAL OCM stations.
       */
      currentFiltered = stations;

      renderStationCards(stations);

      plotStations(
        stations,
        handleMarkerClick
      );

      /*
       * Move map to stations.
       */
      if (stations.length) {

        fitMapToStations(stations);

        showToast(
          stations.length +
          " real charging station(s) found near " +
          query,
          "info"
        );

      } else {

        showToast(
          "No real charging stations found within 100 km of " +
          query,
          "info"
        );
      }

    } catch (err) {

      console.error(
        "REAL CITY SEARCH FAILED:",
        err
      );

      stations = [];

      currentFiltered = [];

      renderStationCards([]);

      plotStations(
        [],
        handleMarkerClick
      );

      showToast(
        "Unable to find real charging stations for " +
        query,
        "error"
      );

    } finally {

      if (searchBtn) {

        searchBtn.disabled = false;

        searchBtn.innerHTML =
          originalLabel;
      }

    }
  }

  /*
   * ---------------------------------------------------------
   * FILTER EVENTS
   * ---------------------------------------------------------
   */
  document
    .querySelectorAll(
      '.filters-panel input[type="checkbox"]'
    )
    .forEach(cb => {

      cb.addEventListener(
        "change",
        applyFiltersAndRender
      );

    });

  /*
   * Filter toggle
   */
  const filterToggleBtn =
    document.getElementById(
      "filter-toggle-btn"
    );

  const filtersBody =
    document.getElementById(
      "filters-body"
    );

  if (filterToggleBtn && filtersBody) {

    filterToggleBtn.addEventListener(
      "click",
      () => {

        filtersBody.classList.toggle(
          "collapsed"
        );

        filterToggleBtn.classList.toggle(
          "collapsed"
        );

      }
    );

  }

  /*
   * Search button
   */
  const stationSearchBtn =
    document.getElementById(
      "station-search-btn"
    );

  if (stationSearchBtn) {

    stationSearchBtn.addEventListener(
      "click",
      handleSearch
    );

  }

  /*
   * Search Enter key
   */
  const stationSearchInput =
    document.getElementById(
      "station-search-input"
    );

  if (stationSearchInput) {

    stationSearchInput.addEventListener(
      "keyup",
      e => {

        if (e.key === "Enter") {
          handleSearch();
        }

      }
    );

  }

  /*
   * ---------------------------------------------------------
   * TABS
   * ---------------------------------------------------------
   */
  document
    .querySelectorAll(
      ".stations-tabs .tab-btn"
    )
    .forEach(tab => {

      tab.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".stations-tabs .tab-btn"
            )
            .forEach(t =>
              t.classList.remove("active")
            );

          tab.classList.add("active");

          currentTab =
            tab.dataset.tab;

          applyFiltersAndRender();

          if (
            typeof stationMap !== "undefined" &&
            stationMap
          ) {
            stationMap.invalidateSize();
          }
        }
      );

    });

  /*
   * ---------------------------------------------------------
   * USER LOCATION
   * ---------------------------------------------------------
   *
   * Existing feature kept.
   */
  async function goToUserLocation(triggerBtn) {

    let originalLabel;

    if (triggerBtn) {

      originalLabel =
        triggerBtn.innerHTML;

      triggerBtn.disabled = true;

      triggerBtn.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Locating...';
    }

    try {

      const pos =
        await locateUser();

      /*
       * Current loaded stations ko distance ke
       * according sort karo.
       */
      stations =
        sortStationsByDistance(
          stations,
          pos
        );

      currentTab = "nearby";

      document
        .querySelectorAll(
          ".stations-tabs .tab-btn"
        )
        .forEach(t =>
          t.classList.remove("active")
        );

      const nearbyTab =
        document.querySelector(
          '.tab-btn[data-tab="nearby"]'
        );

      if (nearbyTab) {
        nearbyTab.classList.add("active");
      }

    } catch (err) {

      console.log(
        "Location not available:",
        err.message
      );

      let reason =
        "Couldn't get your location.";

      if (err.code === 1) {

        reason =
          "Location permission was denied.";

      } else if (err.code === 2) {

        reason =
          "Your device couldn't determine a position.";

      } else if (err.code === 3) {

        reason =
          "Location request timed out.";

      }

      showToast(
        reason,
        "error"
      );

    } finally {

      if (triggerBtn) {

        triggerBtn.disabled = false;

        triggerBtn.innerHTML =
          originalLabel;
      }

      applyFiltersAndRender();

      if (
        typeof stationMap !== "undefined" &&
        stationMap
      ) {
        stationMap.invalidateSize();
      }

    }
  }

  /*
   * User location button
   */
  const useLocationBtn =
    document.getElementById(
      "use-location-btn"
    );

  if (useLocationBtn) {

    useLocationBtn.addEventListener(
      "click",
      function () {
        goToUserLocation(this);
      }
    );

  }

  /*
   * Detail panel
   */
  const detailPanel =
    document.getElementById(
      "station-detail-panel"
    );

  if (detailPanel) {

    detailPanel.addEventListener(
      "click",
      e => {

        if (
          e.target.closest(
            "[data-panel-close]"
          )
        ) {
          closeStationDetailPanel();
        }

      }
    );

  }

  /*
   * ---------------------------------------------------------
   * INITIAL RENDER
   * ---------------------------------------------------------
   */

  if (pendingStationSearch) {

    /*
     * Home page se city search aayi thi.
     *
     * Stations already OCM se load ho chuke hain.
     */
    const searchedCity =
      pendingStationSearch;

    pendingStationSearch = null;

    if (stationSearchInput) {
      stationSearchInput.value =
        searchedCity;
    }

    currentTab = "nearby";

    document
      .querySelectorAll(
        ".stations-tabs .tab-btn"
      )
      .forEach(t =>
        t.classList.remove("active")
      );

    const nearbyTab =
      document.querySelector(
        '.tab-btn[data-tab="nearby"]'
      );

    if (nearbyTab) {
      nearbyTab.classList.add("active");
    }

    renderStationCards(
      stations
    );

    plotStations(
      stations,
      handleMarkerClick
    );

    if (stations.length) {
      fitMapToStations(stations);
    }

  } else {

    /*
     * Normal station page.
     */
    applyFiltersAndRender();

    /*
     * Existing behavior:
     * browser location for currently loaded stations.
     *
     * NOTE:
     * City search still uses OCM directly.
     */
    goToUserLocation(null);
  }
}



function renderStationCards(stations) {
  let listEl = document.getElementById("station-list");
  if (!listEl) return;

  if (!stations.length) {
    listEl.innerHTML = "<p class=\"text-center px-4 py-12 text-text-muted\">No stations match your search.</p>";
    return;
  }

  listEl.innerHTML = stations
    .map(station => {
      let distanceLabel = station.distanceKm !== undefined ? station.distanceKm.toFixed(1) + " km" : "";
      let bookDisabled = station.available <= 0 ? "disabled" : "";
      let bookLabel = station.available <= 0 ? "Unavailable" : "Book Slot";
      const favActive = isFavorited(station.id);
      const favIcon = favActive ? "fa-solid fa-heart" : "fa-regular fa-heart";
      return (
        '<div class="flex gap-3.5 bg-surface border border-border rounded-lg shadow-card p-3.5 [&.highlighted]:border-primary [&.highlighted]:shadow-[0_0_0_3px_var(--color-primary-soft)]" data-station-card="' + station.id + '">' +
          '<img src="assets/images/station-1.jpg" alt="' + station.name + '" class="w-21 h-21 object-cover shrink-0 rounded-[10px]" />' +
          '<div class="flex-1 min-w-0">' +
            '<h4 class="text-xl font-bold mb-1">' + station.name + "</h4>" +
            '<div class="flex items-center gap-1.5 mb-1.5 text-sm text-text-muted"><i class="fa-solid fa-location-dot"></i>' + station.address + "</div>" +
            '<div class="text-sm text-text-muted mb-2.5">' +
              station.available + " Available" + (distanceLabel ? " - " + distanceLabel : "") +
            "</div>" +
            '<div class="flex items-center justify-between gap-2.5">' +
              '<span class="font-bold text-base">\u20B9' + station.price + " / kWh</span>" +
              '<div class="flex items-center gap-2">' +
                '<button class="flex items-center justify-center cursor-pointer shrink-0 rounded-full bg-surface border border-border text-text-muted w-8.5 h-8.5 text-base hover:border-danger hover:text-danger [&.active]:border-danger [&.active]:text-danger [&.active]:bg-[#fef2f2]' + (favActive ? " active" : "") + '" data-fav="' + station.id + '" title="Add to favorites"><i class="' + favIcon + '"></i></button>' +
                '<button class="' + BTN_PRIMARY_SM + '" data-book="' + station.id + '" ' + bookDisabled + '>' + bookLabel + "</button>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>"
      );
    })
    .join("");

  listEl.querySelectorAll("[data-book]").forEach(btn => {
    btn.addEventListener("click", () => {
      let station = stations.find(s => String(s.id) === btn.dataset.book);
      if (station) bookStation(station, btn);
    });
  });

  listEl.querySelectorAll("[data-fav]").forEach(btn => {
    btn.addEventListener("click", () => {
      let station = stations.find(s => String(s.id) === btn.dataset.fav);
      if (!station) return;
      const nowFav = toggleFavorite(station);
      btn.classList.toggle("active", nowFav);
      btn.querySelector("i").className = nowFav ? "fa-solid fa-heart" : "fa-regular fa-heart";
    });
  });

  listEl.querySelectorAll("[data-station-card]").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest("[data-book], [data-fav]")) return;
      let station = stations.find(s => String(s.id) === card.dataset.stationCard);
      if (station) handleMarkerClick(station);
    });
  });
}

function handleMarkerClick(station) {
  openStationDetailPanel(station);

  document.querySelectorAll("[data-station-card]").forEach(card => {
    card.classList.toggle("highlighted", card.dataset.stationCard === String(station.id));
  });
  const matchingCard = document.querySelector('[data-station-card="' + station.id + '"]');
  if (matchingCard) matchingCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function openStationDetailPanel(station) {
  let panel = document.getElementById("station-detail-panel");
  if (!panel) return;

  const exactDistance = typeof distanceToStationKm === "function" ? distanceToStationKm(station) : null;
  let distanceLabel = exactDistance !== null ? exactDistance + " km away" : (station.distanceKm !== undefined ? station.distanceKm.toFixed(1) + " km away" : "");
  const routeUrl = "https://www.google.com/maps/dir/?api=1&destination=" + station.lat + "," + station.lng;
  let bookDisabled = station.available <= 0 ? "disabled" : "";
  let bookLabel = station.available <= 0 ? "Unavailable" : "Book Slot";

  panel.innerHTML =
    '<button class="absolute cursor-pointer top-2.5 right-2.5 bg-transparent border-none text-text-muted text-base" data-panel-close><i class="fa-solid fa-xmark"></i></button>' +
    '<h4 class="mr-2 mb-1.5 pr-6 text-base">' + station.name + "</h4>" +
    '<div class="text-sm text-text-muted mb-2"><i class="fa-solid fa-location-dot"></i> ' + station.address + "</div>" +
    '<div class="flex flex-wrap gap-x-5 gap-y-2 text-sm mb-3.5">' +
      "<span>\u20B9" + station.price + " / kWh</span>" +
      "<span>" + station.available + " Available</span>" +
      (distanceLabel ? "<span>" + distanceLabel + "</span>" : "") +
    "</div>" +
    '<div class="flex flex-wrap gap-2.5">' +
      '<a class="' + BTN_OUTLINE_SM + '" href="' + routeUrl + '" target="_blank" rel="noopener"><i class="fa-solid fa-diamond-turn-right"></i> Route</a>' +
      '<button class="' + BTN_PRIMARY_SM + '" data-panel-book="' + station.id + '" ' + bookDisabled + '>' + bookLabel + "</button>" +
    "</div>";

  panel.classList.remove("hidden");

  const panelBookBtn = panel.querySelector("[data-panel-book]");
  if (panelBookBtn) {
    panelBookBtn.addEventListener("click", () => bookStation(station, panelBookBtn));
  }
}

function closeStationDetailPanel() {
  let panel = document.getElementById("station-detail-panel");
  if (!panel) return;
  panel.classList.add("hidden");
  panel.innerHTML = "";
  document.querySelectorAll("[data-station-card]").forEach(card => card.classList.remove("highlighted"));
}

async function bookStation(station, btn) {
  const user = checkAuthStatus();

  if (!user) {
    localStorage.setItem(
      "EV_PENDING_BOOKING_STATION",
      JSON.stringify(station)
    );

    showToast("Please login first to book a charging slot.", "error");
    loadPage("login");
    return;
  }

  const today = new Date().toISOString().split("T")[0];

  const bookingHtml =
    '<div class="space-y-4">' +

      '<div>' +
        '<p class="font-bold text-base mb-1">' + station.name + "</p>" +
        '<p class="text-sm text-text-muted">' + station.address + "</p>" +
      "</div>" +

      '<div>' +
        '<label class="block text-sm font-semibold mb-1.5" for="booking-date">' +
          "Select Date" +
        "</label>" +
        '<input ' +
          'type="date" ' +
          'id="booking-date" ' +
          'min="' + today + '" ' +
          'value="' + today + '" ' +
          'class="' + INPUT_BASE + '" ' +
        "/>" +
      "</div>" +

      '<div>' +
        '<p class="block text-sm font-semibold mb-2">Available Time Slots</p>' +
        '<div id="available-slots" class="grid grid-cols-2 gap-2.5">' +
          '<p class="text-sm text-text-muted col-span-2">Loading available slots...</p>' +
        "</div>" +
      "</div>" +

      '<p id="booking-status" class="' + FORM_STATUS_BASE + '"></p>' +

    "</div>";

  openModal("Book Charging Slot", bookingHtml);

  const dateInput = document.getElementById("booking-date");
  const slotsContainer = document.getElementById("available-slots");
  const statusEl = document.getElementById("booking-status");

  let selectedSlot = null;

  async function loadAvailableSlots() {
    const selectedDate = dateInput.value;

    selectedSlot = null;

    slotsContainer.innerHTML =
      '<p class="text-sm text-text-muted col-span-2">Loading available slots...</p>';

    statusEl.textContent = "";

    try {
      console.log("BOOKING STATION ID:", station.id);
console.log("BOOKING DATE:", selectedDate);

const slots = await fetchAvailableSlots(
  String(station.id),
  selectedDate
);

console.log("AVAILABLE SLOTS RESULT:", slots);

      if (!slots.length) {
        slotsContainer.innerHTML =
          '<p class="text-sm text-danger col-span-2">' +
          "No slots are available for this date." +
          "</p>";
        return;
      }

      slotsContainer.innerHTML = slots
        .map(slot => {
          const safeSlot = slot.replace(/"/g, "&quot;");

          return (
            '<button type="button" ' +
              'class="' +
                BTN_OUTLINE_SM +
                ' slot-btn w-full" ' +
              'data-slot="' +
                safeSlot +
              '">' +
              slot +
            "</button>"
          );
        })
        .join("");

      slotsContainer.querySelectorAll(".slot-btn").forEach(slotBtn => {
        slotBtn.addEventListener("click", () => {

          slotsContainer
            .querySelectorAll(".slot-btn")
            .forEach(btn => {
              btn.classList.remove("!bg-primary", "!text-white");
            });

          slotBtn.classList.add("!bg-primary", "!text-white");

          selectedSlot = slotBtn.dataset.slot;
        });
      });

    } catch (err) {
  console.error("AVAILABLE SLOTS ERROR:", err);

  slotsContainer.innerHTML =
    '<p class="text-sm text-danger col-span-2">' +
    (err.message || "Unable to load available slots.") +
    "</p>";
}
  }

  dateInput.addEventListener("change", loadAvailableSlots);

  // Load slots immediately
  await loadAvailableSlots();

  // Add confirm button
  const modalBody = document.getElementById("modal-body");

  modalBody.insertAdjacentHTML(
    "beforeend",
    '<button type="button" id="confirm-booking-btn" class="' +
      BTN_PRIMARY +
      ' w-full mt-4">Confirm Booking</button>'
  );

  document
    .getElementById("confirm-booking-btn")
    .addEventListener("click", async function () {

      if (!selectedSlot) {
        statusEl.textContent = "Please select a time slot.";
        statusEl.className =
          FORM_STATUS_BASE + " text-danger";
        return;
      }

      const [startTime, endTime] = selectedSlot.split("-");

      const payload = {
        stationId: station.id,
        bookingDate: dateInput.value,
        startTime: startTime + ":00",
        endTime: endTime + ":00"
      };

      const confirmBtn = this;

      confirmBtn.disabled = true;
      confirmBtn.textContent = "Booking...";

      try {
        const booking = await addBooking(payload);

        console.log("BOOKING CREATED:", booking);

        addNotification(
          "Booking confirmed at " +
          station.name +
          " for " +
          dateInput.value +
          " (" +
          selectedSlot +
          ").",
          "booking"
        );

        closeModal();

        showToast(
          "Charging slot booked successfully!",
          "info"
        );

        // Refresh booking history if profile/history is visible
        if (typeof renderBookingHistory === "function") {
          renderBookingHistory();
        }

      } catch (err) {
        console.error("Booking failed:", err);

        statusEl.textContent =
          err.message || "Unable to create booking.";

        statusEl.className =
          FORM_STATUS_BASE + " text-danger";

        confirmBtn.disabled = false;
        confirmBtn.textContent = "Confirm Booking";
      }
    });
}

function formatTime(date) {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minutesLabel = minutes < 10 ? "0" + minutes : String(minutes);
  return hours + ":" + minutesLabel + " " + suffix;
}

/* ---------- My Bookings page ---------- */
async function initBookingsPage() {
  let listEl = document.getElementById("booking-list");
  listEl.innerHTML = "<p class=\"text-center px-4 py-12 text-text-muted\">Loading your bookings...</p>";

  let bookings = await fetchBookings();
  renderBookingCards(bookings, "upcoming");

  document.querySelectorAll(".booking-tabs .tab-btn").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".booking-tabs .tab-btn").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      if (tab.dataset.status === "favorites") {
        renderFavoriteStations();
      } else {
        renderBookingCards(bookings, tab.dataset.status);
      }
    });
  });
}

function renderBookingCards(bookings, status) {
  let listEl = document.getElementById("booking-list");
  if (!listEl) return;

  let filtered = bookings.filter(b => b.status === status);

  if (!filtered.length) {
    listEl.innerHTML = '<p class="text-center px-4 py-12 text-text-muted">No bookings in this category yet.</p>';
    return;
  }

  listEl.innerHTML = filtered
    .map(booking => {
      let cancelBtn = booking.status === "upcoming"
        ? '<button class="' + BTN_DANGER_SM + '" data-cancel="' + booking.id + '">Cancel Booking</button>'
        : "";
      return (
        '<div class="flex gap-4 bg-surface border border-border rounded-lg shadow-card p-4 max-[640px]:flex-col">' +
          '<img src="assets/images/station-1.jpg" alt="' + booking.stationName + '" class="w-24 h-24 object-cover shrink-0 rounded-[10px]" />' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-start justify-between gap-3">' +
              '<h4 class="text-xl font-bold mb-1">' + booking.stationName + "</h4>" +
              '<span class="' + statusBadgeClass(booking.status) + '">' + booking.status + "</span>" +
            "</div>" +
            '<div class="flex items-center gap-1.5 mb-2.5 text-sm text-text-muted"><i class="fa-solid fa-location-dot"></i>' + booking.address + "</div>" +
            '<div class="grid [grid-template-columns:repeat(3,auto)] gap-x-7 gap-y-1.5 mb-3.5 text-sm text-text max-[640px]:[grid-template-columns:1fr]">' +
              "<span><strong>Booking ID:</strong> #" + booking.id + "</span>" +
              "<span><strong>Date:</strong> " + booking.date + "</span>" +
              "<span><strong>Time:</strong> " + booking.time + "</span>" +
            "</div>" +
            '<div class="flex gap-2.5">' +
              '<button class="' + BTN_OUTLINE_SM + '" data-view="' + booking.id + '">View Details</button>' +
              cancelBtn +
            "</div>" +
          "</div>" +
        "</div>"
      );
    })
    .join("");

  listEl.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      let booking = bookings.find(b => b.id === btn.dataset.view);
      if (!booking) return;
      let html =
        modalDetailRow("Station", booking.stationName) +
        modalDetailRow("Address", booking.address) +
        modalDetailRow("Booking ID", "#" + booking.id) +
        modalDetailRow("Date", booking.date) +
        modalDetailRow("Time", booking.time) +
        modalDetailRow("Price", "\u20B9" + booking.price + " / kWh") +
        modalDetailRow("Status", capitalize(booking.status));
      openModal("Booking Details", html);
    });
  });

  listEl.querySelectorAll("[data-cancel]").forEach(btn => {
    btn.addEventListener("click", async () => {
      let bookingId = btn.dataset.cancel;
      let target = bookings.find(b => b.id === bookingId);
      btn.disabled = true;
      btn.textContent = "Cancelling...";
      try {
        await cancelBooking(bookingId);
      } catch (err) {
        console.log("Backend not running, cancellation applied locally only");
      }
      if (target) target.status = "cancelled";
      addNotification(
        "Booking #" + bookingId + " at " + (target ? target.stationName : "the station") + " has been cancelled.",
        "cancel"
      );
      renderBookingCards(bookings, status);
      renderBookingHistory();
    });
  });
}

function modalDetailRow(label, value) {
  return '<div class="flex justify-between gap-4 py-2.5 border-b border-border last:border-b-0 text-sm"><span class="text-text-muted">' + label + "</span><strong>" + value + "</strong></div>";
}

function statusBadgeClass(status) {
  let base = "capitalize whitespace-nowrap rounded-full text-xs font-bold px-2.5 py-1";
  if (status === "upcoming") return base + " bg-[#dbeafe] text-[#1d4ed8]";
  if (status === "completed") return base + " bg-primary-soft text-primary";
  if (status === "cancelled") return base + " bg-[#fee2e2] text-danger";
  return base;
}

function renderFavoriteStations() {
  let listEl = document.getElementById("booking-list");
  if (!listEl) return;

  const favorites = getStoredFavorites();
  if (!favorites.length) {
    listEl.innerHTML = '<p class="text-center px-4 py-12 text-text-muted">No favorite stations yet. Tap the heart icon on a station in Find Stations to add one.</p>';
    return;
  }

  listEl.innerHTML = favorites
    .map(station => (
      '<div class="flex gap-4 bg-surface border border-border rounded-lg shadow-card p-4 max-[640px]:flex-col">' +
        '<img src="assets/images/station-1.jpg" alt="' + station.name + '" class="w-24 h-24 object-cover shrink-0 rounded-[10px]" />' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-start justify-between gap-3"><h4 class="text-xl font-bold mb-1">' + station.name + "</h4></div>" +
          '<div class="flex items-center gap-1.5 mb-2.5 text-sm text-text-muted"><i class="fa-solid fa-location-dot"></i>' + station.address + "</div>" +
          '<div class="grid [grid-template-columns:repeat(3,auto)] gap-x-7 gap-y-1.5 mb-3.5 text-sm text-text max-[640px]:[grid-template-columns:1fr]">' +
            "<span><strong>Price:</strong> \u20B9" + station.price + " / kWh</span>" +
            "<span><strong>Available:</strong> " + station.available + "</span>" +
          "</div>" +
          '<div class="flex gap-2.5">' +
            '<button class="' + BTN_DANGER_SM + '" data-remove-fav="' + station.id + '">Remove from Favorites</button>' +
          "</div>" +
        "</div>" +
      "</div>"
    ))
    .join("");

  listEl.querySelectorAll("[data-remove-fav]").forEach(btn => {
    btn.addEventListener("click", () => {
      let station = favorites.find(s => String(s.id) === btn.dataset.removeFav);
      if (station) toggleFavorite(station);
      renderFavoriteStations();
    });
  });
}

/* ---------- Contact page ---------- */
function initContactPage() {
  let form = document.getElementById("contact-form");
  let statusEl = document.getElementById("contact-status");

  form.addEventListener("submit", async e => {
    e.preventDefault();
    let submitBtn = document.getElementById("contact-submit-btn");
    submitBtn.disabled = true;
    statusEl.textContent = "";
    statusEl.className = FORM_STATUS_BASE;

    let payload = {
      name: document.getElementById("contact-name").value,
      email: document.getElementById("contact-email").value,
      subject: document.getElementById("contact-subject").value,
      message: document.getElementById("contact-message").value
    };

    try {
      await sendContactForm(payload);
      statusEl.textContent = "Message sent! Our team will get back to you shortly.";
      statusEl.classList.add("text-primary");
      addNotification("Your support message about \"" + payload.subject + "\" was sent.", "contact");
      form.reset();
    } catch (err) {
      console.log("Backend not running, queuing contact message locally");
      statusEl.textContent = "Message queued locally - connect the backend to deliver it.";
      statusEl.classList.add("text-primary");
      addNotification("Your support message about \"" + payload.subject + "\" was queued.", "contact");
      form.reset();
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* ---------- Profile page ---------- */
async function initProfilePage() {
  const loggedInUser = checkAuthStatus();

  if (!loggedInUser) {
    appContent.innerHTML =
      '<div class="text-center px-4 py-12 text-text-muted">' +
        "<p>Please login to view and edit your profile.</p>" +
        '<button class="' + BTN_PRIMARY + ' mt-4' + '" id="go-to-login-btn">Login</button>' +
      "</div>";
    document.getElementById("go-to-login-btn").addEventListener("click", () => loadPage("login"));
    return;
  }

  const profile = await fetchProfile();
  renderProfileHeader(profile);
  renderProfileView(profile);
  renderPaymentMethods();
  renderBookingHistory();

  document.getElementById("edit-profile-btn").addEventListener("click", () => renderProfileEdit(profile));
  document.getElementById("change-password-link").addEventListener("click", e => {
    e.preventDefault();
    openChangePasswordModal();
  });
  document.getElementById("notification-settings-link").addEventListener("click", e => {
    e.preventDefault();
    openNotificationSettingsModal();
  });
  document.getElementById("add-payment-btn").addEventListener("click", () => openAddPaymentModal());
}

function renderProfileHeader(profile) {
  document.getElementById("profile-name").textContent = profile.fullName || "--";
  document.getElementById("profile-email-small").textContent = profile.email || "";
  document.getElementById("profile-avatar").textContent = getInitials(profile.fullName);
}

function renderProfileView(profile) {
  let detailsEl = document.getElementById("profile-details");
  detailsEl.innerHTML =
    profileRow("Full Name:", profile.fullName || "--") +
    profileRow("Email:", profile.email || "--") +
    profileRow("Phone:", profile.phone || "--") +
    profileRow("Vehicle:", profile.vehicle || "--") +
    profileRow("Preferred Charger:", profile.preferredCharger || "--");
}

function profileRow(label, value) {
  return '<div class="flex py-3.5 border-b border-border last:border-b-0 text-sm"><span class="w-45 shrink-0 font-semibold text-text max-[860px]:w-32.5">' + label + '</span><span class="text-text-muted">' + value + "</span></div>";
}

function renderProfileEdit(profile) {
  let detailsEl = document.getElementById("profile-details");
  detailsEl.innerHTML =
    editField("edit-fullname", "Full Name", profile.fullName) +
    editField("edit-email", "Email", profile.email, "email") +
    editField("edit-phone", "Phone", profile.phone, "tel") +
    editField("edit-vehicle", "Vehicle", profile.vehicle) +
    editField("edit-charger", "Preferred Charger", profile.preferredCharger) +
    '<div class="flex gap-2.5 pt-4">' +
      '<button class="' + BTN_PRIMARY_SM + '" id="save-profile-btn">Save Changes</button>' +
      '<button class="' + BTN_OUTLINE_SM + '" id="cancel-profile-edit-btn">Cancel</button>' +
    "</div>";

  document.getElementById("save-profile-btn").addEventListener("click", async function () {
    let btn = this;
    btn.disabled = true;
    btn.textContent = "Saving...";

    const updated = {
      fullName: document.getElementById("edit-fullname").value.trim() || profile.fullName,
      email: document.getElementById("edit-email").value.trim(),
      phone: document.getElementById("edit-phone").value.trim(),
      vehicle: document.getElementById("edit-vehicle").value.trim(),
      preferredCharger: document.getElementById("edit-charger").value.trim()
    };

    const saved = await updateProfile(updated);

    const authUser = checkAuthStatus();
    if (authUser) {
      authUser.name = saved.fullName;
      authUser.email = saved.email;
      setStorage(CONFIG.AUTH_USER_KEY, authUser);
    }

    renderProfileHeader(saved);
    renderProfileView(saved);
    renderNavbarAuthState();
    addNotification("Your profile was updated successfully.", "profile");
  });

  document.getElementById("cancel-profile-edit-btn").addEventListener("click", () => renderProfileView(profile));
}

function editField(id, label, value, type) {
  const inputType = type || "text";
  return (
    '<div class="flex flex-col items-start gap-1.5 py-3.5 border-b border-border last:border-b-0 text-sm">' +
      '<label class="text-sm text-text-muted font-semibold" for="' + id + '">' + label + "</label>" +
      '<input class="' + INPUT_BASE + '" type="' + inputType + '" id="' + id + '" value="' + (value || "").replace(/"/g, "&quot;") + '" />' +
    "</div>"
  );
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function renderBookingHistory() {
  const historyEl = document.getElementById("history-list");
  if (!historyEl) return;

  let bookings = getStoredBookings();
  if (!bookings.length) {
    historyEl.innerHTML = '<p class="text-center px-4 py-12 text-text-muted">No bookings yet.</p>';
    return;
  }

  let iconFor = { completed: "fa-circle-check", cancelled: "fa-circle-xmark", upcoming: "fa-clock" };

  historyEl.innerHTML = bookings
    .map(b => {
      let cancelBtn = b.status === "upcoming"
        ? '<button class="' + BTN_DANGER_SM + '" data-history-cancel="' + b.id + '">Cancel</button>'
        : "";
      return (
        '<div class="flex items-center flex-wrap gap-2.5 text-sm pb-3.5 border-b border-border last:border-b-0">' +
          '<i class="fa-solid ' + (iconFor[b.status] || "fa-clock") + ' text-primary"></i>' +
          "<span>" + b.stationName + "</span>" +
          '<span class="' + statusBadgeClass(b.status) + '">' + capitalize(b.status) + "</span>" +
          '<span class="text-text-muted ml-auto">' + b.date + " &middot; " + b.time + "</span>" +
          cancelBtn +
        "</div>"
      );
    })
    .join("");

  historyEl.querySelectorAll("[data-history-cancel]").forEach(btn => {
    btn.addEventListener("click", async () => {
      let bookingId = btn.dataset.historyCancel;
      btn.disabled = true;
      btn.textContent = "Cancelling...";
      try {
        await cancelBooking(bookingId);
      } catch (err) {
        console.log("Backend not running, cancellation applied locally only");
      }
      addNotification("Booking #" + bookingId + " has been cancelled.", "cancel");
      renderBookingHistory();
    });
  });
}

function openResetPasswordModal(resetToken) {
  if (!resetToken) {
    showToast("Invalid or expired reset link.", "error");
    return;
  }

  const html =
    '<form id="reset-password-form">' +

      '<div class="mb-4">' +
        '<label class="block text-sm font-semibold mb-1.5" for="reset-new-password">' +
          'New Password' +
        '</label>' +
        '<input class="' + INPUT_BASE + '" ' +
          'type="password" ' +
          'id="reset-new-password" ' +
          'minlength="6" ' +
          'placeholder="Enter new password" ' +
          'required />' +
      '</div>' +

      '<div class="mb-4">' +
        '<label class="block text-sm font-semibold mb-1.5" for="reset-confirm-password">' +
          'Confirm New Password' +
        '</label>' +
        '<input class="' + INPUT_BASE + '" ' +
          'type="password" ' +
          'id="reset-confirm-password" ' +
          'minlength="6" ' +
          'placeholder="Confirm new password" ' +
          'required />' +
      '</div>' +

      '<p class="' + FORM_STATUS_BASE + '" id="reset-password-status"></p>' +

      '<button type="submit" id="reset-password-submit-btn" class="' +
        BTN_PRIMARY +
        ' w-full">Reset Password</button>' +

    '</form>';

  openModal("Reset Password", html);

  const form = document.getElementById("reset-password-form");
  const statusEl = document.getElementById("reset-password-status");
  const submitBtn = document.getElementById("reset-password-submit-btn");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const newPassword =
      document.getElementById("reset-new-password").value;

    const confirmPassword =
      document.getElementById("reset-confirm-password").value;

    statusEl.textContent = "";
    statusEl.className = FORM_STATUS_BASE;

    if (newPassword.length < 6) {
      statusEl.textContent =
        "Password must be at least 6 characters.";
      statusEl.className =
        FORM_STATUS_BASE + " text-danger";
      return;
    }

    if (newPassword !== confirmPassword) {
      statusEl.textContent = "Passwords do not match.";
      statusEl.className =
        FORM_STATUS_BASE + " text-danger";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Resetting...";

    try {
      const url =
        CONFIG.API_BASE_URL +
        "/users/reset-password?token=" +
        encodeURIComponent(resetToken) +
        "&newPassword=" +
        encodeURIComponent(newPassword);

      const response = await fetch(url, {
        method: "POST"
      });

      const message = await response.text();

      if (!response.ok) {
        throw new Error(
          message || "Unable to reset password."
        );
      }

      statusEl.textContent =
        message || "Password reset successfully.";

      statusEl.className =
        FORM_STATUS_BASE + " text-primary";

      showToast(
        "Password reset successfully. You can login now.",
        "info"
      );

      // URL se token hata do
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      setTimeout(() => {
        closeModal();
        loadPage("login");
      }, 1200);

    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);

      statusEl.textContent =
        err.message || "Unable to reset password.";

      statusEl.className =
        FORM_STATUS_BASE + " text-danger";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Reset Password";
    }
  });
}

function openChangePasswordModal() {
  let html =
    '<form id="change-password-form">' +
      '<div class="mb-4"><label class="block text-sm font-semibold mb-1.5" for="cp-current">Current Password</label><input class="' + INPUT_BASE + '" type="password" id="cp-current" required /></div>' +
      '<div class="mb-4"><label class="block text-sm font-semibold mb-1.5" for="cp-new">New Password</label><input class="' + INPUT_BASE + '" type="password" id="cp-new" minlength="6" required /></div>' +
      '<div class="mb-4"><label class="block text-sm font-semibold mb-1.5" for="cp-confirm">Confirm New Password</label><input class="' + INPUT_BASE + '" type="password" id="cp-confirm" minlength="6" required /></div>' +
      '<p class="' + FORM_STATUS_BASE + '" id="cp-status"></p>' +
      '<button type="submit" class="' + BTN_PRIMARY + ' w-full' + '">Update Password</button>' +
    "</form>";

  openModal("Change Password", html);

  document.getElementById("change-password-form").addEventListener("submit", e => {
    e.preventDefault();
    let statusEl = document.getElementById("cp-status");
    const newPass = document.getElementById("cp-new").value;
    const confirmPass = document.getElementById("cp-confirm").value;

    if (newPass.length < 6) {
      statusEl.textContent = "Password must be at least 6 characters.";
      statusEl.className = FORM_STATUS_BASE + " text-danger";
      return;
    }
    if (newPass !== confirmPass) {
      statusEl.textContent = "New password and confirmation do not match.";
      statusEl.className = FORM_STATUS_BASE + " text-danger";
      return;
    }

    addNotification("Your password was changed successfully.", "profile");
    closeModal();
  });
}

function openNotificationSettingsModal() {
  const prefs = getNotificationPrefs();
  let html =
    '<form id="notif-settings-form">' +
      '<label class="flex items-center cursor-pointer gap-2.5 py-2.5 text-sm"><input type="checkbox" class="w-4.5 h-4.5 accent-primary" id="ns-booking" ' + (prefs.bookingUpdates ? "checked" : "") + " /> Booking &amp; cancellation alerts</label>" +
      '<label class="flex items-center cursor-pointer gap-2.5 py-2.5 text-sm"><input type="checkbox" class="w-4.5 h-4.5 accent-primary" id="ns-promo" ' + (prefs.promotions ? "checked" : "") + " /> Promotional offers</label>" +
      '<label class="flex items-center cursor-pointer gap-2.5 py-2.5 text-sm"><input type="checkbox" class="w-4.5 h-4.5 accent-primary" id="ns-sms" ' + (prefs.sms ? "checked" : "") + " /> SMS alerts</label>" +
      '<button type="submit" class="' + BTN_PRIMARY + ' w-full mt-4' + '">Save Preferences</button>' +
    "</form>";

  openModal("Notification Settings", html);

  document.getElementById("notif-settings-form").addEventListener("submit", e => {
    e.preventDefault();
    saveNotificationPrefs({
      bookingUpdates: document.getElementById("ns-booking").checked,
      promotions: document.getElementById("ns-promo").checked,
      sms: document.getElementById("ns-sms").checked
    });
    addNotification("Notification preferences updated.", "profile");
    closeModal();
  });
}

function renderPaymentMethods() {
  let listEl = document.getElementById("payment-list");
  const payments = getStoredPayments();

  if (!payments.length) {
    listEl.innerHTML = '<p class="text-center px-4 py-12 text-text-muted">No payment methods added yet.</p>';
    return;
  }

  const brandMeta = {
    visa: { cls: "bg-[#1a1f71] text-white", icon: "fa-brands fa-cc-visa" },
    mastercard: { cls: "bg-[#16191f] text-white", icon: "fa-brands fa-cc-mastercard" },
    card: { cls: "bg-text-muted text-white", icon: "fa-solid fa-credit-card" }
  };

  listEl.innerHTML = payments
    .map(p => {
      const meta = brandMeta[p.brand] || brandMeta.card;
      return (
        '<div class="flex items-center gap-4 border border-border rounded-md px-4 py-3.5">' +
          '<span class="flex items-center justify-center shrink-0 w-11.5 h-8 rounded-[6px] text-2xl ' + meta.cls + '"><i class="' + meta.icon + '"></i></span>' +
          '<div class="flex-1">' +
            '<p class="m-0 text-sm font-semibold">' + capitalize(p.brand) + " **** " + p.last4 + "</p>" +
            '<span class="text-xs text-text-muted">Exp: ' + p.expiry + "</span>" +
          "</div>" +
          '<button class="' + BTN_OUTLINE_SM + '" data-remove-payment="' + p.id + '">Remove</button>' +
        "</div>"
      );
    })
    .join("");

  listEl.querySelectorAll("[data-remove-payment]").forEach(btn => {
    btn.addEventListener("click", () => {
      removePayment(btn.dataset.removePayment);
      renderPaymentMethods();
    });
  });
}

function openAddPaymentModal() {
  let html =
    '<form id="add-payment-form">' +
      '<div class="mb-4"><label class="block text-sm font-semibold mb-1.5" for="pay-name">Cardholder Name</label><input class="' + INPUT_BASE + '" type="text" id="pay-name" required /></div>' +
      '<div class="mb-4"><label class="block text-sm font-semibold mb-1.5" for="pay-number">Card Number</label><input class="' + INPUT_BASE + '" type="text" id="pay-number" inputmode="numeric" maxlength="19" placeholder="1234 5678 9012 3456" required /></div>' +
      '<div class="grid gap-4 [grid-template-columns:1fr_1fr]">' +
        '<div class="mb-4"><label class="block text-sm font-semibold mb-1.5" for="pay-expiry">Expiry (MM/YY)</label><input class="' + INPUT_BASE + '" type="text" id="pay-expiry" placeholder="MM/YY" maxlength="5" required /></div>' +
        '<div class="mb-4"><label class="block text-sm font-semibold mb-1.5" for="pay-cvv">CVV</label><input class="' + INPUT_BASE + '" type="password" id="pay-cvv" maxlength="4" required /></div>' +
      "</div>" +
      '<p class="' + FORM_STATUS_BASE + '" id="pay-status"></p>' +
      '<button type="submit" class="' + BTN_PRIMARY + ' w-full' + '">Save Card</button>' +
    "</form>";

  openModal("Add Payment Method", html);

  document.getElementById("add-payment-form").addEventListener("submit", e => {
    e.preventDefault();
    let statusEl = document.getElementById("pay-status");
    const rawNumber = document.getElementById("pay-number").value.replace(/\s+/g, "");
    const expiry = document.getElementById("pay-expiry").value.trim();
    let name = document.getElementById("pay-name").value.trim();

    if (!/^\d{13,19}$/.test(rawNumber)) {
      statusEl.textContent = "Enter a valid card number.";
      statusEl.className = FORM_STATUS_BASE + " text-danger";
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      statusEl.textContent = "Enter expiry as MM/YY.";
      statusEl.className = FORM_STATUS_BASE + " text-danger";
      return;
    }

    addPayment({ name, number: rawNumber, expiry });
    addNotification("New payment method added.", "profile");
    closeModal();
    renderPaymentMethods();
  });
}


/* ---------- Login / Register page ---------- */
function initLoginPage() {
  const form = document.getElementById("login-form");
  const statusEl = document.getElementById("login-status");

  const togglePassword = document.getElementById("toggle-password");
  const passwordInput = document.getElementById("login-password");

  const registerToggleLink = document.getElementById("register-toggle-link");
  const registerToggleLabel = document.getElementById("register-toggle-label");

  const registerFields = document.getElementById("register-fields");
  const confirmPasswordWrapper = document.getElementById(
    "register-confirm-password-wrapper"
  );
  const identifierWrapper = document.getElementById(
    "login-identifier-wrapper"
  );

  const heading = document.getElementById("login-heading");
  const subheading = document.getElementById("login-subheading");

  const forgotPasswordLink = document.getElementById(
    "forgot-password-link"
  );

  const submitBtn = document.getElementById("login-submit-btn");

  let isRegisterMode = false;

  /* =========================================================
     1. PASSWORD SHOW / HIDE
     ========================================================= */

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      passwordInput.type =
        passwordInput.type === "password"
          ? "text"
          : "password";
    });
  }


  /* =========================================================
     2. FORGOT PASSWORD
     ========================================================= */

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("Forgot Password clicked");

      openForgotPasswordModal();
    });
  } else {
    console.error(
      "ERROR: #forgot-password-link was not found in login.html"
    );
  }


  /* =========================================================
     3. LOGIN <-> REGISTER TOGGLE
     ========================================================= */

  if (registerToggleLink) {
    registerToggleLink.addEventListener("click", (e) => {
      e.preventDefault();

      isRegisterMode = !isRegisterMode;

      if (registerFields) {
        registerFields.classList.toggle(
          "hidden",
          !isRegisterMode
        );
      }

      if (confirmPasswordWrapper) {
        confirmPasswordWrapper.classList.toggle(
          "hidden",
          !isRegisterMode
        );
      }

      if (identifierWrapper) {
        identifierWrapper.classList.toggle(
          "hidden",
          isRegisterMode
        );
      }

      if (heading) {
        heading.textContent = isRegisterMode
          ? "Create Your Account"
          : "Welcome Back!";
      }

      if (subheading) {
        subheading.textContent = isRegisterMode
          ? "Sign up to start booking charging slots"
          : "Login to continue your journey";
      }

      if (submitBtn) {
        submitBtn.textContent = isRegisterMode
          ? "Register"
          : "Login";
      }

      if (registerToggleLabel) {
        registerToggleLabel.textContent = isRegisterMode
          ? "Already have an account?"
          : "Don't have an account?";
      }

      registerToggleLink.textContent = isRegisterMode
        ? "Login"
        : "Register";
    });
  } else {
    console.error(
      "ERROR: #register-toggle-link was not found in login.html"
    );
  }


  /* =========================================================
     4. LOGIN FORM
     ========================================================= */

  if (!form) {
    console.error(
      "ERROR: #login-form was not found in login.html"
    );
    return;
  }

  if (!passwordInput) {
    console.error(
      "ERROR: #login-password was not found in login.html"
    );
    return;
  }

  if (!submitBtn) {
    console.error(
      "ERROR: #login-submit-btn was not found in login.html"
    );
    return;
  }


  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (statusEl) {
      statusEl.textContent = "";
      statusEl.className = FORM_STATUS_BASE;
    }


    /* ---------- REGISTER VALIDATION ---------- */

    if (isRegisterMode) {
      const confirmPasswordEl =
        document.getElementById(
          "register-confirm-password"
        );

      const password = passwordInput.value;

      const confirmPassword =
        confirmPasswordEl
          ? confirmPasswordEl.value
          : "";

      if (password !== confirmPassword) {
        showToast(
          "Passwords do not match.",
          "error"
        );
        return;
      }
    }


    submitBtn.disabled = true;


    /* ---------- GET LOGIN DATA ---------- */

    const loginIdentifierEl =
      document.getElementById(
        "login-identifier"
      );

    const registerEmailEl =
      document.getElementById(
        "register-email"
      );

    const identifier = isRegisterMode
      ? registerEmailEl
        ? registerEmailEl.value
        : ""
      : loginIdentifierEl
        ? loginIdentifierEl.value
        : "";

    const password = passwordInput.value;


    /* ---------- REGISTER DATA ---------- */

    const registerInfo = isRegisterMode
      ? {
          fullName:
            document.getElementById(
              "register-fullname"
            )?.value || "",

          email:
            document.getElementById(
              "register-email"
            )?.value || ""
        }
      : null;


    /* =======================================================
       LOGIN API
       ======================================================= */

    try {

      const user = await loginUser(
        identifier,
        password,
        registerInfo
      );


      if (statusEl) {
        statusEl.textContent =
          "Welcome back, " +
          user.name +
          "!";

        statusEl.classList.add(
          "text-primary"
        );
      }


      renderNavbarAuthState();


      /* ---------- AFTER LOGIN ---------- */

      setTimeout(() => {

        const pendingStation =
          localStorage.getItem(
            "EV_PENDING_BOOKING_STATION"
          );


        if (pendingStation) {

          const station =
            JSON.parse(
              pendingStation
            );
 
          localStorage.removeItem(
            "EV_PENDING_BOOKING_STATION"
          );


          loadPage("stations")
            .then(() => {
              bookStation(
                station,
                null
              );
            });

        } else {

          loadPage("home");

        }

      }, 500);


    } catch (err) {

      console.error(
        "LOGIN ERROR:",
        err
      );


      if (statusEl) {
        statusEl.textContent =
          "Login failed. Please check your details and try again.";

        statusEl.classList.add(
          "text-danger"
        );
      }

    } finally {

      submitBtn.disabled = false;

    }

  });
}


function openForgotPasswordModal() {
  const html =
    '<form id="forgot-password-form">' +

      '<div class="mb-4">' +
        '<label class="block text-sm font-semibold mb-1.5" for="forgot-email">' +
          'Registered Email' +
        '</label>' +

        '<input ' +
          'class="' + INPUT_BASE + '" ' +
          'type="email" ' +
          'id="forgot-email" ' +
          'placeholder="Enter your registered email" ' +
          'required ' +
        '/>' +
      '</div>' +

      '<p class="' + FORM_STATUS_BASE + '" id="forgot-status"></p>' +

      '<button type="submit" id="forgot-submit-btn" class="' +
        BTN_PRIMARY +
        ' w-full">' +
        'Send Reset Link' +
      '</button>' +

    '</form>';

  openModal("Forgot Password", html);

  const form = document.getElementById("forgot-password-form");
  const statusEl = document.getElementById("forgot-status");
  const submitBtn = document.getElementById("forgot-submit-btn");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const email = document.getElementById("forgot-email").value.trim();

    if (!email) {
      statusEl.textContent = "Please enter your email address.";
      statusEl.className = FORM_STATUS_BASE + " text-danger";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    statusEl.textContent = "";
    statusEl.className = FORM_STATUS_BASE;

    try {
      const url =
        CONFIG.API_BASE_URL +
        "/users/forgot-password?email=" +
        encodeURIComponent(email);

      const response = await fetch(url, {
        method: "POST"
      });

      const message = await response.text();

      if (!response.ok) {
        throw new Error(
          message || "Unable to send password reset link."
        );
      }

      statusEl.textContent =
        "Password reset link has been sent to your email. Please check your inbox.";

      statusEl.className =
        FORM_STATUS_BASE + " text-primary";

      showToast(
        "Password reset link sent successfully.",
        "success"
      );

      // Don't display the reset token in the browser.
      console.log("FORGOT PASSWORD RESPONSE:", message);

      submitBtn.textContent = "Email Sent";

    } catch (err) {

      console.error("FORGOT PASSWORD ERROR:", err);

      statusEl.textContent =
        err.message || "Something went wrong.";

      statusEl.className =
        FORM_STATUS_BASE + " text-danger";

      submitBtn.disabled = false;
      submitBtn.textContent = "Send Reset Link";
    }
  });
}


