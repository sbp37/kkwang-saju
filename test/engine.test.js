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

describe('우리끼리 링크 (이어달리기)', () => {

  // index.html의 encodeGroup / decodeGroup과 같은 규칙.
  // 여러 사람의 생일을 담으므로 이름에 구분자가 섞이면 안 된다.
  const enc = str => Buffer.from(str, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const dec = t => Buffer.from(t.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  const encodeGroup = people => enc(['1'].concat(people.map(p => [
    p.name.replace(/[|~]/g, ''),
    `${p.y}${String(p.m).padStart(2, '0')}${String(p.d).padStart(2, '0')}`,
    p.noTime ? '----' : `${String(p.hour).padStart(2, '0')}${String(p.minute).padStart(2, '0')}`,
    p.gender
  ].join('~'))).join('|'));

  const 사람들 = [
    { name:'지훈', y:1989, m:3,  d:7,  hour:7,  minute:0,  noTime:false, gender:'M' },
    { name:'수연', y:1993, m:7,  d:15, hour:14, minute:30, noTime:false, gender:'F' },
    { name:'막내', y:2001, m:5,  d:9,  hour:null, minute:null, noTime:true, gender:'F' }
  ];

  it('한글 별명이 그대로 돌아온다', () => {
    eq(dec(encodeGroup(사람들)),
       '1|지훈~19890307~0700~M|수연~19930715~1430~F|막내~20010509~----~F');
  });

  it('별명에 구분자를 넣어도 형식이 깨지지 않는다', () => {
    const 장난 = [{ name:'가|나~다', y:1990, m:1, d:1, hour:0, minute:0, noTime:false, gender:'M' }];
    const raw = dec(encodeGroup(장난));
    eq(raw.split('|').length, 2, '구분자가 늘어나면 안 된다');
    eq(raw.split('|')[1].split('~').length, 4, '항목 수가 유지돼야 한다');
    eq(raw.split('|')[1].split('~')[0], '가나다');
  });

  it('링크에 담긴 생일이 같은 사주를 낸다', () => {
    const raw = dec(encodeGroup(사람들));
    raw.split('|').slice(1).forEach((chunk, i) => {
      const [, ymd, hm, gender] = chunk.split('~');
      const p = 사람들[i];
      const noTime = hm === '----';
      const a = chart({ year:p.y, month:p.m, day:p.d, hour:noTime ? 12 : p.hour,
                        minute:noTime ? 0 : p.minute, noTime, gender:p.gender });
      const b = chart({ year:+ymd.slice(0,4), month:+ymd.slice(4,6), day:+ymd.slice(6,8),
                        hour:noTime ? 12 : +hm.slice(0,2), minute:noTime ? 0 : +hm.slice(2,4),
                        noTime, gender });
      eq(pillarStr(b), pillarStr(a), `${p.name}의 사주`);
    });
  });

  it('한 명부터 링크가 만들어진다 (이어달리기의 시작)', () => {
    // 혼자 시작해서 링크를 던지면 다음 사람이 자기 것만 이어 넣는다.
    // 남의 생일을 대신 넣는 사람이 없어야 하므로 1명 링크가 반드시 성립해야 한다.
    const 혼자 = [사람들[0]];
    const raw = dec(encodeGroup(혼자));
    eq(raw.split('|').length, 2, '버전 한 칸 + 사람 한 칸');
  });

  it('여섯 명을 담아도 링크가 카카오톡에서 잘리지 않을 길이다', () => {
    const 여섯 = [];
    for (let i = 0; i < 6; i++) 여섯.push({ name:'사람' + i, y:1990 + i, m:6, d:15, hour:12, minute:0, noTime:false, gender:'F' });
    const url = 'https://example.com/#g=' + encodeGroup(여섯);
    ok(url.length < 300, `링크 길이 ${url.length}자`);
  });

});

describe('결과 화면 접기', () => {

  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');

  it('결과 섹션은 앞의 둘만 펴둔다', () => {
    // 열다섯 섹션을 다 펴두면 접힌 상태로도 아홉 화면이 넘어가 끝까지 읽는 사람이 없다.
    const m = /#sections \.speech'\)\.forEach\(\(el,i\)=>\{\s*el\.classList\.toggle\('open',i<(\d+)\)/.exec(src);
    ok(m, '결과 섹션 펼침 코드를 못 찾았다');
    eq(+m[1], 2, '기본으로 펴두는 섹션 수');
  });

  it('오늘·궁합 화면도 같은 규칙을 쓴다', () => {
    // 화면마다 다르게 펴두면 어디는 길고 어디는 짧아 보인다.
    const counts = (src.match(/className='speech'\+\(i<(\d+)\?' open':''\)/g) || [])
      .map(x => +/i<(\d+)/.exec(x)[1]);
    eq(counts.length, 2, '오늘·궁합 두 곳이어야 한다');
    counts.forEach(c => eq(c, 2, '펴두는 섹션 수'));
  });
});

describe('우리끼리 입력 — 인원과 음력', () => {

  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8');
  const body = src.slice(src.indexOf('function addGroupPerson'), src.indexOf('function groupChart'));

  it('사람을 넣는 함수 자체가 인원 상한을 막는다', () => {
    // 버튼은 6명이 되면 잠기지만 이름칸 엔터로도 같은 함수가 불린다.
    // 여기서 안 막으면 7명짜리 링크가 만들어지고, 받는 쪽 decodeGroup이 거부해서
    // 아무 안내 없이 방이 끊긴다.
    ok(/G\.people\.length\s*>=\s*GROUP_MAX/.test(body), 'addGroupPerson에 상한 검사가 없다');
  });

  it('넣는 쪽 상한과 받는 쪽 상한이 같은 값을 본다', () => {
    const dec = src.slice(src.indexOf('function decodeGroup'), src.indexOf('function groupShareUrl'));
    ok(/parts\.length\s*>\s*GROUP_MAX/.test(dec), 'decodeGroup이 GROUP_MAX를 안 본다');
  });

  it('음력으로 넣으면 링크에는 양력으로 담긴다', () => {
    // 링크 모양을 그대로 두려고 넣는 순간 바꾼다. 옛 링크도 계속 열려야 한다.
    ok(/G\.cal\s*===\s*'lunar'/.test(body), '음력 분기가 없다');
    ok(/SSAJU\.lunarToSolar/.test(body), 'lunarToSolar 변환이 없다');
  });

  it('2001년 윤4월 15일은 양력 2001년 6월 6일이다', () => {
    // 한국천문연구원 음양력 변환 기준. 이어달리기가 이 값을 저장한다.
    const s = SSAJU.lunarToSolar(2001, 4, 15, true);
    eq([s.year, s.month, s.day], [2001, 6, 6]);
  });

  it('한 기기에서 넣고 나면 입력 폼을 접는다', () => {
    // 열어둔 채로 두면 이름만 바꿔 남의 생일을 대신 넣을 수 있다.
    const render = src.slice(src.indexOf('function renderGroupList'), src.indexOf('function addGroupPerson'));
    ok(/G\.mine/.test(render), 'renderGroupList가 G.mine을 안 본다');
    ok(/groupForm'\)\.classList\.toggle\('hidden'/.test(render), '폼을 접는 코드가 없다');
  });

  it('링크로 들어온 사람은 아직 안 넣은 상태로 시작한다', () => {
    const open = src.slice(src.indexOf('function openSharedGroup'), src.indexOf('async function drawGroupCard'));
    ok(/G\.mine\s*=\s*''/.test(open), 'openSharedGroup이 G.mine을 비우지 않는다');
  });
});

describe('이름으로 부르기', () => {

  // index.html의 personalize와 같은 규칙.
  // "너/네"를 적어준 이름으로 바꾼다. 조사는 받침에 맞춰 고른다.
  const hasJong = w => {
    const c = w.charCodeAt(w.length - 1);
    return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0;
  };
  const josa = (w, pair) => { const p = pair.split('/'); return w + (hasJong(w) ? p[0] : p[1]); };
  const COUNTER = ['가지', '개', '칸', '기둥', '글자', '명', '번', '줄', '살', '겹', '자'];
  const personalize = (text, name) => {
    if (!name) return text;
    return text
      .replace(/너한테/g, name + '한테').replace(/너에게/g, name + '에게').replace(/네게/g, name + '에게')
      .replace(/너보다/g, name + '보다').replace(/너처럼/g, name + '처럼').replace(/너까지/g, name + '까지')
      .replace(/너랑/g, () => josa(name, '이랑/랑')).replace(/너와/g, () => josa(name, '과/와'))
      .replace(/너도/g, name + '도').replace(/너만/g, name + '만').replace(/너의/g, name + '의')
      .replace(/너야/g, () => josa(name, '이야/야'))
      .replace(/(?:너를|널(?![가-힣]))/g, () => josa(name, '을/를'))
      .replace(/(?:너는|넌(?![가-힣]))/g, () => josa(name, '은/는'))
      .replace(/네가/g, () => josa(name, '이/가'))
      .replace(/네 ([가-힣]+)/g, (m, w) => COUNTER.some(c => w === c || w.indexOf(c) === 0) ? m : name + '의 ' + w)
      .replace(/너(?![가-힣])/g, name);
  };

  it('받침에 맞는 조사를 붙인다', () => {
    eq(personalize('너는 이해가 돼야 움직여.', '숩'), '숩은 이해가 돼야 움직여.');
    eq(personalize('너는 이해가 돼야 움직여.', '수연'), '수연은 이해가 돼야 움직여.');
    eq(personalize('네가 먼저 말해.', '숩'), '숩이 먼저 말해.');
    eq(personalize('네가 먼저 말해.', '하늘'), '하늘이 먼저 말해.');
    eq(personalize('너랑 잘 맞아.', '민재'), '민재랑 잘 맞아.');
    eq(personalize('너랑 잘 맞아.', '지훈'), '지훈이랑 잘 맞아.');
  });

  it('줄임말과 관형형도 잡는다', () => {
    eq(personalize('널 위한 말이야. 넌 괜찮아.', '하늘'), '하늘을 위한 말이야. 하늘은 괜찮아.');
    eq(personalize('네 방식으로 결론을 내.', '지훈'), '지훈의 방식으로 결론을 내.');
    eq(personalize('이거 너 아니야?', '숩'), '이거 숩 아니야?');
  });

  it('수를 세는 "네"와 "너무"는 건드리지 않는다', () => {
    // 화면에는 "네 기둥", "네 가지", "네 칸" 같은 숫자 표현이 있다
    eq(personalize('생일을 네 칸으로 나눈 거야.', '숩'), '생일을 네 칸으로 나눈 거야.');
    eq(personalize('먼저 짚고 갈 네 가지', '숩'), '먼저 짚고 갈 네 가지');
    eq(personalize('내 사주의 네 기둥', '숩'), '내 사주의 네 기둥');
    eq(personalize('너무 애쓰지 마. 너희 얘기가 아니야.', '숩'), '너무 애쓰지 마. 너희 얘기가 아니야.');
  });

  it('이름을 안 적으면 문장이 그대로다', () => {
    const t = '너는 네 방식대로 하는 게 편해.';
    eq(personalize(t, ''), t);
  });

  it('바꾼 뒤에 "너"나 "네가"가 남지 않는다', () => {
    const 문장들 = [
      '너는 이해가 돼야 움직이는 유형이야.',
      '네가 먼저 보여주지 않으면 지나칠 수 있어.',
      '너한테 별로 안 맞는 조언이야.',
      '네 기운은 이제 막 올라오는 중이야.',
      '너도 그렇지? 너랑 있으면 편해.',
      '널 위해서야. 넌 이미 알고 있잖아.'
    ];
    문장들.forEach(t => {
      const out = personalize(t, '숩');
      ok(!/너(?![가-힣])|너는|너를|네가|네 [가-힣]/.test(out.replace(/너무|너희/g, '')),
         `2인칭이 남았다: ${out}`);
    });
  });

});

describe('우리끼리 — 상황별 반응', () => {

  const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'rules', 'group.js'), 'utf8');
  // 규칙 파일은 브라우저용 클래식 스크립트라 require로 못 불러온다. 하네스가 vm에 올려준다.
  const { analyzeGroup } = H.loadRules(H.loadEngine());

  // 규칙표를 그대로 쓰는 사람 하나. 사주 계산을 거치지 않고 원하는 글자를 직접 준다.
  const 사람 = (name, o) => ({
    name,
    saju: {
      dayMaster: { stem: o.일간 },
      elems: Object.assign({ 목:2, 화:2, 토:2, 금:1, 수:1 }, o.오행 || {}),
      pillars: [
        { branch:'자', specialSals:[], twelveSal:'' },
        { branch:'축', specialSals:[], twelveSal:'' },
        { branch:o.일지, stage12:o.운성 || '건록', specialSals:o.신살 || [], twelveSal:'' },
        { branch:'묘', specialSals:[], twelveSal:'' }
      ]
    },
    yong: {
      g: Object.assign({ 비겁:2, 식상:2, 재성:2, 관성:2, 인성:2 }, o.십신 || {}),
      elem: o.용신 || '목', weak: !!o.신약
    }
  });
  const 대사들 = sit => sit.rows.map(r => r.say);

  it('상황 다섯 개가 서로 다른 축을 본다', () => {
    // 축이 겹치면 그 방에서 제일 센 사람이 매번 같은 자리를 가져가,
    // 다섯 개를 읽어도 사람마다 성격 하나가 다섯 번 반복된다.
    const axes = (src.match(/axis: '([^']+)'/g) || []).map(x => x.slice(8, -1));
    eq(axes.length, 5, '상황 수');
    eq(new Set(axes).size, 5, '서로 다른 축의 수');
  });

  it('절대 축은 그 글자 수만큼 반응을 갖는다', () => {
    const 반응수 = axis => {
      const a = src.indexOf(`axis: '${axis}'`);
      const b = src.indexOf('  {\n    id:', a), end = b === -1 ? src.indexOf('];', a) : b;
      return (src.slice(a, end).match(/^\s{6}\S+: \{ say:/gm) || []).length;
    };
    eq(반응수('일간'), 10, '일간 반응 수');   // 갑을병정무기경신임계
    eq(반응수('일지'), 12, '일지 반응 수');   // 자축인묘진사오미신유술해
  });

  it('한 사람이 다섯 상황에서 다섯 가지 다른 얼굴로 나온다', () => {
    const 방 = [사람('가', { 일간:'갑', 일지:'자' }), 사람('나', { 일간:'경', 일지:'오' })];
    const r = analyzeGroup(방);
    ['가', '나'].forEach(who => {
      const 말 = r.situations.map(s => s.rows.find(x => x.name === who).say);
      eq(new Set(말).size, 5, `${who}의 서로 다른 대사 수`);
    });
  });

  it('같은 일간을 셋이 가져도 대사가 겹치지 않는다', () => {
    const 방 = ['가', '나', '다'].map(n => 사람(n, { 일간:'임', 일지:'진' }));
    const r = analyzeGroup(방);
    r.situations.forEach(s => {
      eq(new Set(대사들(s)).size, 3, `${s.title} 서로 다른 대사 수`);
    });
  });

  it('여섯 명이면 반응 다섯 개가 동나도 대사가 겹치지 않는다', () => {
    // GROUP_MAX가 6인데 상대 축 반응은 다섯 개뿐이라, 남는 사람이 반드시 생긴다.
    const 오행들 = [{목:6}, {화:6}, {토:6}, {금:6}, {수:6}, {목:5}];
    const 방 = 오행들.map((e, i) => 사람('P' + i, { 일간:'갑', 일지:'자', 오행:e }));
    const r = analyzeGroup(방);
    const 여행 = r.situations.find(s => s.title.indexOf('여행') !== -1);
    eq(여행.rows.length, 6, '줄 수');
    eq(new Set(대사들(여행)).size, 6, '서로 다른 대사 수');
  });

  it('대사 속 ○○ 자리는 같은 방 사람 이름으로 채워진다', () => {
    // 자리표가 그대로 남으면 "○○ 요즘 바쁜가?"가 화면에 나간다.
    const 방 = [사람('숩', { 일간:'정', 일지:'자' }), 사람('막내', { 일간:'계', 일지:'오' })];
    const r = analyzeGroup(방);
    const 전부 = r.situations.flatMap(대사들).join(' ');
    ok(전부.indexOf('○○') === -1, '남은 자리표: ' + 전부);
    ok(/숩|막내/.test(전부), '이름이 대사에 들어가야 한다');
  });

  it('두 사람 이상이면 상황마다 마무리 한 줄이 붙는다', () => {
    const 방 = [사람('가', { 일간:'갑', 일지:'자' }), 사람('나', { 일간:'경', 일지:'오' })];
    analyzeGroup(방).situations.forEach(s => {
      ok(s.close && s.close.indexOf('결국') === 0, `${s.title} 마무리: ${s.close}`);
      ok(/\*[^*]+\*/.test(s.close), `${s.title} 마무리에 강조가 있어야 한다`);
    });
  });

  it('마무리 줄은 서로 다른 두 행동을 짝짓는다', () => {
    // 같은 행동 둘을 붙이면 "결국 가는 X, 나는 X"가 되어 장면이 안 된다.
    const 방 = ['가', '나', '다'].map(n => 사람(n, { 일간:'임', 일지:'진' }));
    analyzeGroup(방).situations.forEach(s => {
      const m = s.close.match(/^결국 .+?[은는] (.+?), .+?[은는] (.+?)\. /);
      if (m) ok(m[1] !== m[2], `${s.title} 같은 행동이 두 번: ${s.close}`);
    });
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
