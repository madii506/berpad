import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { EffectComposer } from '../vendor/EffectComposer.js';
import { RenderPass } from '../vendor/RenderPass.js';
import { UnrealBloomPass } from '../vendor/UnrealBloomPass.js';
import { OutputPass } from '../vendor/OutputPass.js';

const TEST = new URLSearchParams(location.search).has('test');
const canvas = document.getElementById('gl');
const R = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const DPR = TEST ? 1 : Math.min(devicePixelRatio || 1, 1.75);
R.setPixelRatio(DPR);
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .95; R.outputColorSpace = THREE.SRGBColorSpace;
const S = new THREE.Scene(); S.background = new THREE.Color(0x050203); S.fog = new THREE.FogExp2(0x060203, .03);
const pm = new THREE.PMREMGenerator(R); S.environment = pm.fromScene(new RoomEnvironment(), .04).texture; S.environmentIntensity = .12;
const cam = new THREE.PerspectiveCamera(30, 1, .1, 200);

// ---------- materials ----------
function marbleTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#e9e4dc'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 22; i++) { x.strokeStyle = `rgba(120,110,105,${.05 + Math.random() * .1})`; x.lineWidth = .5 + Math.random(); x.beginPath(); let px = Math.random() * 512, py = Math.random() * 512; x.moveTo(px, py); for (let k = 0; k < 20; k++) { px += (Math.random() - .5) * 34; py += (Math.random() - .3) * 22; x.lineTo(px, py) } x.stroke() }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const MARBLE = new THREE.MeshPhysicalMaterial({ map: marbleTex(), roughness: .5, clearcoat: .25, clearcoatRoughness: .3, color: 0xbdb6ae });
const GREY = new THREE.MeshStandardMaterial({ color: 0x6a6462, roughness: .78 });
const DARK = new THREE.MeshStandardMaterial({ color: 0x120c0d, roughness: .85 });
const ROD = new THREE.MeshStandardMaterial({ color: 0x1a1415, metalness: .6, roughness: .4 });
const EYE_BASE = new THREE.Color(9, .55, .22), CRACK_BASE = new THREE.Color(5.5, .22, .08);
const EYE = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) });
const CRACK = new THREE.MeshBasicMaterial({ color: CRACK_BASE.clone() });

// ---------- room ----------
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x0b0707, roughness: .45, metalness: .3 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(0, -3.1, -6); S.add(floor);
S.add(new THREE.HemisphereLight(0x8a7a7a, 0x050203, .2));
const fill = new THREE.PointLight(0xffd9b8, 1.4, 14, 1.6); S.add(fill);
const redLight = new THREE.PointLight(0xff2a14, 0, 9, 1.6); redLight.position.set(1.2, -1.6, 2.4); S.add(redLight);
const spot = new THREE.SpotLight(0xdfe6ff, 7, 22, .38, .6, 1.6); spot.position.set(-1.5, 6, 4); spot.target.position.set(0, 0, 0); S.add(spot, spot.target);
const rim = new THREE.DirectionalLight(0xff3b2a, 1.6); rim.position.set(3, 1, -3); S.add(rim);
const backLight = new THREE.PointLight(0xff5a3a, 6, 16, 1.4); backLight.position.set(2, 3, -6); S.add(backLight);

const loader = new GLTFLoader();
const [hi, lo] = await Promise.all([loader.loadAsync('assets/bear.glb'), loader.loadAsync('assets/bear_lo.glb')]);
const GEO = hi.scene.children[0].geometry; GEO.computeVertexNormals();
const LO = lo.scene.children[0].geometry; LO.computeVertexNormals();
const STAND = new THREE.CylinderGeometry(.06, .08, 1.4, 16), PLINTH = new THREE.BoxGeometry(1.5, .9, 1.5);
function plinth(x, z, mat, geo = LO) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  g.add(new THREE.Mesh(geo, mat));
  const st = new THREE.Mesh(STAND, ROD); st.position.y = -1.55; g.add(st);
  const pl = new THREE.Mesh(PLINTH, DARK); pl.position.y = -2.65; g.add(pl);
  S.add(g); return g;
}

