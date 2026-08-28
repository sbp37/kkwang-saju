// 지지끼리 묶이는 관계. 방합(계절의 합)도 같은 방향으로 본다.
const 지지합 = rel => rel === '육합' || rel === '삼합' || rel === '방합';

/* 궁합 규칙
   두 사람의 사주를 맞대어 관계의 결과 항목별 문장을 만든다. 화면 그리기는 index.html에 있다. */
// ===== 궁합 =====
// 점수를 매기지 않는다. 이 앱은 대운도 좋고 나쁨 대신 "어떤 주제가 반복되는지"로 보여준다.
// 궁합도 같은 원칙으로, 몇 점이 아니라 "어떤 사이인지"를 설명한다.

// 천간합 — 두 글자가 서로를 붙잡는 관계
const STEM_HAP = { 갑:'기', 기:'갑', 을:'경', 경:'을', 병:'신', 신:'병', 정:'임', 임:'정', 무:'계', 계:'무' };
// 천간충
const STEM_CHUNG = { 갑:'경', 경:'갑', 을:'신', 신:'을', 병:'임', 임:'병', 정:'계', 계:'정' };
const TTI = { 자:'쥐', 축:'소', 인:'호랑이', 묘:'토끼', 진:'용', 사:'뱀', 오:'말', 미:'양', 신:'원숭이', 유:'닭', 술:'개', 해:'돼지' };

// 상대의 기운이 내 사주에서 어떤 역할이 되는지
function matchTenGod(myStem, otherStem) { return KSaju.tenGod(myStem, otherStem); }

