"""Pose reference lookup: find mannequin drawings of a pose in a local copy of the AI Pose Gallery and tile them into one sheet.

  python -X utf8 core/figure/pose_ref.py <query...> [--gallery DIR] [--views front,diag,side,high,low] [--max 12] [--big] [--out file.jpg] [--list]

The gallery (https://github.com/anhao/ai-pose-gallery-zh, from https://ai-pose-gallery.pages.dev/) is (c) its author
ギア (@giaaibusi). It has no licence and is non-commercial only. Use it as reference to look at while you pose a figure
in core/figure/figure.js, the way an artist looks at a model. Never copy, trace or ship its images or data in a film or
in this library. Keep the sheets this tool writes in the film's ref/ folder, which stays local.
Only the standard full-body set and the upper-body "cute" gestures are searched; the adult sets are never searched or shown.

Query: English, Vietnamese (with or without diacritics) or Chinese words, all of which must match, or a pose id
(full_single_P033, or full_single_P033_side for one view). Gallery: --gallery, else $POSE_GALLERY, else ~/ai-pose-gallery-zh.
"""
import json, os, re, sys, unicodedata
from PIL import Image, ImageDraw

ALLOWED = {'全身单人・标准系': None, '上半身单人': {'可爱系'}}     # series → allowed categories (None = all)
VIEWS = {'front': '正面', 'diag': '斜侧', 'side': '侧面', 'high': '俯视', 'low': '仰视'}
VIEW_EN = {v: k for k, v in VIEWS.items()}
CAT_EN = {'站姿': 'stand', '坐姿': 'sit', '跪立': 'kneel', '侧坐・女孩坐': 'side sit', '趴卧': 'lie', '蹲姿': 'squat',
          '前倾': 'lean forward', '后仰・挺背': 'back bend', '扭身': 'twist', '可爱系': 'gestures (upper body)'}
# phrases → Chinese terms; a list means any of them may match. Longer phrases are matched first. Keys have no diacritics.
TERMS = {
    'one knee': '单膝', 'mot goi': '单膝', 'quy mot goi': ['单膝跪'], 'kneel one': '单膝',
    'hands on hips': '扶腰', 'hand on hip': '扶腰', 'chong nanh': '扶腰', 'akimbo': '扶腰',
    'arms up': '上举', 'arm up': '上举', 'raise': '上举', 'gio tay': '上举', 'reach up': ['上举', '上伸'],
    'look back': ['回眸', '回头', '回望'], 'ngoai lai': ['回眸', '回头', '回望'], 'ngoai': ['回眸', '回头', '回望'],
    'back bend': '后仰', 'lean back': '后仰', 'nga nguoi': '后仰', 'ngua nguoi': '后仰',
    'side sit': ['侧坐', '女孩坐'], 'ngoi nghieng': ['侧坐', '女孩坐'], 'side lying': '侧卧', 'nam nghieng': '侧卧',
    'chin': '托腮', 'chong cam': '托腮', 'cam': '托腮',
    'hug knees': '抱', 'om goi': '抱', 'hug': '抱', 'om': '抱',
    'ngoi xom': '蹲', 'squat': '蹲', 'crouch': '蹲', 'xom': '蹲',
    'nam sap': '俯卧', 'prone': '俯卧', 'sap': '俯卧', 'nam ngua': '仰卧', 'supine': '仰卧', 'ngua': '仰卧',
    'stand': '站', 'standing': '站', 'dung': '站',
    'sit': '坐', 'sitting': '坐', 'seated': '坐', 'ngoi': '坐',
    'kneel': '跪', 'kneeling': '跪', 'quy': '跪',
    'lie': '卧', 'lying': '卧', 'nam': '卧',
    'lean': '前倾', 'bend forward': '前倾', 'cui': '前倾',
    'twist': '扭', 'van': '扭', 'xoay': '扭',
    'hair': '发', 'toc': '发', 'vuot toc': '发',
    'salute': '敬礼', 'chao': '敬礼', 'pray': '合十', 'chap tay': '合十', 'please': '合十',
    'heart': '比心', 'tim': '比心', 'shh': '食指抵唇', 'suyt': '食指抵唇', 'point': '指', 'chi': '指',
    'peace': 'V', 'v sign': 'V', 'wink': '眨眼', 'kiss': '飞吻', 'yawn': '哈欠', 'stretch': ['伸展', '伸懒腰'],
    'cheek': '脸', 'face': '脸', 'mat': '脸', 'neck': '颈', 'co': '颈', 'head': '头', 'dau': '头',
    'knee': '膝', 'goi': '膝', 'ankle': '脚踝', 'tiptoe': '踮脚', 'kiem chan': '踮脚', 'elbow': '肘', 'khuyu tay': '肘',
    'leg': '腿', 'chan': '腿', 'arm': '臂', 'tay': '手', 'hand': '手', 'both hands': '双手', 'hai tay': '双手',
    'hip': '胯', 'waist': '腰', 'eo': '腰', 'chest out': '挺胸', 'uon nguc': '挺胸', 'look up': '仰望', 'nhin len': '仰望',
}
_KEYS = sorted(TERMS, key=lambda k: -len(k))

def plain(s):
    s = unicodedata.normalize('NFD', s.lower().replace('đ', 'd'))
    return ''.join(c for c in s if unicodedata.category(c) != 'Mn')

