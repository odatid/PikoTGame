/* =========================================================
   PK//PROTO — UI / ステップ管理
   ========================================================= */
(function(){
'use strict';

const $ = (sel, root)=> (root||document).querySelector(sel);
const app = $('#app');
const rail = $('#rail');
const tapeLines = $('#tapeLines');
const toastEl = $('#toast');

const STEPS = [
  {id:'intro', n:'00', t:'はじめる'},
  {id:'d0',    n:'01', t:'DNAシート'},
  {id:'d1',    n:'02', t:'DNA 誰に'},
  {id:'d2',    n:'03', t:'DNA IPの価値'},
  {id:'d3',    n:'04', t:'DNA 感情'},
  {id:'d4',    n:'05', t:'DNA 動詞'},
  {id:'ch',    n:'06', t:'挑戦の宣言'},
  {id:'ty',    n:'07', t:'作れる型'},
  {id:'cf',    n:'08', t:'確認'},
  {id:'cs',    n:'09', t:'ゲーム案'},
  {id:'pr',    n:'10', t:'プロンプト'},
  {id:'un',    n:'11', t:'Unityへ'}
];

const KEY = 'pkproto.v1';
let state = {
  step:'intro',
  audience:null,
  ips:[], emos:[], verbs:[], types:[], exp:'some',
  dim:null, skills:[], challenges:[], mentor:'',
  whyPico:'', whyFree:'', wantTo:null, perception:null,
  idx:0, patch:null, dot:false, tab:0,
  title:''
};

/* ---------- 永続化 ---------- */
function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){}
}
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){ const o = JSON.parse(raw); if(o && o.step){ if(!o.verbs && o.verb) o.verbs=[o.verb]; state = Object.assign(state, o); } }
  }catch(e){}
  const h = location.hash;
  if(h.startsWith('#p=')){
    try{
      const b = h.slice(3).replace(/-/g,'+').replace(/_/g,'/');
      const json = decodeURIComponent(escape(atob(b)));
      const o = JSON.parse(json);
      state = Object.assign(state, o);
    }catch(e){}
  }
}
function encodeState(){
  const slim = {step:state.step,audience:state.audience,ips:state.ips,emos:state.emos,verb:state.verb,types:state.types,exp:state.exp,idx:state.idx,patch:state.patch,dot:state.dot,tab:state.tab,title:state.title};
  const b = btoa(unescape(encodeURIComponent(JSON.stringify(slim))));
  return b.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function sessionCode(){
  const src = JSON.stringify([state.audience,state.ips,state.emos,state.verb,state.types,state.exp]);
  let h = 0;
  for(let i=0;i<src.length;i++){ h = ((h<<5)-h+src.charCodeAt(i))|0; }
  const s = Math.abs(h).toString(36).toUpperCase().padStart(5,'0').slice(-5);
  return 'PK'+s.slice(0,3)+'-'+s.slice(3);
}

/* ---------- 小物 ---------- */
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(msg){
  toastEl.textContent = msg; toastEl.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(()=>toastEl.classList.remove('on'), 1900);
}
async function copy(text){
  try{ await navigator.clipboard.writeText(text); toast('コピーしました'); }
  catch(e){
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); toast('コピーしました'); }catch(_){ toast('コピーできませんでした。範囲選択してコピーしてください'); }
    ta.remove();
  }
}
function count(list){ return list.length; }
function selectedIps(){ return state.ips.map(id=>PK.gen.ipById(id)).filter(Boolean); }
function verbObj(){ return state.verb ? PK.gen.verbById(state.verb) : null; }
function rankedList(){ return PK.gen.recommend(state); }
function currentProposal(){ return PK.gen.buildProposal(state, rankedList(), state.idx, state.patch ? PK.IP_PATCHES.find(p=>p.id===state.patch) : null); }
function canNext(){
  switch(state.step){
    case 'd0': return !!(state.whyPico && state.wantTo && state.perception);
    case 'd1': return !!state.audience;
    case 'd2': return state.ips.length>0;
    case 'd3': return state.emos.length>0;
    case 'd4': return state.verbs.length>0;
    case 'ch': return !!state.dim;
    case 'ty': return state.types.length>0;
    default: return true;
  }
}

/* ---------- rail / tape ---------- */
function renderRail(){
  const idxNow = STEPS.findIndex(s=>s.id===state.step);
  rail.innerHTML = `<div class="rail-title">PROGRESS</div><ol>` + STEPS.map((s,i)=>{
    let cls = '';
    if(i < idxNow) cls='done';
    else if(i === idxNow) cls='now';
    else cls='future';
    return `<li class="${cls}"><span class="rn">${cls==='done'?'✓':s.n}</span><span>${esc(s.t)}</span></li>`;
  }).join('') + `</ol>`;
}
function renderTape(){
  const bits = [];
  if(state.audience){ const a = PK.AUDIENCES.find(x=>x.id===state.audience); if(a) bits.push(`<span>誰に <b>${esc(a.label)}</b></span>`); }
  if(state.ips.length) bits.push(`<span>IP <b>${esc(selectedIps().map(x=>x.label).join('・'))}</b></span>`);
  if(state.emos.length) bits.push(`<span>感情 <b>${esc(state.emos.map(id=>(PK.EMOTIONS.find(e=>e.id===id)||{}).label).filter(Boolean).join('・'))}</b></span>`);
  if(state.verbs.length){ const l=state.verbs.map(id=>PK.gen.verbById(id)).filter(Boolean).map(v=>v.label); bits.push(`<span>動詞 <b>${esc(l.join('＋'))}</b></span>`); }
  if(state.types.length) bits.push(`<span>型 <b>${esc(state.types.map(t=>(PK.TYPES.find(x=>x.id===t)||{}).label).filter(Boolean).join('・'))}</b></span>`);
  if(state.step==='s7'||state.step==='s8'||state.step==='s9'){
    const p = currentProposal();
    bits.push(`<span><b>${esc(p.title)}</b></span>`);
    bits.push(`<span>${p.duration}秒 / ${esc(p.input)}</span>`);
  }
  tapeLines.innerHTML = bits.length ? bits.join('') : '<span class="empty">まだ何も決まっていません</span>';
}

/* ---------- 共通パーツ ---------- */
function nav(back, nextLabel, nextAction, disabled){
  return `<div class="nav">
    ${back?`<button class="btn ghost" data-act="back">← 戻る</button>`:'<span></span>'}
    <span class="grow"></span>
    <button class="btn" data-act="${nextAction}" ${disabled?'disabled':''}>${nextLabel} <span class="k">→</span></button>
  </div>`;
}
function counter(n, max){ return max
  ? `<div class="count">選択中 <b>${n}</b> ／ ${max}（上限）</div>`
  : `<div class="count">選択中 <b>${n}</b> ／ 上限なし<span class="tiny">　選んだ数だけ重みが付きます</span></div>`; }
function chip(label, pressed, act, val, tag){
  return `<button class="chip" type="button" aria-pressed="${pressed?'true':'false'}" data-act="${act}" data-val="${esc(val)}">${esc(label)}${tag||''}</button>`;
}

