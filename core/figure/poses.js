// poses.js · the pose library for core/figure/figure.js (plain data: the pose format is documented there).
// Authored by eye from life-drawing reference (front, ¾, side, high and low views checked on core/figure/sheet).
// Names say what the body does, not who does it; combine with addPose/blend, or start from one and adjust.
// cat: stand · gesture · lean · work · sit · kneel · lie · action
const H = (o, cat) => Object.assign(o, { cat });
// A leg's pitch turns its foot with it. flat(leg, knee, hips) is the foot angle that keeps the sole on the floor:
// leg = lLeg[0], knee = lKnee, hips = hips[0]. Add to it to rise on the toes (+) or lift the toes (−).
const flat = (leg, knee = 0, hips = 0) => leg - hips - knee;
// a reach offset given in world directions (x out, y up, z ahead), for a frame pitched forward by `deg`
// (the sum of the bends above it: e.g. a knee frame = hips − leg + knee). Returns the offset in that frame.
const tilt = (deg, [x, y, z]) => { const c = Math.cos(deg * Math.PI / 180), s = Math.sin(deg * Math.PI / 180); return [x, c * y + s * z, -s * y + c * z]; };
// hands meeting in front of the body (palms together, a bowl, a pole): wrist targets in the chest frame
const both = (off, pole, dir, at = 'chest') => ({ lHand: { at, off, pole, dir }, rHand: { at, off: [-off[0], off[1], off[2]], pole: [-pole[0], pole[1], pole[2]], dir: dir && [-dir[0], dir[1], dir[2]] } });

