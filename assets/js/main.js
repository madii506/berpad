const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1800) };

/* ---------- intro ---------- */
let entered = false;
function enter() {
  if (entered) return; entered = true;
  document.body.classList.add('entered'); document.body.classList.remove('locked');
  $('#black').classList.add('off');
}
function scrambleTo(el, html, ms = 1100) {
  const text = el.textContent, glyphs = '█▓▒░#%&@$*+=<>/\\';
  const t0 = performance.now();
  const tick = n => { const k = Math.min(1, (n - t0) / ms); const keep = Math.floor(text.length * k);
    el.textContent = text.slice(0, keep) + Array.from({ length: text.length - keep }, () => glyphs[Math.random() * glyphs.length | 0]).join('');
    if (k < 1) requestAnimationFrame(tick); else el.innerHTML = html };
  requestAnimationFrame(tick);
}
addEventListener('ber:ready', () => {
  setTimeout(() => $('#black').classList.add('off'), 500);
  setTimeout(() => $('#skip').classList.add('show'), 2600);
});
addEventListener('ber:intro', () => {
  if (entered) return;
  $('#title').classList.add('show'); scrambleTo($('#tt'), '<b>ber</b>pad');
  setTimeout(() => $('#enter').classList.add('show'), 1300);
});
$('#skip').addEventListener('click', () => { window.berSkip && window.berSkip(); enter() });
$('#enter').addEventListener('click', enter);
addEventListener('keydown', e => { if (!entered && (e.key === 'Enter' || e.key === 'Escape')) { window.berSkip && window.berSkip(); enter() } });
setTimeout(() => { if (!window.berSkip) enter() }, 12000);   // no WebGL: open the site anyway

