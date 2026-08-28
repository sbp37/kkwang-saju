/* 테스트 하네스
   engine/*.js와 rules/*.js는 브라우저용 클래식 스크립트라 require로 못 불러온다.
   vm 컨텍스트에 순서대로 넣어 실제 로드 순서를 그대로 재현한다. */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function loadEngine() {
  const ctx = { console, Date, Math, JSON, String, Number, Array, Object, RegExp, Error,
                parseInt, parseFloat, isNaN, isFinite, Set, Map };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  ['engine/ssaju.js', 'engine/ksaju.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  });
  return ctx;
}

// 앱이 rules/*.js에 제공하는 값들 중 규칙이 실제로 참조하는 것만 최소로 채운다.
function loadRules(ctx) {
  ctx.GROUP_OF = { 비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상', 편재:'재성',
                   정재:'재성', 편관:'관성', 정관:'관성', 편인:'인성', 정인:'인성' };
  ctx.rankedGroups = g => Object.entries(g).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  ctx.currentAge = () => 30;
  ctx.S = {};
  ['rules/reading.js', 'rules/match.js', 'rules/today.js', 'rules/group.js'].forEach(f => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  });
  return ctx;
}

// 앱의 computeSaju / adaptSaju / findYongshin과 같은 계산을 테스트에서 재현한다.
// (index.html 안에 있어 직접 못 부르므로, 같은 순서로 엔진을 호출한다.)
function computeChart(ctx, input) {
  const { SSAJU, KSaju } = ctx;
  let sy = input.year, sm = input.month, sd = input.day;
  if (input.cal === 'lunar') {
    const s = SSAJU.lunarToSolar(sy, sm, sd, !!input.leap);
    sy = s.year; sm = s.month; sd = s.day;
  }
  const hour = input.noTime ? 12 : input.hour;
  const minute = input.noTime ? 0 : (input.minute || 0);
  const t = KSaju.toTrueSolar(sy, sm, sd, hour, minute);
  const raw = SSAJU.calculateSaju({
    year: t.year, month: t.month, day: t.day, hour: t.hour, minute: t.minute,
    gender: input.gender === 'M' ? '남' : '여'
  });
  const ko = p => KSaju.toKo([p[0], p[1]]);
  const P = {
    year: ko(raw.pillars.year), month: ko(raw.pillars.month),
    day: ko(raw.pillars.day), hour: input.noTime ? null : ko(raw.pillars.hour)
  };
  return { raw, pillars: P, corrected: t, analysis: KSaju.analyze(P) };
}

// ---------- 아주 작은 테스트 러너 ----------
const state = { pass: 0, fail: 0, failures: [], group: '' };

function describe(name, fn) { state.group = name; console.log('\n■ ' + name); fn(); }

function it(name, fn) {
  try {
    fn();
    state.pass++;
    console.log('  \x1b[32m✓\x1b[0m ' + name);
  } catch (e) {
    state.fail++;
    state.failures.push({ group: state.group, name, message: e.message });
    console.log('  \x1b[31m✗\x1b[0m ' + name + '\n      ' + e.message);
  }
}

function eq(actual, expected, label) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${label || ''} 기대 ${b} · 실제 ${a}`);
}
function ok(cond, label) { if (!cond) throw new Error(label || '조건 실패'); }
function between(actual, lo, hi, label) {
  if (!(actual >= lo && actual <= hi)) throw new Error(`${label || ''} ${lo}~${hi} 기대 · 실제 ${actual}`);
}

function report() {
  const total = state.pass + state.fail;
  console.log('\n' + '─'.repeat(52));
  if (state.fail === 0) {
    console.log(`\x1b[32m전체 통과\x1b[0m — ${state.pass}/${total}`);
  } else {
    console.log(`\x1b[31m실패 ${state.fail}건\x1b[0m — 통과 ${state.pass}/${total}`);
    state.failures.forEach(f => console.log(`  · [${f.group}] ${f.name}\n      ${f.message}`));
  }
  return state.fail;
}

module.exports = { loadEngine, loadRules, computeChart, describe, it, eq, ok, between, report };