export const POSES = {
  // stand
  stand: H({ lArm: [6, 0, 0], rArm: [6, 0, 0], lElbow: 8, rElbow: 8, lHand: 'relaxed', rHand: 'relaxed' }, 'stand'),
  // weight on the right leg, foot under the body; that hip rises, the shoulders tilt back the other way, the free knee bends (contrapposto)
  contrapposto: H({ hips: [0, 4, 8], waist: [0, -3, -4], chest: [0, -5, -3], neck: [0, -2, 0], head: [3, 7, 4],
    rLeg: [0, -6, 0], rFoot: 0, lLeg: [12, 7, 4], lKnee: 38, lFoot: flat(12, 38) + 12,
    lArm: [8, 4, 0], rArm: [9, -4, 0], lElbow: 12, rElbow: 16, lHand: 'relaxed', rHand: 'relaxed' }, 'stand'),
  'hands-on-hips': H({ chest: [-3, 0, 0], head: [-2, 0, 0], lLeg: [0, 7, 6], rLeg: [0, 7, 6],
    reach: { lHand: { at: 'pelvis', off: [.62, .38, .05], pole: [1, .2, -.4], dir: [-.2, -1, -.3] }, rHand: { at: 'pelvis', off: [-.62, .38, .05], pole: [-1, .2, -.4], dir: [.2, -1, -.3] } }, lHand: 'flat', rHand: 'flat' }, 'stand'),
  'arms-crossed': H({ chest: [-2, 0, 0], head: [-3, 0, 0], lLeg: [0, 5, 0], rLeg: [0, 5, 0],
    reach: { lHand: { at: 'chest', off: [-.5, .12, .52], pole: [.6, -.6, .2], dir: [-1, .1, -.4] }, rHand: { at: 'chest', off: [.48, .26, .58], pole: [-.6, -.6, .2], dir: [1, .1, -.3] } }, lHand: 'flat', rHand: 'flat' }, 'stand'),
  'hands-behind': H({ chest: [-4, 0, 0], head: [-4, 0, 0], lLeg: [0, 4, 0], rLeg: [0, 4, 0],
    reach: { lHand: { at: 'pelvis', off: [.12, .1, -.62], pole: [1, -.5, .2], dir: [-.6, -.6, -.3] }, rHand: { at: 'pelvis', off: [-.12, .14, -.64], pole: [-1, -.5, .2], dir: [.6, -.6, -.3] } }, lHand: 'relaxed', rHand: 'fist' }, 'stand'),
  'arms-up': H({ chest: [-8, 0, 0], neck: [-6, 0, 0], head: [-10, 0, 0], lArm: [158, 10, 0], rArm: [158, 10, 0], lClav: [10, 0], rClav: [10, 0], lElbow: 6, rElbow: 6, lHand: 'open', rHand: 'open' }, 'stand'),
  // on tiptoe, one arm stretched up: the whole body leans a little so the weight stays over the toes
  'reach-up': H({ hips: [0, -4, 0], chest: [-6, 4, 0], head: [-22, 0, 0], lArm: [40, 168, 0], lClav: [30, 10], lElbow: 4, rArm: [8, 10, 0], rElbow: 20,
    lLeg: [-9, 0, 0], rLeg: [-9, 0, 0], lFoot: flat(-9) + 32, rFoot: flat(-9) + 32, lHand: 'open', rHand: 'relaxed', ground: 'feet' }, 'stand'),
  'look-back': H({ hips: [0, 3, 12], waist: [0, 0, 22], chest: [0, 0, 28], neck: [0, 0, 20], head: [4, 0, 35], lLeg: [4, 6, 10], rLeg: [-4, 4, 0], lKnee: 10, lFoot: flat(4, 10), rFoot: flat(-4),
    lArm: [10, -8, 0], rArm: [12, 12, 0], lElbow: 14, rElbow: 18, lHand: 'relaxed', rHand: 'relaxed' }, 'stand'),
  // shoulders up, elbows at the sides, forearms out with the palms up
  shrug: H({ lClav: [40, 10], rClav: [40, 10], head: [0, 10, 0], lArm: [-6, 14, 45], rArm: [-6, 14, 45], lElbow: 95, rElbow: 95, lWrist: [-25, 0], rWrist: [-25, 0], lHand: 'open', rHand: 'open', lLeg: [0, 5, 0], rLeg: [0, 5, 0] }, 'stand'),
  // gesture
  wave: H({ head: [0, 6, 6], lArm: [78, 22, 80], lElbow: 80, lClav: [20, 0], lHand: 'open', rArm: [8, 0, 0], rElbow: 10, rHand: 'relaxed', lLeg: [0, 6, 0], rLeg: [0, 4, 0] }, 'gesture'),
  point: H({ hips: [0, 0, 10], chest: [0, 0, 14], head: [0, 0, 12], lArm: [20, 82, 0], lElbow: 4, lClav: [10, 20], lHand: 'point', rArm: [8, -8, 0], rElbow: 14, rHand: 'relaxed', lLeg: [10, 6, 10], lKnee: 8, lFoot: flat(10, 8) }, 'gesture'),
  // fist under the chin, the other forearm across the waist holding the elbow
  think: H({ head: [12, 8, 0], neck: [6, 0, 0], chest: [4, 0, 0],
    reach: { rHand: { at: 'head', off: [-.05, -.4, .34], pole: [-.4, -1, .3], dir: [0, 1, .15] }, lHand: { at: 'chest', off: [-.45, -.45, .5], pole: [.6, -.6, 0], dir: [-1, .1, 0] } }, rHand: 'fist', lHand: 'flat', lLeg: [0, 5, 0], rLeg: [0, 5, 0] }, 'gesture'),
  // palms together in front of the chest: praying, greeting, asking (chắp tay)
  pray: H({ head: [14, 0, 0], neck: [6, 0, 0], reach: both([.05, .22, .62], [.8, -1, -.2], [-.08, 1, .25]), lHand: 'flat', rHand: 'flat' }, 'gesture'),
  // a bow from the hips; the hips go back so the weight stays over the feet
  bow: H({ hips: [26, 0, 0], waist: [16, 0, 0], chest: [8, 0, 0], neck: [6, 0, 0], head: [10, 0, 0], lLeg: [31, 0, 0], rLeg: [31, 0, 0], lFoot: flat(31, 0, 26), rFoot: flat(31, 0, 26),
    reach: both([.15, -.3, .55], [.8, -.6, -.3], [-.3, -1, .2], 'pelvis'), lHand: 'flat', rHand: 'flat' }, 'gesture'),
  salute: H({ chest: [-4, 0, 0], head: [-2, 0, 0], reach: { rHand: { at: 'head', off: [-.45, .58, .22], pole: [-1, -.1, 0], dir: [1, .25, .3] } }, rHand: 'flat', lArm: [4, 0, 0], lElbow: 4, lHand: 'flat' }, 'gesture'),
  // a finger to the lips
  shh: H({ head: [6, 6, 0], reach: { rHand: { at: 'head', off: [-.02, -.42, .42], pole: [-.4, -1, 0], dir: [0, 1, .05] } }, rHand: 'point', lArm: [8, 0, 0], lElbow: 12, lHand: 'relaxed' }, 'gesture'),
  clap: H({ head: [4, 0, 0], reach: both([.04, .02, .85], [.9, -1, 0], [-.2, .6, .8]), lHand: 'flat', rHand: 'flat' }, 'gesture'),
  cheer: H({ chest: [-10, 0, 0], head: [-12, 0, 0], lArm: [140, 18, -40], rArm: [140, 18, -40], lClav: [35, 0], rClav: [35, 0], lElbow: 30, rElbow: 30, lHand: 'fist', rHand: 'fist', lLeg: [0, 9, 0], rLeg: [0, 9, 0] }, 'gesture'),
  'face-in-hands': H({ waist: [8, 0, 0], chest: [10, 0, 0], neck: [12, 0, 0], head: [16, 0, 0], reach: both([.3, -.1, .3], [.4, -1, 0], [0, 1, .2], 'head'), lHand: 'flat', rHand: 'flat' }, 'gesture'),
  // hold something in both hands in front of the chest: a tray, a book, a bowl (offer)
  offer: H({ head: [12, 0, 0], waist: [4, 0, 0], reach: both([.3, -.2, .8], [1, -1, -.2], [0, .1, 1]), lHand: 'open', rHand: 'open' }, 'gesture'),
  // incense held in joined hands at the forehead, head bowed (thắp hương, vái)
  'offer-incense': H({ waist: [6, 0, 0], chest: [4, 0, 0], neck: [8, 0, 0], head: [14, 0, 0], reach: both([.04, .3, .62], [.9, -1, -.3], [-.05, 1, .3], 'head'), lHand: 'fist', rHand: 'fist' }, 'gesture'),
  // the phone at the right ear, head tilted to it
  'phone-call': H({ head: [4, -8, 0], hips: [0, 4, 0], lLeg: [0, 6, 0], rLeg: [0, 4, 0], reach: { rHand: { at: 'head', off: [-.5, .2, .12], pole: [-.3, -1, .6], dir: [.1, 1, .3] } }, rHand: 'fist', lArm: [8, 0, 0], lElbow: 10, lHand: 'relaxed' }, 'gesture'),
  // a bowl in the left hand, chopsticks lifted toward the mouth (ăn cơm)
  'eat-bowl': H({ head: [16, 0, 0], neck: [8, 0, 0], chest: [4, 0, 0],
    reach: { lHand: { at: 'chest', off: [.1, .05, .8], pole: [1, -1, -.3], dir: [-.6, .3, .5] }, rHand: { at: 'head', off: [-.15, -.5, .7], pole: [-1, -1, -.2], dir: [.5, .4, .2] } }, lHand: 'open', rHand: 'fist' }, 'gesture'),
  // lean
  // hands on the knees, back flat, head up
  'lean-on-knees': H({ hips: [40, 0, 0], waist: [14, 0, 0], chest: [4, 0, 0], neck: [-14, 0, 0], head: [-18, 0, 0], lLeg: [55, 6, 0], rLeg: [55, 6, 0], lKnee: 30, rKnee: 30, lFoot: flat(55, 30, 40), rFoot: flat(55, 30, 40),
    reach: { lHand: { at: 'lKn', off: tilt(15, [-.05, .28, .12]), pole: [.6, -.2, -1], dir: tilt(15, [0, -1, .3]) }, rHand: { at: 'rKn', off: tilt(15, [.05, .28, .12]), pole: [-.6, -.2, -1], dir: tilt(15, [0, -1, .3]) } }, lHand: 'flat', rHand: 'flat' }, 'lean'),
  // bend down to the ground from the hips, knees bent, hips back over the heels (picking up, washing)
  'pick-up': H({ hips: [72, 0, 0], waist: [24, 0, 0], chest: [14, 0, 0], neck: [-18, 0, 0], head: [-22, 0, 0], lLeg: [100, 8, 0], rLeg: [97, 8, 0], lKnee: 40, rKnee: 36, lFoot: flat(100, 40, 72), rFoot: flat(97, 36, 72),
    lArm: [6, 112, 0], rArm: [8, 104, 0], lElbow: 8, rElbow: 16, lHand: 'open', rHand: 'relaxed', ground: 'feet' }, 'lean'),
  // work: field and craft actions, the poses most films about places and trades need
  // a carrying pole on the left shoulder, left hand steadying it in front (gánh)
  'carry-pole': H({ hips: [6, 0, 0], waist: [4, 0, 0], chest: [6, 0, 0], head: [-4, 0, 0], lClav: [20, 0], lLeg: [14, 4, 0], rLeg: [-2, 4, 0], lKnee: 18, rKnee: 10, lFoot: flat(14, 18, 6), rFoot: flat(-2, 10, 6),
    reach: { lHand: { at: 'lClav', off: [.75, .1, .9], pole: [1, -1, 0], dir: [0, .4, 1] } }, lHand: 'fist', rArm: [8, -10, 0], rElbow: 15, rHand: 'relaxed', ground: 'feet' }, 'work'),
  // a basket on the head, steadied by one raised hand (đội thúng)
  'carry-head': H({ chest: [-4, 0, 0], neck: [-3, 0, 0], head: [-2, 0, 0], lLeg: [0, 5, 0], rLeg: [0, 5, 0],
    reach: { lHand: { at: 'head', off: [.55, 1.05, .1], pole: [1, .2, -.3], dir: [-.4, 1, 0] } }, lHand: 'open', rArm: [8, 4, 0], rElbow: 14, rHand: 'relaxed' }, 'work'),
  'hoe-up': H({ hips: [6, 0, 6], waist: [-4, 0, 0], chest: [-12, 0, 0], head: [-6, 0, 0], lLeg: [22, 6, 8], rLeg: [-8, 4, 0], lKnee: 22, rKnee: 8, lFoot: flat(22, 22, 6), rFoot: flat(-8, 8, 6) + 12,
    lArm: [20, 165, 0], rArm: [10, 160, 0], lElbow: 40, rElbow: 35, lHand: 'fist', rHand: 'fist', ground: 'feet' }, 'work'),
  'hoe-down': H({ hips: [26, 0, 6], waist: [18, 0, 0], chest: [10, 0, 0], neck: [-8, 0, 0], head: [-8, 0, 0], lLeg: [58, 6, 8], rLeg: [12, 4, 0], lKnee: 40, rKnee: 25, lFoot: flat(58, 40, 26), rFoot: flat(12, 25, 26) + 10,
    lArm: [10, 68, 0], rArm: [6, 56, 0], lElbow: 10, rElbow: 25, lHand: 'fist', rHand: 'fist', ground: 'feet' }, 'work'),
  // bent double over the paddy, left hand holding the seedlings, right hand pressing one into the mud (cấy lúa)
  'plant-rice': H({ hips: [70, 0, 0], waist: [22, 0, 0], chest: [10, 0, 0], neck: [-14, 0, 0], head: [-16, 0, 0], lLeg: [90, 12, 6], rLeg: [86, 12, 6], lKnee: 30, rKnee: 26, lFoot: flat(90, 30, 70), rFoot: flat(86, 26, 70),
    lArm: [10, 84, 0], lElbow: 50, rArm: [8, 108, 0], rElbow: 8, lHand: 'fist', rHand: 'point', ground: 'feet' }, 'work'),
  // sweeping with a long broom held low on the right side (quét)
  sweep: H({ hips: [22, 0, -14], waist: [10, 0, -10], chest: [6, 0, -6], head: [-6, 0, 10], lLeg: [30, 8, 0], rLeg: [18, 8, 0], lKnee: 14, rKnee: 10, lFoot: flat(30, 14, 22), rFoot: flat(18, 10, 22),
    reach: { lHand: { at: 'chest', off: [-.25, -.35, .85], pole: [1, -1, -.2], dir: [-.4, -.7, .3] }, rHand: { at: 'pelvis', off: [-.55, -.25, .75], pole: [-1, -.6, -.4], dir: [-.2, -.9, .3] } }, lHand: 'fist', rHand: 'fist', ground: 'feet' }, 'work'),
  // stirring a pot at waist height, left hand on the pot's rim
  'stir-pot': H({ hips: [6, 0, 0], waist: [8, 0, 0], head: [22, 0, 0], neck: [8, 0, 0], lLeg: [6, 6, 0], rLeg: [6, 6, 0], lFoot: flat(6, 0, 6), rFoot: flat(6, 0, 6),
    reach: { rHand: { at: 'pelvis', off: [-.25, .35, 1.1], pole: [-1, -1, -.2], dir: [.2, -.6, .5] }, lHand: { at: 'pelvis', off: [.55, .3, .9], pole: [1, -1, -.2], dir: [-.3, -.5, .6] } }, rHand: 'fist', lHand: 'relaxed' }, 'work'),
  // rowing standing up, oar out ahead (row-reach) then pulled to the chest (row-pull)
  'row-reach': H({ hips: [18, 0, 0], waist: [12, 0, 0], chest: [6, 0, 0], head: [-10, 0, 0], lLeg: [46, 5, 0], rLeg: [10, 5, 0], lKnee: 30, rKnee: 28, lFoot: flat(46, 30, 18), rFoot: flat(10, 28, 18) + 10,
    lArm: [12, 85, 0], rArm: [12, 80, 0], lElbow: 8, rElbow: 10, lHand: 'fist', rHand: 'fist', ground: 'feet' }, 'work'),
  'row-pull': H({ hips: [-4, 0, 0], waist: [-8, 0, 0], chest: [-6, 0, 0], head: [2, 0, 0], lLeg: [8, 5, 0], rLeg: [-14, 5, 0], lKnee: 12, rKnee: 16, lFoot: flat(8, 12, -4), rFoot: flat(-14, 16, -4) + 14,
    lArm: [14, 25, 0], rArm: [14, 20, 0], lElbow: 95, rElbow: 100, lHand: 'fist', rHand: 'fist', ground: 'feet' }, 'work'),
  // a pestle lifted overhead (pound-up) and driven down into the mortar (pound-down) (giã gạo)
  'pound-up': H({ chest: [-10, 0, 0], head: [-12, 0, 0], lArm: [20, 170, 0], rArm: [20, 170, 0], lElbow: 30, rElbow: 30, lClav: [30, 0], rClav: [30, 0], lLeg: [0, 9, 0], rLeg: [0, 9, 0], lKnee: 6, rKnee: 6, lFoot: flat(0, 6), rFoot: flat(0, 6), lHand: 'fist', rHand: 'fist' }, 'work'),
  'pound-down': H({ hips: [16, 0, 0], waist: [16, 0, 0], chest: [6, 0, 0], head: [8, 0, 0], lArm: [12, 70, 0], rArm: [12, 70, 0], lElbow: 15, rElbow: 15, lLeg: [28, 9, 0], rLeg: [28, 9, 0], lKnee: 26, rKnee: 26, lFoot: flat(28, 26, 16), rFoot: flat(28, 26, 16), lHand: 'fist', rHand: 'fist', ground: 'feet' }, 'work'),
  // leaning into a push, palms forward, back leg driving
  push: H({ hips: [14, 0, 0], waist: [10, 0, 0], head: [-14, 0, 0], lLeg: [44, 4, 0], rLeg: [-16, 4, 0], lKnee: 38, rKnee: 4, lFoot: flat(44, 38, 14), rFoot: flat(-16, 4, 14) + 28,
    lArm: [14, 66, 0], rArm: [14, 66, 0], lElbow: 30, rElbow: 30, lWrist: [70, 0], rWrist: [70, 0], lHand: 'flat', rHand: 'flat', ground: 'feet' }, 'work'),
  // sit (on a seat the height of the knee: add the seat yourself under the pelvis)
  'sit-chair': H({ hips: [-6, 0, 0], waist: [4, 0, 0], chest: [2, 0, 0], lLeg: [88, 6, 0], rLeg: [86, 6, 0], lKnee: 86, rKnee: 92, lFoot: flat(88, 86, -6), rFoot: flat(86, 92, -6),
    reach: { lHand: { at: 'lKn', off: [-.02, .4, -.6], pole: [.6, -.4, -1], dir: [0, -.3, 1] }, rHand: { at: 'rKn', off: [.02, .4, -.65], pole: [-.6, -.4, -1], dir: [0, -.3, 1] } }, lHand: 'flat', rHand: 'flat', ground: 'feet' }, 'sit'),
  'sit-elbows-on-knees': H({ hips: [10, 0, 0], waist: [22, 0, 0], chest: [14, 0, 0], neck: [-12, 0, 0], head: [-14, 0, 0], lLeg: [94, 14, 0], rLeg: [94, 14, 0], lKnee: 100, rKnee: 100, lFoot: flat(94, 100, 10), rFoot: flat(94, 100, 10),
    reach: both([-.1, -.6, .95], [.5, -1, 0], [-.5, .2, .8]), lHand: 'relaxed', rHand: 'relaxed', ground: 'feet' }, 'sit'),
  // a low stool, knees high and apart, leaning over the work in front (ngồi ghế đẩu: market, kitchen, roadside)
  'sit-low-stool': H({ hips: [4, 0, 0], waist: [16, 0, 0], chest: [10, 0, 0], neck: [-6, 0, 0], head: [6, 0, 0], lLeg: [119, 18, 8], rLeg: [119, 18, 8], lKnee: 105, rKnee: 105, lFoot: flat(119, 105, 4), rFoot: flat(119, 105, 4),
    reach: both([.3, -.75, .95], [.8, -.6, -.4], [-.2, -.3, 1]), lHand: 'relaxed', rHand: 'relaxed', ground: 'feet' }, 'sit'),
  // on the floor, legs crossed (ngồi xếp bằng)
  'sit-cross-legged': H({ hips: [-8, 0, 0], waist: [8, 0, 0], chest: [4, 0, 0], head: [4, 0, 0], lLeg: [80, 50, 80], rLeg: [80, 50, 80], lKnee: 135, rKnee: 138, lFoot: 10, rFoot: 10,
    reach: { lHand: { at: 'lKn', off: [-.1, .15, 0], pole: [1, -.3, -.4], dir: [0, -.6, .8] }, rHand: { at: 'rKn', off: [.1, .15, 0], pole: [-1, -.3, -.4], dir: [0, -.6, .8] } }, lHand: 'relaxed', rHand: 'relaxed' }, 'sit'),
  'sit-hug-knees': H({ hips: [-20, 0, 0], waist: [16, 0, 0], chest: [10, 0, 0], head: [12, 0, 0], lLeg: [125, 6, 0], rLeg: [125, 6, 0], lKnee: 115, rKnee: 115, lFoot: flat(125, 115, -20), rFoot: flat(125, 115, -20),
    reach: { lHand: { at: 'rKn', off: [.3, -.45, .3], pole: [1, -.2, 0], dir: [-1, 0, .2] }, rHand: { at: 'lKn', off: [-.3, -.35, .32], pole: [-1, -.2, 0], dir: [1, 0, .2] } }, lHand: 'relaxed', rHand: 'relaxed' }, 'sit'),
  'sit-lean-back': H({ hips: [-35, 0, 0], waist: [6, 0, 0], chest: [8, 0, 0], neck: [10, 0, 0], head: [6, 0, 0], lLeg: [62, 4, 0], rLeg: [100, 4, 0], lKnee: 15, rKnee: 110, lFoot: 25, rFoot: flat(100, 110, -35),
    lArm: [14, -40, 0], rArm: [14, -40, 0], lElbow: 4, rElbow: 4, lWrist: [-70, 0], rWrist: [-70, 0], lHand: 'flat', rHand: 'flat' }, 'sit'),
  // on the floor, both legs folded to the right, sitting on the left hip, propped on the left hand, right hand on the knee
  'sit-side': H({ hips: [0, 10, -25], waist: [0, 5, 15], chest: [2, 5, 10], neck: [0, -6, 0], head: [4, -12, 0], lLeg: [88, -5, 70], rLeg: [80, 10, -70], lKnee: 140, rKnee: 145, lFoot: 30, rFoot: 30,
    lArm: [62, -8, -30], lElbow: 8, lWrist: [-50, 0], lHand: 'flat', reach: { rHand: { at: 'pelvis', off: [.1, .4, 1.35], pole: [-1, -.4, -.3], dir: [.2, -.4, 1] } }, rHand: 'relaxed' }, 'sit'),
  // kneeling, sitting back on the heels, tops of the feet on the floor
  'sit-heels': H({ hips: [-6, 0, 0], waist: [6, 0, 0], chest: [2, 0, 0], head: [6, 0, 0], lLeg: [69, 4, 0], rLeg: [69, 4, 0], lKnee: 165, rKnee: 165, lFoot: 88, rFoot: 88,
    reach: { lHand: { at: 'lKn', off: [-.06, .38, -.55], pole: [.6, -.4, -1], dir: [0, -.3, 1] }, rHand: { at: 'rKn', off: [.06, .38, -.55], pole: [-.6, -.4, -1], dir: [0, -.3, 1] } }, lHand: 'flat', rHand: 'flat' }, 'sit'),
  // a full squat, heels down (ngồi xổm): how people wait, cook, sell at a market
  squat: H({ hips: [30, 0, 0], waist: [8, 0, 0], chest: [-6, 0, 0], neck: [-8, 0, 0], head: [-6, 0, 0], lLeg: [110, 18, 16], rLeg: [110, 18, 16], lKnee: 150, rKnee: 150, lFoot: flat(110, 150, 30), rFoot: flat(110, 150, 30),
    reach: { lHand: { at: 'lKn', off: [-.05, .05, .25], pole: [1, -.3, -.4], dir: [0, -1, .3] }, rHand: { at: 'rKn', off: [.05, .05, .25], pole: [-1, -.3, -.4], dir: [0, -1, .3] } }, lHand: 'relaxed', rHand: 'relaxed', ground: 'feet' }, 'sit'),
  'squat-work': H({ hips: [40, 0, 0], waist: [16, 0, 0], chest: [6, 0, 0], neck: [-6, 0, 0], head: [6, 0, 0], lLeg: [120, 18, 16], rLeg: [120, 18, 16], lKnee: 150, rKnee: 150, lFoot: flat(120, 150, 40), rFoot: flat(120, 150, 40),
    lArm: [10, 55, 0], rArm: [10, 50, 0], lElbow: 40, rElbow: 46, lHand: 'relaxed', rHand: 'open', ground: 'feet' }, 'sit'),
  // kneel
  kneel: H({ hips: [4, 0, 0], lLeg: [4, 5, 0], rLeg: [4, 5, 0], lKnee: 90, rKnee: 90, lFoot: 85, rFoot: 85, head: [4, 0, 0],
    reach: { lHand: { at: 'lHip', off: [.12, -.5, .05], pole: [.4, -.4, -1], dir: [0, -1, .1] }, rHand: { at: 'rHip', off: [-.12, -.5, .05], pole: [-.4, -.4, -1], dir: [0, -1, .1] } }, lHand: 'flat', rHand: 'flat' }, 'kneel'),
  // down on one knee, forearm resting on the raised knee
  'kneel-one': H({ hips: [6, 0, 0], waist: [8, 0, 0], head: [2, 0, 0], lLeg: [101, 8, 0], lKnee: 95, lFoot: flat(101, 95, 6), rLeg: [-15, 4, 0], rKnee: 70, rFoot: 52,
    reach: { lHand: { at: 'lKn', off: [-.1, .3, .25], pole: [1, -.3, -.5], dir: [0, -1, .4] } }, lHand: 'relaxed', rArm: [8, 6, 0], rElbow: 15, rHand: 'relaxed' }, 'kneel'),
  'kneel-pray': H({ hips: [4, 0, 0], lLeg: [4, 5, 0], rLeg: [4, 5, 0], lKnee: 90, rKnee: 90, lFoot: 85, rFoot: 85, head: [16, 0, 0], neck: [6, 0, 0],
    reach: both([.05, .22, .62], [.8, -1, -.2], [-.08, 1, .25]), lHand: 'flat', rHand: 'flat' }, 'kneel'),
  // kneeling, sat back on the heels and bowed forward, forehead toward the floor, palms flat in front (a deep bow: lạy)
  'kneel-bow': H({ hips: [60, 0, 0], waist: [20, 0, 0], chest: [10, 0, 0], neck: [10, 0, 0], head: [10, 0, 0], lLeg: [145, 6, 0], rLeg: [145, 6, 0], lKnee: 165, rKnee: 165, lFoot: 78, rFoot: 78,
    reach: { lHand: { at: 'lKn', off: tilt(80, [-.1, -.12, 1.5]), pole: [.5, .6, -.6], dir: tilt(80, [0, 0, 1]) }, rHand: { at: 'rKn', off: tilt(80, [.1, -.12, 1.5]), pole: [-.5, .6, -.6], dir: tilt(80, [0, 0, 1]) } }, lHand: 'flat', rHand: 'flat' }, 'kneel'),
  // lie
  'lie-back': H({ hips: [-90, 0, 0], lLeg: [4, 6, 10], rLeg: [30, 6, 6], rKnee: 60, rFoot: 20, lFoot: 30, head: [-6, 0, 0],
    lArm: [40, 0, 0], rArm: [150, 0, -90], lElbow: 15, rElbow: 60, lHand: 'relaxed', rHand: 'relaxed' }, 'lie'),
  // on the right side, head resting on the outstretched right arm, knees drawn up (asleep, resting)
  'lie-side': H({ hips: [0, -90, 0], waist: [0, 2, 0], chest: [0, 3, 0], neck: [0, 8, 0], head: [6, 4, 0], lLeg: [42, -4, 0], rLeg: [26, 0, 0], lKnee: 62, rKnee: 36, lFoot: 20, rFoot: 20,
    rArm: [172, 18, 0], rElbow: 20, lArm: [-12, 32, 0], lElbow: 45, lHand: 'relaxed', rHand: 'relaxed' }, 'lie'),
  // face down, up on the elbows (reading), feet idly up
  'lie-front': H({ hips: [90, 0, 0], waist: [-12, 0, 0], chest: [-24, 0, 0], neck: [-20, 0, 0], head: [-14, 0, 0], lLeg: [-4, 6, 0], rLeg: [-4, 6, 0], lKnee: 70, rKnee: 30, lFoot: 30, rFoot: 30,
    lArm: [20, 110, 0], rArm: [20, 110, 0], lElbow: 100, rElbow: 100, lHand: 'relaxed', rHand: 'relaxed' }, 'lie'),
  // action
  'jump-crouch': H({ hips: [35, 0, 0], waist: [15, 0, 0], head: [-25, 0, 0], lLeg: [75, 6, 0], rLeg: [75, 6, 0], lKnee: 90, rKnee: 90, lFoot: flat(75, 90, 35) + 10, rFoot: flat(75, 90, 35) + 10, lArm: [12, -50, 0], rArm: [12, -50, 0], lElbow: 15, rElbow: 15, lHand: 'open', rHand: 'open', ground: 'feet' }, 'action'),
  'jump-air': H({ chest: [-12, 0, 0], head: [-14, 0, 0], lLeg: [10, 6, 0], rLeg: [-14, 6, 0], lKnee: 30, rKnee: 60, lFoot: 40, rFoot: 40, lArm: [150, 20, 0], rArm: [150, 20, 0], lElbow: 10, rElbow: 10, lHand: 'open', rHand: 'open', at: [0, 1.2, 0], ground: 'none' }, 'action'),
  'throw-wind': H({ hips: [0, 0, -30], waist: [0, -6, -20], chest: [-6, -10, -20], head: [0, 0, 45], lLeg: [30, 8, 0], rLeg: [-10, 8, 0], lKnee: 10, rKnee: 25, lFoot: flat(30, 10), rFoot: flat(-10, 25),
    rArm: [95, -35, 70], rElbow: 85, rHand: 'fist', lArm: [70, 70, 0], lElbow: 15, lHand: 'open', ground: 'feet' }, 'action'),
  'throw-release': H({ hips: [10, 0, 25], waist: [10, 4, 15], chest: [10, 6, 15], head: [0, 0, -10], lLeg: [40, 8, 0], rLeg: [-24, 8, 0], lKnee: 25, rKnee: 15, lFoot: flat(40, 25, 10), rFoot: flat(-24, 15, 10) + 35,
    rArm: [40, 110, 0], rElbow: 10, rHand: 'open', lArm: [20, -30, 0], lElbow: 40, lHand: 'fist', ground: 'feet' }, 'action'),
  fall: H({ hips: [-30, 10, 0], waist: [-10, 0, 0], head: [30, 0, 0], lLeg: [50, 10, 0], rLeg: [20, 10, 0], lKnee: 40, rKnee: 30, lArm: [110, -10, 0], rArm: [120, 10, 0], lElbow: 20, rElbow: 30, lHand: 'open', rHand: 'open', at: [0, .8, 0], ground: 'none' }, 'action'),
};
export const CATS = ['stand', 'gesture', 'lean', 'work', 'sit', 'kneel', 'lie', 'action'];
