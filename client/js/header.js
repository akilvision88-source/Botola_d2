/* =========================================================
   BOTOLA D2 — header.js (v2)
   يحقن الهيدر + القائمة الجانبية + Bottom Nav + Language Bar
   ========================================================= */

window.BDHeader = (function () {

  /* ═══════════════════════════════════════════════════════
     1. بناء الهيدر — مع الشعار في الوسط على الجوال
     ═══════════════════════════════════════════════════════ */
  const buildHeader = (activePage) => {
    const isActive = (key) => activePage === key ? 'active' : '';

    return `
      <header class="bd-header" id="bdHeader">
        <div class="container-xl">
          <div class="bd-header-inner">

            <!-- ✅ Left: Burger (mobile) + Nav (desktop) -->
            <button class="bd-burger" id="burgerBtn" aria-label="Open menu" aria-expanded="false">
              <span></span><span></span><span></span>
            </button>

            <nav class="bd-nav" aria-label="Main navigation">
              <a href="/" class="bd-nav-link ${isActive('home')}" data-i18n="nav.home">Home</a>
              <a href="/live" class="bd-nav-link ${isActive('live')}">
                <span class="live-dot"></span> <span data-i18n="nav.live">Live</span>
              </a>
              <a href="/upcoming" class="bd-nav-link ${isActive('upcoming')}" data-i18n="nav.upcoming">Upcoming</a>
              <a href="/replay" class="bd-nav-link ${isActive('replay')}" data-i18n="nav.replay">Replay</a>
              <a href="/results" class="bd-nav-link ${isActive('results')}" data-i18n="nav.results">Results</a>
              <a href="/standings" class="bd-nav-link ${isActive('standings')}" data-i18n="nav.standings">Standings</a>
              <a href="/subscription" class="bd-nav-link ${isActive('subscription')}" data-i18n="nav.subscription">Subscription</a>
              <a href="/about" class="bd-nav-link ${isActive('about')}" data-i18n="nav.about">About</a>
              <a href="/contact" class="bd-nav-link ${isActive('contact')}" data-i18n="nav.contact">Contact</a>
            </nav>

            <!-- ✅ Center: Logo (mobile centered via CSS) -->
            <a href="/" class="bd-logo" aria-label="BOTOLA D2 Home">
              <img src="/assets/images/logo.png"
                   alt="BOTOLA D2"
                   class="bd-logo-img"
                   onerror="this.onerror=null; this.src='/assets/images/logo-fallback.svg';">
            </a>

            <!-- ✅ Right: Actions -->
            <div class="bd-header-actions">

              <div class="bd-lang" id="langSwitcher">
                <button class="bd-lang-btn" aria-haspopup="true" aria-expanded="false">
                  <i class="fa-solid fa-globe"></i>
                  <span class="bd-lang-current">FR</span>
                  <i class="fa-solid fa-chevron-down bd-lang-caret"></i>
                </button>
                <ul class="bd-lang-menu" role="menu">
                  <li><button data-lang="fr" role="menuitem">🇫🇷 Français</button></li>
                  <li><button data-lang="en" role="menuitem">🇬🇧 English</button></li>
                  <li><button data-lang="ar" role="menuitem">🇲🇦 العربية</button></li>
                </ul>
              </div>

              <div id="guestActions" class="bd-auth-actions">
                <a href="/login" class="btn-bd btn-bd-ghost" data-i18n="nav.login">Login</a>
                <a href="/register" class="btn-bd btn-bd-primary" data-i18n="nav.register">Register</a>
              </div>

              <div id="userActions" class="bd-user" style="display:none;">
                <button class="bd-user-btn" aria-haspopup="true" aria-expanded="false">
                  <img id="userAvatar" src="/assets/images/avatar-default.svg" alt="Avatar" />
                  <span id="userName">User</span>
                  <i class="fa-solid fa-chevron-down"></i>
                </button>
                <ul class="bd-user-menu">
                  <li><a href="/account"><i class="fa-regular fa-user"></i> <span data-i18n="nav.my_account">My Account</span></a></li>
                  <li><a href="/account#subscription"><i class="fa-regular fa-star"></i> <span data-i18n="nav.my_subscription">My Subscription</span></a></li>
                  <li><a href="/admin" id="adminLink" style="display:none;"><i class="fa-solid fa-shield-halved"></i> Admin</a></li>
                  <li><hr /></li>
                  <li><button id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i> <span data-i18n="nav.logout">Logout</span></button></li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      </header>
    `;
  };

  /* ═══════════════════════════════════════════════════════
     2. القائمة الجانبية
     ═══════════════════════════════════════════════════════ */
  const buildMobileMenu = () => `
    <div class="bd-mobile-overlay" id="mobileOverlay"></div>
    <aside class="bd-mobile-menu" id="mobileMenu" aria-hidden="true">
      <div class="bd-mobile-menu-head">
        <a href="/" class="bd-logo" aria-label="BOTOLA D2 Home">
          <img src="/assets/images/logo.png"
               alt="BOTOLA D2"
               class="bd-logo-img bd-logo-img-sm"
               onerror="this.onerror=null; this.src='/assets/images/logo-fallback.svg';">
        </a>
        <button class="bd-mobile-close" id="mobileClose" aria-label="Close menu">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <nav class="bd-mobile-nav">
        <a href="/" data-i18n="nav.home">Home</a>
        <a href="/live"><span class="live-dot"></span> <span data-i18n="nav.live">Live</span></a>
        <a href="/upcoming" data-i18n="nav.upcoming">Upcoming</a>
        <a href="/replay" data-i18n="nav.replay">Replay</a>
        <a href="/results" data-i18n="nav.results">Results</a>
        <a href="/standings" data-i18n="nav.standings">Standings</a>
        <a href="/subscription" data-i18n="nav.subscription">Subscription</a>
        <a href="/about" data-i18n="nav.about">About</a>
        <a href="/contact" data-i18n="nav.contact">Contact</a>
      </nav>
      <div class="bd-mobile-auth" id="mobileAuth"></div>
    </aside>
  `;

  /* ═══════════════════════════════════════════════════════
     3. Bottom Nav — مع 6 أيقونات
     ═══════════════════════════════════════════════════════ */
  const buildBottomNav = (activePage) => {
    const isActive = (key) => activePage === key ? 'active' : '';

    return `
      <nav class="bd-bottom-nav" aria-label="Mobile navigation">
        <a href="/" class="bd-bottom-nav-item ${isActive('home')}" data-page="home">
          <i class="fa-solid fa-house"></i>
          <span data-i18n="nav.home">Home</span>
        </a>
        <a href="/live" class="bd-bottom-nav-item ${isActive('live')}" data-page="live">
          <i class="fa-solid fa-tv"></i>
          <span data-i18n="nav.live">Live</span>
        </a>
        <a href="/upcoming" class="bd-bottom-nav-item ${isActive('upcoming')}" data-page="upcoming">
          <i class="fa-regular fa-calendar"></i>
          <span data-i18n="nav.upcoming">Matches</span>
        </a>
        <a href="/replay" class="bd-bottom-nav-item ${isActive('replay')}" data-page="replay">
          <i class="fa-solid fa-clock-rotate-left"></i>
          <span data-i18n="nav.replay">Replay</span>
        </a>
        <a href="/standings" class="bd-bottom-nav-item ${isActive('standings')}" data-page="standings">
          <i class="fa-solid fa-ranking-star"></i>
          <span data-i18n="nav.standings">Standings</span>
        </a>
        <a href="/account" class="bd-bottom-nav-item ${isActive('account')}" data-page="account">
          <i class="fa-regular fa-user"></i>
          <span data-i18n="nav.my_account">Account</span>
        </a>
      </nav>
    `;
  };

  /* ═══════════════════════════════════════════════════════
     4. Language Bar — فوق Bottom Nav
     ═══════════════════════════════════════════════════════ */
  const buildLangBar = () => `
    <div class="bd-lang-bar" id="bdLangBar">
      <button class="bd-lang-bar-item" data-lang="fr">
        🇫🇷 <span>FR</span>
      </button>
      <button class="bd-lang-bar-item" data-lang="en">
        🇬🇧 <span>EN</span>
      </button>
      <button class="bd-lang-bar-item" data-lang="ar">
        🇲🇦 <span>AR</span>
      </button>
    </div>
  `;

  /* ═══════════════════════════════════════════════════════
     5. الحقن التلقائي
     ═══════════════════════════════════════════════════════ */
  const inject = () => {
    const activePage = document.body.dataset.page || 'home';

    // احذف القديم
    document.querySelectorAll('header.bd-header').forEach(el => el.remove());
    document.querySelectorAll('.bd-mobile-overlay').forEach(el => el.remove());
    document.querySelectorAll('aside.bd-mobile-menu').forEach(el => el.remove());
    document.querySelectorAll('.bd-bottom-nav').forEach(el => el.remove());
    document.querySelectorAll('.bd-lang-bar').forEach(el => el.remove());

    const body = document.body;
    body.insertAdjacentHTML('afterbegin', buildHeader(activePage));
    body.insertAdjacentHTML('afterbegin', buildMobileMenu());

    const toastWrap = document.getElementById('toastWrap');
    const injection = buildLangBar() + buildBottomNav(activePage);

    if (toastWrap) {
      toastWrap.insertAdjacentHTML('beforebegin', injection);
    } else {
      body.insertAdjacentHTML('beforeend', injection);
    }

    bindMobileMenu();
    bindLangBar();
    updateLangBarActive();

    console.log('[BDHeader] ✅ Injected for:', activePage);
  };

  /* ═══════════════════════════════════════════════════════
     6. ربط أحداث القائمة الجانبية
     ═══════════════════════════════════════════════════════ */
  const bindMobileMenu = () => {
    const burger = document.getElementById('burgerBtn');
    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');
    const closeBtn = document.getElementById('mobileClose');

    if (!burger || !menu) return;

    const openMenu = () => {
      menu.classList.add('open');
      overlay?.classList.add('open');
      burger.classList.add('active');
      burger.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      menu.classList.remove('open');
      overlay?.classList.remove('open');
      burger.classList.remove('active');
      burger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    burger.addEventListener('click', () => {
      menu.classList.contains('open') ? closeMenu() : openMenu();
    });
    overlay?.addEventListener('click', closeMenu);
    closeBtn?.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  };

  /* ═══════════════════════════════════════════════════════
     7. ربط أحداث Language Bar
     ═══════════════════════════════════════════════════════ */
  const bindLangBar = () => {
    const bar = document.getElementById('bdLangBar');
    if (!bar) return;

    bar.querySelectorAll('[data-lang]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const lang = btn.getAttribute('data-lang');
        if (window.I18N && I18N.setLang) {
          await I18N.setLang(lang);
          updateLangBarActive();
          // إغلاق قائمة اللغة العلوية إن كانت مفتوحة
          document.getElementById('langSwitcher')?.classList.remove('open');
        }
      });
    });
  };

  const updateLangBarActive = () => {
    const currentLang = (window.I18N && I18N.getLang)
      ? I18N.getLang()
      : (localStorage.getItem('bd_lang') || 'fr');

    document.querySelectorAll('.bd-lang-bar-item').forEach(btn => {
      const lang = btn.getAttribute('data-lang');
      btn.classList.toggle('active', lang === currentLang);
    });
  };

  /* ═══════════════════════════════════════════════════════
     8. Auto-run
     ═══════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }

  // تحديث عند تغيير اللغة من أي مكان
  document.addEventListener('bd:lang-changed', updateLangBarActive);

  return { inject, updateLangBarActive };
})();