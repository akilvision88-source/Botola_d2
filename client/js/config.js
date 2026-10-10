/* =========================================================
   BOTOLA D2 — config.js
   ========================================================= */

window.BD_CONFIG = (function () {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  return {
    API_BASE: isLocal
      ? `${window.location.protocol}//${window.location.host}/api`
      : '/api',
    ASSETS_BASE: isLocal ? `${window.location.protocol}//${window.location.host}` : '',
    DEFAULT_LANG: 'fr',
    SUPPORTED_LANGS: ['fr', 'en', 'ar'],
    TOKEN_KEY: 'bd_access_token',
    REFRESH_KEY: 'bd_refresh_token',
    USER_KEY: 'bd_user',
    LANG_KEY: 'bd_lang',
    SHARE_SITE: 'https://botolad2.com',
    SHARE_TITLE: 'BOTOLA D2 — Live Football Streaming'
  };
})();