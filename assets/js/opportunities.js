/**
 * assets/js/opportunities.js
 * Handles opportunity directory, filtering, details, application modals, and bookmarks
 */

const EduOpportunities = (function () {
  let opportunitiesData = [];

  const initDirectory = async () => {
    EduApi.renderNav('opportunities');
    setupFilters();
    await loadOpportunities();
  };

  const loadOpportunities = async () => {
    const container = document.getElementById('opportunities-grid');
    if (!container) return;

    // Content Skeleton Placeholders
    container.innerHTML = `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="skeleton-card">
          <div class="skeleton-box mb-3" style="width: 35%; height: 20px;"></div>
          <div class="skeleton-box mb-2" style="width: 80%; height: 24px;"></div>
          <div class="skeleton-box mb-2" style="width: 50%; height: 16px;"></div>
          <div class="skeleton-box mb-4" style="width: 100%; height: 50px;"></div>
          <div class="skeleton-box" style="width: 100%; height: 36px;"></div>
        </div>
      </div>
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="skeleton-card">
          <div class="skeleton-box mb-3" style="width: 35%; height: 20px;"></div>
          <div class="skeleton-box mb-2" style="width: 75%; height: 24px;"></div>
          <div class="skeleton-box mb-2" style="width: 45%; height: 16px;"></div>
          <div class="skeleton-box mb-4" style="width: 100%; height: 50px;"></div>
          <div class="skeleton-box" style="width: 100%; height: 36px;"></div>
        </div>
      </div>
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="skeleton-card">
          <div class="skeleton-box mb-3" style="width: 35%; height: 20px;"></div>
          <div class="skeleton-box mb-2" style="width: 85%; height: 24px;"></div>
          <div class="skeleton-box mb-2" style="width: 60%; height: 16px;"></div>
          <div class="skeleton-box mb-4" style="width: 100%; height: 50px;"></div>
          <div class="skeleton-box" style="width: 100%; height: 36px;"></div>
        </div>
      </div>
    `;

    const search = document.getElementById('opp-search')?.value || '';
    const category = document.getElementById('opp-category')?.value || 'all';
    const status = document.getElementById('opp-status')?.value || 'all';
    const delivery_mode = document.getElementById('opp-delivery-mode')?.value || 'all';
    const urgency = document.getElementById('opp-urgency')?.value || 'all';

    const query = new URLSearchParams({
      search,
      category,
      status,
      delivery_mode,
      urgency
    }).toString();

    // Fetch opportunities and existing bookmarks in parallel
    const [res, bookRes] = await Promise.all([
      EduApi.request(`opportunities/index.php?${query}`),
      EduApi.request('opportunities/bookmark.php')
    ]);

    const bookmarkedIds = (bookRes.success && bookRes.data) ? bookRes.data.map(b => b.id) : [];

    if (res.success && res.data) {
      opportunitiesData = res.data;
      renderCards(res.data, container, bookmarkedIds);
    } else {
      container.innerHTML = `
        <div class="col-12 state-box">
          <div class="state-icon">⚠️</div>
          <p class="text-danger">Unable to load opportunities.</p>
        </div>
      `;
    }
  };

  const renderCards = (list, container, bookmarkedIds = []) => {
    if (list.length === 0) {
      container.innerHTML = `
        <div class="col-12 state-box">
          <div class="state-icon">🔍</div>
          <h5 class="fw-bold">No matching opportunities found</h5>
          <p class="text-muted">Try changing category, delivery mode, or search terms.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(o => {
      const isSaved = bookmarkedIds.includes(o.id);
      return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card-edu h-100 d-flex flex-column p-4">
          <div class="d-flex align-items-start justify-content-between mb-3">
            <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 small rounded-pill fw-semibold">
              ${o.category_name}
            </span>
            <span class="badge-status ${o.status}">${o.status.replace('_', ' ')}</span>
          </div>

          <h5 class="fw-bold mb-2 text-truncate" title="${o.title}">${o.title}</h5>

          <p class="small text-muted mb-2">
            <strong>${o.university_name || o.provider_name}</strong>
            ${o.university_is_verified ? '<span class="badge-verified ms-1" style="font-size:0.65rem;padding:0.1rem 0.4rem;">Verified ✓</span>' : ''}
          </p>

          <p class="small text-muted mb-3">📍 ${o.location || 'Online / Global'}</p>

          <p class="text-secondary small mb-3 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
            ${o.description}
          </p>

          <div class="pt-2 border-top d-flex align-items-center justify-content-between small text-muted mb-3">
            <span>Deadline: <strong>${o.application_deadline}</strong></span>
            ${o.available_slots ? `<span>Slots: <strong>${o.available_slots}</strong></span>` : ''}
          </div>

          <div class="d-flex gap-2">
            <a href="/educonnect/pages/opportunity-details.html?id=${o.id}" class="btn-edu-primary btn-edu-sm flex-grow-1">View Details</a>
            <button class="btn-edu-secondary btn-edu-sm ${isSaved ? 'text-primary' : ''}" onclick="EduOpportunities.toggleBookmark(${o.id}, this)" title="${isSaved ? 'Remove Bookmark' : 'Bookmark Opportunity'}">
              ${isSaved ? '🔖 Saved' : '🔖'}
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');
  };

  const setupFilters = () => {
    const search = document.getElementById('opp-search');
    const category = document.getElementById('opp-category');
    const status = document.getElementById('opp-status');
    const delivery = document.getElementById('opp-delivery-mode');
    const urgency = document.getElementById('opp-urgency');

    if (search) {
      let timeout;
      search.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(loadOpportunities, 250);
      });
    }

    if (category) category.addEventListener('change', loadOpportunities);
    if (status) status.addEventListener('change', loadOpportunities);
    if (delivery) delivery.addEventListener('change', loadOpportunities);
    if (urgency) urgency.addEventListener('change', loadOpportunities);
  };

  const toggleBookmark = async (id, btn) => {
    const res = await EduApi.request('opportunities/bookmark.php', {
      method: 'POST',
      body: JSON.stringify({ opportunity_id: id })
    });

    if (res.success) {
      EduApi.showToast(res.message, 'success');
      if (btn) btn.classList.toggle('text-primary', res.bookmarked);
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  // Details Page
  const initDetails = async () => {
    EduApi.renderNav('opportunities');
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const container = document.getElementById('opp-detail-container');
    if (!container || !id) return;

    const res = await EduApi.request(`opportunities/details.php?id=${id}`);
    if (!res.success || !res.data) {
      container.innerHTML = `
        <div class="state-box">
          <div class="state-icon">❌</div>
          <h4>Opportunity Not Found</h4>
          <a href="/educonnect/pages/opportunities.html" class="btn-edu-secondary btn-edu-sm mt-3">Back to Opportunities</a>
        </div>
      `;
      return;
    }

    const opp = res.data;
    const auth = EduApi.getAuth();
    const isLearner = auth && auth.user && auth.user.role === 'learner';

    let actionButtons = '';
    if (!auth || !auth.user) {
      actionButtons = `
        <div class="alert alert-info border-0 rounded-3 mb-0">
          <p class="small mb-2">Want to apply for this opportunity? Sign in or create a learner account to submit your application or express interest.</p>
          <a href="/educonnect/login.html" class="btn-edu-primary btn-edu-sm">Sign In to Apply</a>
        </div>
      `;
    } else if (isLearner) {
      if (opp.has_applied) {
        actionButtons = `
          <div class="card-edu-static p-3 text-center">
            <span class="badge-status ${opp.application_status}">${opp.application_status}</span>
            <p class="small text-muted mt-2 mb-0">You have already submitted an application for this opportunity.</p>
            <a href="/educonnect/pages/learner-applications.html" class="btn-edu-secondary btn-edu-sm mt-2">View Application Status</a>
          </div>
        `;
      } else {
        actionButtons = `
          <div class="d-flex flex-column gap-2">
            <button class="btn-edu-primary" onclick="EduOpportunities.openApplyModal(${opp.id}, 'profile_application')">
              Apply with EduConnect Profile
            </button>
            <button class="btn-edu-secondary" onclick="EduOpportunities.openApplyModal(${opp.id}, 'express_interest')">
              Express Interest Only
            </button>
            ${opp.external_application_url ? `<a href="${opp.external_application_url}" target="_blank" rel="noopener" class="btn btn-link small text-muted text-center">Visit External Portal ↗</a>` : ''}
          </div>
        `;
      }
    } else {
      actionButtons = `<p class="small text-muted">You are signed in as a ${auth.user.role}. Applications are open to learner accounts.</p>`;
    }

    container.innerHTML = `
      ${opp.image ? `
        <div class="row mb-3">
          <div class="col-12">
            <div class="detail-top-banner">
              <img src="${opp.image}" alt="${opp.title}" onerror="this.parentElement.style.display='none'" referrerPolicy="no-referrer">
            </div>
          </div>
        </div>
      ` : ''}
      <div class="row">
        <div class="col-lg-8">
          <div class="card-edu p-4 mb-4">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill fw-semibold">
                ${opp.category_name}
              </span>
              <span class="badge-status ${opp.status}">${opp.status.replace('_', ' ')}</span>
            </div>

            <h2 class="fw-bold mb-2">${opp.title}</h2>
            <p class="text-muted mb-4">
              Offered by <strong>${opp.university_name || opp.provider_name}</strong>
              ${opp.university_is_verified ? '<span class="badge-verified ms-1">Verified ✓</span>' : ''}
              ${opp.university_id ? `<span class="ms-2">• <a href="/educonnect/pages/university-details.html?id=${opp.university_id}">View University Profile</a></span>` : ''}
            </p>

            <h5 class="fw-bold mb-2">Description</h5>
            <p class="text-secondary mb-4" style="white-space: pre-line;">${opp.description}</p>

            ${opp.eligibility ? `
              <h5 class="fw-bold mb-2">Eligibility Criteria</h5>
              <p class="text-secondary mb-4" style="white-space: pre-line;">${opp.eligibility}</p>
            ` : ''}

            ${opp.requirements ? `
              <h5 class="fw-bold mb-2">Requirements & Instructions</h5>
              <p class="text-secondary mb-4" style="white-space: pre-line;">${opp.requirements}</p>
            ` : ''}
          </div>
        </div>

        <div class="col-lg-4">
          <div class="card-edu p-4 mb-4">
            <h5 class="fw-bold mb-3">Opportunity Details</h5>
            <ul class="list-unstyled small mb-4 d-flex flex-column gap-2 text-secondary">
              <li><strong>📍 Location:</strong> ${opp.location || 'Online / Global'}</li>
              <li><strong>📅 Start Date:</strong> ${opp.start_date || 'Flexible'}</li>
              <li><strong>🏁 End Date:</strong> ${opp.end_date || 'Ongoing'}</li>
              <li><strong>⏳ Deadline:</strong> <span class="text-danger fw-bold">${opp.application_deadline}</span></li>
              ${opp.available_slots ? `<li><strong>👥 Available Slots:</strong> ${opp.available_slots}</li>` : ''}
            </ul>

            ${actionButtons}
          </div>

          <div class="card-edu p-4">
            <h6 class="fw-bold mb-2">About the Host</h6>
            <p class="small text-muted mb-2"><strong>${opp.provider_name}</strong></p>
            <p class="small text-secondary mb-3">${opp.provider_website ? `<a href="${opp.provider_website}" target="_blank" rel="noopener">Official Website ↗</a>` : ''}</p>
            <p class="small text-muted mb-0">Contact: ${opp.contact_email || 'admissions@educonnect.org'}</p>
          </div>
        </div>
      </div>
    `;
  };

  const openApplyModal = (opportunityId, type) => {
    let modal = document.getElementById('apply-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'apply-modal';
      modal.className = 'modal fade';
      document.body.appendChild(modal);
    }

    const title = type === 'express_interest' ? 'Express Interest' : 'Submit EduConnect Profile Application';
    const desc = type === 'express_interest'
      ? 'Let the provider know you are interested in this opportunity. They will receive your basic contact details and headline.'
      : 'Your complete EduConnect portfolio (education, verified achievements, skills, certificates, and projects) will be shared directly with the provider review team.';

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content modal-content-edu">
          <div class="modal-header modal-header-edu d-flex justify-content-between">
            <h5 class="modal-title fw-bold m-0">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <p class="text-secondary small mb-3">${desc}</p>
            <div class="mb-3">
              <label class="form-label-edu">Personal Statement / Cover Message (Optional)</label>
              <textarea id="apply-cover-message" class="form-control-edu" rows="4" placeholder="Briefly state your motivation, goals, or why you are applying..."></textarea>
            </div>
          </div>
          <div class="modal-footer modal-footer-edu">
            <button type="button" class="btn-edu-secondary btn-edu-sm" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn-edu-primary btn-edu-sm" onclick="EduOpportunities.submitApplication(${opportunityId}, '${type}')">
              Confirm & Submit
            </button>
          </div>
        </div>
      </div>
    `;

    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  };

  const submitApplication = async (opportunityId, type) => {
    const coverMessage = document.getElementById('apply-cover-message')?.value || '';
    const res = await EduApi.request('applications/create.php', {
      method: 'POST',
      body: JSON.stringify({
        opportunity_id: opportunityId,
        application_type: type,
        cover_message: coverMessage
      })
    });

    const modalEl = document.getElementById('apply-modal');
    if (modalEl) {
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();
    }

    if (res.success) {
      EduApi.showToast(res.message, 'success');
      setTimeout(initDetails, 600);
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  return {
    initDirectory,
    initDetails,
    toggleBookmark,
    openApplyModal,
    submitApplication
  };
})();
