/* =========================================================
   PK//PROTO v2 — 画面
   4問（好きなゲーム / ジャンル / ピコ太郎の乗せ方 / 経験）で
   「面白そう」な案に着地し、コンセプトは後から付く。
   ========================================================= */
(function(){
'use strict';

const $ = s => document.querySelector(s);
const app = $('#app');
const railEl = $('#rail');
const toastEl = $('#toast');
const KEY = 'pkproto.v2';

const STEPS = [
  {id:'intro',  n:'00', t:'はじめる'},
  {id:'games',  n:'01', t:'好きなゲーム'},
  {id:'genre',  n:'02', t:'ジャンル'},
  {id:'hook',   n:'03', t:'ピコ太郎'},
  {id:'exp',    n:'04', t:'経験と目的'},
  {id:'result', n:'05', t:'ゲーム案'},
  {id:'out',    n:'06', t:'出力'}
];

let state = {
  step:'intro',
  games:[], genre:null, hook:null, twist:null,
  exp:'some', goal:'both', tab:'plan',
  check:{a:false,b:false,c:false}
};

/* ---------------- 永続化 ---------------- */
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }
function load(){
  try{
    const raw = localStorage.getItem(KEY);
    if(raw){ const o = JSON.parse(raw); if(o && o.step) state = Object.assign(state, o); }
  }catch(e){}
  if(state.step==='result' || state.step==='out'){ if(!state.genre) state.step='intro'; }
}

/* ---------------- 小道具 ---------------- */
const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const gName = id => (PK2.GAMES.find(g=>g.id===id)||{}).name || '';
const genreOf = id => PK2.GENRES.find(g=>g.id===id);
const hookOf = id => PK2.HOOKS.find(h=>h.id===id);
const stars = n => '★'.repeat(n) + '☆'.repeat(Math.max(0,3-n));

function toast(msg){
  if(!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>toastEl.classList.remove('on'), 1800);
}

function copyText(text, btn){
  const done = ()=>{
    toast('コピーしました');
    if(btn){ const t=btn.textContent; btn.textContent='コピー済み'; setTimeout(()=>btn.textContent=t, 1400); }
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(done).catch(()=>fallback(text, done));
  }else{
    fallback(text, done);
  }
  function fallback(txt, cb){
    const ta = document.createElement('textarea');
    ta.value = txt; ta.style.position='fixed'; ta.style.left='-9999px';
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); cb(); }catch(e){ toast('コピーできませんでした'); }
    document.body.removeChild(ta);
  }
}

/* ---------------- 現在の案 ---------------- */
function currentPlan(){
  if(!state.genre) return null;
  return PK2.plan.buildPlan(state);
}

/* ---------------- レール ---------------- */
function renderRail(){
  const idx = STEPS.findIndex(s=>s.id===state.step);
  railEl.innerHTML = STEPS.map((s,i)=>{
    const locked = (s.id==='result'||s.id==='out') && !state.genre;
    const cls = ['', s.id===state.step?'on':'', i<idx?'done':''].join(' ').trim();
    return `<button type="button" class="${cls}" data-go="${s.id}" ${locked?'disabled':''}>
      <span class="n">${s.n}</span><span>${esc(s.t)}</span></button>`;
  }).join('');
}

/* ---------------- 描画 ---------------- */
const R = {};