def parse_query(words):
    """→ (list of term groups, each a list of Chinese alternatives; pose-id filter or None)"""
    q = ' '.join(words).strip()
    m = re.fullmatch(r'(full_single|upper80v2)_P\d{3}(_(front|diag|side|high|low))?', q)
    if m: return [], q
    groups, rest = [], ' ' + re.sub(r'[\s,;/]+', ' ', plain(q)) + ' '
    zh = re.findall(r'[一-鿿]+', q)            # Chinese typed directly
    groups += [[z] for z in zh]
    rest = re.sub(r'[一-鿿]+', ' ', rest)
    for k in _KEYS:
        if f' {k} ' in rest:
            v = TERMS[k]; groups.append(v if isinstance(v, list) else [v]); rest = rest.replace(f' {k} ', ' ', 1)
    left = rest.split()
    if left: print(f'(not understood, ignored: {" ".join(left)})')
    return groups, None

def gallery_dir(arg):
    d = arg or os.environ.get('POSE_GALLERY') or os.path.expanduser('~/ai-pose-gallery-zh')
    if not os.path.isfile(os.path.join(d, 'data', 'pose-zh.json')):
        print(f'no pose gallery at {d}\nget it (≈680 MB; the thumbs alone are enough):\n'
              '  git clone --depth 1 https://github.com/anhao/ai-pose-gallery-zh ~/ai-pose-gallery-zh\n'
              'or point to a copy with --gallery DIR or POSE_GALLERY=DIR', file=sys.stderr)
        sys.exit(2)
    return d

def allowed(r):
    if r['体系'] not in ALLOWED: return False
    cats = ALLOWED[r['体系']]
    return cats is None or r['分类'] in cats

def sheet(recs, d, out, big, w=300):
    key = '原图' if big else '缩略图'
    files = [(r, os.path.join(d, r[key])) for r in recs if os.path.isfile(os.path.join(d, r[key]))]
    if not files: print('no image files found for the matches', file=sys.stderr); return None
    cols = min(5, len(files)); h = w * 4 // 3; rows = (len(files) + cols - 1) // cols
    S = Image.new('RGB', (cols * w, rows * (h + 20)), (245, 243, 238)); dr = ImageDraw.Draw(S)
    for k, (r, f) in enumerate(files):
        im = Image.open(f).convert('RGB').resize((w, h)); x, y = (k % cols) * w, (k // cols) * (h + 20)
        S.paste(im, (x, y + 20)); dr.text((x + 6, y + 4), f"{r['id'].rsplit('_', 1)[0]} · {VIEW_EN.get(r['角度'], r['角度'])}", fill=(40, 36, 32))
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    S.save(out, quality=88); return out

def main():
    a = sys.argv[1:]
    def opt(k, default=None):
        if k in a: i = a.index(k); v = a[i + 1]; del a[i:i + 2]; return v
        return default
    def flag(k):
        if k in a: a.remove(k); return True
        return False
    gal, views, mx, out = opt('--gallery'), opt('--views'), int(opt('--max', 12)), opt('--out')
    big, lst = flag('--big'), flag('--list')
    d = gallery_dir(gal)
    recs = [r for r in json.load(open(os.path.join(d, 'data', 'pose-zh.json'), encoding='utf-8')) if allowed(r)]
    if lst:
        seen = {}
        for r in recs: seen.setdefault(r['分类'], set()).add(r['id'].rsplit('_', 1)[0])
        for c, ids in seen.items(): print(f'{c} ({CAT_EN.get(c, "")}): {len(ids)} poses')
        return
    if not a: print(__doc__.strip().split('\n\n')[0]); sys.exit(2)
    groups, pid = parse_query(a)
    if pid:
        hits = [r for r in recs if r['id'] == pid or r['id'].rsplit('_', 1)[0] == pid]
        print(f'pose id {pid}')
    else:
        if not groups: print('nothing to search for', file=sys.stderr); sys.exit(2)
        print('searching for: ' + ' AND '.join('/'.join(g) for g in groups))
        hits = [r for r in recs if all(any(t in r['分类'] + r['姿势名称'] for t in g) for g in groups)]
    if views:
        want = {VIEWS.get(v.strip(), v.strip()) for v in views.split(',')}
        hits = [r for r in hits if r['角度'] in want]
    if not hits: print('no matches (only the standard full-body set and the upper-body gestures are searched)'); sys.exit(1)
    poses = {}
    for r in hits: poses.setdefault(r['id'].rsplit('_', 1)[0], []).append(r)
    print(f'{len(poses)} poses, {len(hits)} images')
    for p, rs in poses.items():
        print(f"  {p}  {rs[0]['分类']} · {rs[0]['姿势名称']}  [{', '.join(VIEW_EN.get(r['角度'], r['角度']) for r in rs)}]")
        for r in rs: print(f"      {os.path.normpath(os.path.join(d, r['原图' if big else '缩略图']))}")
    shown = hits[:mx]
    if len(hits) > mx: print(f'(sheet shows the first {mx} images; raise --max or narrow with --views)')
    slug = pid or re.sub(r'[^a-z0-9]+', '-', plain(' '.join(a))).strip('-') or 'query'
    res = sheet(shown, d, out or os.path.join('ref', f'pose_{slug}.jpg'), big)
    if res: print('sheet:', res)

if __name__ == '__main__':
    main()