// ---------- the gallery: every head holds a live pump.fun coin ----------
const SPOTS = [[2.5, -3.8], [4.5, -5.6], [.7, -5.8], [2.8, -8.2], [5.8, -8.6], [.1, -10.6], [4.2, -10.8], [7.2, -11.4], [2.2, -13.6], [6.2, -14]];
const GALLERY = SPOTS.map(([x, z]) => { const h = plinth(x, z, GREY); h.userData.stare = 1; return h });
function plateCanvas() { const c = document.createElement('canvas'); c.width = 512; c.height = 176; return c }
function drawPlate(pl, coin, img) {
  const c = pl.userData.c, x = c.getContext('2d'); x.clearRect(0, 0, 512, 176);
  const red = coin && coin.chg < 0, col = !coin ? '#6e5a57' : red ? '#ff3b2f' : '#4ade80';
  x.fillStyle = 'rgba(10,4,5,.92)'; x.strokeStyle = col; x.lineWidth = 3;
  x.beginPath(); x.roundRect(4, 4, 504, 168, 26); x.fill(); x.stroke();
  if (!coin) { x.fillStyle = '#6e5a57'; x.font = '600 30px JetBrains Mono, monospace'; x.fillText('reading pump.fun…', 34, 100); pl.material.map.needsUpdate = true; return }
  x.save(); x.beginPath(); x.roundRect(22, 22, 132, 132, 22); x.clip();
  if (img) x.drawImage(img, 22, 22, 132, 132); else { x.fillStyle = '#2a0c0c'; x.fillRect(22, 22, 132, 132); x.fillStyle = '#ff8a4a'; x.font = '700 54px Arial'; x.textAlign = 'center'; x.fillText((coin.sym || '?').slice(0, 2).toUpperCase(), 88, 108); x.textAlign = 'left' }
  x.restore();
  x.fillStyle = '#ebe5da'; x.font = '800 44px Inter, Arial'; x.fillText('$' + (coin.sym || '').slice(0, 9), 176, 78);
  x.fillStyle = '#a8938f'; x.font = '500 24px JetBrains Mono, monospace'; x.fillText(coin.sub || '', 178, 118);
  x.fillStyle = col; x.font = '800 40px JetBrains Mono, monospace'; x.textAlign = 'right'; x.fillText((coin.chg > 0 ? '+' : '') + coin.chg.toFixed(0) + '%', 488, 150); x.textAlign = 'left';
  pl.material.map.needsUpdate = true;
}
const PLATES = GALLERY.map((h, i) => {
  const c = plateCanvas(), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  sp.scale.set(2.05, .7, 1); sp.position.set(h.position.x, 1.62, h.position.z); sp.userData = { c, coin: null, a: 0, y: 1.62 + (i % 3) * .42 }; S.add(sp); drawPlate(sp, null); return sp;
});
const imgCache = new Map();
function loadImg(url) {
  if (!url) return Promise.resolve(null); if (imgCache.has(url)) return imgCache.get(url);
  const p = new Promise(res => { const im = new Image(); im.crossOrigin = 'anonymous'; const to = setTimeout(() => res(null), 7000); im.onload = () => { clearTimeout(to); res(im) }; im.onerror = () => { clearTimeout(to); res(null) }; im.src = 'https://wsrv.nl/?url=' + encodeURIComponent(url) + '&w=160&h=160&fit=cover&output=png' });
  imgCache.set(url, p); return p;
}
let FEED = [], fi = 0;
async function setPlate(pl, coin) { const img = await loadImg(coin.img); pl.userData.coin = coin; pl.userData.a = 0; drawPlate(pl, coin, img) }
window.addEventListener('ber:coins', e => { FEED = e.detail || []; if (!FEED.length) return; PLATES.forEach((pl, i) => { if (!pl.userData.coin) setPlate(pl, FEED[(fi++) % FEED.length]) }) });
setInterval(() => { if (!FEED.length || document.hidden) return; const pl = PLATES[Math.random() * PLATES.length | 0]; setPlate(pl, FEED[(fi++) % FEED.length]) }, 2200);