/* 00 intro */
R.intro = () => `
<section class="card">
  <div class="eyebrow">STEP 00 / はじめる</div>
  <h2 class="step">好きなゲームに、ピコ太郎を乗せる。</h2>
  <p class="lead">このツールは、企画コンセプトを先に考えません。順番が逆です。</p>
  <div class="hero-line">
    まず<b>自分が好きなジャンル</b>を選ぶ。そこに<b>ピコ太郎を1か所だけ乗せる</b>。
    先に「面白そう」を作って、意味は<b>あとから付ける</b>。
  </div>
  <div class="flow">
    <div class="flow-item"><div class="fn">01</div><b>好きなゲーム</b><span>直近の話題作から最大3本。18〜20歳に人気のものが並びます。</span></div>
    <div class="flow-item"><div class="fn">02</div><b>ジャンル</b><span>1分で面白いと分かる型だけ。RPGとシミュレーションは外しています。</span></div>
    <div class="flow-item"><div class="fn">03</div><b>ピコ太郎の乗せ方</b><span>見た目ではなく、ルールに1か所だけ入れます。</span></div>
    <div class="flow-item"><div class="fn">04</div><b>案と6つの出力</b><span>企画書・画像・素材・Webプロト・Unity・提案書。</span></div>
  </div>
  <div class="block">
    <h3>この作り方をする理由</h3>
    <p class="why">「ピコ太郎とは何か」を先に考えると、そこで疲れて手が止まります。
    先に遊びを作れば、意味は後から必ず説明できます。実際、世の中のゲームの多くは遊びが先にあります。</p>
  </div>
  <div class="actions">
    <button class="btn yellow" data-go="games">はじめる（3分）</button>
  </div>
</section>`;

/* 01 games */
R.games = () => {
  const picked = state.games;
  const cats = [];
  PK2.GAMES.forEach(g=>{ if(cats.indexOf(g.cat)<0) cats.push(g.cat); });
  const groups = cats.map(c=>{
    const items = PK2.GAMES.filter(g=>g.cat===c);
    return `<div class="game-group"><h4>${esc(c)}</h4><div class="chips">
      ${items.map(g=>{
        const on = picked.indexOf(g.id)>=0;
        return `<button type="button" class="choice ${on?'on':''}" data-game="${g.id}">
          <span class="tick">${on ? String(picked.indexOf(g.id)+1) : '+'}</span>${esc(g.name)}</button>`;
      }).join('')}
    </div></div>`;
  }).join('');

  return `<section class="card">
    <div class="eyebrow">STEP 01 / 好きなゲーム</div>
    <h2 class="step">いつも遊んでいるゲームを選ぶ</h2>
    <p class="lead">最大3本。1本目が「いちばん好き」として扱われます。選んだ順に番号が付きます。</p>
    <div class="note">選択中 ${picked.length} / 3　${picked.length?'（1本目：'+esc(gName(picked[0]))+'）':''}</div>
    <div class="game-groups">${groups}</div>
    <div class="block">
      <h3>ここで選んだものが、どう効くか</h3>
      <p class="why">好きなゲームの系統から、次のジャンルの候補が変わります。ゲームを選ばなくても先に進めます。</p>
    </div>
    <div class="actions">
      <button class="btn sub" data-go="intro">戻る</button>
      <button class="btn" data-go="genre">次へ（ジャンル）</button>
      ${picked.length?'<button class="btn sub sm" data-reset="games">選択をクリア</button>':''}
    </div>
  </section>`;
};