function analyzeMatch(a, b) {
  // a, b = adaptSaju 결과 + findYongshin 결과를 담은 {saju, yong}
  const A = a.saju, B = b.saju;
  const aStem = A.dayMaster.stem, bStem = B.dayMaster.stem;
  const aBranch = A.pillars[2].branch, bBranch = B.pillars[2].branch;
  const aYear = A.pillars[0].branch, bYear = B.pillars[0].branch;

  // 1) 일간끼리 — 관계의 기본 온도
  const aToB = matchTenGod(aStem, bStem);   // 상대가 나에게
  const bToA = matchTenGod(bStem, aStem);   // 내가 상대에게
  const stemHap = STEM_HAP[aStem] === bStem;
  const stemChung = STEM_CHUNG[aStem] === bStem;
  const sameStem = aStem === bStem;
  const sameElem = KSaju.STEM_EL[aStem] === KSaju.STEM_EL[bStem];

  // 2) 일지끼리 — 배우자 자리끼리의 관계. 궁합에서 가장 크게 본다.
  const branchRel = KSaju.branchRelation(aBranch, bBranch);
  const sameBranch = aBranch === bBranch;

  // 3) 띠(연지)
  const yearRel = KSaju.branchRelation(aYear, bYear);

  // 4) 용신 보완 — 실제로 같이 있을 때 편한지를 가장 잘 설명한다
  const aNeed = a.yong.elem, bNeed = b.yong.elem;
  const bHasForA = (B.elems[aNeed] || 0);
  const aHasForB = (A.elems[bNeed] || 0);
  const 보완 = bHasForA >= 2 && aHasForB >= 2 ? '서로'
             : bHasForA >= 2 ? '상대가나를'
             : aHasForB >= 2 ? '내가상대를'
             : '약함';

  // 5) 오행을 합쳤을 때 균형
  const merged = {};
  ['목','화','토','금','수'].forEach(e => merged[e] = (A.elems[e] || 0) + (B.elems[e] || 0));
  const mergedZero = ['목','화','토','금','수'].filter(e => merged[e] === 0);
  const myZeroFilled = ['목','화','토','금','수'].filter(e => (A.elems[e] || 0) === 0 && (B.elems[e] || 0) > 0);

  // 6) 격국 조합
  const aGyeok = a.yong.gyeokguk.name, bGyeok = b.yong.gyeokguk.name;
  const aGroup = a.yong.gyeokguk.group, bGroup = b.yong.gyeokguk.group;

  // 관계의 "결"을 정한다 — 점수가 아니라 유형
  let 결, 결설명;
  if (stemHap && 지지합(branchRel)) {
    결 = '서로 끌어당기는 사이';
    결설명 = '중심 기운끼리도, 가장 가까운 글자끼리도 서로를 붙잡는 구조야. 처음부터 편하게 느껴지는 조합이야.';
  } else if (stemHap) {
    결 = '마음이 먼저 붙는 사이';
    결설명 = '두 사람의 중심 기운이 서로를 끌어당겨. 이유를 설명하기 전에 마음이 먼저 가는 쪽이야.';
  } else if (지지합(branchRel)) {
    결 = '같이 있으면 편한 사이';
    결설명 = '두 사람의 가장 가까운 글자끼리 잘 묶여 있어. 크게 애쓰지 않아도 생활이 맞춰지는 조합이야.';
  } else if (branchRel === '충') {
    결 = '부딪히며 크는 사이';
    결설명 = '가장 가까운 글자끼리 정면으로 만나. 지루할 틈은 없는데, 같은 문제로 반복해서 부딪힐 수도 있어.';
  } else if (보완 === '서로') {
    결 = '서로 채워주는 사이';
    결설명 = '한쪽이 부족한 걸 다른 쪽이 갖고 있어. 처음엔 강렬하지 않아도 같이 있을수록 편해지는 조합이야.';
  } else if (sameStem || (sameElem && sameBranch)) {
    결 = '닮아서 편한 사이';
    결설명 = '결이 비슷해서 말이 빨리 통해. 대신 약점도 같아서 둘 다 놓치는 부분이 생겨.';
  } else if (stemChung) {
    결 = '보는 눈이 다른 사이';
    결설명 = '보는 방식이 서로 꽤 달라. 그래서 배울 게 많은데, 같은 걸 기대하면 서로 지쳐.';
  } else if (보완 === '상대가나를' || 보완 === '내가상대를') {
    결 = '한쪽이 기대는 사이';
    결설명 = '한 사람이 다른 사람을 더 채워주는 구조야. 편안한 만큼 역할이 굳어지기 쉬워서, 고마움을 말로 확인하는 게 중요한 조합이야.';
  } else if (aToB === '편관' || aToB === '정관') {
    결 = '긴장이 있는 사이';
    결설명 = '상대 앞에서 흐트러지고 싶지 않아지는 관계야. 끌리는 힘이 분명한데, 편안함은 따로 만들어야 해.';
  } else if (aToB === '정인' || aToB === '편인') {
    결 = '기대게 되는 사이';
    결설명 = '상대에게 배우거나 기대고 싶어지는 구조야. 마음이 놓이는 만큼, 의존과 존중의 경계를 스스로 챙겨야 해.';
  } else if (aToB === '식신' || aToB === '상관') {
    결 = '말이 트이는 사이';
    결설명 = '상대 앞에서 말이 편하게 나오는 관계야. 표현이 늘어나는 대신, 하고 나서 후회하는 말도 같이 늘 수 있어.';
  } else if (aToB === '정재' || aToB === '편재') {
    결 = '같이 벌이는 사이';
    결설명 = '상대와 함께 뭔가를 만들고 싶어지는 구조야. 현실적인 일이 잘 굴러가는 대신, 감정을 다루는 시간은 따로 챙겨야 해.';
  } else if (sameElem) {
    결 = '비슷한 사이';
    결설명 = '중심 기운이 같은 계열이라 이해가 빨라. 다만 부족한 부분도 겹쳐서, 둘 다 안 보는 지점이 생겨.';
  } else {
    결 = '천천히 알아가는 사이';
    결설명 = '한눈에 확 끌리는 구조는 아니야. 대신 급하게 가까워지지 않는 만큼 오래 볼수록 편해지는 편이야.';
  }

  return {
    aStem, bStem, aBranch, bBranch, aYear, bYear,
    aToB, bToA, stemHap, stemChung, sameStem, sameElem,
    branchRel, sameBranch, yearRel,
    aTti: TTI[aYear], bTti: TTI[bYear],
    aNeed, bNeed, bHasForA, aHasForB, 보완,
    merged, mergedZero, myZeroFilled,
    aGyeok, bGyeok, aGroup, bGroup,
    aStrong: a.yong.label, bStrong: b.yong.label,
    결, 결설명
  };
}

