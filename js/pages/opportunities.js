document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("opportunitiesContainer");

  // Correct IDs from opportunities.html
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const typeFilter = document.getElementById("typeFilter");
  const modeFilter = document.getElementById("modeFilter");
  const savedOnlyFilter = document.getElementById("savedOnlyFilter");
  const sortFilter = document.getElementById("sortFilter");
  const resultsCount = document.getElementById("resultsCount");
  const resetFiltersBtn = document.getElementById("resetFiltersBtn");

  let searchTimeout = null;

  async function loadOpportunities() {
    if (!container) {
      console.error("opportunitiesContainer was not found.");
      return;
    }

    // Loading state
    container.innerHTML = `
      <div class="col-12">
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>

          <div class="text-muted mt-2 small">
            Fetching educational opportunities...
          </div>
        </div>
      </div>
    `;

    const filters = {
      search: searchInput
        ? searchInput.value.trim()
        : "",

      category_id: categoryFilter
        ? categoryFilter.value
        : "all",

      type: typeFilter
        ? typeFilter.value
        : "all",

      mode: modeFilter
        ? modeFilter.value
        : "all"
    };

    try {
      if (
        !window.OpportunityService ||
        typeof window.OpportunityService.getAll !== "function"
      ) {
        throw new Error(
          "OpportunityService is not available. Please check your JavaScript files."
        );
      }

      let opportunities =
        await window.OpportunityService.getAll(filters);

      // Always make sure we have an array
      if (!Array.isArray(opportunities)) {
        opportunities = [];
      }

      // Bookmarked-only filter
      if (savedOnlyFilter && savedOnlyFilter.checked) {
        const currentUser =
          window.AuthService &&
          typeof window.AuthService.getCurrentUser === "function"
            ? window.AuthService.getCurrentUser()
            : null;

        if (!currentUser) {
          opportunities = [];
        } else {
          const savedOpportunities = [];

          for (const opportunity of opportunities) {
            try {
              const saved =
                await window.OpportunityService.isSaved(
                  opportunity.id,
                  currentUser.id
                );

              if (saved) {
                savedOpportunities.push(opportunity);
              }
            } catch (error) {
              console.error(
                "Error checking saved opportunity:",
                opportunity.id,
                error
              );
            }
          }

          opportunities = savedOpportunities;
        }
      }

      // Sorting
      opportunities = sortOpportunities(opportunities);

      renderList(opportunities);

    } catch (error) {
      console.error("Error loading opportunities:", error);

      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger">
            <div class="d-flex align-items-start gap-2">
              <i class="bi bi-exclamation-triangle-fill fs-5"></i>

              <div>
                <strong>Failed to load opportunities</strong>

                <div class="small mt-1">
                  ${
                    error.message ||
                    "An error occurred while loading opportunities."
                  }
                </div>

                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger mt-3"
                  id="retryOpportunitiesBtn"
                >
                  <i class="bi bi-arrow-clockwise me-1"></i>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      `;

      const retryBtn =
        document.getElementById("retryOpportunitiesBtn");

      if (retryBtn) {
        retryBtn.addEventListener("click", loadOpportunities);
      }

      updateResultsCount(0);
    }
  }

  /*
   * ---------------------------------------------------------
   * SORT OPPORTUNITIES
   * ---------------------------------------------------------
   */

  function sortOpportunities(items) {
    if (!Array.isArray(items)) {
      return [];
    }

    const sortValue = sortFilter
      ? sortFilter.value
      : "newest";

    const sorted = [...items];

    if (sortValue === "title") {
      sorted.sort((a, b) => {
        const titleA = String(a.title || "").toLowerCase();
        const titleB = String(b.title || "").toLowerCase();

        return titleA.localeCompare(titleB);
      });
    }

    else if (sortValue === "deadline") {
      sorted.sort((a, b) => {
        const dateA = parseDate(a.deadline);
        const dateB = parseDate(b.deadline);

        return dateA - dateB;
      });
    }

    else {
      // newest
      sorted.sort((a, b) => {
        const dateA = parseDate(
          a.created_at || a.createdAt || a.date_added
        );

        const dateB = parseDate(
          b.created_at || b.createdAt || b.date_added
        );

        return dateB - dateA;
      });
    }

    return sorted;
  }

  /*
   * ---------------------------------------------------------
   * DATE HELPER
   * ---------------------------------------------------------
   */

  function parseDate(value) {
    if (!value) {
      return Number.MAX_SAFE_INTEGER;
    }

    const timestamp = new Date(value).getTime();

    if (Number.isNaN(timestamp)) {
      return Number.MAX_SAFE_INTEGER;
    }

    return timestamp;
  }

  /*
   * ---------------------------------------------------------
   * RENDER OPPORTUNITY LIST
   * ---------------------------------------------------------
   */

  async function renderList(items) {
    if (!container) {
      return;
    }

    if (!Array.isArray(items)) {
      items = [];
    }

    updateResultsCount(items.length);

    /*
     * Empty state
     */
    if (items.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <div class="empty-state my-4 text-center">
            
            <div class="empty-state-icon mb-3">
              <i class="bi bi-search fs-2"></i>
            </div>

            <h5 class="fw-bold text-dark">
              No matching opportunities found
            </h5>

            <p class="text-muted small mb-3">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              class="btn btn-sm btn-outline-primary"
              id="emptyResetFiltersBtn"
            >
              <i class="bi bi-arrow-counterclockwise me-1"></i>
              Reset Filters
            </button>

          </div>
        </div>
      `;

      const emptyResetBtn =
        document.getElementById("emptyResetFiltersBtn");

      if (emptyResetBtn) {
        emptyResetBtn.addEventListener(
          "click",
          resetFilters
        );
      }

      return;
    }

    /*
     * Get current user
     */
    const currentUser =
      window.AuthService &&
      typeof window.AuthService.getCurrentUser === "function"
        ? window.AuthService.getCurrentUser()
        : null;

    let html = "";

    /*
     * Build cards
     */
    for (const op of items) {
      if (!op) {
        continue;
      }

      let isSaved = false;

      /*
       * Check bookmark status
       */
      if (
        currentUser &&
        window.OpportunityService &&
        typeof window.OpportunityService.isSaved === "function"
      ) {
        try {
          isSaved =
            await window.OpportunityService.isSaved(
              op.id,
              currentUser.id
            );
        } catch (error) {
          console.error(
            "Unable to check bookmark:",
            op.id,
            error
          );
        }
      }

      /*
       * Bookmark appearance
       */
      const savedClass = isSaved
        ? "active text-danger"
        : "text-muted";

      const savedIcon = isSaved
        ? "bi-bookmark-fill"
        : "bi-bookmark";

      /*
       * Badge appearance
       */
      const badgeClass =
        getBadgeClass(op.type);

      /*
       * Safe values
       */
      const title =
        escapeHtml(op.title || "Untitled Opportunity");

      const provider =
        escapeHtml(op.provider_name || "Unknown Provider");

      const location =
        escapeHtml(op.location || "Location not specified");

      const image =
        op.image ||
        "../images/default-opportunity.jpg";

      const stipend =
        escapeHtml(
          op.stipend_or_fee || "Not specified"
        );

      const deadline =
        escapeHtml(
          op.deadline || "No deadline"
        );

      const type =
        escapeHtml(
          op.type || "Opportunity"
        );

      /*
       * IMPORTANT:
       *
       * Description is intentionally NOT displayed here.
       *
       * It remains inside the Details modal.
       */

      html += `
        <div class="col-lg-4 col-md-6 mb-4">
          
          <div class="edu-card h-100">

            <!-- Image -->
            <div class="edu-card-img-wrapper">

              <span class="edu-card-badge ${badgeClass}">
                ${type}
              </span>

              <button
                type="button"
                class="edu-card-bookmark-btn ${savedClass}"
                onclick="handleBookmarkClick(event, ${Number(op.id)})"
                title="Save to bookmarks"
                aria-label="Save opportunity"
              >
                <i class="bi ${savedIcon}"></i>
              </button>

              <img
                src="${image}"
                alt="${title}"
                loading="lazy"
                onerror="this.src='../images/default-opportunity.jpg'"
              >

            </div>

            <!-- Card Content -->
            <div class="p-3 d-flex flex-column flex-grow-1">

              <!-- Provider / Location -->
              <div
                class="d-flex align-items-center gap-2 mb-2 text-xs text-muted"
              >
                <span class="text-truncate">
                  <i class="bi bi-building me-1"></i>
                  ${provider}
                </span>

                <span>•</span>

                <span class="text-truncate">
                  <i class="bi bi-geo-alt me-1"></i>
                  ${location}
                </span>
              </div>

              <!-- Title -->
              <h5
                class="fs-6 fw-bold mb-3 text-dark"
                style="
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  min-height: 2.8rem;
                "
              >
                ${title}
              </h5>

              <!-- Opportunity Information -->
              <div
                class="pt-2 border-top d-flex align-items-center justify-content-between mb-3 text-xs mt-auto"
              >

                <div>
                  <span class="text-muted d-block">
                    Stipend / Value
                  </span>

                  <span class="fw-semibold text-primary">
                    ${stipend}
                  </span>
                </div>

                <div class="text-end">
                  <span class="text-muted d-block">
                    Deadline
                  </span>

                  <span class="fw-semibold text-dark">
                    <i class="bi bi-clock me-1"></i>
                    ${deadline}
                  </span>
                </div>

              </div>

              <!-- Buttons -->
              <div class="d-flex gap-2">

                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary w-50 fw-semibold"
                  onclick="openOpportunityDetailModal(${Number(op.id)})"
                >
                  <i class="bi bi-eye me-1"></i>
                  Details
                </button>

                <button
                  type="button"
                  class="btn btn-sm btn-primary w-50 fw-semibold"
                  onclick="openApplyModal(${Number(op.id)})"
                >
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

  /*
   * ---------------------------------------------------------
   * BADGE CLASS
   * ---------------------------------------------------------
   */

  function getBadgeClass(type) {
    switch (type) {
      case "Scholarship":
        return "bg-success text-white";

      case "Internship":
        return "bg-info text-dark";

      case "Competition":
        return "bg-warning text-dark";

      case "Volunteer":
        return "bg-secondary text-white";

      case "Course":
        return "bg-primary text-white";

      case "Workshop":
        return "bg-primary text-white";

      default:
        return "bg-primary text-white";
    }
  }

  /*
   * ---------------------------------------------------------
   * UPDATE RESULT COUNT
   * ---------------------------------------------------------
   */

  function updateResultsCount(count) {
    if (!resultsCount) {
      return;
    }

    if (count === 0) {
      resultsCount.textContent =
        "No opportunities found";
      return;
    }

    resultsCount.textContent =
      `Showing ${count} ${
        count === 1
          ? "opportunity"
          : "opportunities"
      }`;
  }

  /*
   * ---------------------------------------------------------
   * RESET FILTERS
   * ---------------------------------------------------------
   */

  function resetFilters() {
    if (searchInput) {
      searchInput.value = "";
    }

    if (categoryFilter) {
      categoryFilter.value = "all";
    }

    if (typeFilter) {
      typeFilter.value = "all";
    }

    if (modeFilter) {
      modeFilter.value = "all";
    }

    if (savedOnlyFilter) {
      savedOnlyFilter.checked = false;
    }

    if (sortFilter) {
      sortFilter.value = "newest";
    }

    loadOpportunities();
  }

  /*
   * ---------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------
   */

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      function () {
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(
          loadOpportunities,
          300
        );
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * FILTER EVENTS
   * ---------------------------------------------------------
   */

  if (categoryFilter) {
    categoryFilter.addEventListener(
      "change",
      loadOpportunities
    );
  }

  if (typeFilter) {
    typeFilter.addEventListener(
      "change",
      loadOpportunities
    );
  }

  if (modeFilter) {
    modeFilter.addEventListener(
      "change",
      loadOpportunities
    );
  }

  if (savedOnlyFilter) {
    savedOnlyFilter.addEventListener(
      "change",
      loadOpportunities
    );
  }

  if (sortFilter) {
    sortFilter.addEventListener(
      "change",
      loadOpportunities
    );
  }

  /*
   * ---------------------------------------------------------
   * RESET BUTTON
   * ---------------------------------------------------------
   */

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener(
      "click",
      resetFilters
    );
  }

  /*
   * ---------------------------------------------------------
   * INITIAL LOAD
   * ---------------------------------------------------------
   */

  loadOpportunities();
});


/*
 * =========================================================
 * BOOKMARK
 * =========================================================
 */

window.handleBookmarkClick = async function (
  event,
  opportunityId
) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  /*
   * Get the button immediately.
   *
   * This is important because the service call uses await.
   */
  const btn =
    event && event.currentTarget
      ? event.currentTarget
      : event &&
        event.target &&
        typeof event.target.closest === "function"
        ? event.target.closest("button")
        : null;

  if (!btn) {
    console.error(
      "Bookmark button could not be found."
    );
    return;
  }

  /*
   * Get logged-in user
   */
  const user =
    window.AuthService &&
    typeof window.AuthService.getCurrentUser === "function"
      ? window.AuthService.getCurrentUser()
      : null;

  /*
   * Guest user
   */
  if (!user) {
    if (
      window.App &&
      typeof window.App.showToast === "function"
    ) {
      window.App.showToast(
        "Please sign in to save opportunities.",
        "info"
      );
    }

    return;
  }

  /*
   * Check service
   */
  if (
    !window.OpportunityService ||
    typeof window.OpportunityService.toggleSave !==
      "function"
  ) {
    console.error(
      "OpportunityService.toggleSave is not available."
    );

    return;
  }

  /*
   * Prevent double-click while saving
   */
  if (btn.dataset.loading === "true") {
    return;
  }

  btn.dataset.loading = "true";
  btn.disabled = true;

  try {
    const result =
      await window.OpportunityService.toggleSave(
        opportunityId,
        user.id
      );

    if (!result || !result.success) {
      if (
        window.App &&
        typeof window.App.showToast === "function"
      ) {
        window.App.showToast(
          result &&
          result.message
            ? result.message
            : "Unable to save opportunity.",
          "danger"
        );
      }

      return;
    }

    const icon = btn.querySelector("i");

    /*
     * Saved
     */
    if (result.isSaved) {
      btn.classList.add(
        "active",
        "text-danger"
      );

      btn.classList.remove(
        "text-muted"
      );

      if (icon) {
        icon.className =
          "bi bi-bookmark-fill";
      }

      btn.setAttribute(
        "title",
        "Remove from bookmarks"
      );

      if (
        window.App &&
        typeof window.App.showToast === "function"
      ) {
        window.App.showToast(
          "Opportunity saved to your bookmarks.",
          "success"
        );
      }
    }

    /*
     * Removed
     */
    else {
      btn.classList.remove(
        "active",
        "text-danger"
      );

      btn.classList.add(
        "text-muted"
      );

      if (icon) {
        icon.className =
          "bi bi-bookmark";
      }

      btn.setAttribute(
        "title",
        "Save to bookmarks"
      );

      if (
        window.App &&
        typeof window.App.showToast === "function"
      ) {
        window.App.showToast(
          "Opportunity removed from saved list.",
          "info"
        );
      }
    }

    /*
     * If bookmark-only mode is active and the item
     * was removed, reload the list.
     */
    if (
      document.getElementById(
        "savedOnlyFilter"
      )?.checked &&
      result.isSaved === false
    ) {
      setTimeout(() => {
        const event =
          new Event("change");

        document
          .getElementById(
            "savedOnlyFilter"
          )
          ?.dispatchEvent(event);
      }, 200);
    }

  } catch (error) {
    console.error(
      "Bookmark error:",
      error
    );

    if (
      window.App &&
      typeof window.App.showToast === "function"
    ) {
      window.App.showToast(
        "Something went wrong while saving the opportunity.",
        "danger"
      );
    }

  } finally {
    btn.dataset.loading = "false";
    btn.disabled = false;
  }
};


/*
 * =========================================================
 * OPPORTUNITY DETAILS MODAL
 * =========================================================
 */

window.openOpportunityDetailModal =
  async function (id) {
    try {
      if (
        !window.OpportunityService ||
        typeof window.OpportunityService.getById !==
          "function"
      ) {
        console.error(
          "OpportunityService.getById is not available."
        );

        return;
      }

      const op =
        await window.OpportunityService.getById(id);

      if (!op) {
        console.error(
          "Opportunity not found:",
          id
        );

        return;
      }

      const modalTitle =
        document.getElementById(
          "opDetailModalTitle"
        );

      const modalBody =
        document.getElementById(
          "opDetailModalBody"
        );

      const modalApplyBtn =
        document.getElementById(
          "opDetailModalApplyBtn"
        );

      /*
       * Modal title
       */
      if (modalTitle) {
        modalTitle.textContent =
          op.title ||
          "Opportunity Overview";
      }

      /*
       * Apply button
       */
      if (modalApplyBtn) {
        modalApplyBtn.onclick =
          function () {
            const modalEl =
              document.getElementById(
                "opportunityDetailModal"
              );

            if (modalEl) {
              const existingModal =
                bootstrap.Modal.getInstance(
                  modalEl
                );

              if (existingModal) {
                existingModal.hide();
              }
            }

            window.openApplyModal(id);
          };
      }

      /*
       * Modal content
       */
      if (modalBody) {
        const image =
          op.image ||
          "../images/default-opportunity.jpg";

        const title =
          escapeHtml(
            op.title ||
            "Untitled Opportunity"
          );

        const type =
          escapeHtml(
            op.type ||
            "Opportunity"
          );

        const provider =
          escapeHtml(
            op.provider_name ||
            "Unknown Provider"
          );

        const mode =
          escapeHtml(
            op.mode ||
            "Not specified"
          );

        const location =
          escapeHtml(
            op.location ||
            "Not specified"
          );

        const stipend =
          escapeHtml(
            op.stipend_or_fee ||
            "Not specified"
          );

        const spots =
          escapeHtml(
            op.spots ??
            "Not specified"
          );

        const deadline =
          escapeHtml(
            op.deadline ||
            "No deadline"
          );

        /*
         * Full description stays HERE.
         */
        const description =
          escapeHtml(
            op.description ||
            "No description available."
          );

        const requirements =
          escapeHtml(
            op.requirements ||
            "No specific requirements provided."
          );

        modalBody.innerHTML = `
          <div class="row g-4">

            <!-- Left -->
            <div class="col-md-5">

              <img
                src="${image}"
                class="img-fluid rounded-3 border shadow-sm w-100"
                style="
                  height: 220px;
                  object-fit: cover;
                "
                alt="${title}"
                onerror="this.src='../images/default-opportunity.jpg'"
              >

              <div
                class="mt-3 bg-light p-3 rounded border text-xs"
              >

                <div
                  class="d-flex justify-content-between py-2 border-bottom"
                >
                  <span class="text-muted">
                    Opportunity Type:
                  </span>

                  <span class="fw-bold">
                    ${type}
                  </span>
                </div>

                <div
                  class="d-flex justify-content-between py-2 border-bottom"
                >
                  <span class="text-muted">
                    Mode:
                  </span>

                  <span class="fw-bold">
                    ${mode}
                  </span>
                </div>

                <div
                  class="d-flex justify-content-between py-2 border-bottom"
                >
                  <span class="text-muted">
                    Location:
                  </span>

                  <span class="fw-bold">
                    ${location}
                  </span>
                </div>

                <div
                  class="d-flex justify-content-between py-2 border-bottom"
                >
                  <span class="text-muted">
                    Award / Cost:
                  </span>

                  <span class="fw-bold text-primary">
                    ${stipend}
                  </span>
                </div>

                <div
                  class="d-flex justify-content-between py-2 border-bottom"
                >
                  <span class="text-muted">
                    Available Spots:
                  </span>

                  <span class="fw-bold">
                    ${spots}
                  </span>
                </div>

                <div
                  class="d-flex justify-content-between py-2"
                >
                  <span class="text-muted">
                    Application Deadline:
                  </span>

                  <span class="fw-bold text-danger">
                    ${deadline}
                  </span>
                </div>

              </div>
            </div>

            <!-- Right -->
            <div class="col-md-7">

              <div
                class="d-flex align-items-center gap-2 mb-2"
              >

                <span class="badge bg-primary">
                  ${type}
                </span>

                <span class="text-muted small">
                  <i class="bi bi-building me-1"></i>
                  ${provider}
                </span>

              </div>

              <h5
                class="fw-bold text-dark mb-3"
              >
                ${title}
              </h5>

              <!-- FULL DESCRIPTION -->
              <h6
                class="fw-semibold text-dark small text-uppercase mb-2"
              >
                Overview
              </h6>

              <p
                class="text-secondary small lh-base mb-4"
              >
                ${description}
              </p>

              <!-- REQUIREMENTS -->
              <h6
                class="fw-semibold text-dark small text-uppercase mb-2"
              >
                Eligibility & Requirements
              </h6>

              <div
                class="bg-light p-3 rounded border text-secondary small mb-3"
              >
                <i
                  class="bi bi-check2-circle text-success me-1"
                ></i>

                ${requirements}
              </div>

              <!-- VERIFIED -->
              <div
                class="p-3 bg-primary bg-opacity-10 rounded border border-primary border-opacity-25 small text-primary d-flex align-items-center gap-2"
              >

                <i
                  class="bi bi-shield-check fs-5"
                ></i>

                <div>
                  <strong>
                    Verified Opportunity:
                  </strong>

                  Applications are screened directly
                  by ${provider}.
                </div>

              </div>

            </div>

          </div>
        `;
      }

      /*
       * Show Bootstrap modal
       */
      const modalEl =
        document.getElementById(
          "opportunityDetailModal"
        );

      if (modalEl) {
        const modal =
          bootstrap.Modal.getOrCreateInstance(
            modalEl
          );

        modal.show();
      }

    } catch (error) {
      console.error(
        "Error opening opportunity details:",
        error
      );

      if (
        window.App &&
        typeof window.App.showToast === "function"
      ) {
        window.App.showToast(
          "Unable to load opportunity details.",
          "danger"
        );
      }
    }
  };


/*
 * =========================================================
 * APPLICATION MODAL
 * =========================================================
 */

window.openApplyModal =
  async function (id) {
    try {
      const user =
        window.AuthService &&
        typeof window.AuthService.getCurrentUser ===
          "function"
          ? window.AuthService.getCurrentUser()
          : null;

      const role =
        window.AuthService &&
        typeof window.AuthService.getCurrentRole ===
          "function"
          ? window.AuthService.getCurrentRole()
          : null;

      /*
       * Not logged in
       */
      if (!user) {
        if (
          window.App &&
          typeof window.App.showToast === "function"
        ) {
          window.App.showToast(
            "Please log in to submit applications.",
            "info"
          );
        }

        const isPagesDir =
          window.location.pathname.includes(
            "/pages/"
          );

        setTimeout(() => {
          window.location.href =
            (isPagesDir ? "../" : "") +
            "login.html?redirect=" +
            encodeURIComponent(
              window.location.href
            );
        }, 800);

        return;
      }

      /*
       * Only learner can apply
       */
      if (role !== "learner") {
        if (
          window.App &&
          typeof window.App.showToast === "function"
        ) {
          window.App.showToast(
            "Only learner accounts can submit student applications.",
            "warning"
          );
        }

        return;
      }

      /*
       * Get opportunity
       */
      const op =
        await window.OpportunityService.getById(id);

      if (!op) {
        return;
      }

      /*
       * Form fields
       */
      const formOpId =
        document.getElementById(
          "applyOpportunityId"
        );

      const formOpTitle =
        document.getElementById(
          "applyOpportunityTitle"
        );

      const formApplicantName =
        document.getElementById(
          "applyApplicantName"
        );

      const formApplicantEmail =
        document.getElementById(
          "applyApplicantEmail"
        );

      const formResume =
        document.getElementById(
          "applyResumeLink"
        );

      const formStatement =
        document.getElementById(
          "applyStatement"
        );

      /*
       * Populate form
       */
      if (formOpId) {
        formOpId.value = op.id;
      }

      if (formOpTitle) {
        formOpTitle.textContent =
          op.title || "";
      }

      if (formApplicantName) {
        formApplicantName.value =
          user.name || "";
      }

      if (formApplicantEmail) {
        formApplicantEmail.value =
          user.email || "";
      }

      if (formResume) {
        /*
         * Keep existing behavior.
         */
        const safeName =
          String(
            user.name || "student"
          )
            .toLowerCase()
            .replace(
              /\s+/g,
              "-"
            );

        formResume.value =
          "https://example.com/resumes/" +
          safeName +
          "-cv.pdf";
      }

      if (formStatement) {
        formStatement.value = "";
      }

      /*
       * Show modal
       */
      const applyModalEl =
        document.getElementById(
          "applyModal"
        );

      if (applyModalEl) {
        const modal =
          bootstrap.Modal.getOrCreateInstance(
            applyModalEl
          );

        modal.show();
      }

    } catch (error) {
      console.error(
        "Error opening application modal:",
        error
      );

      if (
        window.App &&
        typeof window.App.showToast === "function"
      ) {
        window.App.showToast(
          "Unable to open the application form.",
          "danger"
        );
      }
    }
  };


/*
 * =========================================================
 * APPLICATION FORM
 * =========================================================
 */

document.addEventListener(
  "DOMContentLoaded",
  function () {
    const form =
      document.getElementById(
        "applicationForm"
      );

    if (!form) {
      return;
    }

    form.addEventListener(
      "submit",
      async function (event) {
        event.preventDefault();

        const user =
          window.AuthService &&
          typeof window.AuthService.getCurrentUser ===
            "function"
            ? window.AuthService.getCurrentUser()
            : null;

        if (!user) {
          return;
        }

        const opId =
          document.getElementById(
            "applyOpportunityId"
          )?.value;

        const statement =
          document.getElementById(
            "applyStatement"
          )?.value
            .trim() || "";

        const resumeLink =
          document.getElementById(
            "applyResumeLink"
          )?.value
            .trim() || "";

        /*
         * Validate statement
         */
        if (!statement) {
          if (
            window.App &&
            typeof window.App.showToast ===
              "function"
          ) {
            window.App.showToast(
              "Please write a brief statement of interest.",
              "warning"
            );
          } else {
            alert(
              "Please write a brief statement of interest."
            );
          }

          return;
        }

        /*
         * Get opportunity
         */
        let op = null;

        try {
          op =
            await window.OpportunityService.getById(
              opId
            );
        } catch (error) {
          console.error(
            "Error getting opportunity:",
            error
          );
        }

        if (!op) {
          return;
        }

        /*
         * Submit button
         */
        const submitBtn =
          document.getElementById(
            "applySubmitBtn"
          );

        if (submitBtn) {
          submitBtn.disabled = true;

          submitBtn.innerHTML = `
            <span
              class="spinner-border spinner-border-sm me-2"
              role="status"
            ></span>
            Submitting...
          `;
        }

        /*
         * Application data
         */
        const applicationData = {
          opportunity_id: op.id,
          opportunity_title: op.title,
          student_id: user.id,
          student_name: user.name,
          student_email: user.email,
          resume_link: resumeLink,
          statement: statement
        };

        try {
          const result =
            await window.ApplicationService.apply(
              applicationData
            );

          /*
           * Restore button
           */
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML =
              "Submit Application";
          }

          /*
           * Success
           */
          if (
            result &&
            result.success
          ) {
            const applyModalEl =
              document.getElementById(
                "applyModal"
              );

            if (applyModalEl) {
              const modal =
                bootstrap.Modal.getInstance(
                  applyModalEl
                );

              if (modal) {
                modal.hide();
              }
            }

            /*
             * Reset form
             */
            form.reset();

            if (
              window.App &&
              typeof window.App.showToast ===
                "function"
            ) {
              window.App.showToast(
                "Application submitted successfully! Track your status in My Applications.",
                "success"
              );
            }
          }

          /*
           * Failed
           */
          else {
            const message =
              result &&
              result.message
                ? result.message
                : "Failed to submit application.";

            if (
              window.App &&
              typeof window.App.showToast ===
                "function"
            ) {
              window.App.showToast(
                message,
                "danger"
              );
            } else {
              alert(message);
            }
          }

        } catch (error) {
          console.error(
            "Application submission error:",
            error
          );

          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML =
              "Submit Application";
          }

          if (
            window.App &&
            typeof window.App.showToast ===
              "function"
          ) {
            window.App.showToast(
              "Something went wrong while submitting your application.",
              "danger"
            );
          }
        }
      }
    );
  }
);

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}