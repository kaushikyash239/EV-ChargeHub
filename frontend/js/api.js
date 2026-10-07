
const sampleStations = [
  { id: 1, name: "GreenVolt Charging Station", address: "Connaught Place, New Delhi, DL", lat: 28.6315, lng: 77.2167, available: 5, price: 8, chargerType: "ac", connector: "type2", speed: "standard" },
  { id: 2, name: "ChargePoint City Center", address: "Cyber Hub, Gurugram, HR", lat: 28.4950, lng: 77.0890, available: 5, price: 10, chargerType: "dc", connector: "ccs", speed: "fast" },
  { id: 3, name: "VoltHub Downtown", address: "Sector 18, Noida, UP", lat: 28.5708, lng: 77.3260, available: 2, price: 9, chargerType: "ac", connector: "type2", speed: "standard" },
  { id: 4, name: "EcoCharge Plaza", address: "Saket District Centre, New Delhi, DL", lat: 28.5245, lng: 77.2066, available: 8, price: 7.5, chargerType: "dc", connector: "chademo", speed: "fast" },
  { id: 5, name: "PowerStop Station", address: "Rohini Sector 9, New Delhi, DL", lat: 28.7128, lng: 77.1173, available: 0, price: 9.5, chargerType: "ac", connector: "type2", speed: "standard" },
  { id: 6, name: "FastLane EV Point", address: "Dwarka Sector 21, New Delhi, DL", lat: 28.5521, lng: 77.0589, available: 4, price: 11, chargerType: "dc", connector: "ccs", speed: "fast" }
];

function combineObjects(a, b) {
  const result = {};
  for (const key in a) {
    result[key] = a[key];
  }
  for (const key in b) {
    result[key] = b[key];
  }
  return result;
}

function getStorage(key, fallback) {
  if (fallback === undefined) fallback = [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function setStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getStoredBookings() {
  return getStorage(CONFIG.BOOKINGS_KEY, []);
}
function saveStoredBookings(bookings) {
  setStorage(CONFIG.BOOKINGS_KEY, bookings);
}

function getStoredFavorites() {
  return getStorage(CONFIG.FAVORITES_KEY, []);
}
function saveStoredFavorites(list) {
  setStorage(CONFIG.FAVORITES_KEY, list);
}

function isFavorited(stationId) {
  const favorites = getStoredFavorites();
  for (let i = 0; i < favorites.length; i++) {
    if (String(favorites[i].id) === String(stationId)) return true;
  }
  return false;
}

function toggleFavorite(station) {
  const favorites = getStoredFavorites();
  let idx = -1;
  for (let i = 0; i < favorites.length; i++) {
    if (String(favorites[i].id) === String(station.id)) {
      idx = i;
      break;
    }
  }
  if (idx >= 0) {
    favorites.splice(idx, 1);
    saveStoredFavorites(favorites);
    return false;
  }
  favorites.unshift(station);
  saveStoredFavorites(favorites);
  return true;
}

function getStoredNotifications() {
  return getStorage(CONFIG.NOTIFICATIONS_KEY, []);
}
function saveStoredNotifications(list) {
  setStorage(CONFIG.NOTIFICATIONS_KEY, list);
}

function addNotification(message, type) {
  const list = getStoredNotifications();
  list.unshift({
    id: Date.now(),
    message: message,
    type: type || "info",
    time: new Date().toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
    read: false
  });
  saveStoredNotifications(list.slice(0, 25));
  if (typeof renderNotificationBell === "function") renderNotificationBell();
  if (typeof showToast === "function") showToast(message, type);
}

function markAllNotificationsRead() {
  const list = getStoredNotifications();
  for (let i = 0; i < list.length; i++) {
    list[i].read = true;
  }
  saveStoredNotifications(list);
  if (typeof renderNotificationBell === "function") renderNotificationBell();
}

function getStoredPayments() {
  return getStorage(CONFIG.PAYMENTS_KEY, []);
}
function saveStoredPayments(list) {
  setStorage(CONFIG.PAYMENTS_KEY, list);
}

function detectCardBrand(number) {
  const first = number.charAt(0);
  if (first === "4") return "visa";
  if (first === "5") return "mastercard";
  return "card";
}

function addPayment(payload) {
  const list = getStoredPayments();
  const entry = {
    id: "PM" + Date.now(),
    brand: detectCardBrand(payload.number),
    last4: payload.number.slice(-4),
    expiry: payload.expiry,
    name: payload.name
  };
  list.unshift(entry);
  saveStoredPayments(list);
  return entry;
}

function removePayment(paymentId) {
  const list = getStoredPayments().filter(function (p) {
    return p.id !== paymentId;
  });
  saveStoredPayments(list);
  return list;
}

const DEFAULT_NOTIF_PREFS = { bookingUpdates: true, promotions: false, sms: false };
function getNotificationPrefs() {
  return getStorage(CONFIG.NOTIF_PREFS_KEY, DEFAULT_NOTIF_PREFS);
}
function saveNotificationPrefs(prefs) {
  setStorage(CONFIG.NOTIF_PREFS_KEY, prefs);
}

function getAuthHeader() {
  const token = localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);

  console.log("JWT TOKEN EXISTS:", !!token);
  console.log(
    "JWT TOKEN PREVIEW:",
    token ? token.substring(0, 20) + "..." : "NO TOKEN"
  );

  return token
    ? { Authorization: "Bearer " + token }
    : {};
}

async function fetchStations() {
  try {
    const url = CONFIG.API_BASE_URL + "/stations";

    console.log("Calling backend:", url);

    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeader()
    });

    console.log("Backend status:", res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend error:", errorText);
      throw new Error("Bad response from /stations: " + res.status);
    }

    const data = await res.json();

    console.log("REAL STATIONS FROM BACKEND:", data);

    // Backend response ko frontend ke expected format me convert kar rahe hain
    return data.map(station => ({
      id: station.id,
      name: station.stationName,
      address: station.location,
      lat: station.latitude,
      lng: station.longitude,
      available: station.availableSlots,
      price: station.pricePerUnit,

      // Backend me abhi connector/speed fields nahi hain
      connector: station.connector || "",
      speed: station.speed || "",

      chargerType: station.chargerType
        ? station.chargerType.toLowerCase()
        : ""
    }));

  } catch (err) {
  console.error("FETCH STATIONS FAILED:", err);

  return [];
}
}

