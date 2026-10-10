/* =========================================================
   BOTOLA D2 — contact.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  await waitFor(() => window.I18N && I18N.isReady(), 2000);
  bindForm();
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

function bindForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      phone: form.phone.value.trim(),
      subject: form.subject.value.trim(),
      message: form.message.value.trim()
    };

    if (!validate(data, form)) return;

    const btn = document.getElementById('contactSubmit');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${I18N.t('common.loading','Sending...')}`;

    try {
      await API.sendContact(data);
      Toast.success(I18N.t('contact.success','Message sent! We will get back to you soon.'));
      form.reset();
    } catch (err) {
      Toast.error(err.message || I18N.t('errors.generic','Something went wrong'));
      if (err.errors && Array.isArray(err.errors)) {
        err.errors.forEach(x => showError(form, x.field, x.message));
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  });
}

function validate(d, form) {
  let ok = true;
  if (!d.name || d.name.length < 2) { showError(form, 'name', I18N.t('contact.err_name','Please enter your full name')); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { showError(form, 'email', I18N.t('contact.err_email','Please enter a valid email')); ok = false; }
  if (!d.subject || d.subject.length < 3) { showError(form, 'subject', I18N.t('contact.err_subject','Please enter a subject')); ok = false; }
  if (!d.message || d.message.length < 10) { showError(form, 'message', I18N.t('contact.err_message','Message is too short')); ok = false; }
  return ok;
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