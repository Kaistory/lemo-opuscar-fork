// figure.js · a shared skeleton for people drawn in code: proportions by age and build, a pose library,
// any camera angle (turn, high, low, perspective), reach IK for hands and feet, ground contact, balance,
// and a neutral mannequin to check poses before a style paints over them.
// Units are head heights. Body space: +x = the figure's own left, +y = up, +z = the way it faces.
// Usage: const sk = solve(POSES.contrapposto, 'woman'); const J = view(sk, { yaw: 45, px: 80, x: 960, y: 1000 });
//        parts(sk, J) → capsules far-to-near for any style to paint; mannequin(ctx, sk, J) draws the check figure.
import { clamp, lerp, eio, seg } from '../lib.js';
import { POSES } from './poses.js';

const D = Math.PI / 180, I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const mul = (A, B) => { const o = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]; return o; };
const app = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
const rx = a => { const c = Math.cos(a * D), s = Math.sin(a * D); return [1, 0, 0, 0, c, -s, 0, s, c]; };
const ry = a => { const c = Math.cos(a * D), s = Math.sin(a * D); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
const rz = a => { const c = Math.cos(a * D), s = Math.sin(a * D); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = a => Math.hypot(a[0], a[1], a[2]), norm = a => { const l = len(a) || 1; return scl(a, 1 / l); };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// the smallest rotation taking unit vector a onto unit vector b
function rotBetween(a, b) {
  const v = cross(a, b), c = dot(a, b);
  if (c < -.9999) { const n = norm(Math.abs(a[0]) < .9 ? cross(a, [1, 0, 0]) : cross(a, [0, 1, 0])); return [2 * n[0] * n[0] - 1, 2 * n[0] * n[1], 2 * n[0] * n[2], 2 * n[1] * n[0], 2 * n[1] * n[1] - 1, 2 * n[1] * n[2], 2 * n[2] * n[0], 2 * n[2] * n[1], 2 * n[2] * n[2] - 1]; }
  const k = 1 / (1 + c);
  return [v[0] * v[0] * k + c, v[0] * v[1] * k - v[2], v[0] * v[2] * k + v[1], v[1] * v[0] * k + v[2], v[1] * v[1] * k + c, v[1] * v[2] * k - v[0], v[2] * v[0] * k - v[1], v[2] * v[1] * k + v[0], v[2] * v[2] * k + c];
}
export const v3 = { add, sub, scl, dot, len, norm, cross, mix: mix3 };

// ---------- proportions ----------
// Lengths in heads (chin to crown = 1). Standing height = ankle + shin + thigh + abd + chest + upper + neck + 1.
// sh / hip = half-widths between the shoulder joints / hip joints. W = capsule radii for the mannequin and for styles.
const W_MAN = { neck: .2, ribLo: .52, ribHi: .66, waist: .5, pelvis: .34, uArm: .22, elbow: .17, fArm: .17, wrist: .11, hand: .14, thigh: .34, knee: .22, shin: .23, ankle: .13, foot: .15, toe: .11, skull: .44, jaw: .27 };
const W_WOMAN = { neck: .17, ribLo: .45, ribHi: .55, waist: .41, pelvis: .38, uArm: .18, elbow: .14, fArm: .14, wrist: .095, hand: .12, thigh: .33, knee: .2, shin: .21, ankle: .11, foot: .13, toe: .1, skull: .43, jaw: .25 };
const wk = (W, k) => Object.fromEntries(Object.entries(W).map(([n, v]) => [n, n === 'skull' || n === 'jaw' ? v : v * k]));
export const BUILDS = {
  man:     { heads: 7.5, ankle: .35, shin: 1.7, thigh: 1.8, abd: .7, chest: .7, upper: .95, neck: .3, sh: 1.0, hip: .45, uArm: 1.45, fArm: 1.2, hand: .75, foot: 1.05, heel: .25, W: W_MAN },
  woman:   { heads: 7.25, ankle: .33, shin: 1.62, thigh: 1.75, abd: .7, chest: .65, upper: .9, neck: .3, sh: .84, hip: .5, uArm: 1.38, fArm: 1.12, hand: .7, foot: .95, heel: .22, W: W_WOMAN },
  // an older man: a little shorter, and a stoop that every pose inherits (added to the pose's own angles)
  elder:   { heads: 7.1, ankle: .33, shin: 1.6, thigh: 1.72, abd: .65, chest: .65, upper: .9, neck: .25, sh: .95, hip: .45, uArm: 1.4, fArm: 1.15, hand: .72, foot: 1.0, heel: .24, W: wk(W_MAN, .95),
             posture: { waist: [8, 0, 0], chest: [10, 0, 0], neck: [18, 0, 0], head: [-16, 0, 0], lKnee: 7, rKnee: 7, lLeg: [4, 0, 0], rLeg: [4, 0, 0] } },
  elderW:  { heads: 6.9, ankle: .31, shin: 1.55, thigh: 1.68, abd: .66, chest: .62, upper: .85, neck: .25, sh: .8, hip: .5, uArm: 1.33, fArm: 1.08, hand: .68, foot: .92, heel: .21, W: wk(W_WOMAN, 1.05),
             posture: { waist: [8, 0, 0], chest: [12, 0, 0], neck: [18, 0, 0], head: [-15, 0, 0], lKnee: 7, rKnee: 7, lLeg: [4, 0, 0], rLeg: [4, 0, 0] } },
  teen:    { heads: 6.8, ankle: .32, shin: 1.55, thigh: 1.6, abd: .62, chest: .6, upper: .82, neck: .29, sh: .8, hip: .44, uArm: 1.3, fArm: 1.05, hand: .65, foot: .9, heel: .2, W: wk(W_WOMAN, .9) },
  // about six years old: big head, short legs, no waist
  child:   { heads: 5.4, ankle: .25, shin: 1.05, thigh: 1.15, abd: .55, chest: .5, upper: .68, neck: .22, sh: .64, hip: .38, uArm: .95, fArm: .8, hand: .5, foot: .72, heel: .16, W: { ...wk(W_MAN, .62), waist: .4, ribLo: .4, ribHi: .42, pelvis: .26, skull: .46, jaw: .26 } },
  toddler: { heads: 3.9, ankle: .18, shin: .62, thigh: .7, abd: .42, chest: .38, upper: .5, neck: .1, sh: .5, hip: .3, uArm: .65, fArm: .55, hand: .35, foot: .5, heel: .1, W: { ...wk(W_MAN, .5), waist: .38, ribLo: .37, ribHi: .36, pelvis: .24, thigh: .22, uArm: .14, fArm: .12, skull: .47, jaw: .28 } },
  // cartoon canon: 2.5 heads, stubby limbs (chibi / super-deformed)
  chibi:   { heads: 2.5, ankle: .08, shin: .3, thigh: .3, abd: .25, chest: .2, upper: .32, neck: .05, sh: .36, hip: .2, uArm: .4, fArm: .32, hand: .2, foot: .32, heel: .06, W: { ...wk(W_MAN, .33), waist: .28, ribLo: .27, ribHi: .28, pelvis: .2, thigh: .13, shin: .12, uArm: .1, fArm: .09, hand: .09, foot: .09, skull: .5, jaw: .3 } },
};
const buildOf = b => typeof b === 'string' ? (BUILDS[b] || BUILDS.man) : b;
export const height = b => { const B = buildOf(b); return B.ankle + B.shin + B.thigh + B.abd + B.chest + B.upper + B.neck + 1; };
// scale a build: BUILD('man', { heads tall stays, sh: 1.1, W: { waist: .6 } }) — heavier, broader, slimmer variants
export function variant(b, o = {}) { const B = buildOf(b); return { ...B, ...o, W: { ...B.W, ...(o.W || {}) } }; }

// ---------- skeleton ----------
// [joint, parent, rest offset in the parent's frame]. A joint's own rotation turns everything below it.
const SKEL = [
  ['pelvis', null, () => [0, 0, 0]],
  ['spine', 'pelvis', B => [0, B.abd, 0]],          // waist (navel)
  ['chest', 'spine', B => [0, B.chest, 0]],         // mid-back
  ['neck', 'chest', B => [0, B.upper, 0]],          // base of the neck, between the collarbones
  ['head', 'neck', B => [0, B.neck, 0]],            // top of the neck, at chin level
  ['top', 'head', () => [0, 1, 0]],                 // crown
  ['lClav', 'chest', B => [0, B.upper, 0]], ['rClav', 'chest', B => [0, B.upper, 0]],
  ['lSh', 'lClav', B => [B.sh, -.14, -.04]], ['rSh', 'rClav', B => [-B.sh, -.14, -.04]],
  ['lEl', 'lSh', B => [0, -B.uArm, 0]], ['rEl', 'rSh', B => [0, -B.uArm, 0]],
  ['lWr', 'lEl', B => [0, -B.fArm, 0]], ['rWr', 'rEl', B => [0, -B.fArm, 0]],
  ['lFi', 'lWr', B => [0, -B.hand, 0]], ['rFi', 'rWr', B => [0, -B.hand, 0]],    // fingertips
  ['lHip', 'pelvis', B => [B.hip, 0, 0]], ['rHip', 'pelvis', B => [-B.hip, 0, 0]],
  ['lKn', 'lHip', B => [0, -B.thigh, 0]], ['rKn', 'rHip', B => [0, -B.thigh, 0]],
  ['lAn', 'lKn', B => [0, -B.shin, 0]], ['rAn', 'rKn', B => [0, -B.shin, 0]],
  ['lTo', 'lAn', B => [0, -B.ankle, B.foot - B.heel]], ['rTo', 'rAn', B => [0, -B.ankle, B.foot - B.heel]],
  ['lHe', 'lAn', B => [0, -B.ankle, -B.heel]], ['rHe', 'rAn', B => [0, -B.ankle, -B.heel]],
];
export const JOINTS = SKEL.map(s => s[0]);

// ---------- poses ----------
// A pose is plain data, in degrees; anything missing is 0 (standing straight, arms hanging, palms in):
//   hips/waist/chest/neck: [bend forward, side (toward own left), turn (toward own left)]   head: [nod down, tilt, turn]
//   at: [x, y, z] (moves the body; y only matters with ground: 'none')
//   lArm/rArm: [raise sideways, forward, twist]  (raise 90 = T-pose, forward 90 = pointing ahead, 180 = straight up)
//   lElbow/rElbow: bend  ·  lWrist/rWrist: [bend, side]  ·  lClav/rClav: [up, forward] (shrug)
//   lLeg/rLeg: [forward, out, twist (knee out)]  ·  lKnee/rKnee: bend  ·  lFoot/rFoot: point (toes down +)
//   lHand/rHand: 'open' | 'relaxed' | 'fist' | 'point' | 'flat' (a label: the mannequin draws it, styles may too)
//   reach: { lHand|rHand|lFoot|rFoot: { at: joint, off: [x,y,z] in that joint's frame, pole?, dir?, w? } }
//     puts the wrist (or ankle) on a point of the body: hands on hips, hand to chin, palms together.
//     pole = where the elbow/knee points (chest/pelvis frame), dir = which way the fingers point (in `at`'s frame).
//   ground: 'auto' (default: the lowest part touches y = 0) | 'feet' | 'none'
const TRUNK = ['hips', 'waist', 'chest', 'neck', 'head'];
function locals(p) {
  const L = {}, a = k => p[k] || [0, 0, 0], n = k => p[k] || 0;
  const trunk = v => mul(ry(v[2] || 0), mul(rx(v[0] || 0), rz(-(v[1] || 0))));
  L.pelvis = trunk(a('hips')); L.spine = trunk(a('waist')); L.chest = trunk(a('chest')); L.neck = trunk(a('neck')); L.head = trunk(a('head'));
  for (const [s, k] of [['l', 1], ['r', -1]]) {
    const c = a(s + 'Clav'), A = a(s + 'Arm'), w = a(s + 'Wrist'), g = a(s + 'Leg');
    L[s + 'Clav'] = mul(rx(-(c[1] || 0) * .5), rz(k * (c[0] || 0) * .5));
    L[s + 'Sh'] = mul(rx(-(A[1] || 0)), mul(rz(k * (A[0] || 0)), ry(k * (A[2] || 0))));
    L[s + 'El'] = rx(-n(s + 'Elbow'));
    L[s + 'Wr'] = mul(rx(-(w[0] || 0)), rz(k * (w[1] || 0)));
    L[s + 'Hip'] = mul(rx(-(g[0] || 0)), mul(rz(k * (g[1] || 0)), ry(k * (g[2] || 0))));
    L[s + 'Kn'] = rx(n(s + 'Knee'));
    L[s + 'An'] = rx(n(s + 'Foot'));
  }
  return L;
}

// add two poses angle by angle (b on top of a): used for a build's posture and for layering (breath, a nod)
export function addPose(a = {}, b = {}) {
  const o = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (k === 'reach') o.reach = { ...(a.reach || {}), ...v };
    else if (typeof v === 'number') o[k] = (a[k] || 0) + v;
    else if (Array.isArray(v) && (a[k] == null || Array.isArray(a[k]))) o[k] = v.map((x, i) => ((a[k] || [])[i] || 0) + x);
    else if (a[k] == null) o[k] = v;
  }
  return o;
}

// blend two poses: angles interpolate, labels switch at the middle, reach targets fade with their weight
export function blend(a = {}, b = {}, t) {
  const o = {}, keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const x = a[k], y = b[k];
    if (k === 'reach') {
      const R = {}, A = x || {}, Bq = y || {};
      for (const e of new Set([...Object.keys(A), ...Object.keys(Bq)])) {
        const p = A[e], q = Bq[e], wp = p ? (p.w ?? 1) : 0, wq = q ? (q.w ?? 1) : 0;
        const base = p && q ? (t < .5 ? p : q) : (p || q);
        R[e] = { ...base, w: lerp(wp, wq, t) };
        if (p && q && p.at === q.at) { R[e].off = mix3(p.off || [0, 0, 0], q.off || [0, 0, 0], t); if (p.dir && q.dir) R[e].dir = mix3(p.dir, q.dir, t); }
      }
      o.reach = R;
    } else if (typeof x === 'string' || typeof y === 'string') o[k] = t < .5 ? (x ?? y) : (y ?? x);
    else if (Array.isArray(x) || Array.isArray(y)) { const n = Math.max((x || []).length, (y || []).length); o[k] = Array.from({ length: n }, (_, i) => lerp((x || [])[i] || 0, (y || [])[i] || 0, t)); }
    else o[k] = lerp(x || 0, y || 0, t);
  }
  return o;
}

