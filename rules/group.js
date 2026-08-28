/* 우리끼리 — 같은 방 사람들을 한 화면에 놓고 "이럴 때 각자 어떻게 하는지"를 본다.

   왜 상황별인가
     "○○는 판을 벌리는 사람" 같은 라벨은 한 번 읽고 끝난다.
     "내가 힘들다고 했을 때"처럼 상황을 주면 읽으면서 각자 자기 얘기를 한다.
     방에서 말이 오가야 다시 던지게 된다.

   왜 각자 자기 것만 넣는가
     한 사람이 남의 생일을 대신 넣으면 두 가지가 같이 망가진다.
     동의 없이 남의 생일이 링크에 담기고, 링크를 받은 사람은 구경꾼이라
     다시 던질 이유가 없다. 그래서 이어달리기로 각자 자기 것만 넣는다.

   지키는 것 하나
     누구 하나를 깎아내리지 않는다. 방에 그대로 공유될 글이라
     당사자가 읽고 웃을 수 있어야지, 기분이 상하면 안 된다.
     같은 성질이라도 그 사람 입장에서 말이 되게 쓴다.

   반응은 절대값이 아니라 이 방 안에서의 상대 순위로 정한다.
   같은 사람도 누구와 같이 보느냐에 따라 다른 반응이 나온다. 그게 재미다.

   입력: [{ name, saju, yong }]  (adaptSaju + findYongshin 결과)
   화면 그리기는 index.html에 있다. */

// ===== 사람을 가르는 축 =====
// 상황마다 다른 축을 쓴다. 같은 축만 쓰면 매번 같은 사람이 같은 자리에 선다.
const AXIS = {
  십신: p => p.yong.g,                                   // 비겁·식상·재성·관성·인성 세력
  오행: p => p.saju.elems,                               // 목·화·토·금·수 글자 수
  기세: p => ({                                          // 12운성과 신살로 본 움직임
    앞장: ({ 건록:12, 제왕:12, 관대:9 }[stage(p)] || 0) + salCount(p, '장성살') * 6,
    잠수: ({ 묘:12, 절:10, 양:8, 사:8 }[stage(p)] || 0) + salCount(p, '화개살') * 6,
    분위기: salCount(p, '도화살') * 8 + salCount(p, '년살') * 6 + p.saju.elems.화 * 2,
    움직임: salCount(p, '역마살') * 8 + salCount(p, '지살') * 5 + p.saju.elems.목 * 2,
    관망: ({ 목욕:9, 태:9, 병:8, 쇠:8 }[stage(p)] || 0) + (p.yong.weak ? 5 : 0)
  })
};

