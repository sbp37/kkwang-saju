/* 단톡사주 — 여러 명을 한 번에 놓고 "이 방에서 각자 어떤 자리인지"를 본다.

   원칙 하나만 지킨다: 누구 하나를 깎아내리지 않는다.
   "여행 망치는 사람"은 안 되고 "재밌는 데 꽂히면 딴 길로 새는 사람"은 된다.
   같은 성질이라도 그 사람 입장에서 말이 되게 쓴다. 방에 공유될 글이라
   당사자가 읽고 웃을 수 있어야지, 기분이 상하면 안 된다.

   역할은 절대값이 아니라 이 방 안에서의 상대 순위로 정한다.
   같은 사람도 누구와 같이 보느냐에 따라 다른 자리가 나온다. 그게 재미다.

   입력: [{ name, saju, yong }]  (adaptSaju + findYongshin 결과)
   화면 그리기는 index.html에 있다. */

// ===== 역할 =====
// score(p, all) 은 이 방에서 그 자리를 얼마나 세게 주장하는지다.
// 축마다 단위가 다르므로 아래 shareOf로 "몫 - 평균몫"으로 바꿔서 비교한다.
const GROUP_ROLES = [
  { id:'식상', name:'판을 벌리는 사람',
    desc:'뭐 하자는 말이 대체로 여기서 시작해. 재밌겠다 싶으면 일단 던지고 보는 쪽이라, 이 방이 심심할 틈이 없어.',
    value:p => p.yong.g.식상 },
  { id:'재성', name:'계산이 되는 사람',
    desc:'얼마 드는지, 몇 시에 만나야 되는지를 자연스럽게 떠올려. 신나는 이야기에 현실 감각을 한 스푼 얹는 자리야.',
    value:p => p.yong.g.재성 },
  { id:'관성', name:'선을 잡아주는 사람',
    desc:'약속을 지키고 무리한 건 무리라고 말해줘. 재미없어 보여도 이 사람이 있어서 판이 안 엎어지는 거야.',
    value:p => p.yong.g.관성 },
  { id:'인성', name:'먼저 알아보는 사람',
    desc:'가기 전에 이미 다 찾아봤어. 남들이 고민할 때 정리된 답을 꺼내놓는 쪽이라, 결정이 빨라져.',
    value:p => p.yong.g.인성 },
  { id:'비겁', name:'결국 정하는 사람',
    desc:'다들 "아무거나" 할 때 하나를 고르는 자리야. 정해주면 편한 사람이 많다는 걸 이 사람이 제일 잘 알아.',
    value:p => p.yong.g.비겁 },

  { id:'역마', name:'먼저 움직이는 사람',
    desc:'말만 나오면 벌써 검색하고 있어. 가만히 있는 걸 제일 힘들어해서, 이 방의 계획이 실제로 굴러가게 만들어.',
    value:p => salCount(p, '역마살') * 10 + salCount(p, '지살') * 4 },
  { id:'화개', name:'혼자 정리해 오는 사람',
    desc:'단톡에서는 조용한데 만나면 할 말이 제일 많아. 혼자 생각하는 시간이 있어야 좋은 게 나오는 쪽이야.',
    value:p => salCount(p, '화개살') * 10 },
  { id:'도화', name:'분위기를 만드는 사람',
    desc:'이 사람이 들어오면 대화 온도가 올라가. 애써 웃기려는 게 아니라 그냥 같이 있으면 편해지는 쪽이야.',
    value:p => salCount(p, '도화살') * 8 + salCount(p, '년살') * 6 },
  { id:'천을', name:'어쩐지 잘 풀리는 사람',
    desc:'되게 애쓴 것 같지도 않은데 결정적인 순간에 도와줄 사람이 나타나. 본인은 운이라고 하지만 평소에 쌓아둔 거야.',
    value:p => salCount(p, '천을귀인') * 12 },

  { id:'끝까지', name:'끝까지 남는 사람',
    desc:'다들 지쳐서 갈 때 마지막까지 자리를 지켜. 체력이라기보다 시작한 걸 어중간하게 두는 게 싫은 쪽이야.',
    value:p => ({ 건록:12, 제왕:12, 관대:8, 장생:5 }[stage(p)] || 0) },
  { id:'꽂힘', name:'한번 꽂히면 오래 가는 사람',
    desc:'관심 없는 건 정말 관심이 없고, 꽂힌 건 끝을 봐. 취향이 분명해서 이 방의 기준점이 되는 자리야.',
    value:p => zeroCount(p) * 8 },
  { id:'균형', name:'중간에서 맞추는 사람',
    desc:'양쪽 말이 다 이해돼서 가운데 서게 돼. 편들지 않는 게 아니라 둘 다 맞는 게 보이는 거야.',
    value:p => Math.pow(Math.max(0, 13 - spread(p)), 3) },
  { id:'뒷말', name:'다 듣고 마지막에 말하는 사람',
    desc:'말수가 적은 게 할 말이 없어서가 아니야. 다 듣고 나서 꺼내는 한마디가 제일 정확한 자리야.',
    value:p => (p.yong.weak && p.yong.g.인성 >= p.yong.g.식상) ? 10 + p.yong.g.인성 * 0.4 : 0 },

  { id:'목', name:'새로 시작하자는 사람',
    desc:'하던 걸 또 하는 걸 못 견뎌. 이 방에 새 이야기가 계속 들어오는 건 이 사람 덕이야.',
    value:p => p.saju.elems.목 * 6 },
  { id:'화', name:'판이 커지면 신나는 사람',
    desc:'사람이 많을수록 살아나. 조용한 자리도 이 사람 한 명 오면 분위기가 달라져.',
    value:p => p.saju.elems.화 * 6 },
  { id:'토', name:'약속을 붙잡아 두는 사람',
    desc:'흩어질 것 같은 이야기를 날짜와 장소로 바꿔놔. 이 방이 진짜로 만나는 건 이 사람이 있어서야.',
    value:p => p.saju.elems.토 * 6 },
  { id:'금', name:'하나씩 정리해 가는 사람',
    desc:'벌여둔 것 중에 뭘 접을지 말해줄 수 있는 사람이야. 냉정한 게 아니라 남는 걸 챙기는 거야.',
    value:p => p.saju.elems.금 * 6 },
  { id:'수', name:'조용히 챙기는 사람',
    desc:'티 안 나게 사람을 살펴. 누가 빠졌는지, 누가 오늘 좀 안 좋은지 제일 먼저 아는 자리야.',
    value:p => p.saju.elems.수 * 6 }
];

