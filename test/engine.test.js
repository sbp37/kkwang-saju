/* 만세력·시간 보정·판정 테스트
   여기 있는 기대값은 전부 근거가 있다. 출처를 주석으로 남긴다.
   실행: node test/engine.test.js */

const H = require('./harness');
const { describe, it, eq, ok, between } = H;
const ctx = H.loadEngine();
const { SSAJU, KSaju } = ctx;

const chart = input => H.computeChart(ctx, input);
const pillarStr = c => [c.pillars.year, c.pillars.month, c.pillars.day, c.pillars.hour]
  .filter(Boolean).map(p => p.join('')).join(' ');

describe('사주 팔자 — 기준 사례', () => {

  it('1993-07-15 14:30 여 · 계유 기미 정유 정미', () => {
    // 일주는 2000-01-01 무오일을 기준으로 한 독립 계산과 대조해 확인했다.
    eq(pillarStr(chart({ year:1993, month:7, day:15, hour:14, minute:30, gender:'F' })),
       '계유 기미 정유 정미');
  });

  it('1989-03-07 07:00 여 · 기사 정묘 병인 신묘', () => {
    // 상용 서비스(사주아이)의 실제 결과와 팔자·십신·12운성·12신살·오행이 모두 일치함을 확인했다.
    eq(pillarStr(chart({ year:1989, month:3, day:7, hour:7, minute:0, gender:'F' })),
       '기사 정묘 병인 신묘');
  });

  it('일주 60갑자가 하루마다 정확히 한 칸씩 넘어간다', () => {
    const 갑자 = '갑을병정무기경신임계', 지지 = '자축인묘진사오미신유술해';
    let prev = null;
    for (let d = 1; d <= 40; d++) {
      const p = chart({ year:2000, month:6, day:d, hour:12, minute:0, gender:'F' }).pillars.day;
      if (prev) {
        const s = (갑자.indexOf(prev[0]) + 1) % 10, b = (지지.indexOf(prev[1]) + 1) % 12;
        eq([갑자[s], 지지[b]], p, `2000-06-${d} 일주 연속성`);
      }
      prev = p;
    }
  });

});

describe('절기 경계', () => {

  it('경칩(1990-03-06 05:19 KST) 전후로 월주가 바뀐다', () => {
    const before = chart({ year:1990, month:3, day:6, hour:5, minute:0, gender:'M' });
    const after  = chart({ year:1990, month:3, day:6, hour:6, minute:30, gender:'M' });
    eq(before.pillars.month, ['무','인'], '경칩 전은 무인월');
    eq(after.pillars.month,  ['기','묘'], '경칩 후는 기묘월');
  });

  it('입춘 전후로 연주가 바뀐다 (1990)', () => {
    eq(chart({ year:1990, month:2, day:3, hour:12, minute:0, gender:'M' }).pillars.year, ['기','사']);
    eq(chart({ year:1990, month:2, day:5, hour:12, minute:0, gender:'M' }).pillars.year, ['경','오']);
  });

});

describe('한국 시간 보정', () => {

  it('평시에는 경도 보정과 균시차만 적용된다', () => {
    const t = KSaju.toTrueSolar(1993, 7, 15, 14, 30);
    eq(t.dstApplied, false);
    eq(t.standardMeridian, 135);
    between(t.shiftMinutes, -45, -30, '보정폭');
  });

  it('1987년 서머타임 기간은 60분을 더 뺀다', () => {
    // 한국 서머타임 1987-05-10 ~ 1987-10-11
    const on  = KSaju.toTrueSolar(1987, 7, 15, 14, 30);
    const off = KSaju.toTrueSolar(1987, 11, 15, 14, 30);
    eq(on.dstApplied, true);
    eq(off.dstApplied, false);
    ok(on.shiftMinutes < off.shiftMinutes - 55, '서머타임 적용 시 60분 더 빠져야 함');
  });

  it('서머타임이 시주를 실제로 바꾼다', () => {
    // 보정이 없으면 계미(미시), 있으면 임오(오시)가 된다
    eq(chart({ year:1987, month:7, day:15, hour:14, minute:30, gender:'M' }).pillars.hour, ['임','오']);
  });

  it('1954~1961년은 표준자오선이 127.5도다', () => {
    eq(KSaju.standardMeridian(1958, 7, 15), 127.5);
    eq(KSaju.standardMeridian(1953, 7, 15), 135);
    eq(KSaju.standardMeridian(1962, 7, 15), 135);
  });

  it('균시차가 계절에 따라 부호를 바꾼다', () => {
    // 11월 초는 +16분 근처, 2월 중순은 -14분 근처
    ok(KSaju.equationOfTime(2000, 11, 3) > 10, '11월 초 균시차는 크게 양수');
    ok(KSaju.equationOfTime(2000, 2, 12) < -10, '2월 중순 균시차는 크게 음수');
  });

});

