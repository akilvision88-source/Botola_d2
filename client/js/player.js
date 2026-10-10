/* =========================================================
   BOTOLA D2 — player.js (v9 — FINAL)
   - NO sound button (auto-unmute only)
   - Auto-fullscreen on landscape (mobile/tablets)
   - Pre-roll Ad with skip button
   - HLS + MP4 support
   - Full error handling + retry
   ========================================================= */

window.BDPlayer = (function () {
  let hlsInstance = null;
  let adHlsInstance = null;
  let videoEl = null;
  let adVideoEl = null;
  let currentUrl = null;
  let loadTimeout = null;
  let retryCount = 0;
  let adTimerInterval = null;
  let adSkipTimer = null;
  let orientationBound = false;
  const MAX_RETRIES = 2;

  /* ═══════════════════════════════════════════════════════
     1. DETECT
     ═══════════════════════════════════════════════════════ */
  const findVideoEl = () => {
    return document.getElementById('bdPlayer')
        || document.getElementById('liveVideo')
        || document.querySelector('video.bd-player')
        || document.querySelector('video');
  };

  const isMobile = () => {
    return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent)
        || (window.innerWidth <= 1024 && 'ontouchstart' in window);
  };

  const isLandscape = () => window.innerWidth > window.innerHeight;

  const fixMixedContent = (url) => {
    try {
      if (window.location.protocol === 'https:' && /^http:\/\//i.test(url)) {
        return url.replace(/^http:\/\//i, 'https://');
      }
    } catch (_) {}
    return url;
  };

  /* ═══════════════════════════════════════════════════════
     2. FULLSCREEN
     ═══════════════════════════════════════════════════════ */
  const getFullscreenElement = () => {
    return document.fullscreenElement
        || document.webkitFullscreenElement
        || document.mozFullScreenElement
        || document.msFullscreenElement
        || null;
  };

  const isInFullscreen = () => !!getFullscreenElement();

  const enterFullscreen = (el) => {
    if (!el) return Promise.reject('No element');
    try {
      const fn = el.requestFullscreen
              || el.webkitRequestFullscreen
              || el.webkitEnterFullscreen
              || el.mozRequestFullScreen
              || el.msRequestFullscreen;
      if (!fn) return Promise.reject('Not supported');
      const result = fn.call(el);
      return result instanceof Promise ? result : Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  };

  const exitFullscreen = () => {
    if (!isInFullscreen()) return;
    try {
      const fn = document.exitFullscreen
              || document.webkitExitFullscreen
              || document.mozCancelFullScreen
              || document.msExitFullscreen;
      if (fn) fn.call(document);
    } catch (_) {}
  };

  /* ═══════════════════════════════════════════════════════
     3. ORIENTATION → AUTO FULLSCREEN
     ═══════════════════════════════════════════════════════ */
  const handleOrientation = () => {
    if (!isMobile()) return;

    const el = findVideoEl();
    if (!el) return;

    const isPlaying = !el.paused && !el.ended && el.readyState > 2;
    if (!isPlaying) return;

    const wrap = el.closest('.bd-player-wrap')
              || el.closest('.bd-modal-panel')
              || el.closest('.match-player-wrap')
              || el.parentElement
              || el;

    if (isLandscape()) {
      if (!isInFullscreen()) {
        enterFullscreen(wrap).then(() => {
          console.log('[BDPlayer] ✅ Fullscreen entered');
        }).catch((e) => {
          console.warn('[BDPlayer] Auto-fullscreen blocked:', e);
          wrap.classList.add('pseudo-fullscreen');
          document.body.classList.add('pseudo-fullscreen-active');
        });
      }
    } else {
      if (isInFullscreen()) exitFullscreen();
      const w = el.closest('.bd-player-wrap');
      if (w) w.classList.remove('pseudo-fullscreen');
      document.body.classList.remove('pseudo-fullscreen-active');
    }
  };

  const bindOrientation = () => {
    if (orientationBound) return;
    orientationBound = true;

    window.addEventListener('orientationchange', () => {
      setTimeout(handleOrientation, 400);
    });

    window.addEventListener('resize', () => {
      if (!isMobile()) return;
      clearTimeout(window.__bdOrientationTimer);
      window.__bdOrientationTimer = setTimeout(handleOrientation, 400);
    });

    if (screen.orientation && screen.orientation.addEventListener) {
      screen.orientation.addEventListener('change', () => {
        setTimeout(handleOrientation, 400);
      });
    }

    console.log('[BDPlayer] ✅ Orientation bound');
  };

  /* ═══════════════════════════════════════════════════════
     4. SOUND — Auto-unmute only (NO BUTTON)
     ═══════════════════════════════════════════════════════ */
  const tryAutoUnmute = () => {
    if (!videoEl) return;

    // ✅ محاولة إزالة الكتم فوراً
    videoEl.muted = false;
    videoEl.volume = 1;

    console.log('[BDPlayer] 🔊 Attempting auto-unmute...');

    // ✅ محاولات متعددة في حالة فشل الأولى
    let attempts = 0;
    const maxAttempts = 10;

    const tryAgain = setInterval(() => {
      if (!videoEl || attempts >= maxAttempts) {
        clearInterval(tryAgain);
        return;
      }
      if (!videoEl.muted) {
        clearInterval(tryAgain);
        console.log('[BDPlayer] 🔊 Unmute succeeded');
        return;
      }
      videoEl.muted = false;
      videoEl.volume = 1;
      attempts++;
    }, 200);

    // ✅ عند أي تفاعل من المستخدم → حاول مرة أخرى
    const unmuteOnInteraction = () => {
      if (videoEl && videoEl.muted) {
        videoEl.muted = false;
        videoEl.volume = 1;
        console.log('[BDPlayer] 🔊 Unmuted on interaction');
      }
    };

    document.addEventListener('click', unmuteOnInteraction, { once: true });
    document.addEventListener('touchstart', unmuteOnInteraction, { once: true });
    document.addEventListener('keydown', unmuteOnInteraction, { once: true });
  };

  /* ═══════════════════════════════════════════════════════
     5. DESTROY
     ═══════════════════════════════════════════════════════ */
  const destroy = () => {
    if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null; }
    if (adTimerInterval) { clearInterval(adTimerInterval); adTimerInterval = null; }
    if (adSkipTimer) { clearInterval(adSkipTimer); adSkipTimer = null; }

    if (hlsInstance) { try { hlsInstance.destroy(); } catch (_) {} hlsInstance = null; }
    if (adHlsInstance) { try { adHlsInstance.destroy(); } catch (_) {} adHlsInstance = null; }

    const el = videoEl || findVideoEl();
    if (el) {
      try { el.pause(); } catch (_) {}
      try { el.removeAttribute('src'); el.load(); } catch (_) {}
    }

    const wrap = el?.closest('.bd-player-wrap');
    if (wrap) wrap.classList.remove('pseudo-fullscreen');
    document.body.classList.remove('pseudo-fullscreen-active');

    if (isInFullscreen()) exitFullscreen();

    currentUrl = null;
    retryCount = 0;

    hideAdOverlay();

    console.log('[BDPlayer] 🗑️ Destroyed');
  };

  /* ═══════════════════════════════════════════════════════
     6. LOCK OVERLAY
     ═══════════════════════════════════════════════════════ */
  const showLock = (title, text) => {
    const overlay = document.getElementById('playerOverlay')
                 || document.getElementById('liveVideoLock');
    const t = document.getElementById('playerLockTitle');
    const tx = document.getElementById('playerLockText');
    if (t) t.textContent = title || 'Subscription required';
    if (tx) tx.textContent = text || 'This content requires a higher subscription.';
    if (overlay) overlay.style.display = '';
    const el = findVideoEl();
    if (el) { try { el.pause(); } catch (_) {} }
  };

  const hideLock = () => {
    const overlay = document.getElementById('playerOverlay')
                 || document.getElementById('liveVideoLock');
    if (overlay) overlay.style.display = 'none';
  };

  /* ═══════════════════════════════════════════════════════
     7. AD OVERLAY
     ═══════════════════════════════════════════════════════ */
  const ensureAdOverlay = () => {
    let overlay = document.getElementById('adOverlay');
    if (overlay) return overlay;

    const playerWrap = videoEl?.closest('.bd-player-wrap') || videoEl?.parentElement;
    if (!playerWrap) return null;

    if (window.getComputedStyle(playerWrap).position === 'static') {
      playerWrap.style.position = 'relative';
    }

    adVideoEl = document.createElement('video');
    adVideoEl.id = 'adVideo';
    adVideoEl.className = 'bd-player';
    adVideoEl.setAttribute('playsinline', '');
    adVideoEl.setAttribute('preload', 'metadata');
    adVideoEl.muted = true;
    adVideoEl.style.cssText = `
      position: absolute; inset: 0;
      width: 100%; height: 100%;
      z-index: 10; object-fit: contain;
      background: #000;
    `;

    overlay = document.createElement('div');
    overlay.id = 'adOverlay';
    overlay.style.cssText = `
      position: absolute; inset: 0;
      z-index: 11; pointer-events: none;
      display: flex; flex-direction: column;
      justify-content: space-between;
      padding: 14px 16px;
      background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 75%, rgba(0,0,0,0.7) 100%);
    `;

    overlay.innerHTML = `
      <div style="pointer-events:auto;align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:rgba(255,200,87,0.95);color:#1a1300;padding:5px 12px;border-radius:8px;font-size:11px;font-weight:900;letter-spacing:1px;text-transform:uppercase;box-shadow:0 4px 12px rgba(0,0,0,0.4)">
        <i class="fa-solid fa-rectangle-ad"></i> AD
      </div>
      <div style="pointer-events:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:12px">
        <div id="adTimer" style="background:rgba(0,0,0,0.8);color:#fff;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:700;backdrop-filter:blur(8px);font-variant-numeric:tabular-nums;display:inline-flex;align-items:center;gap:6px">
          <i class="fa-solid fa-clock"></i> <span id="adTimerText">0:15</span>
        </div>
        <button id="adSkipBtn" disabled style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:not-allowed;opacity:0.6;transition:all 0.2s ease;backdrop-filter:blur(8px);display:inline-flex;align-items:center;gap:8px;font-family:inherit">
          <span id="adSkipText">Skip in 5s</span>
          <i class="fa-solid fa-forward"></i>
        </button>
      </div>
    `;

    playerWrap.appendChild(adVideoEl);
    playerWrap.appendChild(overlay);
    document.getElementById('adSkipBtn').addEventListener('click', () => skipAd());

    return overlay;
  };

  const hideAdOverlay = () => {
    const overlay = document.getElementById('adOverlay');
    if (overlay) overlay.remove();
    const adVid = document.getElementById('adVideo');
    if (adVid) { try { adVid.pause(); } catch (_) {} adVid.remove(); }
    adVideoEl = null;
    if (adHlsInstance) { try { adHlsInstance.destroy(); } catch (_) {} adHlsInstance = null; }
  };

  /* ═══════════════════════════════════════════════════════
     8. PLAY AD
     ═══════════════════════════════════════════════════════ */
  const playAd = (adUrl, adDuration, skipAfter, mainUrl, opts = {}) => {
    const overlay = ensureAdOverlay();
    if (!overlay || !adVideoEl) {
      loadMain(mainUrl, opts);
      return;
    }

    let secondsLeft = adDuration;
    const updateTimer = () => {
      const t = document.getElementById('adTimerText');
      if (t) t.textContent = `${Math.floor(secondsLeft/60)}:${String(secondsLeft%60).padStart(2,'0')}`;
    };
    updateTimer();
    adTimerInterval = setInterval(() => {
      secondsLeft = Math.max(0, secondsLeft - 1);
      updateTimer();
    }, 1000);

    let skipLeft = skipAfter;
    const skipBtn = document.getElementById('adSkipBtn');
    const skipText = document.getElementById('adSkipText');

    const updateSkip = () => {
      if (skipLeft <= 0) {
        skipBtn.disabled = false;
        skipBtn.style.cursor = 'pointer';
        skipBtn.style.opacity = '1';
        skipBtn.style.background = 'linear-gradient(135deg, #FFD97A, #FFC857)';
        skipBtn.style.color = '#1a1300';
        skipBtn.style.borderColor = '#FFC857';
        skipBtn.style.boxShadow = '0 4px 14px rgba(255,200,87,0.4)';
        skipText.textContent = 'Skip Ad';
      } else {
        skipBtn.disabled = true;
        skipText.textContent = `Skip in ${skipLeft}s`;
      }
    };
    updateSkip();
    adSkipTimer = setInterval(() => {
      skipLeft = Math.max(0, skipLeft - 1);
      updateSkip();
    }, 1000);

    const fixedUrl = fixMixedContent(adUrl);
    const isHls = /\.m3u8(\?|#|$)/i.test(fixedUrl);

    if (isHls && window.Hls && window.Hls.isSupported()) {
      adHlsInstance = new window.Hls({ enableWorker: true });
      adHlsInstance.loadSource(fixedUrl);
      adHlsInstance.attachMedia(adVideoEl);
      adHlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
        adVideoEl.play().catch(() => {});
      });
      adHlsInstance.on(window.Hls.Events.ERROR, (e, d) => {
        if (d.fatal) skipToMain(mainUrl, opts);
      });
    } else {
      adVideoEl.src = fixedUrl;
      adVideoEl.play().catch(() => {});
    }

    adVideoEl.addEventListener('ended', () => skipToMain(mainUrl, opts), { once: true });
    adVideoEl.addEventListener('error', () => skipToMain(mainUrl, opts), { once: true });
  };

  let pendingMainUrl = null, pendingMainOpts = null;
  const skipAd = () => {
    if (pendingMainUrl) skipToMain(pendingMainUrl, pendingMainOpts);
  };

  const skipToMain = (mainUrl, opts = {}) => {
    if (adTimerInterval) { clearInterval(adTimerInterval); adTimerInterval = null; }
    if (adSkipTimer) { clearInterval(adSkipTimer); adSkipTimer = null; }
    if (adVideoEl) { try { adVideoEl.pause(); } catch (_) {} }
    if (adHlsInstance) { try { adHlsInstance.destroy(); } catch (_) {} adHlsInstance = null; }
    hideAdOverlay();
    pendingMainUrl = null; pendingMainOpts = null;
    if (!mainUrl) return;
    loadMain(mainUrl, opts);
  };

  /* ═══════════════════════════════════════════════════════
     9. LOAD MAIN VIDEO
     ═══════════════════════════════════════════════════════ */
  const loadMain = (url, opts = {}) => {
    videoEl = findVideoEl();
    if (!videoEl) return;

    url = fixMixedContent(url);
    currentUrl = url;

    if (hlsInstance) { try { hlsInstance.destroy(); } catch (_) {} hlsInstance = null; }

    // ✅ ابدأ بدون كتم
    videoEl.muted = false;
    videoEl.volume = 1;

    const isHls = /\.m3u8(\?|#|$)/i.test(url);

    const onReady = () => {
      if (opts.autoplay) {
        videoEl.play().then(() => {
          console.log('[BDPlayer] ▶ Play started');
          // ✅ حاول إزالة الكتم مرة أخرى (احتياط)
          if (videoEl.muted) {
            tryAutoUnmute();
          }
        }).catch((err) => {
          console.warn('[BDPlayer] Autoplay blocked:', err.message);
          if (window.Toast) Toast.info('اضغط زر التشغيل للبدء');
          // ✅ عند الحظر → حاول عند أول تفاعل
          tryAutoUnmute();
        });
      }
    };

    if (isHls && window.Hls && window.Hls.isSupported()) {
      hlsInstance = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 30,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 3,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 4,
        startLevel: -1,
      });

      hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
        console.log('[BDPlayer] ✅ Manifest parsed');
        onReady();
      });

      hlsInstance.on(window.Hls.Events.ERROR, (e, d) => {
        if (!d.fatal) return;
        if (d.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
          if (d.response?.code === 404) {
            if (window.Toast) Toast.error('Stream not found (404)');
            showLock('Stream unavailable', 'Stream URL is invalid or the match ended.');
            return;
          }
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(() => hlsInstance.startLoad(), 1500 * retryCount);
          }
        } else if (d.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
          try { hlsInstance.recoverMediaError(); } catch (_) {}
        }
      });

      hlsInstance.loadSource(url);
      hlsInstance.attachMedia(videoEl);

    } else if (isHls && videoEl.canPlayType('application/vnd.apple.mpegurl')) {
      videoEl.src = url;
      videoEl.addEventListener('loadedmetadata', onReady, { once: true });
    } else {
      videoEl.src = url;
      onReady();
    }

    // ✅ عند التفاعل مع الفيديو → حاول إزالة الكتم
    videoEl.addEventListener('play', () => {
      if (videoEl.muted) {
        tryAutoUnmute();
      }
    });
  };

  /* ═══════════════════════════════════════════════════════
     10. PUBLIC LOAD
     ═══════════════════════════════════════════════════════ */
  const load = (url, opts = {}) => {
    videoEl = findVideoEl();
    if (!videoEl || !url) return;

    bindOrientation();

    destroy();
    videoEl = findVideoEl();

    const ad = opts.ad;
    if (ad && ad.ad_video_url) {
      pendingMainUrl = url;
      pendingMainOpts = opts;
      playAd(ad.ad_video_url, ad.ad_duration || 15, ad.ad_skip_after || 5, url, opts);
      return;
    }

    loadMain(url, opts);
  };

  /* ═══════════════════════════════════════════════════════
     11. PUBLIC API
     ═══════════════════════════════════════════════════════ */
  return {
    load,
    destroy,
    showLock,
    hideLock,
    skipAd,
    requestFullscreen: () => enterFullscreen(videoEl?.closest('.bd-player-wrap') || videoEl),
    exitFullscreen,
    getVideo: () => videoEl,
  };
})();