/* ---------- screens ---------- */
function screenIntro(){
  return `
  <div class="intro-hero">
    <div>
      <div class="eyebrow">GAME PRODUCTION / 2026 後期</div>
      <h1>考えた動詞を、<br><span class="y">遊べる形</span>にする。</h1>
      <p class="lead">ピコ太郎の何を使うか、誰に届けるか、どんな気持ちにしたいか。そこから<b>1本のゲーム案</b>を出し、そのまま<b>企画書・画面イメージ・Webゲーム</b>の3つのプロンプトにして、最後に<b>Unityで作るための手引き</b>まで返します。</p>
      <p class="small">所要 15分。AIは企画を考えません。あなたが選んだものの組み合わせで、仕様を組み立てます。</p>
      <div class="nav" style="border:0;padding-top:8px;margin-top:18px">
        <button class="btn yellow" data-act="start">はじめる <span class="k">15 min</span></button>
      </div>
    </div>
    <div class="hero-card">
      <div class="hc-t">このツールでやること</div>
      <ol>
        <li>IPの価値・感情・動詞を<b>選ぶ</b>（8分）</li>
        <li>条件に合う<b>ゲーム案を1つ</b>受け取る</li>
        <li>企画書／画面／コードの<b>プロンプト3本</b>をコピー</li>
        <li>自分の生成AIで<b>遊べるプロト</b>を作る</li>
        <li>戻ってきて<b>Unity制作パッケージ</b>を受け取る</li>
      </ol>
    </div>
  </div>

  <div class="flow-strip">
    <div><span class="fs-n">01</span>選ぶ<br><span class="small">価値・感情・動詞</span></div>
    <div><span class="fs-n">02</span>案が出る<br><span class="small">1案だけ</span></div>
    <div><span class="fs-n">03</span>プロンプト<br><span class="small">企画／画面／コード</span></div>
    <div><span class="fs-n">04</span>AIで試す<br><span class="small">自分のアカウントで</span></div>
    <div><span class="fs-n">05</span>Unityへ<br><span class="small">仕様・素材・手引き</span></div>
  </div>

  <div class="note">
    <strong>これは「ゲームを考えてくれるAI」ではありません。</strong>
    あなたが第3回までに考えた「核となる動詞」を、実際に作れる形まで橋渡しする道具です。
    案が気に入らなければ「別の形を見る」で出し直せます。選んだ条件は、最後のUnity手引きまで一貫して使われます。
  </div>

  <div class="nav" style="border:0">
    <span class="tiny">はじめる前に：ピコ太郎の画像は公式素材を使いません。黄色・ヒョウ柄・サングラス・パーマの「記号」として扱います。</span>
  </div>`;
}

function screenDNA(){
  const want = PK.WANT_TO.find(x=>x.id===state.wantTo);
  const per = PK.PERCEPTION.find(x=>x.id===state.perception);
  const why = PK.WHY_PICO.find(x=>x.id===state.whyPico);
  const ok = !!state.whyPico && !!state.wantTo && !!state.perception;
  return `
  <div class="eyebrow">STEP 01 — DNA SHEET</div>
  <h1>第3回で、グループは何を決めた？</h1>
  <p class="lead">第1〜3回で整理したピコ太郎IPの分析から、グループで決めたことを選んでください。ここで申告した内容が、この後の案・提案書・Unity手引きのすべての判断基準になります。</p>

  <h3 style="margin-top:26px">① なぜ、ピコ太郎なのか</h3>
  <p class="small" style="margin-bottom:8px">第3回で話した内容に<b>一番近い1文</b>を選んでください。言葉は後で提案書にそのまま載ります。</p>
  <div class="chips">
    ${PK.WHY_PICO.map(w=>`<button class="chip" type="button" aria-pressed="${state.whyPico===w.id}" data-act="why" data-val="${w.id}">${esc(w.short)}</button>`).join('')}
    <button class="chip" type="button" aria-pressed="${state.whyPico==='why_other'}" data-act="why" data-val="why_other">その他（自分で書く）</button>
  </div>
  ${why?`<div class="note" style="margin-top:10px">${esc(why.text)}</div>`:''}
  ${state.whyPico==='why_other'?`
    <div class="field" style="max-width:none;margin-top:10px">
      <label for="whyfree">自分たちの言葉で（1〜2文）</label>
      <textarea id="whyfree" rows="3" placeholder="例：ピコ太郎は、意味が分からないまま体が動いてしまう。その『考える前に体が反応する』感じをゲームにしたい。">${esc(state.whyFree||'')}</textarea>
    </div>`:''}

  <h3 style="margin-top:30px">② 誰に届ける？（○○したい人）</h3>
  <p class="small" style="margin-bottom:8px">第3回で決めたターゲットを、<b>「〜したい人」の形</b>で選んでください。</p>
  <div class="chips">
    ${PK.WANT_TO.map(w=>`<button class="chip" type="button" aria-pressed="${state.wantTo===w.id}" data-act="want" data-val="${w.id}">${esc(w.label)}</button>`).join('')}
  </div>
  <p class="tiny">${want?esc(want.note):'選ぶと、提案書のターゲット記述に使われます。'}</p>

  <h3 style="margin-top:30px">③ 最終的に、どう認知してほしい？</h3>
  <p class="small" style="margin-bottom:8px">「ピコ太郎は○○なIPである」と、遊んだ人に思ってほしい形を1つ選んでください。</p>
  <div class="chips">
    ${PK.PERCEPTION.map(p=>`<button class="chip" type="button" aria-pressed="${state.perception===p.id}" data-act="perc" data-val="${p.id}">${esc(p.label)}</button>`).join('')}
  </div>

  ${ok?`
  <div class="note" style="margin-top:24px">
    <strong>この企画の論理：</strong><br>
    ターゲットは<b>${esc(want.label)}</b>。<br>
    ピコ太郎の「<b>${esc(why?why.short:'自分たちの言葉')}</b>」を、この後の4画面で選ぶ要素から<b>遊び</b>に変換し、<br>
    結果として「ピコ太郎は<b>${esc(per.label)}</b>」と認知してもらう。
  </div>`:''}

  ${nav(false,'次へ：DNA 誰に','next',!canNext())}`;
}

function screenAudience(){
  return `
  <div class="eyebrow">STEP 01 — DNA ①</div>
  <h1>誰に遊んでもらう？</h1>
  <p class="lead">DNAシートの続きです。<b>誰に</b>届けるかを選ぶと、操作デバイスと難易度の初期値が決まります。</p>

  <div class="chips">
    ${PK.AUDIENCES.map(a=>chip(a.label, state.audience===a.id, 'aud', a.id)).join('')}
  </div>
  <p class="tiny" style="margin-top:10px">${state.audience ? esc((PK.AUDIENCES.find(a=>a.id===state.audience)||{}).note) : '選ぶと、この相手に合わせた補足が出ます。'}</p>
  ${nav(true,'次へ：ピコ太郎の価値','next',!canNext())}`;
}

function screenIps(){
  const groups = [...new Set(PK.IP_VALUES.map(v=>v.g))];
  const max = 0;
  return `
  <div class="eyebrow">STEP 02 — DNA ②</div>
  <h1>ピコ太郎の、どの価値を使う？</h1>
  <p class="lead">「そう思う」ものを<b>いくつでも</b>選んでください。選んだ数だけ重みが付き、多いほど案があなたの好みに寄ります。<b>仕組みにできるもの</b>（◎）が1つ入ると、ピコ太郎である理由が強くなります。</p>
  ${counter(state.ips.length, max)}
  ${groups.map(g=>`
    <div class="grp">
      <div class="grp-h"><span class="gh-t">${esc(g)}</span><span class="gh-n">${PK.IP_VALUES.filter(v=>v.g===g).length}</span></div>
      <div class="chips">
        ${PK.IP_VALUES.filter(v=>v.g===g).map(v=>{
          const on = state.ips.includes(v.id);
          const tag = `<span class="tag ${v.mech==='◎'?'mech':v.mech==='△'?'vis':''}">${v.mech}</span>`;
          return `<button class="chip" type="button" aria-pressed="${on}" data-act="ip" data-val="${v.id}" title="${esc(v.note)}">${esc(v.label)}${tag}</button>`;
        }).join('')}
      </div>
    </div>`).join('')}
  ${nav(true,'次へ：与えたい感情','next',!canNext())}`;
}

function screenEmos(){
  return `
  <div class="eyebrow">STEP 03 — DNA ③</div>
  <h1>どんな気持ちにしたい？</h1>
  <p class="lead">「そう思う」ものを<b>いくつでも</b>。ここで選んだ感情が、成功・失敗の演出と効果音の方向を決めます。多く選ぶほど、案は平均ではなく<b>重なった部分</b>を狙います。</p>
  ${counter(state.emos.length, 0)}
  <div class="chips">
    ${PK.EMOTIONS.map(e=>{
      const on = state.emos.includes(e.id);
      return `<button class="chip" type="button" aria-pressed="${on}" data-act="emo" data-val="${e.id}">${esc(e.label)}</button>`;
    }).join('')}
  </div>
  <p class="tiny" style="margin-top:10px">${state.emos.length ? esc(state.emos.map(id=>{const e=PK.EMOTIONS.find(x=>x.id===id); return e?`成功＝${e.ok}／失敗＝${e.ng}`:'';}).join('　')) : '選ぶと、成功時と失敗時の設計指針が出ます。'}</p>
  ${nav(true,'次へ：核となる動詞','next',!canNext())}`;
}