describe('판정 — 신강신약 · 격국 · 용신', () => {

  const sample = [];
  for (let y = 1970; y <= 2009; y++) {
    for (const m of [1, 4, 7, 10]) {
      sample.push(chart({ year:y, month:m, day:((y * 7 + m) % 27) + 1, hour:(y * 13 + m * 5) % 24, minute:0, gender:'F' }));
    }
  }

  it('신강·신약이 한쪽으로 치우치지 않는다', () => {
    const n = sample.length;
    const strong = sample.filter(c => c.analysis.strength.label === '신강').length / n;
    const weak   = sample.filter(c => c.analysis.strength.label === '신약').length / n;
    // 글자 수만 세던 시절에는 신강 28% / 신약 72%까지 치우쳤다.
    between(strong, 0.25, 0.50, '신강 비율');
    between(weak,   0.35, 0.62, '신약 비율');
  });

  it('용신은 사주에 뿌리가 있는 오행에서 고른다 (무근불용)', () => {
    const bare = sample.filter(c => !c.analysis.yongsin.rooted).length / sample.length;
    // 예전 로직은 51%가 무근 오행을 용신으로 뽑았다.
    ok(bare < 0.05, `무근 용신 비율 ${(bare * 100).toFixed(1)}% — 5% 미만이어야 함`);
  });

  it('격국이 특정 유형으로 몰리지 않는다', () => {
    const cnt = {};
    sample.forEach(c => { cnt[c.analysis.gyeokguk.name] = (cnt[c.analysis.gyeokguk.name] || 0) + 1; });
    const top = Math.max(...Object.values(cnt)) / sample.length;
    ok(Object.keys(cnt).length >= 8, `격국 종류 ${Object.keys(cnt).length}종 — 8종 이상이어야 함`);
    ok(top < 0.25, `최다 격국 비중 ${(top * 100).toFixed(0)}% — 25% 미만이어야 함`);
  });

  it('1989-03-07 사례의 판정이 상용 서비스와 같다', () => {
    const a = chart({ year:1989, month:3, day:7, hour:7, minute:0, gender:'F' }).analysis;
    eq(a.strength.label, '신강');            // 사주아이도 "신강 사주"로 판정
    eq(a.strength.elementScore['수'], 0);    // 수 0개 — 사주아이 표기와 일치
  });

});

describe('지장간 · 통근', () => {

  it('지장간 일수 합이 지지마다 30일이다', () => {
    Object.keys(KSaju.HIDDEN).forEach(b => {
      const sum = KSaju.HIDDEN[b].reduce((a, x) => a + x[1], 0);
      eq(sum, 30, `${b}의 지장간 일수 합`);
    });
  });

  it('사주에 없는 오행도 지장간에 있으면 뿌리로 인정된다', () => {
    // 1993-07-15는 여덟 글자에 목이 0개지만 미(未)의 중기가 을목이라 통근한다.
    const c = chart({ year:1993, month:7, day:15, hour:14, minute:30, gender:'F' });
    const rooted = KSaju.rootedElements(c.pillars);
    ok(rooted['목'], '미토의 지장간 을목으로 목이 통근해야 함');
  });

});

describe('지지 관계', () => {

  it('충 · 육합 · 삼합을 판정한다', () => {
    eq(KSaju.branchRelation('자', '오'), '충');
    eq(KSaju.branchRelation('자', '축'), '육합');
    eq(KSaju.branchRelation('신', '자'), '삼합');
    eq(KSaju.branchRelation('자', '인'), null);
  });

  it('반방합은 왕지가 있어야 성립한다', () => {
    // 인묘진·사오미·신유술·해자축에서 가운데 왕지(자오묘유)가 낀 짝만 묶인다.
    eq(KSaju.branchRelation('인', '묘'), '방합');
    eq(KSaju.branchRelation('묘', '진'), '방합');
    eq(KSaju.branchRelation('신', '유'), '방합');
    eq(KSaju.branchRelation('해', '자'), '방합');
    eq(KSaju.branchRelation('인', '진'), null, '왕지 없는 양끝은 방합이 아니다');
    eq(KSaju.branchRelation('사', '미'), null);
    eq(KSaju.branchRelation('신', '술'), null);
    eq(KSaju.branchRelation('해', '축'), null);
  });

  it('반방합 짝은 계절 순서대로 돌려준다', () => {
    eq(KSaju.banghapPair('묘', '인'), { element:'목', pair:'인묘' });
    eq(KSaju.banghapPair('진', '묘'), { element:'목', pair:'묘진' });
    eq(KSaju.banghapPair('자', '해'), { element:'수', pair:'해자' });
    eq(KSaju.banghapPair('인', '진'), null);
  });

  it('충 · 육합 · 삼합이 방합보다 먼저다', () => {
    // 자축과 오미는 육합이면서 방합이기도 하다. 더 강한 쪽을 준다.
    eq(KSaju.branchRelation('자', '축'), '육합');
    eq(KSaju.branchRelation('오', '미'), '육합');
    eq(KSaju.branchRelation('묘', '유'), '충');
  });

  it('충은 대칭이다', () => {
    ['자오', '축미', '인신', '묘유', '진술', '사해'].forEach(pair => {
      eq(KSaju.branchRelation(pair[0], pair[1]), '충');
      eq(KSaju.branchRelation(pair[1], pair[0]), '충');
    });
  });

});

