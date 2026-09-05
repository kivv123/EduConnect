/**
 * EduConnect - Profile Page Controller
 * 
 * Manages user profile viewing and updates via UserService.
 */

document.addEventListener("DOMContentLoaded", async function () {
  if (window.Router && !window.Router.guard()) return;

  const user = window.AuthService.getCurrentUser();
  if (!user) return;

  // Render user information
  const avatarImg = document.getElementById("profileAvatar");
  const nameEl = document.getElementById("profileHeaderName");
  const roleEl = document.getElementById("profileHeaderRole");
  const emailEl = document.getElementById("profileHeaderEmail");
  const createdEl = document.getElementById("profileCreatedAt");

  const inputName = document.getElementById("inputName");
  const inputEmail = document.getElementById("inputEmail");
  const inputPhone = document.getElementById("inputPhone");
  const inputOrg = document.getElementById("inputOrg");
  const inputBio = document.getElementById("inputBio");
  const inputAvatar = document.getElementById("inputAvatar");

  if (avatarImg) avatarImg.src = user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (roleEl) {
    roleEl.textContent = user.role;
    roleEl.className = `badge ${user.role === 'admin' ? 'bg-danger' : (user.role === 'provider' ? 'bg-warning text-dark' : 'bg-primary')} text-uppercase`;
  }
  if (createdEl) createdEl.textContent = `Member since ${user.created_at ? user.created_at.substring(0, 10) : '2025'}`;

  if (inputName) inputName.value = user.name || "";
  if (inputEmail) inputEmail.value = user.email || "";
  if (inputPhone) inputPhone.value = user.phone || "";
  if (inputOrg) inputOrg.value = user.organization || "";
  if (inputBio) inputBio.value = user.bio || "";
  if (inputAvatar) inputAvatar.value = user.avatar || "";

  // Handle Profile Update Form
  const form = document.getElementById("profileEditForm");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const updatedData = {
        name: inputName.value.trim(),
        phone: inputPhone.value.trim(),
        organization: inputOrg.value.trim(),
        bio: inputBio.value.trim(),
        avatar: inputAvatar.value.trim() || user.avatar
      };

      const result = await window.UserService.updateProfile(user.id, updatedData);
      if (result.success) {
        if (window.App) window.App.showToast("Profile updated successfully!", "success");
        setTimeout(() => window.location.reload(), 600);
      } else {
        alert("Failed to update profile: " + result.message);
      }
    });
  }
});