function screenVerbs(){
  const sug = suggestVerbs();
  const picked = state.verbs.map(id=>PK.gen.verbById(id)).filter(Boolean);
  return `
  <div class="eyebrow">STEP 04 — DNA ④</div>
  <h1>ゲームの核になる動詞は？</h1>
  <p class="lead">第3回で考えた動詞を<b>1〜3個</b>。<b>1個目が主役</b>、2・3個目は「あったら嬉しい仕掛け」として案に足されます。まだ決まっていなければ、IP価値から候補を出せます。</p>
  ${counter(state.verbs.length, 3)}
  ${picked.length?`<div class="note" style="margin-top:0">
    <b>主動詞：</b>${esc(picked[0].label)}${picked.slice(1).map(v=>`<br><b>副動詞：</b>${esc(v.label)}`).join('')}
    <div class="tiny" style="margin-top:4px">副動詞は、案に「仕掛け」として1つずつ追加されます（例：集める→拾う小アイテムと目標数）。</div>
  </div>`:''}
  ${PK.VERB_GROUPS.map(g=>`
    <div class="grp">
      <div class="grp-h"><span class="gh-t">${esc(g.g)}</span><span class="gh-n">${g.verbs.length}</span></div>
      <div class="chips">${g.verbs.map(v=>{
        const on = state.verbs.includes(v.id);
        const dis = !on && state.verbs.length>=3;
        return `<button class="chip" type="button" aria-pressed="${on}" data-act="verb" data-val="${v.id}" ${dis?'disabled':''}>${esc(v.label)}</button>`;
      }).join('')}</div>
    </div>`).join('')}
  <div class="grp">
    <div class="grp-h"><span class="gh-t">まだ決めていない</span><span class="gh-n">ASSIST</span></div>
    <button class="btn ghost" data-act="suggest">IP価値から動詞を3つ出す</button>
    ${sug.length?`<div class="chips" style="margin-top:10px">${sug.map(v=>chip(v.label, state.verbs.includes(v.id), 'verb', v.id)).join('')}</div>`:''}
  </div>
  ${nav(true,'次へ：作れる型','next',!canNext())}`;
}
function suggestVerbs(){
  if(!state._sug) return [];
  const ips = state.ips;
  if(!ips.length) return [];
  const scored = [];
  PK.VERB_GROUPS.forEach(g=>g.verbs.forEach(v=>{
    const p = PK.gen.patById(v.pat); if(!p) return;
    const sc = ips.reduce((a,id)=> a + (p.ip[id]||0), 0);
    scored.push({v, sc});
  }));
  scored.sort((a,b)=>b.sc-a.sc);
  const seen = new Set(), out = [];
  scored.forEach(x=>{ if(out.length<3 && !seen.has(x.v.label) && x.sc>0){ seen.add(x.v.label); out.push(x.v); } });
  return out;
}

function screenChallenge(){
  return `
  <div class="eyebrow">STEP 05 — CHALLENGE</div>
  <h1>今回、何に挑戦する？</h1>
  <p class="lead">2Dか3Dか、いま出来ること、今回やってみたいこと、先生に聞きたいこと。ここで申告した内容が、案の選び方と<b>手引きの順番</b>を変えます。</p>

  <h3>① どちらで作る？</h3>
  <div class="chips">
    ${PK.DIMENSIONS.map(d=>`<button class="chip" type="button" aria-pressed="${state.dim===d.id}" data-act="dim" data-val="${d.id}">${esc(d.label)}</button>`).join('')}
  </div>
  <p class="tiny">${state.dim?esc((PK.DIMENSIONS.find(d=>d.id===state.dim)||{}).note):'選ぶと、その次元の案だけが出ます。'}</p>

  <h3 style="margin-top:26px">② いま出来ること（いくつでも）</h3>
  <p class="small" style="margin-bottom:8px">正直に。できると申告したものは、手引きから外して先へ進みます。</p>
  <div class="chips">
    ${PK.SKILLS.map(k=>`<button class="chip" type="button" aria-pressed="${state.skills.includes(k.id)}" data-act="skill" data-val="${k.id}" title="${esc(k.note)}">${esc(k.label)}</button>`).join('')}
  </div>
  ${counter(state.skills.length,0)}

  <h3 style="margin-top:26px">③ 今回挑戦したいこと（最大2つ）</h3>
  <div class="chips">
    ${PK.CHALLENGES.map(c=>{
      const on = state.challenges.includes(c.id);
      const dis = !on && state.challenges.length>=2;
      return `<button class="chip" type="button" aria-pressed="${on}" data-act="chal" data-val="${c.id}" ${dis?'disabled':''}>${esc(c.label)}</button>`;
    }).join('')}
  </div>
  ${counter(state.challenges.length,2)}

  <div class="field">
    <label for="mentor">④ 先生に指導してほしいこと（任意）</label>
    <textarea id="mentor" rows="3" placeholder="例：当たり判定の作り方が曖昧です。あと、当たった時の演出をどう入れればいいか見てほしい。">${esc(state.mentor||'')}</textarea>
    <div class="tiny">ここに書いた内容は、Unity手引きの最後に「今回の相談事項」として出ます。</div>
  </div>

  ${nav(true,'次へ：作れる型','next',!canNext())}`;
}

function screenTypes(){
  return `
  <div class="eyebrow">STEP 06 — BUILD TYPE</div>
  <h1>自分が作れそうな型は？</h1>
  <p class="lead">「作れそう」と思うものを<b>いくつでも</b>。<b>ここで選んだ型の中から案を出します</b>（型を変えれば、出るゲームも変わります）。</p>
  ${counter(state.types.length, 0)}
  <div class="chips">
    ${PK.TYPES.map(t=>{
      const on = state.types.includes(t.id);
      return `<button class="chip" type="button" aria-pressed="${on}" data-act="type" data-val="${t.id}">${esc(t.label)}</button>`;
    }).join('')}
  </div>
  <h2 style="font-size:17px;margin-top:26px">Unityの経験</h2>
  <p class="small" style="margin-bottom:8px">経験に合わせて、出す案の難易度の上限を決めます。</p>
  <div class="chips">
    ${[['beginner','初めて（授業で1本目）'],['some','少し作ったことがある'],['experienced','何本か作ったことがある']].map(([id,l])=>`
      <button class="chip" type="button" aria-pressed="${state.exp===id}" data-act="exp" data-val="${id}">${esc(l)}</button>`).join('')}
  </div>
  ${nav(true,'次へ：条件の確認','next',!canNext())}`;
}