describe('입력 처리', () => {

  it('태어난 시간을 몰라도 세 기둥이 나온다', () => {
    const c = chart({ year:1975, month:12, day:1, noTime:true, gender:'F' });
    eq(c.pillars.hour, null);
    ok(c.pillars.year && c.pillars.month && c.pillars.day, '연월일주는 있어야 함');
  });

  it('음력 입력이 양력으로 바뀐 뒤 계산된다', () => {
    const lunar = chart({ year:2001, month:5, day:5, hour:8, minute:0, gender:'F', cal:'lunar' });
    const solar = SSAJU.lunarToSolar(2001, 5, 5, false);
    const same = chart({ year:solar.year, month:solar.month, day:solar.day, hour:8, minute:0, gender:'F' });
    eq(pillarStr(lunar), pillarStr(same));
  });

  it('연도 전 범위에서 예외가 나지 않는다', () => {
    for (let y = 1930; y <= 2026; y += 1) {
      for (const [m, d] of [[1, 15], [6, 20], [12, 3]]) {
        chart({ year:y, month:m, day:d, hour:(y + m) % 24, minute:0, gender:y % 2 ? 'F' : 'M' });
      }
    }
  });

});

describe('음력 달력', () => {

  // index.html의 leapMonthOf / lunarMonthDays가 쓰는 것과 같은 방식.
  // ssaju가 음력표를 노출하지 않아 유효성 판정을 되물어 알아낸다.
  const leapMonthOf = y => {
    for (let m = 1; m <= 12; m++) { try { SSAJU.lunarToSolar(y, m, 1, true); return m; } catch (e) {} }
    return 0;
  };
  const monthDays = (y, m, leap) => {
    try { SSAJU.lunarToSolar(y, m, 30, !!leap); return 30; } catch (e) { return 29; }
  };

  it('윤달이 있는 해와 없는 해를 가려낸다', () => {
    // 한국천문연구원 음양력 기준
    eq(leapMonthOf(2001), 4);
    eq(leapMonthOf(2004), 2);
    eq(leapMonthOf(2023), 2);
    eq(leapMonthOf(2025), 6);
    eq(leapMonthOf(1930), 6);
    eq(leapMonthOf(2026), 0, '2026년은 윤달이 없다');
    eq(leapMonthOf(2027), 0, '2027년은 윤달이 없다');
  });

  it('음력 달은 29일 아니면 30일이다', () => {
    for (let y = 1930; y <= 2026; y++) {
      for (let m = 1; m <= 12; m++) {
        const d = monthDays(y, m, false);
        ok(d === 29 || d === 30, `${y}년 ${m}월이 ${d}일`);
      }
    }
  });

  it('달의 길이가 양력과 다르다 (일 목록을 양력으로 만들면 안 되는 이유)', () => {
    eq(monthDays(2001, 2, false), 30, '음력 2001년 2월은 30일 — 양력이면 28일');
    eq(monthDays(2023, 1, false), 29, '음력 2023년 1월은 29일 — 양력이면 31일');
    eq(monthDays(2001, 4, true), 29, '윤4월은 29일');
  });

  it('마지막 날짜가 실제로 계산까지 통과한다', () => {
    for (const [y, m, leap] of [[2001, 2, false], [2001, 4, true], [2023, 1, false], [2025, 6, true]]) {
      const last = monthDays(y, m, leap);
      const s = SSAJU.lunarToSolar(y, m, last, leap);
      ok(s && s.year, `음력 ${y}.${m}${leap ? '(윤)' : ''}.${last} 변환`);
    }
  });

  it('그 해에 없는 윤달은 거부된다', () => {
    let threw = false;
    try { SSAJU.lunarToSolar(2001, 5, 1, true); } catch (e) { threw = true; }
    ok(threw, '2001년 윤5월은 존재하지 않으므로 예외가 나야 한다');
  });

});