// keyframed performance: keys = [[t, pose], ...] (pose may be a POSES name); each move eases in and out.
// Hold a pose by repeating it. ease(u) can be swapped (e.g. back() for an overshoot).
export function poseTrack(keys, ease = eio) {
  const K = keys.map(([t, p]) => [t, typeof p === 'string' ? POSES[p] : p]);
  return t => {
    if (t <= K[0][0]) return K[0][1];
    for (let i = 0; i < K.length - 1; i++) if (t <= K[i + 1][0]) return blend(K[i][1], K[i + 1][1], ease(seg(t, K[i][0], K[i + 1][0])));
    return K[K.length - 1][1];
  };
}

// the same pose with left and right swapped
export function mirror(p) {
  const o = {}, sw = k => k[0] === 'l' && /^[A-Z]/.test(k[1]) ? 'r' + k.slice(1) : k[0] === 'r' && /^[A-Z]/.test(k[1]) ? 'l' + k.slice(1) : k;
  for (const [k, v] of Object.entries(p)) {
    if (TRUNK.includes(k)) o[k] = [v[0] || 0, -(v[1] || 0), -(v[2] || 0)];
    else if (k === 'at') o[k] = [-(v[0] || 0), v[1] || 0, v[2] || 0];
    else if (k === 'reach') { o.reach = {}; for (const [e, r] of Object.entries(v)) o.reach[sw(e)] = { ...r, at: sw(r.at), off: r.off && [-r.off[0], r.off[1], r.off[2]], pole: r.pole && [-r.pole[0], r.pole[1], r.pole[2]], dir: r.dir && [-r.dir[0], r.dir[1], r.dir[2]] }; }
    else o[sw(k)] = v;
  }
  return o;
}

