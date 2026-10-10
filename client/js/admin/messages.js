/* =========================================================
   BOTOLA D2 Admin — messages.js
   ========================================================= */

let page = 1;
const LIMIT = 20;
let currentId = null;
let filterTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await AdminShell.mount('messages', 'Messages');
  if (!user) return;

  bindUI();
  loadMessages();
});

function bindUI() {
  document.getElementById('refreshBtn')?.addEventListener('click', () => loadMessages(page));

  const search = document.getElementById('filterSearch');
  if (search) search.addEventListener('input', () => {
    clearTimeout(filterTimer);
    filterTimer = setTimeout(() => { page = 1; loadMessages(1); }, 350);
  });
  document.getElementById('filterStatus')?.addEventListener('change', () => { page = 1; loadMessages(1); });

  document.getElementById('msgSaveBtn')?.addEventListener('click', saveStatus);
  document.getElementById('msgDeleteBtn')?.addEventListener('click', deleteMessage);
}

/* ============ LIST ============ */
async function loadMessages(p = 1) {
  page = p;
  const tbody = document.getElementById('messagesBody');
  AdUtil.showTableSkeleton(tbody, 7, 6);

  try {
    const params = { page: p, limit: LIMIT };
    const status = document.getElementById('filterStatus')?.value;
    if (status) params.status = status;

    const res = await AdminAPI.messagesList(params);
    const items = res?.data?.items || [];
    const pagination = res?.data?.pagination || { total: 0, page: 1, totalPages: 0 };

    const countLabel = document.getElementById('countLabel');
    if (countLabel) countLabel.textContent = `${pagination.total} total`;

    const q = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
    const filtered = q ? items.filter(m =>
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.subject || '').toLowerCase().includes(q)
    ) : items;

    if (!filtered.length) {
      tbody.innerHTML = AdUtil.emptyRow(7, 'No messages');
      AdUtil.paginate(document.getElementById('pagination'), { totalPages: 0 });
      return;
    }

    tbody.innerHTML = filtered.map(m => `
      <tr style="cursor:pointer" data-open="${m.id}">
        <td>
          <div class="ad-avatar-cell">
            ${AdUtil.avatar({ full_name: m.name })}
            <div>
              <div class="name">${AdUtil.esc(m.name)}</div>
              <div class="sub">${AdUtil.esc(m.email)}</div>
            </div>
          </div>
        </td>
        <td>${AdUtil.esc(m.phone || '—')}</td>
        <td><strong>${AdUtil.esc(m.subject)}</strong></td>
        <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
          ${AdUtil.esc(m.message)}
        </td>
        <td>
          ${m.status === 'new' ? `<span class="ad-pill upcoming">NEW</span>` :
            m.status === 'read' ? `<span class="ad-pill finished">READ</span>` :
            m.status === 'replied' ? `<span class="ad-pill active">REPLIED</span>` :
            `<span class="ad-pill">ARCHIVED</span>`}
        </td>
        <td>${AdUtil.fmtDateTime(m.created_at)}</td>
        <td>
          <div class="ad-row-actions">
            <button class="ad-row-btn" data-open="${m.id}" title="Open"><i class="fa-solid fa-envelope-open-text"></i></button>
            <button class="ad-row-btn danger" data-delete="${m.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-open]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-delete]')) return;
        const id = el.getAttribute('data-open');
        const msg = items.find(x => String(x.id) === String(id));
        if (msg) openMessage(msg);
      });
    });

    tbody.querySelectorAll('[data-delete]').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = el.getAttribute('data-delete');
        const ok = await AdUtil.confirmDialog('Delete message?', 'This action cannot be undone.', 'Delete');
        if (!ok) return;
        try {
          await AdminAPI.messageDelete(id);
          AdToast.success('Deleted');
          loadMessages(page);
        } catch (err) { AdToast.error(err.message || 'Delete failed'); }
      });
    });

    AdUtil.paginate(document.getElementById('pagination'), pagination, loadMessages);
  } catch (err) {
    tbody.innerHTML = AdUtil.emptyRow(7, 'Failed to load: ' + (err.message || ''));
  }
}

/* ============ MODAL ============ */
function openMessage(m) {
  currentId = m.id;

  document.getElementById('messageTitle').textContent = m.subject || 'Message';
  document.getElementById('msgFromName').textContent = m.name || '—';
  document.getElementById('msgFromEmail').textContent = m.email || '—';
  document.getElementById('msgFromPhone').textContent = m.phone ? '📞 ' + m.phone : '';
  document.getElementById('msgSubject').textContent = m.subject || '—';
  document.getElementById('msgBody').textContent = m.message || '';
  document.getElementById('msgStatus').value = m.status || 'new';

  const initials = (m.name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  document.getElementById('msgInitials').textContent = initials;

  document.getElementById('msgReply').href = `mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || '')}`;

  // Auto-mark as read if new
  if (m.status === 'new') {
    AdminAPI.messageStatus(m.id, { status: 'read' }).catch(() => {});
  }

  AdUtil.openModal('messageModal');
}

async function saveStatus() {
  if (!currentId) return;
  const status = document.getElementById('msgStatus').value;
  const btn = document.getElementById('msgSaveBtn');
  const orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
  try {
    await AdminAPI.messageStatus(currentId, { status });
    AdToast.success('Status updated');
    AdUtil.closeModal('messageModal');
    loadMessages(page);
  } catch (err) {
    AdToast.error(err.message || 'Update failed');
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

async function deleteMessage() {
  if (!currentId) return;
  const ok = await AdUtil.confirmDialog('Delete message?', 'This action cannot be undone.', 'Delete');
  if (!ok) return;
  try {
    await AdminAPI.messageDelete(currentId);
    AdToast.success('Deleted');
    AdUtil.closeModal('messageModal');
    loadMessages(page);
  } catch (err) { AdToast.error(err.message || 'Delete failed'); }
}