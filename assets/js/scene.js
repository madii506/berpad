import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { EffectComposer } from '../vendor/EffectComposer.js';
import { RenderPass } from '../vendor/RenderPass.js';
import { UnrealBloomPass } from '../vendor/UnrealBloomPass.js';
import { OutputPass } from '../vendor/OutputPass.js';

const canvas = document.getElementById('gl');
const R = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
const TEST = new URLSearchParams(location.search).has('test');
const DPR = TEST ? 1 : Math.min(devicePixelRatio || 1, 1.75);
R.setPixelRatio(DPR);
R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .95; R.outputColorSpace = THREE.SRGBColorSpace;
const S = new THREE.Scene(); S.background = new THREE.Color(0x050203); S.fog = new THREE.FogExp2(0x060203, .03);
const pm = new THREE.PMREMGenerator(R); S.environment = pm.fromScene(new RoomEnvironment(), .04).texture; S.environmentIntensity = .12;
const cam = new THREE.PerspectiveCamera(40, 1, .1, 200);

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
const SCONCE = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) });

// ---------- world ----------
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 140), new THREE.MeshStandardMaterial({ color: 0x0b0707, roughness: .45, metalness: .3 }));
floor.rotation.x = -Math.PI / 2; floor.position.set(0, -3.1, 20); S.add(floor);
const wallM = new THREE.MeshStandardMaterial({ color: 0x0d0909, roughness: .95 });
for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(140, 14), wallM); w.rotation.y = -sx * Math.PI / 2; w.position.set(sx * 7.5, 3, 20); S.add(w) }
S.add(new THREE.HemisphereLight(0x8a7a7a, 0x050203, .18));
const camLight = new THREE.PointLight(0xffd9b8, 6, 14, 1.6); S.add(camLight);
const redLight = new THREE.PointLight(0xff2a14, 0, 9, 1.6); redLight.position.set(1.2, -1.6, 2.4); S.add(redLight);
const spot = new THREE.SpotLight(0xdfe6ff, 0, 22, .38, .6, 1.6); spot.position.set(-1.5, 6, 4); spot.target.position.set(0, 0, 0); S.add(spot, spot.target);
const rim = new THREE.DirectionalLight(0xff3b2a, 0); rim.position.set(3, 1, -3); S.add(rim);

const loader = new GLTFLoader();
const gltf = await loader.loadAsync('assets/bear.glb');
const GEO = gltf.scene.children[0].geometry; GEO.computeVertexNormals();
const LO = (await loader.loadAsync('assets/bear_lo.glb')).scene.children[0].geometry; LO.computeVertexNormals();

function plinth(x, z, mat, stand = true, geo = LO) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const head = new THREE.Mesh(geo, mat); g.add(head);
  if (stand) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 1.4, 16), ROD); st.position.y = -1.55; g.add(st);
    const pl = new THREE.Mesh(new THREE.BoxGeometry(1.5, .9, 1.5), DARK); pl.position.y = -2.65; g.add(pl);
  }
  S.add(g); return g;
}
// the hall: blank bears on both sides, lamps between them
const HALL = [], LAMPS = [];
const poolTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,140,80,1)'); g.addColorStop(1, 'rgba(255,140,80,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c) })();
for (let i = 0; i < 10; i++) {
  const z = 9 + i * 4.4;
  for (const sx of [-1, 1]) {
    const h = plinth(sx * 3.4, z, GREY); h.userData.stare = 1; HALL.push(h);
    const sc = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 8), SCONCE.clone()); sc.position.set(sx * 7.3, 2.2, z + 2.2); S.add(sc);
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.2, 40), new THREE.MeshBasicMaterial({ map: poolTex, color: 0xff7a40, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.set(sx * 5.6, -3.09, z + 2.2); S.add(pool);
    LAMPS.push({ sc, pool, i });
  }
}
// the back gallery, behind the piece
const BACK = [];
for (const [x, z] of [[-2.6, -4.5], [2.8, -5], [-4.8, -7.5], [5, -8], [-1.2, -9.5], [1.6, -10]]) { const h = plinth(x, z, GREY); h.userData.stare = 1; h.visible = false; BACK.push(h) }

