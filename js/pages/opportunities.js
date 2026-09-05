/**
 * EduConnect - Opportunities Page Controller
 * 
 * STRICT ARCHITECTURAL RULE:
 * This UI controller NEVER accesses mock data directly.
 * It strictly calls `OpportunityService.getAll()`, `OpportunityService.getById()`,
 * `ApplicationService.apply()`, etc.
 * 
 * When the backend is migrated to PHP/MySQL later, this file remains 100% UNCHANGED.
 */

document.addEventListener("DOMContentLoaded", async function () {
  const container = document.getElementById("opportunitiesContainer");
  const searchInput = document.getElementById("searchOpportunities");
  const categoryFilter = document.getElementById("categoryFilter");
  const typeFilter = document.getElementById("typeFilter");
  const modeFilter = document.getElementById("modeFilter");
  const countBadge = document.getElementById("opportunitiesCount");

  // Read URL query parameters (e.g. ?category=1)
  const queryParams = window.Router ? window.Router.getQueryParams() : {};
  if (queryParams.category && categoryFilter) {
    categoryFilter.value = queryParams.category;
  }
  if (queryParams.search && searchInput) {
    searchInput.value = queryParams.search;
  }

  // Load and render opportunities
  async function loadOpportunities() {
    if (!container) return;
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading opportunities...</span>
        </div>
        <div class="text-muted mt-2 small">Fetching verified educational opportunities...</div>
      </div>
    `;

    const filters = {
      search: searchInput ? searchInput.value.trim() : "",
      category_id: categoryFilter ? categoryFilter.value : "all",
      type: typeFilter ? typeFilter.value : "all",
      mode: modeFilter ? modeFilter.value : "all"
    };

    try {
      // Data Layer Request via OpportunityService
      const opportunities = await window.OpportunityService.getAll(filters);
      renderList(opportunities);
    } catch (err) {
      console.error("Error loading opportunities:", err);
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger d-flex align-items-start gap-2">
            <i class="bi bi-exclamation-triangle-fill fs-5 mt-0.5"></i>
            <div>
              <strong>Failed to load opportunities</strong>
              <div class="small mt-1">${err.message || "An error occurred while communicating with the data service."}</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  async function renderList(items) {
    if (countBadge) {
      countBadge.textContent = `${items.length} ${items.length === 1 ? 'Opportunity' : 'Opportunities'}`;
    }

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="empty-state my-4">
            <div class="empty-state-icon"><i class="bi bi-search"></i></div>
            <h5 class="fw-bold text-dark">No matching opportunities found</h5>
            <p class="text-muted small">Try broadening your search criteria or resetting filters.</p>
            <button class="btn btn-sm btn-outline-primary" id="resetFiltersBtn">Reset All Filters</button>
          </div>
        </div>
      `;
      const resetBtn = document.getElementById("resetFiltersBtn");
      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          if (searchInput) searchInput.value = "";
          if (categoryFilter) categoryFilter.value = "all";
          if (typeFilter) typeFilter.value = "all";
          if (modeFilter) modeFilter.value = "all";
          loadOpportunities();
        });
      }
      return;
    }

    const currentUser = window.AuthService ? window.AuthService.getCurrentUser() : null;

    let html = "";
    for (const op of items) {
      const isSaved = currentUser ? await window.OpportunityService.isSaved(op.id, currentUser.id) : false;
      const savedClass = isSaved ? "active text-danger" : "text-muted";
      const savedIcon = isSaved ? "bi-bookmark-fill" : "bi-bookmark";

      // Badge color based on type
      let badgeClass = "bg-primary text-white";
      if (op.type === "Scholarship") badgeClass = "bg-success text-white";
      else if (op.type === "Internship") badgeClass = "bg-info text-dark";
      else if (op.type === "Competition") badgeClass = "bg-warning text-dark";
      else if (op.type === "Volunteer") badgeClass = "bg-secondary text-white";

      html += `
        <div class="col-lg-4 col-md-6 mb-4">
          <div class="edu-card h-100">
            <div class="edu-card-img-wrapper">
              <span class="edu-card-badge ${badgeClass}">${op.type}</span>
              <button class="edu-card-bookmark-btn ${savedClass}" onclick="handleBookmarkClick(event, ${op.id})" title="Save to bookmarks">
                <i class="bi ${savedIcon}"></i>
              </button>
              <img src="${op.image}" alt="${op.title}" loading="lazy">
            </div>
            <div class="p-3.5 d-flex flex-column flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-1.5 text-xs text-muted">
                <span><i class="bi bi-building me-1"></i>${op.provider_name}</span>
                <span>•</span>
                <span><i class="bi bi-geo-alt me-1"></i>${op.location}</span>
              </div>
              <h5 class="fs-6 fw-bold mb-2 text-dark text-truncate-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.8rem;">
                ${op.title}
              </h5>
              <p class="text-secondary small mb-3 text-truncate-2 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.5rem;">
                ${op.description}
              </p>
              
              <div class="pt-2 border-top d-flex align-items-center justify-content-between mb-3 text-xs">
                <div>
                  <span class="text-muted d-block">Stipend / Value</span>
                  <span class="fw-semibold text-primary">${op.stipend_or_fee}</span>
                </div>
                <div class="text-end">
                  <span class="text-muted d-block">Deadline</span>
                  <span class="fw-semibold text-dark"><i class="bi bi-clock me-1"></i>${op.deadline}</span>
                </div>
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-secondary w-50 fw-semibold" onclick="openOpportunityDetailModal(${op.id})">
                  Details
                </button>
                <button class="btn btn-sm btn-primary w-50 fw-semibold" onclick="openApplyModal(${op.id})">
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  // Filter event listeners with debounce for search
  let searchTimeout = null;
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(loadOpportunities, 300);
    });
  }

  if (categoryFilter) categoryFilter.addEventListener("change", loadOpportunities);
  if (typeFilter) typeFilter.addEventListener("change", loadOpportunities);
  if (modeFilter) modeFilter.addEventListener("change", loadOpportunities);

  // Initial load
  loadOpportunities();
});

// Bookmark Click Handler
window.handleBookmarkClick = async function (e, opportunityId) {
  e.stopPropagation();

  // FIX: Capture the button reference immediately before the 'await'
  // This prevents the "Cannot read properties of null" error when the event loop continues
  const btn = e.currentTarget || (e.target && e.target.closest('button'));

  if (!btn) {
    console.error("Bookmark button not found.");
    return;
  }

  const user = window.AuthService ? window.AuthService.getCurrentUser() : null;

  if (!user) {
    if (window.App) {
      window.App.showToast("Please sign in to save opportunities to your dashboard.", "info");
    }
    return;
  }

  try {
    const result = await window.OpportunityService.toggleSave(opportunityId, user.id);

    if (!result.success) {
      if (window.App) {
        window.App.showToast(result.message || "Unable to save opportunity.", "danger");
      }
      return;
    }

    // Use the captured 'btn' reference safely
    const icon = btn.querySelector("i");

    if (result.isSaved) {
      btn.classList.add("active", "text-danger");
      btn.classList.remove("text-muted");
      if (icon) icon.className = "bi bi-bookmark-fill";
      if (window.App) window.App.showToast("Opportunity saved to your dashboard bookmarks.", "success");
    } else {
      btn.classList.remove("active", "text-danger");
      btn.classList.add("text-muted");
      if (icon) icon.className = "bi bi-bookmark";
      if (window.App) window.App.showToast("Opportunity removed from saved list.", "info");
    }
  } catch (error) {
    console.error("Bookmark error:", error);
    if (window.App) {
      window.App.showToast("Something went wrong while saving the opportunity.", "danger");
    }
  }
};

// Open Opportunity Detail Modal
window.openOpportunityDetailModal = async function (id) {
  const op = await window.OpportunityService.getById(id);
  if (!op) return;

  const modalTitle = document.getElementById("opDetailModalTitle");
  const modalBody = document.getElementById("opDetailModalBody");
  const modalApplyBtn = document.getElementById("opDetailModalApplyBtn");

  if (modalTitle) modalTitle.textContent = op.title;
  if (modalApplyBtn) {
    modalApplyBtn.onclick = () => {
      const modalEl = document.getElementById("opportunityDetailModal");
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();
      window.openApplyModal(id);
    };
  }

  if (modalBody) {
    modalBody.innerHTML = `
      <div class="row g-4">
        <div class="col-md-5">
          <img src="${op.image}" class="img-fluid rounded-3 border shadow-sm w-100" style="height: 220px; object-fit: cover;" alt="${op.title}">
          <div class="mt-3 bg-light p-3 rounded border text-xs">
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">Opportunity Type:</span>
              <span class="fw-bold">${op.type}</span>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">Mode:</span>
              <span class="fw-bold">${op.mode}</span>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">Location:</span>
              <span class="fw-bold">${op.location}</span>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">Award / Cost:</span>
              <span class="fw-bold text-primary">${op.stipend_or_fee}</span>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">Available Spots:</span>
              <span class="fw-bold">${op.spots} openings</span>
            </div>
            <div class="d-flex justify-content-between py-1">
              <span class="text-muted">Application Deadline:</span>
              <span class="fw-bold text-danger">${op.deadline}</span>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="d-flex align-items-center gap-2 mb-2">
            <span class="badge bg-primary">${op.type}</span>
            <span class="text-muted small"><i class="bi bi-building me-1"></i>${op.provider_name}</span>
          </div>
          <h5 class="fw-bold text-dark mb-3">${op.title}</h5>
          
          <h6 class="fw-semibold text-dark small text-uppercase tracking-wider">Overview</h6>
          <p class="text-secondary small lh-base mb-3">${op.description}</p>
          
          <h6 class="fw-semibold text-dark small text-uppercase tracking-wider">Eligibility & Requirements</h6>
          <div class="bg-light p-3 rounded border text-secondary small mb-3">
            <i class="bi bi-check2-circle text-success me-1"></i>${op.requirements}
          </div>

          <div class="p-3 bg-primary bg-opacity-10 rounded border border-primary border-opacity-25 small text-primary d-flex align-items-center gap-2">
            <i class="bi bi-shield-check fs-5"></i>
            <div>
              <strong>Verified Opportunity:</strong> Applications are screened directly by ${op.provider_name}.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const modalEl = document.getElementById("opportunityDetailModal");
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
};