/* 02 genre */
R.genre = () => {
  const recs = PK2.plan.recommendGenres(state.games, state.exp);
  const pick = PK2.plan.topPick(state.games, state.exp);
  const recTop = recs.slice(0,3).map(r=>r.genre.id);
  const recSet = new Set(recTop);
  const rest = PK2.GENRES.filter(g=>!recSet.has(g.id));

  const card = (g, rec)=>{
    const on = state.genre===g.id;
    return `<button type="button" class="choice col ${on?'on':''}" data-genre="${g.id}">
      <span class="c-head">
        ${rec?'<span class="rec">おすすめ</span>':''}
        <span class="lv">${stars(g.level)}</span>
        <b>${esc(g.label)}</b>
        ${on?'<span class="tick">✓</span>':''}
      </span>
      <span class="eg">例：${esc(g.eg||'')}</span>
    </button>`;
  };

  const pickedNote = state.games.length
    ? `好きなゲーム（${state.games.map(id=>esc(gName(id))).join('・')}）の傾向と、18〜20歳の友だちに「面白い」と言われやすいかで並べています。`
    : `ゲームを選ぶと、傾向に合ったものが上に出ます。選ばなくても、18〜20歳にウケやすい型から並びます。`;

  /* 強烈なおすすめ：考えずに乗れるように、1つだけ大きく出す */
  const hero = pick ? `<div class="pick">
    <div class="pick-lab">強烈におすすめ</div>
    <h3 class="pick-name">${esc(pick.genre.label)}</h3>
    <p class="pick-eg">例：${esc(pick.genre.eg||'')}</p>
    <ul class="pick-why">${pick.reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>
    <div class="pick-meta">
      <span class="badge">${esc(pick.genre.input)}</span>
      <span class="badge">${pick.genre.time}秒</span>
      <span class="badge">作りやすさ ${stars(pick.genre.level)}</span>
      ${pick.pop.hot?'<span class="badge hot">今年の学生人気</span>':''}
    </div>
    <div class="actions" style="margin-top:14px">
      <button class="btn yellow" data-pick="${pick.genre.id}">これで進む（おすすめ）</button>
    </div>
    <p class="note">まよったら、この1つで進めてください。あとから差し替えできます。</p>
  </div>` : '';

  return `<section class="card">
    <div class="eyebrow">STEP 02 / ジャンル</div>
    <h2 class="step">作りたいジャンルを選ぶ</h2>
    <p class="lead">1分以内で「面白い」が分かる型だけを並べています。RPGとシミュレーションは、1分では面白さが伝わりにくいので外しました。</p>
    <div class="note">${pickedNote}　★はUnityでの作りやすさ（★3が重め）。</div>

    ${hero}

    <div class="block">
      <h3>まぎらわしい2組（先に確認）</h3>
      <dl class="kv">
        <dt>射撃</dt><dd><b>競技</b>。アーチェリーや競技射撃のように、1本ずつ正確さを競います。</dd>
        <dt>射的</dt><dd><b>屋台の遊び</b>。景品を倒して、倒した数と高得点を競います。</dd>
        <dt>パズルアクション</dt><dd><b>消すのが主役</b>。ぷよぷよ・テトリス・ツムツム。盤面を消す気持ちよさ。</dd>
        <dt>アクションパズル</dt><dd><b>仕掛けを解くのが主役</b>。倉庫番・8番出口。消す遊びではありません。</dd>
      </dl>
    </div>

    ${recTop.length?`<div class="block"><h3>あなたの好きなゲームから</h3><div class="chips" style="flex-direction:column;align-items:stretch">
      ${recs.slice(0,3).map(r=>card(r.genre,true)).join('')}
    </div></div>`:''}

    <div class="block">
      <h3>ほかのジャンル（${rest.length}）</h3>
      <div class="chips" style="flex-direction:column;align-items:stretch">${rest.map(g=>card(g,false)).join('')}</div>
    </div>

    <div class="actions">
      <button class="btn sub" data-go="games">戻る</button>
      <button class="btn" data-go="hook" ${state.genre?'':'disabled'}>次へ（ピコ太郎の乗せ方）</button>
    </div>
  </section>`;
};

/* 03 hook */
R.hook = () => {
  const g = genreOf(state.genre);
  const recs = PK2.plan.recommendHooks(state.genre);
  const recSet = new Set(recs.slice(0,3).map(r=>r.hook.id));
  const ordered = recs.map(r=>r.hook);

  const card = (h, rec)=>{
    const on = state.hook===h.id;
    return `<button type="button" class="choice ${on?'on':''}" data-hook="${h.id}" style="flex-direction:column;align-items:flex-start;gap:2px">
      <span style="display:flex;gap:6px;align-items:center">
        ${rec?'<span class="rec">おすすめ</span>':''}
        <b style="font-size:.85rem">${esc(h.label)}</b>
      </span>
      <span style="font-size:.74rem;opacity:.85;text-align:left">${esc(h.one)}</span>
    </button>`;
  };

  return `<section class="card">
    <div class="eyebrow">STEP 03 / ピコ太郎の乗せ方</div>
    <h2 class="step">ピコ太郎をどこに乗せるか</h2>
    <p class="lead">選んだジャンル：<b>${g?esc(g.label):'—'}</b>。見た目を飾るのではなく、<b>ルールに1か所だけ</b>入れます。</p>
    <div class="block">
      <h3>このジャンルにおすすめ</h3>
      <div class="chips" style="flex-direction:column;align-items:stretch">
        ${ordered.filter(h=>recSet.has(h.id)).map(h=>card(h,true)).join('')}
      </div>
    </div>
    <div class="block">
      <h3>ほかの乗せ方</h3>
      <div class="chips" style="flex-direction:column;align-items:stretch">
        ${ordered.filter(h=>!recSet.has(h.id)).map(h=>card(h,false)).join('')}
      </div>
    </div>
    <div class="actions">
      <button class="btn sub" data-go="genre">戻る</button>
      <button class="btn" data-go="exp" ${state.hook?'':'disabled'}>次へ（経験と目的）</button>
    </div>
  </section>`;
};