function screenConfirm(){
  const ips = selectedIps();
  const emos = state.emos.map(id=>PK.EMOTIONS.find(e=>e.id===id)).filter(Boolean);
  const vs = state.verbs.map(id=>PK.gen.verbById(id)).filter(Boolean);
  const aud = PK.AUDIENCES.find(a=>a.id===state.audience);
  return `
  <div class="eyebrow">STEP 07 — CONFIRM</div>
  <h1>この条件で、案を出します。</h1>
  <p class="lead">間違っていたら戻ってください。ここから先は、この条件が最後まで使われます。</p>
  <div class="card">
    <div class="kv">
      <div class="k">届ける相手</div><div class="v"><b>${esc((PK.WANT_TO.find(w=>w.id===state.wantTo)||{}).label||'—')}</b><br><span class="tiny">${esc(aud?aud.label:'')}</span></div>
      <div class="k">認知ゴール</div><div class="v">ピコ太郎は<b>${esc((PK.PERCEPTION.find(p=>p.id===state.perception)||{}).label||'—')}</b></div>
      <div class="k">なぜピコ太郎か</div><div class="v small">${esc(state.whyPico==='why_other'?((state.whyFree||'').slice(0,90)):((PK.WHY_PICO.find(w=>w.id===state.whyPico)||{}).short||'—'))}</div>
      <div class="k">IPの価値</div><div class="v">${ips.map(i=>`<b>${esc(i.label)}</b> <span class="req ${i.mech==='◎'?'must':''}">${i.mech}</span>`).join('<br>')}</div>
      <div class="k">与えたい感情</div><div class="v">${emos.map(e=>esc(e.label)).join('・')}</div>
      <div class="k">核となる動詞</div><div class="v"><b style="font-size:17px">${esc(vs.length?vs[0].label:'—')}</b>${vs.slice(1).map(x=>`<br><span class="small">＋ ${esc(x.label)}（副）</span>`).join('')}</div>
      <div class="k">2D / 3D</div><div class="v"><b>${esc(state.dim?(PK.DIMENSIONS.find(d=>d.id===state.dim)||{}).label:'—')}</b></div>
      <div class="k">挑戦すること</div><div class="v">${state.challenges.length?state.challenges.map(id=>esc((PK.CHALLENGES.find(c=>c.id===id)||{}).label)).join('・'):'—'}${state.mentor?`<br><span class="tiny">相談：${esc(state.mentor.slice(0,60))}${state.mentor.length>60?'…':''}</span>`:''}</div>
      <div class="k">作れる型</div><div class="v">${state.types.map(t=>(PK.TYPES.find(x=>x.id===t)||{}).label).filter(Boolean).map(esc).join('・')}<br><span class="tiny">経験：${{beginner:'初めて',some:'少し作ったことがある',experienced:'何本か作ったことがある'}[state.exp]}</span></div>
    </div>
  </div>
  <div class="nav">
    <button class="btn ghost" data-act="back">← 戻る</button>
    <span class="grow"></span>
    <button class="btn yellow" data-act="make">この条件で案をつくる <span class="k">→</span></button>
  </div>`;
}

function ipBadge(s){
  if(s.level==='strong') return `<span class="ipbadge">IP強度：強</span>`;
  if(s.level==='mid') return `<span class="ipbadge mid">IP強度：並</span>`;
  return `<span class="ipbadge weak">IP強度：弱</span>`;
}

function screenProposal(){
  const ranked = rankedList();
  if(state.idx >= ranked.length) state.idx = 0;
  const prop = currentProposal();
  const st = prop.strength;
  const ex = PK.gen.explain(state, PK.gen.patById(prop.patternId));
  const explainRows = ex.filter(r=>r.ratio>0.06).slice(0,8).map(r=>`
    <li class="${r.val<=0?'zero':''}"><span class="wl-k">${esc(r.k)}</span><span class="wl-t">${esc(r.label)}<i class="wl-bar"><i style="width:${Math.round(r.ratio*100)}%"></i></i></span><span class="wl-v">${r.val.toFixed(2)}</span></li>`).join('');
  const isWeak = st.level==='weak' && !state.patch;

  const patchBox = isWeak ? `
    <div class="warnbox">
      <div class="wt">このゲーム、ピコ太郎を別のキャラに変えても同じになりませんか？</div>
      <p>いまの案は「${esc(prop.action)}」が中心で、ピコ太郎である必要が弱い状態です。次のどれかを1つ足すと、あなたの案になります。</p>
      <div class="patch">
        ${PK.IP_PATCHES.map(p=>`<button data-act="patch" data-val="${p.id}">${esc(p.label)}</button>`).join('')}
      </div>
    </div>` : '';

  const patchNote = state.patch ? `
    <div class="note" style="margin-top:14px">
      <strong>足した仕組み：${esc((PK.IP_PATCHES.find(p=>p.id===state.patch)||{}).label||'')}</strong><br>
      ${esc(prop.ipHook)}<br>
      <span class="tiny">この変更は、下のプロンプトとUnity手引き（${esc((PK.IP_PATCHES.find(p=>p.id===state.patch)||{}).prefab||'')}）に反映されています。</span>
    </div>` : '';

  return `
  <div class="eyebrow">STEP 08 — PROPOSAL ${state.idx>0?`／代替 ${state.idx+1}`:''}</div>
  <h1>この形で、どうですか。</h1>
  <p class="lead">条件に合う案を<b>1つだけ</b>出します。しっくり来なければ、条件を選び直してもう一度出してください。</p>

  <div class="proposal">
    <div class="prop-head">
      <div class="prop-eyebrow">${esc(prop.family)} / ${esc(prop.engineName)} / 難易度 ${prop.level}</div>
      <h2 class="prop-title">${esc(prop.title)}</h2>
      <p class="prop-oneline">${esc(prop.oneline)}</p>
      <div style="margin-top:10px">${ipBadge(st)}</div>
    </div>
    <div class="prop-body">
      <div class="kv">
        <div class="k">プレイヤーがすること</div><div class="v">${esc(prop.action)}</div>
        <div class="k">操作方法</div><div class="v">${esc(prop.input)}（PCはキーボード／スマホはタップ）</div>
        <div class="k">成功条件</div><div class="v"><b>${esc(prop.success)}</b></div>
        <div class="k">失敗条件</div><div class="v"><b>${esc(prop.fail)}</b></div>
        <div class="k">1プレイ</div><div class="v">${prop.duration}秒</div>
        <div class="k">繰り返すこと</div><div class="v">${esc(prop.loop)}</div>
        <div class="k">もう一回の理由</div><div class="v">${esc(prop.retry)}</div>
        <div class="k">ピコ太郎である理由</div><div class="v">${esc(prop.ipHook)}</div>
        <div class="k">刺激の1手</div><div class="v"><b>${esc(prop.twist.name)}</b> — ${esc(prop.twist.one)}<br><span class="tiny">${esc(prop.twist.effect)}</span></div>
      </div>
    </div>
  </div>

  ${patchBox}
  ${patchNote}

  <div class="card" style="margin-top:16px">
    <div class="card-h"><span class="ch-t">なぜ、この案になったか</span><span class="ch-n">WEIGHT</span></div>
    <p class="small" style="margin-bottom:4px">あなたが選んだもののうち、この案に効いている順です。ここが薄い項目は、案に反映されていません。気になるなら条件を足してください。</p>
    <ul class="wlist">
      ${explainRows}
    </ul>
  </div>

  <div class="nav">
    <button class="btn ghost" data-act="back">← 条件を直す</button>
    <button class="btn ghost" data-act="redo">選び直す（STEP02へ）</button>
    <span class="grow"></span>
    <button class="btn yellow" data-act="toPrompts">この案で進む <span class="k">→</span></button>
  </div>`;
}

