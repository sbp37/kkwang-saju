/* index.html과 딸린 파일을 하나로 묶어 단일 HTML을 만든다.

   평소에는 파일을 나눠 두는 게 고치기 편하지만, 한 파일만 필요할 때가 있다.
   - 링크 하나로 바로 보여줘야 할 때
   - 파일 여러 개를 못 올리는 곳에 붙일 때

   실행: node tools/build-single.js [출력파일]
         (기본값 dist/kkwang-saju.html)

   원본은 건드리지 않는다. 나온 파일은 서버 없이 열어도 그대로 돈다.

   같은 그림이 여러 군데서 쓰이므로, 그냥 자리마다 data URI를 박으면
   파일이 몇 배로 불어난다(실측 4.7MB). 그래서 그림은 CSS 변수에 한 벌만
   두고 세 군데서 그 변수를 가리키게 한다.

     CSS       url(assets/x.webp)   →  var(--a-x)
     HTML      <img src="assets/x"> →  <img data-a="x">  +  content:var(--a-x)
     자바스크립트  'assets/x.webp'      →  A['x']

   img에 content를 걸면 그림이 바뀌는 건 크롬·사파리·파이어폭스에서 모두
   되지만, 그때 alt는 화면에 안 나온다. 장식용 그림은 alt가 비어 있어
   문제가 없고, 마스코트는 alt가 DOM에 그대로 남는다. 나눠둔 원본
   index.html은 이 방식을 쓰지 않으므로 영향이 없다. */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'dist', 'kkwang-saju.html');

const MIME = {
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml'
};
// 1×1 투명 GIF. data-a가 붙은 img가 잠깐이라도 깨진 그림으로 보이지 않게 둔다.
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const dataUri = f => {
  const ext = path.extname(f).toLowerCase();
  const buf = fs.readFileSync(path.join(ROOT, f));
  return `data:${MIME[ext] || 'application/octet-stream'};base64,${buf.toString('base64')}`;
};

let html = read('index.html');

// ---------- 1) <script src="…"> 를 내용으로 바꾼다 ----------
// 순서가 중요하므로 나온 자리에 그대로 넣는다.
const scripts = [];
html = html.replace(/<script src="([^"]+)"><\/script>\n?/g, (m, src) => {
  scripts.push(src);
  // 스크립트 안에 </script> 문자열이 있으면 태그가 일찍 닫힌다
  const body = read(src).replace(/<\/script>/gi, '<\\/script>');
  return `<script>\n/* ${src} */\n${body}\n</script>\n`;
});

// ---------- 2) 쓰이는 그림을 모은다 ----------
// 앞에 /가 붙은 것은 og:image 같은 바깥 절대 주소다. 건드리지 않는다.
const ASSET_RE = /(?<!\/)assets\/([A-Za-z0-9_-]+)\.(webp|png|jpg|jpeg|gif|svg)/g;
const used = new Map();                        // 이름 → 파일 경로
for (const m of html.matchAll(ASSET_RE)) {
  const file = m[0];
  if (fs.existsSync(path.join(ROOT, file))) used.set(m[1], file);
}

// ---------- 3) 자리마다 알맞은 형태로 바꾼다 ----------
// 스크립트와 스타일 구간을 미리 표시해 두고, 위치에 따라 다르게 처리한다.
const zones = [];
for (const re of [/<script\b[^>]*>([\s\S]*?)<\/script>/g, /<style\b[^>]*>([\s\S]*?)<\/style>/g]) {
  for (const m of html.matchAll(re)) {
    zones.push({ kind: re.source.startsWith('<script') ? 'js' : 'css', from: m.index, to: m.index + m[0].length });
  }
}
const zoneAt = i => (zones.find(z => i >= z.from && i < z.to) || { kind: 'html' }).kind;

// <link rel="icon" href="assets/…"> 처럼 한 번만 쓰이는 것은 그냥 넣는다.
const inlineDirect = new Set(['favicon', 'icon-180', 'icon-192', 'icon-512']);

const needVar = new Set();
html = html.replace(
  /(?:(url\(\s*['"]?)|(src=")|(['"]))(?<!\/)assets\/([A-Za-z0-9_-]+)\.(webp|png|jpg|jpeg|gif|svg)(['"]?\s*\))?(")?(['"])?/g,
  (m, urlOpen, srcOpen, quoteOpen, name, ext, urlClose, srcClose, quoteClose, offset) => {
    const file = `assets/${name}.${ext}`;
    if (!used.has(name)) return m;
    if (inlineDirect.has(name)) return m.replace(file, dataUri(file));

    const where = zoneAt(offset);
    if (urlOpen && where === 'css') { needVar.add(name); return `var(--a-${name})`; }
    if (srcOpen && where === 'html') { needVar.add(name); return `src="${BLANK}" data-a="${name}"${srcClose ? '' : ''}`; }
    if (quoteOpen && where === 'js') { needVar.add(name); return `A[${JSON.stringify(name)}]`; }
    // 예상 못 한 자리 — 안전하게 그냥 넣는다
    return m.replace(file, dataUri(file));
  }
);

// ---------- 4) 그림 한 벌을 CSS 변수로 넣고, 자바스크립트가 읽을 수 있게 한다 ----------
const names = [...needVar].sort();
const vars = names.map(n => `--a-${n}:url("${dataUri(used.get(n))}")`).join(';');
const imgRules = names.map(n => `img[data-a="${n}"]{content:var(--a-${n})}`).join('');
const boot = `<style id="kkwang-assets">:root{${vars}}${imgRules}</style>
<script>
/* 그림은 위 CSS 변수에 한 벌만 들어 있다. 자바스크립트도 거기서 꺼내 쓴다. */
var A = (function () {
  var css = getComputedStyle(document.documentElement), out = {};
  ${JSON.stringify(names)}.forEach(function (n) {
    out[n] = css.getPropertyValue('--a-' + n).trim().replace(/^url\\(["']?/, '').replace(/["']?\\)$/, '');
  });
  return out;
})();
</script>
`;
html = html.replace(/<\/head>/, boot + '</head>');

// ---------- 5) 단일 파일에서 뜻이 없는 것 ----------
// manifest는 자기 주소를 기준으로 하는 설정이라 data URI로 넣으면 오히려 깨진다.
html = html.replace(/\n?<link rel="manifest"[^>]*>/g, '');

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);

const kb = n => (n / 1024).toFixed(0) + 'KB';
console.log(`${path.relative(ROOT, OUT)} — ${kb(Buffer.byteLength(html))}`);
console.log(`  스크립트 ${scripts.length}개, 그림 ${used.size}종 (${names.length}종은 한 벌만 넣고 나눠 씀)`);

const left = (html.match(/(?:src|href)="(?!data:|#|https:\/\/fonts\.)([^"]+)"/g) || [])
  .filter(x => !x.includes('${'));
if (left.length) console.log('  바깥을 가리키는 곳:', left.join(', '));
