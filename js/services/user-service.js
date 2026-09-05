/**
 * EduConnect - User Service
 * 
 * Manages user accounts, profiles, and administration.
 * 
 * =========================================================================
 * FUTURE PHP & MYSQL BACKEND INTEGRATION (XAMPP):
 * -------------------------------------------------------------------------
 * In PHP, these methods will interact with `/backend/api/users.php`
 * 
 * GET /backend/api/users.php               -> List all users (admin only)
 * GET /backend/api/users.php?id=1          -> Get single user profile
 * PUT /backend/api/users.php?id=1          -> Update profile
 * DELETE /backend/api/users.php?id=1       -> Delete user
 * PATCH /backend/api/users.php?action=status -> Suspend or reactivate user
 * =========================================================================
 */

(function () {
  const UserService = {
    /**
     * Get all users (Admin view)
     */
    getAll: async function (roleFilter = null) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = (roleFilter && roleFilter !== 'all') 
          ? `${window.API_CONFIG.endpoints.users}?role=${encodeURIComponent(roleFilter)}` 
          : window.API_CONFIG.endpoints.users;
        try {
          const res = await fetch(url);
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch users from PHP API.`);
          }
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            return json.data;
          }
          throw new Error(json.message || "Failed to load user list from database.");
        } catch (netErr) {
          console.error("[UserService] Backend getAll failed:", netErr);
          throw new Error(`Connection Error: Unable to reach users API at "${url}". Please verify Apache and MySQL in XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const users = window.StorageService
        ? window.StorageService.get("educonnect_users", window.MockUsers || [])
        : window.MockUsers || [];

      if (!roleFilter || roleFilter === "all") {
        return users;
      }
      return users.filter(u => u.role === roleFilter);
    },

    /**
     * Get single user by ID
     */
    getById: async function (id) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.users}?id=${id}`;
        try {
          const res = await fetch(url);
          if (res.status === 404) return null;
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: Failed to fetch user #${id}.`);
          }
          const json = await res.json();
          if (json.success && json.data) {
            return json.data;
          }
          return null;
        } catch (netErr) {
          console.error("[UserService] Backend getById failed:", netErr);
          throw new Error(`Connection Error: Unable to fetch user profile from "${url}". Please check XAMPP.`);
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const users = await this.getAll();
      return users.find(u => Number(u.id) === Number(id)) || null;
    },

    /**
     * Update user profile
     */
    updateProfile: async function (id, updateData) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.users}?id=${id}`;
        try {
          const res = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
          });
          const json = await res.json();
          if (json.success && json.data) {
            const currentUser = window.AuthService ? window.AuthService.getCurrentUser() : null;
            if (currentUser && Number(currentUser.id) === Number(id)) {
              localStorage.setItem("user", JSON.stringify(json.data));
            }
            return { success: true, user: json.data };
          }
          return { success: false, message: json.message || "Failed to update profile." };
        } catch (netErr) {
          console.error("[UserService] Backend updateProfile failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Unable to update profile via "${url}". Please check XAMPP.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const users = window.StorageService
        ? window.StorageService.get("educonnect_users", window.MockUsers || [])
        : window.MockUsers || [];

      const index = users.findIndex(u => Number(u.id) === Number(id));
      if (index === -1) {
        return { success: false, message: "User not found." };
      }

      users[index] = {
        ...users[index],
        ...updateData
      };

      if (window.StorageService) {
        window.StorageService.set("educonnect_users", users);
      }

      // If updating current logged in user, refresh localStorage.user
      const currentUser = window.AuthService ? window.AuthService.getCurrentUser() : null;
      if (currentUser && Number(currentUser.id) === Number(id)) {
        localStorage.setItem("user", JSON.stringify(users[index]));
      }

      return { success: true, user: users[index] };
    },

    /**
     * Toggle user status (active <-> suspended)
     */
    toggleStatus: async function (id) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.users}?id=${id}&action=status`;
        try {
          const res = await fetch(url, {
            method: 'PATCH'
          });
          const json = await res.json();
          if (json.success && json.data) {
            return { success: true, user: json.data };
          }
          return { success: false, message: json.message || "Failed to update status." };
        } catch (netErr) {
          console.error("[UserService] Backend toggleStatus failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Unable to reach "${url}". Please check XAMPP.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      const users = window.StorageService
        ? window.StorageService.get("educonnect_users", window.MockUsers || [])
        : window.MockUsers || [];

      const user = users.find(u => Number(u.id) === Number(id));
      if (!user) return { success: false, message: "User not found" };

      user.status = user.status === "active" ? "suspended" : "active";

      if (window.StorageService) {
        window.StorageService.set("educonnect_users", users);
      }

      return { success: true, user: user };
    },

    /**
     * Delete user
     */
    deleteUser: async function (id) {
      // 1. REAL PHP & MYSQL BACKEND:
      if (window.API_CONFIG && window.API_CONFIG.useBackend) {
        const url = `${window.API_CONFIG.endpoints.users}?id=${id}`;
        try {
          const res = await fetch(url, {
            method: 'DELETE'
          });
          const json = await res.json();
          if (json.success) {
            return { success: true };
          }
          return { success: false, message: json.message || "Failed to delete user." };
        } catch (netErr) {
          console.error("[UserService] Backend deleteUser failed:", netErr);
          return {
            success: false,
            message: `Connection Error: Unable to delete user via "${url}". Please check XAMPP.`
          };
        }
      }

      // 2. PREVIEW MODE SIMULATION ONLY:
      let users = window.StorageService
        ? window.StorageService.get("educonnect_users", window.MockUsers || [])
        : window.MockUsers || [];

      users = users.filter(u => Number(u.id) !== Number(id));

      if (window.StorageService) {
        window.StorageService.set("educonnect_users", users);
      }

      return { success: true };
    }
  };

  window.UserService = UserService;
})();
