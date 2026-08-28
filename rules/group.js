/* 우리끼리 — 같은 방 사람들을 한 화면에 놓고 "이럴 때 각자 어떻게 하는지"를 본다.

   왜 상황별인가
     "○○는 판을 벌리는 사람" 같은 라벨은 한 번 읽고 끝난다.
     "내가 힘들다고 했을 때"처럼 상황을 주면 읽으면서 각자 자기 얘기를 한다.
     방에서 말이 오가야 다시 던지게 된다.

   왜 대사인가
     설명문("말보다 손이 먼저 움직이는 쪽이야")은 정보고, 대사("밥은 먹었어?
     나 지금 나갈게")는 장면이다. 방에 붙여넣었을 때 웃음이 나는 건 장면 쪽이다.
     그래서 한 줄은 대사 + 괄호 해설 한 마디로 쓰고, 상황 끝에 방 전체를
     한 장면으로 묶는 마무리를 붙인다.

   왜 상황마다 축이 다른가
     축이 같으면 그 방에서 제일 센 사람이 매번 같은 자리를 가져간다.
     다섯 상황을 읽어도 사람마다 성격 하나가 다섯 번 반복될 뿐이다.
     그래서 상황마다 사주의 다른 곳을 본다 — 십신 세력, 일간, 오행,
     12운성·신살, 일지. 같은 사람이 상황마다 다른 얼굴로 나와야 읽을 맛이 난다.

   왜 각자 자기 것만 넣는가
     한 사람이 남의 생일을 대신 넣으면 두 가지가 같이 망가진다.
     동의 없이 남의 생일이 링크에 담기고, 링크를 받은 사람은 구경꾼이라
     다시 던질 이유가 없다. 그래서 이어달리기로 각자 자기 것만 넣는다.

   지키는 것 하나
     누구 하나를 깎아내리지 않는다. 방에 그대로 공유될 글이라
     당사자가 읽고 웃을 수 있어야지, 기분이 상하면 안 된다.
     괄호 해설도 흉이 아니라 애정이 담긴 관찰이어야 한다.

   입력: [{ name, saju, yong }]  (adaptSaju + findYongshin 결과)
   화면 그리기는 index.html에 있다. */

// ===== 사람을 가르는 축 =====
// 두 종류가 있다.
//   상대 — 이 방 안에서의 몫으로 정한다. 누구와 같이 보느냐에 따라 달라진다.
//   절대 — 그 사람 사주의 글자를 그대로 쓴다. 방이 바뀌어도 안 변한다.
// 둘을 섞어야 "이 방에서의 내 자리"와 "원래 나"가 같이 나온다.
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
// 절대 축 — 사람에게서 글자 하나를 뽑는다.
const PICK = {
  일간: p => p.saju.dayMaster.stem,                      // 갑을병정무기경신임계
  일지: p => (p.saju.pillars[2] || {}).branch            // 자축인묘진사오미신유술해
};