async function fetchBookings() {
  try {
    const user = checkAuthStatus();

    if (!user || !user.id) {
      throw new Error("User ID not found. Please login again.");
    }

    const bookingsUrl =
      CONFIG.API_BASE_URL +
      "/bookings/user/" +
      encodeURIComponent(user.id);

    const bookingsRes = await fetch(bookingsUrl, {
      method: "GET",
      headers: getAuthHeader()
    });

    if (!bookingsRes.ok) {
      const errorText = await bookingsRes.text();
      throw new Error(
        "Unable to fetch bookings: " +
        bookingsRes.status +
        " " +
        errorText
      );
    }

    const bookings = await bookingsRes.json();

    const stationsRes = await fetch(
      CONFIG.API_BASE_URL + "/stations",
      {
        method: "GET",
        headers: getAuthHeader()
      }
    );

    if (!stationsRes.ok) {
      throw new Error("Unable to fetch station details");
    }

    const stations = await stationsRes.json();

    return bookings.map(booking => {
      const station = stations.find(
        s => String(s.id) === String(booking.stationId)
      );

     let backendStatus = String(booking.status || "").toUpperCase();

let status;

if (backendStatus === "CANCELLED") {

    status = "cancelled";

} else if (backendStatus === "COMPLETED") {

    status = "completed";

} else {

    const bookingDate = booking.bookingDate;
    const startTime = booking.startTime;
    const endTime = booking.endTime;

    const now = new Date();

    const endDateTime = new Date(
        bookingDate + "T" + endTime
    );

    const startDateTime = new Date(
        bookingDate + "T" + startTime
    );

    if (now >= endDateTime) {
        status = "completed";
    } else if (now >= startDateTime) {
        status = "completed";
    } else {
        status = "upcoming";
    }
}

      return {
        id: booking.bookingId,
        stationId: booking.stationId,

        stationName: station
          ? station.stationName
          : "Charging Station",

        address: station
          ? station.location
          : "Address not available",

        price: station
          ? station.pricePerUnit
          : 0,

        date: booking.bookingDate,

        time:
          formatBackendTime(booking.startTime) +
          " - " +
          formatBackendTime(booking.endTime),

        status: status
      };
    });

  } catch (err) {
    console.error("FETCH BOOKINGS FAILED:", err);
    return [];
  }
}


function formatBackendTime(time) {
  if (!time) return "";

  const parts = time.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];

  const suffix = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;

  if (hours === 0) {
    hours = 12;
  }

  return hours + ":" + minutes + " " + suffix;
}


async function addBooking(payload) {

  const authHeader = getAuthHeader();

  console.log("========== BOOKING DEBUG ==========");
  console.log("AUTH HEADER:", authHeader);
  console.log("PAYLOAD:", payload);

  const headers = combineObjects(
    {
      "Content-Type": "application/json"
    },
    authHeader
  );

  console.log("FINAL BOOKING HEADERS:", headers);

  const res = await fetch(
    CONFIG.API_BASE_URL + "/bookings",
    {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    }
  );

  const responseText = await res.text();

  console.log("BOOKING STATUS:", res.status);
  console.log("BOOKING RESPONSE:", responseText);

  if (!res.ok) {
    throw new Error(
      "Booking failed: " +
      res.status +
      " " +
      responseText
    );
  }

  return responseText
    ? JSON.parse(responseText)
    : null;
}

