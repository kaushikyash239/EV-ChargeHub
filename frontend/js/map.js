
let stationMap = null;
let clusterGroup = null;
let userPosition = null;
let userMarker = null;
let searchedLocationMarker = null;
let isDarkTiles = false;
let tileLayer = null;

const TILE_URLS = {
  light: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
};

const chargerIcon = L.icon({
  iconUrl: "assets/images/charging-marker.png",
  iconSize: [34, 40],
  iconAnchor: [17, 40],
  popupAnchor: [0, -36]
});

const userLocationIcon = L.divIcon({
  className: "relative",
  html:
    '<span class="absolute rounded-full w-3 h-3 top-1 left-1 bg-[#2563eb] border-2 border-white shadow-[0_0_0_1px_rgba(37,99,235,0.4)]"></span>' +
    '<span class="absolute rounded-full w-6 h-6 -top-1 -left-1 bg-[rgba(37,99,235,0.35)] animate-[user-location-pulse_1.8s_ease-out_infinite]"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const searchLocationIcon = L.divIcon({
  className: "text-[#2563eb] text-[30px] [filter:drop-shadow(0_2px_2px_rgba(0,0,0,0.35))]",
  html: '<i class="fa-solid fa-location-dot"></i>',
  iconSize: [30, 38],
  iconAnchor: [15, 38],
  popupAnchor: [0, -34]
});

function initStationMap(stations, onMarkerClick) {
  const mapEl = document.getElementById("map-container");
  if (!mapEl) return;

  stationMap = L.map("map-container").setView(CONFIG.MAP_DEFAULT_CENTER, CONFIG.MAP_DEFAULT_ZOOM);

  isDarkTiles = getStorage(CONFIG.THEME_KEY, "light") === "dark";
  tileLayer = L.tileLayer(isDarkTiles ? TILE_URLS.dark : TILE_URLS.light, {
    attribution: isDarkTiles ? "&copy; OpenStreetMap contributors &copy; CARTO" : "&copy; OpenStreetMap contributors",
    maxZoom: 19
  }).addTo(stationMap);

  clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 50,
    iconCreateFunction: function (cluster) {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: "<span>" + count + "</span>",
        className: "flex items-center justify-center rounded-full bg-[rgba(21,128,61,0.85)] text-white font-bold",
        iconSize: L.point(38, 38)
      });
    }
  });

  plotStations(stations, onMarkerClick);
  stationMap.addLayer(clusterGroup);

  window.addEventListener("resize", function () {
    if (stationMap) stationMap.invalidateSize();
  });
  setTimeout(function () {
    stationMap.invalidateSize();
  }, 200);
}

function plotStations(stations, onMarkerClick) {
  if (!clusterGroup) return;
  clusterGroup.clearLayers();

  for (let i = 0; i < stations.length; i++) {
    const station = stations[i];
    const marker = L.marker([station.lat, station.lng], { icon: chargerIcon });
    const popupHtml =
      "<strong>" + station.name + "</strong><br>" +
      station.address + "<br>" +
      station.available + " Available &middot; \u20B9" + station.price + " / kWh";
    marker.bindPopup(popupHtml);

    if (onMarkerClick) {
      marker.on("click", function () {
        onMarkerClick(station, marker);
      });
    }

    clusterGroup.addLayer(marker);
  }
}

function fitMapToStations(stations) {
  if (!stationMap || !stations.length) return;
  const coords = stations.map(function (s) {
    return [s.lat, s.lng];
  });
  const bounds = L.latLngBounds(coords);
  stationMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
}

async function geocodeLocation(query) {
  const url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=" + encodeURIComponent(query);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Geocoding request failed");
  const results = await res.json();
  if (!results.length) throw new Error("No matching location found");
  const place = results[0];
  return {
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lon),
    label: place.display_name,
    address: place.address || {}
  };
}

