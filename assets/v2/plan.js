/* =========================================================
   PK//PROTO v2 — 決定ロジック
   入力：好きなゲーム / ジャンル / ピコ太郎の乗せ方 / 経験 / ゴール
   出力：1つの「遊べる案」＋後付けコンセプト（乱数なし・決定的）
   ========================================================= */
window.PK2 = window.PK2 || {};
(function(){
'use strict';

const G = id => PK2.GAMES.find(x=>x.id===id);
const N = id => PK2.GENRES.find(x=>x.id===id);
const H = id => PK2.HOOKS.find(x=>x.id===id);
const T = id => PK2.TWISTS.find(x=>x.id===id);

/* ---------- タイトル（ジャンル×乗せ方で決まる） ---------- */
const TITLES = {
  g_vshoot:    '{w}シューター',
  g_hshoot:    '{w}ストライカー',
  g_platx:     '{w}ジャンプ',
  g_platy:     '{w}クライマー',
  g_run:       '{w}ダッシュ',
  g_run3d:     '{w}3Dラン',
  g_horde:     '{w}サバイバー',
  g_rail:      '{w}レールガン',
  g_puzzact:   '{w}パズルアタック',
  g_otoshimono:'{w}おとし',
  g_actpuzzle: '{w}スイッチ',
  g_rhythm:    '{w}ビート',
  g_breakout:  '{w}ブレイカー',
  g_fishing:   '{w}フィッシング',
  g_batting:   '{w}バッター',
  g_gun:       '{w}ガンナー',
  g_shot:      '{w}射的',
  g_putting:   '{w}パット',
  g_pong:      '{w}ポン',
  g_wall:      '{w}パンチ',
  g_haystack:  '{w}さがし',
  g_tsubo:     '{w}ツボ入れ'
};

/* ---------- 「他人に見せたくなる見せ場」（1文） ---------- */
const SHOW = {
  g_vshoot:'敵が数十体に増えた瞬間、こちらの弾が画面を埋めて一気に溶ける画。',
  g_hshoot:'地形の隙間をすれすれで抜けた瞬間、弾の線が画面を横切る画。',
  g_platx:'ピコ太郎が段差を跳び越え、真顔のまま空中に浮いている1コマ。',
  g_platy:'下から迫るものの直前で足場に飛び移る、ぎりぎりの1コマ。',
  g_run:'障害物を跳び越えた瞬間、コインが一直線に並んで吸い込まれる画。',
  g_run3d:'3レーンを走るピコ太郎の後ろ姿と、奥まで続くヒョウ柄の道。',
  g_horde:'画面を埋め尽くす敵の群れの中心で、1人だけ真顔で立っている画。',
  g_rail:'暗い通路の奥から出てきた的を、照準がとらえた瞬間。',
  g_puzzact:'連鎖が3段つながって、盤面が一気に消える瞬間。',
  g_otoshimono:'画面が上まで埋まりそうで、最後の1個がギリギリ収まる瞬間。',
  g_actpuzzle:'スイッチを押して扉が開き、道がつながった瞬間。',
  g_rhythm:'ノーツが判定ラインに重なる瞬間と、光るレーン。',
  g_breakout:'ブロックが一気に崩れて、破片が画面に散る瞬間。',
  g_fishing:'水面が割れて魚が跳ね、釣り糸がピンと張る瞬間。',
  g_batting:'芯で捉えて、球が画面の外まで飛んでいく瞬間。',
  g_gun:'照準が的の中心に合い、命中して的が吹っ飛ぶ瞬間。',
  g_shot:'景品が棚から落ちて、奥の壁に当たって跳ね返る瞬間。',
  g_putting:'ボールがカップの縁で1回転して落ちる瞬間。',
  g_pong:'球がパドルの端に当たって、ありえない角度で飛んでいく瞬間。',
  g_wall:'壁にひびが入り、最後の一撃で壁全体が崩れる瞬間。',
  g_haystack:'山をかき分けた先に、針の先だけが光っている瞬間。',
  g_tsubo:'玉が放物線を描いて、壺の口に吸い込まれる瞬間。'
};

/* ---------- 後付けコンセプトの部品 ---------- */
const PICO_CORE = [
  {k:'反復',      t:'同じ動作を繰り返すことが気持ちいい'},
  {k:'組み合わせ',t:'関係ないものが2つ合わさって成立する'},
  {k:'真似',      t:'見た人がすぐ真似できる'},
  {k:'短さ',      t:'1分以内で終わるから、もう一回が軽い'},
  {k:'言葉不要',  t:'説明を読まなくても伝わる'}
];

function picoFits(genreId, hookId){
  /* ジャンルと乗せ方から、無理のない「ピコ太郎らしさ」を1〜2個選ぶ（決定的） */
  const table = {
    g_vshoot:['反復','組み合わせ'], g_hshoot:['反復','言葉不要'], g_platx:['真似','短さ'],
    g_platy:['真似','反復'],        g_run:['短さ','反復'],       g_run3d:['反復','短さ'],
    g_horde:['反復','組み合わせ'],  g_rail:['真似','言葉不要'],  g_puzzact:['組み合わせ','反復'],
    g_otoshimono:['組み合わせ','反復'], g_actpuzzle:['組み合わせ','短さ'], g_rhythm:['反復','真似'],
    g_breakout:['反復','組み合わせ'], g_fishing:['短さ','真似'],  g_batting:['真似','短さ'],
    g_gun:['真似','短さ'],          g_shot:['真似','短さ'],      g_putting:['短さ','反復'],
    g_pong:['反復','言葉不要'],     g_wall:['反復','言葉不要'],  g_haystack:['短さ','言葉不要'],
    g_tsubo:['短さ','真似']
  };
  const base = table[genreId] || ['反復','短さ'];
  if(hookId==='h_pose' && base.indexOf('真似')<0) base[1]='真似';
  if(hookId==='h_item' && base.indexOf('組み合わせ')<0) base[0]='組み合わせ';
  return base;
}

/* ---------- ジャンル推薦（好きなゲームの傾向 ＋ 18〜20歳の友人ウケ） ----------
   意志薄弱な層が「考えずに乗れる」ように、2軸で強い1つを決める。
   ① 好きなゲームの選択傾向（本人の好み）
   ② 18〜20歳の友だちに「面白い」と言われやすいか（PK2.POP）
   乱数は使わない。同じ選択なら同じ順位。
   ------------------------------------------------------------------ */
function recommendGenres(gameIds, expId){
  const score = {};
  PK2.GENRES.forEach(g=>{ score[g.id] = 0; });
  (gameIds||[]).forEach((gid, i)=>{
    const gm = G(gid); if(!gm) return;
    const w = i===0 ? 1.0 : 0.6;
    gm.genres.forEach((gen, j)=>{ if(score[gen]!==undefined) score[gen] += w * (1 - j*0.25); });
  });
  const cap = (PK2.EXP.find(e=>e.id===expId)||{}).cap || 2;

  return PK2.GENRES.map(g=>{
    const pref = score[g.id] || 0;
    const pop = PK2.popOf(g.id);

    /* 重みの設計：
       ・pref（好きなゲームの傾向）を最も重くする。ここが効かないと「選んだ意味」が消える。
       ・pop（友だちウケ）と hot（今年の人気）は、pref が並んだときの決め手。
       → 何も選ばない人には pop/hot で「マリオ型・リズム」が自然に出る。 */
    let s = pref * 2.0;                      /* 好きなゲームの傾向（主役） */
    s += (pop.pop - 1) * 0.65;               /* 友だちウケ（0 / 0.65 / 1.3） */
    if(pop.hot) s += 0.45;                   /* 今年の学生人気 */
    if(g.level > cap) s -= 0.5;              /* 経験を超えるものは下げる */
    if(g.level <= cap) s += 0.15;

    return {genre:g, score:s, pref, pop};
  }).sort((a,b)=>
    b.score - a.score ||
    b.pop.pop - a.pop.pop ||
    (b.pop.hot?1:0) - (a.pop.hot?1:0) ||
    a.genre.level - b.genre.level ||
    a.genre.id.localeCompare(b.genre.id)
  );
}

/* ---------- 強烈におすすめする1つ（理由つき） ---------- */
function topPick(gameIds, expId){
  const ranked = recommendGenres(gameIds, expId);
  const first = ranked[0];
  if(!first) return null;

  const g = first.genre;
  const pop = first.pop;
  const reasons = [];

  /* 理由1：本人の好きなゲームとの相性 */
  const liked = (gameIds||[]).map(G).filter(Boolean);
  const matched = liked.filter(gm=>gm.genres.indexOf(g.id)>=0);
  if(matched.length){
    reasons.push(`好きな${matched.map(x=>x.name).join('・')}と同じ系統で、すでに遊び方が体に入っています。`);
  }else if(liked.length){
    reasons.push(`好きな${liked[0].name}とは別の系統ですが、1分で面白さが伝わる型です。`);
  }else{
    /* ゲーム未選択でも、乗る理由を必ず2つ出す（考えさせない） */
    reasons.push('1プレイ1分で終わり、初見の友だちでも操作が1〜2種類だけで遊べます。');
  }

  /* 理由2：18〜20歳の友人ウケ */
  if(pop.why) reasons.push(pop.why);

  /* 理由3：今年の学生人気 */
  if(pop.hot){
    reasons.push('今年、学生が作りたい型の上位です。まわりと同じ土俵で見せられます。');
  }

  return {genre:g, reasons, score:first.score, pop, ranked};
}

/* ---------- 乗せ方の推薦 ---------- */
function recommendHooks(genreId){
  const g = N(genreId);
  if(!g) return PK2.HOOKS.map(h=>({hook:h, score:0}));
  return PK2.HOOKS.map((h,i)=>{
    let s = 0;
    if(g.hooks.indexOf(h.id) >= 0) s += 2;
    if(h.id==='h_pico' && (g.input.indexOf('移動')>=0)) s += 0.6;
    if(h.id==='h_item' && (g.id==='g_vshoot'||g.id==='g_hshoot'||g.id==='g_breakout')) s += 0.5;
    if(h.id==='h_face' && (g.id==='g_gun'||g.id==='g_shot'||g.id==='g_breakout'||g.id==='g_wall')) s += 0.5;
    if(h.id==='h_leopard' && (g.id==='g_run'||g.id==='g_putting'||g.id==='g_run3d')) s += 0.5;
    if(h.id==='h_pose' && g.id==='g_rhythm') s += 0.5;
    if(h.id==='h_crowd' && (g.id==='g_horde'||g.id==='g_run3d')) s += 0.5;
    return {hook:h, score:s, order:i};
  }).sort((a,b)=> b.score-a.score || a.order-b.order);
}

/* ---------- 案の組み立て ---------- */
function buildPlan(st){
  const genre = N(st.genre) || PK2.GENRES[0];
  const hook  = H(st.hook)  || PK2.HOOKS[0];
  const twist = T(st.twist || genre.twist) || PK2.TWISTS[0];
  const cap   = (PK2.EXP.find(e=>e.id===st.exp)||{}).cap || 2;

  const title = (TITLES[genre.id]||'{w}ゲーム').replace('{w}', hook.word);
  const cores = picoFits(genre.id, hook.id);

  const duration = genre.time;
  const target   = genre.target;
  const life     = genre.life;

  const success = genre.id==='g_run' || genre.id==='g_platx' || genre.id==='g_platy'
    ? `${duration}秒以内にゴールする`
    : (target ? `${duration}秒で${target}${genre.id==='g_puzzact'?'点':'個'}に到達する` : `${duration}秒 生き残る`);
  const fail = life>1 ? `${life}回ミスする` : `時間切れ、または1回ミスする`;

  const plan = {
    genreId:genre.id, genreLabel:genre.label, family:genre.fam,
    hookId:hook.id, hookLabel:hook.label, hookWord:hook.word,
    twistId:twist.id, twistLabel:twist.label, twistOne:twist.one,
    twistHow:twist.how, twistEffect:twist.effect,
    title, duration, target, life, success, fail,
    input:genre.input, view:genre.view,
    oneline:`${genre.loop.replace(/。$/,'')} ${hook.one}`,
    loop:genre.loop,
    show:SHOW[genre.id] || '',
    why:genre.why,
    unity:genre.unity,
    impl:hook.impl,
    conceptHook:hook.concept,
    cores,
    coreLine:cores.map(k=>(PICO_CORE.find(c=>c.k===k)||{}).t).filter(Boolean).join('。'),
    level:genre.level, overCap: genre.level > cap,
    assets:genre.assets.slice()
  };

  /* 後付けコンセプト（先に考えさせない。結果から逆算して書く） */
  plan.pitch = `${genre.label}の「${genre.why}」に、ピコ太郎の${cores.join('と')}を1か所だけ乗せた${duration}秒のゲーム。`;
  plan.whyPico = `この形にしたのは、${hook.one.replace(/。$/,'')}を、そのままルールにすると一番早く「面白い」に届くから。`
    + `ピコ太郎の${cores.join('・')}は、説明を足さなくても遊びの中で体感できる。`;
  plan.whyShape = `ピコ太郎の要素は、見た目ではなく「${twist.label}（${twist.one}）」という1つの仕掛けに入れた。`
    + ''
    + `キャラを別のものに差し替えても遊びは成立するが、${hook.word}であることで迷わず伝わる。`
    + `${hook.concept}`;
  plan.appeal = [
    `1分で「分かった」が出る（${genre.why}）`,
    `${twist.label}：${twist.effect}`,
    `見せ場がはっきりしている（${plan.show}）`,
    `ピコ太郎の${cores.join('・')}が、説明なしで伝わる`
  ];

  return plan;
}

/* ---------- 別案（その場で差し替えられる候補） ---------- */
function alternatives(st, n){
  const cur = st.genre;
  const exp = (PK2.EXP.find(e=>e.id===st.exp)||{}).cap || 2;
  const pool = PK2.GENRES.filter(g=>g.id!==cur && g.level<=exp);
  const games = (st.games||[]).map(G).filter(Boolean);
  const related = new Set();
  games.forEach(g=>g.genres.forEach(x=>related.add(x)));
  return pool.map(g=>({genre:g, rel: related.has(g.id)?1:0}))
    .sort((a,b)=> b.rel-a.rel || a.genre.level-b.genre.level || a.genre.id.localeCompare(b.genre.id))
    .slice(0, n||4).map(x=>x.genre);
}

/* ---------- 経験に合わないときの一言 ---------- */
function caution(plan){
  if(!plan.overCap) return '';
  return `このジャンル（${plan.genreLabel}）は少し背伸びです。まずはWEBプロトで遊べる形にして、`
    + `Unityでは敵1種・演出3つに削ってから始めてください。`;
}

PK2.plan = { recommendGenres, recommendHooks, buildPlan, alternatives, caution, topPick, TITLES, SHOW, PICO_CORE };
})();