// ---------- solve ----------
const CHAINS = { lHand: ['lSh', 'lEl', 'lWr', ['lFi']], rHand: ['rSh', 'rEl', 'rWr', ['rFi']], lFoot: ['lHip', 'lKn', 'lAn', ['lTo', 'lHe']], rFoot: ['rHip', 'rKn', 'rAn', ['rTo', 'rHe']] };
// two-bone reach: moves the middle and end joints so the end sits on `target`; the elbow/knee bends toward `pole`
function ik(P, R, chain, target, pole, dir, w) {
  const [a, b, c, tips] = chain, A = P[a], l1 = len(sub(P[b], A)), l2 = len(sub(P[c], P[b]));
  const d = sub(target, A), dc = clamp(len(d), Math.abs(l1 - l2) + 1e-4, l1 + l2 - 1e-4), u = norm(d);
  let v = sub(pole, scl(u, dot(pole, u))); if (len(v) < 1e-6) v = [0, 0, 1]; v = norm(v);
  const ca = clamp((l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc), -1, 1), sa = Math.sqrt(1 - ca * ca);
  const B2 = add(A, add(scl(u, ca * l1), scl(v, sa * l1))), C2 = add(A, scl(u, dc));
  const tipOff = tips.map(t => sub(P[t], P[c])), fore = norm(sub(C2, B2));
  if (w > .5) {      // carry the joint frames along, so thumbs and feet keep a sensible orientation
    const r1 = rotBetween(norm(sub(P[b], A)), norm(sub(B2, A))), r2 = rotBetween(norm(sub(P[c], P[b])), fore);
    R[a] = mul(r1, R[a]); R[b] = mul(r2, R[b]);
    if (c.endsWith('Wr')) { R[c] = mul(r2, R[c]); if (dir) R[c] = mul(rotBetween(fore, norm(dir)), R[c]); }
  }
  P[b] = mix3(P[b], B2, w); const C0 = P[c]; P[c] = mix3(C0, C2, w);
  tips.forEach((t, i) => {
    let nt;
    if (c.endsWith('Wr')) nt = add(P[c], scl(dir ? norm(dir) : fore, len(tipOff[i])));   // a hand follows the forearm or `dir`
    else nt = add(P[c], tipOff[i]);                                                        // a foot keeps its angle (planted flat)
    P[t] = mix3(add(C0, tipOff[i]), nt, w);
  });
}