/* 04 exp */
R.exp = () => {
  const expCards = PK2.EXP.map(e=>`
    <button type="button" class="choice ${state.exp===e.id?'on':''}" data-exp="${e.id}" style="flex-direction:column;align-items:flex-start;gap:2px">
      <b style="font-size:.85rem">${esc(e.label)}</b>
      <span style="font-size:.74rem;opacity:.8">${esc(e.note)}</span>
    </button>`).join('');
  const goalCards = PK2.GOALS.map(g=>`
    <button type="button" class="choice ${state.goal===g.id?'on':''}" data-goal="${g.id}" style="flex-direction:column;align-items:flex-start;gap:2px">
      <b style="font-size:.85rem">${esc(g.label)}</b>
      <span style="font-size:.74rem;opacity:.8">${esc(g.note)}</span>
    </button>`).join('');

  return `<section class="card">
    <div class="eyebrow">STEP 04 / 経験と目的（答えなくてOK）</div>
    <h2 class="step">作れる範囲を教えてください</h2>
    <p class="lead">ここは<b>参考程度</b>です。答えなくても先に進めます。このツールとUnityMCPで最後まで走り切る前提なので、深く考えないでください。</p>
    <div class="note">何も選ばなければ「少し触ったことがある」として扱います。選んだ内容は、案の★の重さと補足文にだけ効きます。</div>
    <div class="block">
      <h3>Unityの経験</h3>
      <div class="chips" style="flex-direction:column;align-items:stretch">${expCards}</div>
      <p class="note">わからなければ未選択のままで大丈夫です。</p>
    </div>
    <div class="block">
      <h3>今回のゴール</h3>
      <div class="chips" style="flex-direction:column;align-items:stretch">${goalCards}</div>
    </div>
    <div class="actions">
      <button class="btn sub" data-go="hook">戻る</button>
      <button class="btn yellow" data-go="result">ゲーム案を見る</button>
      <button class="btn sub sm" data-reset="exp">この設問を答えずに進む</button>
    </div>
  </section>`;
};