async function reverseGeocode(lat, lng) {
  const url = "https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&lat=" + lat + "&lon=" + lng;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Reverse geocoding failed");
  const data = await res.json();
  return { label: data.display_name, address: data.address || {} };
}

function buildLocationPopupHtml(address, fallbackLabel, contextLabel) {
  const addr = address || {};
  const name =
    addr.village || addr.town || addr.city || addr.suburb || addr.neighbourhood ||
    addr.county || addr.state_district || addr.state ||
    (fallbackLabel ? fallbackLabel.split(",")[0].trim() : "") ||
    contextLabel || "Location";
  const pincode = addr.postcode;

  let html = '<div class="text-sm leading-[1.4]"><strong class="text-sm">' + name + "</strong>";
  if (pincode) html += '<div class="text-text-muted">Pincode: ' + pincode + "</div>";
  if (contextLabel) html += '<div class="mt-1 text-xs font-semibold uppercase tracking-[0.03em] text-primary">' + contextLabel + "</div>";
  html += "</div>";
  return html;
}

function panToLocation(lat, lng, zoom, popupHtml) {
  if (!stationMap) return;
  stationMap.setView([lat, lng], zoom || 14);
  if (searchedLocationMarker) stationMap.removeLayer(searchedLocationMarker);
  searchedLocationMarker = L.marker([lat, lng], { icon: searchLocationIcon })
    .addTo(stationMap)
    .bindPopup(popupHtml || '<div class="text-sm leading-[1.4]"><strong>Searched location</strong></div>')
    .openPopup();
}

function distanceToStationKm(station) {
  if (!userPosition) return null;
  const from = L.latLng(userPosition.lat, userPosition.lng);
  const to = L.latLng(station.lat, station.lng);
  return (from.distanceTo(to) / 1000).toFixed(1);
}

function setMapTheme(dark) {
  isDarkTiles = dark;
  if (tileLayer && stationMap) {
    stationMap.removeLayer(tileLayer);
    tileLayer = L.tileLayer(dark ? TILE_URLS.dark : TILE_URLS.light, {
      attribution: dark ? "&copy; OpenStreetMap contributors &copy; CARTO" : "&copy; OpenStreetMap contributors",
      maxZoom: 19
    }).addTo(stationMap);
  }
}

function locateUser() {
  return new Promise(function (resolve, reject) {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    const isSecureContext = window.isSecureContext || location.hostname === "localhost";
    if (!isSecureContext) {
      reject(new Error("Geolocation requires HTTPS or localhost - this page is loaded over an insecure origin (" + location.protocol + "//" + location.host + ")"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy };
        console.log("Got GPS position:", userPosition, "accuracy (m):", pos.coords.accuracy);

        if (stationMap) {
          stationMap.setView([userPosition.lat, userPosition.lng], 17);
          if (userMarker) stationMap.removeLayer(userMarker);
          userMarker = L.marker([userPosition.lat, userPosition.lng], { icon: userLocationIcon, title: "You are here" })
            .addTo(stationMap)
            .bindPopup('<div class="text-sm leading-[1.4]"><strong>You are here</strong></div>')
            .openPopup();

          reverseGeocode(userPosition.lat, userPosition.lng)
            .then(function (result) {
              userMarker.setPopupContent(buildLocationPopupHtml(result.address, result.label, "You are here"));
            })
            .catch(function (err) {
              console.log("Reverse geocoding unavailable, keeping default popup:", err.message);
            });
        }

        resolve(userPosition);
      },
      function (err) {
        reject(err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function sortStationsByDistance(stations, origin) {
  const withDistance = stations.map(function (station) {
    const copy = {};
    for (const key in station) {
      copy[key] = station[key];
    }
    copy.distanceKm = getDistanceKm(origin.lat, origin.lng, station.lat, station.lng);
    return copy;
  });
  withDistance.sort(function (a, b) {
    return a.distanceKm - b.distanceKm;
  });
  return withDistance;
}