function screenPrompts(){
  const prop = currentProposal();
  const tabs = [
    {t:'① 企画書', n:'PLAN', v:PK.gen.promptPlan(prop)},
    {t:'② 画面イメージ', n:'IMAGE', v:PK.gen.promptImage(prop, state.dot)},
    {t:'③ Webゲーム', n:'CODE', v:PK.gen.promptCode(prop)},
    {t:'④ Godot移植', n:'GODOT', v:PK.gen.promptGodot(prop)}
  ];
  const cur = tabs[state.tab] || tabs[0];
  return `
  <div class="eyebrow">STEP 09 — PROMPTS</div>
  <h1>4つのプロンプトを、<br>あなたのAIに渡す。</h1>
  <p class="lead">このツールはAIを呼びません。文章は、選んだ条件とパターンDBから組み立てた固定のものです。コピーして、いつもの生成AIに貼ってください。</p>

  <ol class="steps-ai">
    <li><b>01</b><span><b>企画書</b>を貼る → 企画書が出る（そのまま保存）</span></li>
    <li><b>02</b><span><b>画面イメージ</b>を画像生成に貼る → 1枚出る</span></li>
    <li><b>03</b><span><b>Webゲーム</b>を貼る → HTMLが出る → 保存して開く → 遊ぶ</span></li>
    <li><b>04</b><span><b>Godot移植</b>を貼る → Godot 4 の制作手順書が出る → エディタで作り直す（ポートフォリオ強化用）</span></li>
  </ol>

  <div class="prompt-tabs" role="tablist">
    ${tabs.map((t,i)=>`<button role="tab" aria-selected="${state.tab===i}" data-act="tab" data-val="${i}"><span class="pt-n">${t.n}</span>${esc(t.t)}</button>`).join('')}
  </div>
  <div class="prompt-panel">
    <div class="prompt-meta">
      <span class="pm-l">${state.tab===1?'画像生成AI（16:9）に貼る':state.tab===2?'コード生成AIに貼る':state.tab===3?'コード生成AIに貼る（Godot 4 手順書を作らせる）':'テキスト生成AIに貼る'}／文字数 ${cur.v.length.toLocaleString()}</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${state.tab===1?`<label class="switch"><input type="checkbox" id="dotToggle" ${state.dot?'checked':''}> ドット絵テイスト</label>`:''}
        <button class="btn" data-act="copyPrompt">コピー</button>
      </div>
    </div>
    <textarea class="prompt-box" id="promptBox" readonly>${esc(cur.v)}</textarea>
    <div class="copy-row">
      <button class="btn ghost" data-act="copyPrompt">この文章をコピー</button>
      <span class="tiny" style="align-self:center">この1本をAIに貼って、結果を確認してから次へ進んでください。</span>
    </div>
    ${state.tab===1?`<p class="tiny" style="margin-top:10px">ドット絵テイストをONにすると、16×16ドット相当・5色パレットの指定に切り替わります。ピコ太郎は「黄色・ヒョウ柄・サングラス・角刈り」の記号として描かれます。</p>`:''}
  </div>

  <div class="note">
    <strong>AIが別のゲームを提案してきたら、その部分は捨ててください。</strong>
    4本すべてに「ジャンル・操作・勝敗を変えるな」という拘束を入れてあります。それでも変えてきたら、その出力は使わず、もう一度貼り直すのが早いです。
  </div>
  ${state.tab===3?`<div class="note" style="margin-top:10px">
    <strong>④の使い方：</strong>出てきた手順書を見ながら、<b>Godotのエディタ操作は学生自身が行い、スクリプトだけAIのものを貼ります</b>。まず③のWeb版で遊べる形を作り、提出後に余裕がある人だけ④へ。Web版より手間はかかりますが、「Unity/Godotで作りました」というポートフォリオになります。
  </div>`:''}

  <div class="nav">
    <button class="btn ghost" data-act="back">← 案に戻る</button>
    <span class="grow"></span>
    <button class="btn yellow" data-act="toUnity">Unity制作パッケージへ <span class="k">→</span></button>
  </div>`;
}

function reqTag(r){ return `<span class="req ${r==='必須'?'must':r==='推奨'?'rec':''}">${r}</span>`; }

