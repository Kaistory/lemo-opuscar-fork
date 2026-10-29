# core/figure: people drawn in code

A shared skeleton for any style that draws people: proportions by age and build, a pose library, any camera angle, reach IK for hands and feet, ground contact and balance, walk and run cycles, and a neutral mannequin to check a pose before the style paints over it. It gives you **where the body is**; the look (brush, cut paper, pixels, ink) stays the style's own code.

| File | What it is |
|---|---|
| `figure.js` | the engine: `solve`, `view`, `project`, `parts`, `mannequin`, `capsule`, `balance`, `blend`, `addPose`, `poseTrack`, `mirror`, `walk`, `run`, `walkSpeed`, `BUILDS`, `variant`, `height`, `JOINTS`, `v3` (vector helpers); re-exports `POSES`, `CATS` |
| `poses.js` | the pose library (plain data) |
| `sheet/` | a page for the render tools: pose sheets, build line-ups, cycles, balance |
| `pose_ref.py` | finds reference images in a local copy of a pose gallery, to look at while you author a pose |

Copy nothing: import from the library (`$LIB/core/figure/figure.js`), or copy the folder into the project if the film must stand alone.

## Quick start

```js
import { solve, view, parts, mannequin, POSES, mirror, blend } from '../../core/figure/figure.js';
const sk = solve(blend(POSES.stand, POSES.wave, k), 'woman');           // 3D joints, feet on the ground
const J = view(sk, { yaw: 40, px: H / 7.25, x: X, y: groundY });      // ¾ view; px = pixels per head
for (const p of parts(sk, J)) {                                        // capsules, far to near
  // p.id ('ribs', 'lForearm', 'head'…), p.a / p.b = [x, y, depth, scale], p.ra / p.rb in px, p.near, p.hand
  myBrushStroke(ctx, p.a, p.b, p.ra, p.rb, p.near ? SHIRT : SHIRT_SHADE);
}
if (DEBUG) mannequin(ctx, sk, J);                                      // the check figure
```

`J[joint]` holds every projected joint (`J.lWr`, `J.head`, `J.top`…) for props, faces and hair; `project(J, p)` projects any other body-space point through the same camera (a held bowl, a pole, a seat).

## Units and axes

Units are head heights (chin to crown = 1). Body space: +x = the figure's own left, +y = up, +z = the way it faces. Ground is y = 0.

Joints (`JOINTS`): `pelvis spine chest neck head top`, and per side `Clav Sh El Wr Fi` (fingertips), `Hip Kn An To He` (toe and heel are the sole points), e.g. `lSh`, `rKn`. `solve` adds construction points: `ribLo ribHi lPv rPv skull chin`, `lToU lHeU`, `lTh` (thumb base).

## The pose format

A pose is plain data in degrees; anything missing is 0 (standing straight, arms hanging, palms in).

| Key | Value |
|---|---|
| `hips`, `waist`, `chest`, `neck` | `[bend forward, side (toward own left), turn (toward own left)]` |
| `head` | `[nod down, tilt, turn]` |
| `lArm`, `rArm` | `[raise sideways, forward, twist]`: raise 90 = T-pose, forward 90 = pointing ahead, 180 = straight up |
| `lElbow`, `rElbow` | bend |
| `lWrist`, `rWrist` | `[bend, side]` |
| `lClav`, `rClav` | `[up, forward]` (shrug) |
| `lLeg`, `rLeg` | `[forward, out, twist (knee out)]` |
| `lKnee`, `rKnee` | bend |
| `lFoot`, `rFoot` | point (toes down +) |
| `lHand`, `rHand` | `'open'`, `'relaxed'`, `'fist'`, `'point'`, `'flat'`: a label the mannequin draws and a style may read |
| `at` | `[x, y, z]`: moves the body (y only counts with `ground: 'none'`) |
| `reach` | `{ lHand \| rHand \| lFoot \| rFoot: { at, off, pole?, dir?, w? } }` (below) |
| `ground` | `'auto'` (default: the lowest part touches y = 0), `'feet'`, `'none'` |

The shoulder applies abduction, then flexion (TECHNIQUE.md §10), so raised arms don't cross into an X.