function salCount(p, name) {
  let n = 0;
  p.saju.pillars.forEach(x => {
    if (x.missing) return;
    if ((x.specialSals || []).indexOf(name) !== -1) n++;
    if (x.twelveSal === name) n++;
  });
  return n;
}
function stage(p) {
  const day = p.saju.pillars[2];
  return day && !day.missing ? (day.stage12 || '') : '';
}
function zeroCount(p) {
  return ['목', '화', '토', '금', '수'].filter(e => p.saju.elems[e] === 0).length;
}
function spread(p) {
  // 오행이 고르게 퍼져 있을수록 작다
  const v = ['목', '화', '토', '금', '수'].map(e => p.saju.elems[e]);
  const avg = v.reduce((a, b) => a + b, 0) / 5;
  return Math.sqrt(v.reduce((a, b) => a + (b - avg) * (b - avg), 0) / 5) * 4;
}

// 방 안에서의 몫으로 바꾼다. 0이면 평균, 양수면 이 방에서 그 성질이 두드러진다는 뜻.
function shareOf(values, i) {
  const total = values.reduce((a, b) => a + Math.max(0, b), 0);
  if (total <= 0) return null;                 // 아무도 해당 없음 → 이 자리는 안 쓴다
  return Math.max(0, values[i]) / total - 1 / values.length;
}

