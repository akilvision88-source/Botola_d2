/* =========================================================
   BOTOLA D2 — admin-api.js
   Wraps API.admin.* endpoints + auth helpers for the dashboard.
   ========================================================= */

window.AdminAPI = (function () {
  const cfg = window.BD_CONFIG;

  const getToken = () => localStorage.getItem(cfg.TOKEN_KEY);

  const request = async (method, path, body = null) => {
    const headers = { 'Accept': 'application/json' };
    const isForm = body instanceof FormData;
    if (body && !isForm) headers['Content-Type'] = 'application/json';

    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers, credentials: 'include' };
    if (body) opts.body = isForm ? body : JSON.stringify(body);

    let res;
    try {
      res = await fetch(cfg.API_BASE.replace(/\/$/, '') + '/' + path.replace(/^\//, ''), opts);
    } catch (e) {
      throw { status: 0, message: 'Network error', network: true };
    }

    let data = null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      try { data = await res.json(); } catch (_) { data = null; }
    }

    if (res.status === 401) {
      // Force re-login
      localStorage.removeItem(cfg.TOKEN_KEY);
      localStorage.removeItem(cfg.USER_KEY);
      if (!window.location.pathname.endsWith('/index.html') && !window.location.pathname.endsWith('/admin/')) {
        window.location.href = '/admin/index.html';
      }
      throw { status: 401, message: 'Session expired' };
    }

    if (!res.ok) {
      throw {
        status: res.status,
        message: (data && data.message) || res.statusText,
        errors: (data && data.errors) || null,
        data
      };
    }
    return data;
  };

  const api = {
    login: (email, password) => request('POST', 'auth/login', { email, password }),
    me:    ()                => request('GET', 'auth/me'),
    logout: ()               => request('POST', 'auth/logout'),

    dashboard: () => request('GET', 'admin/dashboard'),

    // Matches
    matchesList:   (params = {}) => request('GET', 'matches/admin/list?' + qs(params)),
    matchGet:      (id)           => request('GET', `matches/${id}`),
    matchCreate:   (p)            => request('POST', 'matches', p),
    matchUpdate:   (id, p)        => request('PUT', `matches/${id}`, p),
    matchDelete:   (id)           => request('DELETE', `matches/${id}`),

    // Teams
    teamsList:   (params = {}) => request('GET', 'teams/admin/list?' + qs(params)),
    teamGet:     (id)          => request('GET', `teams/${id}`),
    teamCreate:  (fd)          => request('POST', 'teams', fd),
    teamUpdate:  (id, fd)      => request('PUT', `teams/${id}`, fd),
    teamDelete:  (id)          => request('DELETE', `teams/${id}`),

    // Stadiums
    stadiumsList:   (params = {}) => request('GET', 'stadiums/admin/list?' + qs(params)),
    stadiumCreate:  (fd)          => request('POST', 'stadiums', fd),
    stadiumUpdate:  (id, fd)      => request('PUT', `stadiums/${id}`, fd),
    stadiumDelete:  (id)          => request('DELETE', `stadiums/${id}`),

    // Replays
    replaysList:    (params = {}) => request('GET', 'replays?' + qs(params)),
    replayGet:      (id)          => request('GET', `replays/${id}`),
    replayCreate:   (fd)          => request('POST', 'replays', fd),
    replayUpdate:   (id, fd)      => request('PUT', `replays/${id}`, fd),
    replayDelete:   (id)          => request('DELETE', `replays/${id}`),

    // Users
    usersList:    (params = {}) => request('GET', 'users?' + qs(params)),
    userGet:      (id)          => request('GET', `users/${id}`),
    userUpdate:   (id, p)       => request('PUT', `users/${id}`, p),
    userChangeRole: (id, p)     => request('PUT', `users/${id}/role`, p),
    userSuspend:  (id)          => request('PUT', `users/${id}/suspend`),
    userDelete:   (id)          => request('DELETE', `users/${id}`),

    // Subscriptions
    plansList:        ()          => request('GET', 'subscriptions/admin/plans'),
    planCreate:       (p)         => request('POST', 'subscriptions/admin/plans', p),
    planUpdate:       (id, p)     => request('PUT', `subscriptions/admin/plans/${id}`, p),
    planDelete:       (id)        => request('DELETE', `subscriptions/admin/plans/${id}`),
    subscriptionsList:(params={}) => request('GET', 'subscriptions/admin/list?' + qs(params)),

    // Notifications
    broadcast: (p) => request('POST', 'notifications/broadcast', p),

    // Contact messages
    messagesList:   (params = {}) => request('GET', 'contact?' + qs(params)),
    messageStatus:  (id, p)       => request('PUT', `contact/${id}/status`, p),
    messageDelete:  (id)          => request('DELETE', `contact/${id}`),

    // Settings
    settingsGet:    ()            => request('GET', 'settings'),
    settingsUpdate: (p)           => request('PUT', 'settings', p),

    // Roles / permissions (list roles for user management)
    rolesList: () => Promise.resolve({ success: true, data: [
      { id: 1, name: 'Super Admin', slug: 'super_admin' },
      { id: 2, name: 'Admin', slug: 'admin' },
      { id: 3, name: 'Editor', slug: 'editor' },
      { id: 4, name: 'Moderator', slug: 'moderator' },
      { id: 5, name: 'User', slug: 'user' }
    ]})
  };

  function qs(obj) {
    return Object.keys(obj)
      .filter(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
      .join('&');
  }

  return api;
})();