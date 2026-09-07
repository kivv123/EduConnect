/**
 * assets/js/learner-profile.js
 * Comprehensive portfolio editor with dynamic profile completion meter
 */

const EduLearnerProfile = (function () {
  let profileData = null;

  const init = async () => {
    EduApi.renderNav('learner-profile');
    const auth = EduApi.getAuth();
    if (!auth || !auth.user || auth.user.role !== 'learner') {
      window.location.href = '/educonnect/login.html';
      return;
    }
    await loadProfile();
  };

  const loadProfile = async () => {
    const container = document.getElementById('learner-portfolio-container');
    if (!container) return;

    container.innerHTML = `
      <div class="state-box">
        <div class="spinner-border text-primary mb-2" role="status"></div>
        <p class="text-muted m-0">Loading your EduConnect Portfolio...</p>
      </div>
    `;

    const res = await EduApi.request('learners/profile.php');
    if (!res.success || !res.data) {
      container.innerHTML = `<div class="state-box text-danger">Failed to load portfolio.</div>`;
      return;
    }

    profileData = res.data;
    render(container);
  };

  const render = (container) => {
    const { user, profile, education, skills, achievements, projects, certificates, languages, completion } = profileData;

    container.innerHTML = `
      <div class="row">
        <!-- Left Sidebar: Overview & Completion Score -->
        <div class="col-lg-4 mb-4">
          <!-- Profile Card -->
          <div class="card-edu p-4 mb-4 text-center">
            <img src="${profile.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}" alt="${user.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary-border); margin: 0 auto 1rem;">
            <h4 class="fw-bold mb-1">${user.name}</h4>
            <p class="text-primary small fw-semibold mb-2">${profile.headline || 'Student & Learner'}</p>
            <p class="text-muted small mb-3">📍 ${profile.city ? `${profile.city}, ` : ''}${profile.country || 'Global'}</p>
            <p class="text-secondary small mb-4" style="text-align: left;">${profile.bio || 'Add a bio to introduce yourself to institutions and scholarship committees.'}</p>
            
            <button class="btn-edu-secondary btn-edu-sm w-100" onclick="EduLearnerProfile.openEditProfileModal()">
              Edit Basic Profile
            </button>
          </div>

          <!-- Dynamic Completion Meter -->
          <div class="card-edu p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold m-0">Profile Completion</h6>
              <span class="fw-bold text-primary">${completion.percentage}%</span>
            </div>
            <div class="progress mb-3" style="height: 8px; border-radius: 4px; background-color: var(--bg-subtle);">
              <div class="progress-bar bg-primary" role="progressbar" style="width: ${completion.percentage}%;"></div>
            </div>
            <p class="small text-muted mb-3">A complete portfolio increases your chance of admission and scholarship consideration by 3.5x.</p>
            
            <ul class="list-unstyled small d-flex flex-column gap-2 m-0 text-secondary">
              <li class="${completion.checklist.basic_info ? 'text-success' : 'text-muted'}">${completion.checklist.basic_info ? '✓' : '○'} Basic info & bio</li>
              <li class="${completion.checklist.education ? 'text-success' : 'text-muted'}">${completion.checklist.education ? '✓' : '○'} Academic education</li>
              <li class="${completion.checklist.skills ? 'text-success' : 'text-muted'}">${completion.checklist.skills ? '✓' : '○'} Key skills (at least 2)</li>
              <li class="${completion.checklist.projects ? 'text-success' : 'text-muted'}">${completion.checklist.projects ? '✓' : '○'} Projects & research</li>
              <li class="${completion.checklist.certificates ? 'text-success' : 'text-muted'}">${completion.checklist.certificates ? '✓' : '○'} Certifications</li>
              <li class="${completion.checklist.achievements ? 'text-success' : 'text-muted'}">${completion.checklist.achievements ? '✓' : '○'} Honors & awards</li>
            </ul>
          </div>

          <!-- Quick Navigation & Actions -->
          <div class="card-edu p-4">
            <h6 class="fw-bold mb-3">My Activity & Tools</h6>
            <button class="btn-edu-primary btn-edu-sm w-100 mb-2" onclick="EduLearnerProfile.exportCv()">
              📄 Export Profile as CV / Resume
            </button>
            <a href="/educonnect/pages/learner-applications.html" class="btn-edu-secondary btn-edu-sm w-100 mb-2">View Submitted Applications</a>
            <a href="/educonnect/pages/opportunities.html" class="btn-edu-secondary btn-edu-sm w-100">Explore New Opportunities</a>
          </div>
        </div>

        <!-- Main Content: Detailed Portfolio Sections -->
        <div class="col-lg-8">
          <!-- Navigation Tabs: Portfolio vs Saved Bookmarks -->
          <ul class="nav nav-pills mb-4" id="learnerProfileTabs" role="tablist">
            <li class="nav-item">
              <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#tab-portfolio">
                🎓 Portfolio & Credentials
              </button>
            </li>
            <li class="nav-item">
              <button class="nav-link" data-bs-toggle="pill" data-bs-target="#tab-saved-bookmarks" onclick="EduLearnerProfile.loadSavedBookmarks()">
                🔖 Saved Opportunities (<span id="saved-count-badge">0</span>)
              </button>
            </li>
          </ul>

          <div class="tab-content">
            <div class="tab-pane fade show active" id="tab-portfolio">
          <!-- 1. Education Section -->
          <div class="card-edu p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold m-0">🎓 Education</h5>
              <button class="btn-edu-secondary btn-edu-sm" onclick="EduLearnerProfile.openAddEducationModal()">+ Add Education</button>
            </div>
            ${education.length === 0 ? '<p class="small text-muted m-0">No education records added yet.</p>' : education.map(e => `
              <div class="p-3 mb-2 rounded-3 border border-light-subtle d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="fw-bold m-0">${e.institution_name}</h6>
                  <p class="text-secondary small mb-1"><strong>${e.education_level}</strong> in ${e.field_of_study}</p>
                  <p class="text-muted small mb-1">${e.start_date} - ${e.end_date || 'Present'} ${e.grade ? `• Grade: ${e.grade}` : ''}</p>
                  ${e.description ? `<p class="small text-secondary mb-0">${e.description}</p>` : ''}
                </div>
                <button class="btn btn-sm text-danger" onclick="EduLearnerProfile.deleteItem('education', ${e.id})" title="Delete">&times;</button>
              </div>
            `).join('')}
          </div>

          <!-- 2. Skills Section -->
          <div class="card-edu p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold m-0">⚡ Skills & Competencies</h5>
              <button class="btn-edu-secondary btn-edu-sm" onclick="EduLearnerProfile.openAddSkillModal()">+ Add Skill</button>
            </div>
            <div class="d-flex flex-wrap gap-2">
              ${skills.length === 0 ? '<p class="small text-muted m-0">No skills added yet.</p>' : skills.map(s => `
                <span class="badge bg-light text-dark border p-2 d-inline-flex align-items-center gap-2">
                  <span><strong>${s.skill_name}</strong> (${s.skill_level})</span>
                  <button onclick="EduLearnerProfile.deleteItem('skills', ${s.id})" style="background:none;border:none;cursor:pointer;color:red;">&times;</button>
                </span>
              `).join('')}
            </div>
          </div>

          <!-- 3. Projects Section -->
          <div class="card-edu p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold m-0">🚀 Projects & Research</h5>
              <button class="btn-edu-secondary btn-edu-sm" onclick="EduLearnerProfile.openAddProjectModal()">+ Add Project</button>
            </div>
            ${projects.length === 0 ? '<p class="small text-muted m-0">No projects added yet.</p>' : projects.map(p => `
              <div class="p-3 mb-2 rounded-3 border border-light-subtle d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="fw-bold m-0">${p.title} ${p.project_url ? `<a href="${p.project_url}" target="_blank" class="small fw-normal ms-1">Link ↗</a>` : ''}</h6>
                  <p class="text-secondary small mb-1">Role: <strong>${p.role || 'Contributor'}</strong> • Tech: <em>${p.technologies || 'Various'}</em></p>
                  <p class="small text-secondary mb-0">${p.description || ''}</p>
                </div>
                <button class="btn btn-sm text-danger" onclick="EduLearnerProfile.deleteItem('projects', ${p.id})" title="Delete">&times;</button>
              </div>
            `).join('')}
          </div>

          <!-- 4. Certifications Section -->
          <div class="card-edu p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold m-0">📜 Certifications</h5>
              <button class="btn-edu-secondary btn-edu-sm" onclick="EduLearnerProfile.openAddCertModal()">+ Add Certificate</button>
            </div>
            ${certificates.length === 0 ? '<p class="small text-muted m-0">No certificates added yet.</p>' : certificates.map(c => `
              <div class="p-3 mb-2 rounded-3 border border-light-subtle d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="fw-bold m-0">${c.certificate_name}</h6>
                  <p class="text-secondary small mb-1">Issued by <strong>${c.issuing_organization}</strong> • ${c.issue_date}</p>
                  ${c.credential_url ? `<a href="${c.credential_url}" target="_blank" class="small">Verify Credential ↗</a>` : ''}
                </div>
                <button class="btn btn-sm text-danger" onclick="EduLearnerProfile.deleteItem('certificates', ${c.id})" title="Delete">&times;</button>
              </div>
            `).join('')}
          </div>

          <!-- 5. Achievements Section -->
          <div class="card-edu p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold m-0">🏆 Honors & Achievements</h5>
              <button class="btn-edu-secondary btn-edu-sm" onclick="EduLearnerProfile.openAddAchievementModal()">+ Add Achievement</button>
            </div>
            ${achievements.length === 0 ? '<p class="small text-muted m-0">No honors added yet.</p>' : achievements.map(a => `
              <div class="p-3 mb-2 rounded-3 border border-light-subtle d-flex justify-content-between align-items-start">
                <div>
                  <h6 class="fw-bold m-0">${a.title}</h6>
                  <p class="text-secondary small mb-1">${a.organization ? `${a.organization} • ` : ''}${a.date}</p>
                  <p class="small text-secondary mb-0">${a.description || ''}</p>
                </div>
                <button class="btn btn-sm text-danger" onclick="EduLearnerProfile.deleteItem('achievements', ${a.id})" title="Delete">&times;</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Tab 2: Saved Opportunities / Wishlist -->
        <div class="tab-pane fade" id="tab-saved-bookmarks">
          <div class="card-edu p-4">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="fw-bold m-0">🔖 Bookmarked Opportunities</h5>
              <span class="small text-muted">Directly apply or monitor deadlines</span>
            </div>
            <div id="saved-bookmarks-list">
              <div class="state-box">
                <div class="spinner-border text-primary mb-2" role="status"></div>
                <p class="text-muted m-0">Loading saved items...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
    `;
  };

  // Modals for adding items
  const openEditProfileModal = () => {
    const { profile, user } = profileData;
    let modal = document.getElementById('portfolio-edit-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'portfolio-edit-modal';
      modal.className = 'modal fade';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content modal-content-edu">
          <div class="modal-header modal-header-edu d-flex justify-content-between">
            <h5 class="modal-title fw-bold m-0">Edit Basic Profile</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">
            <div class="row g-3">
              <!-- Profile Photo File Upload Section -->
              <div class="col-12">
                <label class="form-label-edu fw-bold">Profile Photo</label>
                <div class="d-flex flex-column flex-sm-row align-items-center gap-3 p-3 rounded-3 border" style="background: var(--bg-muted);">
                  <div class="edu-image-preview-wrapper text-center">
                    <img id="edit-photo-preview" class="edu-image-preview-avatar" src="${profile.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}" alt="Avatar Preview" onerror="this.src='https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'">
                    <button type="button" id="edit-photo-remove-btn" class="edu-upload-remove-btn" title="Remove photo" style="${profile.profile_photo ? 'display:flex;' : 'display:none;'}">&times;</button>
                  </div>
                  <div class="flex-grow-1 w-100">
                    <div id="edit-photo-dropzone" class="edu-upload-zone py-3 px-3">
                      <div class="edu-upload-icon">📁</div>
                      <div class="fw-semibold small mb-1">Drag & drop photo here or</div>
                      <label class="btn-edu-primary btn-edu-sm cursor-pointer mb-0">
                        <span>Browse Image File</span>
                        <input type="file" id="edit-photo-file" accept="image/*" class="d-none">
                      </label>
                      <div class="text-muted small mt-1" style="font-size:0.75rem;">Supports JPG, PNG, WEBP, GIF (Max 8MB)</div>
                    </div>
                    <div class="mt-2">
                      <details class="small text-muted">
                        <summary class="cursor-pointer" style="font-size:0.8rem;">Or paste image URL</summary>
                        <input type="url" id="edit-photo" class="form-control-edu form-control-sm mt-1" value="${profile.profile_photo || ''}" placeholder="https://example.com/photo.jpg">
                      </details>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-6">
                <label class="form-label-edu">Professional Headline</label>
                <input type="text" id="edit-headline" class="form-control-edu" value="${profile.headline || ''}" placeholder="e.g. Computer Science Student">
              </div>
              <div class="col-md-6">
                <label class="form-label-edu">Country</label>
                <input type="text" id="edit-country" class="form-control-edu" value="${profile.country || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label-edu">City</label>
                <input type="text" id="edit-city" class="form-control-edu" value="${profile.city || ''}">
              </div>
              <div class="col-md-6">
                <label class="form-label-edu">LinkedIn URL</label>
                <input type="url" id="edit-linkedin" class="form-control-edu" value="${profile.linkedin_url || ''}">
              </div>
              <div class="col-12">
                <label class="form-label-edu">Biography</label>
                <textarea id="edit-bio" class="form-control-edu" rows="3">${profile.bio || ''}</textarea>
              </div>
              <div class="col-md-12">
                <label class="form-label-edu">Personal Website</label>
                <input type="url" id="edit-website" class="form-control-edu" value="${profile.website || ''}">
              </div>
            </div>
          </div>
          <div class="modal-footer modal-footer-edu">
            <button type="button" class="btn-edu-secondary btn-edu-sm" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn-edu-primary btn-edu-sm" onclick="EduLearnerProfile.saveProfile()">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    new bootstrap.Modal(modal).show();

    // Attach file upload handlers
    EduApi.setupFileUpload({
      fileInput: document.getElementById('edit-photo-file'),
      textInput: document.getElementById('edit-photo'),
      previewEl: document.getElementById('edit-photo-preview'),
      dropZoneEl: document.getElementById('edit-photo-dropzone'),
      removeBtn: document.getElementById('edit-photo-remove-btn')
    });
  };

  const saveProfile = async () => {
    const payload = {
      headline: document.getElementById('edit-headline').value.trim(),
      profile_photo: document.getElementById('edit-photo').value.trim(),
      country: document.getElementById('edit-country').value.trim(),
      city: document.getElementById('edit-city').value.trim(),
      bio: document.getElementById('edit-bio').value.trim(),
      linkedin_url: document.getElementById('edit-linkedin').value.trim(),
      website: document.getElementById('edit-website').value.trim()
    };

    const res = await EduApi.request('learners/profile.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const modalEl = document.getElementById('portfolio-edit-modal');
    if (modalEl) bootstrap.Modal.getInstance(modalEl)?.hide();

    if (res.success) {
      EduApi.showToast('Profile updated!', 'success');
      loadProfile();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  // Generic Sub-item Adders
  const openAddEducationModal = () => {
    openGenericModal('Add Education', `
      <div class="mb-3"><label class="form-label-edu">Institution Name *</label><input type="text" id="edu-inst" class="form-control-edu" required></div>
      <div class="row g-2 mb-3">
        <div class="col-md-6"><label class="form-label-edu">Degree / Level *</label><input type="text" id="edu-level" class="form-control-edu" placeholder="e.g. Bachelor" required></div>
        <div class="col-md-6"><label class="form-label-edu">Field of Study *</label><input type="text" id="edu-field" class="form-control-edu" placeholder="e.g. Economics" required></div>
      </div>
      <div class="row g-2 mb-3">
        <div class="col-md-6"><label class="form-label-edu">Start Date</label><input type="date" id="edu-start" class="form-control-edu"></div>
        <div class="col-md-6"><label class="form-label-edu">End Date (or expected)</label><input type="date" id="edu-end" class="form-control-edu"></div>
      </div>
      <div class="mb-3"><label class="form-label-edu">Grade / GPA</label><input type="text" id="edu-grade" class="form-control-edu" placeholder="e.g. 3.8 / 4.0"></div>
    `, async () => {
      await EduApi.request('learners/education.php', {
        method: 'POST',
        body: JSON.stringify({
          institution_name: document.getElementById('edu-inst').value,
          education_level: document.getElementById('edu-level').value,
          field_of_study: document.getElementById('edu-field').value,
          start_date: document.getElementById('edu-start').value,
          end_date: document.getElementById('edu-end').value,
          grade: document.getElementById('edu-grade').value
        })
      });
      loadProfile();
    });
  };

  const openAddSkillModal = () => {
    openGenericModal('Add Skill', `
      <div class="mb-3"><label class="form-label-edu">Skill Name *</label><input type="text" id="skill-name" class="form-control-edu" placeholder="e.g. Machine Learning" required></div>
      <div class="mb-3">
        <label class="form-label-edu">Proficiency Level</label>
        <select id="skill-level" class="form-select-edu">
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced" selected>Advanced</option>
          <option value="Expert">Expert</option>
        </select>
      </div>
    `, async () => {
      await EduApi.request('learners/skills.php', {
        method: 'POST',
        body: JSON.stringify({
          skill_name: document.getElementById('skill-name').value,
          skill_level: document.getElementById('skill-level').value
        })
      });
      loadProfile();
    });
  };

  const openAddProjectModal = () => {
    openGenericModal('Add Project', `
      <div class="mb-3"><label class="form-label-edu">Project Title *</label><input type="text" id="proj-title" class="form-control-edu" required></div>
      <div class="row g-2 mb-3">
        <div class="col-md-6"><label class="form-label-edu">Your Role</label><input type="text" id="proj-role" class="form-control-edu" placeholder="e.g. Lead Author"></div>
        <div class="col-md-6"><label class="form-label-edu">Project URL</label><input type="url" id="proj-url" class="form-control-edu"></div>
      </div>
      <div class="mb-3"><label class="form-label-edu">Technologies / Methods Used</label><input type="text" id="proj-tech" class="form-control-edu" placeholder="e.g. Python, Econometrics"></div>
      <div class="mb-3"><label class="form-label-edu">Description</label><textarea id="proj-desc" class="form-control-edu" rows="3"></textarea></div>
    `, async () => {
      await EduApi.request('learners/projects.php', {
        method: 'POST',
        body: JSON.stringify({
          title: document.getElementById('proj-title').value,
          role: document.getElementById('proj-role').value,
          project_url: document.getElementById('proj-url').value,
          technologies: document.getElementById('proj-tech').value,
          description: document.getElementById('proj-desc').value
        })
      });
      loadProfile();
    });
  };

  const openAddCertModal = () => {
    openGenericModal('Add Certification', `
      <div class="mb-3"><label class="form-label-edu">Certificate Name *</label><input type="text" id="cert-name" class="form-control-edu" required></div>
      <div class="mb-3"><label class="form-label-edu">Issuing Organization *</label><input type="text" id="cert-org" class="form-control-edu" required></div>
      <div class="row g-2 mb-3">
        <div class="col-md-6"><label class="form-label-edu">Issue Date</label><input type="date" id="cert-date" class="form-control-edu"></div>
        <div class="col-md-6"><label class="form-label-edu">Credential URL</label><input type="url" id="cert-url" class="form-control-edu"></div>
      </div>
    `, async () => {
      await EduApi.request('learners/certificates.php', {
        method: 'POST',
        body: JSON.stringify({
          certificate_name: document.getElementById('cert-name').value,
          issuing_organization: document.getElementById('cert-org').value,
          issue_date: document.getElementById('cert-date').value,
          credential_url: document.getElementById('cert-url').value
        })
      });
      loadProfile();
    });
  };

  const openAddAchievementModal = () => {
    openGenericModal('Add Honor / Achievement', `
      <div class="mb-3"><label class="form-label-edu">Achievement Title *</label><input type="text" id="ach-title" class="form-control-edu" required></div>
      <div class="row g-2 mb-3">
        <div class="col-md-6"><label class="form-label-edu">Awarding Organization</label><input type="text" id="ach-org" class="form-control-edu"></div>
        <div class="col-md-6"><label class="form-label-edu">Date</label><input type="date" id="ach-date" class="form-control-edu"></div>
      </div>
      <div class="mb-3"><label class="form-label-edu">Description</label><textarea id="ach-desc" class="form-control-edu" rows="2"></textarea></div>
    `, async () => {
      await EduApi.request('learners/achievements.php', {
        method: 'POST',
        body: JSON.stringify({
          title: document.getElementById('ach-title').value,
          organization: document.getElementById('ach-org').value,
          date: document.getElementById('ach-date').value,
          description: document.getElementById('ach-desc').value
        })
      });
      loadProfile();
    });
  };

  const openGenericModal = (title, formHtml, onSave) => {
    let modal = document.getElementById('generic-item-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'generic-item-modal';
      modal.className = 'modal fade';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content modal-content-edu">
          <div class="modal-header modal-header-edu d-flex justify-content-between">
            <h5 class="modal-title fw-bold m-0">${title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-4">${formHtml}</div>
          <div class="modal-footer modal-footer-edu">
            <button type="button" class="btn-edu-secondary btn-edu-sm" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn-edu-primary btn-edu-sm" id="generic-modal-save">Save</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('generic-modal-save').onclick = async () => {
      await onSave();
      bootstrap.Modal.getInstance(modal)?.hide();
    };

    new bootstrap.Modal(modal).show();
  };

  const deleteItem = async (resource, id) => {
    if (!confirm('Are you sure you want to remove this item?')) return;
    const res = await EduApi.request(`learners/${resource}.php?id=${id}`, { method: 'DELETE' });
    if (res.success) {
      EduApi.showToast('Item deleted.', 'info');
      loadProfile();
    } else {
      EduApi.showToast(res.message, 'error');
    }
  };

  const loadSavedBookmarks = async () => {
    const container = document.getElementById('saved-bookmarks-list');
    const badge = document.getElementById('saved-count-badge');
    if (!container) return;

    container.innerHTML = `
      <div class="state-box">
        <div class="spinner-border text-primary mb-2" role="status"></div>
        <p class="text-muted m-0">Loading saved opportunities...</p>
      </div>
    `;

    const res = await EduApi.request('opportunities/bookmark.php');
    if (res.success && res.data) {
      if (badge) badge.textContent = res.data.length;
      if (res.data.length === 0) {
        container.innerHTML = `
          <div class="state-box">
            <div class="state-icon">🔖</div>
            <h6 class="fw-bold">No saved opportunities yet</h6>
            <p class="text-muted small">Browse opportunities and click the bookmark icon to save them for later review.</p>
            <a href="/educonnect/pages/opportunities.html" class="btn-edu-primary btn-edu-sm">Browse Opportunities</a>
          </div>
        `;
        return;
      }

      container.innerHTML = res.data.map(b => `
        <div class="p-3 mb-3 border rounded-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <span class="badge bg-primary-subtle text-primary mb-1">${b.category_name}</span>
            <h6 class="fw-bold m-0">${b.title}</h6>
            <p class="text-secondary small mb-1">${b.university_name || b.provider_name} • 📍 ${b.location || 'Online'}</p>
            <span class="small text-muted">Deadline: <strong>${b.application_deadline}</strong></span>
          </div>
          <div class="d-flex gap-2">
            <a href="/educonnect/pages/opportunity-details.html?id=${b.id}" class="btn-edu-primary btn-edu-sm">View & Apply</a>
            <button class="btn btn-sm text-danger" onclick="EduLearnerProfile.removeBookmark(${b.id})" title="Remove Bookmark">Remove</button>
          </div>
        </div>
      `).join('');
    }
  };

  const removeBookmark = async (oppId) => {
    const res = await EduApi.request('opportunities/bookmark.php', {
      method: 'POST',
      body: JSON.stringify({ opportunity_id: oppId })
    });
    if (res.success) {
      EduApi.showToast('Bookmark removed.', 'info');
      loadSavedBookmarks();
    }
  };

  const exportCv = () => {
    if (!profileData) {
      EduApi.showToast('Profile data is not ready yet.', 'warning');
      return;
    }
    const { user, profile, education, skills, projects, certificates, achievements } = profileData;

    // Create a printable CV preview window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const cvHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${user.name} - Curriculum Vitae</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.5; color: #1e293b; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 28px; margin-bottom: 4px; color: #0f172a; }
          .headline { font-size: 16px; color: #2563eb; font-weight: 600; margin-bottom: 8px; }
          .contact { font-size: 13px; color: #64748b; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
          h2 { font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 24px; color: #0f172a; }
          .item { margin-bottom: 14px; }
          .item-title { font-weight: bold; font-size: 14px; }
          .item-meta { font-size: 13px; color: #64748b; margin-bottom: 4px; }
          .item-desc { font-size: 13px; color: #334155; }
          .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
          .skill-tag { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: #eff6ff; padding: 12px 16px; border-radius: 6px;">
          <span style="font-size: 14px; color: #1e40af;">EduConnect One-Click CV Export</span>
          <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">Print or Save as PDF</button>
        </div>

        <h1>${user.name}</h1>
        <div class="headline">${profile.headline || 'EduConnect Scholar & Learner'}</div>
        <div class="contact">
          Email: ${user.email} ${user.phone ? `| Phone: ${user.phone}` : ''} | Location: ${profile.city ? `${profile.city}, ` : ''}${profile.country || 'Global'}
          ${profile.linkedin_url ? `<br>LinkedIn: ${profile.linkedin_url}` : ''}
          ${profile.website ? ` | Portfolio: ${profile.website}` : ''}
        </div>

        ${profile.bio ? `
          <h2>Professional Summary</h2>
          <p class="item-desc">${profile.bio}</p>
        ` : ''}

        <h2>Education</h2>
        ${education.length === 0 ? '<p class="item-meta">No education records listed.</p>' : education.map(e => `
          <div class="item">
            <div class="item-title">${e.institution_name}</div>
            <div class="item-meta">${e.education_level} in ${e.field_of_study} | ${e.start_date} - ${e.end_date || 'Present'} ${e.grade ? `(Grade: ${e.grade})` : ''}</div>
            ${e.description ? `<div class="item-desc">${e.description}</div>` : ''}
          </div>
        `).join('')}

        <h2>Skills & Competencies</h2>
        <div class="skills-list">
          ${skills.map(s => `<span class="skill-tag">${s.skill_name} (${s.skill_level})</span>`).join('')}
        </div>

        ${projects.length > 0 ? `
          <h2>Projects & Research</h2>
          ${projects.map(p => `
            <div class="item">
              <div class="item-title">${p.title} ${p.project_url ? `(${p.project_url})` : ''}</div>
              <div class="item-meta">Role: ${p.role || 'Contributor'} | Tech: ${p.technologies || 'Various'}</div>
              <div class="item-desc">${p.description || ''}</div>
            </div>
          `).join('')}
        ` : ''}

        ${certificates.length > 0 ? `
          <h2>Certifications</h2>
          ${certificates.map(c => `
            <div class="item">
              <div class="item-title">${c.certificate_name}</div>
              <div class="item-meta">Issued by: ${c.issuing_organization} | ${c.issue_date}</div>
            </div>
          `).join('')}
        ` : ''}

        ${achievements.length > 0 ? `
          <h2>Honors & Achievements</h2>
          ${achievements.map(a => `
            <div class="item">
              <div class="item-title">${a.title}</div>
              <div class="item-meta">${a.organization ? `${a.organization} | ` : ''}${a.date}</div>
              <div class="item-desc">${a.description || ''}</div>
            </div>
          `).join('')}
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(cvHtml);
    printWindow.document.close();
  };

  return {
    init,
    openEditProfileModal,
    saveProfile,
    openAddEducationModal,
    openAddSkillModal,
    openAddProjectModal,
    openAddCertModal,
    openAddAchievementModal,
    deleteItem,
    loadSavedBookmarks,
    removeBookmark,
    exportCv
  };
})();
