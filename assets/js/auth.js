/**
 * assets/js/auth.js
 * Handles authentication, OTP verification, and password reset flows
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Registration Handler
  const regForm = document.getElementById('edu-register-form');
  if (regForm) {
    const roleSelect = document.getElementById('reg-role');
    const providerTypeGroup = document.getElementById('provider-type-group');

    if (roleSelect && providerTypeGroup) {
      roleSelect.addEventListener('change', () => {
        if (roleSelect.value === 'provider') {
          providerTypeGroup.style.display = 'block';
        } else {
          providerTypeGroup.style.display = 'none';
        }
      });
    }

    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = regForm.querySelector('button[type="submit"]');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Creating Account...';

      const payload = {
        name: document.getElementById('reg-name').value.trim(),
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
        role: document.getElementById('reg-role').value,
        phone: document.getElementById('reg-phone')?.value.trim() || '',
        provider_type: document.getElementById('reg-provider-type')?.value || 'university'
      };

      const res = await EduApi.request('auth/register.php', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = origText;

      if (res.success) {
        EduApi.showToast(res.message, 'success');
        sessionStorage.setItem('verify_email_pending', payload.email);
        setTimeout(() => {
          window.location.href = `/educonnect/verify_email.html?email=${encodeURIComponent(payload.email)}`;
        }, 800);
      } else {
        EduApi.showToast(res.message, 'error');
      }
    });
  }

  // 2. Login Handler
  const loginForm = document.getElementById('edu-login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const origText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Signing In...';

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      const res = await EduApi.request('auth/login.php', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = origText;

      if (res.success) {
        EduApi.setAuth(res.data);
        EduApi.showToast('Signed in successfully!', 'success');

        const role = res.data.user.role;
        setTimeout(() => {
          if (role === 'admin') {
            window.location.href = '/educonnect/pages/admin-dashboard.html';
          } else if (role === 'provider') {
            window.location.href = '/educonnect/pages/provider-dashboard.html';
          } else {
            window.location.href = '/educonnect/pages/learner-profile.html';
          }
        }, 600);
      } else {
        if (res.email_verified === false) {
          EduApi.showToast('Please verify your email address to proceed.', 'warning');
          sessionStorage.setItem('verify_email_pending', res.email || email);
          setTimeout(() => {
            window.location.href = `/educonnect/verify_email.html?email=${encodeURIComponent(res.email || email)}`;
          }, 800);
        } else {
          EduApi.showToast(res.message || 'Invalid credentials.', 'error');
        }
      }
    });
  }

  // 3. Email OTP Verification Handler
  const verifyForm = document.getElementById('edu-verify-form');
  if (verifyForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email') || sessionStorage.getItem('verify_email_pending') || '';
    const emailInput = document.getElementById('verify-email');
    const displayEmail = document.getElementById('display-email');
    if (emailInput) emailInput.value = emailParam;
    if (displayEmail) displayEmail.textContent = emailParam || 'your registered email';

    // Auto-tabbing digits
    const digits = document.querySelectorAll('.otp-digit');
    digits.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length >= 1) {
          e.target.value = e.target.value.slice(0, 1);
          if (index < digits.length - 1) {
            digits[index + 1].focus();
          }
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          digits[index - 1].focus();
        }
      });
    });

    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let code = '';
      digits.forEach(d => code += d.value);

      if (code.length !== 6) {
        EduApi.showToast('Please enter all 6 digits of your verification code.', 'warning');
        return;
      }

      const email = emailInput ? emailInput.value : emailParam;
      const submitBtn = verifyForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Verifying...';

      const res = await EduApi.request('auth/verify_email.php', {
        method: 'POST',
        body: JSON.stringify({ email, code })
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Verify Email';

      if (res.success) {
        EduApi.showToast('Email verified successfully! You can now log in.', 'success');
        sessionStorage.removeItem('verify_email_pending');
        setTimeout(() => {
          window.location.href = '/educonnect/login.html';
        }, 1000);
      } else {
        EduApi.showToast(res.message, 'error');
      }
    });

    // Resend code button
    const resendBtn = document.getElementById('resend-code-btn');
    if (resendBtn) {
      resendBtn.addEventListener('click', async () => {
        const email = emailInput ? emailInput.value : emailParam;
        if (!email) {
          EduApi.showToast('Email address is missing.', 'error');
          return;
        }
        resendBtn.disabled = true;
        resendBtn.innerText = 'Resending...';

        const res = await EduApi.request('auth/resend_code.php', {
          method: 'POST',
          body: JSON.stringify({ email })
        });

        resendBtn.disabled = false;
        resendBtn.innerText = 'Resend Code';

        if (res.success) {
          EduApi.showToast(res.message, 'success');
        } else {
          EduApi.showToast(res.message, 'error');
        }
      });
    }
  }

  // 4. Forgot Password Handler
  const forgotForm = document.getElementById('edu-forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      const submitBtn = forgotForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending Code...';

      const res = await EduApi.request('auth/forgot_password.php', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Send Reset Code';

      if (res.success) {
        EduApi.showToast(res.message, 'success');
        sessionStorage.setItem('reset_email', email);
        setTimeout(() => {
          window.location.href = `/educonnect/reset_password.html?email=${encodeURIComponent(email)}`;
        }, 1000);
      } else {
        EduApi.showToast(res.message, 'error');
      }
    });
  }

  // 5. Reset Password Handler
  const resetForm = document.getElementById('edu-reset-form');
  if (resetForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email') || sessionStorage.getItem('reset_email') || '';
    const emailInput = document.getElementById('reset-email');
    if (emailInput) emailInput.value = emailParam;

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim() : emailParam;
      const code = document.getElementById('reset-code').value.trim();
      const password = document.getElementById('reset-password').value;
      const confirmPassword = document.getElementById('reset-confirm-password').value;

      if (password !== confirmPassword) {
        EduApi.showToast('Passwords do not match.', 'error');
        return;
      }

      const submitBtn = resetForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Resetting...';

      const res = await EduApi.request('auth/reset_password.php', {
        method: 'POST',
        body: JSON.stringify({ email, code, password })
      });

      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Reset Password';

      if (res.success) {
        EduApi.showToast('Password reset successfully! Please sign in with your new password.', 'success');
        sessionStorage.removeItem('reset_email');
        setTimeout(() => {
          window.location.href = '/educonnect/login.html';
        }, 1000);
      } else {
        EduApi.showToast(res.message, 'error');
      }
    });
  }
});
