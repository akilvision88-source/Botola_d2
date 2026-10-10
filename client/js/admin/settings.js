/* =========================================================
   BOTOLA D2 Admin — settings.js
   ========================================================= */

let settings = {};

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('settings', 'Settings');
  if (!user) return;

  bindUI();
  loadSettings();
});

function bindUI() {
  document.querySelectorAll('.set-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      document.querySelectorAll('.set-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.set-panel').forEach(p => {
        p.style.display = p.getAttribute('data-panel') === target ? '' : 'none';
      });
    });
  });

  // Sync color inputs
  const colorSync = (colorName, hexName) => {
    const c = document.querySelector(`[name="${colorName}"]`);
    const h = document.querySelector(`[name="${hexName}"]`);
    if (!c || !h) return;
    c.addEventListener('input', () => { h.value = c.value; });
    h.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(h.value)) c.value = h.value;
    });
  };
  colorSync('primary_color', 'primary_color_hex');
  colorSync('secondary_color', 'secondary_color_hex');

  document.getElementById('saveAllBtn')?.addEventListener('click', saveSettings);
}

async function loadSettings() {
  try {
    const res = await AdminAPI.settingsGet();
    settings = res?.data || {};
    fillForm(settings);
  } catch (err) {
    AdToast.error(err.message || 'Failed to load settings');
  }
}

function fillForm(s) {
  const form = document.getElementById('settingsForm');
  Object.keys(s).forEach(k => {
    const el = form[k];
    if (el) el.value = s[k] || '';
  });

  // Sync color pickers
  const pc = form['primary_color'];
  const sch = form['primary_color_hex'];
  if (pc && sch && s.primary_color) { pc.value = s.primary_color; sch.value = s.primary_color; }

  const sc = form['secondary_color'];
  const sch2 = form['secondary_color_hex'];
  if (sc && sch2 && s.secondary_color) { sc.value = s.secondary_color; sch2.value = s.secondary_color; }
}

async function saveSettings() {
  const form = document.getElementById('settingsForm');
  const btn = document.getElementById('saveAllBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;

  const payload = {};
  ['platform_name','platform_tagline','contact_email','contact_phone','default_language',
   'primary_color','secondary_color','logo_url','favicon_url',
   'facebook_url','instagram_url','youtube_url','tiktok_url','x_url',
   'about_text','footer_text'].forEach(k => {
    const el = form[k];
    if (!el) return;
    if (k === 'primary_color' || k === 'secondary_color') {
      const hex = form[k + '_hex']?.value?.trim();
      payload[k] = hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : el.value;
    } else {
      payload[k] = el.value.trim();
    }
  });

  try {
    await AdminAPI.settingsUpdate(payload);
    AdToast.success('Settings saved');
  } catch (err) {
    AdToast.error(err.message || 'Save failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}