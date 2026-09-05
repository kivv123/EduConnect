/**
 * EduConnect - Global Application Core
 * 
 * Handles dynamic navigation bar rendering, role-aware menus,
 * active route highlighting, toast notifications, and demo helpers.
 */

(function () {
  const App = {
    init: function () {
      this.renderNavbar();
      this.renderFooter();
      this.renderToastContainer();
    },

    getBasePath: function () {
      return window.location.pathname.includes("/pages/") ? "../" : "./";
    },

    getPagesPrefix: function () {
      return window.location.pathname.includes("/pages/") ? "" : "pages/";
    },

    renderNavbar: function () {
      const navContainer = document.getElementById("mainNavbar");
      if (!navContainer) return;

      const user = window.AuthService ? window.AuthService.getCurrentUser() : null;
      const role = window.AuthService ? window.AuthService.getCurrentRole() : null;
      const base = this.getBasePath();
      const pages = this.getPagesPrefix();
      const currentPath = window.location.pathname;

      let navLinks = "";
      let authActions = "";

      // Public nav links always accessible
      const isOpsActive = currentPath.includes("opportunities.html") ? "active text-primary fw-semibold" : "";
      const isUnisActive = currentPath.includes("universities.html") ? "active text-primary fw-semibold" : "";
      const isHomeActive = currentPath.endsWith("index.html") || currentPath.endsWith("/") ? "active text-primary fw-semibold" : "";

      navLinks += `
        <li class="nav-item">
          <a class="nav-link ${isHomeActive}" href="${base}index.html">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${isOpsActive}" href="${pages}opportunities.html">Opportunities</a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${isUnisActive}" href="${pages}universities.html">Universities</a>
        </li>
      `;

      if (user && role) {
        // Authenticated role-based links
        if (role === "learner") {
          const isDash = currentPath.includes("learner-dashboard.html") ? "active text-primary fw-semibold" : "";
          const isApps = currentPath.includes("applications.html") ? "active text-primary fw-semibold" : "";
          navLinks += `
            <li class="nav-item">
              <a class="nav-link ${isDash}" href="${pages}learner-dashboard.html">Dashboard</a>
            </li>
            <li class="nav-item">
              <a class="nav-link ${isApps}" href="${pages}applications.html">My Applications</a>
            </li>
          `;
        } else if (role === "provider") {
          const isDash = currentPath.includes("provider-dashboard.html") ? "active text-primary fw-semibold" : "";
          navLinks += `
            <li class="nav-item">
              <a class="nav-link ${isDash}" href="${pages}provider-dashboard.html">Provider Portal</a>
            </li>
          `;
        } else if (role === "admin") {
          const isDash = currentPath.includes("admin-dashboard.html") ? "active text-primary fw-semibold" : "";
          navLinks += `
            <li class="nav-item">
              <a class="nav-link ${isDash}" href="${pages}admin-dashboard.html">Admin Console</a>
            </li>
          `;
        }

        // User Avatar Dropdown
        const roleBadgeClass = role === "admin" ? "bg-danger" : (role === "provider" ? "bg-warning text-dark" : "bg-primary");
        authActions = `
          <div class="d-flex align-items-center gap-2">
            <!-- Demo Quick Switcher -->
            <div class="dropdown d-none d-md-block">
              <button class="btn btn-sm btn-outline-secondary dropdown-toggle py-1 px-2 text-xs" type="button" data-bs-toggle="dropdown" title="Quick Role Switcher for Testing">
                <i class="bi bi-person-gear me-1"></i>Switch Demo Role
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 small">
                <li><h6 class="dropdown-header">Fast Role Testing</h6></li>
                <li><button class="dropdown-item" onclick="App.quickLogin('student@test.com')"><i class="bi bi-mortarboard me-2 text-primary"></i>Learner (Student)</button></li>
                <li><button class="dropdown-item" onclick="App.quickLogin('provider@test.com')"><i class="bi bi-building me-2 text-warning"></i>Provider (University)</button></li>
                <li><button class="dropdown-item" onclick="App.quickLogin('admin@test.com')"><i class="bi bi-shield-check me-2 text-danger"></i>Administrator</button></li>
              </ul>
            </div>

            <!-- Profile Menu -->
            <div class="dropdown">
              <button class="btn btn-link text-decoration-none p-0 d-flex align-items-center gap-2 dropdown-toggle" type="button" data-bs-toggle="dropdown">
                <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}" alt="${user.name}" class="rounded-circle border" width="36" height="36" style="object-fit: cover;">
                <div class="text-start d-none d-lg-block">
                  <div class="fw-semibold text-dark lh-sm small">${user.name}</div>
                  <span class="badge ${roleBadgeClass} text-uppercase" style="font-size: 0.65rem;">${role}</span>
                </div>
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                <li class="px-3 py-2 border-bottom">
                  <div class="fw-bold small text-truncate" style="max-width: 200px;">${user.name}</div>
                  <div class="text-muted text-xs text-truncate" style="max-width: 200px;">${user.email}</div>
                  <span class="badge ${roleBadgeClass} text-uppercase mt-1">${role}</span>
                </li>
                <li><a class="dropdown-item py-2" href="${pages}profile.html"><i class="bi bi-person me-2 text-muted"></i>My Profile</a></li>
                ${role === 'learner' ? `<li><a class="dropdown-item py-2" href="${pages}learner-dashboard.html"><i class="bi bi-speedometer2 me-2 text-muted"></i>Learner Dashboard</a></li>` : ''}
                ${role === 'provider' ? `<li><a class="dropdown-item py-2" href="${pages}provider-dashboard.html"><i class="bi bi-kanban me-2 text-muted"></i>Provider Dashboard</a></li>` : ''}
                ${role === 'admin' ? `<li><a class="dropdown-item py-2" href="${pages}admin-dashboard.html"><i class="bi bi-shield-shaded me-2 text-muted"></i>Admin Dashboard</a></li>` : ''}
                <li><hr class="dropdown-divider"></li>
                <li><button class="dropdown-item py-2 text-danger" onclick="AuthService.logout()"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</button></li>
              </ul>
            </div>
          </div>
        `;
      } else {
        // Guest Actions
        authActions = `
          <div class="d-flex align-items-center gap-2">
            <!-- Quick Demo Testing Button for Evaluator -->
            <div class="dropdown d-none d-md-block">
              <button class="btn btn-sm btn-outline-info dropdown-toggle py-1.5 px-2.5 small" type="button" data-bs-toggle="dropdown">
                <i class="bi bi-lightning-charge-fill me-1"></i>Quick Login Demo
              </button>
              <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 small">
                <li><h6 class="dropdown-header">1-Click Test Personas</h6></li>
                <li><button class="dropdown-item" onclick="App.quickLogin('student@test.com')"><i class="bi bi-mortarboard me-2 text-primary"></i>Student (Learner)</button></li>
                <li><button class="dropdown-item" onclick="App.quickLogin('provider@test.com')"><i class="bi bi-building me-2 text-warning"></i>Institution (Provider)</button></li>
                <li><button class="dropdown-item" onclick="App.quickLogin('admin@test.com')"><i class="bi bi-shield-check me-2 text-danger"></i>Platform Admin</button></li>
              </ul>
            </div>

            <a href="${base}login.html" class="btn btn-outline-primary px-3 py-1.5 small fw-semibold">Sign In</a>
            <a href="${base}register.html" class="btn btn-primary px-3 py-1.5 small fw-semibold">Join EduConnect</a>
          </div>
        `;
      }

      navContainer.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-2.5">
          <div class="container">
            <a class="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark tracking-tight" href="${base}index.html">
              <div class="brand-logo-badge bg-primary text-white rounded-3 d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
                <i class="bi bi-mortarboard-fill fs-5"></i>
              </div>
              <div>
                <span class="fs-5 text-dark fw-bold">Edu<span class="text-primary">Connect</span></span>
                <span class="badge bg-light text-muted border ms-1 fw-normal" style="font-size: 0.65rem;">PROTOTYPE</span>
              </div>
            </a>

            <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navContent">
              <span class="navbar-toggler-icon"></span>
            </button>

            <div class="collapse navbar-collapse" id="navContent">
              <ul class="navbar-nav mx-auto mb-2 mb-lg-0 gap-1 gap-lg-2">
                ${navLinks}
              </ul>
              <div class="d-flex align-items-center mt-3 mt-lg-0">
                ${authActions}
              </div>
            </div>
          </div>
        </nav>
      `;
    },

    renderFooter: function () {
      const footerContainer = document.getElementById("mainFooter");
      if (!footerContainer) return;

      const base = this.getBasePath();
      const pages = this.getPagesPrefix();

      footerContainer.innerHTML = `
        <footer class="bg-dark text-white pt-5 pb-4 border-top">
          <div class="container">
            <div class="row g-4">
              <div class="col-lg-4 col-md-6">
                <div class="d-flex align-items-center gap-2 mb-3">
                  <div class="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                    <i class="bi bi-mortarboard-fill"></i>
                  </div>
                  <span class="fs-5 fw-bold text-white">Edu<span class="text-primary">Connect</span></span>
                </div>
                <p class="text-secondary small pe-lg-4 lh-base">
                  A modern educational opportunity ecosystem connecting ambitious students with global universities, scholarships, STEM fellowships, masterclasses, and career-launching internships.
                </p>
                <div class="d-flex gap-3 text-secondary fs-5 mt-3">
                  <a href="#" class="text-secondary hover-primary text-decoration-none"><i class="bi bi-globe"></i></a>
                  <a href="#" class="text-secondary hover-primary text-decoration-none"><i class="bi bi-linkedin"></i></a>
                  <a href="#" class="text-secondary hover-primary text-decoration-none"><i class="bi bi-twitter-x"></i></a>
                  <a href="#" class="text-secondary hover-primary text-decoration-none"><i class="bi bi-github"></i></a>
                </div>
              </div>

              <div class="col-lg-2 col-md-6 col-6">
                <h6 class="text-white fw-semibold mb-3 small text-uppercase tracking-wider">Opportunities</h6>
                <ul class="list-unstyled text-secondary small mb-0 d-flex flex-column gap-2">
                  <li><a href="${pages}opportunities.html?category=1" class="text-secondary text-decoration-none hover-white">Scholarships</a></li>
                  <li><a href="${pages}opportunities.html?category=2" class="text-secondary text-decoration-none hover-white">Courses & Bootcamps</a></li>
                  <li><a href="${pages}opportunities.html?category=3" class="text-secondary text-decoration-none hover-white">Internships</a></li>
                  <li><a href="${pages}opportunities.html?category=6" class="text-secondary text-decoration-none hover-white">Hackathons & Contests</a></li>
                  <li><a href="${pages}opportunities.html?category=7" class="text-secondary text-decoration-none hover-white">Volunteer Projects</a></li>
                </ul>
              </div>

              <div class="col-lg-3 col-md-6 col-6">
                <h6 class="text-white fw-semibold mb-3 small text-uppercase tracking-wider">Institutions</h6>
                <ul class="list-unstyled text-secondary small mb-0 d-flex flex-column gap-2">
                  <li><a href="${pages}universities.html" class="text-secondary text-decoration-none hover-white">Explore Universities</a></li>
                  <li><a href="${pages}universities.html#intakes" class="text-secondary text-decoration-none hover-white">University Intakes</a></li>
                  <li><a href="${pages}universities.html#news" class="text-secondary text-decoration-none hover-white">Campus News</a></li>
                  <li><a href="${base}login.html" class="text-secondary text-decoration-none hover-white">Provider Portal</a></li>
                </ul>
              </div>

              <div class="col-lg-3 col-md-6">
                <h6 class="text-white fw-semibold mb-3 small text-uppercase tracking-wider">Architecture Note</h6>
                <div class="bg-secondary bg-opacity-10 p-3 rounded border border-secondary border-opacity-25 small text-secondary">
                  <div class="text-light fw-semibold mb-1"><i class="bi bi-server me-1 text-warning"></i>Backend-Ready Prototype</div>
                  Structured with separate data and service layers. Ready for direct replacement with PHP MySQL APIs (XAMPP/phpMyAdmin).
                </div>
              </div>
            </div>

            <hr class="border-secondary my-4 opacity-25">

            <div class="d-flex flex-column flex-md-row justify-content-between align-items-center small text-secondary">
              <div>&copy; 2025 EduConnect Educational Platform. All rights reserved.</div>
              <div class="d-flex gap-3 mt-2 mt-md-0">
                <a href="#" class="text-secondary text-decoration-none hover-white">Privacy Policy</a>
                <a href="#" class="text-secondary text-decoration-none hover-white">Terms of Service</a>
                <a href="#" class="text-secondary text-decoration-none hover-white">Security Architecture</a>
              </div>
            </div>
          </div>
        </footer>
      `;
    },

    renderToastContainer: function () {
      if (document.getElementById("toastContainer")) return;
      const toastEl = document.createElement("div");
      toastEl.id = "toastContainer";
      toastEl.className = "toast-container position-fixed bottom-0 end-0 p-3";
      toastEl.style.zIndex = "1090";
      document.body.appendChild(toastEl);
    },

    showToast: function (message, type = "success") {
      this.renderToastContainer();
      const container = document.getElementById("toastContainer");
      if (!container) return;

      const toastId = "toast_" + Date.now();
      const bgClass = type === "success" ? "bg-success text-white" : (type === "danger" ? "bg-danger text-white" : "bg-primary text-white");
      const icon = type === "success" ? "bi-check-circle-fill" : (type === "danger" ? "bi-exclamation-triangle-fill" : "bi-info-circle-fill");

      const toastHtml = `
        <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body d-flex align-items-center gap-2">
              <i class="bi ${icon} fs-5"></i>
              <span>${message}</span>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      `;

      container.insertAdjacentHTML("beforeend", toastHtml);
      const toastElement = document.getElementById(toastId);
      if (window.bootstrap && window.bootstrap.Toast) {
        const bsToast = new window.bootstrap.Toast(toastElement, { delay: 3500 });
        bsToast.show();
        toastElement.addEventListener("hidden.bs.toast", () => toastElement.remove());
      } else {
        setTimeout(() => toastElement.remove(), 3500);
      }
    },

    quickLogin: async function (email) {
      if (!window.AuthService) return;
      const result = await window.AuthService.login(email, "123456");
      if (result.success) {
        this.showToast(`Logged in as ${result.user.name} (${result.role})`, "success");
        setTimeout(() => {
          window.AuthService.redirectByRole(result.role);
        }, 500);
      } else {
        this.showToast(result.message, "danger");
      }
    }
  };

  window.App = App;

  // Auto initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => App.init());
  } else {
    App.init();
  }
})();