// Open Application Submission Modal
window.openApplyModal = async function (id) {
  const user = window.AuthService ? window.AuthService.getCurrentUser() : null;
  const role = window.AuthService ? window.AuthService.getCurrentRole() : null;

  if (!user) {
    if (window.App) window.App.showToast("Please log in to submit applications.", "info");
    const isPagesDir = window.location.pathname.includes("/pages/");
    setTimeout(() => {
      window.location.href = (isPagesDir ? "../" : "") + "login.html?redirect=" + encodeURIComponent(window.location.href);
    }, 800);
    return;
  }

  if (role !== "learner") {
    if (window.App) window.App.showToast("Only learner accounts can submit student applications.", "warning");
    return;
  }

  const op = await window.OpportunityService.getById(id);
  if (!op) return;

  const formOpId = document.getElementById("applyOpportunityId");
  const formOpTitle = document.getElementById("applyOpportunityTitle");
  const formApplicantName = document.getElementById("applyApplicantName");
  const formApplicantEmail = document.getElementById("applyApplicantEmail");
  const formResume = document.getElementById("applyResumeLink");
  const formStatement = document.getElementById("applyStatement");

  if (formOpId) formOpId.value = op.id;
  if (formOpTitle) formOpTitle.textContent = op.title;
  if (formApplicantName) formApplicantName.value = user.name || "";
  if (formApplicantEmail) formApplicantEmail.value = user.email || "";
  if (formResume) formResume.value = "https://example.com/resumes/" + (user.name.toLowerCase().replace(/\s+/g, '-')) + "-cv.pdf";
  if (formStatement) formStatement.value = "";

  const applyModalEl = document.getElementById("applyModal");
  if (applyModalEl) {
    const modal = new bootstrap.Modal(applyModalEl);
    modal.show();
  }
};

// Handle Application Form Submit
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("applicationForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const user = window.AuthService ? window.AuthService.getCurrentUser() : null;
      if (!user) return;

      const opId = document.getElementById("applyOpportunityId").value;
      const op = await window.OpportunityService.getById(opId);
      const statement = document.getElementById("applyStatement").value.trim();
      const resumeLink = document.getElementById("applyResumeLink").value.trim();

      if (!statement) {
        alert("Please write a brief statement of interest.");
        return;
      }

      const submitBtn = document.getElementById("applySubmitBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Submitting...`;
      }

      const applicationData = {
        opportunity_id: op.id,
        opportunity_title: op.title,
        student_id: user.id,
        student_name: user.name,
        student_email: user.email,
        resume_link: resumeLink,
        statement: statement
      };

      const result = await window.ApplicationService.apply(applicationData);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Submit Application`;
      }

      if (result.success) {
        const applyModalEl = document.getElementById("applyModal");
        const modal = bootstrap.Modal.getInstance(applyModalEl);
        if (modal) modal.hide();

        if (window.App) {
          window.App.showToast("Application submitted successfully! Track status in My Applications.", "success");
        }
      } else {
        alert(result.message || "Failed to submit application.");
      }
    });
  }
});