// 각자에게 자리를 하나씩 준다. 같은 자리를 둘이 갖지 않는다.
function assignRoles(people) {
  const claims = [];
  GROUP_ROLES.forEach(role => {
    const values = people.map(p => { try { return role.value(p); } catch (e) { return 0; } });
    people.forEach((p, i) => {
      const s = shareOf(values, i);
      if (s === null || s <= 0) return;        // 이 방에서 두드러지지 않으면 주장하지 않는다
      claims.push({ person: i, role: role, score: s });
    });
  });
  // 주장이 센 순서대로 자리를 채운다
  claims.sort((a, b) => b.score - a.score || a.role.id.localeCompare(b.role.id));
  const byPerson = {}, usedRole = {};
  claims.forEach(c => {
    if (byPerson[c.person] || usedRole[c.role.id]) return;
    byPerson[c.person] = c.role;
    usedRole[c.role.id] = true;
  });
  // 아무 자리도 못 받은 사람 — 남은 자리 중 값이 가장 큰 것을 준다
  people.forEach((p, i) => {
    if (byPerson[i]) return;
    let best = null, bestVal = -Infinity;
    GROUP_ROLES.forEach(role => {
      if (usedRole[role.id]) return;
      let v = 0; try { v = role.value(p); } catch (e) { v = 0; }
      if (v > bestVal) { bestVal = v; best = role; }
    });
    byPerson[i] = best || GROUP_ROLES[0];
    if (best) usedRole[best.id] = true;
  });
  return people.map((p, i) => ({ name: p.name, role: byPerson[i] }));
}

// ===== 이 방의 기운 =====
const 방_오행 = {
  목: { 많: '새로 시작하는 이야기가 끊이지 않아. 대신 벌여둔 걸 정리하는 사람이 필요해.',
        없: '먼저 "이거 해보자"고 말하는 사람이 없어. 누가 총대를 메야 움직이는 방이야.' },
  화: { 많: '모이면 확 달아올라. 대신 식는 것도 같이 빨라서 날짜를 빨리 잡는 게 좋아.',
        없: '차분하게 오래 가는 방이야. 대신 분위기를 띄우는 건 일부러 만들어야 해.' },
  토: { 많: '한번 정하면 오래 가는 방이야. 대신 새로운 걸 시작하는 데 시간이 걸려.',
        없: '이야기는 재밌는데 실제로 만나는 날짜가 잘 안 정해져. 한 명이 날짜만 잡아줘도 달라져.' },
  금: { 많: '기준이 분명해서 결정이 빨라. 대신 서로 말이 세질 때가 있으니 한 박자 쉬어가면 좋아.',
        없: '다들 좋은 게 좋다고 넘어가는 편이야. 결정을 미루다 흐지부지되지 않게 마감을 정해둬.' },
  수: { 많: '서로 눈치가 빨라서 말 안 해도 아는 게 많아. 대신 속으로만 담아두면 오해가 쌓여.',
        없: '솔직한 방이야. 대신 상대가 지금 어떤 상태인지는 물어봐야 알 수 있어.' }
};

function roomEnergy(people) {
  const merged = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  people.forEach(p => Object.keys(merged).forEach(e => merged[e] += p.saju.elems[e] || 0));
  const 순 = Object.keys(merged).sort((a, b) => merged[b] - merged[a]);
  const 많 = 순[0];
  const 없 = Object.keys(merged).filter(e => merged[e] === 0);
  const lines = [`이 방에는 ${많} 기운이 제일 많아. ${방_오행[많].많}`];
  if (없.length) lines.push(`${없.join('·')} 기운은 이 방에 아무도 안 갖고 있어. ${방_오행[없[0]].없}`);
  else lines.push('다섯 기운이 다 있는 방이야. 누가 빠져도 어떻게든 굴러가는데, 그만큼 각자 역할을 안 말하면 서로 기대만 하다 끝나기도 해.');
  return { merged, 많, 없, lines };
}

