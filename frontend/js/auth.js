

function deriveNameFromIdentifier(identifier) {
  if (!identifier) return "EV ChargeHub User";

  if (identifier.includes("@")) {
    const localPart = identifier.split("@")[0];

    return localPart
      .replace(/[._]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  return identifier;
}

async function loginUser(identifier, password, registerInfo) {
  try {

    // =========================
    // REGISTER
    // =========================
    if (registerInfo) {

      const registerPayload = {
        name: registerInfo.fullName,
        email: registerInfo.email,
        password: password
      };

      const registerResponse = await fetch(
        CONFIG.API_BASE_URL + "/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(registerPayload)
        }
      );

      if (!registerResponse.ok) {
        const errorText = await registerResponse.text();
        throw new Error(errorText || "Registration failed");
      }

      const registeredUser = await registerResponse.json();

      /*
       * Registration successful.
       * Backend does not automatically return JWT,
       * so login immediately after registration.
       */
    }

    // =========================
    // LOGIN
    // =========================

    const loginResponse = await fetch(
      CONFIG.API_BASE_URL + "/users/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: registerInfo ? registerInfo.email : identifier,
          password: password
        })
      }
    );

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(errorText || "Invalid email or password");
    }

    // Backend returns JWT as plain text
    const token = await loginResponse.text();

    if (!token) {
      throw new Error("JWT token was not returned by backend");
    }

    // Save JWT
    localStorage.setItem(
      CONFIG.AUTH_TOKEN_KEY,
      token
    );

    // =========================
    // GET CURRENT USER
    // =========================

    const meResponse = await fetch(
      CONFIG.API_BASE_URL + "/users/me",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    if (!meResponse.ok) {
      throw new Error("Unable to fetch current user");
    }

    const backendUser = await meResponse.json();

    // Convert backend user format to frontend format
    const user = {
      id: backendUser.id,
      name: backendUser.fullName || backendUser.name || deriveNameFromIdentifier(identifier),
      email: backendUser.email || "",
      role: backendUser.role || "USER"
    };

    // Save user
    setStorage(
      CONFIG.AUTH_USER_KEY,
      user
    );

    // Save basic profile
   setStorage(
  CONFIG.PROFILE_KEY,
  {
    fullName: user.name,
    email: user.email,
    phone: backendUser.phone || "",
    vehicle: backendUser.vehicle || "",
    preferredCharger: backendUser.preferredCharger || ""
  }
);

// Login ke baad navbar update karo

if (typeof renderNavbarAuthState === "function") {
  renderNavbarAuthState();
}

if (typeof renderAdminAccess === "function") {
  renderAdminAccess();
}

return user;


  } catch (err) {

    console.error("AUTH ERROR:", err);

    /*
     * IMPORTANT:
     * Do NOT create a fake/demo session.
     * Backend authentication must be real.
     */
    throw err;
  }
}


function logoutUser() {
  localStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
  localStorage.removeItem(CONFIG.AUTH_USER_KEY);
  localStorage.removeItem(CONFIG.PROFILE_KEY);
}

function checkAuthStatus() {
  const token = localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
  const user = getStorage(CONFIG.AUTH_USER_KEY, null);

  return token && user ? user : null;
}