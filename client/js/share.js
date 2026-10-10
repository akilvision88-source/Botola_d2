/* =========================================================
   BOTOLA D2 — share.js
   Share button with Web Share API + fallback menu.
   ========================================================= */

window.Share = (function () {
  const cfg = window.BD_CONFIG;

  const buildUrl = (path) => cfg.SHARE_SITE + (path || '/');

  const nativeShare = async ({ title, text, url }) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch (e) {
        if (e.name === 'AbortError') return true;
      }
    }
    return false;
  };

  const openMenu = (opts) => {
    const url = opts.url;
    const text = opts.text || '';
    const title = opts.title || cfg.SHARE_TITLE;

    const wrap = document.createElement('div');
    wrap.className = 'bd-share-pop';
    wrap.innerHTML = `
      <a href="https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}" target="_blank" rel="noopener" title="WhatsApp">
        <i class="fa-brands fa-whatsapp"></i>
      </a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" title="Facebook">
        <i class="fa-brands fa-facebook-f"></i>
      </a>
      <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}" target="_blank" rel="noopener" title="X">
        <i class="fa-brands fa-x-twitter"></i>
      </a>
      <button type="button" title="Copy link" data-copy>
        <i class="fa-solid fa-link"></i>
      </button>
    `;
    wrap.style.cssText = `
      position:absolute;background:#141414;border:1px solid rgba(255,255,255,0.14);
      border-radius:12px;padding:8px;display:flex;gap:6px;box-shadow:0 10px 30px rgba(0,0,0,0.5);
      z-index:1200;`;
    wrap.querySelector('[data-copy]')?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(url);
        if (window.Toast) Toast.success(I18N.t('toast.link_copied','Link copied'));
      } catch (_) {
        if (window.Toast) Toast.error(I18N.t('toast.copy_failed','Could not copy'));
      }
      wrap.remove();
    });

    document.body.appendChild(wrap);

    const close = (ev) => {
      if (!wrap.contains(ev.target)) {
        wrap.remove();
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 50);

    return wrap;
  };

  const share = async (btn, opts) => {
    const url = opts.url || buildUrl();
    const payload = {
      title: opts.title || cfg.SHARE_TITLE,
      text: opts.text || 'Check this out on BOTOLA D2',
      url
    };

    const ok = await nativeShare(payload);
    if (ok) return;

    const rect = btn.getBoundingClientRect();
    const menu = openMenu({ ...payload, url });
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + window.scrollY + 8) + 'px';
    menu.style.left = Math.max(8, rect.left - 120) + 'px';
    menu.style.animation = 'toastIn .2s ease';
  };

  const bindAll = () => {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-share]');
      if (!btn) return;
      e.preventDefault();
      const title = btn.getAttribute('data-share-title') || '';
      const text  = btn.getAttribute('data-share-text') || '';
      const url   = btn.getAttribute('data-share-url') || window.location.href;
      share(btn, { title, text, url });
    });
  };

  return { share, bindAll, buildUrl };
})();