/**
 * EduConnect - Core Storage Engine
 * 
 * Provides a database-like LocalStorage abstraction layer for the prototype.
 * Initializes mock collections if they do not yet exist, allowing users to
 * perform create/update/save/apply operations that persist locally across page navigation.
 * 
 * In future PHP/MySQL architecture:
 * All localStorage CRUD operations will be superseded by standard asynchronous
 * API calls to backend PHP endpoints (`/backend/api/...`).
 */

(function () {
  const Storage = {
    KEYS: {
      USERS: "educonnect_users",
      OPPORTUNITIES: "educonnect_opportunities",
      UNIVERSITIES: "educonnect_universities",
      EVENTS: "educonnect_events",
      APPLICATIONS: "educonnect_applications",
      SAVED: "educonnect_saved",
      AUTH_USER: "user",
      AUTH_ROLE: "role"
    },

    init: function () {
      if (!localStorage.getItem(this.KEYS.USERS) && window.MockUsers) {
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(window.MockUsers));
      }
      if (!localStorage.getItem(this.KEYS.OPPORTUNITIES) && window.MockOpportunities) {
        localStorage.setItem(this.KEYS.OPPORTUNITIES, JSON.stringify(window.MockOpportunities));
      }
      if (!localStorage.getItem(this.KEYS.UNIVERSITIES) && window.MockUniversities) {
        localStorage.setItem(this.KEYS.UNIVERSITIES, JSON.stringify(window.MockUniversities));
      }
      if (!localStorage.getItem(this.KEYS.EVENTS) && window.MockEvents) {
        localStorage.setItem(this.KEYS.EVENTS, JSON.stringify(window.MockEvents));
      }
      if (!localStorage.getItem(this.KEYS.APPLICATIONS) && window.MockApplications) {
        localStorage.setItem(this.KEYS.APPLICATIONS, JSON.stringify(window.MockApplications));
      }
      if (!localStorage.getItem(this.KEYS.SAVED) && window.MockSavedOpportunities) {
        localStorage.setItem(this.KEYS.SAVED, JSON.stringify(window.MockSavedOpportunities));
      }
    },

    get: function (key, defaultVal = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultVal;
      } catch (e) {
        console.error("Storage parse error for key:", key, e);
        return defaultVal;
      }
    },

    set: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error("Storage save error for key:", key, e);
      }
    },

    remove: function (key) {
      localStorage.removeItem(key);
    },

    resetAll: function () {
      localStorage.removeItem(this.KEYS.USERS);
      localStorage.removeItem(this.KEYS.OPPORTUNITIES);
      localStorage.removeItem(this.KEYS.UNIVERSITIES);
      localStorage.removeItem(this.KEYS.EVENTS);
      localStorage.removeItem(this.KEYS.APPLICATIONS);
      localStorage.removeItem(this.KEYS.SAVED);
      this.init();
    }
  };

  // Auto-init on script evaluation
  Storage.init();

  window.StorageService = Storage;
})();
