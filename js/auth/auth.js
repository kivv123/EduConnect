/**
 * EduConnect - Auth Controller
 * 
 * Handles login and registration form logic, validation,
 * quick demo persona sign-ins, and role-based redirects.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Check if user is already logged in on login/register page
  const currentUser = window.AuthService ? window.AuthService.getCurrentUser() : null;
  const currentRole = window.AuthService ? window.AuthService.getCurrentRole() : null;

  // Handle Login Form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const emailInput = document.getElementById("loginEmail");
      const passwordInput = document.getElementById("loginPassword");
      const errorAlert = document.getElementById("loginErrorAlert");
      const submitBtn = document.getElementById("loginSubmitBtn");

      if (errorAlert) errorAlert.classList.add("d-none");

      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";

      if (!email || !password) {
        if (errorAlert) {
          errorAlert.textContent = "Please enter both email and password.";
          errorAlert.classList.remove("d-none");
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Signing In...`;
      }

      try {
        const result = await window.AuthService.login(email, password);

        if (result.success) {
          if (window.App) window.App.showToast(`Welcome back, ${result.user.name}!`, "success");
          
          // Check for redirect query param
          const queryParams = window.Router ? window.Router.getQueryParams() : {};
          if (queryParams.redirect) {
            window.location.href = queryParams.redirect;
          } else {
            window.AuthService.redirectByRole(result.role);
          }
        } else {
          if (errorAlert) {
            errorAlert.textContent = result.message || "Invalid credentials.";
            errorAlert.classList.remove("d-none");
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Sign In`;
          }
        }
      } catch (err) {
        console.error("Login exception:", err);
        if (errorAlert) {
          errorAlert.textContent = err.message || "An unexpected network or connection error occurred.";
          errorAlert.classList.remove("d-none");
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Sign In`;
        }
      }
    });
  }

  // Handle Register Form
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const name = document.getElementById("regName").value.trim();
      const email = document.getElementById("regEmail").value.trim();
      const password = document.getElementById("regPassword").value;
      const role = document.querySelector('input[name="regRole"]:checked')?.value || "learner";
      const organization = document.getElementById("regOrg") ? document.getElementById("regOrg").value.trim() : "";
      const errorAlert = document.getElementById("regErrorAlert");
      const submitBtn = document.getElementById("regSubmitBtn");

      if (errorAlert) errorAlert.classList.add("d-none");

      if (!name || !email || !password) {
        if (errorAlert) {
          errorAlert.textContent = "Please fill in all required fields.";
          errorAlert.classList.remove("d-none");
        }
        return;
      }

      if (password.length < 6) {
        if (errorAlert) {
          errorAlert.textContent = "Password must be at least 6 characters.";
          errorAlert.classList.remove("d-none");
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Creating Account...`;
      }

      try {
        const result = await window.AuthService.register({
          name,
          email,
          password,
          role,
          organization
        });

        if (result.success) {
          if (window.App) window.App.showToast("Account created successfully!", "success");
          window.AuthService.redirectByRole(result.role);
        } else {
          if (errorAlert) {
            errorAlert.textContent = result.message || "Registration failed.";
            errorAlert.classList.remove("d-none");
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Create Account`;
          }
        }
      } catch (err) {
        console.error("Registration error:", err);
        if (errorAlert) {
          errorAlert.textContent = err.message || "An unexpected network or connection error occurred.";
          errorAlert.classList.remove("d-none");
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Create Account`;
        }
      }
    });
  }
});

// Quick fill helper for testing
window.fillCredentials = function (email, password) {
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  if (emailInput && passwordInput) {
    emailInput.value = email;
    passwordInput.value = password;
    // Highlight input
    emailInput.focus();
  }
};