// ===== 상황 =====
// 반응은 그 사람이 실제로 할 법한 행동 하나. 평가하지 않는다.
const SITUATIONS = [
  {
    id: '힘들때',
    title: '내가 힘들다고 했을 때',
    axis: '십신',
    반응: {
      비겁: '“그래서 어떻게 할 건데?” 먼저 물어. 위로보다 다음 수를 같이 정해주는 쪽이야.',
      식상: '일단 웃겨놓고 본다. 분위기부터 바꾼 다음에야 진짜 얘기를 꺼내.',
      재성: '“밥은 먹었어?” 하고 뭘 사 와. 말보다 손이 먼저 움직이는 쪽이야.',
      관성: '끝까지 듣고 나서 상황을 정리해줘. 감정보다 다음에 할 일을 먼저 짚어.',
      인성: '별말 없이 옆에 오래 있어줘. 재촉 안 하는 게 이 사람 방식이야.'
    }
  },
  {
    id: '메뉴',
    title: '다 같이 뭐 먹을지 정할 때',
    axis: '오행',
    반응: {
      목: '“새로 생긴 데 있던데” 하고 링크부터 던져.',
      화: '“난 아무거나!” 해놓고 남이 고른 걸 제일 신나서 먹어.',
      토: '지난번에 다 같이 좋았던 그 집을 또 얘기해. 실패가 없지.',
      금: '“거기 웨이팅 길어” 하고 현실적인 정보를 하나 꺼내.',
      수: '아무 말 안 하다가 “못 먹는 사람 없지?” 하고 한 명을 챙겨.'
    }
  },
  {
    id: '여행',
    title: '여행 계획을 짤 때',
    axis: '십신',
    반응: {
      비겁: '“그냥 이날 가자” 하고 날짜를 먼저 박아버려. 그래야 굴러가는 걸 아는 거야.',
      식상: '가서 뭐 할지부터 신나게 얘기해. 아직 숙소도 안 정했는데.',
      재성: '1인당 얼마인지 제일 먼저 계산해. 그 덕에 아무도 안 삐지지.',
      관성: '숙소·교통 예약을 결국 이 사람이 해. 안 하면 아무도 안 하니까.',
      인성: '가기도 전에 후기를 스무 개는 읽고 와. 물어보면 다 답이 나와.'
    }
  },
  {
    id: '단체방',
    title: '방에 말이 없어졌을 때',
    axis: '기세',
    반응: {
      앞장: '“다들 살아 있냐” 하고 먼저 깨워. 조용한 걸 제일 못 견뎌.',
      잠수: '읽고 있는데 말은 안 해. 만나면 그때 얘기를 제일 많이 하지.',
      분위기: '아무거나 하나 던져서 다시 웃게 만들어. 애쓰는 게 아니라 그냥 그렇게 돼.',
      움직임: '“그래서 언제 봐?” 하고 만날 날짜를 꺼내. 말로만 끝나는 걸 싫어해.',
      관망: '분위기를 먼저 살펴. 누가 안 좋은 것 같으면 따로 연락하는 쪽이야.'
    }
  },
  {
    id: '취소',
    title: '약속이 갑자기 깨졌을 때',
    axis: '오행',
    반응: {
      목: '“그럼 딴 거 하자” 하고 바로 다음 계획을 꺼내.',
      화: '그 자리에서 제일 아쉬워하는데, 또 제일 빨리 풀려.',
      토: '“그럼 다음 주는 되지?” 하고 날짜부터 다시 잡아.',
      금: '“괜찮아” 하고 넘어가는데, 이유는 한 번 물어보고 넘어가.',
      수: '괜찮다고 하고는 왜 취소됐는지 혼자 오래 생각해.'
    }
  }
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

// 방 안에서의 몫. 0이면 평균, 양수면 이 방에서 그 성질이 두드러진다는 뜻.
function shareOf(values, i) {
  const total = values.reduce((a, b) => a + Math.max(0, b), 0);
  if (total <= 0) return null;
  return Math.max(0, values[i]) / total - 1 / values.length;
}

// 한 상황에서 각자에게 반응을 하나씩 준다. 같은 반응을 두 사람이 갖지 않는다.
function assignOne(sit, people) {
  const keys = Object.keys(sit.반응);
  const score = AXIS[sit.axis];
  const table = people.map(p => { try { return score(p); } catch (e) { return {}; } });

  const claims = [];
  keys.forEach(k => {
    const values = table.map(v => v[k] || 0);
    people.forEach((p, i) => {
      const s = shareOf(values, i);
      if (s === null || s <= 0) return;       // 이 방에서 두드러지지 않으면 주장하지 않는다
      claims.push({ person: i, key: k, score: s });
    });
  });
  claims.sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));

  const byPerson = {}, used = {};
  claims.forEach(c => {
    if (byPerson[c.person] !== undefined || used[c.key]) return;
    byPerson[c.person] = c.key;
    used[c.key] = true;
  });
  // 아무것도 못 받은 사람 — 남은 것 중 값이 가장 큰 것을 준다
  people.forEach((p, i) => {
    if (byPerson[i] !== undefined) return;
    let best = null, bestVal = -Infinity;
    keys.forEach(k => {
      if (used[k]) return;
      const v = table[i][k] || 0;
      if (v > bestVal) { bestVal = v; best = k; }
    });
    byPerson[i] = best || keys[0];
    if (best) used[best] = true;
  });

  return people.map((p, i) => ({ name: p.name, text: sit.반응[byPerson[i]] }));
}

