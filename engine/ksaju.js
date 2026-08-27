/* 크앙사주 판정 레이어
   ssaju가 계산한 팔자 위에서 한국 시간 보정과 신강신약·용신·격국 판정을 맡는다. */
// ===== 크앙사주 판정 레이어 =====
// ssaju(MIT)는 사주 팔자·지장간·십신·12운성·합충·신살·공망·대운을 정확히 계산해 주지만
// advanced(신강신약·격국·용신) 판정은 편향이 커서 쓰지 않는다.
// (표본 1,440건에서 신약 3%, 종왕격 34%로 나옴 — 명리 통념과 크게 어긋남)
// 아래는 그 판정만 직접 구현한 것.

var KSaju = (function () {
  'use strict';

  var STEM_KO = { 甲:'갑',乙:'을',丙:'병',丁:'정',戊:'무',己:'기',庚:'경',辛:'신',壬:'임',癸:'계' };
  var BRANCH_KO = { 子:'자',丑:'축',寅:'인',卯:'묘',辰:'진',巳:'사',午:'오',未:'미',申:'신',酉:'유',戌:'술',亥:'해' };
  var STEM_EL = { 갑:'목',을:'목',병:'화',정:'화',무:'토',기:'토',경:'금',신:'금',임:'수',계:'수' };
  var BRANCH_EL = { 자:'수',축:'토',인:'목',묘:'목',진:'토',사:'화',오:'화',미:'토',신:'금',유:'금',술:'토',해:'수' };
  var YANG_STEM = { 갑:1,병:1,무:1,경:1,임:1,을:0,정:0,기:0,신:0,계:0 };

  // 지장간: 지지 → [[천간, 배정일수], ...] (여기·중기·정기 순)
  var HIDDEN = {
    자:[['임',10],['계',20]],           축:[['계',9],['신',3],['기',18]],
    인:[['무',7],['병',7],['갑',16]],   묘:[['갑',10],['을',20]],
    진:[['을',9],['계',3],['무',18]],   사:[['무',7],['경',7],['병',16]],
    오:[['병',10],['기',9],['정',11]],  미:[['정',9],['을',3],['기',18]],
    신:[['무',7],['임',7],['경',16]],   유:[['경',10],['신',20]],
    술:[['신',9],['정',3],['무',18]],   해:[['무',7],['갑',7],['임',16]]
  };

  var GEN  = { 목:'화',화:'토',토:'금',금:'수',수:'목' };   // 생
  var CTRL = { 목:'토',토:'수',수:'화',화:'금',금:'목' };   // 극
  var RGEN  = { 화:'목',토:'화',금:'토',수:'금',목:'수' };  // 나를 생하는
  var RCTRL = { 토:'목',수:'토',화:'수',금:'화',목:'금' };  // 나를 극하는

  // 자리 가중치 — 월지가 사주의 힘을 가장 크게 좌우한다(월령)
  var W_STEM   = { year:8,  month:12, day:10, hour:8  };
  var W_BRANCH = { year:10, month:30, day:18, hour:10 };

  function toKo(pair) {
    var a = pair[0], b = pair[1];
    return [STEM_KO[a] || a, BRANCH_KO[b] || b];
  }

  // ---------- 한국 표준시 이력 ----------
  // 1908-04-01~1911-12-31 UTC+8:30 / 1912-01-01~1954-03-20 UTC+9
  // 1954-03-21~1961-08-09 UTC+8:30 / 1961-08-10~ UTC+9
  function standardMeridian(y, m, d) {
    var n = y * 10000 + m * 100 + d;
    if (n < 19080401) return null;              // 표준시 도입 이전 — 지방시 그대로
    if (n < 19120101) return 127.5;
    if (n < 19540321) return 135;
    if (n < 19610810) return 127.5;
    return 135;
  }

  // 한국 서머타임 시행 구간 (모두 +1시간)
  var DST = [
    [19480601, 0,    19480913, 0],
    [19490403, 0,    19490911, 0],
    [19500401, 0,    19500910, 0],
    [19510506, 0,    19510909, 0],
    [19550505, 0,    19550909, 0],
    [19560520, 0,    19560930, 0],
    [19570505, 0,    19570922, 0],
    [19580504, 0,    19580921, 0],
    [19590503, 0,    19590920, 0],
    [19600501, 0,    19600918, 0],
    [19870510, 120,  19871011, 180],
    [19880508, 120,  19881009, 180]
  ];
  function dstOffsetMinutes(y, m, d, hh, mi) {
    var n = y * 10000 + m * 100 + d, t = hh * 60 + mi;
    for (var i = 0; i < DST.length; i++) {
      var s = DST[i];
      var afterStart = n > s[0] || (n === s[0] && t >= s[1]);
      var beforeEnd  = n < s[2] || (n === s[2] && t <  s[3]);
      if (afterStart && beforeEnd) return 60;
    }
    return 0;
  }

  // 균시차 — 진태양시와 평균태양시의 차이(±16분). NOAA 근사식.
  function equationOfTime(y, m, d) {
    var start = Date.UTC(y, 0, 1);
    var n = Math.round((Date.UTC(y, m - 1, d) - start) / 86400000) + 1;
    var B = 2 * Math.PI * (n - 81) / 364;
    return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  }

  var SEOUL_LON = 126.978;

  // 입력 시각(벽시계) → 서울 진태양시. ssaju에 넣기 전에 미리 보정한다.
  function toTrueSolar(y, m, d, hh, mi) {
    var dst = dstOffsetMinutes(y, m, d, hh, mi);
    var meridian = standardMeridian(y, m, d);
    var lonAdj = meridian === null ? 0 : (SEOUL_LON - meridian) * 4;
    var eot = equationOfTime(y, m, d);
    var shift = -dst + lonAdj + eot;

    var t = new Date(Date.UTC(y, m - 1, d, hh, mi));
    t.setUTCMinutes(t.getUTCMinutes() + Math.round(shift));
    return {
      year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate(),
      hour: t.getUTCHours(), minute: t.getUTCMinutes(),
      shiftMinutes: Math.round(shift),
      dstApplied: dst > 0,
      standardMeridian: meridian,
      eotMinutes: Math.round(eot * 10) / 10
    };
  }

  // ---------- 오행 세력 점수 ----------
  // 지지는 지장간 일수 비율로 쪼개 배분한다. 글자 수를 세는 것보다 실제 힘에 가깝다.
  function elementScore(pillars) {
    var el = { 목:0, 화:0, 토:0, 금:0, 수:0 };
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var p = pillars[k];
      if (!p) return;
      el[STEM_EL[p[0]]] += W_STEM[k];
      var hid = HIDDEN[p[1]], tot = 0, i;
      for (i = 0; i < hid.length; i++) tot += hid[i][1];
      for (i = 0; i < hid.length; i++) {
        el[STEM_EL[hid[i][0]]] += W_BRANCH[k] * hid[i][1] / tot;
      }
    });
    return el;
  }

  // 통근(通根): 그 오행이 어느 지지의 지장간에 실제로 들어 있는가.
  // 뿌리 없는 오행은 용신으로 쓰지 않는다(무근불용).
  function rootedElements(pillars) {
    var set = {};
    ['year', 'month', 'day', 'hour'].forEach(function (k) {
      var p = pillars[k];
      if (!p) return;
      HIDDEN[p[1]].forEach(function (h) { set[STEM_EL[h[0]]] = true; });
    });
    return set;
  }

  // 십신
  function tenGod(dayStem, other) {
    var a = STEM_EL[dayStem], b = STEM_EL[other];
    var same = YANG_STEM[dayStem] === YANG_STEM[other];
    if (b === a)        return same ? '비견' : '겁재';
    if (b === GEN[a])   return same ? '식신' : '상관';
    if (b === CTRL[a])  return same ? '편재' : '정재';
    if (b === RCTRL[a]) return same ? '편관' : '정관';
    return same ? '편인' : '정인';
  }
  var GROUP_OF_GOD = {
    비견:'비겁', 겁재:'비겁', 식신:'식상', 상관:'식상',
    편재:'재성', 정재:'재성', 편관:'관성', 정관:'관성',
    편인:'인성', 정인:'인성'
  };
  function groupElements(dayEl) {
    return { 비겁:dayEl, 식상:GEN[dayEl], 재성:CTRL[dayEl], 관성:RCTRL[dayEl], 인성:RGEN[dayEl] };
  }

  // ---------- 신강 / 신약 ----------
  // 득령(월지가 일간을 돕는가)을 판정에 직접 반영한다. 월지를 안 보면 결과가 크게 치우친다.
  function strength(pillars) {
    var dayStem = pillars.day[0], dayEl = STEM_EL[dayStem];
    var el = elementScore(pillars);
    var 인 = RGEN[dayEl];
    var total = 0, k;
    for (k in el) total += el[k];
    var support = el[dayEl] + el[인];

    var mb = pillars.month[1];
    var hid = HIDDEN[mb];
    var mainQi = hid[hid.length - 1][0];              // 월지 정기
    var 득령 = (STEM_EL[mainQi] === dayEl || STEM_EL[mainQi] === 인);
    // 득지: 일지가 일간을 돕는가
    var dayBranchMain = HIDDEN[pillars.day[1]][HIDDEN[pillars.day[1]].length - 1][0];
    var 득지 = (STEM_EL[dayBranchMain] === dayEl || STEM_EL[dayBranchMain] === 인);

    var ratio = support / total;
    var adj = ratio + (득령 ? 0.08 : -0.05) + (득지 ? 0.03 : -0.02);

    var label;
    if (adj >= 0.53) label = '신강';
    else if (adj <= 0.44) label = '신약';
    else label = '중화';

    return {
      label: label,
      strong: adj >= 0.53,
      weak: adj <= 0.44,
      ratio: ratio,
      score: Math.round(adj * 100),
      득령: 득령,
      득지: 득지,
      elementScore: el,
      dayElement: dayEl
    };
  }

  // ---------- 조후(調候) ----------
  // 계절이 극단이면 억부보다 온도 조절이 급하다. 겨울 태생에 물을 더 붓는 처방을 막는다.
  var COLD = { 해:1, 자:2, 축:2 };     // 한랭 — 화가 급함
  var HOT  = { 사:1, 오:2, 미:2 };     // 혹서 — 수가 급함
  function johu(pillars, el) {
    var mb = pillars.month[1];
    if (COLD[mb] && el['화'] / (el['화'] + el['수'] + 1) < 0.28) {
      return { need: '화', urgency: COLD[mb], reason: '겨울 기운이 강해 따뜻하게 데우는 힘이 급해' };
    }
    if (HOT[mb] && el['수'] / (el['화'] + el['수'] + 1) < 0.28) {
      return { need: '수', urgency: HOT[mb], reason: '여름 기운이 강해 식혀주는 힘이 급해' };
    }
    return null;
  }

  // ---------- 용신 ----------
  // 억부 기준. 단, 사주에 뿌리가 없는 오행은 용신이 아니라 "보충할 기운"으로 분리한다.
  function yongsin(pillars, st) {
    var dayEl = st.dayElement;
    var ge = groupElements(dayEl);
    var el = st.elementScore;
    var rooted = rootedElements(pillars);

    var cands = st.strong ? ['식상', '재성', '관성']
              : st.weak   ? ['인성', '비겁']
                          : ['식상', '재성', '관성', '인성', '비겁'];

    // 후보 중 세력이 가장 약한 쪽을 보태는 게 아니라, 균형을 가장 잘 잡는 쪽을 고른다.
    var scored = cands.map(function (g) {
      var e = ge[g];
      return { group: g, elem: e, power: el[e], rooted: !!rooted[e] };
    });

    var jo = johu(pillars, el);
    // 조후가 급하면 그쪽을 최우선. 단 뿌리가 있을 때만.
    if (jo && rooted[jo.need] && jo.urgency >= 2) {
      var hit = scored.filter(function (s) { return s.elem === jo.need; })[0];
      if (hit) {
        return {
          elem: hit.elem, group: hit.group, rooted: true, basis: '조후',
          note: jo.reason, supplement: null, johu: jo
        };
      }
    }

    var rootedCands = scored.filter(function (s) { return s.rooted; });
    var pick, supplement = null;

    if (rootedCands.length) {
      // 뿌리 있는 후보 중 가장 약한 것 = 보태면 가장 효과가 큰 자리
      rootedCands.sort(function (a, b) { return a.power - b.power; });
      pick = rootedCands[0];
      // 뿌리 없는 후보는 "생활에서 보충할 기운"으로 따로 안내
      var bare = scored.filter(function (s) { return !s.rooted; })
                       .sort(function (a, b) { return a.power - b.power; })[0];
      if (bare) supplement = bare.elem;
    } else {
      // 후보가 전부 무근이면 어쩔 수 없이 가장 약한 것을 쓰되 무근임을 밝힌다
      scored.sort(function (a, b) { return a.power - b.power; });
      pick = scored[0];
    }

    return {
      elem: pick.elem, group: pick.group, rooted: pick.rooted,
      basis: '억부', note: null, supplement: supplement, johu: jo
    };
  }

  // ---------- 격국 ----------
  // 월지 지장간 중 천간에 투출한 것을 우선하고, 없으면 정기를 쓴다.
  function gyeokguk(pillars) {
    var dayStem = pillars.day[0];
    var mb = pillars.month[1];
    var hid = HIDDEN[mb];
    var stems = ['year', 'month', 'hour']
      .map(function (k) { return pillars[k] && pillars[k][0]; })
      .filter(Boolean);

    var tuchul = null;
    for (var i = hid.length - 1; i >= 0; i--) {
      if (stems.indexOf(hid[i][0]) !== -1) { tuchul = hid[i][0]; break; }
    }
    var base = tuchul || hid[hid.length - 1][0];
    var god = tenGod(dayStem, base);

    // 월지가 비겁이면 건록격 / 양인격으로 따로 부른다
    var name;
    if (god === '비견') name = '건록격';
    else if (god === '겁재') name = YANG_STEM[dayStem] ? '양인격' : '월겁격';
    else name = god + '격';

    return { name: name, god: god, base: base, 투출: !!tuchul, group: GROUP_OF_GOD[god] };
  }

  // 지지끼리의 관계. 세운·대운이 원국의 어느 자리를 건드리는지 보는 데 쓴다.
  var CHUNG = { 자:'오', 오:'자', 축:'미', 미:'축', 인:'신', 신:'인', 묘:'유', 유:'묘', 진:'술', 술:'진', 사:'해', 해:'사' };
  var YUKHAP = { 자:'축', 축:'자', 인:'해', 해:'인', 묘:'술', 술:'묘', 진:'유', 유:'진', 사:'신', 신:'사', 오:'미', 미:'오' };
  var SAMHAP = [['신','자','진','수'], ['해','묘','미','목'], ['인','오','술','화'], ['사','유','축','금']];
  function branchRelation(a, b) {
    if (!a || !b) return null;
    if (CHUNG[a] === b) return '충';
    if (YUKHAP[a] === b) return '육합';
    for (var i = 0; i < SAMHAP.length; i++) {
      var g = SAMHAP[i];
      if (g.indexOf(a) !== -1 && g.indexOf(b) !== -1 && a !== b) return '삼합';
    }
    return null;
  }

  function analyze(pillars) {
    var st = strength(pillars);
    return {
      strength: st,
      yongsin: yongsin(pillars, st),
      gyeokguk: gyeokguk(pillars),
      rooted: rootedElements(pillars)
    };
  }

  return {
    STEM_EL: STEM_EL, BRANCH_EL: BRANCH_EL, HIDDEN: HIDDEN, YANG_STEM: YANG_STEM,
    GEN: GEN, CTRL: CTRL, RGEN: RGEN, RCTRL: RCTRL,
    GROUP_OF_GOD: GROUP_OF_GOD, groupElements: groupElements, tenGod: tenGod,
    toKo: toKo, toTrueSolar: toTrueSolar, standardMeridian: standardMeridian,
    dstOffsetMinutes: dstOffsetMinutes, equationOfTime: equationOfTime,
    elementScore: elementScore, rootedElements: rootedElements,
    strength: strength, yongsin: yongsin, gyeokguk: gyeokguk, analyze: analyze,
    branchRelation: branchRelation
  };
})();
