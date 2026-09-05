/**
 * EduConnect - Universities Page Controller
 * 
 * Manages university discovery, international intakes, and campus announcements.
 * Calls UniversityService strictly.
 */

document.addEventListener("DOMContentLoaded", async function () {
  const container = document.getElementById("universitiesContainer");
  const newsContainer = document.getElementById("universityNewsContainer");
  const searchInput = document.getElementById("searchUniversities");
  const countryFilter = document.getElementById("countryFilter");
  const scholarshipOnlyCheckbox = document.getElementById("scholarshipOnlyFilter");

  async function loadUniversities() {
    if (!container) return;

    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading universities...</span>
        </div>
      </div>
    `;

    const filters = {
      search: searchInput ? searchInput.value.trim() : "",
      country: countryFilter ? countryFilter.value : "all",
      scholarship_only: scholarshipOnlyCheckbox ? scholarshipOnlyCheckbox.checked : false
    };

    try {
      const universities = await window.UniversityService.getAll(filters);

      if (universities.length === 0) {
        container.innerHTML = `
          <div class="col-12">
            <div class="empty-state my-4">
              <div class="empty-state-icon"><i class="bi bi-buildings"></i></div>
              <h5 class="fw-bold text-dark">No universities found</h5>
              <p class="text-muted small">Try broadening your search term or clearing country filters.</p>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = universities.map(uni => `
        <div class="col-lg-6 mb-4">
          <div class="uni-card h-100 d-flex flex-column">
            <div class="position-relative" style="height: 160px; overflow: hidden;">
              <img src="${uni.banner}" class="w-100 h-100" style="object-fit: cover;" alt="${uni.name}">
              <div class="position-absolute top-0 end-0 m-3">
                <span class="badge bg-dark bg-opacity-75 text-white border border-light border-opacity-25 px-2.5 py-1.5 small">
                  <i class="bi bi-trophy text-warning me-1"></i>QS Rank #${uni.ranking}
                </span>
              </div>
              <div class="position-absolute bottom-0 start-0 m-3 d-flex align-items-center gap-2">
                <img src="${uni.logo}" class="rounded-3 border border-2 border-white shadow-sm bg-white" width="48" height="48" style="object-fit: cover;">
              </div>
            </div>
            
            <div class="p-4 d-flex flex-column flex-grow-1">
              <div class="d-flex align-items-center justify-content-between mb-1">
                <span class="text-muted text-xs"><i class="bi bi-geo-alt me-1"></i>${uni.city}, ${uni.country}</span>
                <span class="badge bg-light text-primary border text-xs">Est. ${uni.established}</span>
              </div>
              
              <h5 class="fw-bold text-dark mb-2">${uni.name}</h5>
              <p class="text-secondary small mb-3 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${uni.description}
              </p>

              <div class="p-2.5 bg-light rounded-3 border mb-3 text-xs">
                <div class="d-flex justify-content-between mb-1">
                  <span class="text-muted">Intakes:</span>
                  <span class="fw-semibold text-dark">${uni.intake_periods}</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span class="text-muted">Avg Tuition:</span>
                  <span class="fw-semibold text-primary">${uni.tuition_range}</span>
                </div>
              </div>

              <div class="d-flex gap-2">
                <a href="${uni.website}" target="_blank" class="btn btn-sm btn-outline-secondary w-50 fw-semibold">
                  <i class="bi bi-box-arrow-up-right me-1"></i>Website
                </a>
                <button class="btn btn-sm btn-primary w-50 fw-semibold" onclick="openUniversityDetailModal(${uni.id})">
                  Intakes & Info
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join("");
    } catch (err) {
      console.error("Error loading universities:", err);
      container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger d-flex align-items-start gap-2">
            <i class="bi bi-exclamation-triangle-fill fs-5 mt-0.5"></i>
            <div>
              <strong>Failed to load universities</strong>
              <div class="small mt-1">${err.message || "Could not retrieve university listings."}</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  async function loadNews() {
    if (!newsContainer) return;
    try {
      const newsList = await window.UniversityService.getAllNews();
      if (newsList.length === 0) {
        newsContainer.innerHTML = `<div class="text-muted small">No announcements found.</div>`;
        return;
      }

      newsContainer.innerHTML = newsList.map(item => `
        <div class="col-md-6 mb-3">
          <div class="p-3 bg-white rounded-3 border h-100 d-flex flex-column justify-content-between shadow-sm">
            <div>
              <div class="d-flex align-items-center justify-content-between text-xs text-muted mb-2">
                <span class="fw-semibold text-primary"><i class="bi bi-building me-1"></i>${item.university_name}</span>
                <span><i class="bi bi-calendar3 me-1"></i>${item.date}</span>
              </div>
              <h6 class="fw-bold text-dark mb-1">${item.title}</h6>
              <p class="text-secondary text-xs mb-0">${item.excerpt}</p>
            </div>
          </div>
        </div>
      `).join("");
    } catch (newsErr) {
      console.error("Error loading news:", newsErr);
      newsContainer.innerHTML = `<div class="text-danger small">${newsErr.message || "Failed to load news feed."}</div>`;
    }
  }

  if (searchInput) searchInput.addEventListener("input", loadUniversities);
  if (countryFilter) countryFilter.addEventListener("change", loadUniversities);
  if (scholarshipOnlyCheckbox) scholarshipOnlyCheckbox.addEventListener("change", loadUniversities);

  loadUniversities();
  loadNews();
});

window.openUniversityDetailModal = async function (id) {
  const uni = await window.UniversityService.getById(id);
  if (!uni) return;

  const titleEl = document.getElementById("uniModalTitle");
  const bodyEl = document.getElementById("uniModalBody");

  if (titleEl) titleEl.textContent = uni.name;
  if (bodyEl) {
    const intakesHtml = (uni.intakes || []).map(i => `
      <div class="d-flex align-items-center justify-content-between p-2.5 bg-light rounded border mb-2 text-xs">
        <div>
          <div class="fw-bold text-dark">${i.term}</div>
          <div class="text-muted">Deadline: ${i.deadline}</div>
        </div>
        <span class="badge ${i.status === 'Open' ? 'bg-success' : 'bg-secondary'}">${i.status}</span>
      </div>
    `).join("");

    bodyEl.innerHTML = `
      <div class="row g-4">
        <div class="col-md-6">
          <img src="${uni.banner}" class="img-fluid rounded-3 border shadow-sm w-100 mb-3" style="height: 180px; object-fit: cover;">
          <h6 class="fw-bold text-dark small text-uppercase tracking-wider">About Institution</h6>
          <p class="text-secondary small lh-base">${uni.description}</p>
        </div>
        <div class="col-md-6">
          <h6 class="fw-bold text-dark small text-uppercase tracking-wider mb-2">Upcoming Intakes</h6>
          ${intakesHtml || '<p class="text-muted small">No upcoming intake schedules posted.</p>'}
          
          <div class="mt-3 p-3 bg-light rounded border text-xs">
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">World Ranking:</span>
              <span class="fw-bold text-primary">QS #${uni.ranking}</span>
            </div>
            <div class="d-flex justify-content-between py-1 border-bottom">
              <span class="text-muted">Campus City:</span>
              <span class="fw-bold">${uni.city}, ${uni.country}</span>
            </div>
            <div class="d-flex justify-content-between py-1">
              <span class="text-muted">Tuition Range:</span>
              <span class="fw-bold">${uni.tuition_range}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const modalEl = document.getElementById("universityDetailModal");
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
};