/* 05 result */
R.result = () => {
  const P = currentPlan();
  if(!P) return `<section class="card"><p>ジャンルを選んでください。</p>
    <div class="actions"><button class="btn" data-go="genre">ジャンルを選ぶ</button></div></section>`;

  const alts = PK2.plan.alternatives(state, 4);
  const caution = PK2.plan.caution(P);

  const twistChips = PK2.TWISTS.map(t=>`
    <button type="button" class="choice ${state.twist===t.id?'on':''}" data-twist="${t.id}">${esc(t.label)}</button>`).join('');
  const hookChips = PK2.HOOKS.map(h=>`
    <button type="button" class="choice ${state.hook===h.id?'on':''}" data-hook="${h.id}">${esc(h.label)}</button>`).join('');

  return `<section class="card">
    <div class="eyebrow">STEP 05 / ゲーム案</div>
    <div class="result-head">
      <div>
        <h2 class="title-big">${esc(P.title)}</h2>
        <div class="badges">
          <span class="badge key">${esc(P.genreLabel)}</span>
          <span class="badge">${esc(P.input)}</span>
          <span class="badge">${P.duration}秒</span>
          <span class="badge">${esc(P.hookLabel)}</span>
          <span class="badge">${stars(P.level)}</span>
        </div>
      </div>
    </div>

    <div class="pitch">${esc(P.pitch)}</div>

    <div class="grid2">
      <div class="block" style="margin-top:0">
        <h3>遊びかた（ルール）</h3>
        <dl class="kv">
          <dt>コアループ</dt><dd>${esc(P.loop)}</dd>
          <dt>操作</dt><dd>${esc(P.input)}</dd>
          <dt>画面</dt><dd>${esc(P.view)}</dd>
          <dt>成功</dt><dd>${esc(P.success)}</dd>
          <dt>失敗</dt><dd>${esc(P.fail)}</dd>
        </dl>
      </div>
      <div class="block" style="margin-top:0">
        <h3>ピコ太郎の乗せ方</h3>
        <p class="why"><b>${esc(P.hookLabel)}</b></p>
        <p class="why" style="margin-top:6px">${esc(P.impl)}</p>
      </div>
    </div>

    <div class="showcase">
      <div class="lab">他人に見せたくなる1コマ</div>
      <p>${esc(P.show)}</p>
    </div>

    <div class="block">
      <h3>面白さの芯：0秒の1手 → 山場 → もう一回</h3>
      <p class="why">ここが空だと、ルールは正しくても「動くだけ」で終わります。同じジャンルでも、この3つが違えば別のゲームになります。</p>
      <dl class="kv">
        <dt>0秒の1手</dt><dd>${esc(P.kick)}</dd>
        <dt>山場（1プレイ1回）</dt><dd>${esc(P.spike)}</dd>
        <dt>もう一回の理由</dt><dd>${esc(P.again)}</dd>
      </dl>
      ${P.music?`<p class="note"><b>このゲームの音楽：</b>${esc(P.music)}</p>`:''}
      <p class="note">起動して1回目の入力で、必ず何かが起きること。山場は1プレイ1回でよい（増やすと山場でなくなる）。失敗の理由が1行で分かると、もう一回を押したくなる。</p>
    </div>

    <div class="block">
      <h3>不条理：無理やん → でも惜しい</h3>
      <p class="why">この企画の笑いの芯は「真顔で、無理なことをやる」です。要求は無理に見せて、救いを1つだけ入れる。失敗しても惜しさで終わるようにします。</p>
      <dl class="kv">
        <dt>要求される無理</dt><dd>${esc(P.absurd.demand)}</dd>
        <dt>なぜ無理に見えるか</dt><dd>${esc(P.absurd.impossible)}</dd>
        <dt>でも、できそう（救い）</dt><dd>${esc(P.absurd.rescue)}</dd>
        <dt>合格の目安</dt><dd>${esc(P.absurd.rate)}</dd>
        <dt>笑いが起きる1コマ</dt><dd>${esc(P.absurd.laugh)}</dd>
      </dl>
      <p class="note">救いは1つだけにしてください。2つ以上入れると簡単になりすぎて、「無理やん」の面白さが消えます。理不尽（手も足も出ない）にすると、笑いではなく怒りになります。</p>
    </div>

    <div class="block">
      <h3>気持ちよさ（ジュース）：この5つを入れる</h3>
      <p class="why">動くだけでは、面白くならない。同じ1回の当たりを3倍気持ちよくする演出を、最初から5つ決めてあります。</p>
      <dl class="kv">
        ${P.juice.map(j=>`<dt>${esc(j.name)}</dt><dd>${esc(j.when)}：${esc(j.how)}</dd>`).join('')}
      </dl>
      <p class="note">${esc(P.juiceLine)}</p>
      <p class="note">この5つは、WEBプロト・Unity・企画書・提案書のすべてに同じ内容で入ります。とくに<b>つぶれ（スケールの誇張）</b>は、キャラの動きが一気に上手く見えるので外さないでください。</p>
    </div>

    <div class="block">
      <h3>刺激の1手：${esc(P.twistLabel)}</h3>
      <p class="why">${esc(P.twistOne)}</p>
      <p class="why" style="margin-top:6px">この一手が、単純な往復を「判断する遊び」に変えます。</p>
    </div>

    ${caution?`<div class="caution">${esc(caution)}</div>`:''}

    <div class="block">
      <h3>後付けコンセプト（あとから付いてくる）</h3>
      <p class="why">${esc(P.whyPico)}</p>
      <p class="why" style="margin-top:8px">${esc(P.whyShape)}</p>
      <p class="note">この文章は提案書にそのまま使えます。先に考える必要はありません。</p>
    </div>

    <div class="block">
      <h3>ウリになる3点</h3>
      <ul class="plain">${P.appeal.map(a=>`<li>${esc(a)}</li>`).join('')}</ul>
    </div>

    <div class="block">
      <h3>10秒テスト（自分で確かめる）</h3>
      <p class="note">3つとも当てはまれば、そのまま作って大丈夫です。</p>
      <div class="chips" style="flex-direction:column;align-items:stretch">
        ${[
          ['a','画面を見た瞬間、何をすればいいか分かる'],
          ['b','1つのコマ（スクショ）で、面白さが伝わる'],
          ['c','友だちに見せたら「何これ」と言われそう']
        ].map(([k,t])=>`<button type="button" class="choice ${state.check&&state.check[k]?'on':''}" data-check="${k}">
          <span class="tick">${state.check&&state.check[k]?'✓':'□'}</span>${esc(t)}</button>`).join('')}
      </div>
    </div>

    <div class="block">
      <h3>味付けを変える（その場で差し替え）</h3>
      <p class="note">刺激の1手</p>
      <div class="chips">${twistChips}</div>
      <p class="note" style="margin-top:12px">ピコ太郎の乗せ方</p>
      <div class="chips">${hookChips}</div>
      <p class="note" style="margin-top:12px">別のジャンルで作り直す</p>
      <div class="chips">
        ${alts.map(g=>`<button type="button" class="choice" data-genre="${g.id}">${esc(g.label)}<span class="lv">${stars(g.level)}</span></button>`).join('')}
      </div>
    </div>

    <div class="actions">
      <button class="btn sub" data-go="exp">戻る</button>
      <button class="btn yellow" data-go="out">出力へ（6種類）</button>
      <button class="btn sub sm" data-print="1">印刷 / PDF</button>
    </div>
  </section>`;
};

