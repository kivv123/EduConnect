/**
 * EduConnect - Authentication Service
 * 
 * Manages user credentials, active sessions, and role persistence.
 * Currently backed by LocalStorage simulation.
 * 
 * =========================================================================
 * FUTURE PHP & MYSQL BACKEND INTEGRATION (XAMPP):
 * -------------------------------------------------------------------------
 * When connecting to your PHP backend:
 * 1. Replace the local array matching with a fetch request:
 * 
 *    return fetch('/backend/api/auth/login.php', {
 *      method: 'POST',
 *      headers: { 'Content-Type': 'application/json' },
 *      body: JSON.stringify({ email, password })
 *    })
 *    .then(res => res.json())
 *    .then(data => {
 *      if (data.success) {
 *        localStorage.setItem('user', JSON.stringify(data.user));
 *        localStorage.setItem('role', data.user.role);
 *        localStorage.setItem('token', data.token); // JWT or session token
 *        return { success: true, user: data.user, role: data.user.role };
 *      }
 *      return { success: false, message: data.message };
 *    });
 * 
 * 2. In PHP `api/auth/login.php`:
 *    - Connect using PDO (`new PDO("mysql:host=localhost;dbname=educonnect", $user, $pass)`)
 *    - Query `SELECT * FROM users WHERE email = ?`
 *    - Verify with `password_verify($password, $user['password'])`
 *    - Return JSON response with role and user details
 * =========================================================================
 */

(function () {
  const AuthService = {
    /**
     * Authenticates user against mock database or LocalStorage.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{success: boolean, user?: object, role?: string, message?: string}>}
     */
    login: async function (email, password) {
      // 1. REAL PHP & MYSQL BACKEND INTEGRATION (XAMPP):
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const endpoint = window.API_CONFIG.endpoints.login;
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          let data;
          const text = await res.text();
          try {
            data = JSON.parse(text);
          } catch (jsonErr) {
            return {
              success: false,
              message: `Backend API Error (${res.status}): Server returned non-JSON response from "${endpoint}". Please verify PHP error logs in XAMPP.`
            };
          }

          if (res.ok && data.success && data.data && data.data.user) {
            localStorage.setItem("user", JSON.stringify(data.data.user));
            localStorage.setItem("role", data.data.role || data.data.user.role);
            if (data.data.token) localStorage.setItem("token", data.data.token);
            return { success: true, user: data.data.user, role: data.data.role || data.data.user.role };
          } else {
            return {
              success: false,
              message: data.message || `Login failed with HTTP status ${res.status}.`
            };
          }
        } catch (netErr) {
          console.error("[AuthService] PHP Login connection failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Could not connect to PHP login API at "${endpoint}". Please make sure Apache and MySQL are running in XAMPP (C:\\xampp\\htdocs\\educonnect) and the database is imported in phpMyAdmin.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY (Used when backend mode is disabled):
      const users = window.StorageService
        ? window.StorageService.get("educonnect_users", window.MockUsers || [])
        : window.MockUsers || [];

      const normalizedEmail = (email || "").trim().toLowerCase();
      const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

      if (!user) {
        return { success: false, message: "No account found with this email address." };
      }

      if (user.password !== password) {
        return { success: false, message: "Invalid password. Please try again." };
      }

      if (user.status === "suspended") {
        return { success: false, message: "This account has been suspended. Please contact admin." };
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role);

      return {
        success: true,
        user: user,
        role: user.role
      };
    },

    /**
     * Registers a new user account.
     * @param {object} userData - { name, email, password, role, organization, phone }
     * @returns {Promise<{success: boolean, user?: object, role?: string, message?: string}>}
     */
    register: async function (userData) {
      // 1. REAL PHP & MYSQL BACKEND INTEGRATION (XAMPP):
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const endpoint = window.API_CONFIG.endpoints.register;
        try {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
          });

          let data;
          const text = await res.text();
          try {
            data = JSON.parse(text);
          } catch (jsonErr) {
            return {
              success: false,
              message: `Backend API Error (${res.status}): Server returned non-JSON response from "${endpoint}". Check PHP error logs in XAMPP.`
            };
          }

          if (res.ok && data.success && data.data && data.data.user) {
            localStorage.setItem("user", JSON.stringify(data.data.user));
            localStorage.setItem("role", data.data.role || data.data.user.role);
            if (data.data.token) localStorage.setItem("token", data.data.token);
            return { success: true, user: data.data.user, role: data.data.role || data.data.user.role, message: data.message };
          } else {
            return {
              success: false,
              message: data.message || `Registration failed with HTTP status ${res.status}.`
            };
          }
        } catch (netErr) {
          console.error("[AuthService] PHP Registration connection failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Could not connect to PHP registration API at "${endpoint}". Please make sure Apache and MySQL are running in XAMPP (C:\\xampp\\htdocs\\educonnect) and database "educonnect" is imported in phpMyAdmin.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY (Used when backend mode is disabled):
      const users = window.StorageService
        ? window.StorageService.get("educonnect_users", window.MockUsers || [])
        : window.MockUsers || [];

      const exists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase().trim());
      if (exists) {
        return { success: false, message: "An account with this email already exists." };
      }

      const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        role: userData.role || "learner",
        avatar: userData.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        phone: userData.phone || "",
        bio: userData.bio || "EduConnect learner exploring global higher education and professional growth.",
        organization: userData.organization || "",
        status: "active",
        created_at: new Date().toISOString().replace("T", " ").substring(0, 19)
      };

      users.push(newUser);
      if (window.StorageService) {
        window.StorageService.set("educonnect_users", users);
      }

      // Auto login newly registered user
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("role", newUser.role);

      return {
        success: true,
        user: newUser,
        role: newUser.role
      };
      
      // FUTURE PHP & MYSQL BACKEND:
      // return fetch('/backend/api/auth/register.php', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(userData)
      // }).then(res => res.json());
    },

    /**
     * Logs out the user, clearing all authentication keys and returning to guest homepage.
     */
    logout: function () {
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      const isPagesDir = window.location.pathname.includes("/pages/");
      window.location.href = isPagesDir ? "../index.html" : "index.html";
    },

    /**
     * Retrieves currently logged in user object.
     * @returns {object|null}
     */
    getCurrentUser: function () {
      const userStr = localStorage.getItem("user");
      if (!userStr) return null;
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    },

    /**
     * Retrieves currently active role ('learner' | 'provider' | 'admin' | null).
     * @returns {string|null}
     */
    getCurrentRole: function () {
      return localStorage.getItem("role");
    },

    /**
     * Verifies if a valid session exists.
     * @returns {boolean}
     */
    checkSession: function () {
      const user = this.getCurrentUser();
      const role = this.getCurrentRole();
      return !!(user && role);
    },

    /**
     * Redirects to the dashboard corresponding to role.
     * @param {string} [role]
     */
    redirectByRole: function (role) {
      const activeRole = role || this.getCurrentRole();
      if (window.Router) {
        window.Router.redirectByRole(activeRole);
      } else {
        const isPagesDir = window.location.pathname.includes("/pages/");
        const prefix = isPagesDir ? "" : "pages/";
        if (activeRole === "learner") window.location.href = prefix + "learner-dashboard.html";
        else if (activeRole === "provider") window.location.href = prefix + "provider-dashboard.html";
        else if (activeRole === "admin") window.location.href = prefix + "admin-dashboard.html";
        else window.location.href = isPagesDir ? "../index.html" : "index.html";
      }
    }
  };

  window.AuthService = AuthService;
})();
