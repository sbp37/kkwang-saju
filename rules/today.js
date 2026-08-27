/* 오늘운세 규칙
   오늘 일진이 원국을 어떻게 건드리는지 판단하고 문장을 고른다. 화면 그리기는 index.html에 있다. */
// ===== 오늘운세 =====
// 오늘 일진이 내 사주를 어떻게 건드리는지 본다.
// 천간 십신 하나로만 보던 기존 "오늘의 한마디"보다 훨씬 구체적으로 나온다.
function buildToday(){
  const r=S.saju, dm=r.dayMaster;
  const codes=r.codes||{};
  const todayH=codes.today||'';
  const monthH=codes.thisMonth||'';
  if(!todayH) return null;
  const [ts,tb]=KSaju.toKo([todayH[0],todayH[1]]);
  const stemGod=KSaju.tenGod(dm.stem,ts);
  const hid=KSaju.HIDDEN[tb];
  const branchGod=hid?KSaju.tenGod(dm.stem,hid[hid.length-1][0]):'';

  // 오늘 지지가 원국 어느 자리를 건드리나
  const 이름=['연','월','일','시'];
  const 건드림=[];
  r.pillars.forEach((p,i)=>{
    if(p.missing) return;
    const rel=KSaju.branchRelation(tb,p.branch);
    if(rel) 건드림.push({자리:이름[i],관계:rel,글자:p.branch});
  });

  // 오늘 기운이 내 용신인지
  const todayElem=KSaju.STEM_EL[ts];
  const branchElem=KSaju.BRANCH_EL[tb];
  const 용신날=(todayElem===S.yong.elem||branchElem===S.yong.elem);

  // 공망일인지
  const 공망일=(r.voidBranches||[]).indexOf(tb)!==-1;

  // 이번 달 흐름
  let 이번달=null;
  if(monthH && r.wolun && r.wolun.length){
    const mb=KSaju.toKo([monthH[0],monthH[1]])[1];
    이번달=r.wolun.filter(x=>x.branch===mb)[0]||null;
    // ssaju의 monthName은 "신월(7월)"처럼 절기월 번호가 붙어 실제 달과 어긋나 보인다
    if(이번달) 이번달=Object.assign({},이번달,{name:String(이번달.name||'').replace(/\(.*\)/,'')});
  }

  return {
    간지:ts+tb, 간지H:todayH, 천간:ts, 지지:tb,
    stemGod, branchGod, 건드림, 용신날, 공망일, 이번달,
    날짜:new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'})
  };
}

const TODAY_GOD_TOPIC={
  비견:['내 페이스를 지키는 날','남 속도에 휘둘리지 말고 내 순서대로 가면 돼.'],
  겁재:['사람이 붙는 날','같이 하자는 얘기가 들어오기 쉬워. 몫은 그 자리에서 정해둬.'],
  식신:['꾸준히 만드는 날','벌여둔 것 중 하나를 끝까지 밀어보기 좋아.'],
  상관:['말이 잘 나오는 날','하고 싶던 말을 꺼내기 좋은 날인데, 세기 조절만 신경 써.'],
  편재:['기회가 보이는 날','새로운 게 눈에 들어와. 다만 오늘 바로 지르지는 말자.'],
  정재:['정리하기 좋은 날','돈·일정처럼 숫자로 된 걸 손보면 잘 풀려.'],
  편관:['책임이 몰리는 날','일이 몰려도 하나씩 처리하면 돼. 무리한 약속만 피해.'],
  정관:['약속과 책임의 날','문서·연락·공식적인 일이 앞에 나와. 확인 한 번 더가 이득이야.'],
  편인:['혼자 파고드는 날','새로 궁금해지는 게 생겨. 몰입하기 좋은 날이야.'],
  정인:['배우고 쉬는 날','무리해서 밀어붙이기보다 채우는 쪽이 남는 게 많아.']
};