// ---------- the piece ----------
const PIECE = plinth(0, 0, MARBLE, GEO); const HEAD = PIECE.children[0];
const rc = new THREE.Raycaster();
function onSurf(p) { const v = new THREE.Vector3(...p); const o = v.clone().multiplyScalar(2.2); const d = v.clone().normalize().negate(); rc.set(o, d); const h = rc.intersectObject(HEAD)[0]; return h ? h.point.clone().addScaledVector(d, .004) : v }
const CR = [[[-0.35, .08, .74], [-.45, .2, .75], [-.6, .45, .62]], [[-.45, .2, .75], [-.55, -.05, .72], [-.48, -.3, .75]], [[.35, .08, .74], [.12, .48, .82], [.05, .7, .7], [.15, .95, .45]], [[.05, .7, .7], [-.18, .62, .75]], [[.35, .08, .74], [.42, .38, .72], [.55, .55, .55]], [[.2, -.48, .9], [.5, -.42, .72], [.62, -.2, .68]], [[.5, -.42, .72], [.66, -.55, .6]], [[-.2, -.52, .88], [-.12, -.8, .78], [-.2, -.9, .6]]];
const TUBES = [];
for (const c of CR) {
  const pts = []; for (let i = 0; i < c.length - 1; i++) for (let t = 0; t < 1; t += .1) { const a = c[i], b = c[i + 1]; pts.push(onSurf([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])) }
  pts.push(onSurf(c.at(-1)));
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1), 120, .0075, 6); g.setDrawRange(0, 0);
  const m = new THREE.Mesh(g, CRACK); PIECE.add(m); TUBES.push(m);
}
for (const s of [1, -1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), EYE); e.scale.set(.13, .06, .05); e.position.set(.35 * s, .08, .74); e.rotation.z = -.38 * s; PIECE.add(e) }
{ const pts = []; for (let x = -.27; x <= .27; x += .02) pts.push(onSurf([x, -.5 + .9 * x * x, 1.0]).add(new THREE.Vector3(0, 0, -.03))); PIECE.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .022, 8), EYE)) }

// ---------- embers + sparks ----------
const EN = 240, eg = new THREE.BufferGeometry(), ep = new Float32Array(EN * 3), ev = new Float32Array(EN);
for (let i = 0; i < EN; i++) { ep[i * 3] = (Math.random() - .5) * 12; ep[i * 3 + 1] = Math.random() * 6 - 3; ep[i * 3 + 2] = Math.random() * 10 - 9; ev[i] = .2 + Math.random() * .6 }
eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
S.add(new THREE.Points(eg, new THREE.PointsMaterial({ color: new THREE.Color(4, .6, .2), size: .035, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false })));
const SN = 120, sg = new THREE.BufferGeometry(), sp = new Float32Array(SN * 3), svel = new Float32Array(SN * 3), slife = new Float32Array(SN);
sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
S.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(8, 1.4, .4), size: .05, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
function sparks(p) { for (let i = 0; i < SN; i++) { sp[i * 3] = p.x; sp[i * 3 + 1] = p.y; sp[i * 3 + 2] = p.z; const a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, r = 1.5 + Math.random() * 3; svel[i * 3] = Math.cos(a) * Math.sqrt(1 - u * u) * r; svel[i * 3 + 1] = Math.abs(u) * r + 1; svel[i * 3 + 2] = Math.sin(a) * Math.sqrt(1 - u * u) * r; slife[i] = .6 + Math.random() * .6 } }

// ---------- post ----------
const C = new EffectComposer(R); C.addPass(new RenderPass(S, cam));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .85, .32, 1.05); C.addPass(bloom); C.addPass(new OutputPass());
function size() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); C.setPixelRatio(DPR); C.setSize(w, h); bloom.setSize(w * DPR, h * DPR); cam.aspect = w / h; cam.updateProjectionMatrix() }
addEventListener('resize', size); size();

// ---------- interaction ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), ease = t => 1 - Math.pow(1 - t, 3);
const mobile = () => innerWidth < 900;
const pose = () => mobile() ? { p: new THREE.Vector3(0, .5, 10.5), l: new THREE.Vector3(0, -1.9, 0), f: 38 } : { p: new THREE.Vector3(-2.0, .4, 8.9), l: new THREE.Vector3(-1.5, .25, 0), f: 32 };
const mouse = new THREE.Vector2(0, 0), mpx = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('pointermove', e => { mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); mpx.x = e.clientX; mpx.y = e.clientY }, { passive: true });
function ndc(e) { return new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1) }
canvas.addEventListener('click', e => {
  rc.setFromCamera(ndc(e), cam);
  const hp = rc.intersectObjects(PLATES)[0]; if (hp && hp.object.userData.coin) { window.open(hp.object.userData.coin.url, '_blank', 'noopener'); return }
  const h = rc.intersectObject(HEAD)[0]; if (h) { sparks(h.point); flare = 1; window.dispatchEvent(new CustomEvent('ber:spark')) }
});
canvas.addEventListener('pointermove', e => { rc.setFromCamera(ndc(e), cam); const hp = rc.intersectObjects(PLATES)[0]; canvas.style.cursor = hp && hp.object.userData.coin ? 'pointer' : '' });