/* ---------- cursor, veil, magnetic ---------- */
const ring = $('#ring');
addEventListener('pointermove', e => {
  ring.style.left = e.clientX + 'px'; ring.style.top = e.clientY + 'px';
  const v = $('#veil'), r = v.getBoundingClientRect(); v.style.setProperty('--mx', (e.clientX - r.left) + 'px'); v.style.setProperty('--my', (e.clientY - r.top) + 'px');
  const hot = e.target.closest && e.target.closest('a,button,input,label'); ring.style.width = ring.style.height = hot ? '44px' : '28px'; ring.style.borderColor = hot ? 'rgba(255,59,47,.9)' : 'rgba(255,138,74,.6)';
}, { passive: true });
$$('.mag').forEach(b => {
  b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px,${(e.clientY - r.top - r.height / 2) * .25}px)` });
  b.addEventListener('pointerleave', () => b.style.transform = '');
});
document.addEventListener('pointermove', e => {
  const c = e.target.closest && e.target.closest('.tilt'); $$('.tilt').forEach(el => { if (el !== c) el.style.transform = '' }); if (!c) return;
  const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  c.style.transform = `perspective(900px) rotateY(${(x - .5) * 7}deg) rotateX(${(.5 - y) * 7}deg)`; c.style.setProperty('--gx', x * 100 + '%'); c.style.setProperty('--gy', y * 100 + '%');
}, { passive: true });
addEventListener('ber:spark', () => toast('The ber bit back.'));

/* ---------- nav highlight, rail, band, pause ---------- */
const secs = ['why', 'rule', 'how', 'menu', 'launch', 'faq'].map(id => document.getElementById(id));
function nav() {
  let cur = ''; for (const s of secs) if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id;
  const links = $$('#pill a'); let on = null; links.forEach(a => { const m = a.getAttribute('href') === '#' + cur; a.classList.toggle('on', m); if (m) on = a });
  const hl = $('#hl'); if (on) { hl.style.opacity = 1; hl.style.left = on.offsetLeft + 'px'; hl.style.width = on.offsetWidth + 'px' } else hl.style.opacity = 0;
  $$('#rail a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + cur));
  window.__berPause = scrollY > innerHeight * 1.3;
}
let bx = 0, lastY = scrollY, vel = 0;
function band() { const dy = scrollY - lastY; lastY = scrollY; vel = vel * .9 + dy * .1; bx -= .6 + Math.abs(vel) * .6; const bt = $('#bt'); const w = bt.scrollWidth / 2; if (-bx > w) bx += w; bt.style.transform = `translateX(${bx}px)`; requestAnimationFrame(band) }
requestAnimationFrame(band);
addEventListener('scroll', nav, { passive: true }); addEventListener('resize', nav); nav();

/* ---------- reveal, decrypt, redactions, fuse ---------- */
function decrypt(el) {
  const nodes = []; const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while (n = w.nextNode()) nodes.push([n, n.textContent]);
  const t0 = performance.now(), glyphs = '█▓▒░#%&$*';
  const tick = now => { const k = Math.min(1, (now - t0) / 900); for (const [node, txt] of nodes) { const keep = Math.floor(txt.length * k); node.textContent = txt.slice(0, keep) + txt.slice(keep).replace(/\S/g, () => glyphs[Math.random() * glyphs.length | 0]) } if (k < 1) requestAnimationFrame(tick) };
  requestAnimationFrame(tick);
}
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return; const el = e.target; el.classList.add('shown'); io.unobserve(el);
  if (el.classList.contains('dec')) decrypt(el);
  if (el.classList.contains('why')) el.querySelectorAll('.rd').forEach((r, i) => setTimeout(() => r.classList.add('open'), 500 + i * 450));
}), { threshold: .2 });
$$('.rv').forEach(el => io.observe(el));
const so = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; const st = e.target; st.classList.add('lit'); [...st.querySelectorAll('.step')].forEach((s, i) => setTimeout(() => s.classList.add('lit'), 300 + i * 600)); so.unobserve(st) }), { threshold: .35 });
so.observe($('#steps'));

/* ---------- the rule preview ---------- */
const cv = $('#simc'), cx = cv.getContext('2d'); let SEED = 7;
function rnd() { SEED = (SEED * 16807) % 2147483647; return SEED / 2147483647 }
let CH = [];
function gen() {
  CH = []; let p = 1;
  for (let i = 0; i < 64; i++) {
    const crash = rnd() < .09 ? -(.12 + rnd() * .2) : 0;
    const r = (rnd() - .53) * .09 + crash + (i > 40 && rnd() < .15 ? .08 : 0);
    const o = p, c = Math.max(.05, p * (1 + r)); const hi = Math.max(o, c) * (1 + rnd() * .04), lo = Math.min(o, c) * (1 - rnd() * .04);
    CH.push({ o, c, hi, lo }); p = c;
  }
}
let anim = 0, animT = 0;
function sim() {
  const trig = +$('#sTrig').value / 100, bite = +$('#sBite').value / 100; let pot = +$('#sPot').value;
  $('#vTrig').textContent = Math.round(trig * 100) + '%'; $('#vBite').textContent = Math.round(bite * 100) + '%'; $('#vPot').textContent = pot + ' SOL';
  const fill = .25; let hi = CH[0].hi, cool = 0, spent = 0, n = 0, deep = 0; const marks = [];
  CH.forEach((k, i) => { pot += fill; hi = Math.max(hi * .995, k.hi); cool--; const dd = k.c / hi - 1;
    if (dd <= -trig && cool <= 0 && pot > .1) { const s = pot * bite; pot -= s; spent += s; n++; deep = Math.min(deep, dd); marks.push({ i, s, dd }); cool = 4; hi = k.c } });
  $('#oBites').textContent = n; $('#oSpent').textContent = spent.toFixed(1); $('#oLeft').textContent = pot.toFixed(1); $('#oDeep').textContent = n ? Math.round(deep * 100) + '%' : '—';
  return marks;
}
function draw(marks, prog) {
  const W = cv.clientWidth, H = cv.clientHeight, d = Math.min(2, devicePixelRatio || 1); if (cv.width !== W * d) { cv.width = W * d; cv.height = H * d } cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, W, H);
  const pad = 26, mn = Math.min(...CH.map(k => k.lo)), mx = Math.max(...CH.map(k => k.hi)); const y = v => pad + (1 - (Math.log(v) - Math.log(mn)) / (Math.log(mx) - Math.log(mn))) * (H - pad * 2 - 20);
  cx.strokeStyle = 'rgba(255,59,47,.06)'; for (let g = 0; g < 6; g++) { const gy = pad + g * (H - pad * 2) / 5; cx.beginPath(); cx.moveTo(0, gy); cx.lineTo(W, gy); cx.stroke() }
  const bw = (W - 40) / CH.length, show = Math.floor(CH.length * prog);
  CH.slice(0, show).forEach((k, i) => {
    const x = 20 + i * bw + bw / 2, up = k.c >= k.o, col = up ? '#4ade80' : '#ff3b2f';
    cx.strokeStyle = col; cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(x, y(k.hi)); cx.lineTo(x, y(k.lo)); cx.stroke();
    const top = y(Math.max(k.o, k.c)), bot = y(Math.min(k.o, k.c)), w = Math.max(3, bw * .62), h = Math.max(2, bot - top);
    const m = marks.find(q => q.i === i); cx.fillStyle = col;
    if (m) { // a bite out of the candle
      cx.beginPath(); cx.moveTo(x - w / 2, top + h); cx.lineTo(x - w / 2, top); const r = w / 4; cx.arc(x - w / 4, top, r, Math.PI, 0, true); cx.arc(x + w / 4, top, r, Math.PI, 0, true); cx.lineTo(x + w / 2, top + h); cx.closePath(); cx.fill();
      cx.fillStyle = '#4ade80'; cx.shadowColor = '#4ade80'; cx.shadowBlur = 12; cx.beginPath(); cx.arc(x, y(k.lo) + 12, 4, 0, Math.PI * 2); cx.fill(); cx.shadowBlur = 0;
      cx.fillStyle = 'rgba(235,229,218,.85)'; cx.font = '600 10px JetBrains Mono'; cx.textAlign = 'center'; cx.fillText('−' + m.s.toFixed(1), x, y(k.lo) + 30);
    } else cx.fillRect(x - w / 2, top, w, h);
  });
}
let marks = [];
function rerun(reset) { if (reset) { SEED = (Math.random() * 1e9 | 0) + 1; gen() } marks = sim(); animT = performance.now() }
function loop(n) { const prog = Math.min(1, (n - animT) / 1600); draw(marks, prog); requestAnimationFrame(loop) }
['sTrig', 'sBite', 'sPot'].forEach(id => $('#' + id).addEventListener('input', () => { marks = sim() }));
$('#reroll').addEventListener('click', () => rerun(true));
gen(); rerun(false); requestAnimationFrame(loop);
new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) animT = performance.now() }), { threshold: .4 }).observe(cv);

/* ---------- the menu: live PumpSwap pools ---------- */
const GT = 'https://api.geckoterminal.com/api/v2/networks/solana/dexes/pumpswap/pools';
let POOLS = [], MK = 'h1';
const genImg = s => { const t = String(s || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?'; return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2a0c0c"/><text x="32" y="41" text-anchor="middle" font-family="Arial" font-weight="700" font-size="24" fill="#ff8a4a">${t}</text></svg>`) };
async function gt(page, inc) {
  const r = await fetch(`${GT}?page=${page}&sort=h24_volume_usd_desc${inc ? '&include=base_token' : ''}`, { cache: 'no-store' }); if (!r.ok) throw new Error(r.status); return r.json();
}
async function loadMenu() {
  try {
    let js; try { js = await Promise.all([1, 2, 3].map(p => gt(p, true))) } catch (e) { js = await Promise.all([1, 2].map(p => gt(p, false))) }
    const toks = {}; js.forEach(j => (j.included || []).forEach(t => toks[t.id] = t.attributes));
    const BAD = /fuck|shit|cunt|n[i1]gg|fag|retard|porn|nazi|hitler|pedo|rape/i;
    POOLS = js.flatMap(j => j.data || []).map(p => { const a = p.attributes, tid = p.relationships?.base_token?.data?.id, t = toks[tid] || {};
      return { pool: a.address, name: a.name, sym: t.symbol || (a.name || '').split(' / ')[0], tname: t.name || '', mint: t.address || (tid || '').replace('solana_', ''), img: t.image_url && !/missing/.test(t.image_url) ? t.image_url : '', ch: a.price_change_percentage || {}, vol: +(a.volume_usd?.h24 || 0), fdv: +(a.fdv_usd || 0), quote: (a.name || '').split(' / ')[1] || '' } })
      .filter(p => p.quote === 'SOL' && !BAD.test(p.sym + ' ' + p.tname));
    renderMenu(); $('#mSrc').textContent = `GeckoTerminal · PumpSwap pools on Solana · ${POOLS.length} read · ${new Date().toLocaleTimeString()}`;
  } catch (e) { if (!POOLS.length) $('#mRows').innerHTML = '<div class="empty">GeckoTerminal isn\'t answering right now. Try again in a minute.</div>' }
}
const usd = v => v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(1) + 'K' : '$' + Math.round(v);
function renderMenu() {
  const L = POOLS.map(p => ({ ...p, c: parseFloat(p.ch[MK]) })).filter(p => isFinite(p.c) && p.c < 0 && p.vol > 5000).sort((a, b) => a.c - b.c).slice(0, 14);
  if (!L.length) { $('#mRows').innerHTML = '<div class="empty">Nothing bleeding on this window. The ber is waiting.</div>'; return }
  const worst = Math.min(...L.map(p => p.c));
  $('#mRows').innerHTML = L.map(p => `<a class="row" href="https://dexscreener.com/solana/${encodeURIComponent(p.pool)}" target="_blank" rel="noopener">
    <img src="${esc(p.img || genImg(p.sym))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${genImg(p.sym)}'">
    <span class="nm"><b>$${esc(p.sym.slice(0, 14))}</b><small>${esc(p.tname.slice(0, 26))}</small></span>
    <span class="dn">${p.c.toFixed(1)}%</span><span>${usd(p.vol)}</span>
    <span class="c5"><span class="meter"><i style="width:${Math.max(6, p.c / worst * 100)}%"></i></span></span>
    <span class="c6" style="text-align:right;color:var(--dim);font-size:11.5px">chart ↗</span></a>`).join('');
}
$('#mSort').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; MK = b.dataset.k; $$('#mSort button').forEach(x => x.classList.toggle('on', x === b)); renderMenu() });
loadMenu(); setInterval(() => { if (!document.hidden) loadMenu() }, 90000);

/* ---------- launch rule card ---------- */
const R = { trig: 25, share: 50, bite: 30, hib: 24 };
$$('.chips').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); R[g.dataset.f] = +b.dataset.v; card() }));
function card() {
  const n = $('#lName').value.trim(), t = $('#lTk').value.trim().replace(/^\$/, '').toUpperCase();
  $('#rName').textContent = n || 'Your coin'; $('#rTk').textContent = '$' + (t || 'TICKER');
  $('#rTrig').textContent = `−${R.trig}% from the high`; $('#rShare').textContent = `${R.share}% of creator fees`; $('#rBite').textContent = `${R.bite}% of the pot`; $('#rHib').textContent = `${R.hib}h quiet`;
}
$('#lName').addEventListener('input', card); $('#lTk').addEventListener('input', card);
$('#lImg').addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; const u = URL.createObjectURL(f); $('#lImgBox').innerHTML = `<img src="${u}" alt="">`; $('#rImg').innerHTML = `<img src="${u}" alt="">` });
card();