// pose (+ build) → 3D joints. o.reach adds targets in final (grounded) body space: { lHand: { to: [x,y,z], pole, dir, w } }
export function solve(pose = {}, build = 'man', o = {}) {
  const B = buildOf(build); if (typeof pose === 'string') pose = POSES[pose];
  const p = B.posture ? addPose(pose, B.posture) : pose, L = locals(p), P = {}, R = {}, at = p.at || [0, 0, 0];
  for (const [n, par, off] of SKEL) {
    if (!par) { P[n] = [at[0], B.ankle + B.shin + B.thigh + (at[1] || 0), at[2] || 0]; R[n] = L[n]; continue; }
    P[n] = add(P[par], app(R[par], off(B))); R[n] = mul(R[par], L[n] || I3);
  }
  const reachAll = (spec, absolute) => {
    for (const [e, r] of Object.entries(spec || {})) {
      const ch = CHAINS[e]; if (!ch || (r.w ?? 1) <= 0) continue;
      const frame = r.at ? R[r.at] : I3, target = absolute ? r.to : add(P[r.at], app(R[r.at], r.off || [0, 0, 0]));
      const side = e[0] === 'l' ? 1 : -1, arm = e.endsWith('Hand');
      const pole = app(arm ? R.chest : R.pelvis, r.pole || (arm ? [side * .5, -.3, -1] : [0, 0, 1]));
      const dir = r.dir ? app(absolute ? I3 : frame, r.dir) : null;
      ik(P, R, ch, target, pole, dir, r.w ?? 1);
    }
  };
  reachAll(p.reach, false);
  const sk = { P, R, B, pose: p };
  const g = o.ground ?? p.ground ?? 'auto';
  if (g !== 'none') { const y0 = lowest(sk, g === 'feet'); for (const k in P) P[k] = [P[k][0], P[k][1] - y0, P[k][2]]; }
  if (o.reach) reachAll(o.reach, true);
  derive(sk);
  return sk;
}