function screenUnity(){
  const prop = currentProposal();
  const eng = PK.ENGINES[prop.engine];
  const firstP = PK.PREFABS[prop.first.prefab];

  const m = PK.gen.managementProposal(state, prop);
  const ch = m.chain, cons = m.cons;
  const okMark = (v)=> v==='○'?'<span class="ok-y">○</span>':v==='△'?'<span class="ok-m">△</span>':'<span class="ok-n">×</span>';
  const proposalHtml = `
  <div class="prop-doc" id="sec0">
    <div class="pd-head">
      <div class="pd-to">${esc(m.to)}</div>
      <div class="pd-meta"><span>${esc(m.from)}</span><span>${esc(m.date||'')}</span></div>
      <div class="pd-title">${esc(m.title)}</div>
      <div class="pd-sub">ゲーム企画提案 / デザイン思考による立案</div>
      <div class="pd-chainbox">
        <div class="pc-row"><span class="pc-k">TARGET</span><span class="pc-v">${esc(ch.want)}<i>（${esc(ch.aud)}）</i></span></div>
        <div class="pc-arrow">↓</div>
        <div class="pc-row"><span class="pc-k">IP</span><span class="pc-v">${esc(ch.focus)}</span></div>
        <div class="pc-arrow">↓</div>
        <div class="pc-row"><span class="pc-k">PLAY</span><span class="pc-v">${esc(ch.verb)}という遊びで、${esc(ch.feel)}を感じる</span></div>
        <div class="pc-arrow">↓</div>
        <div class="pc-row"><span class="pc-k">PERCEPTION</span><span class="pc-v">「ピコ太郎は${esc(ch.perception)}」と認知される</span></div>
      </div>
    </div>

    <div class="pd-sec">
      <div class="pd-num">01</div>
      <div class="pd-body">
        <h3>共感 — ピコ太郎の活動から、何が起きているか</h3>
        <p class="small">推測ではなく、活動の事実を根拠にしています。本企画が参照した点は以下のとおりです。</p>
        <table class="tbl">
          <tr><th style="width:52px">年</th><th style="width:180px">出来事</th><th>内容</th></tr>
          ${m.empathize.facts.map(f=>`<tr><td class="num">${esc(f.y)}</td><td><b>${esc(f.title)}</b></td><td>${esc(f.fact)} <a class="pd-src" href="${esc(f.src)}" target="_blank" rel="noopener">出典</a></td></tr>`).join('')}
        </table>
        <h3>ここから読み取ったこと</h3>
        <ul class="pd-ins">${m.empathize.insights.map(i=>`<li><b>${esc(i.title)}</b> — ${esc(i.text)}</li>`).join('')}</ul>
        ${m.whyPico?`<div class="pd-quote" style="margin-top:12px"><span class="tiny">第3回でグループが書いた「なぜピコ太郎なのか」</span><br>${esc(m.whyPico)}</div>`:''}
      </div>
    </div>

    <div class="pd-sec">
      <div class="pd-num">02</div>
      <div class="pd-body">
        <h3>定義 — 誰の、どんな状況を解くのか</h3>
        <div class="pd-pov">${esc(m.define.pov)}</div>
        <table class="tbl" style="margin-top:12px">
          <tr><th style="width:130px">ターゲット</th><td><b>${esc(ch.want)}</b>（${esc(ch.aud)}）</td></tr>
          <tr><th>感じてほしいこと</th><td>${esc(ch.feel)}</td></tr>
          <tr><th>中心にある行為</th><td>${esc(ch.verb)}</td></tr>
          <tr><th>認知ゴール</th><td>「ピコ太郎は<b>${esc(ch.perception)}</b>」</td></tr>
        </table>
      </div>
    </div>

    <div class="pd-sec">
      <div class="pd-num">03</div>
      <div class="pd-body">
        <h3>発想 — なぜこの遊びにしたか</h3>
        ${m.ideate.map((x,i)=>`<p><span class="pd-i">${i+1}</span>${x}</p>`).join('')}
        <div class="pd-quote">${esc(prop.oneline)}</div>
        <div class="pd-twist">
          <div class="pt-k">刺激の1手 / ONE TWIST</div>
          <div class="pt-n">${esc(prop.twist.name)}</div>
          <p>${esc(prop.twist.one)}。${esc(prop.twist.what)}</p>
          <p class="tiny">狙い：${esc(prop.twist.effect)}　｜　採用理由：${esc(prop.twist.why)}</p>
        </div>
      </div>
    </div>

    <div class="pd-sec">
      <div class="pd-num">04</div>
      <div class="pd-body">
        <h3>整合 — 決めたDNAと、この案は合っているか</h3>
        <p class="small">DNAシートで申告した内容と、実際に出来上がるゲームを突き合わせた結果です。<b>×がある状態で提出しないでください。</b></p>
        <table class="tbl">
          <tr><th style="width:120px">DNA</th><th style="width:210px">申告した内容</th><th>ゲームでの実装</th><th style="width:44px">判定</th></tr>
          ${cons.rows.map(r=>`<tr><td><b>${esc(r.k)}</b></td><td>${esc(r.dna)}</td><td>${esc(r.game)}</td><td style="text-align:center">${okMark(r.ok)}</td></tr>`).join('')}
        </table>
        <div class="pd-score ${cons.ok?'good':'warn'}">
          整合度 <b>${Math.round(cons.score*100)}%</b>　
          ${cons.ok?'DNAと案は一致しています。':(cons.bad.length?`要修正：${cons.bad.map(b=>b.k).join('・')}が案に効いていません。`:'一部が薄い状態です。')}
        </div>
      </div>
    </div>

    <div class="pd-sec">
      <div class="pd-num">05</div>
      <div class="pd-body">
        <h3>試作 — 今回お見せするもの</h3>
        <table class="tbl">
          <tr><th style="width:140px">プレイ時間</th><td class="num">${prop.duration}秒</td></tr>
          <tr><th>操作</th><td>${esc(prop.input)}</td></tr>
          <tr><th>成功</th><td>${esc(prop.success)}</td></tr>
          <tr><th>失敗</th><td>${esc(prop.fail)}</td></tr>
          <tr><th>画面</th><td>${prop.screens.map(esc).join(' → ')}</td></tr>
          <tr><th>制作</th><td>${esc(prop.dims)}／授業内で試作可能な規模</td></tr>
        </table>
      </div>
    </div>

    <div class="pd-sec">
      <div class="pd-num">06</div>
      <div class="pd-body">
        <h3>検証 — どう確かめるか</h3>
        <p>${esc(m.test.method)}（被験者 ${m.test.n} 名）</p>
        <table class="tbl">
          <tr><th style="width:140px">観察する点</th><td>${m.test.observe.map(esc).join('／')}</td></tr>
          <tr><th>判断の基準</th><td>${m.test.kpi.map(esc).join('／')}</td></tr>
        </table>
      </div>
    </div>

    <div class="pd-sec">
      <div class="pd-num">07</div>
      <div class="pd-body">
        <h3>マネジメント観点</h3>
        <table class="tbl">
          <tr><th style="width:110px">ブランド</th><td>${m.manage.brand}</td></tr>
          <tr><th>リスク</th><td>${esc(m.manage.risk)}</td></tr>
          <tr><th>展開</th><td>${esc(m.manage.extend)}</td></tr>
          <tr><th>資産性</th><td>${esc(m.manage.asset)}</td></tr>
        </table>
      </div>
    </div>

    <div class="pd-sec">
      <div class="pd-num">08</div>
      <div class="pd-body">
        <h3>次の一歩</h3>
        <p>${esc(m.next)}</p>
        <div class="note"><strong>発表で使う1文：</strong>「${esc(ch.want)}に向けて、ピコ太郎の${esc(ch.focus)}を${esc(ch.verb)}という遊びに変え、${esc(ch.perception)}と認知されることを狙いました。」</div>
      </div>
    </div>
  </div>`;

  const prefabRows = prop.prefabs.map(p=>`
    <tr><td><b>${esc(p.name)}</b></td><td>${esc(p.fn)}</td><td>${reqTag(p.req)}</td><td class="num">${p.level}</td><td class="num">${p.min}分</td></tr>`).join('');

  const assetRows = prop.assets.map(a=>`
    <tr><td><span class="tiny">${esc(a.role)}</span></td><td><b>${esc(a.name)}</b></td><td class="num">${esc(a.size)}</td><td>${esc(a.fake)}</td><td><span class="req">${esc(a.pri)}</span></td></tr>`).join('');

  const guideHtml = prop.guide.map((g,i)=>`
    <li>
      <h4>${esc(g.h)}</h4>
      <p class="gwork">${esc(g.w)}</p>
      <p class="gmeta"><span><b>完了：</b>${esc(g.d)}</span><span><b>確認：</b>${esc(g.c)}</span><span><b>目安：</b>${g.m}分</span><span><b>使う：</b>${esc(g.p)}</span></p>
      <div class="gtrap">つまずき：${esc(g.t)}</div>
    </li>`).join('');

  const nums = eng.tuning.map(t=>`<tr><td class="num">${esc(t[0])}</td><td class="num">${esc(t[1])}</td><td>${esc(t[2])}</td><td>${esc(t[3])}</td></tr>`).join('');

  const comps = eng.comps.map(c=>`<tr><td><b>${esc(c[0])}</b></td><td class="num">${esc(c[1])}</td><td>${esc(c[2])}</td><td>${esc(c[3])}</td></tr>`).join('');

  const uiRows = prop.ui.map(u=>`<tr><td><b>${esc(u.label)}</b></td><td>${esc(u.pos)}</td><td>${esc(u.why)}</td><td>${reqTag(u.req)}</td></tr>`).join('');

  const seRows = prop.se.map(s=>`<tr><td><b>${esc(s.label)}</b></td><td class="num">${esc(s.file||'')}</td><td>${esc(s.when)}</td><td>${esc(s.tone)}</td><td class="num">${esc(s.len||'')}</td></tr>`).join('');
  const b = prop.bgmSpec;
  const bgmHtml = `
      <table class="tbl">
        <tr><th style="width:120px">項目</th><th>内容</th></tr>
        <tr><td>テンポ</td><td class="num">${b.bpm} BPM</td></tr>
        <tr><td>キー</td><td class="num">${esc(b.key)}</td></tr>
        <tr><td>ムード</td><td>${esc(b.mood)}（選んだ感情：${esc(b.tone)}）</td></tr>
        <tr><td>楽器</td><td>${esc(b.instr)}</td></tr>
        <tr><td>長さ</td><td class="num">${b.loop}秒（ループ）</td></tr>
        <tr><td>音量</td><td class="num">-14dB（SEより必ず小さく）</td></tr>
        <tr><td>なしでも成立するか</td><td>${esc(prop.bgm)}</td></tr>
      </table>
      <div class="note" style="margin-top:12px">
        <strong>音源の用意のしかた（上から順に試す）</strong><br>
        ① <b>フリー素材</b>：BPMとキーが近いループを1本だけ選ぶ。曲を探し始めると1日溶けるので、10分で決める。<br>
        ② <b>AIで作る</b>：下の「BGM生成プロンプト」を音楽生成AIに貼る。<br>
        ③ <b>自分で作る</b>：GarageBand等で4小節ループを2つ（A/B）作り、交互に鳴らすだけで足りる。
      </div>
      <h3>BGM生成プロンプト（コピーして使う）</h3>
      <pre class="out" id="bgmOut">${esc(PK.gen.bgmPrompt(prop))}</pre>
      <div class="copy-row"><button class="btn ghost" data-act="copyBgm">BGMプロンプトをコピー</button></div>`;

  const juiceRows = prop.juice.map(j=>`
    <tr><td><b>${esc(j.name)}</b></td><td>${esc(j.when)}</td><td>${esc(j.how)}</td><td>${esc(j.tune)}</td></tr>`).join('');

  return `
  ${proposalHtml}

  <div class="pkg-head">
    <div>
      <div class="eyebrow">STEP 10 — UNITY PACKAGE</div>
      <h1>Unityで作るための、<br>4点セット。</h1>
    </div>
    <div class="pkg-tools">
      <button class="btn ghost" data-act="copyForms">提出用テキストをコピー</button>
      <button class="btn ghost" data-act="print">印刷 / PDF</button>
    </div>
  </div>
  <p class="lead">${esc(prop.title)} を、${prop.duration}秒のゲームとして作ります。上から順に読めば、手が止まりません。</p>
  <div class="jump"><a href="#secA">A 最初に作るもの</a><a href="#secB">B 仕様</a><a href="#secC">C 構成要素</a><a href="#secD">D 素材</a><a href="#secE">E UI・SE・BGM</a><a href="#secF">F Prefab</a><a href="#secG2">G 刺激の1手</a><a href="#secH">H 演出</a><a href="#secI">I 手引き</a><a href="#secJ">J 提出用</a></div>

  <div class="sec" id="secA">
    <div class="sec-h"><span class="sn">A</span><span class="st">最初に作るもの</span></div>
    <div class="sec-b">
      <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:8px">
        <span class="mono" style="font-size:22px;font-weight:600">${esc(prop.first.prefab)}</span>
        <span class="req must">必須</span>
        <span class="tiny">${firstP?`${esc(firstP.fn)}／目安 ${firstP.min}分` : ''}</span>
      </div>
      <p style="font-size:15px;margin-bottom:10px">${esc(prop.first.why)}</p>
      <div class="note" style="margin:0">
        最初の3手順：<b>①動く</b>（キーで動く）→ <b>②判定が返る</b>（1回当たったらログが出る）→ <b>③ループになる</b>（出る→当たる→点が入る→終わる→もう一回）。
        この3つが繋がれば、残りは足し算です。
      </div>
    </div>
  </div>

  <div class="sec" id="secB">
    <div class="sec-h"><span class="sn">B</span><span class="st">ゲーム仕様ミニマム版</span><span class="sd">そのままフォームに転記できます</span></div>
    <div class="sec-b">
      <table class="tbl">
        <tr><th style="width:150px">項目</th><th>内容</th></tr>
        <tr><td>プレイヤーがすること</td><td>${esc(prop.action)}</td></tr>
        <tr><td>操作方法</td><td>${esc(prop.input)}（PCはキーボード／スマホはタップ）</td></tr>
        <tr><td>成功条件</td><td><b>${esc(prop.success)}</b></td></tr>
        <tr><td>失敗条件</td><td><b>${esc(prop.fail)}</b></td></tr>
        <tr><td>1プレイ時間</td><td class="num">${prop.duration}秒</td></tr>
        <tr><td>必要な画面</td><td>${prop.screens.map(esc).join(' → ')}</td></tr>
      </table>
      <h3>画面の流れ</h3>
      <pre class="flow">タイトル（START）
   ↓
インゲーム（${esc(prop.input)}／${prop.duration}秒）
   ↓  成功：${esc(prop.success)}
   ↓  失敗：${esc(prop.fail)}
リザルト（RESULT／RETRY）
   ↓
タイトルへ戻る</pre>
      <h3>数値パラメータ（まずこの値で作る）</h3>
      <table class="tbl">
        <tr><th style="width:170px">変数</th><th style="width:80px">初期値</th><th>意味</th><th>触ると変わること</th></tr>
        ${nums}
      </table>
      <h3>完成の判定（5つ）</h3>
      <ul class="milestone">
        <li>タイトルから始まる</li>
        <li>操作できる</li>
        <li>成功・失敗が判定される</li>
        <li>結果が出る</li>
        <li>もう一回できる</li>
      </ul>
    </div>
  </div>

  <div class="sec" id="secC">
    <div class="sec-h"><span class="sn">C</span><span class="st">構成要素</span><span class="sd">${esc(eng.name)}</span></div>
    <div class="sec-b">
      <h3 style="margin-top:0">シーン階層</h3>
      <pre class="tree">${esc(eng.scene)}</pre>
      <h3>コンポーネント</h3>
      <table class="tbl">
        <tr><th style="width:120px">オブジェクト</th><th style="width:150px">コンポーネント</th><th>設定</th><th style="width:100px">役割</th></tr>
        ${comps}
      </table>
      <h3>データの流れ</h3>
      <pre class="flow">${esc(eng.flow)}</pre>
    </div>
  </div>

  <div class="sec" id="secD">
    <div class="sec-h"><span class="sn">D</span><span class="st">必要素材</span><span class="sd">仮素材で最後まで作れます</span></div>
    <div class="sec-b">
      <table class="tbl">
        <tr><th style="width:80px">役割</th><th style="width:170px">名称</th><th style="width:110px">サイズ</th><th>仮素材の作り方</th><th style="width:60px">優先</th></tr>
        ${assetRows}
      </table>
      <p class="tiny" style="margin-top:10px">命名は snake_case。インポート設定は Pixels Per Unit = 100、Filter Mode = Bilinear、Compression = None。仮素材のまま完成させてから差し替えてください。</p>
      <p class="small" style="margin-top:6px">エフェクト用の素材は、コードで描く（ParticleSystem＋図形）か、白い円と星を1枚ずつ作れば足ります。画像を探す必要はありません。</p>
    </div>
  </div>

  <div class="sec" id="secE">
    <div class="sec-h"><span class="sn">E</span><span class="st">UI・SE・BGM</span><span class="sd">音は「探さない・作りすぎない」</span></div>
    <div class="sec-b">
      <h3 style="margin-top:0">UI</h3>
      <table class="tbl">
        <tr><th style="width:130px">UI</th><th style="width:110px">位置</th><th>役割</th><th style="width:70px">必須</th></tr>
        ${uiRows}
      </table>
      <h3>SE（効果音）— 6本そろえれば完成</h3>
      <table class="tbl">
        <tr><th style="width:110px">SE</th><th style="width:130px">ファイル名</th><th>鳴るタイミング</th><th style="width:170px">音の方向</th><th style="width:60px">長さ</th></tr>
        ${seRows}
      </table>
      <p class="tiny" style="margin-top:8px">配置は Assets/Audio/SE/。AudioSource は1つを使い回し、PlayOneShot で鳴らす（同時に鳴らすと割れるので音量を下げる）。SEは「操作・成功・失敗・得点・開始・終了」の6種で足ります。</p>
      <h3>BGM</h3>
      ${bgmHtml}
    </div>
  </div>

  <div class="sec" id="secF">
    <div class="sec-h"><span class="sn">F</span><span class="st">必要なPrefab / 機能</span><span class="sd">必須だけ作れば完成します</span></div>
    <div class="sec-b">
      <table class="tbl">
        <tr><th style="width:180px">Prefab</th><th>機能</th><th style="width:70px">必要度</th><th style="width:60px">難易度</th><th style="width:70px">目安</th></tr>
        ${prefabRows}
      </table>
      <p class="tiny" style="margin-top:10px">「推奨」は余裕があれば。「任意」は今回作らなくても完成します。</p>
    </div>
  </div>

  <div class="sec" id="secG2">
    <div class="sec-h"><span class="sn">G</span><span class="st">刺激の1手</span><span class="sd">これが入るかどうかで、遊びの深さが変わる</span></div>
    <div class="sec-b">
      <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:8px">
        <span style="font-size:19px;font-weight:700">${esc(prop.twist.name)}</span>
        <span class="req must">${esc(prop.twist.type==='obstacle'?'お邪魔':prop.twist.type==='limit'?'しばり':prop.twist.type==='dual'?'○○しながら':prop.twist.type==='reverse'?'逆転':'焦らし')}</span>
        <span class="tiny">${esc(prop.twist.why)}</span>
      </div>
      <p style="font-size:14.5px;margin-bottom:10px">${esc(prop.twist.one)}。${esc(prop.twist.what)}</p>
      <table class="tbl">
        <tr><th style="width:110px">実装</th><td>${esc(prop.twist.how)}</td></tr>
        <tr><th>調整</th><td>${esc(prop.twist.tune)}</td></tr>
        <tr><th>狙い</th><td>${esc(prop.twist.effect)}</td></tr>
      </table>
      <div class="note" style="margin-top:12px">
        <strong>1つだけ、が原則。</strong>2つ以上足すと、学生自身がルールを説明できなくなります。
        まずはこの1手を入れて遊べる状態にして、時間が余ったら次を考える。順番を逆にしないこと。
      </div>
    </div>
  </div>

  <div class="sec" id="secH">
    <div class="sec-h"><span class="sn">H</span><span class="st">演出（ジュース）</span><span class="sd">ここで差がつく。3つ入れるだけで別物になる</span></div>
    <div class="sec-b">
      <p class="small" style="margin-top:0">同じルールでも、当たった瞬間に「止まる・揺れる・光る」があるだけで、遊んだ感じが変わります。上から3つを必ず入れてください。数値はそのまま使って構いません。</p>
      <table class="tbl">
        <tr><th style="width:120px">演出</th><th style="width:170px">いつ</th><th>どうやるか</th><th style="width:180px">調整の勘所</th></tr>
        ${juiceRows}
      </table>
      <h3>優先順位（時間がない人向け）</h3>
      <pre class="flow">1. ${esc(prop.juice[0]?prop.juice[0].name:'')}　← これだけで「当たった感」が出る
2. ${esc(prop.juice[1]?prop.juice[1].name:'')}
3. ${esc(prop.juice[2]?prop.juice[2].name:'')}
（残りは余裕があれば。全部入れようとして完成しないのが一番もったいない）</pre>
      <div class="note" style="margin-top:12px">
        <strong>「溜め」の作り方：</strong>いきなり物を出さず、0.2秒だけ予兆を見せます（影が落ちる／キャラが縮む／音が一瞬消える）。<b>溜め → 発生 → ヒットストップ → 粒子</b>の4拍子で、同じ1回の当たりが3倍気持ちよくなります。
      </div>
    </div>
  </div>

  <div class="sec" id="secI">
    <div class="sec-h"><span class="sn">I</span><span class="st">制作手引き</span><span class="sd">上から順に。1ステップ終わるごとに保存</span></div>
    <div class="sec-b">
      <ul class="guide">${guideHtml}</ul>
      <div class="note" style="margin-top:14px">
        <strong>30分マイルストーン：</strong>①箱が動く ②物が落ちる ③当たると消える ④点が入る ⑤終わって戻る。
        ③まで来れば、ゲームとして成立しています。ここで一度ビルドして、友だちに触ってもらってください。
      </div>
      <h3>実装の順番（並行して作ると詰まります）</h3>
      <pre class="flow">${prop.prefabs.filter(p=>p.req==='必須').map(p=>p.name).join(' → ')}</pre>
    </div>
  </div>

  <div class="sec" id="secJ">
    <div class="sec-h"><span class="sn">J</span><span class="st">提出用テキスト</span><span class="sd">MS Forms にそのまま貼れます</span></div>
    <div class="sec-b">
      <pre class="out" id="formsOut">${esc(PK.gen.formsText(prop))}</pre>
      <div class="copy-row"><button class="btn" data-act="copyForms">コピー</button></div>
    </div>
  </div>

  <div class="nav">
    <button class="btn ghost" data-act="back">← プロンプトに戻る</button>
    <span class="grow"></span>
    <button class="btn ghost" data-act="restart">別の企画をつくる</button>
  </div>`;
}