describe('공유 링크', () => {

  // index.html의 encodeBirth / decodeBirth와 같은 규칙.
  // 서버가 없으므로 생년월일 자체를 주소에 담고, 링크를 연 쪽이 다시 계산한다.
  const LEVELS = ['몽글몽글', '솔직하게 콕', '돌직구 크앙'];
  const b64 = {
    enc: str => Buffer.from(str, 'utf8').toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
    dec: t => Buffer.from(t.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
  };
  const encode = (b, level) => b64.enc([
    '1',
    `${b.rawY}${String(b.rawM).padStart(2, '0')}${String(b.rawD).padStart(2, '0')}`,
    b.noTime ? '----' : `${String(b.hour).padStart(2, '0')}${String(b.minute).padStart(2, '0')}`,
    b.gender,
    b.calRaw === 'lunar' ? (b.leap ? 'L' : 'l') : 's',
    String(LEVELS.indexOf(level))
  ].join('|'));

  it('생일과 말투가 그대로 돌아온다', () => {
    const b = { rawY:2001, rawM:4, rawD:29, hour:23, minute:55, noTime:false,
                gender:'M', calRaw:'lunar', leap:true };
    eq(b64.dec(encode(b, '돌직구 크앙')), '1|20010429|2355|M|L|2');
  });

  it('시간을 모르면 시각 자리가 비어 나간다', () => {
    const b = { rawY:1975, rawM:12, rawD:1, hour:null, minute:null, noTime:true,
                gender:'F', calRaw:'solar', leap:false };
    eq(b64.dec(encode(b, '몽글몽글')), '1|19751201|----|F|s|0');
  });

  it('링크로 들어온 생일이 같은 사주를 낸다', () => {
    // 링크는 결과를 저장하지 않는다. 받은 쪽이 같은 입력으로 다시 계산할 뿐이다.
    const a = chart({ year:2001, month:4, day:29, hour:23, minute:55, gender:'M',
                      cal:'lunar', leap:true });
    const raw = b64.dec(encode({ rawY:2001, rawM:4, rawD:29, hour:23, minute:55,
                                 noTime:false, gender:'M', calRaw:'lunar', leap:true }, '몽글몽글'));
    const [, ymd, hm, gender, cal] = raw.split('|');
    const b = chart({ year:+ymd.slice(0,4), month:+ymd.slice(4,6), day:+ymd.slice(6,8),
                      hour:+hm.slice(0,2), minute:+hm.slice(2,4), gender,
                      cal: cal === 's' ? 'solar' : 'lunar', leap: cal === 'L' });
    eq(pillarStr(b), pillarStr(a));
  });

  it('윤달 여부가 실제로 다른 사주가 된다 (링크가 이걸 잃으면 안 된다)', () => {
    const 평달 = chart({ year:2001, month:4, day:15, hour:12, minute:0, gender:'F', cal:'lunar', leap:false });
    const 윤달 = chart({ year:2001, month:4, day:15, hour:12, minute:0, gender:'F', cal:'lunar', leap:true });
    ok(pillarStr(평달) !== pillarStr(윤달), '윤4월과 4월은 다른 날이다');
  });

});

describe('알려진 엔진 제약', () => {

  it('solarToLunar는 일부 날짜에서 잘못된 값을 낸다 (앱은 쓰지 않음)', () => {
    // 왕복 검사에서 특정 날짜가 조용히 "1월 1일"로 돌아온다.
    // 앱은 lunarToSolar만 쓰므로 사용자 영향은 없지만, 쓰게 되면 반드시 다시 확인할 것.
    const bad = SSAJU.solarToLunar(1978, 9, 3);
    ok(bad.month === 1 && bad.day === 1,
       '이 테스트가 실패하면 엔진이 고쳐진 것이니 이 제약 메모를 지워도 된다');
  });

  it('앱 계산 경로는 solarToLunar를 쓰지 않는다', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
    const inCompute = /function computeSaju\([\s\S]{0,700}?solarToLunar/.test(src);
    ok(!inCompute, 'computeSaju가 solarToLunar를 쓰면 위 제약이 사용자에게 노출된다');
  });

});

process.exit(H.report() > 0 ? 1 : 0);
