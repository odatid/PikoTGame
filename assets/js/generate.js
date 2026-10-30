/* =========================================================
   PK//PROTO — 生成ロジック（AIなし・決定的）
   ========================================================= */
window.PK = window.PK || {};
(function(){
'use strict';

const MECH = {'◎':1.0,'○':0.6,'△':0.22};
const EXP_CAP = {beginner:1, some:2, experienced:3};

function verbList(s){
  if(Array.isArray(s.verbs)) return s.verbs.map(verbById).filter(Boolean);
  if(s.verb) return [verbById((s.verbs&&s.verbs[0])||s.verb)].filter(Boolean);
  return [];
}
function ipById(id){ return PK.IP_VALUES.find(x=>x.id===id); }
function patById(id){ return PK.PATTERNS.find(x=>x.id===id); }
function verbById(id){
  for(const g of PK.VERB_GROUPS){ const v=g.verbs.find(x=>x.id===id); if(v) return Object.assign({group:g.g},v); }
  return null;
}

/* ---------- スコア ---------- */
function scorePattern(p, s){
  const W = PK.WEIGHTS;
  // IP一致：選択数は無制限。上位3つの平均と全体平均を混ぜる（多く選んでも薄まらない）
  const ipVals = s.ips.map(id=>{
    const v = ipById(id); if(!v) return 0;
    return (p.ip[id] || 0) * MECH[v.mech];
  }).sort((a,b)=>b-a);
  let ipScore = 0;
  if(ipVals.length){
    const all = ipVals.reduce((a,b)=>a+b,0) / ipVals.length;
    const top = ipVals.slice(0,3).reduce((a,b)=>a+b,0) / Math.min(3, ipVals.length);
    ipScore = ipVals.length <= 3 ? all : (0.7*top + 0.3*all);
  }

  // 動詞一致：主動詞を主、副動詞（最大2）を加点
  const vs = verbList(s);
  let vScore = 0.25;
  if(vs.length){
    const one = (vb)=>{
      if(p.verbs.includes(vb.label)) return 1.0;
      if(p.verbGroup === vb.group) return 0.62;
      const g = PK.VERB_GROUPS.find(x=>x.g===vb.group);
      if(g && g.verbs.some(x=>x.pat===p.id)) return 0.5;
      return 0.28;
    };
    const primary = one(vs[0]);
    const sec = vs.slice(1).map(one);
    const secAvg = sec.length ? sec.reduce((a,b)=>a+b,0)/sec.length : primary;
    vScore = 0.76*primary + 0.24*secAvg;
  }

  // 感情一致：当たった数（深さ）と、選んだ中の割合（広さ）を混ぜる
  let eScore = 0.35;
  if(s.emos.length){
    const hit = s.emos.filter(e=>p.emo.includes(e)).length;
    const depth = Math.min(1, hit / 2);
    const cover = hit / s.emos.length;
    eScore = 0.62*depth + 0.38*cover + 0.08;
    eScore = Math.min(1, eScore);
  }

  // 対象一致
  const aScore = s.audience ? (p.aud.includes(s.audience) ? 1 : 0.45) : 0.6;

  // 技術適合
  const cap = EXP_CAP[s.exp] || 2;
  let tScore = 1.0;
  if(p.level > cap) tScore = 0.42;
  if(s.types && s.types.length){
    const ok = s.types.some(t=>{
      const T = PK.TYPES.find(x=>x.id===t);
      return T && T.engines.includes(p.engine);
    });
    if(!ok) tScore *= (s.types.length >= PK.TYPES.length - 2 ? 0.92 : 0.78);
  }

  // やれること：該当Prefabが「できる」に入っていれば、その分だけ背伸びを許す
  const skills = s.skills || [];
  const eng = PK.ENGINES[p.engine] || {};
  const engPrefabs = (eng.comps||[]).map(c=>c[1]);
  const canCount = PK.SKILLS.filter(k=>skills.includes(k.id) && k.prefab && engPrefabs.includes(k.prefab)).length;
  const lift = Math.min(0.06, canCount*0.02);   // できることが多いほど、少し難しい案も許容

  // 3Dに挑戦したい申告は、3D案を後押しする
  let dimBonus = 0;
  if((s.challenges||[]).includes('ch_3d') && p.dim==='3D') dimBonus = 0.05;

  let sc = W.ip*ipScore + W.verb*vScore + W.emo*eScore + W.aud*aScore + W.tech*tScore + lift + dimBonus;
  if(p.level > cap && !(p.level===cap+1 && canCount>=3)) sc -= 0.08;
  return {score:sc, ipScore, vScore, eScore, aScore, tScore};
}

function recommend(s){
  const all = PK.PATTERNS.map(p=>{
    const r = scorePattern(p,s);
    return Object.assign({p}, r);
  });
  const cap = EXP_CAP[s.exp] || 2;

  // 次元：申告があれば、その次元のパターンだけにする（空なら戻す）
  const dim = s.dim;
  const byDim = (dim && dim !== 'both') ? all.filter(x=>x.p.dim===dim) : all;
  const dimPool = byDim.length ? byDim : all;

  // 型：申告した型のエンジンに一致するものだけにする（空なら戻す）
  const engSet = new Set();
  (s.types||[]).forEach(t=>{
    const T = PK.TYPES.find(x=>x.id===t);
    if(T) T.engines.forEach(e=>engSet.add(e));
  });
  let pool = engSet.size ? dimPool.filter(x=>engSet.has(x.p.engine)) : dimPool;
  if(!pool.length) pool = dimPool;

  // 経験の上限を超えるものは、他に候補があるときだけ外す
  const within = pool.filter(x=>x.p.level <= cap);
  if(within.length) pool = within;

  // 同点は「まだ出していない family」を優先して、ジャンルの偏りを崩す
  const seenFamily = new Set(s._seenFamilies||[]);
  return pool.sort((a,b)=>{
    if(Math.abs(b.score-a.score) > 0.04) return b.score-a.score;
    const af = seenFamily.has(a.p.family)?1:0, bf = seenFamily.has(b.p.family)?1:0;
    if(af !== bf) return af - bf;
    if(a.p.level !== b.p.level) return a.p.level - b.p.level;
    return a.p.id.localeCompare(b.p.id);
  });
}

/* ---------- IP強度 ---------- */
function ipStrength(p, s){
  let best = 0, bestIp = null;
  s.ips.forEach(id=>{
    const v = ipById(id); if(!v) return;
    const w = p.ip[id] || 0;
    const val = w * MECH[v.mech];
    if(val > best){ best = val; bestIp = v; }
  });
  const hook = p.ipHook && p.ipHook.trim().length > 0;
  let level = 'weak';
  if(best >= 0.5 && hook) level = 'strong';
  else if(best >= 0.22) level = 'mid';
  return {level, best, ip:bestIp, hook};
}

/* ---------- 数值つき仕様 ---------- */
function fill(tpl, p, extra){
  const n = p.nums;
  const map = Object.assign({
    duration: p.duration, target: n.target, life: n.life
  }, extra||{});
  return String(tpl).replace(/\{\{(\w+)\}\}/g, (m,k)=> (map[k]!==undefined ? map[k] : m));
}

/* ---------- IP研究ノート（なぜピコ太郎なのか） ---------- */
function ipNote(state, p){
  const ips = state.ips.map(ipById).filter(Boolean);
  const byCat = {};
  ips.forEach(v=>{ (byCat[v.g] = byCat[v.g]||[]).push(v); });
  const mech = ips.filter(v=>v.mech==='◎');
  const vis  = ips.filter(v=>v.mech!=='◎');
  const vs = verbList(state);
  const aud = PK.AUDIENCES.find(a=>a.id===state.audience);
  const emo = state.emos.map(id=>PK.EMOTIONS.find(e=>e.id===id)).filter(Boolean);

  const catLines = Object.keys(byCat).map(g=>{
    const list = byCat[g].map(v=>`${v.label}（${v.mech}）`).join('・');
    return `・${g}：${list}`;
  }).join('\n');

  const focus = mech.length
    ? `この企画が一番強く使っているのは「${mech.map(v=>v.label).join('」「')}」。これはピコ太郎というIPの<b>仕組み</b>の部分で、見た目を真似するのではなく、<b>遊びの構造として借りている</b>。`
    : `この企画は「${ips.map(v=>v.label).join('」「')}」を主に使っている。どれも<b>見た目・雰囲気</b>の側面が強いので、ゲームの仕組みとしては汎用になりやすい。下の「料理の仕方」で、IPを1か所だけ機構に変えている。`;

  const trans = vs.length
    ? `核になる動詞は「${vs[0].label}」${vs.length>1?`（＋${vs.slice(1).map(v=>v.label).join('・')}）`:''}。ピコ太郎の「${mech.length?mech[0].label:ips[0]?ips[0].label:'短さ'}」を、この動詞に接続した。プレイヤーは<b>${vs[0].label}という行為を通して</b>ピコ太郎の構造に触れる。`
    : `核になる動詞が未設定のため、ゲームの中心行為から逆算してIPを当てている。`;

  const cook = `ゲームの中では、${p.ipHook.replace(/^「|」$/g,'')}という形で実装する。つまり<b>ピコ太郎の要素が、得点・判定・失敗条件のいずれかに入っている</b>。背景や色だけに留めていない。`;

  const drop = `このゲームからピコ太郎を外して別のキャラクターに置き換えた場合、${p.ipHook ? '得点の入り方と「もう一回」の理由が変わる' : '見た目以外は何も変わらない'}。前者なら、この企画はピコ太郎である理由を持っている。`;

  const audLine = aud ? `想定プレイヤーは<b>${aud.label}</b>。${aud.note}。` : '';
  const emoLine = emo.length ? `与えたい感情は<b>${emo.map(e=>e.label).join('・')}</b>で、成功時は「${emo[0].ok}」、失敗時は「${emo[0].ng}」を狙う。` : '';

  return {catLines, focus, trans, cook, drop, audLine, emoLine, ips, mech, vis};
}

/* ---------- ツイスト（刺激の1手）を1つだけ選ぶ ---------- */
function pickTwist(state, p){
  const vs = verbList(state);
  const subs = vs.slice(1);
  const cand = [];   // {t, score, why}

  PK.TWISTS.forEach(t=>{
    let sc = 0; const why = [];
    // 複合動詞（2つ目以降）が直接対応していれば最優先
    subs.forEach(v=>{
      if(PK.SUBVERB_TWIST[v.label] === t.id){ sc += 2.0; why.push(`副動詞「${v.label}」から`); }
      else if(t.verbs.includes(v.label)){ sc += 1.2; why.push(`副動詞「${v.label}」と相性`); }
    });
    // 主動詞
    if(t.verbs.includes(vs[0] ? vs[0].label : '')){ sc += 0.6; why.push('主動詞と相性'); }
    // エンジン適性
    if(t.fit.includes(p.engine)){ sc += 0.8; }
    // 感情
    if(state.emos.includes('emo_hype') && (t.type==='tease'||t.type==='dual')) sc += 0.2;
    if(state.emos.includes('emo_laugh') && (t.type==='obstacle')) sc += 0.2;
    if(state.emos.includes('emo_unexpected') && t.type==='reverse') sc += 0.3;
    if(state.emos.includes('emo_retry') && t.type==='tease') sc += 0.15;
    // 経験が浅い学生には、実装が軽いものを優先
    if(state.exp==='beginner' && ['tw_decoy','tw_last','tw_bait','tw_inertia'].includes(t.id)) sc += 0.25;
    if(state.exp==='experienced' && ['tw_count','tw_aim','tw_swap','tw_oneway'].includes(t.id)) sc += 0.25;
    cand.push({t, sc, why});
  });

  cand.sort((a,b)=> b.sc - a.sc || a.t.id.localeCompare(b.t.id));
  let best = cand[0];
  if(!best) best = {t:PK.TWISTS[0], sc:0, why:[]};

  // 同じエンジンで既に別の刺激が入っている場合は、系統を1つだけにする
  return {
    id: best.t.id, type: best.t.type, name: best.t.name, one: best.t.one,
    what: best.t.what, how: best.t.how, effect: best.t.effect, tune: best.t.tune,
    why: best.why.join('／') || 'エンジンとの相性',
    fromCompound: best.why.some(w=>w.indexOf('副動詞')===0)
  };
}

/* ---------- DNAと案の整合性 ---------- */
function consistency(state, p){
  // prop（提案オブジェクト）でも pattern でも受けられるようにする
  if(p && p.patternId) p = PK.PATTERNS.find(x=>x.id===p.patternId) || p;
  const rows = [];
  const vs = verbList(state);
  const vb = vs[0];

  // 動詞
  let vOk='×', vNote='案の中心行動になっていない';
  if(vb){
    if(p.verbs.includes(vb.label)){ vOk='○'; vNote=`案の中心が「${vb.label}」`; }
    else if(p.verbGroup===vb.group){ vOk='△'; vNote=`同じ系統（${vb.group}）だが、言葉は違う`; }
  }
  rows.push({k:'核となる動詞', dna:vb?vs.map(v=>v.label).join('・'):'未設定', game:vNote, ok:vOk});

  // IP価値
  const ipScores = state.ips.map(id=>{
    const v = ipById(id); if(!v) return null;
    return {v, w:(p.ip[id]||0)*MECH[v.mech]};
  }).filter(Boolean).sort((a,b)=>b.w-a.w);
  const best = ipScores[0];
  let iOk='×', iNote='IPの要素が仕組みに入っていない';
  if(best){
    if(best.w>=0.5){ iOk='○'; iNote=`「${best.v.label}」が仕組みに入っている`; }
    else if(best.w>=0.25){ iOk='△'; iNote=`「${best.v.label}」が演出・素材レベル`; }
    else { iNote=`「${best.v.label}」が案に効いていない`; }
  }
  rows.push({k:'IPの価値', dna:state.ips.map(id=>(ipById(id)||{}).label).filter(Boolean).join('・')||'未設定', game:iNote, ok:iOk});

  // 感情
  const eHit = state.emos.filter(e=>p.emo.includes(e)).length;
  const eOk = !state.emos.length?'△':(eHit>=Math.min(2,state.emos.length)?'○':(eHit>0?'△':'×'));
  rows.push({k:'与えたい感情', dna:state.emos.map(id=>(PK.EMOTIONS.find(x=>x.id===id)||{}).label).filter(Boolean).join('・')||'未設定',
    game:eHit?`${eHit}つが案の演出に反映`:'案の演出に反映されていない', ok:eOk});

  // ターゲット
  const aOk = !state.audience?'△':(p.aud.includes(state.audience)?'○':'×');
  rows.push({k:'ターゲット', dna:audienceLabel(state), game:aOk==='○'?'この相手向けに調整されている':(aOk==='×'?'別の相手向けの設計':'未設定'), ok:aOk});

  // 認知ゴール
  const per = PK.PERCEPTION.find(x=>x.id===state.perception);
  let pOk='△', pNote='認知ゴールが未設定';
  if(per){
    const hit = per.tags.filter(t=>(p.ip[t]||0)>0.3).length;
    pOk = hit>=1?'○':(state.ips.some(i=>per.tags.includes(i))?'△':'×');
    pNote = hit>=1?`「${per.label.replace('IP','')}」に効く要素が入っている`:`認知ゴールに効く要素が薄い`;
  }
  rows.push({k:'認知ゴール', dna:per?per.label:'未設定', game:pNote, ok:pOk});

  const score = rows.reduce((a,r)=>a+(r.ok==='○'?1:r.ok==='△'?0.5:0),0)/rows.length;
  const bad = rows.filter(r=>r.ok==='×');
  return {rows, score, bad, ok:score>=0.8};
}

function audienceLabel(s){
  const a = PK.AUDIENCES.find(x=>x.id===s.audience);
  return a?a.label:'未設定';
}

/* ---------- 提案の論理チェーン（1文） ---------- */
function dnaSentence(state, prop){
  const want = PK.WANT_TO.find(x=>x.id===state.wantTo);
  const per  = PK.PERCEPTION.find(x=>x.id===state.perception);
  const aud  = audienceLabel(state);
  const vs   = verbList(state);
  const vb   = vs.length?vs.map(v=>v.label).join('・'):'遊ぶ';
  const ips  = state.ips.map(id=>ipById(id)).filter(Boolean);
  const mech = ips.filter(v=>v.mech==='◎');
  const focus = mech.length?mech.map(v=>v.label).join('・'):(ips[0]?ips[0].label:'記号性');
  return {
    want: want?want.label:'（未設定）',
    aud, verb:vb, focus,
    feel: state.emos.map(id=>(PK.EMOTIONS.find(e=>e.id===id)||{}).label).filter(Boolean).join('・')||'（未設定）',
    perception: per?per.label:'（未設定）',
    line: `ターゲットは<b>${want?want.label.replace('たい',''):'（未設定）'}人</b>。`
      + `ピコ太郎の<b>${focus}</b>を、<b>${vb}</b>という遊びを通して感じられるゲームにすることで、`
      + `<b>${aud}</b>に対して「ピコ太郎は<b>${per?per.label:'（未設定）'} </b>」という認知をつくる。`
  };
}

/* ---------- エイベックス／マネジメント向け提案（デザイン思考） ---------- */
function managementProposal(state, prop){
  const ips = state.ips.map(ipById).filter(Boolean);
  const vs = verbList(state);
  const aud = PK.AUDIENCES.find(a=>a.id===state.audience);
  const emos = state.emos.map(id=>PK.EMOTIONS.find(e=>e.id===id)).filter(Boolean);
  const want = PK.WANT_TO.find(x=>x.id===state.wantTo);
  const per  = PK.PERCEPTION.find(x=>x.id===state.perception);
  const chain = dnaSentence(state, prop);
  const cons = consistency(state, prop);

  const tagSet = new Set(ips.map(v=>v.id));
  const scored = PK.DNA_FACTS.map(f=>{
    const hit = f.tags.filter(t=>tagSet.has(t)).length;
    return Object.assign({}, f, {hit});
  }).filter(f=>f.hit>0).sort((a,b)=>b.hit-a.hit);
  const facts = (scored.length?scored:PK.DNA_FACTS.slice(0,3)).slice(0,5);

  const audLabel = aud ? aud.label : '未設定';
  const emoLabel = emos.length ? emos.map(e=>e.label).join('・') : '未設定';
  const verbLabel = vs.length ? vs.map(v=>v.label).join('・') : '未設定';
  const mech = ips.filter(v=>v.mech==='◎');

  const pov = `${chain.aud}のうち、${chain.want}人は、`
    + `${chain.feel.replace(/たい$/,'')}体験を求めている。`
    + `なぜなら${facts[0]?facts[0].insight.replace(/。$/,''):'短くても伝わる体験に価値がある'}からだ。`;

  const ideate = [
    `ピコ太郎の<b>${chain.focus}</b>を、映像として再現するのではなく、プレイヤーが<b>${chain.verb}</b>という行為で触れられる形に置き換えた。これは${facts[0]?facts[0].title:'IPの代表的な活動'}で実際に起きていたことを、ゲームのルールに写したもの。`,
    `IPの要素は、見た目や背景ではなく<b>得点・判定・失敗条件</b>に入れた（${prop.ipHook.replace(/^「|」$/g,'')}）。だから、キャラクターを差し替えると遊びが成立しなくなる。`,
    `結果として、遊んだ人が「${per?per.label:'ピコ太郎らしさ'}」という言葉でこのIPを覚えることを狙っている。${want?want.note+'。':''}`
  ];

  const test = {
    n:40,
    who:'same',
    method:`授業内で1人1台、1プレイ${prop.duration}秒。説明を読まずに始め、3分後にアンケート。`,
    observe:['最初の10秒で操作を理解できたか','失敗したときに笑ったか（観察）','もう一回を選んだか','「ピコ太郎らしい」と答えたか'],
    kpi:['初見理解率 80%以上','もう一回率 60%以上','「ピコ太郎らしい」70%以上']
  };

  const manage = {
    brand:`公式素材・実在の人物の顔・ロゴは使わず、黄色／ヒョウ柄／角刈りパンチ／鼻にちょいがけの黒縁眼鏡という記号で表現する。認知ゴールは「${per?per.label:'—'}」に絞り、二次利用の範囲を説明できる形にした。`,
    risk:`ゲーム内に広告・課金・外部送信は入れない。学習用途に限定し、成果物は授業内で公開する。`,
    extend:`PPAP10周年（2026）の期間に合わせ、教育機関・海外向けに展開できる。手洗いやSDGsの啓発に差し替えるときも同じ仕組みが使える。`,
    asset:`本企画はIPの「${chain.focus}」という構造を借りており、映像・楽曲の派生物ではない。追加の素材制作を伴わずに試作できる。`
  };

  return {
    to:'エイベックス・マネジメント株式会社 / 古坂大魔王 御中',
    from: 'ゲーム制作演習 受講生',
    date: state.date || '',
    title: prop.title,
    chain, cons,
    whyPico: state.whyPico==='why_other'
      ? (state.whyFree||'')
      : ((PK.WHY_PICO.find(w=>w.id===state.whyPico)||{}).text||''),
    whyShort: state.whyPico==='why_other' ? '自分たちの言葉' : ((PK.WHY_PICO.find(w=>w.id===state.whyPico)||{}).short||''),
    summary:[
      `ターゲットは「${chain.want}」人（${chain.aud}）。`,
      `ピコ太郎の「${chain.focus}」を、「${chain.verb}」という遊びで感じられる${prop.duration}秒のゲームにする。`,
      `ねらいは「ピコ太郎は${chain.perception}」という認知をつくること。`
    ],
    empathize:{facts, insights: facts.map(f=>({title:f.title, text:f.insight, src:f.src}))},
    define:{pov, aud:audLabel, emo:emoLabel, verb:verbLabel, want:chain.want, perception:chain.perception},
    ideate,
    test, manage,
    next:`まずは本仕様で試作し、授業内で${test.n}名に試す。DNAとの整合（${Math.round(cons.score*100)}%）を確認し、${cons.bad.length?`「${cons.bad.map(b=>b.k).join('・')}」を直してから`:'そのまま'}量産判断へ進む。`
  };
}

/* ---------- 提案（1案 + 別解候補） ---------- */
function buildProposal(state, ranked, index, patch){
  const r = ranked[index];
  const p = r.p;
  const hook = patch ? patch.hook : p.ipHook;
  const dur = p.duration;

  const screens = ['タイトル', 'インゲーム', 'リザルト'];
  if(p.engine === 'E10' || p.engine === 'E06') screens.splice(1,0,'説明（操作説明）');

  const uiList = p.ui.map(([id,req])=>({
    id, req,
    label: PK.UI_MASTER[id].label,
    pos: PK.UI_MASTER[id].pos,
    why: PK.UI_MASTER[id].why
  }));

  const assets = p.assets.map(id=>PK.ASSET_MASTER[id]).filter(Boolean);
  const ses = p.se.map(id=>Object.assign({id}, PK.SE_MASTER[id])).filter(x=>x.label);
  const eng = PK.ENGINES[p.engine];

  // Prefab 一覧（必須／推奨／任意）
  const must = ['SceneLoader','UIManager','ResultManager','Retry','Timer','ScoreManager'];
  const fromComps = (eng.comps||[]).map(c=>c[1]).filter(x=>PK.PREFABS[x]);
  const set = new Map();
  must.forEach(id=>set.set(id,'必須'));
  fromComps.forEach(id=>{ if(!set.has(id)) set.set(id,'必須'); });
  if(p.engine==='E01'||p.engine==='E03') set.set('LifeManager', set.get('LifeManager')||'必須');
  ['SoundManager','ComboManager','InputManager','DifficultyCurve'].forEach(id=>{
    if(!set.has(id)) set.set(id,'推奨');
  });
  if(p.engine==='E12'||p.engine==='E03') set.set('ObjectPool','任意');
  if(p.nums.speedup > 0) set.set('SpeedUp', set.get('SpeedUp')||'必須');
  if(patch && PK.PREFABS[patch.prefab]) set.set(patch.prefab,'必須');

  // 副動詞（2つ目以降）が足す仕掛け
  const vsAll = verbList(state);
  const subs = vsAll.slice(1).map(v=>{
    const add = PK.SUBVERB[v.label] || {a:'この動詞の要素を1か所だけ足す（該当する入力や判定を1つ追加）', p:'', u:''};
    if(add.p && PK.PREFABS[add.p] && !set.has(add.p)) set.set(add.p,'必須');
    if(add.u && !uiList.some(u=>u.id===add.u)){
      const m2 = PK.UI_MASTER[add.u];
      if(m2) uiList.push({id:add.u, req:'必須', label:m2.label, pos:m2.pos, why:m2.why});
    }
    return {verb:v.label, add:add.a, prefab:add.p};
  });

  const prefabs = [...set.entries()].map(([id,req])=>({id, req, ...PK.PREFABS[id]}))
    .filter(x=>x.name)
    .sort((a,b)=> (a.req==='必須'?0:a.req==='推奨'?1:2) - (b.req==='必須'?0:b.req==='推奨'?1:2) || a.level-b.level);

  const first = PK.FIRST_STEP[p.engine] || {prefab:'PlayerMove', why:''};

  // 手引き
  const guide = [PK.GUIDE_FIRST].concat(eng.mid||[]).concat([PK.GUIDE_LAST]);
  let jids = (eng.juice||['hitstop','particles','flash']).slice();
  if(!jids.some(k=>k==='shake'||k==='dmg'||k==='landSquash')) jids.push('shake');
  if(!jids.some(k=>k==='hitSpark'||k==='particles')) jids.push('hitSpark');
  const juice = jids.map(id=>({id, ...PK.JUICE[id]})).filter(x=>x.name);
  const bgmBase = PK.BGM_MASTER[p.engine] || {bpm:120,key:'C',mood:'軽快',instr:'ドラム＋ベース',loop:45};
  const emoTone = (state.emos[0] && (PK.EMOTIONS.find(e=>e.id===state.emos[0])||{}).tone) || bgmBase.mood;
  const bgmSpec = Object.assign({}, bgmBase, {tone:emoTone});

  return {
    patternId:p.id, title:p.name, oneline:p.oneline,
    family:p.family, engine:p.engine, engineName:eng.name,
    level:p.level, input:p.input, duration:dur,
    action:p.action,
    success: fill(p.successTpl, p),
    fail: fill(p.failTpl, p),
    loop:p.loop, retry:p.retry, ipHook:hook, ipBase:p.ipHook,
    patch: patch || null,
    nums:p.nums, screens, ui:uiList, assets, se:ses, bgm:p.bgm, subs,
    prefabs, first, guide, juice, bgmSpec, subs, ipNote: ipNote(state, p), twist: pickTwist(state, p),
    imageComp:p.imageComp, imageMood:p.imageMood, codeNotes:p.codeNotes,
    strength: ipStrength(p, state),
    state, matched:r
  };
}

/* ---------- プロンプト 3種 ---------- */
function listUI(prop){ return prop.ui.map(u=>`${u.label}（${u.pos}／${u.req}）`).join('、'); }
function listAssets(prop){ return prop.assets.map(a=>`${a.name}（${a.role}）`).join('、'); }

const PICO_ONELINE = '角刈りパンチの頭、鼻にちょいがけした黒縁眼鏡、口髭、黄色×黒のヒョウ柄。サングラスではない。';

const LOCK = `この仕様は学生が自分で決めたものです。ジャンル・操作・勝敗条件・制限時間・画面構成を変更しないでください。
あなたの仕事は、この仕様を読みやすく整え、不足している説明（見た目・UIの配置・演出のタイミング）を補うことだけです。
別のゲームを提案してはいけません。要素を追加する場合も、この仕様の範囲内にとどめてください。`;

function promptPlan(prop){
  const s = prop.state;
  const aud = s.audience ? (PK.AUDIENCES.find(a=>a.id===s.audience)||{}).label : '指定なし';
  const emo = s.emos.map(id=>(PK.EMOTIONS.find(e=>e.id===id)||{}).label).filter(Boolean).join('・') || '指定なし';
  const vb = verbById((s.verbs&&s.verbs[0])||s.verb);
  const capLabel = {beginner:'初めて（簡単な移動・判定のみ）', some:'少し作ったことがある', experienced:'何本か作ったことがある'}[s.exp] || '少し作ったことがある';

  return `あなたはゲーム企画の整理役です。以下の「学生が決めた仕様」を、読みやすい企画書1枚に整えてください。

【最重要の拘束】
${LOCK}

【学生の前提】
・遊ぶ相手：${aud}
・与えたい感情：${emo}
・ゲームの核となる動詞：${verbList(s).length ? verbList(s).map((v,i)=>i===0?v.label:v.label+'（副）').join('・') : '指定なし'}
・Unity経験：${capLabel}
・作りたい型：${(s.types||[]).map(t=>(PK.TYPES.find(x=>x.id===t)||{}).label).filter(Boolean).join('・') || '指定なし'}

【副動詞の仕掛け（必ず入れる）】
${prop.subs.length? prop.subs.map(x=>`・${x.verb}：${x.add}`).join('\n') : '・なし（主動詞だけで成立させる）'}

【ゲーム概要】
・仮タイトル：${prop.title}
・一文説明：${prop.oneline}
・コアループ：${prop.loop}

【ルール（変更禁止）】
・プレイヤーがすること：${prop.action}
・操作方法：${prop.input}（PCはキーボード、スマホはタップ／画面ボタン）
・成功条件：${prop.success}
・失敗条件：${prop.fail}
・1プレイ時間：${prop.duration}秒
・もう一回遊ぶ理由：${prop.retry}

【画面とUI】
・必要画面：${prop.screens.join(' / ')}
・画面に出すUI：${listUI(prop)}

【刺激の1手（必ず1つだけ入れる・変更禁止）】
・${prop.twist.name}：${prop.twist.one}
・何をするか：${prop.twist.what}
・狙い：${prop.twist.effect}
※これを2つ以上に増やさないこと。1つに絞るから、ルールが説明できる。
※この1手が入ることで、${prop.action.replace(/。$/,'')}という単純な往復が、判断を伴う遊びになる。

【ピコ太郎である理由】
${prop.ipHook}

【音の設計（最初から入れる・後付けにしない）】
・BPM ${PK.PICO_SOUND.bpm}／${PK.PICO_SOUND.groove}
・キー ${PK.PICO_SOUND.key}／${PK.PICO_SOUND.loopBars}小節ループ（${PK.PICO_SOUND.length}）
・楽器：${PK.PICO_SOUND.instr}
・音量：${PK.PICO_SOUND.volume}。SEが前に出るミックスにする。
・SEは8種（Pen／Apple／Pineapple／ポン／成功／失敗／コンボ／開始）。「Pen」は高い2音、「Apple」は丸い1音、「Pineapple」は少し濁った音、と<b>3つを耳で区別できるようにする</b>。
・この音が、ピコ太郎らしい「短くて反復する」リズム感をつくる。

【キャラクターの扱い】
・ピコ太郎は画面に出す。動かすだけでなく、<b>しゃべる</b>。
・吹き出しで「Pen」「Apple」「Pineapple」「Oh!」「Yeah!」などの短い言葉を出す。歌詞は使わず、単語と掛け声に留める。
・セリフは4場面だけ：開始時／アイテム登場時／成功時／失敗時。それ以上増やさない。

【見た目の方向】
${prop.imageMood}
（ピコ太郎は記号化して扱う。黄色・黒のヒョウ柄・サングラス・パンチパーマ／角刈りのシルエット。実在の人物の顔や公式ロゴは使わない。）

【出力形式】次の10項目を、この見出しのまま、各2〜4文で書いてください。
1. 仮タイトル
2. 一文コンセプト
3. コアループ（○○する→○○が起きる→もう一度したくなる）
4. 操作
5. 成功条件
6. 失敗条件
7. 画面とUIの配置
8. 必要な素材
9. 30秒の遊びの流れ
10. ピコ太郎である理由（このゲームからピコ太郎を外すと何が変わるか）

前置き・後書き・別案の提案は書かないでください。`;
}

function promptImage(prop, dot){
  const style = dot
    ? `【画風】ドット絵（ピクセルアート）。16×16〜32×32の解像度で描いたような、輪郭が黒1pxのドット表現。アンチエイリアスなし。使用色は黄・黒・白・赤・緑の5色に絞る。`
    : `【画風】フラットな2Dゲーム画面。太い黒線、ベタ塗り、影は1段だけ。安っぽいくらいの勢いがあるイラスト。`;
  const pico = dot
    ? `【ピコ太郎の見た目（この4点は必ず守る）】
① 髪：角刈りパンチ。サイドと後ろは刈り上げ、てっぺんだけ短く縮れて立ち上がる（パンチパーマ）。
② 眼鏡：黒縁の普通の眼鏡（サングラスではない）。レンズは透明か薄い色で、目が見える。
③ 掛け方：鼻の上に「ちょいがけ」。鼻先に引っかかる低い位置で、レンズの上端が目の少し下に来る。
④ 髭：口の上の口髭（細く短い）。顎髭はない。
補足：16×16ドット。黄色と黒のヒョウ柄。シルエットだけで判別できること。`
    : `【ピコ太郎の見た目（この4点は必ず守る）】
① 髪：角刈りパンチ。サイドと後ろは刈り上げ、てっぺんだけ短く縮れて立ち上がる（パンチパーマ）。前髪は上げて額を出す。
② 眼鏡：黒縁の普通の眼鏡（サングラスではない）。レンズは透明か薄い色で、レンズ越しに目が見える。
③ 掛け方：鼻の上に「ちょいがけ」。鼻先に引っかかる低い位置で、レンズの上端が目の少し下に来る。ずらして掛かっていることが分かる角度にする。
④ 髭：口の上の口髭（細く短い）。顎髭はない。
補足：黄色と黒のヒョウ柄の衣装。表情は真顔寄り。`

  return `16:9のゲームプレイ画面を1枚生成してください。完成ゲームのスクリーンショットとして見える画にします。

${pico}
${style}

【このゲームの画面】
${prop.imageComp}

【画面内のUI（必ず文字を入れる）】
${prop.ui.filter(u=>u.req!=='任意').map(u=>`${u.label}：${u.pos}`).join(' / ')}

【トーン】
${prop.imageMood}

【吹き出し（必ず入れる）】
ピコ太郎の頭の横に、白地に黒縁の吹き出しを1つ描き、中に「Pen!」または「Apple!」と大きく書く。

【この画面に必ず写すもの】
${prop.twist.name}：${prop.twist.one}（プレイヤーが「今それを意識している」と分かる状態で描く）

【構図の条件】
・プレイ中の、いちばん気持ちいい瞬間を切り取る（成功した瞬間、または成功の直前）。
・主役・アイテム・背景・UIが一目で区別できる。
・四角や丸だけで済ませず、題材らしい形と質感にする。
・文字は日本語で、はっきり読める大きさにする（UIのラベル以外の文字は入れない）。

【禁止】
・実在の人物の顔、公式ロゴ、実在ブランド、他社キャラクター。
・意味のない英語の羅列、読めない文字、透かし。
・画面外にはみ出すUI。`;
}

function promptCode(prop){
  const s = prop.state;
  const mobile = s.audience === 'aud_kids' || s.audience === 'aud_casual' || s.audience === 'aud_sns'
    ? 'PCはキーボード、スマホは画面内の大きなボタン／タップで操作できるようにする。'
    : 'PCのキーボード操作を基本にし、スマホでは画面の左右タップでも動くようにする。';
  const tuning = (PK.ENGINES[prop.engine] && PK.ENGINES[prop.engine].tuning) || [];
  const tuningBlock = tuning.map(t=>{
    const v = Number(t[1]);
    const lo = v===0 ? 0 : +(v*0.7).toFixed(2);
    const hi = v===0 ? 0 : +(v*1.3).toFixed(2);
    return `  ${t[0]}: ${t[1]},  // ${t[2]}（${t[3]}）／目安 ${lo}〜${hi}`
      + (v ? `\n  // ${t[0]}: ${Number.isInteger(v)?Math.max(1,Math.round(v*0.75)):+(v*0.75).toFixed(2)},  // ← 控えめにしたい場合（コメントを外して使う）` : '');
  }).join('\n');

  return `HTML/CSS/JavaScriptを1ファイルにまとめて、30〜90秒で遊べるWebミニゲームを1本作ってください。

【最重要の拘束】
${LOCK}

【仕様（変更禁止）】
・タイトル：${prop.title}
・プレイヤーがすること：${prop.action}
・操作：${prop.input}
・成功条件：${prop.success}
・失敗条件：${prop.fail}
・1プレイ：${prop.duration}秒
・画面：TITLE → PLAY → RESULT（RESULTからRETRYで再開）
・UI：${listUI(prop)}
・もう一回遊ぶ理由：${prop.retry}

【実装の条件】
・${mobile}
・Canvas 2D APIのみ。外部ライブラリ、外部画像URL、CDN、Webフォントは使わない。
・図形と色と文字だけで描く。画像ファイルを読み込まない。
・タイトル→プレイ→リザルト→リトライが必ず循環する。リトライは状態を完全に初期化する。
・移動・落下・タイマーは「1秒あたりの値 × dt」で更新し、dtは0.033秒を上限にする（端末で速度が変わらないように）。
・背景・影・粒子など、軽い演出を3種類以上入れる。四角だけを動かさない。
・コードの冒頭に TUNING オブジェクトを置き、主要な数値を日本語コメント付きでまとめる。
・Consoleにエラーを出さない。配列は必ず初期化する。イベント登録は1回だけ。

【刺激の1手（必ず実装する・これが面白さの中心）】
・${prop.twist.name}：${prop.twist.one}
・実装：${prop.twist.how}
・調整：${prop.twist.tune}
・これを入れるためだけに、余計な機能を足さない。1つだけ。

【副動詞の仕掛け（仕様に含める）】
${prop.subs.length? prop.subs.map(x=>`・${x.verb}：${x.add}`).join('\n') : '・なし'}

【このゲーム固有の実装メモ】
${prop.codeNotes}

【TUNINGの初期値（この値から始める）】
const TUNING = {
${tuningBlock || '  // このゲームの主要数値'}
};
// TUNINGはコードの先頭に置き、ゲーム中はここを書き換えるだけで調整できるようにする。
// 上のような「控えめ／強め」の代替値はコメントアウトで併記し、学生が数値を探さずに済むようにする。

【音（最初から実装する・省略禁止）】
${PK.PICO_SOUND.build}
・音量：BGM ${PK.PICO_SOUND.volume}。SEはBGMより+8dB。
・SE 8種：${PK.PICO_SE.map(x=>`${x.label}（${x.how}）`).join('／')}
・必ず「Pen」「Apple」「Pineapple」の3音が耳で区別できること。ここがピコ太郎らしさの中心。
・開始時にAudioContextをresumeする（ブラウザの自動再生制限のため、最初のクリックで鳴らす）。

【キャラクターと吹き出し（必ず実装する）】
・ピコ太郎のキャラを画面に描く（図形でよい）。${PICO_ONELINE}
・吹き出しを1つ作り、以下の場面で0.9秒だけ表示する。文字は大きく、白地に黒縁。
　開始：${PK.PICO_LINES.start.slice(0,2).join(' / ')}
　アイテム登場：${PK.PICO_LINES.appear.join(' / ')}
　成功：${PK.PICO_LINES.ok.join(' / ')}
　失敗：${PK.PICO_LINES.miss.join(' / ')}
　コンボ3以上：${PK.PICO_LINES.combo.join(' / ')}
・吹き出しはゲームの操作を邪魔しない位置（キャラの頭上、画面の端）に出す。
・セリフの表示と同時に、対応するSEを鳴らす（音と言葉をセットにする）。

【見た目】
・背景は黄色と黒のヒョウ柄。UIは白抜きの太い文字。
・ピコ太郎は図形で描く（画像は使わない）。${PICO_ONELINE}
・描き方：頭＝黒い角丸の四角＋上に小さな縮れ（3〜4個の小さい円）、眼鏡＝黒い横長の四角2つを細い線で繋ぎ、鼻の位置まで下げる、髭＝目より下の短い横線、体＝黄色地に黒い不定形の斑点。
・成功は黄色、失敗は赤。色だけで意味が分かるようにする。

【出力】
Markdownのコードブロック1つだけ。中身は <!DOCTYPE html> で始まり </html> で終わる完成品。
説明文・前置き・分割・差分は書かないでください。`;
}

/* ---------- Godot 4 移植プロンプト（学生がGodotエディタを操作する用） ---------- */
function promptGodot(prop){
  const tuning = (PK.ENGINES[prop.engine] && PK.ENGINES[prop.engine].tuning) || [];
  const tuningBlock = tuning.map(t=>`  "${t[0]}": ${t[1]},  # ${t[2]}（${t[3]}）`).join('\n');

  return `Godot 4（GDScript）で作るミニゲームの「制作ガイド」を作ってください。
作るのはゲームのコード一式ではなく、Godotを初めて触る学生がエディタを自分の手で操作しながら作れる手順書です。

【最重要の拘束】
${LOCK}

【仕様（変更禁止）】
・タイトル：${prop.title}
・プレイヤーがすること：${prop.action}
・操作：${prop.input}
・成功条件：${prop.success}
・失敗条件：${prop.fail}
・1プレイ：${prop.duration}秒
・画面：TITLE → PLAY → RESULT（RESULTからRETRYで再開）
・UI：${listUI(prop)}
・もう一回遊ぶ理由：${prop.retry}

【出力の形式（この見出し順を厳守）】
## 0. 準備
Godot 4.xで新規プロジェクトを作る手順。「2D」で作ること、ウィンドウサイズの設定（縦横比16:9）を含める。
## 1. シーン構成（完成形）
完成形のノードツリーを1つのテキストツリーで示す。必ずGodotの実際のノード名で書く（Node2D / Area2D / RigidBody2D / Label / Button など）。Unity用語（GameObject・Prefab・TextMeshPro・OnTriggerEnter2D）を一切使わない。
## 2. 手順
7ステップ前後に分割する。各ステップは必ずこの5項目：
・目的（1行）
・エディタでの操作（右クリック→「ノードを追加」レベルで、画面を見ながら追える具体度で）
・貼るスクリプト（ファイル名 + 全コード。コピペで動く完成品。imports/変数に日本語コメント）
・動作確認（この時点で何ができていれば良いか、F5で何が見えるか）
・つまずきポイント（1つ。よくあるエラー文と直し方）
ステップ1は「キャラが矢印キーで動く」まで。ステップ2以降で核心のループ（出る→当たる→点が入る→終わる→もう一回）を最短で繋ぐ。
## 3. TUNING（調整用の数値）
数値はすべて autoload かメインスクリプト先頭の const にまとめる。中身は以下の値から始める：
const TUNING = {
${tuningBlock || '  # このゲームの主要数値'}
}
# ゲーム中はこの値を書き換えるだけで調整できる。学生に「どこを触れば難しさが変わるか」を1行で書く。
## 4. 書き出し（Web公開）
プロジェクト → 「書き出し」→ Web (HTML5) の手順。初回はプリセット追加が必要なことも書く。

【GDScriptの条件】
・GDScript 2.0（Godot 4.x）のみ。C#は使わない。
・移動・落下・タイマーは「1秒あたりの値 × delta」で更新する。
・リトライは get_tree().reload_current_scene() で良いが、スコア・残機が残らないよう初期化を確認する。
・当たり判定は Area2D + body_entered / area_entered を使う。日本語コメント必須。
・エラーが出ないこと。ノードパス（%Text などユニーク名）は手順の操作と一致させる。

【刺激の1手（必ず実装する・これが面白さの中心）】
・${prop.twist.name}：${prop.twist.one}
・実装：${prop.twist.how}
・調整：${prop.twist.tune}
・これを入れるためだけに、余計な機能を足さない。1つだけ。

【副動詞の仕掛け（仕様に含める）】
${prop.subs.length? prop.subs.map(x=>`・${x.verb}：${x.add}`).join('\n') : '・なし'}

【このゲーム固有の実装メモ】
${prop.codeNotes}

【音（最初から実装する・省略禁止）】
${PK.PICO_SOUND.build}
・音量：BGM ${PK.PICO_SOUND.volume}。SEはBGMより目立たせる。
・SE 8種：${PK.PICO_SE.map(x=>`${x.label}（${x.how}）`).join('／')}
・必ず「Pen」「Apple」「Pineapple」の3音が耳で区別できること。ここがピコ太郎らしさの中心。
・音ファイルは wav/ogg を読み込む前提で、AudioStreamPlayer の使い方を手順に含める。

【キャラクターと吹き出し（必ず実装する）】
・ピコ太郎のキャラを画面に描く（図形のノード組み合わせでよい。画像は使わない）。${PICO_ONELINE}
・吹き出しを1つ作り、以下の場面で0.9秒だけ表示する。文字は大きく、白地に黒縁。
　開始：${PK.PICO_LINES.start.slice(0,2).join(' / ')}
　アイテム登場：${PK.PICO_LINES.appear.join(' / ')}
　成功：${PK.PICO_LINES.ok.join(' / ')}
　失敗：${PK.PICO_LINES.miss.join(' / ')}
　コンボ3以上：${PK.PICO_LINES.combo.join(' / ')}
・吹き出しはゲームの操作を邪魔しない位置（キャラの頭上、画面の端）に出す。
・セリフの表示と同時に、対応するSEを鳴らす（音と言葉をセットにする）。

【見た目】
・背景は黄色と黒のヒョウ柄。UIは白抜きの太い文字。
・成功は黄色、失敗は赤。色だけで意味が分かるようにする。

【出力】
Markdownのみ。説明文・前置き・「ようこそ」的な挨拶は書かないでください。`;
}

/* ---------- 提出用テキスト ---------- */
function formsText(prop){
  return `【ゲーム仕様ミニマム版】
プレイヤーがすること：${prop.action}
操作方法：${prop.input}（PCはキーボード／スマホはタップ）
成功条件：${prop.success}
失敗条件：${prop.fail}
1プレイ時間：${prop.duration}秒
必要な画面：${prop.screens.join('／')}

【最初に作るPrefab】
${prop.first.prefab}（${PK.PREFABS[prop.first.prefab] ? PK.PREFABS[prop.first.prefab].fn : ''}）
${prop.first.why}`;
}

function bgmPrompt(prop){
  const b = prop.bgmSpec;
  return `ゲーム用のBGMを1曲作ってください。ループ前提のインストルメンタルです。

・テンポ：${b.bpm} BPM
・キー：${b.key}
・長さ：${b.loop}秒（最後が最初に自然につながるように）
・ムード：${b.mood}／${b.tone}
・楽器：${b.instr}
・構成：イントロなし。頭から主役のフレーズが始まり、4小節単位で変化をつける。
・音量：控えめ。効果音（SE）が前に出るミックスにする。低音は詰めすぎない。
・禁止：ボーカル、既存曲の引用、急な盛り上がり（ゲーム中に何度も聴くため）。

${prop.oneline}
このゲームは1プレイ${prop.duration}秒です。同じ曲を何度も聴くので、耳に残りすぎないこと。`;
}

/* Unity用：コメント付きの調整値ブロック（そのまま貼れる） */
function tuningCSharp(engineId){
  const t = (PK.ENGINES[engineId] && PK.ENGINES[engineId].tuning) || [];
  const rows = t.map(x=>{
    const key = x[0], v = Number(x[1]);
    const isInt = /count|Count|Every|maxEnemy|itemCount|blockRows|blockCols|laneCount|hitsToBreak|maxLife|questionCount/i.test(key) && Number.isInteger(v);
    const type = isInt ? 'int' : 'float';
    const val = isInt ? String(v) : (v % 1 === 0 ? v.toFixed(1)+'f' : String(v)+'f');
    const lo = v===0?0:+(v*0.7).toFixed(2), hi = v===0?0:+(v*1.3).toFixed(2);
    const altVal = isInt ? String(Math.max(1,Math.round(v*0.75))) : (+(v*0.75).toFixed(2)).toFixed(2)+'f';
    const alt = v===0?'':`        // public ${type} ${key} = ${altVal};  // ← 控えめにしたい場合（この行を有効化）`;
    return `        [Tooltip("${x[2]}（${x[3]}）／目安 ${lo}〜${hi}")]
        public ${type} ${key} = ${val};   // ${x[2]}` + (alt?`\n${alt}`:'');
  }).join('\n\n');
  return `using UnityEngine;

/// <summary>
/// 調整用の数値。ゲーム中はここだけ触れば強さを変えられる。
/// それぞれ「目安」の範囲をコメントに書いてある。まずは初期値のまま動かし、
/// 1か所だけ変えて、変わったかどうかを確認する（同時に2つ変えない）。
/// </summary>
[CreateAssetMenu(menuName = "PK/Tuning", fileName = "Tuning")]
public class Tuning : ScriptableObject
{
    [Header("このゲームの主要数値")]
${rows}
}
`;
}

/* ---------- なぜこの案か（選択→重みの内訳） ---------- */
function explain(s, p){
  const rows = [];
  s.ips.forEach(id=>{
    const v = ipById(id); if(!v) return;
    const w = p.ip[id] || 0;
    rows.push({k:'IP価値', label:v.label, val:w*MECH[v.mech], mark:v.mech});
  });
  s.emos.forEach(id=>{
    const e = PK.EMOTIONS.find(x=>x.id===id); if(!e) return;
    rows.push({k:'感情', label:e.label, val: p.emo.includes(id) ? 0.6 : 0, mark:''});
  });
  verbList(s).forEach((vb,i)=>{
    rows.push({k: i===0?'動詞':'副動詞', label:vb.label, val: p.verbs.includes(vb.label)?1 : (p.verbGroup===vb.group?0.62:0.3), mark:''});
  });
  const a = PK.AUDIENCES.find(x=>x.id===s.audience);
  if(a) rows.push({k:'対象', label:a.label, val: p.aud.includes(a.id)?0.6:0.15, mark:''});
  const max = rows.reduce((m,r)=>Math.max(m,r.val), 0.001);
  rows.forEach(r=>{ r.ratio = Math.max(0, Math.min(1, r.val/max)); });
  return rows.sort((x,y)=> y.val - x.val);
}

PK.gen = {
  recommend, tuningCSharp, ipNote, managementProposal, consistency, dnaSentence, audienceLabel, buildProposal, ipStrength, explain, promptPlan, promptImage, promptCode, formsText, bgmPrompt,
  ipById, patById, verbById, fill, EXP_CAP, promptGodot,
};
})();