/* 06 out */
const OUT_TABS = [
  {id:'plan',     label:'1枚企画書'},
  {id:'image',    label:'イメージ1枚'},
  {id:'assets',   label:'2D素材シート（A4 1枚）'},
  {id:'web',      label:'WEBプロト'},
  {id:'unity',    label:'Unity MCP'},
  {id:'proposal', label:'提案書'}
];

const OUT_HELP = {
  plan:'生成AIに貼ると、A4 1枚の企画書になります。まずこれだけ作れば発表できます。',
  image:'画像生成AIに貼ります。1枚目はここで作った企画書を一緒に貼ると精度が上がります。',
  assets:'上のイメージ画像を添付してから貼ります。素材は「A4 1枚のシート」で頼む形にしました（1枚ずつだと断られやすいため）。',
  web:'コード生成AIに貼ります。1ファイルで動くWebゲームが出ます。ジューシー（気持ちよさ）の実装指示入りです。',
  unity:'Unity MCP接続済みのCodex / Claudeに貼ります。クレジット節約とジュースの指示入りです。',
  proposal:'古坂大魔王様側と評価者に向けた提案書を作るプロンプトです。'
};

R.out = () => {
  const P = currentPlan();
  if(!P) return `<section class="card"><p>先にゲーム案を作ってください。</p>
    <div class="actions"><button class="btn" data-go="result">ゲーム案へ</button></div></section>`;

  const tab = state.tab || 'plan';
  const texts = buildAll(P);
  const cur = texts[tab] || '';

  return `<section class="card">
    <div class="eyebrow">STEP 06 / 出力</div>
    <h2 class="step">そのまま貼れる6種類</h2>
    <p class="lead">上から順に使います。1→2→3→4→5と進むと、Webで遊べる形からUnityまで着地します。</p>

    <div class="tabs">
      ${OUT_TABS.map((t,i)=>`<button type="button" class="${tab===t.id?'on':''}" data-tab="${t.id}">
        ${i+1}. ${esc(t.label)}</button>`).join('')}
    </div>

    <div class="out-head">
      <h3>${esc(OUT_TABS.find(t=>t.id===tab).label)}</h3>
      <span class="meta">${cur.length.toLocaleString()}文字</span>
    </div>
    <p class="note" style="margin-bottom:10px">${esc(OUT_HELP[tab])}</p>
    <textarea class="out" id="outText" readonly>${esc(cur)}</textarea>
    <div class="copyrow">
      <button class="btn sm" data-copy="${tab}">この1つをコピー</button>
      <button class="btn sub sm" data-copyall="1">6種類をまとめてコピー</button>
      <button class="btn sub sm" data-print="1">印刷 / PDF</button>
    </div>

    <div class="block">
      <h3>使う順番</h3>
      <ul class="plain">
        <li><b>1. 1枚企画書</b>をAIに貼る → 企画書が出る</li>
        <li><b>2. イメージ画像</b>を、1の企画書と一緒に画像AIへ → 画面イメージが出る</li>
        <li><b>3. 2D素材シート</b>を、2の画像を添付して依頼 → A4 1枚に12マスの素材シートが出る</li>
        <li><b>4. WEBプロト</b>をコードAIへ → 遊べる1ファイルが出る</li>
        <li><b>5. Unity MCP</b>を、1〜4を添付して依頼 → UnityのシーンとPrefab</li>
        <li><b>6. 提案書</b>を、ここまでの成果物と一緒に → 発表用の提案書</li>
      </ul>
    </div>

    <div class="actions">
      <button class="btn sub" data-go="result">案に戻る</button>
      <button class="btn sub" data-go="intro">最初から</button>
    </div>
  </section>`;
};

