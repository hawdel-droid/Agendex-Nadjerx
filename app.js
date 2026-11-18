
const KEY = 'agenda-hawdel-v1';
const DN = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DF = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
const MO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const KL = { aula: 'Aula', rotina: 'Rotina', treino: 'Treino', design: 'Design', estudo: 'Estudo', volei: 'Vôlei', outro: 'Outro' };

// Aulas fixas (d = dias da semana: 0 = Dom, 1 = Seg ... 6 = Sáb)
const FIXED = [
  { id: 'a1', t: 'Bioestatística', s: '08:00', e: '10:00', d: [1] },
  { id: 'a2', t: 'Bem-Estar Animal', s: '10:00', e: '12:00', d: [1] },
  { id: 'a3', t: 'Bioquímica Básica', s: '13:30', e: '15:30', d: [1, 3] },
  { id: 'a4', t: 'Zootecnia Geral', s: '15:30', e: '17:30', d: [1] },
  { id: 'a5', t: 'Forragem e Pastagens Nativas', s: '08:00', e: '10:00', d: [2, 3] },
  { id: 'a6', t: 'Biologia Celular e Molecular', s: '10:00', e: '12:00', d: [2] },
  { id: 'a7', t: 'Histologia e Embriologia Veterinária I', s: '08:00', e: '10:00', d: [4, 5] },
  { id: 'a8', t: 'Zootecnia Geral', s: '10:00', e: '12:00', d: [4] }
];

// Rotina inicial (editável pelo app)
const SEED = [
  { id: 'u1', t: 'Ler a Bíblia e lição', s: '06:30', e: '07:00', k: 'rotina', d: [3] },
  { id: 'u2', t: 'Almoço', s: '12:00', e: '12:33', k: 'rotina', d: [3] },
  { id: 'u3', t: 'Conteúdo CEAD e AM Autocenter', s: '17:00', e: '18:30', k: 'design', d: [3] },
  { id: 'u4', t: 'Academia', s: '19:30', e: '20:30', k: 'treino', d: [3] },
  { id: 'u5', t: 'Revisar/estudar e organizar o dia seguinte', s: '21:00', e: '22:00', k: 'estudo', d: [3] },
  { id: 'u6', t: 'Jiu-jitsu', s: '18:30', e: '19:30', k: 'treino', d: [1] },
  { id: 'u7', t: 'Correr', s: '05:00', e: '06:00', k: 'treino', d: [5] }
];

// Helpers
const $ = s => document.querySelector(s);
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mm = s => { const a = s.split(':'); return +a[0] * 60 + +a[1]; };
const hm = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
const dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dur = n => n >= 60 ? Math.floor(n / 60) + 'h' + (n % 60 ? String(n % 60).padStart(2, '0') : '') : n + 'min';

// Estado salvo no aparelho
let S = { items: SEED, done: {} };
try {
  const r = localStorage.getItem(KEY);
  if (r) {
    const p = JSON.parse(r);
    if (p && Array.isArray(p.items)) S = p;
  }
} catch (e) {}

const save = () => {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
};

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayIdx = (today.getDay() + 6) % 7; // posição na semana começando na segunda
let off = 0;        // deslocamento de semanas
let sel = todayIdx; // dia selecionado na faixa
let editId = null;

function weekDays() {
  const d0 = new Date(today);
  d0.setDate(d0.getDate() - todayIdx + off * 7);
  return [0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = new Date(d0);
    d.setDate(d0.getDate() + i);
    return d;
  });
}

function itemsFor(d) {
  const k = dk(d), w = d.getDay();
  return FIXED.map(x => ({ ...x, k: 'aula', lock: 1 }))
    .concat(S.items)
    .filter(x => x.date ? x.date === k : (x.d || []).includes(w))
    .sort((a, b) => mm(a.s) - mm(b.s));
}

const gap = (a, b) => `<div class="gap">Livre das ${hm(a)} às ${hm(b)} (${dur(b - a)})</div>`;