async function fetchAvailableSlots(stationId, date) {
  const url =
    CONFIG.API_BASE_URL +
    "/bookings/available-slots?stationId=" +
    encodeURIComponent(stationId) +
    "&date=" +
    encodeURIComponent(date);

  console.log("AVAILABLE SLOTS URL:", url);
  console.log("STATION ID:", stationId);
  console.log("DATE:", date);

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeader()
  });

  const responseText = await res.text();

  console.log("AVAILABLE SLOTS STATUS:", res.status);
  console.log("AVAILABLE SLOTS RESPONSE:", responseText);

  if (!res.ok) {
    throw new Error(
      "Available slots failed: " +
      res.status +
      " - " +
      responseText
    );
  }

  try {
    return JSON.parse(responseText);
  } catch (e) {
    throw new Error("Invalid response from available-slots API");
  }
}

async function fetchProfile() {
  try {
    // backend se user ki profile mangwa rahe hai
    const res = await fetch(CONFIG.API_BASE_URL + "/user/profile", { headers: getAuthHeader() });
    if (!res.ok) throw new Error("Bad response from /user/profile");
    return await res.json();
  } catch (err) {
    console.log("Backend not running, building profile from localStorage");

    const savedProfile = getStorage(CONFIG.PROFILE_KEY, null);
    if (savedProfile) return savedProfile;

    const loggedInUser = checkAuthStatus();
    return {
      fullName: loggedInUser ? loggedInUser.name : "",
      email: loggedInUser ? loggedInUser.email : "",
      phone: "",
      vehicle: "",
      preferredCharger: ""
    };
  }
}

async function updateProfile(payload) {
  try {
    const headers = combineObjects({ "Content-Type": "application/json" }, getAuthHeader());
    // backend par profile update PUT kar rahe hai
    const res = await fetch(CONFIG.API_BASE_URL + "/user/profile", {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Bad response from PUT /user/profile");
    const updated = await res.json();
    setStorage(CONFIG.PROFILE_KEY, updated);
    return updated;
  } catch (err) {
    console.log("Backend not running, saving profile to localStorage");
    setStorage(CONFIG.PROFILE_KEY, payload);
    return payload;
  }
}

async function sendContactForm(payload) {
  // backend par contact form ka data POST kar rahe hai
  const res = await fetch(CONFIG.API_BASE_URL + "/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Contact form submission failed");
  return await res.json();
}

async function cancelBooking(bookingId) {
  const res = await fetch(
    CONFIG.API_BASE_URL + "/bookings/" + encodeURIComponent(bookingId),
    {
      method: "DELETE",
      headers: getAuthHeader()
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Cancel booking failed:", errorText);
    throw new Error(errorText || "Cancel booking failed");
  }

  return await res.json();
}

async function getCityCoordinates(city) {
  const normalizedCity = city.trim().toLowerCase();

  const cacheKey = "EV_CITY_COORDINATES_" + normalizedCity;

  // Check cache first
  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      console.log("Using cached coordinates for:", city);
      return JSON.parse(cached);
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(city);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
 
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      signal: controller.signal
    });

    if (!res.ok) {
      throw new Error("Unable to find city");
    }

    const data = await res.json();

    if (!data.length) {
      throw new Error("City not found");
    }

    const coords = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    };

    // Save coordinates for future searches
    localStorage.setItem(
      cacheKey,
      JSON.stringify(coords)
    );

    console.log("Fetched and cached coordinates:", coords);

    return coords;

  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("City search timed out. Please try again.");
    }

    throw err;

  } finally {
    clearTimeout(timeoutId);
  }
}
async function fetchNearbyStations(city) {
  const coords = await getCityCoordinates(city);

  console.log("City:", city);
  console.log("Coordinates:", coords);

  const url =
    CONFIG.API_BASE_URL +
    "/stations/nearby?latitude=" +
    encodeURIComponent(coords.latitude) +
    "&longitude=" +
    encodeURIComponent(coords.longitude);

  console.log("Calling backend nearby:", url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeader(),
      signal: controller.signal
    });

    if (!res.ok) {
      const errorText = await res.text();

      throw new Error(
        "Nearby API failed: " +
        res.status +
        " " +
        errorText
      );
    }

    const data = await res.json();

    console.log("REAL NEARBY RESPONSE:", data);

    return data.map(item => {
      const station = item.station || item;

      return {
        id: station.id,
        name: station.stationName,
        address: station.location,
        lat: station.latitude,
        lng: station.longitude,
        available: station.availableSlots,
        price: station.pricePerUnit,

        chargerType: station.chargerType
          ? station.chargerType.toLowerCase()
          : "",

        connector: station.connector || "",
        speed: station.speed || "",

        distanceKm:
          item.distance !== undefined
            ? item.distance
            : 0
      };
    });

  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        "Nearby station search timed out. Please try again."
      );
    }

    throw err;

  } finally {
    clearTimeout(timeoutId);
  }
}