// lowest surface point (joint height minus the capsule radius there)
function lowest(sk, feetOnly) {
  const { P, B } = sk, W = B.W; let m = Infinity;
  const t = (k, r) => { m = Math.min(m, P[k][1] - r); };
  for (const s of ['l', 'r']) { t(s + 'To', 0); t(s + 'He', 0); if (!feetOnly) { t(s + 'Kn', W.knee); t(s + 'Fi', W.hand * .6); t(s + 'El', W.elbow); t(s + 'Wr', W.wrist); t(s + 'Hip', W.pelvis); } }
  if (!feetOnly) { t('pelvis', W.pelvis * 1.1); t('spine', W.waist * .85); t('chest', W.ribLo * .9); t('neck', W.neck); t('top', W.skull * .3); t('head', W.jaw); }
  return m;
}

// points the capsules need besides the joints: rib cage, pelvis block, skull and jaw
function derive(sk) {
  const { P, R, B } = sk;
  const W = B.W;
  P.ribLo = mix3(P.spine, P.chest, .45); P.ribHi = add(P.neck, app(R.chest, [0, -W.ribHi * .92, -.02]));
  for (const s of ['l', 'r']) {   // the sole points are on the ground; the foot's capsule runs just above them
    P[s + 'ToU'] = add(P[s + 'To'], app(R[s + 'An'], [0, W.foot * .75, 0])); P[s + 'HeU'] = add(P[s + 'He'], app(R[s + 'An'], [0, W.foot, .04]));
  }
  P.lPv = add(P.lHip, app(R.pelvis, [-.12, .1, 0])); P.rPv = add(P.rHip, app(R.pelvis, [.12, .1, 0]));
  P.skull = add(P.head, app(R.head, [0, .58, -.04])); P.chin = add(P.head, app(R.head, [0, .1, .2]));
  P.face = app(R.head, [0, 0, 1]); P.up = app(R.head, [0, 1, 0]);
  P.lTh = mix3(P.lWr, P.lFi, .35); P.rTh = mix3(P.rWr, P.rFi, .35);
}