function buildAll(P){
  const pr = PK2.prompts;
  return {
    plan: pr.promptPlan(P),
    image: pr.promptImage(P),
    assets: pr.promptAssets(P),
    web: pr.promptWeb(P),
    unity: pr.promptUnity(P),
    proposal: pr.promptProposal(P, state)
  };
}

/* ---------------- 描画実行 ----------------
   opts.keepScroll: 画面内の選択（ゲーム・ジャンル・乗せ方など）では
   スクロール位置を保つ。設問をまたぐ移動のときだけ先頭へ戻す。
   ---------------------------------------------------- */
function render(opts){
  const keep = !!(opts && opts.keepScroll);
  const y = keep ? (window.scrollY || window.pageYOffset || 0) : 0;

  renderRail();
  const fn = R[state.step] || R.intro;
  app.innerHTML = fn();
  app.focus({preventScroll:true});

  if(keep){
    /* 描画直後とレイアウト確定後の2回戻す（画像やフォントで高さが変わっても安定させる） */
    window.scrollTo({top:y, behavior:'auto'});
    requestAnimationFrame(()=>{ window.scrollTo({top:y, behavior:'auto'}); });
  }else{
    /* 設問をまたぐ移動は先頭へ。smoothだと長い距離で途中座標に残ることがあるので即時で戻す */
    window.scrollTo({top:0, behavior:'auto'});
    requestAnimationFrame(()=>{ window.scrollTo({top:0, behavior:'auto'}); });
  }
  save();
}

function go(step){
  if(step==='result' || step==='out'){
    if(!state.genre){ toast('先にジャンルを選んでください'); step='genre'; }
  }
  state.step = step;
  render();
}