| Function | What it does |
|---|---|
| `blend(a, b, t)` | angles interpolate, labels switch at t = .5, reach targets fade with their weight |
| `addPose(a, b)` | adds b's angles on top of a (layering: a breath, a nod, a build's stoop) |
| `poseTrack([[t, pose], …], ease = eio)` | keyframed performance; poses may be `POSES` names; repeat a pose to hold it |
| `mirror(p)` | left and right swapped |

### The library

`POSES` (`cat` field, `CATS` lists them): **stand** `stand contrapposto hands-on-hips arms-crossed hands-behind arms-up reach-up look-back shrug` · **gesture** `wave point think pray bow salute shh clap cheer face-in-hands offer` · **lean** `lean-on-knees pick-up` · **work** `carry-pole hoe-up hoe-down row-reach row-pull pound-up pound-down push` · **sit** `sit-chair sit-elbows-on-knees sit-cross-legged sit-hug-knees sit-lean-back sit-side sit-heels squat squat-work` · **kneel** `kneel kneel-one kneel-pray kneel-bow` · **lie** `lie-back lie-side lie-front` · **action** `jump-crouch jump-air throw-wind throw-release fall`.

Names say what the body does. Start from the nearest one and adjust; a film's own poses go in its project (`export const POSES = {…}`, and the sheet can show them with `?file=`). `sit-chair` and the like put no seat under the figure: draw it under the pelvis.

## Builds and proportions

`solve(pose, build)` takes a build name or object; `variant('man', { sh: 1.1, W: { waist: .6 } })` makes a broader or heavier one. `W` holds the capsule radii (in heads) that `parts` and the mannequin use. Landmarks, in heads from the ground:

| Build | Height | Knee | Hip joint | Waist | Shoulder line | Chin | Shoulders wide | Hips (joints) |
|---|---|---|---|---|---|---|---|---|
| `man` | 7.5 | 2.05 | 3.85 | 4.55 | 6.2 | 6.5 | 2.0 | 0.9 |
| `woman` | 7.25 | 1.95 | 3.7 | 4.4 | 5.95 | 6.25 | 1.68 | 1.0 |
| `elder` (stoops) | 7.1 | 1.93 | 3.65 | 4.3 | 5.85 | 6.1 | 1.9 | 0.9 |
| `elderW` (stoops) | 6.9 | 1.86 | 3.54 | 4.2 | 5.67 | 5.92 | 1.6 | 1.0 |
| `teen` | 6.8 | 1.87 | 3.47 | 4.09 | 5.51 | 5.8 | 1.6 | 0.88 |
| `child` (≈ 6 years) | 5.4 | 1.3 | 2.45 | 3.0 | 4.18 | 4.4 | 1.28 | 0.76 |
| `toddler` | 3.9 | 0.8 | 1.5 | 1.92 | 2.8 | 2.9 | 1.0 | 0.6 |
| `chibi` | 2.5 | 0.38 | 0.68 | 0.93 | 1.45 | 1.5 | 0.72 | 0.4 |

`elder` and `elderW` carry a `posture` (stoop, forward neck, soft knees) that is added to every pose. `height(build)` gives the standing height; `px = screenHeight / height(build)` sizes a figure.

## Camera

`view(sk, cam)` → `J`. `cam`:

| Field | Meaning |
|---|---|
| `yaw` | 0 = facing the camera, 90 = facing screen right, 180 = back, -90 = facing left, 40 = ¾ |
| `pitch` | camera height: + looks down from above, - looks up from below |
| `px` | pixels per head |
| `x`, `y` | screen point of the body-space origin on the ground |
| `persp` | camera distance in heads for perspective (0 = flat); 12–18 for high and low angles |
| `aim` | height the lens points at (default half the figure's height) |

A side-facing figure in an older 2D rig's `f = ±1` is `yaw: 90 * f`.

## Reach IK

`reach` puts the wrist (or ankle) on a point of the body, so hands stay on hips, chin or knees while the body moves:

```js
reach: { lHand: { at: 'pelvis', off: [.62, .38, .05], pole: [1, .2, -.4], dir: [-.2, -1, -.3] } }
```

- `at` + `off`: the joint, and an offset in that joint's frame (heads).
- `pole`: where the elbow or knee points (chest frame for arms, pelvis frame for legs). Default: elbows back and out, knees forward.
- `dir`: which way the fingers point (in `at`'s frame); default along the forearm. Feet keep their angle (planted flat).
- `w`: weight 0–1; `blend` fades it, for a hand that leaves the hip.

For targets in the scene (a table, a rope, the other character's hand), pass `solve(pose, build, { reach: { rHand: { to: [x, y, z], pole, dir, w } } })`: `to` is in final, grounded body space.

## Ground and balance

`ground: 'auto'` drops the figure until its lowest part (sole, knee, seat, hand, back) touches y = 0: sitting, kneeling and lying poses land without hand-tuned offsets. `'feet'` grounds on the soles only (walks, lunges); `'none'` leaves `at` alone (jumps, falls, a figure on a seat you place).

`balance(sk)` → `{ com, support, inside, off }`: the centre of mass (segment masses after Dempster) and the convex support polygon of whatever touches the ground. `inside: false` means the figure would topple unless it is moving, leaning on something or held: fix the pose (shift the hips over the standing foot) or give it the support.

## Cycles

- `walk(phase, { amount, arms })`, `run(phase, { amount })`: one stride per 2π, left foot forward at 0. They return poses, so `blend` and `addPose` work on them (a tired walk: `addPose(walk(ph), { chest: [12, 0, 0] })`).
- Move the figure by `walkSpeed(build) × phase / 2π` heads, or the planted foot slides. `run` sets `ground: 'none'` and lifts itself in the flight phase.

## The sheet page

`core/figure/sheet/` renders with the page tools (still at t = 0). One scale for the whole sheet, so proportions compare.

| Query | Shows |
|---|---|
| `poses=all` \| `stand,contrapposto` \| `cat:sit` | which poses |
| `views=front,diag,side,back,high,low,left,diagL` or `30:-20` (yaw:pitch) | which views; several views make one row per pose |
| `build=woman` | the build for every cell |
| `builds=man,woman,child` | line-up on a head grid |
| `cycle=walk&n=8` | phases of a cycle |
| `anim=walk` | `render(t)` plays the cycle (`DUR` 4 s) |
| `balance=1` | centre of mass and support: green inside, red outside |
| `file=<module URL>` | adds a film's own `POSES` |
| `cols=6` | column count |

```sh
node core/render/still.mjs core/figure/sheet 0 --q 'builds=man,woman,elder,child' --out films/<name>/stills --prefix lineup_
node core/render/still.mjs core/figure/sheet 0 --q 'poses=contrapposto,pray,squat&views=front,diag,side,back,high,low&build=woman' --out films/<name>/stills --prefix poses_
node core/render/still.mjs core/figure/sheet 0 --q 'cycle=walk&n=8&views=side' --out films/<name>/stills --prefix walk_
node core/render/still.mjs core/figure/sheet 0 --q 'poses=cat:kneel&balance=1' --out films/<name>/stills --prefix bal_
```

A film's own poses: `--q 'file=/films/<name>/poses.js&poses=…'`. The module must sit under the library root, which the tools serve; for a project elsewhere (skill mode), copy its `poses.js` to `$LIB/films/<name>/` for the check.

## Reference images

To author a new pose by eye, look at a reference first. `pose_ref.py` searches a local copy of the AI Pose Gallery (Chinese edition: mannequin line drawings, each pose from five angles):

```sh
git clone --depth 1 https://github.com/anhao/ai-pose-gallery-zh ~/ai-pose-gallery-zh     # ≈ 680 MB, once
.venv/bin/python core/figure/pose_ref.py --list                                          # categories and counts
.venv/bin/python core/figure/pose_ref.py kneel --views front,side --max 12 --out films/<name>/ref/kneel.jpg
```

`pose_ref.py <query…> [--gallery DIR] [--views …] [--max 12] [--big] [--out file] [--list]`. The gallery is found at `--gallery`, `$POSE_GALLERY` or `~/ai-pose-gallery-zh`. Queries take English, Vietnamese or Chinese words (stand, ngồi xổm, 跪) or pose ids; `--big` uses the 900×1200 originals instead of the thumbnails. Only the standard full-body series and the upper-body 可爱系 gestures are searchable; the gallery's adult series are excluded.

**Licence: look, never copy.** The gallery's images and data belong to their author (ギア, @giaaibusi) and carry no licence (non-commercial, rights reserved). Use them only as something to look at while you set angles in a pose: never trace them, never put them or anything derived from them (keypoints, crops, overlays) in a film, a repo or a release. The contact sheets `pose_ref.py` writes stay in the project's `ref/`, which is local. They are not credited, because nothing from them is in the film.