/* ---------- 描画 ---------- */
function render(){
  const map = {
    intro:screenIntro, d0:screenDNA, d1:screenAudience, d2:screenIps, d3:screenEmos,
    d4:screenVerbs, ch:screenChallenge, ty:screenTypes, cf:screenConfirm,
    cs:screenProposal, pr:screenPrompts, un:screenUnity
  };
  const fn = map[state.step] || screenIntro;
  app.innerHTML = fn();
  renderRail(); renderTape(); save();
  $('#sessionCode').textContent = sessionCode();
  window.scrollTo({top:0,behavior:'instant'});
  const dot = $('#dotToggle');
  if(dot) dot.addEventListener('change', e=>{ state.dot = e.target.checked; render(); });
}
function go(step){
  state.step = step; render();
}
function nextStep(){
  const i = STEPS.findIndex(s=>s.id===state.step);
  if(i>=0 && i<STEPS.length-1) go(STEPS[i+1].id);
}
function prevStep(){
  const i = STEPS.findIndex(s=>s.id===state.step);
  if(i>0) go(STEPS[i-1].id);
}

/* ---------- イベント ---------- */
document.addEventListener('click', (e)=>{
  const b = e.target.closest('[data-act]');
  if(!b) return;
  const act = b.dataset.act, val = b.dataset.val;
  switch(act){
    case 'start': go('d0'); break;
    case 'next': if(canNext()) nextStep(); break;
    case 'back': prevStep(); break;
    case 'aud': state.audience = val; state.idx=0; state.patch=null; render(); break;
    case 'ip': {
      const i = state.ips.indexOf(val);
      if(i>=0) state.ips.splice(i,1);
      else state.ips.push(val);
      state.idx=0; state.patch=null; state._sug=false; render(); break;
    }
    case 'emo': {
      const i = state.emos.indexOf(val);
      if(i>=0) state.emos.splice(i,1);
      else state.emos.push(val);
      state.idx=0; state.patch=null; render(); break;
    }
    case 'verb': {
      const i = state.verbs.indexOf(val);
      if(i>=0) state.verbs.splice(i,1);
      else if(state.verbs.length<3) state.verbs.push(val);
      state.idx=0; state.patch=null; render(); break;
    }
    case 'suggest': state._sug = true; render(); break;
    case 'type': {
      const i = state.types.indexOf(val);
      if(i>=0) state.types.splice(i,1);
      else state.types.push(val);
      state.idx=0; state.patch=null; render(); break;
    }
    case 'why': state.whyPico = (state.whyPico===val? null : val); state.idx=0; render(); break;
    case 'want': state.wantTo = (state.wantTo===val? null : val); state.idx=0; render(); break;
    case 'perc': state.perception = (state.perception===val? null : val); state.idx=0; render(); break;
    case 'dim': state.dim = val; state.idx=0; render(); break;
    case 'skill': {
      const i = state.skills.indexOf(val);
      if(i>=0) state.skills.splice(i,1); else state.skills.push(val);
      render(); break;
    }
    case 'chal': {
      const i = state.challenges.indexOf(val);
      if(i>=0) state.challenges.splice(i,1);
      else if(state.challenges.length<2) state.challenges.push(val);
      state.idx=0; render(); break;
    }
    case 'exp': state.exp = val; state.idx=0; render(); break;
    case 'make': state.idx=0; state.patch=null; go('cs'); break;
    case 'alt': {
      const r = rankedList();
      state.idx = (state.idx + 1) % r.length;
      state.patch = null; render(); break;
    }
    case 'pick': state.idx = Number(val); state.patch=null; render(); break;
    case 'patch': state.patch = val; render(); break;
    case 'redo': go('d2'); break;
    case 'backTop': go('d0'); break;
    case 'toPrompts': go('pr'); break;
    case 'toUnity': go('un'); break;
    case 'tab': state.tab = Number(val); render(); break;
    case 'copyPrompt': copy($('#promptBox').value); break;
    case 'copyForms': copy(PK.gen.formsText(currentProposal())); break;
    case 'copyBgm': copy(PK.gen.bgmPrompt(currentProposal())); break;
    case 'print': window.print(); break;
    case 'restart':
      if(confirm('最初からやり直します。いまの選択は消えます。')){
        state = {step:'intro',audience:null,ips:[],emos:[],verbs:[],types:[],exp:'some',dim:null,skills:[],challenges:[],mentor:'',whyPico:'',whyFree:'',wantTo:null,perception:null,idx:0,patch:null,dot:false,tab:0,title:''};
        location.hash=''; render();
      }
      break;
  }
});