// ===== 이 방의 기운 =====
const 방_오행 = {
  목: { 많: '새로 하자는 이야기가 끊이지 않아. 대신 벌여둔 걸 정리하는 사람이 필요해.',
        없: '먼저 "이거 해보자"고 말하는 사람이 없어. 누가 총대를 메야 움직이는 방이야.' },
  화: { 많: '모이면 확 달아올라. 대신 식는 것도 같이 빨라서 날짜를 빨리 잡는 게 좋아.',
        없: '차분하게 오래 가는 방이야. 대신 분위기를 띄우는 건 일부러 만들어야 해.' },
  토: { 많: '한번 정하면 오래 가는 방이야. 대신 새로운 걸 시작하는 데 시간이 걸려.',
        없: '이야기는 재밌는데 실제로 만나는 날짜가 잘 안 정해져. 한 명이 날짜만 잡아줘도 달라져.' },
  금: { 많: '기준이 분명해서 결정이 빨라. 대신 서로 말이 세질 때가 있으니 한 박자 쉬어가면 좋아.',
        없: '다들 좋은 게 좋다고 넘어가는 편이야. 결정을 미루다 흐지부지되지 않게 마감을 정해두면 좋아.' },
  수: { 많: '서로 눈치가 빨라서 말 안 해도 아는 게 많아. 대신 속으로만 담아두면 오해가 쌓여.',
        없: '솔직한 방이야. 대신 상대가 지금 어떤 상태인지는 물어봐야 알 수 있어.' }
};

function roomEnergy(people) {
  const merged = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  people.forEach(p => Object.keys(merged).forEach(e => merged[e] += p.saju.elems[e] || 0));
  const 많 = Object.keys(merged).sort((a, b) => merged[b] - merged[a])[0];
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
          text:`${과와(a.name)} ${은는(b.name)} 가장 가까운 글자가 서로 묶여 있어. 설명 안 해도 통하는 게 많아서, 둘이 먼저 정하고 나머지에게 알리는 그림이 자주 나와.` });
      } else if (rel === '방합') {
        out.push({ a:a.name, b:b.name, kind:'합', weight:76,
          text:`${과와(a.name)} ${은는(b.name)} 결이 비슷한 쪽이야. 같은 걸 재밌어해서 둘이 붙으면 이야기가 길어져.` });
      } else if (rel === '충') {
        out.push({ a:a.name, b:b.name, kind:'충', weight:84,
          text:`${과와(a.name)} ${은는(b.name)} 서로를 흔드는 사이야. 나쁜 게 아니라 둘이 붙으면 결정이 빨라져. 대신 말이 세질 수 있으니 급할 때는 한 명이 한 박자 쉬어주면 좋아.` });
      }
      if (ab.branch === bb.branch) {
        out.push({ a:a.name, b:b.name, kind:'같음', weight:70,
          text:`${과와(a.name)} ${은는(b.name)} 같은 글자를 갖고 있어. 편한 것도 불편한 것도 비슷해서, 둘이 동시에 지치는 날이 있어.` });
      }
    }
  }
  out.sort((x, y) => y.weight - x.weight);
  // 같은 종류만 나오면 읽을 게 없다. 종류를 먼저 섞고, 한 사람이 두 번까지만 나오게 한다.
  const seen = {}, usedKind = {}, picked = [];
  const take = filter => out.forEach(o => {
    if (picked.length >= 3 || !filter(o) || picked.indexOf(o) !== -1) return;
    if ((seen[o.a] || 0) >= 2 || (seen[o.b] || 0) >= 2) return;
    seen[o.a] = (seen[o.a] || 0) + 1;
    seen[o.b] = (seen[o.b] || 0) + 1;
    usedKind[o.kind] = (usedKind[o.kind] || 0) + 1;
    picked.push(o);
  });
  take(o => !usedKind[o.kind]);
  take(() => true);
  return picked;
}

// ===== 전체 =====
function analyzeGroup(people) {
  return {
    situations: SITUATIONS.map(sit => ({
      id: sit.id, title: sit.title, rows: assignOne(sit, people)
    })),
    room: roomEnergy(people),
    pairs: pairNotes(people)
  };
}