function render() {
  const wd = weekDays(), d = wd[sel], key = dk(d), list = itemsFor(d);
  const isToday = key === dk(today);
  const now = new Date(), nm = now.getHours() * 60 + now.getMinutes();

  $('#ti').textContent = DF[d.getDay()];
  $('#strip').innerHTML = wd.map((x, i) =>
    `<button class="day${i === sel ? ' on' : ''}${dk(x) === dk(today) ? ' td' : ''}" data-i="${i}" aria-label="${DF[x.getDay()]}, ${x.getDate()}"><b>${DN[x.getDay()]}</b><span>${x.getDate()}</span></button>`
  ).join('');
  $('#hj').hidden = (off === 0 && sel === todayIdx);

  let cur = 360, h = '', total = list.length, done = 0;
  for (const it of list) {
    const s = mm(it.s), e = mm(it.e), dn = !!S.done[key + '|' + it.id];
    if (dn) done++;
    if (s - cur >= 45) h += gap(cur, s);
    cur = Math.max(cur, e);
    const on = isToday && nm >= s && nm < e;
    h += `<div class="row k-${it.k}${dn ? ' dn' : ''}${on ? ' now' : ''}">
      <button class="ck" data-id="${it.id}" aria-pressed="${dn}" aria-label="Marcar como feito"></button>
      <div class="tm">${it.s}<br>${it.e}</div>
      <div><div class="tt">${esc(it.t)}</div><div class="mt">${KL[it.k]}${it.date ? ', só neste dia' : ''}</div></div>
      <div>${on ? '<span class="bg">agora</span>' : ''}${it.lock ? '' : `<button class="ed" data-ed="${it.id}">Editar</button>`}</div>
    </div>`;
  }
  if (1320 - cur >= 45) h += gap(cur, 1320);

  $('#list').innerHTML = h;
  $('#su').textContent = d.getDate() + ' de ' + MO[d.getMonth()] + (total ? ', ' + done + ' de ' + total + ' feitos' : ', dia livre');
  $('#pg').style.width = (total ? done / total * 100 : 0) + '%';
}

// Navegação
$('#strip').onclick = e => {
  const b = e.target.closest('.day');
  if (b) { sel = +b.dataset.i; render(); }
};

// As setas andam um dia de cada vez e viram a semana sozinhas
function shiftDay(n) {
  sel += n;
  if (sel > 6) { sel = 0; off++; }
  if (sel < 0) { sel = 6; off--; }
  render();
}
$('#pv').onclick = () => shiftDay(-1);
$('#nx').onclick = () => shiftDay(1);

$('#hj').onclick = () => { off = 0; sel = todayIdx; render(); };

// Marcar como feito / editar
$('#list').onclick = e => {
  const c = e.target.closest('.ck');
  if (c) {
    const k = dk(weekDays()[sel]) + '|' + c.dataset.id;
    if (S.done[k]) delete S.done[k]; else S.done[k] = 1;
    save();
    render();
    return;
  }
  const ed = e.target.closest('.ed');
  if (ed) openDlg(ed.dataset.ed);
};

// Janela de novo compromisso
const order = [1, 2, 3, 4, 5, 6, 0];
$('#fd').innerHTML = order.map(n => `<label><input type="checkbox" value="${n}"> ${DN[n]}</label>`).join('');
$('#fr').onchange = () => { $('#fd').hidden = !$('#fr').checked; };

function openDlg(id) {
  editId = id || null;
  const it = id ? S.items.find(x => x.id === id) : null;
  $('#dt').textContent = it ? 'Editar compromisso' : 'Novo compromisso';
  $('#ft').value = it ? it.t : '';
  $('#fk').value = it ? it.k : 'estudo';
  $('#fs').value = it ? it.s : '10:00';
  $('#fe').value = it ? it.e : '11:00';
  const rep = !!(it && it.d);
  $('#fr').checked = rep;
  $('#fd').hidden = !rep;
  document.querySelectorAll('#fd input').forEach(i => { i.checked = rep && it.d.includes(+i.value); });
  $('#er').textContent = '';
  $('#del').hidden = !it;
  $('#dlg').showModal();
}

$('#add').onclick = () => openDlg();
$('#cx').onclick = () => $('#dlg').close();
git status
$('#del').onclick = () => {
  S.items = S.items.filter(x => x.id !== editId);
  save();
  $('#dlg').close();
  render();
};

$('#sv').onclick = () => {
  const t = $('#ft').value.trim(), s = $('#fs').value, e = $('#fe').value, k = $('#fk').value, rep = $('#fr').checked;
  const ds = [...document.querySelectorAll('#fd input:checked')].map(x => +x.value);
  const er = m => { $('#er').textContent = m; };

  if (!t || !s || !e) return er('Preencha o nome, o início e o fim.');
  if (mm(e) <= mm(s)) return er('O fim precisa ser depois do início.');
  if (rep && !ds.length) return er('Escolha ao menos um dia da semana.');

  const old = editId ? S.items.find(x => x.id === editId) : null;
  const o = { id: editId || 'u' + Date.now(), t, s, e, k };
  if (rep) o.d = ds; else o.date = (old && old.date) || dk(weekDays()[sel]);

  if (old) S.items[S.items.indexOf(old)] = o; else S.items.push(o);
  save();
  $('#dlg').close();
  render();
};

render();
setInterval(() => { if (!$('#dlg').open) render(); }, 60000);