// ---------- camera ----------
// cam: { yaw (0 = facing the camera, 90 = facing screen right, 180 = back, -90 = facing left),
//        pitch (camera height: + looks down from above, - looks up from below), px (pixels per head),
//        x, y (screen point of the body-space origin on the ground), persp (camera distance in heads; 0 = flat), aim (height the lens points at) }
export function view(sk, cam = {}) {
  const ya = cam.yaw ?? 0, pi = cam.pitch ?? 0, px = cam.px ?? 100, X = cam.x ?? 960, Y = cam.y ?? 980, dist = cam.persp || 0, aim = cam.aim ?? (sk.B ? sk.B.heads * .5 : 3.5);
  const M = mul(rx(pi), ry(ya)), J = { _M: M, _px: px, _cam: { M, X, Y, px, dist, a: app(M, [0, aim, 0]) } };
  for (const [k, p] of Object.entries(sk.P)) if (k !== 'face' && k !== 'up') J[k] = project(J, p);
  if (sk.P.face) { J._face = app(M, sk.P.face); J._up = app(M, sk.P.up); }
  return J;
}
// any body-space point through the same camera as J → [x, y, depth (+ = nearer), perspective scale]
export function project(J, p) {
  const { M, X, Y, px, dist, a } = J._cam, q = app(M, p), s = dist ? dist / Math.max(.2 * dist, dist - (q[2] - a[2])) : 1;
  return [X + (a[0] + (q[0] - a[0]) * s) * px, Y - (a[1] + (q[1] - a[1]) * s) * px, q[2], s];
}

// ---------- parts: what a style paints ----------
// Capsules from joint a to joint b with radii ra → rb (pixels), sorted far to near (painter's order).
// side: 'l' | 'r' | 'c'; near: true for the limb on the camera's side. Limbs sit a hair in front of the trunk.
const PARTS = [
  // id, a, b, ra, rb, side, bias
  // sloping shoulders (neck base out to each shoulder joint), not a straight bar
  ['lShoulder', 'neck', 'lSh', 'neck', 'uArm', 'c', -.01], ['rShoulder', 'neck', 'rSh', 'neck', 'uArm', 'c', -.01],
  ['pelvis', 'lPv', 'rPv', 'pelvis', 'pelvis', 'c', 0],
  ['belly', 'pelvis', 'chest', 'waist', 'waist', 'c', .02],
  ['ribs', 'ribLo', 'ribHi', 'ribLo', 'ribHi', 'c', .04],
  ['neck', 'neck', 'head', 'neck', 'neck', 'c', .05],
  ['head', 'chin', 'skull', 'jaw', 'skull', 'c', .3],
];
for (const s of ['l', 'r']) PARTS.push(
  [s + 'Thigh', s + 'Hip', s + 'Kn', 'thigh', 'knee', s, .12], [s + 'Shin', s + 'Kn', s + 'An', 'knee', 'ankle', s, .13], [s + 'Foot', s + 'HeU', s + 'ToU', 'foot', 'toe', s, .14],
  [s + 'UpperArm', s + 'Sh', s + 'El', 'uArm', 'elbow', s, .15], [s + 'Forearm', s + 'El', s + 'Wr', 'elbow', 'wrist', s, .16], [s + 'Hand', s + 'Wr', s + 'Fi', 'wrist', 'hand', s, .17]);
export function parts(sk, J) {
  const W = sk.B.W, px = J._px, o = [];
  for (const [id, a, b, ra, rb, side, bias] of PARTS) {
    let B2 = J[b], rB = W[rb];
    const hand = id.endsWith('Hand') && (sk.pose[id] || 'open');
    if (hand === 'fist') { B2 = lerpJ(J[a], J[b], .5); rB *= 1.1; } else if (hand) B2 = lerpJ(J[a], J[b], hand === 'point' ? .95 : .85);   // fingers curl a little: the mitten stops short of the tips
    o.push({ id, side, a: J[a], b: B2, ra: W[ra] * px * J[a][3], rb: rB * px * B2[3], z: (J[a][2] + J[b][2]) / 2 + bias, hand: hand || null });
  }
  // the trunk is one block: its pieces keep a fixed inner order at the block's depth (a mean per piece breaks in high and low views)
  const zt = (o.find(q => q.id === 'ribs').z + o.find(q => q.id === 'belly').z) / 2;
  ['lShoulder', 'rShoulder', 'pelvis', 'belly', 'ribs', 'neck'].forEach((id, i) => { o.find(q => q.id === id).z = zt + i * .001; });
  const hd = o.find(q => q.id === 'head'); hd.z = Math.max(hd.z, zt + .01);
  const nearX = J.lSh[2] > J.rSh[2] ? 'l' : 'r';
  for (const q of o) q.near = q.side === 'c' || q.side === nearX;
  return o.sort((p, q) => p.z - q.z);
}
const lerpJ = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];

