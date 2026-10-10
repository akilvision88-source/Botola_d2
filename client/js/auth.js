/* =========================================================
   BOTOLA D2 — auth.js
   Handles token, user session, header rendering.
   ========================================================= */

window.Auth = (function () {
  const cfg = window.BD_CONFIG;
  let currentUser = null;

  const getToken = () => localStorage.getItem(cfg.TOKEN_KEY);
  const getUser = () => currentUser || JSON.parse(localStorage.getItem(cfg.USER_KEY) || 'null');

  const saveSession = (data) => {
    if (data.accessToken) localStorage.setItem(cfg.TOKEN_KEY, data.accessToken);
    if (data.refreshToken) localStorage.setItem(cfg.REFRESH_KEY, data.refreshToken);
    if (data.user) {
      currentUser = data.user;
      localStorage.setItem(cfg.USER_KEY, JSON.stringify(data.user));
    }
  };

  const clearSession = () => {
    currentUser = null;
    API.clearToken();
  };

  const isLoggedIn = () => !!getToken();
  const isAdmin = () => {
    const u = getUser();
    return u && u.role && ['super_admin', 'admin', 'editor', 'moderator'].includes(u.role.slug);
  };

  const refreshMe = async () => {
    if (!isLoggedIn()) return null;
    try {
      const res = await API.me();
      if (res && res.success && res.data) {
        currentUser = res.data;
        localStorage.setItem(cfg.USER_KEY, JSON.stringify(res.data));
        return currentUser;
      }
    } catch (e) {
      if (e.status === 401) clearSession();
    }
    return null;
  };

  const updateHeader = () => {
    const guest = document.getElementById('guestActions');
    const userBox = document.getElementById('userActions');
    const mobileAuth = document.getElementById('mobileAuth');
    const u = getUser();

    if (!guest || !userBox) return;

    if (u && isLoggedIn()) {
      guest.style.display = 'none';
      userBox.style.display = '';
      const nameEl = document.getElementById('userName');
      const avatarEl = document.getElementById('userAvatar');
      if (nameEl) nameEl.textContent = u.full_name?.split(' ')[0] || 'User';
      if (avatarEl) {
        avatarEl.src = u.avatar
          ? (cfg.ASSETS_BASE + u.avatar)
          : '/assets/images/avatar-default.svg';
        avatarEl.alt = u.full_name || 'User';
      }
      const adminLink = document.getElementById('adminLink');
      if (adminLink) adminLink.style.display = isAdmin() ? '' : 'none';

      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <a href="/account" class="btn-bd btn-bd-ghost btn-bd-block">${I18N.t('nav.my_account','My Account')}</a>
          <button class="btn-bd btn-bd-outline btn-bd-block" id="mobileLogoutBtn">${I18N.t('nav.logout','Logout')}</button>
        `;
        document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => logout());
      }
    } else {
      guest.style.display = '';
      userBox.style.display = 'none';
      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <a href="/login" class="btn-bd btn-bd-ghost btn-bd-block">${I18N.t('nav.login','Login')}</a>
          <a href="/register" class="btn-bd btn-bd-primary btn-bd-block">${I18N.t('nav.register','Register')}</a>
        `;
      }
    }
  };

  const bindHeaderEvents = () => {
    const userBtn = document.querySelector('.bd-user-btn');
    const userBox = document.getElementById('userActions');
    if (userBtn && userBox) {
      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userBox.classList.toggle('open');
      });
      document.addEventListener('click', () => userBox.classList.remove('open'));
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => logout());
  };

  const logout = () => {
    clearSession();
    updateHeader();
    if (window.Toast) Toast.success(I18N.t('toast.logged_out','Logged out successfully'));
    setTimeout(() => { window.location.href = '/'; }, 600);
  };

  const requireAuth = (redirect = '/login') => {
    if (!isLoggedIn()) {
      window.location.href = redirect + '?next=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  };

  const requireAdmin = () => {
    if (!isLoggedIn()) {
      window.location.href = '/admin/index.html';
      return false;
    }
    if (!isAdmin()) {
      if (window.Toast) Toast.error(I18N.t('toast.no_permission','Permission denied'));
      setTimeout(() => { window.location.href = '/'; }, 900);
      return false;
    }
    return true;
  };

  const init = async () => {
    bindHeaderEvents();
    if (isLoggedIn()) await refreshMe();
    updateHeader();
    I18N.onChange(() => updateHeader());
  };

  return {
    init, isLoggedIn, isAdmin, getUser, saveSession, clearSession,
    refreshMe, updateHeader, logout, requireAuth, requireAdmin, getToken
  };
})();