// ===== 둘씩 묶어서 =====
function pairNotes(people) {
  // 이름은 사용자가 적은 별명이라 받침이 제각각이다. 조사는 josa로 붙인다.
  const 은는 = n => josa(n, '은/는');
  const 이가 = n => josa(n, '이/가');
  const 과와 = n => josa(n, '과/와');
  const out = [];
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const a = people[i], b = people[j];
      const ab = a.saju.pillars[2], bb = b.saju.pillars[2];
      if (!ab || !bb || ab.missing || bb.missing) continue;
      const rel = KSaju.branchRelation(ab.branch, bb.branch);
      const aNeed = a.yong.elem, bNeed = b.yong.elem;
      if ((b.saju.elems[aNeed] || 0) >= 2 && (a.saju.elems[bNeed] || 0) >= 2) {
        out.push({ a:a.name, b:b.name, kind:'채움', weight:100,
          text:`${은는(a.name)} ${aNeed} 기운이 필요한데 ${이가(b.name)} 그걸 갖고 있어. 반대도 그래서, 둘이 같이 있을 때 서로 컨디션이 좋아지는 조합이야.` });
      }
      if (rel === '육합' || rel === '삼합') {
        out.push({ a:a.name, b:b.name, kind:'합', weight:90,
          text:`${과와(a.name)} ${은는(b.name)} 가까운 자리가 서로 묶여 있어. 설명 안 해도 통하는 게 많아서, 둘이 먼저 정하고 나머지에게 알리는 그림이 자주 나와.` });
      } else if (rel === '방합') {
        out.push({ a:a.name, b:b.name, kind:'합', weight:76,
          text:`${과와(a.name)} ${은는(b.name)} 결이 비슷한 쪽이야. 같은 걸 재밌어해서 둘이 붙으면 이야기가 길어져.` });
      } else if (rel === '충') {
        out.push({ a:a.name, b:b.name, kind:'충', weight:84,
          text:`${과와(a.name)} ${은는(b.name)} 서로를 흔드는 자리야. 나쁜 게 아니라 둘이 붙으면 결정이 빨라져. 대신 말이 세질 수 있으니 급할 때는 한 명이 한 박자 쉬어주면 좋아.` });
      }
      if (ab.branch === bb.branch) {
        out.push({ a:a.name, b:b.name, kind:'같음', weight:70,
          text:`${과와(a.name)} ${은는(b.name)} 같은 글자를 갖고 있어. 편한 것도 불편한 것도 비슷해서, 둘이 동시에 지치는 날이 있어.` });
      }
    }
  }
  out.sort((x, y) => y.weight - x.weight);
  // 같은 종류만 세 줄 나오면 읽을 게 없다. 종류를 섞고, 한 사람이 두 번까지만 나오게 한다.
  const seen = {}, usedKind = {}, picked = [];
  const take = filter => out.forEach(o => {
    if (picked.length >= 3 || !filter(o)) return;
    if (picked.indexOf(o) !== -1) return;
    if ((seen[o.a] || 0) >= 2 || (seen[o.b] || 0) >= 2) return;
    seen[o.a] = (seen[o.a] || 0) + 1;
    seen[o.b] = (seen[o.b] || 0) + 1;
    usedKind[o.kind] = (usedKind[o.kind] || 0) + 1;
    picked.push(o);
  });
  take(o => !usedKind[o.kind]);          // 종류마다 한 줄씩 먼저
  take(() => true);                      // 남으면 점수순으로 채운다
  return picked;
}

// ===== 전체 =====
function analyzeGroup(people) {
  return {
    roles: assignRoles(people),
    room: roomEnergy(people),
    pairs: pairNotes(people)
  };
}