// ---------- balance ----------
// centre of mass (segment masses after Dempster) and the support polygon on the ground.
// inside: false means the figure would topple unless it is moving, leaning on something or held.
const MASS = [['skull', 'chin', .081], ['ribLo', 'ribHi', .216], ['pelvis', 'chest', .139], ['lPv', 'rPv', .142],
  ...['l', 'r'].flatMap(s => [[s + 'Sh', s + 'El', .028], [s + 'El', s + 'Wr', .016], [s + 'Wr', s + 'Fi', .006], [s + 'Hip', s + 'Kn', .1], [s + 'Kn', s + 'An', .0465], [s + 'He', s + 'To', .0145]])];
export function balance(sk, tol = .12) {
  const P = sk.P; let c = [0, 0, 0], m = 0;
  for (const [a, b, w] of MASS) { c = add(c, scl(mix3(P[a], P[b], .5), w)); m += w; }
  c = scl(c, 1 / m);
  const pts = [];
  for (const k of ['lTo', 'lHe', 'rTo', 'rHe', 'lKn', 'rKn', 'lFi', 'rFi', 'lWr', 'rWr', 'pelvis', 'lPv', 'rPv', 'lEl', 'rEl']) if (P[k][1] < tol + .35 * (k.includes('Kn') || k.includes('Pv') || k === 'pelvis' ? 1 : 0)) pts.push([P[k][0], P[k][2]]);
  const hull = convex(pts), out = hull.length ? outside([c[0], c[2]], hull) : Infinity;
  return { com: c, support: hull, inside: out <= tol, off: out };
}
function convex(p) {
  if (p.length < 3) return p.slice();
  p = p.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// distance from q to the polygon (0 inside)
function outside(q, h) {
  const segD = (a, b) => { const dx = b[0] - a[0], dz = b[1] - a[1], L = dx * dx + dz * dz || 1, t = clamp(((q[0] - a[0]) * dx + (q[1] - a[1]) * dz) / L); return Math.hypot(q[0] - a[0] - t * dx, q[1] - a[1] - t * dz); };
  if (h.length === 1) return Math.hypot(q[0] - h[0][0], q[1] - h[0][1]);
  if (h.length === 2) return segD(h[0], h[1]);
  let inside = true, d = Infinity;
  for (let i = 0; i < h.length; i++) { const a = h[i], b = h[(i + 1) % h.length]; if ((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]) < 0) inside = false; d = Math.min(d, segD(a, b)); }
  return inside ? 0 : d;
}

// ---------- cycles ----------
// walk(phase): phase in radians, one stride per 2π (left foot forward at 0). stride ≈ 1.15 heads per step for an adult;
// move the figure by walkSpeed(build) × phase / 2π so the planted foot doesn't slide.
export function walk(ph, o = {}) {
  const k = o.amount ?? 1, arms = o.arms ?? 1, s = Math.sin(ph), c = Math.cos(ph);
  const knee = x => 8 + 55 * Math.max(0, Math.sin(x + 1.25)) ** 2;           // the swing leg folds; the stance leg stays nearly straight
  return {
    hips: [3 * k, 3 * k * Math.sin(2 * ph), -7 * k * s], waist: [2, 0, 0], chest: [2, 0, 9 * k * s], head: [-3, 0, -2 * k * s],
    lLeg: [24 * k * s, 2, 0], rLeg: [-24 * k * s, 2, 0], lKnee: knee(ph) * k, rKnee: knee(ph + Math.PI) * k,
    lFoot: -10 * k * c, rFoot: 10 * k * c,
    lArm: [6, -20 * k * arms * s, 0], rArm: [6, 20 * k * arms * s, 0], lElbow: 15 + 10 * Math.max(0, -s) * arms, rElbow: 15 + 10 * Math.max(0, s) * arms,
    lHand: 'relaxed', rHand: 'relaxed', ground: 'feet',
  };
}
export const walkSpeed = b => { const B = buildOf(b); return 2 * 2 * (B.thigh + B.shin) * Math.sin(24 * D); };   // heads per cycle (two steps)
export function run(ph, o = {}) {
  const k = o.amount ?? 1, s = Math.sin(ph), c = Math.cos(ph);
  const knee = x => 25 + 90 * Math.max(0, Math.sin(x + 1.0)) ** 1.5;
  return {
    hips: [12 * k, 0, -9 * k * s], waist: [6 * k, 0, 0], chest: [4, 0, 12 * k * s], neck: [-6, 0, 0], head: [-4, 0, -3 * k * s],
    lLeg: [40 * k * s + 10, 3, 0], rLeg: [-40 * k * s + 10, 3, 0], lKnee: knee(ph) * k, rKnee: knee(ph + Math.PI) * k,
    lFoot: -15 * c * k, rFoot: 15 * c * k,
    lArm: [10, -45 * k * s, 0], rArm: [10, 45 * k * s, 0], lElbow: 85, rElbow: 85, lHand: 'fist', rHand: 'fist',
    at: [0, .25 * k * Math.abs(Math.sin(ph)), 0], ground: 'none',
  };
}

