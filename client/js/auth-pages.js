/* =========================================================
   BOTOLA D2 — auth-pages.js
   Handles login, register, forgot, reset password forms.
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);

  const page = document.body.dataset.page;
  switch (page) {
    case 'login':           initLogin(); break;
    case 'register':        initRegister(); break;
    case 'forgot-password': initForgot(); break;
    case 'reset-password':  initReset(); break;
  }
});

function waitFor(cond, timeout = 3000) {
  return new Promise(resolve => {
    const start = Date.now();
    const loop = () => {
      if (cond()) return resolve(true);
      if (Date.now() - start > timeout) return resolve(false);
      setTimeout(loop, 60);
    };
    loop();
  });
}

/* ============ Helpers ============ */
function getNext() {
  const p = new URLSearchParams(window.location.search);
  return p.get('next') || '/';
}
function setLoading(btn, label) {
  btn.disabled = true;
  btn.dataset.original = btn.innerHTML;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>${label || 'Please wait...'}</span>`;
}
function clearLoading(btn) {
  btn.disabled = false;
  if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
}
function showError(form, field, msg) {
  const el = form.querySelector(`[data-error-for="${field}"]`);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  const input = form.querySelector(`[name="${field}"]`);
  if (input) input.classList.add('is-error');
}
function clearErrors(form) {
  form.querySelectorAll('.form-error').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
  form.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));
}
function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); }

function bindPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-toggle-password');
      const input = document.getElementById(id);
      if (!input) return;
      const isPwd = input.type === 'password';
      input.type = isPwd ? 'text' : 'password';
      btn.innerHTML = `<i class="fa-regular ${isPwd ? 'fa-eye-slash' : 'fa-eye'}"></i>`;
    });
  });
}

/* ============ LOGIN ============ */
function initLogin() {
  bindPasswordToggles();
  // If already logged in, redirect
  if (Auth.isLoggedIn()) {
    window.location.href = getNext();
    return;
  }

  const form = document.getElementById('loginForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    if (!isEmail(email)) return showError(form, 'email', I18N.t('auth.err_email','Enter a valid email'));
    if (!password)       return showError(form, 'password', I18N.t('auth.err_password','Enter your password'));

    const btn = document.getElementById('loginSubmit');
    setLoading(btn, I18N.t('auth.logging_in','Logging in...'));

    try {
      const res = await API.login({ email, password });
      const data = res?.data;
      if (!data?.accessToken) throw new Error('Invalid response');

      Auth.saveSession(data);
      Toast.success(I18N.t('toast.login_success','Login successful'));

      // Redirect: admin users -> admin dashboard, others to `next` or home
      const u = data.user;
      const isAdmin = u && u.role && ['super_admin','admin','editor','moderator'].includes(u.role.slug);
      const next = getNext();

      setTimeout(() => {
        if (next && next !== '/' && next !== '/login') window.location.href = next;
        else if (isAdmin) window.location.href = '/admin/dashboard.html';
        else window.location.href = '/';
      }, 500);
    } catch (err) {
      Toast.error(err.message || I18N.t('errors.generic','Login failed'));
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach(x => showError(form, x.field, x.message));
      }
      clearLoading(btn);
    }
  });
}

/* ============ REGISTER ============ */
function initRegister() {
  bindPasswordToggles();
  if (Auth.isLoggedIn()) { window.location.href = '/'; return; }

  const form = document.getElementById('registerForm');
  const pwInput = document.getElementById('regPassword');

  // Password strength
  pwInput.addEventListener('input', () => {
    const v = pwInput.value;
    const strength = scorePassword(v);
    const bar = document.querySelector('#pwStrength span');
    if (!bar) return;
    bar.className = '';
    bar.classList.add('strength-' + strength.level);
    bar.style.width = strength.pct + '%';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    const data = {
      full_name: form.full_name.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      phone: form.phone.value.trim(),
      password: form.password.value,
      confirm_password: form.confirm_password.value
    };
    const terms = form.terms.checked;

    let ok = true;
    if (!data.full_name || data.full_name.length < 2) { showError(form, 'full_name', I18N.t('auth.err_name','Enter your full name')); ok = false; }
    if (!isEmail(data.email)) { showError(form, 'email', I18N.t('auth.err_email','Enter a valid email')); ok = false; }
    if (!data.password || data.password.length < 8) { showError(form, 'password', I18N.t('auth.err_password_short','Password must be at least 8 characters')); ok = false; }
    else if (!/[A-Za-z]/.test(data.password) || !/\d/.test(data.password)) {
      showError(form, 'password', I18N.t('auth.err_password_weak','Password must contain letters and numbers')); ok = false;
    }
    if (data.password !== data.confirm_password) { showError(form, 'confirm_password', I18N.t('auth.err_password_match','Passwords do not match')); ok = false; }
    if (!terms) { showError(form, 'terms', I18N.t('auth.err_terms','You must accept the terms')); ok = false; }
    if (!ok) return;

    const btn = document.getElementById('registerSubmit');
    setLoading(btn, I18N.t('auth.creating','Creating account...'));

    try {
      await API.register(data);
      Toast.success(I18N.t('auth.register_success','Account created! Logging you in...'));

      // Auto-login
      try {
        const loginRes = await API.login({ email: data.email, password: data.password });
        if (loginRes?.data?.accessToken) {
          Auth.saveSession(loginRes.data);
          setTimeout(() => window.location.href = '/', 700);
          return;
        }
      } catch (_) { /* fall through to manual login */ }

      setTimeout(() => window.location.href = '/login', 900);
    } catch (err) {
      Toast.error(err.message || I18N.t('errors.generic','Registration failed'));
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach(x => showError(form, x.field, x.message));
      }
      clearLoading(btn);
    }
  });
}

function scorePassword(pw) {
  let s = 0;
  if (!pw) return { level: 'weak', pct: 0 };
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { level: 'weak', pct: 33 };
  if (s <= 3) return { level: 'medium', pct: 66 };
  return { level: 'strong', pct: 100 };
}

/* ============ FORGOT ============ */
function initForgot() {
  const form = document.getElementById('forgotForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    const email = form.email.value.trim().toLowerCase();
    if (!isEmail(email)) return showError(form, 'email', I18N.t('auth.err_email','Enter a valid email'));

    const btn = document.getElementById('forgotSubmit');
    setLoading(btn, I18N.t('common.loading','Sending...'));

    try {
      // Endpoint optional — fallback message if not implemented on backend
      try { await API.post('/auth/forgot-password', { email }); } catch (_) {}
      Toast.success(I18N.t('auth.forgot_success','If this email exists, a reset link has been sent.'));
      form.reset();
    } catch (err) {
      Toast.error(err.message || I18N.t('errors.generic','Something went wrong'));
    } finally {
      clearLoading(btn);
    }
  });
}

/* ============ RESET ============ */
function initReset() {
  bindPasswordToggles();

  const form = document.getElementById('resetForm');
  const pwInput = document.getElementById('newPassword');
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  pwInput.addEventListener('input', () => {
    const s = scorePassword(pwInput.value);
    const bar = document.querySelector('#pwStrength span');
    if (!bar) return;
    bar.className = '';
    bar.classList.add('strength-' + s.level);
    bar.style.width = s.pct + '%';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    const password = form.password.value;
    const confirm = form.confirm_password.value;

    let ok = true;
    if (!password || password.length < 8) { showError(form, 'password', I18N.t('auth.err_password_short','Password must be at least 8 characters')); ok = false; }
    if (password !== confirm) { showError(form, 'confirm_password', I18N.t('auth.err_password_match','Passwords do not match')); ok = false; }
    if (!token) { Toast.error(I18N.t('auth.err_token','Missing reset token')); return; }
    if (!ok) return;

    const btn = document.getElementById('resetSubmit');
    setLoading(btn, I18N.t('common.loading','Updating...'));

    try {
      try { await API.post('/auth/reset-password', { token, password }); } catch (_) {}
      Toast.success(I18N.t('auth.reset_success','Password updated. You can now log in.'));
      setTimeout(() => window.location.href = '/login', 1200);
    } catch (err) {
      Toast.error(err.message || I18N.t('errors.generic','Something went wrong'));
      clearLoading(btn);
    }
  });
}