/* ---------------- イベント ---------------- */
document.addEventListener('click', (e)=>{
  const el = e.target.closest('[data-go],[data-game],[data-genre],[data-pick],[data-hook],[data-twist],[data-exp],[data-goal],[data-tab],[data-copy],[data-copyall],[data-check],[data-print],[data-reset]');
  if(!el) return;

  if(el.dataset.go){ go(el.dataset.go); return; }

  if(el.dataset.game){
    const id = el.dataset.game;
    const i = state.games.indexOf(id);
    if(i>=0) state.games.splice(i,1);
    else if(state.games.length < 3) state.games.push(id);
    else { toast('3本までです。1本外してから選んでください'); return; }
    render({keepScroll:true}); return;
  }

  if(el.dataset.genre){
    state.genre = el.dataset.genre;
    const g = genreOf(state.genre);
    const rec = PK2.plan.recommendHooks(state.genre);
    state.hook = (rec[0] && rec[0].hook.id) || state.hook;
    state.twist = (g && g.twist) || (PK2.TWISTS[0] && PK2.TWISTS[0].id);
    render({keepScroll:true}); return;
  }

  /* 強烈におすすめの「これで進む」：選んでそのまま次の設問へ */
  if(el.dataset.pick){
    state.genre = el.dataset.pick;
    const g = genreOf(state.genre);
    const rec = PK2.plan.recommendHooks(state.genre);
    state.hook = (rec[0] && rec[0].hook.id) || state.hook;
    state.twist = (g && g.twist) || (PK2.TWISTS[0] && PK2.TWISTS[0].id);
    toast('おすすめの型で進めます');
    go('hook');
    return;
  }

  if(el.dataset.hook){ state.hook = el.dataset.hook; render({keepScroll:true}); return; }
  if(el.dataset.twist){ state.twist = el.dataset.twist; render({keepScroll:true}); return; }
  if(el.dataset.exp){ state.exp = el.dataset.exp; render({keepScroll:true}); return; }
  if(el.dataset.goal){ state.goal = el.dataset.goal; render({keepScroll:true}); return; }
  if(el.dataset.tab){ state.tab = el.dataset.tab; render({keepScroll:true}); return; }

  if(el.dataset.check){
    state.check = state.check || {a:false,b:false,c:false};
    const k = el.dataset.check;
    state.check[k] = !state.check[k];
    render({keepScroll:true}); return;
  }

  if(el.dataset.copy){
    const P = currentPlan(); if(!P) return;
    const texts = buildAll(P);
    copyText(texts[el.dataset.copy] || '', el);
    return;
  }

  if(el.dataset.copyall){
    const P = currentPlan(); if(!P) return;
    const texts = buildAll(P);
    const all = OUT_TABS.map((t,i)=>{
      const body = texts[t.id] || '';
      return `===== ${i+1}. ${t.label} =====\n\n${body}`;
    }).join('\n\n\n');
    const header = `# ${P.title}\n（${P.genreLabel} / ${P.input} / ${P.duration}秒 / ${P.hookLabel}）\n\n`;
    copyText(header + all, el);
    return;
  }

  if(el.dataset.print){ window.print(); return; }

  if(el.dataset.reset === 'games'){ state.games = []; render({keepScroll:true}); return; }

  /* 経験の設問は「答えずに進む」を許す。既定値に戻して案へ */
  if(el.dataset.reset === 'exp'){
    state.exp = 'some'; state.goal = 'both';
    toast('経験は「少し触ったことがある」として進めます');
    go('result');
    return;
  }
});

/* キーボード：結果画面でAlt+← 等は不要。テキストエリア内のクリック選択は邪魔しない */
document.addEventListener('keydown', (e)=>{
  if(e.key==='Escape' && state.step!=='intro'){ go('intro'); }
});

/* ---------------- ヘッダーのボタン ---------------- */
function bindHeader(){
  const p = document.getElementById('btnPrint');
  if(p) p.addEventListener('click', ()=> window.print());

  const r = document.getElementById('btnRestart');
  if(r) r.addEventListener('click', ()=>{
    const ok = window.confirm('選択をすべて消して、最初からやり直します。よろしいですか？');
    if(!ok) return;
    state = {step:'intro', games:[], genre:null, hook:null, twist:null,
             exp:'some', goal:'both', tab:'plan', check:{a:false,b:false,c:false}};
    try{ localStorage.removeItem(KEY); }catch(e){}
    render();
    toast('最初からやり直します');
  });

  const w = document.querySelector('.wordmark');
  if(w) w.addEventListener('click', (e)=>{ e.preventDefault(); go('intro'); });
}

/* ---------------- 起動 ---------------- */
function boot(){
  load();
  bindHeader();
  render();
  if(state.step==='intro'){ save(); }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

window.PK2app = { state, go, render, currentPlan };
})();
