/**
 * EduConnect - Core Navigation & Route Guard
 * 
 * Provides role-based page protection, relative path resolution,
 * and safe redirects for Guest, Learner, Provider, and Admin roles.
 */

(function () {
  const Router = {
    // Relative path helper that handles whether page is in root or in /pages/
    getBasePath: function () {
      const path = window.location.pathname;
      if (path.includes("/pages/")) {
        return "../";
      }
      return "./";
    },

    getPagePath: function (pageName) {
      const isPagesDir = window.location.pathname.includes("/pages/");
      if (pageName === "index.html" || pageName === "login.html" || pageName === "register.html") {
        return isPagesDir ? "../" + pageName : pageName;
      }
      // inside pages
      return isPagesDir ? pageName : "pages/" + pageName;
    },

    getQueryParams: function () {
      const params = {};
      const search = window.location.search.substring(1);
      if (!search) return params;
      const pairs = search.split("&");
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].split("=");
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
      }
      return params;
    },

    redirectByRole: function (role) {
      const isPagesDir = window.location.pathname.includes("/pages/");
      const prefix = isPagesDir ? "" : "pages/";
      switch (role) {
        case "learner":
          window.location.href = prefix + "learner-dashboard.html";
          break;
        case "provider":
          window.location.href = prefix + "provider-dashboard.html";
          break;
        case "admin":
          window.location.href = prefix + "admin-dashboard.html";
          break;
        default:
          window.location.href = isPagesDir ? "../index.html" : "index.html";
          break;
      }
    },

    /**
     * Enforces route security.
     * @param {Array<string>} allowedRoles - e.g. ['learner'], ['provider'], ['admin']
     */
    guard: function (allowedRoles) {
      const user = window.AuthService ? window.AuthService.getCurrentUser() : null;
      const role = window.AuthService ? window.AuthService.getCurrentRole() : null;
      const isPagesDir = window.location.pathname.includes("/pages/");
      const loginUrl = (isPagesDir ? "../" : "") + "login.html?redirect=" + encodeURIComponent(window.location.pathname);

      if (!user || !role) {
        window.location.href = loginUrl;
        return false;
      }

      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        alert("Access Denied: Your account role (" + role + ") does not have permission to view this page.");
        Router.redirectByRole(role);
        return false;
      }

      return true;
    }
  };

  window.Router = Router;
})();
