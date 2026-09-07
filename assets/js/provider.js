/**
 * assets/js/provider.js
 * Provider dashboard for opportunity management and applicant portfolio review
 */

const EduProvider = (function () {
  let opportunities = [];
  let applications = [];

  const init = async () => {
    EduApi.renderNav('provider-dashboard');
    const auth = EduApi.getAuth();
    if (!auth || !auth.user || auth.user.role !== 'provider') {
      window.location.href = '/educonnect/login.html';
      return;
    }
    await loadDashboard();
  };

  const loadDashboard = async () => {
    const oppsRes = await EduApi.request('providers/opportunities.php');
    const appsRes = await EduApi.request('providers/applications.php');

    opportunities = (oppsRes.success && oppsRes.data) ? oppsRes.data : [];
    applications = (appsRes.success && appsRes.data) ? appsRes.data : [];

    renderMetrics();
    renderOpportunities();
    renderApplications();
  };

  const renderMetrics = () => {
    const oppCountEl = document.getElementById('provider-opp-count');
    const appCountEl = document.getElementById('provider-app-count');
    const pendingCountEl = document.getElementById('provider-pending-count');

    if (oppCountEl) oppCountEl.textContent = opportunities.length;
    if (appCountEl) appCountEl.textContent = applications.length;
    if (pendingCountEl) pendingCountEl.textContent = applications.filter(a => a.status === 'pending' || a.status === 'under_review').length;
  };

  const renderOpportunities = () => {
    const container = document.getElementById('provider-opps-table-body');
    if (!container) return;

    if (opportunities.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">No opportunities posted yet. Click "+ Create Opportunity" to publish one.</td></tr>`;
      return;
    }

    container.innerHTML = opportunities.map(o => `
      <tr>
        <td class="fw-semibold">
          <div class="text-truncate" style="max-width: 240px;" title="${o.title}">${o.title}</div>
          <span class="small text-muted">${o.category_name}</span>
        </td>
        <td><span class="badge-status ${o.status}">${o.status.replace('_', ' ')}</span></td>
        <td>${o.application_deadline}</td>
        <td><span class="badge bg-light text-dark border px-2 py-1">${o.applications_count || 0}</span></td>
        <td>
          <div class="d-flex gap-2">
            <a href="/educonnect/pages/opportunity-details.html?id=${o.id}" class="btn-edu-secondary btn-edu-sm">View</a>
            <button class="btn btn-sm btn-outline-secondary" onclick="EduProvider.openEditOppModal(${o.id})">Edit</button>
            <button class="btn btn-sm text-danger" onclick="EduProvider.deleteOpportunity(${o.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  };

  const renderApplications = () => {
    const container = document.getElementById('provider-apps-container');
    if (!container) return;

    if (applications.length === 0) {
      container.innerHTML = `<div class="state-box">No applications received yet.</div>`;
      return;
    }

    container.innerHTML = applications.map(a => `
      <div class="card-edu p-4 mb-3">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-3 mb-3">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h5 class="fw-bold m-0">${a.learner_name || 'Applicant'}</h5>
              <span class="badge-status ${a.status}">${a.status.replace('_', ' ')}</span>
              <span class="badge bg-light text-dark border">${a.application_type === 'express_interest' ? 'Expressed Interest' : 'Full Portfolio'}</span>
            </div>
            <p class="text-muted small mb-0">Applied for: <strong>${a.opportunity_title}</strong> • ${new Date(a.submitted_at).toLocaleDateString()}</p>
            <p class="small text-secondary mb-0">Contact: <strong>${a.learner_email}</strong> ${a.learner_phone ? `• ${a.learner_phone}` : ''}</p>
          </div>

          <div class="d-flex align-items-center gap-2">
            <select class="form-select-edu form-select-sm" style="width: 150px;" onchange="EduProvider.updateAppStatus(${a.id}, this.value)">
              <option value="pending" ${a.status === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="under_review" ${a.status === 'under_review' ? 'selected' : ''}>Under Review</option>
              <option value="accepted" ${a.status === 'accepted' ? 'selected' : ''}>Accepted</option>
              <option value="rejected" ${a.status === 'rejected' ? 'selected' : ''}>Rejected</option>
            </select>
          </div>
        </div>

        ${a.cover_message ? `
          <div class="p-3 mb-3 rounded-2 bg-light border small">
            <strong>Applicant Statement:</strong><br>
            <span class="text-secondary">${a.cover_message}</span>
          </div>
        ` : ''}

        <!-- Portfolio Accordion -->
        <details class="small">
          <summary class="fw-semibold text-primary" style="cursor: pointer;">View Applicant Portfolio & Qualifications</summary>
          <div class="mt-3 p-3 rounded-2 border border-light-subtle bg-body">
            <h6 class="fw-bold mb-2">🎓 Education</h6>
            ${(a.education && a.education.length) ? a.education.map(e => `<p class="mb-1">• <strong>${e.institution_name}</strong> - ${e.education_level} in ${e.field_of_study} (${e.grade || 'Completed'})</p>`).join('') : '<p class="text-muted mb-1">No education listed.</p>'}

            <h6 class="fw-bold mt-3 mb-2">⚡ Skills</h6>
            <div class="d-flex flex-wrap gap-1 mb-2">
              ${(a.skills && a.skills.length) ? a.skills.map(s => `<span class="badge bg-light text-dark border">${s.skill_name} (${s.skill_level})</span>`).join('') : '<span class="text-muted">No skills listed.</span>'}
            </div>

            <h6 class="fw-bold mt-3 mb-2">🚀 Projects</h6>
            ${(a.projects && a.projects.length) ? a.projects.map(p => `<p class="mb-1">• <strong>${p.title}</strong>: ${p.description || ''}</p>`).join('') : '<p class="text-muted mb-1">No projects listed.</p>'}
          </div>
        </details>
      </div>
    `).join('');
  };

  const updateAppStatus = async (appId, newStatus) => {
    const res = await EduApi.request('providers/applications.php', {
      method: 'POST',
      body: JSON.stringify({ application_id: appId, status: newStatus })
    });

    if (res.success) {
      EduApi.showToast(res.message, 'success');
      const app = applications.find(a => a.id === appId);
      if (app) app.status = newStatus;
      renderMetrics();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  const openCreateOppModal = () => {
    openOpportunityModal(null);
  };

  const openEditOppModal = (id) => {
    const opp = opportunities.find(o => o.id === id);
    if (!opp) return;
    openOpportunityModal(opp);
  };

  const openOpportunityModal = (opp = null) => {
    const isEdit = !!opp;
    let modal = document.getElementById('provider-create-opp-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'provider-create-opp-modal';
      modal.className = 'modal fade';
      document.body.appendChild(modal);
    }

    const currentImg = opp?.image || '';

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content modal-content-edu">
          <div class="modal-header modal-header-edu d-flex justify-content-between">
            <h5 class="modal-title fw-bold m-0">${isEdit ? 'Edit Opportunity' : 'Publish New Opportunity'}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <input type="hidden" id="opp-edit-id" value="${isEdit ? opp.id : ''}">
            <div class="row g-3">
              <!-- Featured Opportunity Image Upload -->
              <div class="col-12">
                <label class="form-label-edu fw-bold">Featured / Cover Image</label>
                <p class="text-muted small mb-2">Upload an image file. This image will appear at the top when users click "View Details".</p>
                <div class="p-3 rounded-3 border" style="background: var(--bg-muted);">
                  <div class="edu-image-preview-wrapper w-100 text-center mb-3">
                    <img id="opp-image-preview" class="edu-image-preview-banner" src="${currentImg}" alt="Opportunity Preview" style="${currentImg ? 'display:block;' : 'display:none;'}" onerror="this.style.display='none'">
                    <button type="button" id="opp-image-remove-btn" class="edu-upload-remove-btn" title="Remove image" style="${currentImg ? 'display:flex;' : 'display:none;'}">&times;</button>
                  </div>
                  <div id="opp-image-dropzone" class="edu-upload-zone py-3 px-3">
                    <div class="edu-upload-icon">🖼️</div>
                    <div class="fw-semibold small mb-1">Drag & drop opportunity image or</div>
                    <label class="btn-edu-primary btn-edu-sm cursor-pointer mb-0">
                      <span>Browse Image File</span>
                      <input type="file" id="opp-image-file" accept="image/*" class="d-none">
                    </label>
                    <div class="text-muted small mt-1" style="font-size:0.75rem;">Supports JPG, PNG, WEBP, GIF (Max 8MB)</div>
                  </div>
                  <div class="mt-2">
                    <details class="small text-muted">
                      <summary class="cursor-pointer" style="font-size:0.8rem;">Or paste image URL</summary>
                      <input type="url" id="opp-image-url" class="form-control-edu form-control-sm mt-1" value="${currentImg}" placeholder="https://example.com/banner.jpg">
                    </details>
                  </div>
                </div>
              </div>

              <div class="col-md-8">
                <label class="form-label-edu">Opportunity Title *</label>
                <input type="text" id="opp-title-input" class="form-control-edu" value="${opp?.title || ''}" placeholder="e.g. Oxford Excellence Scholarship" required>
              </div>
              <div class="col-md-4">
                <label class="form-label-edu">Category *</label>
                <select id="opp-cat-input" class="form-select-edu">
                  <option value="1" ${opp?.category_id == 1 ? 'selected' : ''}>Scholarships</option>
                  <option value="2" ${opp?.category_id == 2 ? 'selected' : ''}>Classes & Courses</option>
                  <option value="3" ${opp?.category_id == 3 ? 'selected' : ''}>Seminars</option>
                  <option value="4" ${opp?.category_id == 4 ? 'selected' : ''}>Workshops</option>
                  <option value="5" ${opp?.category_id == 5 ? 'selected' : ''}>Events</option>
                  <option value="6" ${opp?.category_id == 6 ? 'selected' : ''}>Internships</option>
                  <option value="7" ${opp?.category_id == 7 ? 'selected' : ''}>Volunteer Opportunities</option>
                  <option value="8" ${opp?.category_id == 8 ? 'selected' : ''}>Competitions</option>
                  <option value="9" ${opp?.category_id == 9 ? 'selected' : ''}>Other</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label-edu">Description *</label>
                <textarea id="opp-desc-input" class="form-control-edu" rows="3" required>${opp?.description || ''}</textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label-edu">Location</label>
                <input type="text" id="opp-loc-input" class="form-control-edu" value="${opp?.location || ''}" placeholder="e.g. Campus, Hybrid, or Online">
              </div>
              <div class="col-md-6">
                <label class="form-label-edu">Country</label>
                <input type="text" id="opp-country-input" class="form-control-edu" value="${opp?.country || ''}" placeholder="e.g. United Kingdom">
              </div>
              <div class="col-md-4">
                <label class="form-label-edu">Start Date</label>
                <input type="date" id="opp-start-input" class="form-control-edu" value="${opp?.start_date || ''}">
              </div>
              <div class="col-md-4">
                <label class="form-label-edu">Application Deadline *</label>
                <input type="date" id="opp-deadline-input" class="form-control-edu" value="${opp?.application_deadline || ''}" required>
              </div>
              <div class="col-md-4">
                <label class="form-label-edu">Available Slots</label>
                <input type="number" id="opp-slots-input" class="form-control-edu" value="${opp?.available_slots || ''}" placeholder="e.g. 50">
              </div>
              <div class="col-12">
                <label class="form-label-edu">Eligibility Criteria</label>
                <textarea id="opp-elig-input" class="form-control-edu" rows="2" placeholder="e.g. Minimum GPA, relevant coursework">${opp?.eligibility || ''}</textarea>
              </div>
              <div class="col-12">
                <label class="form-label-edu">Requirements</label>
                <textarea id="opp-req-input" class="form-control-edu" rows="2" placeholder="e.g. CV, Statement of Purpose">${opp?.requirements || ''}</textarea>
              </div>
              <div class="col-12">
                <label class="form-label-edu">External Application URL (Optional)</label>
                <input type="url" id="opp-ext-url" class="form-control-edu" value="${opp?.external_application_url || ''}" placeholder="https://">
              </div>
            </div>
          </div>
          <div class="modal-footer modal-footer-edu">
            <button type="button" class="btn-edu-secondary btn-edu-sm" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn-edu-primary btn-edu-sm" onclick="EduProvider.saveOpportunity()">${isEdit ? 'Update Opportunity' : 'Publish Opportunity'}</button>
          </div>
        </div>
      </div>
    `;

    new bootstrap.Modal(modal).show();

    // Hook up File Upload
    EduApi.setupFileUpload({
      fileInput: document.getElementById('opp-image-file'),
      textInput: document.getElementById('opp-image-url'),
      previewEl: document.getElementById('opp-image-preview'),
      dropZoneEl: document.getElementById('opp-image-dropzone'),
      removeBtn: document.getElementById('opp-image-remove-btn')
    });
  };

  const saveOpportunity = async () => {
    const editId = document.getElementById('opp-edit-id')?.value;
    const isEdit = !!editId;
    const title = document.getElementById('opp-title-input').value.trim();
    const deadline = document.getElementById('opp-deadline-input').value;
    const desc = document.getElementById('opp-desc-input').value.trim();

    if (!title || !deadline || !desc) {
      EduApi.showToast('Please fill in title, deadline, and description.', 'warning');
      return;
    }

    const payload = {
      ...(isEdit ? { id: parseInt(editId) } : {}),
      title,
      category_id: document.getElementById('opp-cat-input').value,
      description: desc,
      image: document.getElementById('opp-image-url').value.trim(),
      location: document.getElementById('opp-loc-input').value.trim(),
      country: document.getElementById('opp-country-input').value.trim(),
      start_date: document.getElementById('opp-start-input').value,
      application_deadline: deadline,
      available_slots: document.getElementById('opp-slots-input').value,
      eligibility: document.getElementById('opp-elig-input').value.trim(),
      requirements: document.getElementById('opp-req-input').value.trim(),
      external_application_url: document.getElementById('opp-ext-url').value.trim()
    };

    const res = await EduApi.request('providers/opportunities.php', {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });

    const modalEl = document.getElementById('provider-create-opp-modal');
    if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

    if (res.success) {
      EduApi.showToast(isEdit ? 'Opportunity updated successfully!' : 'Opportunity published!', 'success');
      loadDashboard();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  const deleteOpportunity = async (id) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    const res = await EduApi.request(`providers/opportunities.php?id=${id}`, { method: 'DELETE' });
    if (res.success) {
      EduApi.showToast('Opportunity deleted.', 'info');
      loadDashboard();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  // Intake Management
  const loadIntakes = async () => {
    const container = document.getElementById('provider-intakes-container');
    if (!container) return;

    const res = await EduApi.request('providers/intakes.php');
    if (res.success) {
      const intakes = res.data || [];
      if (intakes.length === 0) {
        container.innerHTML = `
          <div class="state-box">
            <div class="state-icon">📅</div>
            <h6 class="fw-bold">No academic intakes published yet</h6>
            <p class="text-muted small">Publish your upcoming admission cycle (e.g. Fall 2026, Spring 2027) so learners can plan their applications.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="table-responsive-custom">
          <table class="table table-hover align-middle mb-0">
            <thead>
              <tr class="table-light">
                <th>Intake Name</th>
                <th>Term & Season</th>
                <th>Academic Year</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${intakes.map(i => `
                <tr>
                  <td class="fw-semibold">${i.intake_name}</td>
                  <td>${i.term_season}</td>
                  <td>${i.academic_year}</td>
                  <td>${i.application_deadline}</td>
                  <td><span class="badge-status ${i.status}">${i.status}</span></td>
                  <td>
                    <button class="btn btn-sm text-danger" onclick="EduProvider.deleteIntake(${i.id})">Remove</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  };

  const openCreateIntakeModal = () => {
    let modal = document.getElementById('provider-create-intake-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'provider-create-intake-modal';
      modal.className = 'modal fade';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content modal-content-edu">
          <div class="modal-header modal-header-edu d-flex justify-content-between">
            <h5 class="modal-title fw-bold m-0">Publish Academic Intake</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <form id="create-intake-form">
              <div class="mb-3">
                <label class="form-label-edu small mb-1">Intake Name *</label>
                <input type="text" id="intake-name-input" class="form-control-edu" placeholder="e.g. Fall 2026 Regular Decision" required />
              </div>
              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label-edu small mb-1">Season</label>
                  <select id="intake-season-select" class="form-select-edu">
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label-edu small mb-1">Academic Year</label>
                  <input type="number" id="intake-year-input" class="form-control-edu" value="2026" required />
                </div>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-md-6">
                  <label class="form-label-edu small mb-1">Application Open Date</label>
                  <input type="date" id="intake-open-input" class="form-control-edu" value="${new Date().toISOString().split('T')[0]}" />
                </div>
                <div class="col-md-6">
                  <label class="form-label-edu small mb-1">Application Deadline *</label>
                  <input type="date" id="intake-deadline-input" class="form-control-edu" required />
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label-edu small mb-1">Programs Offered</label>
                <input type="text" id="intake-programs-input" class="form-control-edu" placeholder="e.g. Undergraduate Engineering & Humanities" />
              </div>
            </form>
          </div>
          <div class="modal-footer modal-footer-edu">
            <button type="button" class="btn-edu-secondary btn-edu-sm" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn-edu-primary btn-edu-sm" onclick="EduProvider.saveNewIntake()">Publish Intake</button>
          </div>
        </div>
      </div>
    `;

    new bootstrap.Modal(modal).show();
  };

  const saveNewIntake = async () => {
    const intakeName = document.getElementById('intake-name-input')?.value.trim();
    const deadline = document.getElementById('intake-deadline-input')?.value;

    if (!intakeName || !deadline) {
      EduApi.showToast('Please fill out intake name and deadline.', 'warning');
      return;
    }

    const payload = {
      intake_name: intakeName,
      term_season: document.getElementById('intake-season-select').value,
      academic_year: document.getElementById('intake-year-input').value,
      application_open_date: document.getElementById('intake-open-input').value,
      application_deadline: deadline,
      programs_offered: document.getElementById('intake-programs-input').value.trim()
    };

    const res = await EduApi.request('providers/intakes.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const modalEl = document.getElementById('provider-create-intake-modal');
    if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

    if (res.success) {
      EduApi.showToast('Intake published successfully!', 'success');
      loadIntakes();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  const deleteIntake = async (id) => {
    if (!confirm('Are you sure you want to remove this intake?')) return;
    const res = await EduApi.request(`providers/intakes.php?id=${id}`, { method: 'DELETE' });
    if (res.success) {
      EduApi.showToast('Intake removed.', 'info');
      loadIntakes();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  return {
    init,
    updateAppStatus,
    openCreateOppModal,
    openEditOppModal,
    saveOpportunity,
    saveNewOpportunity,
    deleteOpportunity,
    loadIntakes,
    openCreateIntakeModal,
    saveNewIntake,
    deleteIntake
  };
})();