let t0 = performance.now(), last = t0, flare = 0, lightning = 0, nextFlash = 14 + Math.random() * 10, ry = 0, rx = 0;
function frame(now) {
  if (window.__berPause && !TEST) { last = now; requestAnimationFrame(frame); return }
  const dt = Math.min(.05, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
  const P = pose(); const p = P.p.clone(); p.x += mouse.x * .2; p.y += mouse.y * .12;
  cam.position.copy(p); cam.lookAt(P.l); cam.fov = P.f; cam.updateProjectionMatrix(); fill.position.copy(p).add(new THREE.Vector3(0, .6, -1.5));
  const ign = clamp((t - .4) / 1.2), sput = ign > 0 && ign < .4 ? (Math.random() > .45 ? 1 : .15) : 1;
  const e = PIECE.localToWorld(new THREE.Vector3(0, .08, .8)).project(cam);
  const near = clamp(1 - Math.hypot((e.x + 1) / 2 * innerWidth - mpx.x, (1 - e.y) / 2 * innerHeight - mpx.y) / 260);
  flare = Math.max(0, flare - dt * 1.4);
  EYE.color.copy(EYE_BASE).multiplyScalar(ign * sput * (1 + near * .7 + flare * 1.2));
  for (const tb of TUBES) tb.geometry.setDrawRange(0, Math.floor(tb.geometry.index.count * ease(clamp((t - .9) / 1.8))));
  CRACK.color.copy(CRACK_BASE).multiplyScalar(.7 + near * .5 + flare);
  redLight.intensity = 1.6 * ign;
  const k = TEST ? 1 : Math.min(1, dt * 2.4);
  for (const h of GALLERY) { const want = Math.atan2(cam.position.x - h.position.x, cam.position.z - h.position.z); h.rotation.y += (want - h.rotation.y) * k }
  const face = Math.atan2(cam.position.x, cam.position.z), kf = TEST ? 1 : Math.min(1, dt * 4);
  ry += (face + mouse.x * .45 - ry) * kf; rx += (-mouse.y * .22 - rx) * kf; PIECE.rotation.set(rx, ry, 0);
  for (const pl of PLATES) { pl.userData.a = TEST ? 1 : Math.min(1, pl.userData.a + dt * 2.5); pl.material.opacity = pl.userData.a; pl.position.y = pl.userData.y + Math.sin(t * 1.3 + pl.position.x) * .05 }
  for (let i = 0; i < EN; i++) { ep[i * 3 + 1] += ev[i] * dt * .35; if (ep[i * 3 + 1] > 3) ep[i * 3 + 1] = -3 } eg.attributes.position.needsUpdate = true;
  for (let i = 0; i < SN; i++) { if (slife[i] <= 0) { sp[i * 3 + 1] = -99; continue } slife[i] -= dt; svel[i * 3 + 1] -= 6 * dt; sp[i * 3] += svel[i * 3] * dt; sp[i * 3 + 1] += svel[i * 3 + 1] * dt; sp[i * 3 + 2] += svel[i * 3 + 2] * dt } sg.attributes.position.needsUpdate = true;
  if (t > nextFlash) { lightning = 1; nextFlash += 16 + Math.random() * 16 }
  lightning = Math.max(0, lightning - dt * 3.2); S.environmentIntensity = .12 + lightning * (Math.random() > .3 ? 1.4 : .2);
  C.render(); if (!TEST) requestAnimationFrame(frame);
}
if (TEST) window.berShot = (sec, mx = 0, my = 0) => { mouse.set(mx, my); t0 = performance.now() - sec * 1000; last = performance.now() - 16; frame(performance.now()) };
else requestAnimationFrame(frame);
window.__berScene = true;
window.dispatchEvent(new CustomEvent('ber:ready'));
if (window.__berCoins) window.dispatchEvent(new CustomEvent('ber:coins', { detail: window.__berCoins }));