document.addEventListener('input', (e)=>{
  if(e.target.id==='mentor'){ state.mentor = e.target.value; save(); }
  if(e.target.id==='whyfree'){ state.whyFree = e.target.value; save(); }
});
$('#btnPrint').addEventListener('click', ()=>window.print());
$('#btnRestart').addEventListener('click', ()=>{
  if(confirm('最初からやり直します。いまの選択は消えます。')){
    state = {step:'intro',audience:null,ips:[],emos:[],verbs:[],types:[],exp:'some',dim:null,skills:[],challenges:[],mentor:'',whyPico:'',whyFree:'',wantTo:null,perception:null,idx:0,patch:null,dot:false,tab:0,title:''};
    location.hash=''; render();
  }
});
$('#sessionChip').addEventListener('click', ()=>{
  const url = location.origin + location.pathname + '#p=' + encodeState();
  copy(url).then?.(()=>{});
  toast('この企画のURLをコピーしました（別の端末で開けます）');
});

load();

/* デモ用（スクリーンショット・教員の見本提示に使用）: ?demo=s7 など */
(function(){
  const q = new URLSearchParams(location.search).get('demo');
  const d = window.PK_DEMO || (q ? {step:q} : null);
  if(d){
    state = Object.assign({}, state, {
      audience:'aud_teen',
      ips:['ip_combine','ip_rhythm','vis_leopard'],
      emos:['emo_comfort','emo_retry'],
      verb:'v_sort', types:['t_sort','t_lr'], exp:'some',
      idx:0, patch:null, dot:false, tab:0
    }, d);
  }
})();

(async function boot(){
  try{ await PK.db.load(); }catch(e){ console.warn(e); }
  render();
})();
})();
