/* ============================================================
   Gestiune Petrecere — logica aplicației
   Totul se salvează local pe telefon (localStorage). Fără internet.
   ============================================================ */

'use strict';

const KEY = 'petrecere.v1';
const DEFAULT_TABLES = 10;
const DEFAULT_CAP = 10;

/* ---------------- stare ---------------- */

function freshState() {
  const tables = [];
  for (let i = 1; i <= DEFAULT_TABLES; i++) {
    tables.push({ id: uid(), name: 'Masa ' + i, capacity: DEFAULT_CAP });
  }
  return {
    version: 1,
    eventName: 'Petrecere de final de an',
    eventDate: '',
    eventPlace: '',
    tables,
    guests: []
  };
}

let S = load();
let tab = 'home';
let guestQuery = '';
let guestFilter = 'all';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.tables) || !Array.isArray(d.guests)) return freshState();
    return d;
  } catch (e) {
    console.warn('Nu am putut citi datele salvate:', e);
    return freshState();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    toast('Eroare la salvare!');
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------------- ajutoare ---------------- */

const $ = (sel) => document.querySelector(sel);
const view = $('#view');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function buzz(ms) {
  try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {}
}

/* Text „curățat” pentru căutare și comparare nume:
   fără diacritice, fără majuscule, fără spații duble.
   Așa „tanase” îl găsește pe „Tănase”, iar „Ștefan” = „stefan”. */
function norm(s) {
  return String(s == null ? '' : s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // taie semnele diacritice
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/* copie a întregii stări, pentru butonul „Anulează” */
function snapshot() { return JSON.stringify(S); }

function restoreSnapshot(json) {
  try {
    S = JSON.parse(json);
    save();
    paintHeader();
    render();
    toast('Am pus înapoi');
    buzz(14);
  } catch (e) {
    toast('Nu am putut anula');
  }
}

let toastTimer = null;
/* toast(mesaj) — simplu
   toast(mesaj, undoJson) — cu buton „Anulează” care readuce starea salvată */
function toast(msg, undoJson, ms) {
  const t = $('#toast');
  t.innerHTML = '<span>' + esc(msg) + '</span>'
    + (undoJson ? '<button type="button" id="undoBtn">Anulează</button>' : '');
  t.hidden = false;
  t.style.animation = 'none';
  void t.offsetWidth;
  t.style.animation = '';

  if (undoJson) {
    $('#undoBtn').addEventListener('click', () => {
      clearTimeout(toastTimer);
      t.hidden = true;
      restoreSnapshot(undoJson);
    });
  }

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, ms || (undoJson ? 6500 : 2400));
}

function initials(name) {
  const p = String(name).trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

function tableById(id) { return S.tables.find(t => t.id === id) || null; }
function guestById(id) { return S.guests.find(g => g.id === id) || null; }
function guestsAt(id) { return S.guests.filter(g => g.tableId === id); }
function unassigned() { return S.guests.filter(g => !g.tableId || !tableById(g.tableId)); }

function totals() {
  const cap = S.tables.reduce((a, t) => a + (+t.capacity || 0), 0);
  const seated = S.guests.filter(g => g.tableId && tableById(g.tableId)).length;
  const paid = S.guests.filter(g => g.paid).length;
  return {
    cap,
    seated,
    free: Math.max(0, cap - seated),
    total: S.guests.length,
    paid,
    unpaid: S.guests.length - paid,
    noTable: unassigned().length
  };
}

function sortGuests(list) {
  return list.slice().sort((a, b) =>
    String(a.name).localeCompare(String(b.name), 'ro', { sensitivity: 'base' }));
}

function dateLabel(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const luni = ['ianuarie','februarie','martie','aprilie','mai','iunie',
                'iulie','august','septembrie','octombrie','noiembrie','decembrie'];
  const m = luni[+parts[1] - 1] || '';
  return +parts[2] + ' ' + m + ' ' + parts[0];
}

/* ---------------- iconițe ---------------- */

const IC = {
  check: '<svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6.1"/><path d="M18 14.9c2 .8 3 2.6 3 5.1"/></svg>',
  table: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="3.4" r="1.6"/><circle cx="12" cy="20.6" r="1.6"/><circle cx="3.4" cy="12" r="1.6"/><circle cx="20.6" cy="12" r="1.6"/></svg>',
  money: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M6.5 3h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4 6.2 2 2 0 0 1 6 4z"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M7.5 11L12 15.5 16.5 11"/><path d="M4.5 20h15"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 16V5"/><path d="M7.5 9.5L12 5l4.5 4.5"/><path d="M4.5 20h15"/></svg>',
  share: '<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6 7l1 13h10l1-13"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></svg>',
  glass: '<svg viewBox="0 0 24 24"><path d="M6 3h12l-1.5 6.5A5 5 0 0 1 12 13a5 5 0 0 1-4.5-3.5z"/><path d="M12 13v7M8.5 20h7"/></svg>'
};

/* ============================================================
   ECRAN: ACASĂ
   ============================================================ */

function renderHome() {
  const t = totals();
  const pctPaid = t.total ? Math.round(t.paid / t.total * 100) : 0;
  const pctFull = t.cap ? Math.round(t.seated / t.cap * 100) : 0;

  let html = '';

  html += '<div class="stats">';
  html += statCard('gold', t.total, 'Invitați înscriși', t.noTable ? t.noTable + ' fără masă' : 'toți au masă');
  html += statCard('ok', t.paid, 'Au achitat', pctPaid + '% din total');
  html += statCard('warn', t.unpaid, 'Nu au achitat', t.unpaid ? 'de urmărit' : 'totul încasat');
  html += statCard('info', t.free, 'Locuri libere', 'din ' + t.cap + ' locuri');
  html += '</div>';

  html += '<div class="section-title"><h2>Încasări</h2></div>';
  html += '<div class="card">'
        + '<div class="progress-row"><b>' + t.paid + ' din ' + t.total + ' au achitat</b><span>' + pctPaid + '%</span></div>'
        + '<div class="progress green"><i style="width:' + pctPaid + '%"></i></div>'
        + '</div>';
  html += '<div class="card">'
        + '<div class="progress-row"><b>' + t.seated + ' din ' + t.cap + ' locuri ocupate</b><span>' + pctFull + '%</span></div>'
        + '<div class="progress"><i style="width:' + pctFull + '%"></i></div>'
        + '</div>';

  html += '<div class="section-title"><h2>Acțiuni rapide</h2></div>';
  html += '<div class="quick">'
        + quickBtn('addGuest', IC.plus, 'Adaugă invitat')
        + quickBtn('addMany', IC.list, 'Adaugă o listă')
        + quickBtn('showUnpaid', IC.money, 'Cine n-a plătit')
        + quickBtn('showNoTable', IC.users, 'Fără masă (' + t.noTable + ')')
        + '</div>';

  html += '<div class="section-title"><h2>Mese</h2>'
        + '<button class="link-btn" data-go="tables">Vezi toate ' + IC.chev.replace('class="chev"', 'style="width:12px;height:12px;vertical-align:-1px"') + '</button></div>';
  html += '<div class="tlist">';
  const preview = S.tables.slice(0, 4);
  preview.forEach(tb => { html += tableRow(tb); });
  html += '</div>';
  if (S.tables.length > 4) {
    html += '<button class="btn ghost sm" data-go="tables" style="margin-top:11px">Toate cele '
          + S.tables.length + ' mese</button>';
  }

  view.innerHTML = html;
}

function statCard(cls, val, label, sub) {
  return '<div class="stat ' + cls + '"><div class="v">' + val + '</div>'
       + '<div class="l">' + label + '</div>'
       + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div>';
}

function quickBtn(action, icon, label) {
  return '<button data-quick="' + action + '"><span class="qi">' + icon + '</span><b>' + label + '</b></button>';
}

/* ============================================================
   ECRAN: MESE
   ============================================================ */

function tableRow(tb) {
  const list = guestsAt(tb.id);
  const cap = +tb.capacity || 0;
  const free = cap - list.length;
  const pct = cap ? Math.min(100, Math.round(list.length / cap * 100)) : 0;
  const paid = list.filter(g => g.paid).length;

  let chip;
  if (free > 0) chip = '<span class="chip neutral">' + free + ' ' + (free === 1 ? 'loc liber' : 'locuri libere') + '</span>';
  else if (free === 0) chip = '<span class="chip gold">PLIN</span>';
  else chip = '<span class="chip bad">+' + (-free) + ' peste</span>';

  const payChip = list.length
    ? (paid === list.length
        ? '<span class="chip ok">' + IC.check + ' plătit</span>'
        : '<span class="chip warn">' + (list.length - paid) + ' de încasat</span>')
    : '';

  return '<button class="trow' + (free <= 0 ? ' full' : '') + '" data-table="' + tb.id + '">'
       + '<span class="tdisc" style="--p:' + pct + '"><b>' + list.length + '/' + cap + '</b></span>'
       + '<span class="tinfo"><span class="n">' + esc(tb.name) + '</span>'
       + '<span class="s" style="display:flex;gap:6px;margin-top:5px;flex-wrap:wrap">' + chip + payChip + '</span></span>'
       + IC.chev + '</button>';
}

function renderTables() {
  const t = totals();
  let html = '';

  html += '<div class="card" style="display:flex;gap:14px;text-align:center">'
        + miniStat(S.tables.length, 'mese')
        + miniStat(t.cap, 'locuri')
        + miniStat(t.seated, 'ocupate')
        + miniStat(t.free, 'libere')
        + '</div>';

  html += '<div class="section-title"><h2>Toate mesele</h2>'
        + '<button class="link-btn" data-quick="addTable">+ Masă nouă</button></div>';

  if (!S.tables.length) {
    html += emptyBox(IC.table, 'Nicio masă', 'Adaugă prima masă ca să poți repartiza invitații.');
  } else {
    html += '<div class="tlist">';
    S.tables.forEach(tb => { html += tableRow(tb); });
    html += '</div>';
  }

  const na = unassigned();
  if (na.length) {
    html += '<div class="section-title"><h2>Fără masă (' + na.length + ')</h2></div>';
    html += '<div class="glist">';
    sortGuests(na).forEach(g => { html += guestRow(g); });
    html += '</div>';
  }

  view.innerHTML = html;
}

function miniStat(v, l) {
  return '<div style="flex:1"><div style="font-size:22px;font-weight:750;font-variant-numeric:tabular-nums">'
       + v + '</div><div style="font-size:11px;color:var(--muted);margin-top:3px">' + l + '</div></div>';
}

function emptyBox(icon, title, text) {
  return '<div class="empty"><div class="ico">' + icon + '</div><h3>' + title + '</h3><p>' + text + '</p></div>';
}

/* ============================================================
   ECRAN: INVITAȚI
   ============================================================ */

function guestRow(g) {
  const tb = g.tableId ? tableById(g.tableId) : null;
  const bits = [];
  bits.push(tb ? esc(tb.name) : '<span style="color:var(--warn)">fără masă</span>');
  if (g.phone) bits.push(esc(g.phone));
  if (g.notes) bits.push('<span style="color:var(--faint)">📝</span>');

  return '<div class="grow" data-guest="' + g.id + '">'
       + '<span class="avatar">' + esc(initials(g.name)) + '</span>'
       + '<span class="ginfo"><span class="n">' + esc(g.name) + '</span>'
       + '<span class="s">' + bits.join('<span style="color:var(--faint)">·</span>') + '</span></span>'
       + '<button class="pay-btn" data-pay="' + g.id + '" aria-label="Marchează achitat">'
       + '<span class="pay-dot' + (g.paid ? ' on' : '') + '">' + IC.check + '</span></button>'
       + '</div>';
}

function filteredGuests() {
  let list = S.guests.slice();

  if (guestFilter === 'paid') list = list.filter(g => g.paid);
  else if (guestFilter === 'unpaid') list = list.filter(g => !g.paid);
  else if (guestFilter === 'notable') list = list.filter(g => !g.tableId || !tableById(g.tableId));

  const q = norm(guestQuery);
  if (q) {
    list = list.filter(g => {
      const tb = tableById(g.tableId);
      return norm(g.name).includes(q)
          || norm(g.phone).includes(q)
          || norm(g.notes).includes(q)
          || (tb && norm(tb.name).includes(q));
    });
  }
  return list;
}

/* Câmpul de căutare NU se redesenează la tastare (altfel sare tastatura pe telefon):
   se reface doar lista de mai jos. */
function renderGuests() {
  view.innerHTML =
      '<div class="search">'
    + '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'
    + '<input id="q" type="search" placeholder="Caută nume, telefon, masă…" value="' + esc(guestQuery) + '" autocomplete="off">'
    + '</div>'
    + '<div class="filters" id="fbar"></div>'
    + '<div class="section-title" id="ghead"></div>'
    + '<div id="glistWrap"></div>';

  $('#q').addEventListener('input', (e) => {
    guestQuery = e.target.value;
    paintGuestList();
  });

  paintGuestList();
}

function paintGuestList() {
  const t = totals();
  const list = filteredGuests();

  $('#fbar').innerHTML =
      filterBtn('all', 'Toți (' + t.total + ')')
    + filterBtn('unpaid', 'Neachitat (' + t.unpaid + ')')
    + filterBtn('paid', 'Achitat (' + t.paid + ')')
    + filterBtn('notable', 'Fără masă (' + t.noTable + ')');

  $('#ghead').innerHTML =
      '<h2>' + list.length + ' ' + (list.length === 1 ? 'invitat' : 'invitați') + '</h2>'
    + '<button class="link-btn" data-quick="addMany">+ Listă</button>';

  let html;
  if (!list.length) {
    html = S.guests.length
      ? emptyBox(IC.users, 'Niciun rezultat', 'Încearcă alt filtru sau alt text de căutare.')
      : emptyBox(IC.users, 'Încă niciun invitat', 'Apasă butonul auriu „+” din dreapta jos ca să adaugi primul invitat.');
  } else {
    html = '<div class="glist">' + sortGuests(list).map(guestRow).join('') + '</div>';
  }
  $('#glistWrap').innerHTML = html;
}

function filterBtn(id, label) {
  return '<button data-filter="' + id + '" class="' + (guestFilter === id ? 'on' : '') + '">' + label + '</button>';
}

/* ============================================================
   ECRAN: SETĂRI
   ============================================================ */

function renderSettings() {
  const t = totals();
  let html = '';

  html += '<div class="section-title"><h2>Evenimentul</h2></div>';
  html += '<div class="card" style="padding:6px 14px">'
        + srow('editEvent', IC.glass, esc(S.eventName || 'Fără nume'), 'Nume, dată și locație')
        + srow('editEvent', IC.cal, S.eventDate ? dateLabel(S.eventDate) : 'Data nu e setată',
               S.eventPlace ? esc(S.eventPlace) : 'Adaugă locația')
        + '</div>';

  html += '<div class="section-title"><h2>Mese</h2></div>';
  html += '<div class="card" style="padding:6px 14px">'
        + srow('addTable', IC.plus, 'Adaugă o masă', S.tables.length + ' mese, ' + t.cap + ' locuri în total')
        + srow('capAll', IC.table, 'Schimbă capacitatea tuturor', 'Setează același număr de locuri la toate mesele')
        + '</div>';

  html += '<div class="section-title"><h2>Copie de siguranță</h2></div>';
  html += '<div class="card" style="padding:6px 14px">'
        + srow('export', IC.down, 'Salvează o copie', 'Descarcă un fișier cu toți invitații')
        + srow('import', IC.up, 'Încarcă o copie', 'Restaurează dintr-un fișier salvat')
        + srow('shareText', IC.share, 'Trimite lista ca text', 'Pentru WhatsApp, e-mail, restaurant')
        + '</div>';

  html += '<div class="section-title"><h2>Periculos</h2></div>';
  html += '<div class="card" style="padding:6px 14px">'
        + srow('resetPaid', IC.money, 'Resetează plățile', 'Toți devin „neachitat”', true)
        + srow('wipe', IC.trash, 'Șterge tot', 'Invitați și mese — de la zero', true)
        + '</div>';

  html += '<p class="muted-note" style="margin:22px 4px 0">'
        + 'Toate datele stau <b>doar pe acest telefon</b> și funcționează fără internet. '
        + 'Fă-ți din când în când o copie de siguranță (butonul „Salvează o copie”), '
        + 'ca să nu pierzi lista dacă ștergi aplicația.<br><br>Gestiune Petrecere · v1.0</p>';

  view.innerHTML = html;
}

function srow(action, icon, title, sub, danger) {
  return '<button class="srow' + (danger ? ' danger' : '') + '" data-quick="' + action + '">'
       + '<span class="si">' + icon + '</span>'
       + '<span class="st"><b>' + title + '</b><span>' + sub + '</span></span>'
       + IC.chev + '</button>';
}

/* ============================================================
   FEREASTRA (SHEET)
   ============================================================ */

let sheetOpen = false;
let popGuard = false;

function openSheet(html) {
  $('#sheetBody').innerHTML = html;
  const wrap = $('#sheetWrap');
  const sheet = $('#sheet');
  sheet.classList.remove('closing');
  wrap.hidden = false;
  $('#sheetBody').scrollTop = 0;
  if (!sheetOpen) {
    sheetOpen = true;
    history.pushState({ sheet: true }, '');
  }
}

function closeSheet(fromPop) {
  if (!sheetOpen) return;
  const wrap = $('#sheetWrap');
  const sheet = $('#sheet');
  sheet.classList.add('closing');
  setTimeout(() => { wrap.hidden = true; sheet.classList.remove('closing'); }, 210);
  sheetOpen = false;
  if (!fromPop) { popGuard = true; history.back(); }
}

window.addEventListener('popstate', () => {
  if (popGuard) { popGuard = false; return; }
  if (sheetOpen) closeSheet(true);
});

/* ---------------- fereastră: invitat ---------------- */

function sheetGuest(guestId, presetTable) {
  const g = guestId ? guestById(guestId) : null;
  const cur = g ? g.tableId : (presetTable || '');

  let opts = '<option value="">— fără masă —</option>';
  S.tables.forEach(tb => {
    const n = guestsAt(tb.id).length;
    const cap = +tb.capacity || 0;
    const mine = g && g.tableId === tb.id;
    const free = cap - n;
    let tagText;
    if (mine) tagText = n + '/' + cap;
    else if (free > 0) tagText = free + ' libere';
    else tagText = 'PLIN';
    opts += '<option value="' + tb.id + '"' + (cur === tb.id ? ' selected' : '') + '>'
          + esc(tb.name) + ' — ' + tagText + '</option>';
  });

  let html = '';
  html += '<h3 class="sheet-title">' + (g ? 'Editează invitatul' : 'Invitat nou') + '</h3>';
  html += '<p class="sheet-sub">' + (g ? 'Modifică datele sau mută-l la altă masă.' : 'Numele e singurul câmp obligatoriu.') + '</p>';

  html += '<div class="field"><label>Nume și prenume</label>'
        + '<input id="f_name" type="text" placeholder="ex. Popescu Andrei" value="' + esc(g ? g.name : '') + '" autocomplete="off"></div>';

  html += '<div class="field"><label>Telefon (opțional)</label>'
        + '<input id="f_phone" type="tel" placeholder="07…" value="' + esc(g ? (g.phone || '') : '') + '" autocomplete="off"></div>';

  html += '<div class="field"><label>Masa</label><select id="f_table">' + opts + '</select></div>';

  html += '<div class="toggle-row">'
        + '<div><div class="t">A achitat</div><div class="d">Bifează când primești banii</div></div>'
        + '<button class="switch' + (g && g.paid ? ' on' : '') + '" id="f_paid" role="switch" aria-checked="'
        + (g && g.paid ? 'true' : 'false') + '"></button></div>';

  html += '<div class="field"><label>Observații (opțional)</label>'
        + '<textarea id="f_notes" placeholder="ex. vine cu soția, vegetarian, ajunge mai târziu">'
        + esc(g ? (g.notes || '') : '') + '</textarea></div>';

  html += '<div id="f_dup" hidden></div>';
  html += '<button class="btn" id="f_save">' + (g ? 'Salvează modificările' : 'Adaugă invitatul') + '</button>';

  if (g) {
    html += '<div class="btn-row">';
    html += g.phone
      ? '<a class="btn ghost sm" style="text-align:center;text-decoration:none;display:block" href="tel:'
        + esc(g.phone) + '">Sună</a>'
      : '<button class="btn ghost sm" disabled style="opacity:.45">Fără telefon</button>';
    html += '<button class="btn danger sm" id="f_del">Șterge</button>';
    html += '</div>';
  }

  openSheet(html);

  let paid = !!(g && g.paid);
  $('#f_paid').addEventListener('click', () => {
    paid = !paid;
    $('#f_paid').classList.toggle('on', paid);
    $('#f_paid').setAttribute('aria-checked', paid ? 'true' : 'false');
    buzz(10);
  });

  /* dupOk = utilizatorul a confirmat că vrea totuși un nume care există deja */
  function commit(dupOk) {
    const name = $('#f_name').value.trim();
    if (!name) { toast('Scrie numele invitatului'); $('#f_name').focus(); return; }

    if (!dupOk) {
      const dup = S.guests.find(x => (!g || x.id !== g.id) && norm(x.name) === norm(name));
      if (dup) { showDupWarn(dup); return; }
    }

    const tid = $('#f_table').value || null;
    const data = {
      name,
      phone: $('#f_phone').value.trim(),
      tableId: tid,
      paid,
      notes: $('#f_notes').value.trim()
    };
    if (g) {
      Object.assign(g, data);
    } else {
      S.guests.push(Object.assign({ id: uid(), createdAt: Date.now() }, data));
    }
    save();
    warnIfOver(tid);
    closeSheet();
    render();
    buzz(14);
    toast(g ? 'Salvat' : 'Invitat adăugat');
  }

  /* avertisment în interiorul ferestrei — nu pierzi ce ai scris */
  function showDupWarn(dup) {
    const tb = dup.tableId ? tableById(dup.tableId) : null;
    const box = $('#f_dup');
    box.hidden = false;
    box.innerHTML = '<div class="warn-box">'
      + '<b>„' + esc(dup.name) + '” este deja în listă</b>'
      + '<p>' + (tb ? 'Stă la ' + esc(tb.name) : 'Nu are masă') + ' · '
      + (dup.paid ? 'a achitat' : 'nu a achitat') + '.</p>'
      + '<div class="btn-row" style="margin-top:12px">'
      + '<button class="btn ghost sm" id="dup_no">Renunț</button>'
      + '<button class="btn sm" id="dup_yes">Adaugă oricum</button>'
      + '</div></div>';
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    buzz(20);
    $('#dup_yes').addEventListener('click', () => commit(true));
    $('#dup_no').addEventListener('click', () => { box.hidden = true; box.innerHTML = ''; });
  }

  $('#f_save').addEventListener('click', () => commit(false));

  if (g) {
    $('#f_del').addEventListener('click', () => {
      confirmSheet('Ștergi invitatul?', esc(g.name) + ' va fi șters din listă.', 'Șterge', () => {
        const before = snapshot();
        S.guests = S.guests.filter(x => x.id !== g.id);
        save(); closeSheet(); render();
        toast(g.name + ' — șters', before);
      });
    });
  }

  if (!g) setTimeout(() => { const n = $('#f_name'); if (n) n.focus(); }, 260);
}

function warnIfOver(tid) {
  if (!tid) return;
  const tb = tableById(tid);
  if (!tb) return;
  const n = guestsAt(tid).length;
  if (n > (+tb.capacity || 0)) {
    toast(tb.name + ': ' + n + ' persoane la ' + tb.capacity + ' locuri!');
  }
}

/* ---------------- fereastră: adaugă mai mulți ---------------- */

function sheetAddMany(presetTable) {
  let opts = '<option value="">— fără masă —</option>';
  S.tables.forEach(tb => {
    const free = (+tb.capacity || 0) - guestsAt(tb.id).length;
    opts += '<option value="' + tb.id + '"' + (presetTable === tb.id ? ' selected' : '') + '>'
          + esc(tb.name) + ' — ' + (free > 0 ? free + ' libere' : 'PLIN') + '</option>';
  });

  let html = '';
  html += '<h3 class="sheet-title">Adaugă o listă de invitați</h3>';
  html += '<p class="sheet-sub">Scrie câte un nume pe fiecare rând. Toți vor fi puși la masa aleasă.</p>';
  html += '<div class="field"><label>Nume (unul pe rând)</label>'
        + '<textarea id="m_names" style="min-height:180px" placeholder="Popescu Andrei&#10;Ionescu Maria&#10;Georgescu Dan"></textarea></div>';
  html += '<div class="field"><label>Masa pentru toți</label><select id="m_table">' + opts + '</select></div>';
  html += '<div id="m_dup" hidden></div>';
  html += '<button class="btn" id="m_save">Adaugă invitații</button>';

  openSheet(html);

  function readLines() {
    return $('#m_names').value.split('\n').map(s => s.trim()).filter(Boolean);
  }

  /* împarte numele scrise în: noi, deja existenți în listă, repetate în text */
  function triage(lines) {
    const existing = new Set(S.guests.map(x => norm(x.name)));
    const seen = new Set();
    const fresh = [], already = [], repeated = [];
    lines.forEach(n => {
      const k = norm(n);
      if (seen.has(k)) { repeated.push(n); return; }
      seen.add(k);
      if (existing.has(k)) already.push(n);
      else fresh.push(n);
    });
    return { fresh, already, repeated };
  }

  function add(names) {
    const tid = $('#m_table').value || null;
    names.forEach(name => {
      S.guests.push({ id: uid(), createdAt: Date.now(), name, phone: '', tableId: tid, paid: false, notes: '' });
    });
    save();
    warnIfOver(tid);
    closeSheet();
    render();
    buzz(18);
    toast(names.length + (names.length === 1 ? ' invitat adăugat' : ' invitați adăugați'));
  }

  $('#m_save').addEventListener('click', () => {
    const lines = readLines();
    if (!lines.length) { toast('Scrie cel puțin un nume'); return; }

    const { fresh, already, repeated } = triage(lines);
    const problems = already.concat(repeated);
    if (!problems.length) { add(lines); return; }

    const box = $('#m_dup');
    box.hidden = false;
    box.innerHTML = '<div class="warn-box">'
      + '<b>' + problems.length + (problems.length === 1 ? ' nume se repetă' : ' nume se repetă') + '</b>'
      + (already.length
          ? '<p><b style="color:var(--muted);display:inline">Sunt deja în lista de invitați:</b> '
            + already.map(esc).join(', ') + '</p>'
          : '')
      + (repeated.length
          ? '<p><b style="color:var(--muted);display:inline">Scrise de mai multe ori mai sus:</b> '
            + repeated.map(esc).join(', ') + '</p>'
          : '')
      + '<div class="btn-row" style="margin-top:12px">'
      + '<button class="btn ghost sm" id="m_all">Adaugă tot (' + lines.length + ')</button>'
      + (fresh.length
          ? '<button class="btn sm" id="m_new">Doar cele noi (' + fresh.length + ')</button>'
          : '<button class="btn ghost sm" id="m_no">Renunț</button>')
      + '</div></div>';
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    buzz(20);

    $('#m_all').addEventListener('click', () => add(readLines()));
    if (fresh.length) $('#m_new').addEventListener('click', () => add(fresh));
    else $('#m_no').addEventListener('click', () => { box.hidden = true; box.innerHTML = ''; });
  });

  setTimeout(() => { const n = $('#m_names'); if (n) n.focus(); }, 260);
}

/* ---------------- fereastră: detaliu masă ---------------- */

function sheetTable(tid) {
  const tb = tableById(tid);
  if (!tb) return;
  const list = sortGuests(guestsAt(tid));
  const cap = +tb.capacity || 0;
  const free = cap - list.length;
  const paid = list.filter(g => g.paid).length;

  let html = '';
  html += '<h3 class="sheet-title">' + esc(tb.name) + '</h3>';
  html += '<p class="sheet-sub">' + list.length + ' din ' + cap + ' locuri ocupate · '
        + paid + ' au achitat' + (free < 0 ? ' · <b style="color:var(--bad)">' + (-free) + ' peste capacitate</b>' : '')
        + '</p>';

  // harta locurilor
  html += '<div class="seatmap">';
  const slots = Math.max(cap, list.length);
  for (let i = 0; i < slots; i++) {
    const g = list[i];
    if (g) {
      html += '<div class="seat taken' + (g.paid ? ' paid' : '') + '" data-guest="' + g.id + '">'
            + '<span class="sn">' + esc(initials(g.name)) + '</span></div>';
    } else {
      html += '<div class="seat">' + (i + 1) + '</div>';
    }
  }
  html += '</div>';

  html += '<div class="section-title" style="margin:20px 0 10px"><h2>Cine stă aici</h2></div>';
  if (!list.length) {
    html += '<p class="muted-note" style="text-align:center;padding:14px 0">Masa e goală.</p>';
  } else {
    html += '<div class="glist">';
    list.forEach(g => { html += guestRow(g); });
    html += '</div>';
  }

  html += '<button class="btn" id="t_add" style="margin-top:16px">Adaugă invitat la ' + esc(tb.name) + '</button>';
  html += '<div class="btn-row">'
        + '<button class="btn ghost sm" id="t_many">Adaugă o listă</button>'
        + '<button class="btn ghost sm" id="t_edit">Modifică masa</button>'
        + '</div>';

  openSheet(html);

  $('#t_add').addEventListener('click', () => sheetGuest(null, tid));
  $('#t_many').addEventListener('click', () => sheetAddMany(tid));
  $('#t_edit').addEventListener('click', () => sheetEditTable(tid));
}

/* ---------------- fereastră: editează masă ---------------- */

function sheetEditTable(tid) {
  const tb = tid ? tableById(tid) : null;
  const occupied = tb ? guestsAt(tb.id).length : 0;
  let cap = tb ? (+tb.capacity || DEFAULT_CAP) : DEFAULT_CAP;

  let html = '';
  html += '<h3 class="sheet-title">' + (tb ? 'Modifică masa' : 'Masă nouă') + '</h3>';
  html += '<p class="sheet-sub">' + (tb ? 'Schimbă numele sau numărul de locuri.' : 'Dă-i un nume și numărul de locuri.') + '</p>';

  html += '<div class="field"><label>Numele mesei</label>'
        + '<input id="t_name" type="text" placeholder="ex. Masa 1 / Masa Contabilitate" value="'
        + esc(tb ? tb.name : 'Masa ' + (S.tables.length + 1)) + '" autocomplete="off"></div>';

  html += '<div class="field"><label>Număr de locuri</label>'
        + '<div class="stepper"><button id="t_minus">−</button>'
        + '<div class="val" id="t_cap">' + cap + '</div>'
        + '<button id="t_plus">+</button></div>'
        + (tb && occupied ? '<div class="hint">Acum stau ' + occupied + ' persoane la această masă.</div>' : '')
        + '</div>';

  html += '<button class="btn" id="t_save">' + (tb ? 'Salvează' : 'Creează masa') + '</button>';
  if (tb) html += '<button class="btn danger sm" id="t_del" style="margin-top:10px">Șterge masa</button>';

  openSheet(html);

  const paint = () => {
    $('#t_cap').textContent = cap;
    $('#t_minus').disabled = cap <= 1;
  };
  paint();
  $('#t_minus').addEventListener('click', () => { if (cap > 1) { cap--; paint(); buzz(8); } });
  $('#t_plus').addEventListener('click', () => { if (cap < 60) { cap++; paint(); buzz(8); } });

  $('#t_save').addEventListener('click', () => {
    const name = $('#t_name').value.trim() || ('Masa ' + (S.tables.length + 1));
    if (tb) { tb.name = name; tb.capacity = cap; }
    else { S.tables.push({ id: uid(), name, capacity: cap }); }
    save(); closeSheet(); render(); buzz(14);
    toast(tb ? 'Masă actualizată' : 'Masă adăugată');
  });

  if (tb) {
    $('#t_del').addEventListener('click', () => {
      confirmSheet('Ștergi ' + esc(tb.name) + '?',
        occupied ? 'Cei ' + occupied + ' invitați de la această masă rămân în listă, dar fără masă.'
                 : 'Masa este goală.',
        'Șterge masa', () => {
          const before = snapshot();
          S.guests.forEach(g => { if (g.tableId === tb.id) g.tableId = null; });
          S.tables = S.tables.filter(x => x.id !== tb.id);
          save(); closeSheet(); render();
          toast(tb.name + ' — ștearsă', before);
        });
    });
  }
}

/* ---------------- fereastră: eveniment ---------------- */

function sheetEvent() {
  let html = '';
  html += '<h3 class="sheet-title">Detalii eveniment</h3>';
  html += '<p class="sheet-sub">Apar în capul aplicației și în lista trimisă ca text.</p>';
  html += '<div class="field"><label>Nume</label><input id="e_name" type="text" value="' + esc(S.eventName) + '"></div>';
  html += '<div class="field"><label>Data</label><input id="e_date" type="date" value="' + esc(S.eventDate) + '"></div>';
  html += '<div class="field"><label>Locația</label><input id="e_place" type="text" placeholder="ex. Restaurant Belvedere" value="' + esc(S.eventPlace || '') + '"></div>';
  html += '<button class="btn" id="e_save">Salvează</button>';
  openSheet(html);

  $('#e_save').addEventListener('click', () => {
    S.eventName = $('#e_name').value.trim() || 'Petrecere';
    S.eventDate = $('#e_date').value;
    S.eventPlace = $('#e_place').value.trim();
    save(); paintHeader(); closeSheet(); render(); toast('Salvat');
  });
}

/* ---------------- fereastră: capacitate globală ---------------- */

function sheetCapAll() {
  let cap = DEFAULT_CAP;
  let html = '';
  html += '<h3 class="sheet-title">Capacitate pentru toate mesele</h3>';
  html += '<p class="sheet-sub">Setează același număr de locuri la toate cele ' + S.tables.length + ' mese.</p>';
  html += '<div class="field"><div class="stepper"><button id="c_minus">−</button>'
        + '<div class="val" id="c_val">' + cap + '</div><button id="c_plus">+</button></div></div>';
  html += '<button class="btn" id="c_save">Aplică la toate mesele</button>';
  openSheet(html);

  const paint = () => { $('#c_val').textContent = cap; $('#c_minus').disabled = cap <= 1; };
  paint();
  $('#c_minus').addEventListener('click', () => { if (cap > 1) { cap--; paint(); } });
  $('#c_plus').addEventListener('click', () => { if (cap < 60) { cap++; paint(); } });
  $('#c_save').addEventListener('click', () => {
    S.tables.forEach(t => { t.capacity = cap; });
    save(); closeSheet(); render(); toast('Toate mesele au ' + cap + ' locuri');
  });
}

/* ---------------- fereastră: confirmare ---------------- */

function confirmSheet(title, text, okLabel, onOk) {
  let html = '';
  html += '<h3 class="sheet-title">' + title + '</h3>';
  html += '<p class="sheet-sub">' + text + '</p>';
  html += '<button class="btn danger" id="cf_ok">' + okLabel + '</button>';
  html += '<button class="btn ghost" id="cf_no" style="margin-top:10px">Renunță</button>';
  openSheet(html);
  $('#cf_ok').addEventListener('click', onOk);
  $('#cf_no').addEventListener('click', () => closeSheet());
}

/* ============================================================
   COPIE DE SIGURANȚĂ
   ============================================================ */

function exportBackup() {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'petrecere-' + stamp + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Copie salvată în Descărcări');
}

function importBackup() {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'application/json,.json';
  inp.addEventListener('change', () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const d = JSON.parse(String(fr.result));
        if (!d || !Array.isArray(d.tables) || !Array.isArray(d.guests)) throw new Error('format');
        confirmSheet('Înlocuiești datele actuale?',
          'Fișierul are ' + d.guests.length + ' invitați și ' + d.tables.length
          + ' mese. Datele de acum vor fi înlocuite.',
          'Da, încarcă', () => {
            S = d; save(); paintHeader(); closeSheet(); render();
            toast('Date încărcate');
          });
      } catch (e) {
        toast('Fișier nevalid');
      }
    };
    fr.readAsText(f);
  });
  inp.click();
}