export { POSES, CATS } from './poses.js';

// ---------- the mannequin ----------
// A neutral check figure (white capsules, ink outline, joint balls, face cross on the head): draw it to judge a pose,
// a camera angle or a balance before the style's own drawing goes over it.
function capsule(c, a, b, ra, rb) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  c.beginPath();
  if (L <= Math.abs(ra - rb) + .5) { const [p, r] = ra > rb ? [a, ra] : [b, rb]; c.arc(p[0], p[1], r, 0, Math.PI * 2); return; }
  const th = Math.atan2(dy, dx), ph = Math.acos(clamp((ra - rb) / L, -1, 1));
  c.arc(a[0], a[1], ra, th + ph, th + Math.PI * 2 - ph); c.arc(b[0], b[1], rb, th - ph, th + ph); c.closePath();
}
export { capsule };
export function mannequin(c, sk, J, o = {}) {
  const ink = o.ink || '#2a2622', fill = o.fill || '#fbfaf7', far = o.far || '#e6e2da', lw = o.lw ?? Math.max(1.2, J._px * .022), W = sk.B.W, px = J._px;
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  for (const q of parts(sk, J)) {
    c.fillStyle = q.near ? fill : far; c.strokeStyle = ink; c.lineWidth = lw;
    capsule(c, q.a, q.b, q.ra, q.rb); c.fill(); c.stroke();
    if (q.id.endsWith('Hand') && q.hand !== 'fist') {          // a thumb, so the hand reads as left or right and shows its palm
      const s = q.side, P = sk.P, hd = norm(sub(P[s + 'Fi'], P[s + 'Wr'])), fw = app(sk.R[s + 'Wr'], [0, 0, 1]);
      const tw = norm(sub(fw, scl(hd, dot(fw, hd)))), base = add(P[s + 'Wr'], scl(hd, sk.B.hand * .15));
      const tip = add(base, add(scl(hd, sk.B.hand * .3), scl(tw, sk.B.hand * .42))), r = W.hand * .36 * px;
      capsule(c, projectOne(base, J, sk), projectOne(tip, J, sk), r, r * .8); c.fill(); c.stroke();
    }
    if (/UpperArm|Thigh/.test(q.id)) { const j = J[q.id.includes('Arm') ? q.side + 'El' : q.side + 'Kn'], r = (q.id.includes('Arm') ? W.elbow : W.knee) * px * .92; c.beginPath(); c.arc(j[0], j[1], r, 0, Math.PI * 2); c.fill(); c.stroke(); }
    if (/Forearm|Shin/.test(q.id)) { const j = J[q.id.includes('Fore') ? q.side + 'Wr' : q.side + 'An'], r = (q.id.includes('Fore') ? W.wrist : W.ankle) * px * 1.02; c.beginPath(); c.arc(j[0], j[1], r, 0, Math.PI * 2); c.fill(); c.stroke(); }
    if (q.id === 'head') faceCross(c, sk, J, ink, lw * .7);
  }
  c.restore();
}
const projectOne = (p, J) => project(J, p);
// the face's centre line and eye line on the skull, front half only: they show where the head looks
function faceCross(c, sk, J, ink, lw) {
  const R = sk.R.head, S = sk.P.skull, r = sk.B.W.skull * 1.0, vis = n => app(J._M, n)[2] > 0;
  const line = pts => { c.beginPath(); let on = false; for (const [p, n] of pts) { if (vis(n)) { const q = projectOne(p, J, sk); on ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); on = true; } else on = false; } c.stroke(); };
  const P = [], E = [];
  for (let i = 0; i <= 24; i++) { const b = (-70 + i * 6.5) * D, n = app(R, [0, Math.sin(b), Math.cos(b)]); P.push([add(S, scl(n, r)), n]); }
  for (let i = 0; i <= 24; i++) { const a = (-90 + i * 7.5) * D, n = app(R, [Math.sin(a) * .98, -.18, Math.cos(a) * .98]); E.push([add(S, scl(n, r)), n]); }
  c.strokeStyle = ink; c.lineWidth = lw; line(P); line(E);
}
