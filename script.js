/* =====================================================
   ANIVERSÁRIOS APP — script.js  (v2)
   Calendário principal + painel lateral deslizante
   ===================================================== */

// ─── Estado global ─────────────────────────────────────
let birthdays    = [];
let editingId    = null;
let calendarDate = new Date();
let searchQuery  = '';
let popupDatePrefill = null; // data pré-preenchida ao clicar no calendário

const STORAGE_KEY = 'aniversarios_app_data';

// ─── Utilitários ───────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(birthdays));
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    birthdays = raw ? JSON.parse(raw) : [];
  } catch { birthdays = []; }
}

/** Dias até o próximo aniversário (ignora o ano) */
function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const p = dateStr.split('-');
  const next = new Date(today.getFullYear(), parseInt(p[1])-1, parseInt(p[2]));
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.round((next - today) / 86400000);
}

/** "15 de março" */
function formatDate(dateStr) {
  const p = dateStr.split('-');
  const d = new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]));
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
}

function getInitial(name) { return name.trim().charAt(0).toUpperCase(); }

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str; return d.innerHTML;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

// ─── Painel lateral ────────────────────────────────────

function openPanel(title = 'Novo aniversário') {
  document.getElementById('panel-title').textContent = title;
  document.getElementById('side-panel').classList.add('open');
  document.getElementById('panel-overlay').classList.add('active');
  document.getElementById('input-name').focus();
}

function closePanel() {
  document.getElementById('side-panel').classList.remove('open');
  document.getElementById('panel-overlay').classList.remove('active');
  clearForm();
}

// ─── Formulário ────────────────────────────────────────

function clearForm() {
  document.getElementById('input-name').value     = '';
  document.getElementById('input-date').value     = '';
  document.getElementById('input-category').value = 'familia';
  document.getElementById('input-note').value     = '';
  editingId = null;
  popupDatePrefill = null;
}

function startEdit(id) {
  const b = birthdays.find(x => x.id === id);
  if (!b) return;
  editingId = id;
  document.getElementById('input-name').value     = b.name;
  document.getElementById('input-date').value     = b.date;
  document.getElementById('input-category').value = b.category;
  document.getElementById('input-note').value     = b.note || '';
  openPanel('Editar aniversário');
}

function deleteBirthday(id) {
  if (!confirm('Deseja excluir este aniversário?')) return;
  birthdays = birthdays.filter(b => b.id !== id);
  save(); renderAll();
  showToast('Aniversário removido.');
}

// ─── Renderizar lista ──────────────────────────────────

function getSortedFiltered() {
  return birthdays
    .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
}