// ===== 상황 =====
// 한 줄은 { say: 그 사람이 할 법한 말, tag: 괄호 안 한 마디, end: 마무리에 들어갈 조각 }.
// say2·say3은 같은 자리에 사람이 둘·셋 겹칠 때 쓴다. 같은 성질이 맞으니
// 다른 얘기로 바꾸지 않고, 같은 성질을 다른 장면으로 보여준다.
// 절대 축(일간·일지)은 열두 글자뿐이라 셋까지 겹치므로 say3까지 둔다.
// 평가하지 않는다. 당사자가 읽고 웃을 수 있는 선까지만 쓴다.
const SITUATIONS = [
  {
    id: '힘들때',
    title: '내가 "나 힘들어" 했을 때',
    axis: '십신',
    gag: '정작 힘들다고 한 사람만 어리둥절.',
    반응: {
      비겁: { say: '그래서 어떻게 할 건데?', tag: '위로보다 다음 수부터', end: '대책을 짜는 중',
              say2: '내가 같이 가줄까?', tag2: '말로 안 끝내고 같이 움직임' },
      식상: { say: '아 그래서 걔가 뭐래? 야 그거 웃긴다ㅋㅋ', tag: '일단 웃겨놓고 시작', end: '분위기를 바꿔놓는 중',
              say2: '야 그래서 어떻게 됐는데ㅋㅋ 더 말해봐', tag2: '듣다가 자기가 더 신남' },
      재성: { say: '밥은 먹었어? 나 지금 나갈게', tag: '말보다 손이 먼저', end: '뭘 사러 나가는 중',
              say2: '뭐 필요한 거 없어?', tag2: '해결할 걸 먼저 찾음' },
      관성: { say: '자, 하나씩 정리해보자', tag: '감정보다 할 일부터', end: '상황을 정리하는 중',
              say2: '그건 네 잘못 아니야. 순서가 꼬인 거지', tag2: '감정 말고 구조를 봄' },
      인성: { say: '…응. 더 얘기해봐', tag: '재촉 없이 끝까지 들어줌', end: '말없이 듣는 중',
              say2: '천천히 생각해도 돼', tag2: '시간을 벌어줌' }
    }
  },
  {
    id: '메뉴',
    title: '"뭐 먹지?" 하고 물었을 때',
    axis: '일간',
    gag: '그래서 아직 아무것도 못 정함.',
    반응: {
      갑: { say: '새로 생긴 데 있던데', tag: '링크부터 던짐', end: '새 가게 링크를 던지는 중',
            say2: '그냥 내가 정할게, 여기 어때', tag2: '고민이 길어지면 먼저 질러버림',
            say3: '아 몰라 그냥 고고', tag3: '정하는 데 오래 걸리는 걸 못 견딤' },
      을: { say: '아까 나온 것 중에 두 번째가 나을 듯', tag: '듣고 있다가 한 방에 정리', end: '조용히 후보를 좁히는 중',
            say2: '다들 괜찮으면 난 그걸로', tag2: '남 얘기 다 듣고 마지막에 정함',
            say3: '난 뒤에 것도 괜찮아', tag3: '어느 쪽이든 맞춰줌' },
      병: { say: '난 아무거나!!', tag: '해놓고 제일 신나서 먹음', end: '아무거나를 외치는 중',
            say2: '오 좋다 좋다 그거 하자', tag2: '누가 말하든 일단 신남',
            say3: '오늘 뭔가 매운 게 당기는데', tag3: '그날 기분이 곧 메뉴' },
      정: { say: '어? ○○ 그거 못 먹지 않나', tag: '한 명씩 떠올려보느라 느림', end: '못 먹는 사람을 세는 중',
            say2: '매운 거 괜찮아? 진짜로?', tag2: '한 번 더 확인하고 넘어감',
            say3: '거기 자리 좁지 않나?', tag3: '가서 불편할 걸 미리 봄' },
      무: { say: '저번에 갔던 데 또 가자', tag: '실패가 없는 선택', end: '저번 그 집을 미는 중',
            say2: '거기 맛있잖아 왜', tag2: '한번 정한 건 잘 안 바꿈',
            say3: '멀리 가지 말고 근처로 하자', tag3: '움직이는 걸 최소화함' },
      기: { say: '난 진짜 상관없어~', tag: '근데 사실 가고 싶은 데가 하나 있음', end: '상관없다고만 하는 중',
            say2: '다들 정해지면 알려줘', tag2: '결정은 넘기고 결과는 잘 따름',
            say3: '난 늦게 가도 되니까 먼저들 정해', tag3: '자기 몫을 잘 안 주장함' },
      경: { say: '거기 지금 웨이팅 40분이야', tag: '찬물인데 맞는 말이라 반박 불가', end: '웨이팅 시간을 알려주는 중',
            say2: '그 집 지난번에 별로였어', tag2: '기억해뒀다가 정확히 짚음',
            say3: '거기 주차 안 돼', tag3: '결정적인 걸 하나 알고 있음' },
      신: { say: '거기 말고… 거기는 좀', tag: '별로인 걸 하나씩 지워나감', end: '후보를 지우는 중',
            say2: '음… 그건 좀 아닌 것 같은데', tag2: '마음에 안 들면 표정에 다 나옴',
            say3: '이왕 먹는 거 제대로 된 데 가자', tag3: '아무거나는 안 됨' },
      임: { say: '아무거나 시켜 나 다 먹어', tag: '진짜로 다 먹음', end: '다 먹겠다고 하는 중',
            say2: '양 많은 데로 가자', tag2: '기준이 아주 명확함',
            say3: '2차도 미리 정해놓자', tag3: '벌써 다음을 생각함' },
      계: { say: '다들 뭐 당겨?', tag: '자기 것보다 남 것을 먼저 물어봄', end: '남들한테 먼저 묻는 중',
            say2: '○○ 늦는다는데 기다릴까?', tag2: '빠진 사람부터 챙김',
            say3: '못 먹는 거 있는 사람?', tag3: '먼저 확인하고 시작함' }
    }
  },
  {
    id: '여행',
    title: '"여행 가자" 소리가 나왔을 때',
    axis: '오행',
    gag: '출발 사흘 전까지 확정된 건 날짜 하나.',
    반응: {
      목: { say: '그냥 이날 가자', tag: '날짜부터 박아버림', end: '날짜부터 박는 중',
            say2: '숙소는 나중에, 일단 표부터 끊자', tag2: '일단 저지르고 봄' },
      화: { say: '가서 이거 하고 저거 하고—', tag: '숙소는 아직 안 정했는데', end: '할 일부터 정하는 중',
            say2: '야 우리 거기서 이거 하면 진짜 웃기겠다', tag2: '가기 전부터 이미 신남' },
      토: { say: '숙소는 내가 예약할게', tag: '안 하면 아무도 안 하니까', end: '예약을 떠맡는 중',
            say2: '짐은 내가 챙길게', tag2: '남는 일을 조용히 가져감' },
      금: { say: '1인당 18만 원 나온다', tag: '미리 계산해둬서 나중에 아무도 안 삐짐', end: '정산표를 만드는 중',
            say2: '이거 취소 수수료 언제부터 붙어?', tag2: '손해 볼 데를 먼저 봄' },
      수: { say: '후기 보니까 거기 별로래', tag: '이미 스무 개는 읽고 옴', end: '후기를 스무 개째 읽는 중',
            say2: '거기 그 시즌엔 비 온대', tag2: '이미 다 찾아보고 옴' }
    }
  },
  {
    id: '단체방',
    title: '방에 사흘째 말이 없을 때',
    axis: '기세',
    gag: '그러다 또 3주 지나감.',
    반응: {
      앞장: { say: '다들 살아 있냐', tag: '조용한 걸 제일 못 견딤', end: '방을 깨우는 중',
              say2: '야 모임 하나 잡자', tag2: '조용하면 일을 만들어버림' },
      잠수: { say: '(읽음)', tag: '읽고는 있음. 만나면 제일 말 많음', end: '읽고 가만히 있는 중',
              say2: 'ㅇㅇ', tag2: '두 글자로 대화 종료' },
      분위기: { say: 'ㅋㅋㅋㅋ 이거 봐봐', tag: '애쓰는 게 아니라 그냥 그렇게 됨', end: '짤을 던지는 중',
              say2: 'ㅋㅋㅋㅋㅋㅋ', tag2: '일단 웃음부터 나옴' },
      움직임: { say: '그래서 언제 봐?', tag: '말로만 끝나는 걸 못 참음', end: '날짜를 꺼내는 중',
              say2: '이번 주말 다들 뭐해?', tag2: '일정을 먼저 물어봄' },
      관망: { say: '○○ 요즘 바쁜가?', tag: '누가 조용한지 다 보고 있음', end: '한 명을 조용히 챙기는 중',
              say2: '다들 잘 지내지?', tag2: '조용히 안부부터 물음' }
    }
  },
  {
    id: '취소',
    title: '약속이 당일에 깨졌을 때',
    axis: '일지',
    gag: '정작 취소한 사람만 아직 미안해함.',
    반응: {
      자: { say: '왜? 무슨 일인데?', tag: '이유를 알아야 넘어가짐', end: '이유를 캐묻는 중',
            say2: '아니 근데 진짜 왜?', tag2: '한 번 더 물어봄',
            say3: '아니 미리 말해주지…', tag3: '납득이 돼야 마음이 풀림' },
      축: { say: '그럼 다음 주는 되지?', tag: '그 자리에서 날짜를 다시 잡음', end: '다음 날짜를 잡는 중',
            say2: '달력 봐봐, 언제 돼?', tag2: '말 나온 김에 달력을 켬',
            say3: '그럼 이번 달 안에는 보는 거다', tag3: '흐지부지되는 걸 안 둠' },
      인: { say: '그럼 우리끼리 딴 거 하자', tag: '10분 만에 새 계획', end: '새 계획을 꺼내는 중',
            say2: '나 이미 나왔는데 그냥 만나자', tag2: '벌써 움직이는 중',
            say3: '나 그냥 혼자라도 갈래', tag3: '멈추는 게 더 답답함' },
      묘: { say: '어… 그럼 나 뭐하지', tag: '비어버린 그 시간을 제일 아까워함', end: '빈 시간을 아까워하는 중',
            say2: '하… 오늘 뭐 하지 진짜', tag2: '계획이 비는 걸 못 견딤',
            say3: '아 오늘 하루 통으로 비네', tag3: '비는 걸 제일 먼저 셈' },
      진: { say: '(조용히 다음 약속을 잡는다)', tag: '말없이 총대를 멤', end: '말없이 다음을 잡는 중',
            say2: '내가 다시 잡아볼게', tag2: '남는 일을 자기가 가져감',
            say3: '내가 단톡에 다시 올릴게', tag3: '뒷정리를 맡아버림' },
      사: { say: '헐 진짜?? 아 뭐야ㅠㅠ', tag: '제일 크게 아쉬워하고 제일 빨리 풀림', end: '제일 크게 아쉬워하는 중',
            say2: '아 진짜 기대했는데!!', tag2: '감정이 그대로 다 나옴',
            say3: '아 진짜 나 오늘만 기다렸는데', tag3: '숨기지를 못함' },
      오: { say: '아쉽다~ 그럼 나 딴 사람 만나야지', tag: '5분 만에 다음 약속', end: '벌써 딴 약속을 잡는 중',
            say2: '그럼 나 오늘 다른 약속 잡는다?', tag2: '빈자리를 바로 채움',
            say3: '그럼 오늘 나 혼자 놀아야지~', tag3: '금방 딴 재미를 찾음' },
      미: { say: '무슨 일 있어? 괜찮아?', tag: '취소한 사람을 먼저 걱정함', end: '취소한 사람을 걱정하는 중',
            say2: '무리하지 마, 다음에 봐', tag2: '상대 사정을 먼저 봐줌',
            say3: '괜찮아 괜찮아, 몸조리 잘해', tag3: '자기 아쉬움은 뒤로 미룸' },
      신: { say: '오케이 나 그 시간에 밀린 거 할게', tag: '계획을 바로 갈아끼움', end: '그 시간에 딴 걸 채우는 중',
            say2: '알겠어, 그럼 나 계획 바꾼다', tag2: '전환이 빠름',
            say3: '그럼 나 그 시간에 운동이나 갈게', tag3: '빈 시간을 바로 씀' },
      유: { say: '응, 괜찮아.', tag: '괜찮다는데 마침표가 좀 셈', end: '짧게 괜찮다고 하는 중',
            say2: '응 알겠어.', tag2: '더 말은 안 하는데 뭔가 남음',
            say3: '알겠어. 다음엔 좀 일찍 알려줘.', tag3: '조용한데 할 말은 함' },
      술: { say: '알겠어. 대신 다음엔 미리 말해줘', tag: '짚을 건 짚고 넘어감', end: '할 말은 하고 넘어가는 중',
            say2: '이번은 넘어가는데 다음엔 진짜야', tag2: '기준은 확실히 알려줌',
            say3: '이해는 하는데 좀 그렇다', tag3: '솔직하게 한마디 함' },
      해: { say: '괜찮아~ 다음에 보자', tag: '그러고는 왜 취소됐는지 혼자 오래 생각함', end: '혼자 오래 생각하는 중',
            say2: '뭐 사정 있었겠지', tag2: '이해는 하는데 오래 곱씹음',
            say3: '무슨 일 있나… 괜찮겠지', tag3: '혼자 상상이 길어짐' }
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

// 한 상황에서 각자에게 반응을 하나씩 준다.
// nth는 그 반응이 이 방에서 몇 번째로 쓰이는지 — 1이면 say, 2면 say2, 3 이상이면 say3.
function assignOne(sit, people) {
  const keys = Object.keys(sit.반응);

  // 절대 축 — 사주 글자를 그대로 쓴다. 같은 글자를 가진 사람은 실제로 같은 자리라
  // 다른 성질로 바꾸지 않고, 같은 성질의 다른 장면을 준다.
  if (PICK[sit.axis]) {
    const seen = {};
    return people.map(p => {
      let k;
      try { k = PICK[sit.axis](p); } catch (e) { k = null; }
      if (keys.indexOf(k) === -1) k = keys[0];
      return { name: p.name, key: k, nth: seen[k] = (seen[k] || 0) + 1 };
    });
  }

  // 상대 축 — 이 방에서 그 성질이 제일 두드러진 사람이 가져간다. 같은 반응은 한 명만.
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
  // 아무것도 못 받은 사람 — 남은 것 중 값이 가장 큰 것을 준다.
  // 방이 반응 수보다 크면(6명 × 반응 5개) 남는 게 없다. 그때는 값이 제일 큰 반응을
  // 다시 주되, 같은 대사가 두 줄 나오지 않게 다른 장면으로 쓴다.
  const nth = {};
  people.forEach((p, i) => {
    if (byPerson[i] !== undefined) return;
    let best = null, bestVal = -Infinity;
    keys.forEach(k => {
      if (used[k]) return;
      const v = table[i][k] || 0;
      if (v > bestVal) { bestVal = v; best = k; }
    });
    if (best) { byPerson[i] = best; used[best] = true; return; }
    let own = keys[0], ownVal = -Infinity;
    keys.forEach(k => { const v = table[i][k] || 0; if (v > ownVal) { ownVal = v; own = k; } });
    byPerson[i] = own;
    nth[own] = (nth[own] || 1) + 1;
    nth['@' + i] = nth[own];
  });

  return people.map((p, i) => ({ name: p.name, key: byPerson[i], nth: nth['@' + i] || 1 }));
}

// 한 사람 줄 하나. 겹친 순서에 따라 같은 성질의 다른 장면을 쓴다.
function rowOf(sit, r) {
  const v = sit.반응[r.key];
  const n = Math.min(r.nth || 1, v.say3 ? 3 : (v.say2 ? 2 : 1));
  return {
    name: r.name,
    say: n === 3 ? v.say3 : n === 2 ? v.say2 : v.say,
    tag: n === 3 ? v.tag3 : n === 2 ? v.tag2 : v.tag,
    end: v.end
  };
}

// 상황 하나를 한 장면으로 묶는 마무리.
// 매번 같은 두 사람이 나오면 그것도 단조로우니 상황마다 한 칸씩 돌린다.
// 둘이 같은 반응이면 장면이 안 되므로, 다른 반응을 가진 사람을 찾아 짝을 짓는다.
function closingLine(sit, rows, turn) {
  if (rows.length < 2) return '';
  const n = rows.length;
  const a = rows[turn % n];
  let b = null;
  for (let k = 1; k < n; k++) {
    const c = rows[(turn + k) % n];
    if (c.end !== a.end) { b = c; break; }
  }
  if (!b) return `결국 다 같이 ${a.end}. *${sit.gag}*`;
  return `결국 ${josa(a.name, '은/는')} ${a.end}, ${josa(b.name, '은/는')} ${b.end}. *${sit.gag}*`;
}

// ===== 이 방의 기운 =====
const 방_오행 = {
  목: { 많: '새로 하자는 이야기가 끊이지 않아. 대신 *벌여둔 걸 정리하는 사람*이 필요해.',
        없: '먼저 "이거 해보자"고 말하는 사람이 없어. *누가 총대를 메야* 움직이는 방이야.' },
  화: { 많: '모이면 확 달아올라. 대신 식는 것도 같이 빨라서 *날짜를 빨리 잡는 게* 좋아.',
        없: '차분하게 오래 가는 방이야. 대신 *분위기를 띄우는 건 일부러* 만들어야 해.' },
  토: { 많: '한번 정하면 오래 가는 방이야. 대신 *새로운 걸 시작하는 데* 시간이 걸려.',
        없: '이야기는 재밌는데 *실제로 만나는 날짜가 잘 안 정해져*. 한 명이 날짜만 잡아줘도 달라져.' },
  금: { 많: '기준이 분명해서 결정이 빨라. 대신 서로 말이 세질 때가 있으니 *한 박자 쉬어가면* 좋아.',
        없: '다들 좋은 게 좋다고 넘어가는 편이야. 결정을 미루다 흐지부지되지 않게 *마감을 정해두면* 좋아.' },
  수: { 많: '서로 눈치가 빨라서 말 안 해도 아는 게 많아. 대신 *속으로만 담아두면 오해가 쌓여*.',
        없: '솔직한 방이야. 대신 상대가 지금 어떤 상태인지는 *물어봐야* 알 수 있어.' }
};

function roomEnergy(people) {
  const merged = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  people.forEach(p => Object.keys(merged).forEach(e => merged[e] += p.saju.elems[e] || 0));
  const 많 = Object.keys(merged).sort((a, b) => merged[b] - merged[a])[0];
  const 없 = Object.keys(merged).filter(e => merged[e] === 0);
  const lines = [`이 방에는 *${많} 기운*이 제일 많아. ${방_오행[많].많}`];
  if (없.length) lines.push(`*${없.join('·')} 기운*은 이 방에 아무도 안 갖고 있어. ${방_오행[없[0]].없}`);
  else lines.push('*다섯 기운이 다 있는 방*이야. 누가 빠져도 어떻게든 굴러가는데, 그만큼 각자 역할을 안 말하면 서로 기대만 하다 끝나기도 해.');
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
          text:`${은는(a.name)} ${aNeed} 기운이 필요한데 ${이가(b.name)} 그걸 갖고 있어. 반대도 그래서, *둘이 같이 있을 때 서로 컨디션이 좋아지는* 조합이야.` });
      }
      if (rel === '육합' || rel === '삼합') {
        out.push({ a:a.name, b:b.name, kind:'합', weight:90,
          text:`${과와(a.name)} ${은는(b.name)} 가장 가까운 글자가 서로 묶여 있어. *설명 안 해도 통하는 게 많아서*, 둘이 먼저 정하고 나머지에게 알리는 그림이 자주 나와.` });
      } else if (rel === '방합') {
        out.push({ a:a.name, b:b.name, kind:'합', weight:76,
          text:`${과와(a.name)} ${은는(b.name)} 결이 비슷한 쪽이야. *같은 걸 재밌어해서* 둘이 붙으면 이야기가 길어져.` });
      } else if (rel === '충') {
        out.push({ a:a.name, b:b.name, kind:'충', weight:84,
          text:`${과와(a.name)} ${은는(b.name)} *서로를 흔드는 사이*야. 나쁜 게 아니라 둘이 붙으면 결정이 빨라져. 대신 말이 세질 수 있으니 급할 때는 한 명이 한 박자 쉬어주면 좋아.` });
      }
      if (ab.branch === bb.branch) {
        out.push({ a:a.name, b:b.name, kind:'같음', weight:70,
          text:`${과와(a.name)} ${은는(b.name)} 같은 글자를 갖고 있어. *편한 것도 불편한 것도 비슷해서*, 둘이 동시에 지치는 날이 있어.` });
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

// 대사 속 ○○ 는 같은 방의 다른 사람 이름으로 바꾼다.
// "○○ 요즘 바쁜가?"보다 "막내 요즘 바쁜가?"가 훨씬 자기 얘기 같다.
// 조사가 붙지 않는 자리에만 ○○ 를 두었으므로 이름을 그대로 끼워도 말이 된다.
function fillNames(rows) {
  const n = rows.length;
  rows.forEach((r, i) => {
    if (r.say.indexOf('○○') === -1) return;
    r.say = r.say.replace(/○○/g, rows[(i + 1) % n].name);
  });
  return rows;
}

// ===== 전체 =====
function analyzeGroup(people) {
  return {
    situations: SITUATIONS.map((sit, i) => {
      const rows = fillNames(assignOne(sit, people).map(r => rowOf(sit, r)));
      return { id: sit.id, title: sit.title, rows, close: closingLine(sit, rows, i) };
    }),
    room: roomEnergy(people),
    pairs: pairNotes(people)
  };
}