// ===== 궁합 규칙 =====
const MATCH_RULES = [

// ---------- 첫인상과 끌림 ----------
{ id:'끌림-천간합', slot:'끌림', weight:96,
  when:m => m.stemHap,
  text:m => `두 사람의 중심 기운이 서로 묶이는 사이야. 명리에서 이걸 합이라고 보는데, 첫인상에서 이유 없이 편하거나 자꾸 눈이 가는 쪽이야.` },
{ id:'끌림-십신', slot:'끌림', weight:92,
  when:m => !!m.aToB,
  text:m => {
    const T = {
      비견:'상대가 나와 비슷한 위치로 느껴져. 친구처럼 나란히 서는 관계가 자연스러워.',
      겁재:'상대에게서 나와 닮은 면을 봐. 편한데 동시에 은근히 비교하게 되는 쪽이야.',
      식신:'상대와 있으면 말이 편하게 나와. 내가 표현을 더 하게 되는 관계야.',
      상관:'상대 앞에서 평소보다 솔직해져. 하고 싶은 말을 참지 않게 되는 쪽이야.',
      편재:'상대가 재밌고 새롭게 느껴져. 뭔가 같이 벌이고 싶어지는 관계야.',
      정재:'상대가 안정적으로 느껴져. 현실적인 계획을 같이 세우기 좋은 쪽이야.',
      편관:'상대가 신경 쓰이고 긴장되게 해. 끌리는데 편하지만은 않은 관계야.',
      정관:'상대 앞에서 흐트러지고 싶지 않아져. 예의를 갖추게 되는 쪽이야.',
      편인:'상대가 궁금하고 알아가고 싶어져. 속을 다 모르겠는데 그게 매력인 관계야.',
      정인:'상대에게 기대고 싶어져. 마음이 놓이고 보호받는 느낌이 드는 쪽이야.'
    };
    return T[m.aToB] || '';
  } },
{ id:'끌림-상대입장', slot:'끌림', weight:84,
  when:m => !!m.bToA && m.bToA !== m.aToB,
  text:m => {
    const T = {
      비견:'친구 같은 사람', 겁재:'편하면서도 신경 쓰이는 사람', 식신:'말이 잘 통하는 사람',
      상관:'솔직해지게 만드는 사람', 편재:'재밌고 새로운 사람', 정재:'안정적인 사람',
      편관:'긴장되게 하는 사람', 정관:'예의를 갖추게 되는 사람', 편인:'알아가고 싶은 사람',
      정인:'기대고 싶은 사람'
    };
    return T[m.bToA] ? `반대로 상대에게 너는 ${T[m.bToA]}으로 느껴져. 서로 보는 각도가 달라서, 같은 순간을 다르게 기억할 수 있어.` : '';
  } },
{ id:'끌림-띠', slot:'끌림', weight:60,
  when:m => !!m.yearRel,
  text:m => m.yearRel === '충'
    ? `띠로는 ${m.aTti}띠와 ${m.bTti}띠, 서로 맞은편에 있는 조합이야. 흔히 안 맞는다고들 하는데 그만큼 서로에게 없는 걸 갖고 있다는 뜻이기도 해.`
    : `띠로는 ${m.aTti}띠와 ${m.bTti}띠, 예로부터 잘 묶인다고 보는 조합이야.` },

// ---------- 같이 있을 때 ----------
{ id:'같이-일지합', slot:'같이있을때', weight:96,
  when:m => 지지합(m.branchRel),
  text:m => `두 사람의 가장 가까운 글자가 서로 묶여 있어. 생활 리듬이나 편안한 거리감이 자연스럽게 맞춰지는 편이라, 같이 지내는 데 드는 힘이 적어.` },
{ id:'같이-일지같음', slot:'같이있을때', weight:90,
  when:m => m.sameBranch,
  text:m => `두 사람이 같은 글자를 가장 가까운 데에 두고 있어. 편한 게 비슷하고 불편한 것도 비슷해서, 설명 없이 통하는 게 많아.` },
{ id:'같이-용신서로', slot:'같이있을때', weight:94,
  when:m => m.보완 === '서로',
  text:m => `내게 필요한 ${m.aNeed} 기운을 상대가 갖고 있고, 상대에게 필요한 ${m.bNeed} 기운은 내가 갖고 있어. 서로 부족한 데를 채우는 구조라, 같이 있을 때 컨디션이 좋아지는 쪽이야.` },
{ id:'같이-용신한쪽', slot:'같이있을때', weight:86,
  when:m => m.보완 === '상대가나를',
  text:m => `내게 필요한 ${m.aNeed} 기운을 상대가 넉넉히 갖고 있어. 같이 있으면 내가 편해지는 쪽인데, 반대로 상대는 그만큼 채워지지 않을 수 있어. 받는 만큼 표현해 주는 게 중요해.` },
{ id:'같이-내가채움', slot:'같이있을때', weight:86,
  when:m => m.보완 === '내가상대를',
  text:m => `상대에게 필요한 ${m.bNeed} 기운을 내가 갖고 있어. 상대가 나와 있을 때 안정감을 느끼는 구조야. 다만 내가 채워지는 쪽은 아니라, 내 회복은 따로 챙겨야 해.` },
{ id:'같이-빈오행채움', slot:'같이있을때', weight:74,
  when:m => m.myZeroFilled.length > 0,
  text:m => `내 사주에 없던 ${m.myZeroFilled.join('·')} 기운을 상대가 갖고 있어. 혼자서는 잘 안 쓰던 방식을 이 사람 옆에서는 자연스럽게 쓰게 될 수 있어.` },
{ id:'같이-오행보완', slot:'같이있을때', weight:66,
  when:m => m.mergedZero.length < ['목','화','토','금','수'].filter(e => (m.merged[e]||0) === 0).length + 1
            && m.myZeroFilled.length === 0 && m.보완 === '약함',
  text:m => `서로의 기운이 크게 겹치지도, 크게 채워주지도 않는 편이야. 그래서 상대에게 기대기보다 각자 편한 방식을 인정하는 관계가 잘 굴러가.` },
{ id:'같이-강약보완', slot:'같이있을때', weight:64,
  when:m => (m.aStrong === '신강' && m.bStrong === '신약') || (m.aStrong === '신약' && m.bStrong === '신강'),
  text:m => `한쪽은 자기 힘으로 밀고 가고 다른 쪽은 환경을 빌려 쓰는 편이야. 역할이 자연스럽게 나뉘어서, 서로의 방식을 인정하면 손발이 잘 맞아.` },
{ id:'같이-기본', slot:'같이있을때', weight:38, fallback:true,
  when:m => true,
  text:m => `두 사람 사이에 특별히 묶이거나 부딪히는 자리가 뚜렷하지 않아. 타고난 궁합보다 서로 맞춰가며 만드는 부분이 큰 관계라고 보면 돼.` },
{ id:'같이-격국같음', slot:'같이있을때', weight:70,
  when:m => m.aGroup === m.bGroup,
  text:m => `두 사람의 사주 유형이 같은 계열이야. 중요하게 여기는 게 비슷해서 대화가 빠른데, 약점도 겹쳐서 둘 다 안 보는 지점이 생겨.` },

// ---------- 부딪히는 지점 ----------
{ id:'갈등-일지충', slot:'부딪힘', weight:96,
  when:m => m.branchRel === '충',
  text:m => `가장 가장 가까운 글자끼리 정면으로 만나는 구조야. 생활 방식이나 편한 거리감이 서로 달라서, 사소한 데서 반복해서 부딪히기 쉬워. 대신 서로를 흔들어 깨우는 면도 있어서 지루해지지는 않아.` },
{ id:'갈등-천간충', slot:'부딪힘', weight:88,
  when:m => m.stemChung,
  text:m => `중심 기운끼리 서로 밀어내는 관계야. 같은 상황을 봐도 결론이 다르게 나기 쉬워. 누가 맞는지 겨루기 시작하면 오래 가는 조합이 아니야.` },
{ id:'갈등-편관', slot:'부딪힘', weight:82,
  when:m => m.aToB === '편관' || m.bToA === '편관',
  text:m => `한쪽이 다른 쪽을 긴장하게 만드는 구조가 있어. 끌리는 힘이 세지만, 그 긴장이 오래 쌓이면 피로가 돼. 편안한 시간을 일부러 만들어야 하는 관계야.` },
{ id:'갈등-겁재', slot:'부딪힘', weight:78,
  when:m => m.aToB === '겁재' || m.bToA === '겁재',
  text:m => `서로 닮아서 편한데, 그만큼 비교도 쉽게 하게 돼. 돈이나 몫이 걸린 일은 시작 전에 나눠 정해두는 게 관계를 지켜줘.` },
{ id:'갈등-보완약함', slot:'부딪힘', weight:74,
  when:m => m.보완 === '약함',
  text:m => `서로에게 필요한 기운을 상대가 넉넉히 갖고 있지는 않아. 둘 다 지쳐 있을 때 서로를 회복시켜 주기 어려운 구조라, 각자의 회복 방법을 따로 갖고 있는 게 좋아.` },
{ id:'갈등-둘다신강', slot:'부딪힘', weight:72,
  when:m => m.aStrong === '신강' && m.bStrong === '신강',
  text:m => `두 사람 다 자기 힘이 강한 편이야. 각자 알아서 잘하는 만큼, 방향이 갈릴 때 양보가 잘 안 나와. 결정 방식을 미리 정해두면 훨씬 수월해져.` },
{ id:'갈등-둘다신약', slot:'부딪힘', weight:72,
  when:m => m.aStrong === '신약' && m.bStrong === '신약',
  text:m => `두 사람 다 환경과 사람을 빌려 쓰는 편이야. 서로 기대다 보면 둘 다 지칠 수 있으니, 힘들 때 밖에서 도움을 구하는 걸 미안해하지 않는 게 좋아.` },
{ id:'갈등-십신', slot:'부딪힘', weight:70,
  when:m => !!m.aToB,
  text:m => {
    const T = {
      비견:'서로 자기 방식이 분명해서, 같은 일을 두고 방법이 갈릴 때 조율이 오래 걸려.',
      겁재:'가까운 만큼 서운함도 빨리 생겨. 속으로 재고 있으면 상대는 눈치채지 못해.',
      식신:'편하게 말하다 보니 상대가 흘려듣는다고 느낄 때가 있어. 중요한 얘기는 따로 시간을 잡는 게 좋아.',
      상관:'솔직한 게 장점인데, 상대가 준비 안 됐을 때 나온 말은 상처가 돼. 순서를 한 박자만 늦춰봐.',
      편재:'재밌게 시작한 일이 흐지부지되기 쉬워. 둘 다 마무리 담당이 아니라면 역할을 정해둬야 해.',
      정재:'현실적인 이야기가 많다 보면 감정을 다루는 시간이 줄어. 계획 말고 마음을 묻는 대화가 필요해.',
      편관:'상대에게 잘 보이려는 긴장이 쌓여. 편한 모습을 보여주는 게 이 관계에서는 용기야.',
      정관:'예의를 지키느라 불편한 말을 미루게 돼. 참은 게 쌓이면 한 번에 터져.',
      편인:'서로를 다 알기 전에 짐작으로 채우기 쉬워. 확인하지 않은 추측이 오해를 만들어.',
      정인:'기대는 마음이 커지면 상대가 부담을 느껴. 받는 쪽과 주는 쪽이 고정되지 않게 신경 써야 해.'
    };
    return T[m.aToB] || '';
  } },
{ id:'갈등-기본', slot:'부딪힘', weight:40, fallback:true,
  when:m => true,
  text:m => `크게 부딪히는 자리가 뚜렷하지는 않아. 그래서 문제가 생겨도 늦게 알아차리기 쉬운 조합이야. 별일 없을 때 서로 어떤지 물어보는 습관이 이 관계에는 특히 도움이 돼.` },
{ id:'갈등-빈오행겹침', slot:'부딪힘', weight:68,
  when:m => m.mergedZero.length > 0,
  text:m => `둘을 합쳐도 ${m.mergedZero.join('·')} 기운이 비어 있어. 두 사람 다 자연스럽게 안 하는 방식이라, 그 부분은 서로 기대하지 말고 규칙이나 도구로 메우는 게 나아.` },

// ---------- 오래 가려면 ----------
{ id:'오래-일지충', slot:'오래가려면', weight:94,
  when:m => m.branchRel === '충',
  text:m => `부딪힐 때 "누가 맞나"로 가지 말고 "그래서 뭘 바꿀까"로 옮기는 게 이 조합의 핵심이야. 결론을 그 자리에서 내지 않는 규칙 하나면 많이 달라져.` },
{ id:'오래-닮음', slot:'오래가려면', weight:88,
  when:m => m.sameStem || m.aGroup === m.bGroup,
  text:m => `말이 잘 통하는 만큼 둘 다 놓치는 지점이 생겨. 서로 잘 모르는 영역은 바깥의 조언을 들어보는 게 이 조합에는 특히 도움이 돼.` },
{ id:'오래-보완', slot:'오래가려면', weight:86,
  when:m => m.보완 === '상대가나를' || m.보완 === '내가상대를',
  text:m => `한쪽이 더 채워주는 구조라, 고마움이 당연함으로 바뀌는 순간이 고비야. 받은 걸 말로 확인해 주는 게 이 관계에서는 형식이 아니라 실질이야.` },
{ id:'오래-편관', slot:'오래가려면', weight:80,
  when:m => m.aToB === '편관' || m.bToA === '편관',
  text:m => `긴장이 관계의 연료인 조합이라, 아무 일 없는 평온한 시간을 일부러 만들어 두는 게 오래 가는 비결이야.` },
{ id:'오래-십신', slot:'오래가려면', weight:84,
  when:m => !!m.aToB,
  text:m => {
    const T = {
      비견:'서로 알아서 잘하는 만큼, 같이 정할 일은 미리 방식을 합의해 두는 게 좋아.',
      겁재:'돈·시간·공을 나누는 기준을 먼저 정해두면 이 조합은 훨씬 오래 가.',
      식신:'편한 사이일수록 중요한 얘기는 흘려보내기 쉬워. 따로 시간을 잡는 습관이 필요해.',
      상관:'솔직함이 무기인 조합이라, 말하는 순서와 타이밍만 신경 쓰면 돼.',
      편재:'같이 벌인 일이 흐지부지되지 않게, 끝을 확인할 사람을 정해두면 좋아.',
      정재:'계획 얘기가 많아지는 만큼, 계획 없는 시간을 일부러 만들어야 해.',
      편관:'긴장이 연료인 관계라 평온한 시간이 오히려 귀해. 아무 일 없는 날을 지켜줘.',
      정관:'예의를 지키느라 미룬 말이 쌓이기 쉬워. 작게 자주 말하는 쪽이 안전해.',
      편인:'추측으로 채우지 말고 확인하는 습관이 이 조합에는 특히 중요해.',
      정인:'받는 쪽과 주는 쪽이 고정되지 않게, 역할을 가끔 바꿔보는 게 좋아.'
    };
    return T[m.aToB] || '';
  } },
{ id:'오래-빈오행', slot:'오래가려면', weight:70,
  when:m => m.mergedZero.length > 0,
  text:m => `둘 다 ${m.mergedZero.join('·')} 쪽은 자연스럽게 안 하는 편이야. 서로에게 기대하지 말고 규칙이나 도구로 메우기로 정해두면 다툴 일이 줄어.` },
{ id:'오래-띠충', slot:'오래가려면', weight:62,
  when:m => m.yearRel === '충',
  text:m => `자란 환경이나 기본 전제가 서로 다를 수 있어. "왜 저러지"가 나올 때 배경을 한 번 물어보는 게 이 조합에는 특히 잘 들어.` },
{ id:'오래-기본', slot:'오래가려면', weight:50, fallback:true,
  when:m => true,
  text:m => `궁합은 맞고 안 맞고가 정해져 있다기보다, 어떤 지점에서 서로 애써야 하는지를 알려주는 쪽에 가까워. 위에 나온 부딪히는 지점만 알고 있어도 대부분은 넘어가.` }

];

function buildMatchSlot(slot, m, limit) {
  const hits = [], backup = [];
  for (let i = 0; i < MATCH_RULES.length; i++) {
    const r = MATCH_RULES[i];
    if (r.slot !== slot) continue;
    let ok = false;
    try { ok = r.when(m); } catch (e) { ok = false; }
    if (!ok) continue;
    let t;
    try { t = typeof r.text === 'function' ? r.text(m) : r.text; } catch (e) { continue; }
    if (!t) continue;
    (r.fallback ? backup : hits).push({ w: r.weight, t: t });
  }
  // "특별한 게 없다"는 기본 문장이 구체적인 문장과 같이 나오면 서로 모순된다.
  // 다른 규칙이 하나도 안 맞았을 때만 쓴다.
  const use = hits.length ? hits : backup;
  use.sort((a, b) => b.w - a.w);
  return use.slice(0, limit || 3).map(h => h.t);
}