const TODAY_RULES=[
{ id:'오늘-주제', slot:'오늘주제', weight:98,
  when:t=>!!TODAY_GOD_TOPIC[t.stemGod],
  text:t=>`오늘은 ${TODAY_GOD_TOPIC[t.stemGod][0]}이야. ${TODAY_GOD_TOPIC[t.stemGod][1]}` },
{ id:'오늘-속주제', slot:'오늘주제', weight:88,
  when:t=>!!TODAY_GOD_TOPIC[t.branchGod]&&t.branchGod!==t.stemGod,
  text:t=>`속으로는 ${TODAY_GOD_TOPIC[t.branchGod][0].replace(' 날','')} 기운이 같이 움직여서, 겉으로 하는 일과 마음이 가는 곳이 다를 수 있어.` },
{ id:'오늘-용신', slot:'오늘잘통함', weight:96,
  when:t=>t.용신날,
  text:t=>`오늘 기운이 네게 필요한 ${S.yong.elem} 쪽이야. 평소보다 컨디션이 잘 붙는 날이라, 미뤄둔 일 하나 꺼내기 좋아.` },
{ id:'오늘-합', slot:'오늘잘통함', weight:90,
  when:t=>t.건드림.some(x=>x.관계==='육합'||x.관계==='삼합'||x.관계==='방합'),
  text:t=>{const g=t.건드림.filter(x=>x.관계!=='충').map(x=>x.자리);
    const 말={연:'집안이나 오래된 인연',월:'일과 사회 쪽',일:'가까운 사람',시:'앞으로의 계획'};
    return `오늘 기운이 ${g.map(x=>말[x]).join(', ')}과 잘 맞물려. 그쪽으로 연락하거나 손대면 수월하게 풀려.`;} },
{ id:'오늘-무난', slot:'오늘잘통함', weight:40, fallback:true,
  when:t=>true,
  text:t=>`특별히 크게 밀어주는 기운은 없는 날이야. 그래서 오히려 평소 하던 걸 그대로 하기 좋아.` },
{ id:'오늘-충', slot:'오늘조심', weight:96,
  when:t=>t.건드림.some(x=>x.관계==='충'),
  text:t=>{const g=t.건드림.filter(x=>x.관계==='충').map(x=>x.자리);
    const 말={연:'오래된 관계나 집안일',월:'일과 사회 쪽',일:'가까운 사람과의 일상',시:'세워둔 계획'};
    return `오늘 기운이 ${말[g[0]]}을 정면으로 건드려. 예정이 틀어지거나 말이 부딪히기 쉬우니, 큰 결정은 하루 미루는 게 나아.`;} },
{ id:'오늘-공망', slot:'오늘조심', weight:88,
  when:t=>t.공망일,
  text:t=>`오늘은 네 사주 기준으로 비어 있는 자리에 해당해. 애써도 손에 안 잡히는 느낌이 들 수 있는데, 결과를 재촉하지 않으면 그만이야.` },
{ id:'오늘-편관', slot:'오늘조심', weight:76,
  when:t=>t.stemGod==='편관'||t.branchGod==='편관',
  text:t=>`부담스러운 연락이나 갑작스러운 요청이 올 수 있어. 바로 답하지 말고 한 박자 두는 게 좋아.` },
{ id:'오늘-겁재', slot:'오늘조심', weight:74,
  when:t=>t.stemGod==='겁재'||t.branchGod==='겁재',
  text:t=>`돈 얘기가 오가기 쉬운 날이야. 빌려주거나 함께 쓰는 결정은 오늘 하지 않는 게 안전해.` },
{ id:'오늘-무난조심', slot:'오늘조심', weight:40, fallback:true,
  when:t=>true,
  text:t=>`딱히 조심할 자리는 없는 날이야. 무리하지만 않으면 평범하게 지나가.` },
{ id:'이번달', slot:'이번달', weight:90,
  when:t=>!!t.이번달&&!!TODAY_GOD_TOPIC[t.이번달.stemGod],
  text:t=>`이번 달(${t.이번달.name})은 ${TODAY_GOD_TOPIC[t.이번달.stemGod][0].replace(' 날','')} 흐름이야. ${TODAY_GOD_TOPIC[t.이번달.stemGod][1]}` },
{ id:'이번달-운성', slot:'이번달', weight:80,
  when:t=>!!t.이번달&&!!t.이번달.stage12,
  text:t=>{const up=['장생','관대','건록','제왕','태','양'];
    return up.indexOf(t.이번달.stage12)!==-1
      ?`이번 달은 기운이 올라오는 구간이라, 시작하거나 벌여도 감당이 되는 편이야.`
      :`이번 달은 기운을 모으는 구간이라, 새로 벌이기보다 정리하고 마무리하는 쪽이 결과가 좋아.`;} }
];

function buildTodaySlot(slot,t,limit){
  const hits=[], backup=[];
  TODAY_RULES.forEach(r=>{
    if(r.slot!==slot) return;
    let ok=false; try{ok=r.when(t)}catch(e){ok=false}
    if(!ok) return;
    let x; try{x=typeof r.text==='function'?r.text(t):r.text}catch(e){return}
    if(!x) return;
    (r.fallback?backup:hits).push({w:r.weight,t:x});
  });
  const use=hits.length?hits:backup;
  use.sort((a,b)=>b.w-a.w);
  return use.slice(0,limit||2).map(h=>h.t);
}

const TODAY_SECTIONS=[
  ['오늘주제','☀','오늘 앞에 나오는 기운','assets/sun.webp'],
  ['오늘잘통함','◈','오늘 잘 통하는 것','assets/metal.webp'],
  ['오늘조심','☁','오늘 조심할 것','assets/cloud.webp'],
  ['이번달','☾','이번 달 흐름','assets/moon.webp']
];