function summaryText() {
  const t = totals();
  let out = S.eventName;
  if (S.eventDate) out += ' — ' + dateLabel(S.eventDate);
  if (S.eventPlace) out += ' — ' + S.eventPlace;
  out += '\n\n' + t.total + ' invitați · ' + t.paid + ' au achitat · '
       + t.unpaid + ' de încasat · ' + t.free + ' locuri libere\n';

  S.tables.forEach(tb => {
    const list = sortGuests(guestsAt(tb.id));
    out += '\n' + tb.name + ' (' + list.length + '/' + tb.capacity + ')\n';
    if (!list.length) out += '  —\n';
    list.forEach((g, i) => {
      out += '  ' + (i + 1) + '. ' + g.name + (g.paid ? ' ✔' : ' (neachitat)')
           + (g.notes ? ' — ' + g.notes : '') + '\n';
    });
  });

  const na = sortGuests(unassigned());
  if (na.length) {
    out += '\nFără masă (' + na.length + ')\n';
    na.forEach((g, i) => { out += '  ' + (i + 1) + '. ' + g.name + (g.paid ? ' ✔' : ' (neachitat)') + '\n'; });
  }
  return out;
}

async function shareSummary() {
  const text = summaryText();
  try {
    if (navigator.share) { await navigator.share({ title: S.eventName, text }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  try {
    await navigator.clipboard.writeText(text);
    toast('Lista a fost copiată');
  } catch (e) {
    openSheet('<h3 class="sheet-title">Lista invitaților</h3>'
      + '<p class="sheet-sub">Ține apăsat pe text ca să îl copiezi.</p>'
      + '<textarea style="width:100%;min-height:340px;font-size:13px;background:rgba(255,255,255,.06);'
      + 'color:var(--text);border:1px solid var(--stroke);border-radius:13px;padding:12px" readonly>'
      + esc(text) + '</textarea>');
  }
}

/* ============================================================
   RUTARE / EVENIMENTE
   ============================================================ */

function shortDate(iso) {
  if (!iso) return '';
  const p = iso.split('-');
  if (p.length !== 3) return iso;
  const l = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','nov','dec'];
  return +p[2] + ' ' + (l[+p[1] - 1] || '') + ' ' + p[0];
}

function paintHeader() {
  $('#evName').textContent = S.eventName || 'Petrecere';
  const t = totals();
  const bits = [];
  if (S.eventDate) bits.push(shortDate(S.eventDate));
  bits.push(t.total + ' invitați');
  bits.push(t.free + ' locuri libere');
  $('#evMeta').textContent = bits.join(' · ');
}

function render() {
  paintHeader();
  if (tab === 'home') renderHome();
  else if (tab === 'tables') renderTables();
  else if (tab === 'guests') renderGuests();
  else renderSettings();
  document.querySelectorAll('.tab').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab));
}

function goTab(name) {
  if (tab === name) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  tab = name;
  window.scrollTo(0, 0);
  render();
}

const QUICK = {
  addGuest: () => sheetGuest(null),
  addMany: () => sheetAddMany(null),
  addTable: () => sheetEditTable(null),
  editEvent: () => sheetEvent(),
  capAll: () => sheetCapAll(),
  export: () => exportBackup(),
  import: () => importBackup(),
  shareText: () => shareSummary(),
  showUnpaid: () => { guestFilter = 'unpaid'; guestQuery = ''; goTab('guests'); },
  showNoTable: () => { guestFilter = 'notable'; guestQuery = ''; goTab('guests'); },
  resetPaid: () => confirmSheet('Resetezi plățile?', 'Toți invitații devin „neachitat”.', 'Resetează', () => {
    const before = snapshot();
    S.guests.forEach(g => { g.paid = false; });
    save(); closeSheet(); render();
    toast('Plăți resetate', before);
  }),
  wipe: () => confirmSheet('Ștergi absolut tot?',
    'Toți invitații și toate mesele dispar. Se revine la 10 mese de 10 locuri. Acțiunea nu poate fi anulată.',
    'Șterge tot', () => {
      const before = snapshot();
      S = freshState(); save(); paintHeader(); closeSheet(); render();
      toast('S-a șters tot', before, 12000);
    })
};

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tab');
  if (tabBtn) { goTab(tabBtn.dataset.tab); buzz(8); return; }

  const go = e.target.closest('[data-go]');
  if (go) { goTab(go.dataset.go); return; }

  const quick = e.target.closest('[data-quick]');
  if (quick) { const fn = QUICK[quick.dataset.quick]; if (fn) fn(); return; }

  const filter = e.target.closest('[data-filter]');
  if (filter) { guestFilter = filter.dataset.filter; paintGuestList(); buzz(8); return; }

  const pay = e.target.closest('[data-pay]');
  if (pay) {
    const g = guestById(pay.dataset.pay);
    if (g) {
      g.paid = !g.paid;
      save();
      const dot = pay.querySelector('.pay-dot');
      if (dot) dot.classList.toggle('on', g.paid);
      buzz(g.paid ? 16 : 8);
      toast(g.paid ? g.name + ' — achitat' : g.name + ' — neachitat');
      paintHeader();
      if (sheetOpen) return;
      if (tab === 'guests') paintGuestList();
      else render();
    }
    return;
  }

  const tbl = e.target.closest('[data-table]');
  if (tbl) { sheetTable(tbl.dataset.table); buzz(8); return; }

  const gst = e.target.closest('[data-guest]');
  if (gst) { sheetGuest(gst.dataset.guest); buzz(8); return; }
});

$('#fab').addEventListener('click', () => { sheetGuest(null); buzz(12); });
$('#btnQuickSearch').addEventListener('click', () => {
  guestFilter = 'all'; guestQuery = ''; goTab('guests');
  setTimeout(() => { const q = $('#q'); if (q) q.focus(); }, 120);
});
$('#sheetBackdrop').addEventListener('click', () => closeSheet());
$('#sheetWrap').addEventListener('click', (e) => { if (e.target.id === 'sheetWrap') closeSheet(); });

/* pornire */
if (!localStorage.getItem(KEY)) save();   // scrie starea inițială (10 mese × 10 locuri)
render();

/* service worker — funcționare offline */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
