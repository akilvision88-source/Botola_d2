/* =========================================================
   BOTOLA D2 — api.js
   Lightweight fetch wrapper for the REST API.
   ========================================================= */

window.API = (function () {
  const cfg = window.BD_CONFIG;

  const getToken = () => localStorage.getItem(cfg.TOKEN_KEY);
  const setToken = (t) => localStorage.setItem(cfg.TOKEN_KEY, t);
  const clearToken = () => {
    localStorage.removeItem(cfg.TOKEN_KEY);
    localStorage.removeItem(cfg.REFRESH_KEY);
    localStorage.removeItem(cfg.USER_KEY);
  };

  const buildUrl = (path) => {
    if (/^https?:\/\//.test(path)) return path;
    return cfg.API_BASE.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  };

  const request = async (method, path, body = null, options = {}) => {
    const headers = { 'Accept': 'application/json' };

    const isFormData = body instanceof FormData;
    if (body && !isFormData) headers['Content-Type'] = 'application/json';

    const token = getToken();
    if (token && !options.skipAuth) headers['Authorization'] = `Bearer ${token}`;

    const fetchOptions = {
      method,
      headers,
      credentials: 'include'
    };

    if (body) {
      fetchOptions.body = isFormData ? body : JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch(buildUrl(path), fetchOptions);
    } catch (netErr) {
      throw {
        status: 0,
        message: 'Network error — please check your connection.',
        network: true
      };
    }

    let data = null;
    const ctype = response.headers.get('content-type') || '';
    if (ctype.includes('application/json')) {
      try { data = await response.json(); } catch (_) { data = null; }
    }

    if (!response.ok) {
      if (response.status === 401 && !options.skipAuth) {
        // Session expired
        clearToken();
        if (!/\/(login|register)/.test(window.location.pathname)) {
          // let page handle it; only auto-redirect admin
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/index.html';
          }
        }
      }
      const err = {
        status: response.status,
        message: (data && data.message) || response.statusText || 'Request failed',
        errors: (data && data.errors) || null,
        data
      };
      throw err;
    }

    return data;
  };

  const get    = (p, opts)       => request('GET', p, null, opts);
  const post   = (p, b, opts)    => request('POST', p, b, opts);
  const put    = (p, b, opts)    => request('PUT', p, b, opts);
  const del    = (p, opts)       => request('DELETE', p, null, opts);

  const upload = (p, formData, method = 'POST') =>
    request(method, p, formData, {});

  return {
    // Auth
    register: (payload)       => post('/auth/register', payload, { skipAuth: true }),
    login:    (payload)       => post('/auth/login', payload, { skipAuth: true }),
    me:       ()              => get('/auth/me'),

    // Matches
    liveMatches:     ()       => get('/matches/live'),
    upcomingMatches: ()       => get('/matches/upcoming'),
    results:         (page = 1, limit = 20) => get(`/matches/results?page=${page}&limit=${limit}`),
    match:           (id)     => get(`/matches/${id}`),
    searchMatches:   (q)      => get(`/matches/search?q=${encodeURIComponent(q)}`),

    // Teams & stadiums
    teams:    ()              => get('/teams'),
    team:     (id)            => get(`/teams/${id}`),
    stadiums: ()              => get('/stadiums'),

    // Replays
    replays:       (page = 1, limit = 12) => get(`/replays?page=${page}&limit=${limit}`),
    replay:        (id)       => get(`/replays/${id}`),
    replayAccess:  (id)       => get(`/replays/${id}/access`),

    // Standings
    standings: ()             => get('/standings'),

    // Subscriptions
    plans:            ()      => get('/subscriptions/plans'),
    mySubscription:   ()      => get('/subscriptions/me'),
    subscribe:        (payload) => post('/subscriptions/subscribe', payload),

    // Notifications
    myNotifications:  ()      => get('/notifications'),
    unreadCount:      ()      => get('/notifications/unread-count'),
    markRead:         (id)    => put(`/notifications/${id}/read`),
    markAllRead:      ()      => put('/notifications/read-all'),
    notifyMatch:      (id)    => post(`/notifications/match/${id}/notify`),

    // Contact
    sendContact: (payload)    => post('/contact', payload),

    // Settings
    publicSettings: ()        => get('/settings/public'),

    // Users (self)
    updateMe:         (payload) => put('/users/me', payload),
    changePassword:   (payload) => put('/users/me/password', payload),
    uploadAvatar:     (fd)      => upload('/users/me', fd, 'PUT'),

    // Admin
    admin: {
      dashboard:          ()               => get('/admin/dashboard'),
      matchesList:        (params = {})    => get('/matches/admin/list?' + qs(params)),
      matchCreate:        (p)              => post('/matches', p),
      matchUpdate:        (id, p)          => put(`/matches/${id}`, p),
      matchDelete:        (id)             => del(`/matches/${id}`),
      teamsList:          (params = {})    => get('/teams/admin/list?' + qs(params)),
      teamCreate:         (fd)             => upload('/teams', fd, 'POST'),
      teamUpdate:         (id, fd)         => upload(`/teams/${id}`, fd, 'PUT'),
      teamDelete:         (id)             => del(`/teams/${id}`),
      stadiumsList:       (params = {})    => get('/stadiums/admin/list?' + qs(params)),
      stadiumCreate:      (fd)             => upload('/stadiums', fd, 'POST'),
      stadiumUpdate:      (id, fd)         => upload(`/stadiums/${id}`, fd, 'PUT'),
      stadiumDelete:      (id)             => del(`/stadiums/${id}`),
      replaysList:        (params = {})    => get('/replays?' + qs(params)),
      replayCreate:       (fd)             => upload('/replays', fd, 'POST'),
      replayUpdate:       (id, fd)         => upload(`/replays/${id}`, fd, 'PUT'),
      replayDelete:       (id)             => del(`/replays/${id}`),
      usersList:          (params = {})    => get('/users?' + qs(params)),
      userGet:            (id)             => get(`/users/${id}`),
      userUpdate:         (id, p)          => put(`/users/${id}`, p),
      userChangeRole:     (id, p)          => put(`/users/${id}/role`, p),
      userSuspend:        (id)             => put(`/users/${id}/suspend`),
      userDelete:         (id)             => del(`/users/${id}`),
      plansList:          ()               => get('/subscriptions/admin/plans'),
      planCreate:         (p)              => post('/subscriptions/admin/plans', p),
      planUpdate:         (id, p)          => put(`/subscriptions/admin/plans/${id}`, p),
      planDelete:         (id)             => del(`/subscriptions/admin/plans/${id}`),
      subscriptionsList:  (params = {})    => get('/subscriptions/admin/list?' + qs(params)),
      messagesList:       (params = {})    => get('/contact?' + qs(params)),
      messageStatus:      (id, p)          => put(`/contact/${id}/status`, p),
      messageDelete:      (id)             => del(`/contact/${id}`),
      broadcast:          (p)              => post('/notifications/broadcast', p),
      settingsGet:        ()               => get('/settings'),
      settingsUpdate:     (p)              => put('/settings', p)
    },

    // Helpers
    setToken, getToken, clearToken
  };

  function qs(obj) {
    return Object.keys(obj)
      .filter(k => obj[k] !== undefined && obj[k] !== null && obj[k] !== '')
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
      .join('&');
  }
})();