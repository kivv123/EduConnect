/**
 * EduConnect - Applications Page Controller
 * 
 * Allows students to track submitted application progress,
 * filter by status, and withdraw submissions.
 * Strictly calls ApplicationService.
 */

document.addEventListener("DOMContentLoaded", async function () {
  if (window.Router && !window.Router.guard(["learner"])) return;

  const user = window.AuthService.getCurrentUser();
  if (!user) return;

  const container = document.getElementById("applicationsListContainer");
  const statusFilterSelect = document.getElementById("applicationStatusFilter");

  async function loadApplications() {
    if (!container) return;

    container.innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
      </div>
    `;

    try {
      const allApps = await window.ApplicationService.getByStudent(user.id);
      const filter = statusFilterSelect ? statusFilterSelect.value : "all";

      const filtered = filter === "all" ? allApps : allApps.filter(a => a.status === filter);

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="empty-state my-4">
            <div class="empty-state-icon"><i class="bi bi-folder2-open"></i></div>
            <h5 class="fw-bold text-dark">No applications found</h5>
            <p class="text-muted small">You haven't submitted any applications with this status.</p>
            <a href="opportunities.html" class="btn btn-sm btn-primary">Discover Opportunities</a>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(app => {
        let statusBadge = `<span class="status-pill pending"><i class="bi bi-hourglass-split"></i> Pending Review</span>`;
        let statusDesc = `Your submission is received and queued for initial screening by the admissions board.`;
        
        if (app.status === "under_review") {
          statusBadge = `<span class="status-pill under_review"><i class="bi bi-eye"></i> Under Active Review</span>`;
          statusDesc = `The evaluation committee is currently reviewing your resume and credentials.`;
        } else if (app.status === "accepted") {
          statusBadge = `<span class="status-pill accepted"><i class="bi bi-check-circle-fill"></i> Accepted / Shortlisted</span>`;
          statusDesc = `Congratulations! You have been accepted for this program. Look for an onboarding email from the provider.`;
        } else if (app.status === "rejected") {
          statusBadge = `<span class="status-pill rejected"><i class="bi bi-x-circle-fill"></i> Not Selected</span>`;
          statusDesc = `Due to a high volume of candidates, your application was not selected at this time.`;
        }

        return `
          <div class="card border mb-3 shadow-sm rounded-3 overflow-hidden">
            <div class="card-body p-4">
              <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-3">
                <div>
                  <h5 class="fw-bold text-dark mb-1">${app.opportunity_title}</h5>
                  <div class="text-xs text-muted">
                    <i class="bi bi-calendar3 me-1"></i>Applied on: ${app.applied_at} • Application ID: #${app.id}
                  </div>
                </div>
                <div>${statusBadge}</div>
              </div>

              <div class="p-3 bg-light rounded-3 border mb-3">
                <div class="text-xs text-muted mb-1 fw-bold text-uppercase">Status Note:</div>
                <div class="small text-secondary mb-2">${statusDesc}</div>
                <div class="text-xs text-muted mb-1 fw-bold text-uppercase">Your Statement:</div>
                <div class="small text-secondary fst-italic">"${app.statement}"</div>
              </div>

              <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                <a href="${app.resume_link}" target="_blank" class="btn btn-sm btn-outline-secondary text-xs">
                  <i class="bi bi-file-earmark-pdf me-1"></i>View Attached Resume Link
                </a>
                ${app.status === 'pending' ? `
                  <button class="btn btn-sm btn-outline-danger text-xs" onclick="withdrawApplication(${app.id})">
                    <i class="bi bi-x-lg me-1"></i>Withdraw Application
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }).join("");
    } catch (err) {
      console.error("Error loading applications:", err);
      container.innerHTML = `
        <div class="alert alert-danger d-flex align-items-start gap-2">
          <i class="bi bi-exclamation-triangle-fill fs-5 mt-0.5"></i>
          <div>
            <strong>Failed to load applications</strong>
            <div class="small mt-1">${err.message || "An error occurred while fetching your applications."}</div>
          </div>
        </div>
      `;
    }
  }

  if (statusFilterSelect) {
    statusFilterSelect.addEventListener("change", loadApplications);
  }

  loadApplications();
});

window.withdrawApplication = async function (id) {
  if (!confirm("Are you sure you want to withdraw this application?")) return;
  const user = window.AuthService.getCurrentUser();
  if (!user) return;

  const result = await window.ApplicationService.withdraw(id, user.id);
  if (result.success) {
    if (window.App) window.App.showToast("Application successfully withdrawn.", "info");
    setTimeout(() => window.location.reload(), 400);
  } else {
    alert(result.message || "Failed to withdraw application.");
  }
};
