const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const toast = m => { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1800) };

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
const secs = ['live', 'rule', 'how', 'launch', 'faq'].map(id => document.getElementById(id));
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

/* ---------- live pump.fun ---------- */
const JUP = 'https://lite-api.jup.ag/tokens/v2', GT = 'https://api.geckoterminal.com/api/v2/networks/solana/dexes';
const BAD = /fuck|shit|cunt|n[i1]gg|fag|retard|porn|nazi|hitler|pedo|rape|kys/i;
const ok = c => !BAD.test((c.sym || '') + ' ' + (c.name || ''));
const ago = t => { const s = Math.max(0, (Date.now() - new Date(t)) / 1000); return s < 60 ? Math.round(s) + 's' : s < 3600 ? Math.round(s / 60) + 'm' : s < 86400 ? Math.round(s / 3600) + 'h' : Math.round(s / 86400) + 'd' };
const usd = v => v == null || !isFinite(v) ? '—' : v >= 1e6 ? '$' + (v / 1e6).toFixed(2) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(1) + 'K' : '$' + Math.round(v);
const pct = v => v == null || !isFinite(v) ? '—' : (v > 0 ? '+' : '') + (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)) + '%';
const tile = s => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2a0c0c"/><text x="32" y="41" text-anchor="middle" font-family="Arial" font-weight="700" font-size="24" fill="#ff8a4a">${String(s || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?'}</text></svg>`);
window.__img = (el, sym) => { if (!el.dataset.p && el.dataset.src) { el.dataset.p = 1; el.src = 'https://wsrv.nl/?url=' + encodeURIComponent(el.dataset.src) + '&w=96&h=96&fit=cover' } else { el.onerror = null; el.src = tile(sym) } };
const im = c => c.img ? `<img src="${esc(c.img)}" data-src="${esc(c.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="__img(this,'${esc((c.sym || '').replace(/'/g, ''))}')">` : `<img src="${tile(c.sym)}" alt="">`;
const fromJup = t => ({ mint: t.id, sym: t.symbol, name: t.name, img: t.icon, mcap: t.mcap, created: t.firstPool?.createdAt || t.createdAt, c5: t.stats5m?.priceChange, c1: t.stats1h?.priceChange, vol: (t.stats1h?.buyVolume || 0) + (t.stats1h?.sellVolume || 0), holders: t.holderCount, url: 'https://pump.fun/coin/' + t.id });
let NEW = [], HOT = [], RED = [], SEEN = new Set(), FIRSTLOAD = true, SINCE = 0;
async function get(u) { const ac = new AbortController(); const to = setTimeout(() => ac.abort(), 9000); try { const r = await fetch(u, { cache: 'no-store', signal: ac.signal }); if (!r.ok) throw new Error(r.status); return await r.json() } finally { clearTimeout(to) } }
function row(c, kind) {
  const chg = kind === 'new' ? c.c5 : kind === 'hot' ? c.c5 : c.c1;
  const cl = chg < 0 ? 'dn' : 'up';
  const sub = kind === 'new' ? `${ago(c.created)} old · ${c.holders ?? '—'} holders` : kind === 'hot' ? `${usd(c.mcap)} · vol ${usd(c.vol)}` : `${usd(c.mcap)} · vol ${usd(c.vol)}`;
  const right = kind === 'new' ? `<b>${usd(c.mcap)}</b><small class="${cl}">5m ${pct(chg)}</small>` : `<b class="${cl}">${pct(chg)}</b><small>${kind === 'hot' ? '5m' : '1h'}</small>`;
  const bar = kind === 'red' ? `<div class="bar"><i style="width:${Math.min(100, Math.abs(chg))}%"></i></div>` : '';
  return `<a class="it${c._fresh ? ' fresh' : ''}" href="${esc(c.url)}" target="_blank" rel="noopener">${im(c)}<span class="nm"><b>$${esc((c.sym || '').slice(0, 14))}</b><small>${esc(sub)}</small>${bar}</span><span class="r">${right}</span></a>`;
}
function render(id, list, kind, empty) { $(id).innerHTML = list.length ? list.map(c => row(c, kind)).join('') : `<div class="empty">${empty}</div>` }
async function loadNew() {
  try {
    const j = await get(`${JUP}/recent`); const L = j.filter(t => t.launchpad === 'pump.fun').map(fromJup).filter(ok);
    L.forEach(c => { if (!SEEN.has(c.mint)) { if (!FIRSTLOAD) { c._fresh = 1; SINCE++ } SEEN.add(c.mint) } });
    const keep = new Map(NEW.map(c => [c.mint, c])); L.forEach(c => keep.set(c.mint, { ...keep.get(c.mint), ...c }));
    NEW = [...keep.values()].sort((a, b) => new Date(b.created) - new Date(a.created)).slice(0, 40);
    render('#lNew', NEW, 'new', 'Nothing new this second.'); NEW.forEach(c => delete c._fresh);
    const ts = L.map(c => +new Date(c.created)).filter(Boolean).sort((a, b) => a - b);
    const rate = ts.length > 3 ? (ts.length - 1) / ((ts.at(-1) - ts[0]) / 60000) : null;
    $('#cNew').textContent = rate ? `~${rate.toFixed(1)}/min` : '';
    $('#lRate').innerHTML = `<b>${rate ? rate.toFixed(1) : '—'}</b> pump.fun launches a minute right now · <b>${RED.length || '—'}</b> coins bleeding · <b>${SINCE}</b> launched since you got here`;
    tape(NEW); FIRSTLOAD = false; feed();
  } catch (e) { if (!NEW.length) $('#lNew').innerHTML = '<div class="empty">Jupiter isn\'t answering right now.</div>' }
}
async function loadHot() {
  try { const j = await get(`${JUP}/toptrending/5m?limit=100`); HOT = j.filter(t => t.launchpad === 'pump.fun').map(fromJup).filter(ok).slice(0, 30); render('#lHot', HOT, 'hot', 'Nothing trending this minute.'); $('#cHot').textContent = HOT.length + ' coins'; feed() }
  catch (e) { if (!HOT.length) $('#lHot').innerHTML = '<div class="empty">Jupiter isn\'t answering right now.</div>' }
}
async function loadRed() {
  try {
    const js = await Promise.all([get(`${GT}/pump-fun/pools?page=1&sort=h24_volume_usd_desc&include=base_token`), get(`${GT}/pumpswap/pools?page=1&sort=h24_volume_usd_desc&include=base_token`)].map(p => p.catch(() => null)));
    const toks = {}; js.forEach(j => (j?.included || []).forEach(t => toks[t.id] = t.attributes));
    const L = js.flatMap(j => j?.data || []).map(p => { const a = p.attributes, t = toks[p.relationships?.base_token?.data?.id] || {}; const mint = t.address || '';
      return { mint, sym: t.symbol || (a.name || '').split(' / ')[0], name: t.name, img: t.image_url && !/missing/.test(t.image_url) ? t.image_url : '', mcap: +a.fdv_usd, vol: +(a.volume_usd?.h1 || a.volume_usd?.h24 || 0), c1: parseFloat(a.price_change_percentage?.h1), url: mint ? 'https://pump.fun/coin/' + mint : 'https://dexscreener.com/solana/' + a.address, q: (a.name || '').split(' / ')[1] } })
      .filter(c => c.q === 'SOL' && isFinite(c.c1) && c.c1 < -3 && ok(c));
    const seen = new Set(); RED = L.filter(c => !seen.has(c.mint) && seen.add(c.mint)).sort((a, b) => a.c1 - b.c1).slice(0, 30);
    render('#lRed', RED, 'red', 'Nothing bleeding right now. The ber is waiting.'); $('#cRed').textContent = RED.length + ' coins'; feed();
  } catch (e) { if (!RED.length) $('#lRed').innerHTML = '<div class="empty">GeckoTerminal isn\'t answering right now.</div>' }
  $('#lSrc').textContent = `Jupiter (newest + trending pump.fun launches) · GeckoTerminal (pump.fun + PumpSwap pools) · updated ${new Date().toLocaleTimeString()}`;
}
function tape(L) { const C = L.slice(0, 30); if (!C.length) return; const h = C.map(c => `<a class="chip" href="${esc(c.url)}" target="_blank" rel="noopener">${im(c)}<b>$${esc((c.sym || '').slice(0, 12))}</b><small>${usd(c.mcap)} · <span data-ts="${esc(c.created)}">${ago(c.created)}</span></small></a>`).join(''); const tr = $('#tape'); if (tr.dataset.top !== C[0].mint) { tr.dataset.top = C[0].mint; tr.innerHTML = h + h } }
function feed() {
  const mk = (c, chg, sub) => ({ sym: c.sym, sub, chg: isFinite(chg) ? chg : 0, img: c.img, url: c.url });
  const F = [...HOT.slice(0, 10).map(c => mk(c, c.c5, '5m · trending')), ...RED.slice(0, 10).map(c => mk(c, c.c1, '1h · bleeding')), ...NEW.slice(0, 10).map(c => mk(c, c.c5, ago(c.created) + ' old · new'))];
  for (let i = F.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[F[i], F[j]] = [F[j], F[i]] }
  window.__berCoins = F; window.dispatchEvent(new CustomEvent('ber:coins', { detail: F }));
}
$('#colTabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#colTabs button').forEach(x => x.classList.toggle('on', x === b)); $$('.col').forEach(c => c.classList.toggle('on', c.dataset.c === b.dataset.c)) });
setInterval(() => $$('[data-ts]').forEach(el => el.textContent = ago(el.dataset.ts)), 5000);
loadRed().then(loadNew); loadHot();
setInterval(() => { if (!document.hidden) loadNew() }, 12000);
setInterval(() => { if (!document.hidden) loadHot() }, 30000);
setInterval(() => { if (!document.hidden) loadRed() }, 60000);

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