function renderList() {
  const list  = document.getElementById('birthday-list');
  const empty = document.getElementById('empty-state');
  document.getElementById('total-count').textContent = birthdays.length;

  const items = getSortedFiltered();

  if (items.length === 0) {
    list.innerHTML = ''; empty.style.display = 'block'; return;
  }
  empty.style.display = 'none';

  list.innerHTML = items.map(b => {
    const days = daysUntil(b.date);
    const isToday = days === 0;
    const label = isToday ? '🎉 Hoje!' : `${days} dia${days !== 1 ? 's' : ''}`;
    const badgeClass = isToday ? 'days-badge today-badge' : 'days-badge';
    const catLabel = b.category === 'familia' ? '🏡 Família' : '💛 Amigo(a)';
    const noteHtml = b.note
      ? `<div class="birthday-note">${escapeHtml(b.note)}</div>` : '';

    return `
      <div class="birthday-item ${b.category}">
        <div class="birthday-avatar">${getInitial(b.name)}</div>
        <div class="birthday-info">
          <div class="birthday-name">${escapeHtml(b.name)}</div>
          <div class="birthday-meta">
            <span>${formatDate(b.date)}</span>
            <span>·</span>
            <span>${catLabel}</span>
          </div>
          ${noteHtml}
        </div>
        <span class="${badgeClass}">${label}</span>
        <div class="birthday-actions">
          <button class="action-btn edit-btn" data-id="${b.id}" title="Editar">✏️</button>
          <button class="action-btn delete delete-btn" data-id="${b.id}" title="Excluir">🗑️</button>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', () => startEdit(btn.dataset.id)));
  list.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteBirthday(btn.dataset.id)));
}

// ─── Próximos aniversários ─────────────────────────────

function renderUpcoming() {
  const container = document.getElementById('upcoming-list');
  const sorted = [...birthdays].sort((a,b) => daysUntil(a.date) - daysUntil(b.date));
  const top5 = sorted.slice(0, 5);

  if (top5.length === 0) {
    container.innerHTML = '<p class="upcoming-empty">Nenhum aniversário ainda.</p>';
    return;
  }

  container.innerHTML = top5.map(b => {
    const days = daysUntil(b.date);
    const numLabel  = days === 0 ? '🎉' : days;
    const textLabel = days === 0 ? 'hoje' : days === 1 ? 'dia' : 'dias';

    return `
      <div class="upcoming-item">
        <div class="upcoming-days">
          <span class="num">${numLabel}</span>
          <span class="label">${textLabel}</span>
        </div>
        <span class="upcoming-dot ${b.category}"></span>
        <div class="upcoming-info">
          <div class="upcoming-name">${escapeHtml(b.name)}</div>
          <div class="upcoming-date">${formatDate(b.date)}</div>
        </div>
      </div>`;
  }).join('');
}

// ─── Calendário ────────────────────────────────────────

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function renderCalendar() {
  const year  = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const today = new Date(); today.setHours(0,0,0,0);

  document.getElementById('calendar-title').textContent =
    `${MONTHS_PT[month]} ${year}`;

  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Mapa: dia → aniversariantes do mês
  const birthdayMap = {};
  birthdays.forEach(b => {
    const p = b.date.split('-');
    if (parseInt(p[1]) - 1 === month) {
      const d = parseInt(p[2]);
      if (!birthdayMap[d]) birthdayMap[d] = [];
      birthdayMap[d].push(b);
    }
  });

  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  // Células vazias antes do dia 1
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-day empty';
    grid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    const thisDate = new Date(year, month, d);
    const isToday  = thisDate.getTime() === today.getTime();
    const hasBday  = !!birthdayMap[d];

    cell.className = 'cal-day' +
      (isToday ? ' today' : '') +
      (hasBday  ? ' has-birthday' : '');

    cell.textContent = d;

    if (hasBday) {
      const dot = document.createElement('span');
      dot.className = 'cal-dot';
      cell.appendChild(dot);

      cell.addEventListener('click', () => showDayPopup(d, month, year, birthdayMap[d]));
    }

    grid.appendChild(cell);
  }
}

// ─── Popup de dia ──────────────────────────────────────

function showDayPopup(day, month, year, people) {
  const popup  = document.getElementById('day-popup');
  const dateEl = document.getElementById('popup-date');
  const listEl = document.getElementById('popup-list');

  const date = new Date(year, month, day);
  dateEl.textContent = date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  listEl.innerHTML = people.map(b =>
    `<li>${b.category === 'familia' ? '🏡' : '💛'} <strong>${escapeHtml(b.name)}</strong></li>`
  ).join('');

  // Armazena a data para pré-preenchimento ao clicar em "+ Adicionar nesta data"
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  popupDatePrefill = `${year}-${mm}-${dd}`;

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'panel-overlay active';
  overlay.id = 'day-popup-overlay';
  overlay.style.zIndex = '215';
  overlay.addEventListener('click', closeDayPopup);
  document.body.appendChild(overlay);

  popup.style.display = 'block';
}

function closeDayPopup() {
  document.getElementById('day-popup').style.display = 'none';
  const overlay = document.getElementById('day-popup-overlay');
  if (overlay) overlay.remove();
  popupDatePrefill = null;
}

// ─── Render completo ────────────────────────────────────

function renderAll() {
  renderList();
  renderUpcoming();
  renderCalendar();
}

// ─── Export / Import ────────────────────────────────────

function exportJSON() {
  const blob = new Blob([JSON.stringify(birthdays, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'aniversarios.json'; a.click();
  URL.revokeObjectURL(url);
  showToast('Exportado com sucesso!');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error();
      const existingIds = new Set(birthdays.map(b => b.id));
      const newOnes = data.filter(b => b.id && !existingIds.has(b.id));
      birthdays = [...birthdays, ...newOnes];
      save(); renderAll();
      showToast(`${newOnes.length} aniversário(s) importado(s).`);
    } catch {
      alert('Arquivo JSON inválido.');
    }
  };
  reader.readAsText(file);
}

// ─── Inicialização e eventos ───────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  load();
  renderAll();

  // Abrir painel (botão "+ Adicionar")
  document.getElementById('btn-open-form').addEventListener('click', () => {
    clearForm();
    openPanel('Novo aniversário');
  });

  // Fechar painel
  document.getElementById('panel-close').addEventListener('click', closePanel);
  document.getElementById('btn-cancel').addEventListener('click', closePanel);
  document.getElementById('panel-overlay').addEventListener('click', e => {
    // Só fecha se o overlay não tiver z-index de popup de dia
    if (e.target.id === 'panel-overlay') closePanel();
  });

  // Envio do formulário
  document.getElementById('birthday-form').addEventListener('submit', e => {
    e.preventDefault();
    const name     = document.getElementById('input-name').value.trim();
    const date     = document.getElementById('input-date').value;
    const category = document.getElementById('input-category').value;
    const note     = document.getElementById('input-note').value.trim();

    if (!name || !date) { showToast('Preencha o nome e a data!'); return; }

    if (editingId) {
      const idx = birthdays.findIndex(b => b.id === editingId);
      if (idx !== -1) birthdays[idx] = { ...birthdays[idx], name, date, category, note };
      showToast('Aniversário atualizado! ✨');
    } else {
      birthdays.push({ id: uid(), name, date, category, note });
      showToast('Aniversário salvo! 🌸');
    }

    save(); closePanel(); renderAll();
  });

  // Busca
  document.getElementById('search-input').addEventListener('input', e => {
    searchQuery = e.target.value;
    renderList();
  });

  // Navegação do calendário
  document.getElementById('prev-month').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });

  // Botão "Hoje"
  document.getElementById('btn-today').addEventListener('click', () => {
    calendarDate = new Date();
    renderCalendar();
  });

  // Fechar popup de dia
  document.getElementById('popup-close').addEventListener('click', closeDayPopup);

  // "+ Adicionar nesta data" no popup do dia
  document.getElementById('popup-add-btn').addEventListener('click', () => {
    const prefill = popupDatePrefill;
    closeDayPopup();
    clearForm();
    openPanel('Novo aniversário');
    // Pré-preenche a data depois de um frame (painel precisa estar aberto)
    setTimeout(() => {
      if (prefill) document.getElementById('input-date').value = prefill;
    }, 50);
  });

  // Export / Import
  document.getElementById('btn-export').addEventListener('click', exportJSON);
  document.getElementById('btn-import').addEventListener('click', () =>
    document.getElementById('import-file').click()
  );
  document.getElementById('import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) { importJSON(file); e.target.value = ''; }
  });
});
