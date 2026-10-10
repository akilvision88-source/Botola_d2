/* =========================================================
   BOTOLA D2 — i18n.js
   Language loader + translator + RTL handling.
   ========================================================= */

window.I18N = (function () {
  const cfg = window.BD_CONFIG;
  const cache = {};
  let currentLang = localStorage.getItem(cfg.LANG_KEY) || cfg.DEFAULT_LANG;
  let currentDict = {};
  let ready = false;
  const listeners = [];

  const fetchDict = async (lang) => {
    if (cache[lang]) return cache[lang];
    const res = await fetch(`/locales/${lang}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Missing locale: ${lang}`);
    const data = await res.json();
    cache[lang] = data;
    return data;
  };

  const applyDir = (lang) => {
    const html = document.documentElement;
    if (lang === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', lang);
    }
    // Update lang switcher label
    const label = document.querySelector('.bd-lang-current');
    if (label) label.textContent = lang.toUpperCase();
  };

  const lookup = (dict, key) => {
    return key.split('.').reduce((acc, part) => {
      if (acc && typeof acc === 'object' && part in acc) return acc[part];
      return undefined;
    }, dict);
  };

  const t = (key, fallback = '') => {
    const val = lookup(currentDict, key);
    if (val === undefined || val === null) return fallback || key;
    return val;
  };

  const translateNode = (el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const val = t(key, el.textContent);
    if (el.hasAttribute('data-i18n-attr')) {
      const attr = el.getAttribute('data-i18n-attr');
      el.setAttribute(attr, val);
    } else {
      el.textContent = val;
    }
  };

  const applyTranslations = (root = document) => {
    root.querySelectorAll('[data-i18n]').forEach(translateNode);
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'), el.placeholder);
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.getAttribute('data-i18n-title'), el.title);
    });
    document.title = t('meta.title', document.title);
  };

  const setLang = async (lang, opts = {}) => {
    if (!cfg.SUPPORTED_LANGS.includes(lang)) lang = cfg.DEFAULT_LANG;
    try {
      currentDict = await fetchDict(lang);
    } catch (e) {
      console.warn('i18n load failed:', e.message);
      return;
    }
    currentLang = lang;
    localStorage.setItem(cfg.LANG_KEY, lang);
    applyDir(lang);
    applyTranslations();
    listeners.forEach(fn => { try { fn(lang); } catch(_){} });
    if (opts.reload) window.location.reload();
  };

  const init = async () => {
    await setLang(currentLang);
    ready = true;

    // Language dropdown
    const switcher = document.getElementById('langSwitcher');
    if (switcher) {
      const btn = switcher.querySelector('.bd-lang-btn');
      btn?.addEventListener('click', (e) => {
        e.stopPropagation();
        switcher.classList.toggle('open');
      });
      switcher.querySelectorAll('[data-lang]').forEach(b => {
        b.addEventListener('click', async () => {
          const lang = b.getAttribute('data-lang');
          await setLang(lang);
          switcher.classList.remove('open');
        });
      });
      document.addEventListener('click', () => switcher.classList.remove('open'));
    }
  };

  const onChange = (fn) => listeners.push(fn);

  return { init, setLang, t, applyTranslations, onChange, getLang: () => currentLang, isReady: () => ready };
})();