// the piece
const PIECE = plinth(0, 0, MARBLE, true, GEO); const HEAD = PIECE.children[0];
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
const EYES = [];
for (const s of [1, -1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), EYE); e.scale.set(.13, .06, .05); e.position.set(.35 * s, .08, .74); e.rotation.z = -.38 * s; PIECE.add(e); EYES.push(e) }
{ const pts = []; for (let x = -.27; x <= .27; x += .02) pts.push(onSurf([x, -.5 + .9 * x * x, 1.0]).add(new THREE.Vector3(0, 0, -.03))); const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, .022, 8), EYE); PIECE.add(m) }

// embers
const EN = 260, eg = new THREE.BufferGeometry(), ep = new Float32Array(EN * 3), ev = new Float32Array(EN);
for (let i = 0; i < EN; i++) { ep[i * 3] = (Math.random() - .5) * 9; ep[i * 3 + 1] = Math.random() * 6 - 3; ep[i * 3 + 2] = Math.random() * 6 - 4; ev[i] = .2 + Math.random() * .6 }
eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
const emberMat = new THREE.PointsMaterial({ color: new THREE.Color(4, .6, .2), size: .035, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const EMB = new THREE.Points(eg, emberMat); S.add(EMB);
// sparks
const SN = 120, sg = new THREE.BufferGeometry(), sp = new Float32Array(SN * 3), svel = new Float32Array(SN * 3), slife = new Float32Array(SN);
sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
const SPK = new THREE.Points(sg, new THREE.PointsMaterial({ color: new THREE.Color(8, 1.4, .4), size: .05, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); S.add(SPK);
function sparks(p) { for (let i = 0; i < SN; i++) { sp[i * 3] = p.x; sp[i * 3 + 1] = p.y; sp[i * 3 + 2] = p.z; const a = Math.random() * Math.PI * 2, u = Math.random() * 2 - 1, r = 1.5 + Math.random() * 3; svel[i * 3] = Math.cos(a) * Math.sqrt(1 - u * u) * r; svel[i * 3 + 1] = Math.abs(u) * r + 1; svel[i * 3 + 2] = Math.sin(a) * Math.sqrt(1 - u * u) * r; slife[i] = .6 + Math.random() * .6 } }

// ---------- post ----------
const C = new EffectComposer(R); C.addPass(new RenderPass(S, cam));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .85, .32, 1.05); C.addPass(bloom); C.addPass(new OutputPass());
function size() { const w = innerWidth, h = innerHeight; R.setSize(w, h, false); C.setPixelRatio(DPR); C.setSize(w, h); bloom.setSize(w * DPR, h * DPR); cam.aspect = w / h; cam.updateProjectionMatrix() }
addEventListener('resize', size); size();

// ---------- timeline ----------
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mobile = () => innerWidth < 900;
function heroPose() { return mobile() ? { p: new THREE.Vector3(0, .4, 10.5), l: new THREE.Vector3(0, -2.1, 0), f: 38 } : { p: new THREE.Vector3(-1.35, .2, 7.2), l: new THREE.Vector3(-1.25, .1, 0), f: 30 } }
const INTRO = 14.5; let t0 = performance.now(), skipped = false, done = false, ignite = 0, flare = 0, lightning = 0, nextFlash = 18 + Math.random() * 12;
const mouse = new THREE.Vector2(0, 0), mpx = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('pointermove', e => { mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); mpx.x = e.clientX; mpx.y = e.clientY }, { passive: true });
canvas.addEventListener('click', e => { rc.setFromCamera(new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), cam); const h = rc.intersectObject(HEAD)[0]; if (h) { sparks(h.point); flare = 1; window.dispatchEvent(new CustomEvent('ber:spark')) } });
export function skip() { skipped = true; t0 = performance.now() - INTRO * 1000 }
window.berSkip = skip;
if (document.body.classList.contains('entered')) skip();

const camStart = new THREE.Vector3(0, .6, 50), lookStart = new THREE.Vector3(0, .2, 0);
let last = performance.now(), ry = 0, rx = 0;
function frame(now) {
  if (window.__berPause && !TEST) { last = now; requestAnimationFrame(frame); return }
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  const t = (now - t0) / 1000;
  // lamps click on, near to far
  for (const L of LAMPS) { const on = clamp((t - 1.3 - L.i * .32) * 6); const fl = on < 1 && on > 0 ? (Math.random() > .5 ? 1 : .2) : on; L.sc.material.color.setRGB(6 * fl, 2.2 * fl, .9 * fl); L.pool.material.opacity = .32 * fl }
  // camera walk then hero
  const hp = heroPose();
  const walk = ease(clamp((t - 2.6) / 8.4));
  const toHero = ease(clamp((t - 10.8) / 2.6));
  const wp = new THREE.Vector3().lerpVectors(camStart, new THREE.Vector3(0, .25, 7.2), walk);
  const p = wp.lerp(hp.p, toHero); const l = lookStart.clone().lerp(hp.l, toHero);
  // parallax after the intro
  if (t > INTRO) { p.x += mouse.x * .18; p.y += mouse.y * .1 }
  cam.position.copy(p); cam.lookAt(l); cam.fov = 40 + (hp.f - 40) * toHero; cam.updateProjectionMatrix();
  camLight.position.copy(p).add(new THREE.Vector3(0, .6, -1.5)); camLight.intensity = 6 * (1 - toHero) + 1.2;
  // spotlight on the piece, ignition
  spot.intensity = 7 * clamp((t - 8.6) * 2);
  ignite = clamp((t - 9.6) / 2.2);
  const sput = ignite > 0 && ignite < .35 ? (Math.random() > .45 ? 1 : .15) : 1;
  const near = (() => { const e = PIECE.localToWorld(new THREE.Vector3(0, .08, .8)).project(cam); const ex = (e.x + 1) / 2 * innerWidth, ey = (1 - e.y) / 2 * innerHeight; return clamp(1 - Math.hypot(ex - mpx.x, ey - mpx.y) / 260) })();
  flare = Math.max(0, flare - dt * 1.4);
  const k = ignite * sput * (1 + near * .7 + flare * 1.2);
  EYE.color.copy(EYE_BASE).multiplyScalar(k);
  for (const tb of TUBES) tb.geometry.setDrawRange(0, Math.floor(tb.geometry.index.count * ease(clamp((t - 10.4) / 2.2))));
  CRACK.color.copy(CRACK_BASE).multiplyScalar(.7 + near * .5 + flare);
  redLight.intensity = 1.6 * ignite; rim.intensity = 1.6 * toHero;
  for (const b of BACK) b.visible = toHero > .05;
  emberMat.opacity = .8 * toHero;
  // heads stare at the camera
  for (const h of [...HALL, ...BACK]) { const want = Math.atan2(cam.position.x - h.position.x, cam.position.z - h.position.z); h.rotation.y += (want - h.rotation.y) * (TEST ? 1 : Math.min(1, dt * 2.2)) }
  // the piece: faces the hall, then you, then follows the cursor
  const face = Math.atan2(cam.position.x - PIECE.position.x, cam.position.z - PIECE.position.z);
  const tr = t > INTRO ? face + mouse.x * .45 : face, tx = t > INTRO ? -mouse.y * .22 : 0;
  const kf = TEST ? 1 : Math.min(1, dt * 4); ry += (tr - ry) * kf; rx += (tx - rx) * kf; PIECE.rotation.set(rx, ry, 0);
  // embers rise
  for (let i = 0; i < EN; i++) { ep[i * 3 + 1] += ev[i] * dt * .35; ep[i * 3] += Math.sin(now / 1000 + i) * dt * .05; if (ep[i * 3 + 1] > 3) ep[i * 3 + 1] = -3 } eg.attributes.position.needsUpdate = true;
  // sparks fly
  for (let i = 0; i < SN; i++) { if (slife[i] <= 0) { sp[i * 3 + 1] = -99; continue } slife[i] -= dt; svel[i * 3 + 1] -= 6 * dt; sp[i * 3] += svel[i * 3] * dt; sp[i * 3 + 1] += svel[i * 3 + 1] * dt; sp[i * 3 + 2] += svel[i * 3 + 2] * dt } sg.attributes.position.needsUpdate = true;
  // cold lightning
  if (t > INTRO + nextFlash) { lightning = 1; nextFlash += 18 + Math.random() * 16 }
  lightning = Math.max(0, lightning - dt * 3.2); S.environmentIntensity = .12 + lightning * (Math.random() > .3 ? 1.4 : .2);
  if (!done && t > INTRO - 1.4) { done = true; window.dispatchEvent(new CustomEvent('ber:intro')) }
  C.render(); if (!TEST) requestAnimationFrame(frame);
}
if (TEST) window.berShot = (sec, mx = 0, my = 0) => { mouse.set(mx, my); t0 = performance.now() - sec * 1000; last = performance.now() - 16; frame(performance.now()) };
else requestAnimationFrame(frame);
window.dispatchEvent(new CustomEvent('ber:ready'));
