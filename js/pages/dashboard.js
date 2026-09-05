/**
 * EduConnect - Unified Dashboard Controller
 * 
 * Manages view logic for:
 * 1. Learner Dashboard
 * 2. Provider Dashboard
 * 3. Admin Dashboard
 * 
 * Strictly pulls data via services (UserService, OpportunityService, ApplicationService)
 */

document.addEventListener("DOMContentLoaded", async function () {
  const currentPath = window.location.pathname;

  if (currentPath.includes("learner-dashboard.html")) {
    initLearnerDashboard();
  } else if (currentPath.includes("provider-dashboard.html")) {
    initProviderDashboard();
  } else if (currentPath.includes("admin-dashboard.html")) {
    initAdminDashboard();
  }
});

/* =========================================================================
   1. LEARNER DASHBOARD LOGIC
   ========================================================================= */
async function initLearnerDashboard() {
  if (window.Router && !window.Router.guard(["learner"])) return;

  const user = window.AuthService.getCurrentUser();
  if (!user) return;

  // Set greeting name
  const greetingEl = document.getElementById("learnerGreeting");
  if (greetingEl) greetingEl.textContent = `Welcome back, ${user.name}!`;

  // 1. Load Applications
  const applications = await window.ApplicationService.getByStudent(user.id);
  const savedOps = await window.OpportunityService.getSavedByUser(user.id);
  const allOps = await window.OpportunityService.getAll();

  // Metrics
  const statAppsEl = document.getElementById("statTotalApplications");
  const statSavedEl = document.getElementById("statSavedCount");
  const statAvailableEl = document.getElementById("statAvailableCount");

  if (statAppsEl) statAppsEl.textContent = applications.length;
  if (statSavedEl) statSavedEl.textContent = savedOps.length;
  if (statAvailableEl) statAvailableEl.textContent = allOps.length;

  // Render Recent Applications Table
  const appTableBody = document.getElementById("recentApplicationsTable");
  if (appTableBody) {
    if (applications.length === 0) {
      appTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-muted small">
            No applications submitted yet. <a href="opportunities.html" class="fw-semibold">Browse opportunities</a> to apply.
          </td>
        </tr>
      `;
    } else {
      appTableBody.innerHTML = applications.slice(0, 5).map(app => {
        let statusBadge = `<span class="status-pill pending"><i class="bi bi-hourglass-split"></i> Pending</span>`;
        if (app.status === "under_review") {
          statusBadge = `<span class="status-pill under_review"><i class="bi bi-eye"></i> Under Review</span>`;
        } else if (app.status === "accepted") {
          statusBadge = `<span class="status-pill accepted"><i class="bi bi-check-circle"></i> Accepted</span>`;
        } else if (app.status === "rejected") {
          statusBadge = `<span class="status-pill rejected"><i class="bi bi-x-circle"></i> Rejected</span>`;
        }

        return `
          <tr>
            <td>
              <div class="fw-semibold text-dark">${app.opportunity_title}</div>
              <div class="text-xs text-muted">Applied: ${app.applied_at.substring(0, 10)}</div>
            </td>
            <td>${statusBadge}</td>
            <td>
              <a href="${app.resume_link}" target="_blank" class="btn btn-xs btn-outline-secondary py-0.5 px-2 text-xs">
                <i class="bi bi-file-earmark-pdf me-1"></i>Resume
              </a>
            </td>
            <td class="text-end">
              <a href="applications.html" class="btn btn-sm btn-link text-primary text-decoration-none py-0">View</a>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  // Render Saved Opportunities List
  const savedListEl = document.getElementById("savedOpportunitiesList");
  if (savedListEl) {
    if (savedOps.length === 0) {
      savedListEl.innerHTML = `
        <div class="p-4 text-center text-muted small">
          <i class="bi bi-bookmark text-secondary fs-3 d-block mb-2"></i>
          No saved opportunities yet. Click the bookmark icon on any opportunity card to save it.
        </div>
      `;
    } else {
      savedListEl.innerHTML = savedOps.slice(0, 4).map(op => `
        <div class="p-3 border-bottom d-flex align-items-center justify-content-between gap-3">
          <div class="d-flex align-items-center gap-3">
            <img src="${op.image}" class="rounded-2 border" width="48" height="48" style="object-fit: cover;">
            <div>
              <div class="fw-semibold text-dark small text-truncate" style="max-width: 280px;">${op.title}</div>
              <div class="text-xs text-muted"><i class="bi bi-building me-1"></i>${op.provider_name} • <span class="text-primary">${op.stipend_or_fee}</span></div>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-xs btn-outline-danger py-1 px-2" onclick="removeSavedOpportunity(${op.id})" title="Remove bookmark">
              <i class="bi bi-trash"></i>
            </button>
            <button class="btn btn-xs btn-primary py-1 px-2 text-xs" onclick="openApplyModal(${op.id})">
              Apply
            </button>
          </div>
        </div>
      `).join("");
    }
  }
}

window.removeSavedOpportunity = async function (opportunityId) {
  const user = window.AuthService.getCurrentUser();
  if (!user) return;
  await window.OpportunityService.toggleSave(opportunityId, user.id);
  initLearnerDashboard();
  if (window.App) window.App.showToast("Bookmark removed.", "info");
};

/* =========================================================================
   2. PROVIDER DASHBOARD LOGIC
   ========================================================================= */
async function initProviderDashboard() {
  if (window.Router && !window.Router.guard(["provider", "admin"])) return;

  const user = window.AuthService.getCurrentUser();
  if (!user) return;

  const providerNameEl = document.getElementById("providerName");
  if (providerNameEl) providerNameEl.textContent = user.organization || user.name;

  // 1. Fetch provider's opportunities
  const allOps = await window.OpportunityService.getAll();
  const providerOps = allOps.filter(op => Number(op.provider_id) === Number(user.id) || user.role === "admin");

  // 2. Fetch applications for this provider
  const applications = await window.ApplicationService.getByProvider(user.id);

  // Update Metrics
  const statListings = document.getElementById("statProviderListings");
  const statApplicants = document.getElementById("statProviderApplicants");
  const statPending = document.getElementById("statProviderPending");
  const statAccepted = document.getElementById("statProviderAccepted");

  if (statListings) statListings.textContent = providerOps.length;
  if (statApplicants) statApplicants.textContent = applications.length;
  if (statPending) statPending.textContent = applications.filter(a => a.status === "pending" || a.status === "under_review").length;
  if (statAccepted) statAccepted.textContent = applications.filter(a => a.status === "accepted").length;

  // Render Opportunities Management Table
  const listingsTable = document.getElementById("providerListingsTable");
  if (listingsTable) {
    if (providerOps.length === 0) {
      listingsTable.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted small">
            No opportunities published yet. Click <strong>"Create Opportunity"</strong> above to publish your first program.
          </td>
        </tr>
      `;
    } else {
      listingsTable.innerHTML = providerOps.map(op => `
        <tr>
          <td>
            <div class="d-flex align-items-center gap-2">
              <img src="${op.image}" class="rounded-2 border" width="36" height="36" style="object-fit: cover;">
              <div>
                <div class="fw-semibold text-dark small text-truncate" style="max-width: 220px;">${op.title}</div>
                <span class="badge bg-light text-secondary border text-xs">${op.type}</span>
              </div>
            </div>
          </td>
          <td>${op.mode}</td>
          <td>${op.stipend_or_fee}</td>
          <td>${op.deadline}</td>
          <td>
            <span class="badge ${op.status === 'active' ? 'bg-success' : 'bg-secondary'}">${op.status}</span>
          </td>
          <td class="text-end">
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-secondary py-1" onclick="deleteProviderOpportunity(${op.id})" title="Delete Listing">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join("");
    }
  }

  // Render Applicant Roster Table
  const applicantsTable = document.getElementById("providerApplicantsTable");
  if (applicantsTable) {
    if (applications.length === 0) {
      applicantsTable.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4 text-muted small">
            No applications received yet. As learners apply to your postings, they will appear here.
          </td>
        </tr>
      `;
    } else {
      applicantsTable.innerHTML = applications.map(app => {
        let statusBadge = `<span class="status-pill pending">Pending</span>`;
        if (app.status === "under_review") statusBadge = `<span class="status-pill under_review">Reviewing</span>`;
        else if (app.status === "accepted") statusBadge = `<span class="status-pill accepted">Accepted</span>`;
        else if (app.status === "rejected") statusBadge = `<span class="status-pill rejected">Rejected</span>`;

        return `
          <tr>
            <td>
              <div class="fw-semibold text-dark">${app.student_name}</div>
              <div class="text-xs text-muted">${app.student_email}</div>
            </td>
            <td>
              <div class="text-truncate small" style="max-width: 200px;">${app.opportunity_title}</div>
            </td>
            <td>${statusBadge}</td>
            <td>
              <button class="btn btn-xs btn-outline-primary py-1 px-2 text-xs" onclick="viewApplicantDetails(${app.id})">
                <i class="bi bi-card-text me-1"></i>Statement & CV
              </button>
            </td>
            <td class="text-end">
              <div class="dropdown">
                <button class="btn btn-sm btn-outline-secondary dropdown-toggle py-0.5 px-2 text-xs" data-bs-toggle="dropdown">
                  Status
                </button>
                <ul class="dropdown-menu dropdown-menu-end small shadow-sm border-0">
                  <li><button class="dropdown-item text-primary" onclick="setApplicantStatus(${app.id}, 'under_review')"><i class="bi bi-eye me-2"></i>Under Review</button></li>
                  <li><button class="dropdown-item text-success" onclick="setApplicantStatus(${app.id}, 'accepted')"><i class="bi bi-check-circle me-2"></i>Accept Candidate</button></li>
                  <li><button class="dropdown-item text-danger" onclick="setApplicantStatus(${app.id}, 'rejected')"><i class="bi bi-x-circle me-2"></i>Reject Application</button></li>
                </ul>
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }
  }

  // Create Opportunity Form Submit Listener
  const createForm = document.getElementById("createOpportunityForm");
  if (createForm) {
    createForm.onsubmit = async function (e) {
      e.preventDefault();
      const title = document.getElementById("newOpTitle").value.trim();
      const description = document.getElementById("newOpDesc").value.trim();
      const category_id = document.getElementById("newOpCategory").value;
      const type = document.getElementById("newOpType").value;
      const mode = document.getElementById("newOpMode").value;
      const location = document.getElementById("newOpLocation").value.trim();
      const stipend_or_fee = document.getElementById("newOpStipend").value.trim();
      const deadline = document.getElementById("newOpDeadline").value;
      const requirements = document.getElementById("newOpReqs").value.trim();
      const spots = document.getElementById("newOpSpots").value;
      const image = document.getElementById("newOpImage").value.trim();

      const result = await window.OpportunityService.create({
        title,
        description,
        category_id,
        type,
        mode,
        location,
        stipend_or_fee,
        deadline,
        requirements,
        spots,
        image
      });

      if (result.success) {
        const modalEl = document.getElementById("createOpportunityModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
        createForm.reset();

        if (window.App) window.App.showToast("Opportunity published successfully!", "success");
        initProviderDashboard();
      } else {
        alert("Failed to create opportunity.");
      }
    };
  }
}

window.deleteProviderOpportunity = async function (id) {
  if (!confirm("Are you sure you want to remove this opportunity?")) return;
  await window.OpportunityService.delete(id);
  initProviderDashboard();
  if (window.App) window.App.showToast("Opportunity deleted successfully.", "info");
};

window.setApplicantStatus = async function (appId, newStatus) {
  await window.ApplicationService.updateStatus(appId, newStatus);
  initProviderDashboard();
  if (window.App) window.App.showToast(`Application status updated to ${newStatus}.`, "success");
};

window.viewApplicantDetails = async function (appId) {
  const app = await window.ApplicationService.getById(appId);
  if (!app) return;

  const modalBody = document.getElementById("applicantDetailBody");
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="mb-3">
        <label class="fw-bold text-dark small">Applicant:</label>
        <div class="fs-6 fw-bold">${app.student_name} (${app.student_email})</div>
      </div>
      <div class="mb-3">
        <label class="fw-bold text-dark small">Opportunity Applied For:</label>
        <div class="small text-secondary">${app.opportunity_title}</div>
      </div>
      <div class="mb-3">
        <label class="fw-bold text-dark small">Candidate Personal Statement:</label>
        <div class="p-3 bg-light rounded border text-secondary small lh-base">${app.statement}</div>
      </div>
      <div class="mb-3">
        <label class="fw-bold text-dark small">Submitted CV / Portfolio:</label>
        <div>
          <a href="${app.resume_link}" target="_blank" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-box-arrow-up-right me-1"></i>View Attached Resume Link
          </a>
        </div>
      </div>
    `;
    const modalEl = document.getElementById("applicantDetailModal");
    if (modalEl) {
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
    }
  }
};

/* =========================================================================
   3. ADMIN DASHBOARD LOGIC
   ========================================================================= */
async function initAdminDashboard() {
  if (window.Router && !window.Router.guard(["admin"])) return;

  // Load metrics
  let users = [];
  let opportunities = [];
  let applications = [];

  try {
    users = await window.UserService.getAll();
    opportunities = await window.OpportunityService.getAll();
    applications = await window.ApplicationService.getAll();
  } catch (loadErr) {
    console.error("Error fetching admin dashboard metrics:", loadErr);
    if (window.App) window.App.showToast(loadErr.message || "Failed to load dashboard data from backend.", "danger");
  }

  const statUsers = document.getElementById("adminStatUsers");
  const statProviders = document.getElementById("adminStatProviders");
  const statOps = document.getElementById("adminStatOpportunities");
  const statApps = document.getElementById("adminStatApplications");

  if (statUsers) statUsers.textContent = users.length;
  if (statProviders) statProviders.textContent = users.filter(u => u.role === "provider").length;
  if (statOps) statOps.textContent = opportunities.length;
  if (statApps) statApps.textContent = applications.length;

  // Render User Management Table
  const roleSelect = document.getElementById("adminUserRoleFilter");
  const searchInput = document.getElementById("adminUserSearch");

  async function renderUsers() {
    const tableBody = document.getElementById("adminUsersTable");
    if (!tableBody) return;

    let filtered = await window.UserService.getAll(roleSelect ? roleSelect.value : "all");
    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.toLowerCase().trim();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    tableBody.innerHTML = filtered.map(u => `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${u.avatar}" class="rounded-circle border" width="32" height="32" style="object-fit: cover;">
            <div>
              <div class="fw-semibold text-dark small">${u.name}</div>
              <div class="text-xs text-muted">${u.email}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${u.role === 'admin' ? 'bg-danger' : (u.role === 'provider' ? 'bg-warning text-dark' : 'bg-primary')} text-uppercase" style="font-size: 0.65rem;">
            ${u.role}
          </span>
        </td>
        <td class="small text-muted">${u.organization || 'Individual'}</td>
        <td>
          <span class="badge ${u.status === 'active' ? 'bg-success' : 'bg-danger'}">${u.status}</span>
        </td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary py-1" onclick="toggleUserStatus(${u.id})" title="Toggle Active / Suspended">
              <i class="bi ${u.status === 'active' ? 'bi-slash-circle' : 'bi-check-circle'}"></i>
            </button>
            <button class="btn btn-outline-danger py-1" onclick="deleteUserRow(${u.id})" title="Delete Account">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  if (roleSelect) roleSelect.addEventListener("change", renderUsers);
  if (searchInput) searchInput.addEventListener("input", renderUsers);
  renderUsers();

  // Render Opportunities Moderation Table
  const opsTable = document.getElementById("adminOpsTable");
  if (opsTable) {
    opsTable.innerHTML = opportunities.map(op => `
      <tr>
        <td>
          <div class="fw-semibold text-dark small">${op.title}</div>
          <span class="text-xs text-muted"><i class="bi bi-building me-1"></i>${op.provider_name}</span>
        </td>
        <td><span class="badge bg-light text-secondary border text-xs">${op.type}</span></td>
        <td>${op.location}</td>
        <td><span class="badge ${op.status === 'active' ? 'bg-success' : 'bg-secondary'}">${op.status}</span></td>
        <td class="text-end">
          <button class="btn btn-xs btn-outline-danger py-1" onclick="adminDeleteOpportunity(${op.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }
}

window.toggleUserStatus = async function (id) {
  const result = await window.UserService.toggleStatus(id);
  if (result.success) {
    initAdminDashboard();
    if (window.App) window.App.showToast(`User account status updated to ${result.user.status}.`, "success");
  }
};

window.deleteUserRow = async function (id) {
  if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
  await window.UserService.deleteUser(id);
  initAdminDashboard();
  if (window.App) window.App.showToast("User account deleted.", "info");
};

window.adminDeleteOpportunity = async function (id) {
  if (!confirm("Delete this opportunity as administrator?")) return;
  await window.OpportunityService.delete(id);
  initAdminDashboard();
  if (window.App) window.App.showToast("Opportunity removed by administrator.", "info");
};
