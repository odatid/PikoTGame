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

/* ---------- 気持ちよさ（ジュース） ----------
   同じ1回の当たりを3倍気持ちよくする演出の辞書。
   ここから「必ず3つ＋ジャンル1つ＋刺激の1手1つ」を決定的に選ぶ（乱数なし）。
   csv/ジュース.csv と同じ語彙・同じ数値で書いている。
   ------------------------------------------------------------------ */
const JUICE = {
  squash:    {name:'つぶれ（伸縮）',       when:'着地・ジャンプ・被弾',    how:'scale を (1.25,0.75)→(0.9,1.1)→(1,1) に0.2秒で戻す', tune:'大きすぎるとゴムに見える'},
  landSquash:{name:'着地の沈み込み',       when:'着地した瞬間',           how:'scale を (1.2,0.8)→(0.95,1.05)→(1,1) に0.18秒', tune:'落ちた高さで強さを0.8〜1.3倍に変える'},
  hitstop:   {name:'ヒットストップ',       when:'当たった・決まった瞬間', how:'0.06秒だけ更新を止める（Time.timeScaleではなく自前のフラグ）', tune:'0.05〜0.08秒。長いと重くなる'},
  shake:     {name:'画面揺れ',             when:'被弾・爆発・失敗',       how:'カメラを±0.15動かし、0.15秒で戻す', tune:'振幅0.1〜0.2。揺らしすぎない'},
  particles: {name:'粒子',                 when:'成功・取得・破壊',       how:'同じ粒を色だけ変えて使い回す（8〜12個を放射状に飛ばす）', tune:'同時30個まで'},
  popup:     {name:'数字ポップ',           when:'得点が入った瞬間',       how:'数字を出して上へ0.5秒で移動＋透明にする', tune:'+1は小さく、+10は大きく'},
  hitSpark:  {name:'火花',                 when:'攻撃が当たった瞬間',     how:'当たった点に放射状6個＋一瞬の白い円を置く', tune:'発生点は必ず当たり位置に'},
  trail:     {name:'残像',                 when:'移動・落下',             how:'0.1秒ごとに半透明のコピーを置く（3枚まで）', tune:'止まったら出さない'},
  anticipation:{name:'溜め（予兆）',       when:'出現の0.2秒前',          how:'地面に影を出し、キャラを少し縮める', tune:'0.15〜0.3秒。長いとテンポが死ぬ'},
  flash:     {name:'フラッシュ',           when:'成功・大ダメージ',       how:'白いパネルの alpha を 0.7→0 に0.08秒', tune:'点滅は秒2回まで'},
  zoom:      {name:'寄り（カメラ）',       when:'成功の瞬間',             how:'カメラのサイズを5%縮めて0.2秒で戻す', tune:'5〜8%。大きくすると酔う'},
  slowmo:    {name:'スロー',               when:'最後の1個・決定的瞬間',  how:'時間の進みを0.35倍にして0.3秒で戻す', tune:'1プレイ1回まで'},
  comboscale:{name:'コンボ演出',           when:'3連続ごと',              how:'コンボの数字を大きく→元に戻す。音程も上げる', tune:'音程は半音ずつ、6回で頭打ち'},
  recoil:    {name:'のけぞり',             when:'被弾・失敗',             how:'当たった方向と逆へ0.15動かし、0.12秒で戻す', tune:'動かしすぎると操作が効かなくなる'},
  freeze:    {name:'一瞬の停止',           when:'大成功・決着',           how:'0.12秒だけ全部を止め、白フラッシュと同時に出す', tune:'0.1秒を超えると重いと感じる'}
};

/* ジャンルごとに「効く」演出を1つだけ選ぶ */
const J_GENRE = {
  g_platx:'landSquash', g_platy:'landSquash', g_run:'landSquash', g_run3d:'trail',
  g_vshoot:'hitSpark',  g_hshoot:'hitSpark',  g_horde:'hitSpark',  g_rail:'zoom',
  g_puzzact:'comboscale', g_otoshimono:'comboscale', g_rhythm:'comboscale', g_actpuzzle:'flash',
  g_breakout:'particles', g_fishing:'anticipation', g_batting:'zoom', g_gun:'zoom',
  g_shot:'hitSpark', g_putting:'zoom', g_pong:'trail', g_wall:'shake',
  g_haystack:'anticipation', g_tsubo:'anticipation'
};

/* 刺激の1手ごとに「効く」演出を1つだけ選ぶ */
const J_TWIST = {
  tw_dense:'shake', tw_speed:'trail', tw_shrink:'shake', tw_rise:'shake', tw_wall:'recoil',
  tw_chain:'comboscale', tw_grow:'popup', tw_order:'flash', tw_split:'particles',
  tw_aim:'zoom', tw_wait:'anticipation', tw_zone:'flash', tw_price:'popup',
  tw_wind:'trail', tw_crack:'freeze', tw_decoy:'anticipation'
};

function pickJuice(genreId, twistId){
  const ids = ['squash','hitstop','popup'];   /* どのゲームでも必ず入る3つ */
  const push = id=>{ if(id && JUICE[id] && ids.indexOf(id)<0) ids.push(id); };
  push(J_GENRE[genreId]);
  push(J_TWIST[twistId]);
  push('particles');
  push('flash');
  return ids.slice(0,5).map(id=>Object.assign({id}, JUICE[id]));
}

/* ---------- 不条理（無理やん → でも惜しい） ----------
   ピコ太郎の笑いの核は「真顔で、無理なことをやる」。
   ゲームの面白さも同じ場所にある。
   ・要求は無理に見せる（失敗前提）
   ・でも触れば「あ、いける」と思わせる救いを必ず1つ入れる
   ・操作は増やさない。無理なのは「要求」のほう
   理不尽（＝救いが無い）にはしない。救いが無いと笑いではなく怒りになる。
   乱数は使わない（ジャンルと乗せ方で決まる）。
   ------------------------------------------------------------------ */
const ABSURD = {
  g_vshoot:{demand:'敵が増えすぎて、自分の弾がどれか分からなくなる',
    impossible:'画面が弾で埋まるので、避ける場所が見えない',
    rescue:'自機の弾だけ白、敵の弾は黄色に固定する。色で見分けられる',
    laugh:'避けきれない量の弾が来ているのに、真顔で撃ち続けている画',
    rate:'10回に2回は生き残れる'},
  g_hshoot:{demand:'地形の隙間が、自機より狭い',
    impossible:'幅が足りないので、まっすぐでは通れない',
    rescue:'斜めに入ると判定1点だけ通る。当たり判定は中心の点のみ',
    laugh:'通れない幅に突っ込んで、そのまま挟まって止まる',
    rate:'10回に3回は抜けられる'},
  g_platx:{demand:'ヒョウ柄の靴がすべって、止まれない',
    impossible:'減速できないので、狙った位置に立てない',
    rescue:'助走をつけて跳ぶと、すべりが前に乗って遠くまで届く',
    laugh:'止まろうとして、そのまま滑って落ちる',
    rate:'10回に3回はゴールできる'},
  g_platy:{demand:'下から迫るものが、登るより速い',
    impossible:'足場を探している間に追いつかれる',
    rescue:'足場は必ず1つ先に見えている。迷わなければ間に合う',
    laugh:'真下まで来ているのに、次の足場を探して迷っている',
    rate:'10回に2回は上まで届く'},
  g_run:{demand:'走るのが速すぎて、何も見えない',
    impossible:'障害物が見えてからでは遅い',
    rescue:'障害物は必ず3つ周期で来る。音で先が分かる',
    laugh:'見えないまま跳び続けて、顔だけ真顔',
    rate:'10回に4回は走り切れる'},
  g_run3d:{demand:'レーンが3本しかないのに、障害物が4列ある',
    impossible:'どこか1列は必ず埋まるので、避けきれない',
    rescue:'必ず1本は空く。1列だけ見ていれば済む',
    laugh:'全部埋まって見えるのに、1本だけ空いている',
    rate:'10回に3回は抜けられる'},
  g_horde:{demand:'敵が多すぎて、画面が処理落ちする',
    impossible:'数が多すぎて、どれを避ければいいか分からない',
    rescue:'敵は全部おなじ動き。1体よければ全部よけられる',
    laugh:'圧に負けて、真顔のまま棒立ちになる',
    rate:'10回に2回は60秒生き残れる'},
  g_rail:{demand:'弾が3発しかないのに、敵が15体出る',
    impossible:'数が足りないので、全部は倒せない',
    rescue:'1発で2体抜ける位置がある。狙えば足りる',
    laugh:'3発で15体に向かっていく真顔',
    rate:'10回に2回は全部倒せる'},
  g_puzzact:{demand:'盤面が埋まっていて、動かす場所がない',
    impossible:'置く場所が無いので、何もできない',
    rescue:'1手だけ戻せる。そこから連鎖の入口が見える',
    laugh:'埋まった盤面を、真顔でじっと見ている',
    rate:'10回に2回は連鎖がつながる'},
  g_otoshimono:{demand:'落ちるのが速すぎて、左右に動かす間がない',
    impossible:'見てから動かすと、もう着いている',
    rescue:'1回だけ止められる。止めてから考えればよい',
    laugh:'速すぎて、何も動かせないまま積み上がる',
    rate:'10回に3回は目標に届く'},
  g_actpuzzle:{demand:'押す順番がどこにも書いていない',
    impossible:'手がかりが無いので、総当たりになる',
    rescue:'押すと音が変わる。正解の順番だけ音が上がる',
    laugh:'全部のスイッチを真顔で押していく',
    rate:'10回に2回は1分以内に解ける'},
  g_rhythm:{demand:'BPMが速すぎて、手が追いつかない',
    impossible:'全部叩こうとすると必ず落ちる',
    rescue:'4分だけ叩けば曲になる。捨てる場所が決まっている',
    laugh:'全部叩こうとして、腕だけ速くて顔は無表情',
    rate:'10回に3回は目標に届く'},
  g_breakout:{demand:'パドルがボールより小さい',
    impossible:'正面でしか当たらないので、まず返せない',
    rescue:'ボールが遅い。端に当たると角度がついて跳ね返る',
    laugh:'小さい板を必死に追いかける真顔',
    rate:'10回に3回はブロックを全部壊せる'},
  g_fishing:{demand:'魚が強すぎて、糸が先に切れる',
    impossible:'引っ張ると負けるので、勝てる瞬間がない',
    rescue:'連打で戻せる。糸の残りが見えるので、止める判断ができる',
    laugh:'負けているのに竿を離さない',
    rate:'10回に2回は釣り上げられる'},
  g_batting:{demand:'球が速すぎて、投げた瞬間にはもう来ている',
    impossible:'見てから振ると必ず遅れる',
    rescue:'投げる前に必ず予告がある。タイミングだけ合わせればよい',
    laugh:'振り遅れて、空を切ったまま決めポーズ',
    rate:'10回に2回は芯で捉えられる'},
  g_gun:{demand:'的が遠すぎて、点にしか見えない',
    impossible:'狙いが1ピクセルずれるだけで外れる',
    rescue:'風は読める。周期が決まっているので、待てば止まる',
    laugh:'点に向かって、真顔で30秒ねらい続ける',
    rate:'10回に2回は中心に当たる'},
  g_shot:{demand:'景品が重すぎて、当てても倒れない',
    impossible:'まっすぐ当てるだけでは動かない',
    rescue:'1つだけ軽い景品がある。そこを狙えば連鎖で倒れる',
    laugh:'倒れない景品に、何度もコルクを当て続ける',
    rate:'10回に3回は棚が空になる'},
  g_putting:{demand:'カップが豆粒くらい小さい',
    impossible:'まっすぐ打っても、まず入らない',
    rescue:'縁で1回転して落ちる。強く入れれば拾える',
    laugh:'入らない球を、真顔で見送る',
    rate:'10回に2回は入る'},
  g_pong:{demand:'球が速すぎて、ラケットが間に合わない',
    impossible:'反応では追いつかない',
    rescue:'打ち返すと球が遅くなる。ラリーが続くほど楽になる',
    laugh:'速い球に、真顔でラケットを置きにいく',
    rate:'10回に3回は5本続く'},
  g_wall:{demand:'壁が硬すぎて、叩いても何も起きない',
    impossible:'60秒叩き続けても、ひび1本に見える',
    rescue:'ひびは必ず増える。残りが目で分かるので、止めどきが分かる',
    laugh:'硬い壁に、真顔で連打し続ける',
    rate:'10回に2回は壊せる'},
  g_haystack:{demand:'山が大きすぎて、針が1本しかない',
    impossible:'総当たりでは60秒で終わらない',
    rescue:'針だけ光る。光を探せば、山全体を見なくてよい',
    laugh:'巨大な山を、真顔でかき分け続ける',
    rate:'10回に2回は見つかる'},
  g_tsubo:{demand:'壺の口が、玉より小さい',
    impossible:'まっすぐ投げても、必ず縁に当たる',
    rescue:'縁で跳ね返って入る。強く投げると入りやすい',
    laugh:'入らない壺に、真顔で玉を投げ続ける',
    rate:'10回に2回は入る'}
};

/* 乗せ方で「無理」の質が変わる（決定的） */
const ABSURD_HOOK = {
  h_pico:'。しかも動かすのはピコ太郎本人。',
  h_item:'。集める物はPen・Apple・Pineappleの3つだけ。',
  h_face:'。しかも的はピコ太郎の顔。',
  h_body:'。足場は眼鏡と口髭でできている。',
  h_pose:'。決まったポーズを再現しながらやる。',
  h_leopard:'。床がヒョウ柄で、ところどころ滑る。',
  h_crowd:'。しかもピコ太郎が増え続ける。',
  h_disguise:'。倒すと中から本人が出てくる。'
};

function absurdOf(genreId, hookId){
  const a = ABSURD[genreId] || ABSURD.g_platx;
  const suffix = ABSURD_HOOK[hookId] || '';
  return {
    demand: a.demand + suffix,
    impossible: a.impossible,
    rescue: a.rescue,
    laugh: a.laugh,
    rate: a.rate,
    oneLine: '一見「無理やん」に見える。でも' + a.rescue + '。だから失敗しても惜しさで終わる。'
  };
}

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
       ・ただし pop/hot を強くしすぎると、好みと無関係な型が上位に来て「おすすめが偏る」。
         → 実際にリズムが上位3位に50.4%入っていたので、pop/hot の寄与を下げた（2026-10-30 計測）。
         好みが並んだときに「少し後押しする」程度に留めるのが正しい。 */
    let s = pref * 2.0;                      /* 好きなゲームの傾向（主役） */
    s += (pop.pop - 1) * 0.45;               /* 友だちウケ（0 / 0.45 / 0.90） */
    if(pop.hot) s += 0.25;                   /* 今年の学生人気（決め手程度） */
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

/* ---------- A4素材シートの12マス（1枚に集める） ----------
   別々のファイルを15枚作らせると失敗するので、
   A4横1枚・3行×4列の12マスにまとめる。中身は決定的に埋まる。
   ------------------------------------------------------------------ */
const SLOT_TAIL = [
  ['成功エフェクト（キラッ）', '白と黄色の放射。星を3〜5個。'],
  ['失敗エフェクト（バツ・煙）', '赤いバツと灰色の煙。'],
  ['背景（奥の1枚）', '空と地面だけ。細かい物を描かない。'],
  ['HUDアイコン：時間', '時計の形。'],
  ['HUDアイコン：スコア', '星の形。'],
  ['アイテム／コイン', '取ると嬉しい物。'],
  ['タップ用のボタン', '指で押す丸いボタン。'],
  ['飾り（ヒョウ柄の帯）', '黄色×黒のヒョウ柄。横長。']
];

/* 12マスに足りないぶんを埋める予備（ジャンルによって素材名が少ないため） */
const SLOT_PAD = [
  ['ゴール／出口', 'たどり着くと終わる場所。'],
  ['弾・投げる物', '撃つ／投げる物。'],
  ['地面のタイル', '横に伸ばせる1マス。'],
  ['敵（2種類目）', '色ちがいでよい。']
];

function sheetSlots(plan){
  const out = [];
  const add = (name, note)=>{
    if(!name || out.length>=12) return;
    if(out.some(o=>o.name===name)) return;
    out.push({n:out.length+1, name:name, note:note||''});
  };
  const addPad = ()=>{
    SLOT_PAD.forEach(pair=>add(pair[0], pair[1]));
  };

  add('主人公（待機）', '立っている1コマ。手足が見える向き。');
  add('主人公（動き）', '跳ぶ／走る瞬間。少し傾ける。');
  (plan.assets||[]).slice(1).forEach(a=>{
    if(/背景|HUD/.test(a)) return;   /* 背景とHUDは下で別マスにする */
    add(a, '');
  });
  addPad();                          /* 足りなければ先に埋める（必ず12マスにする） */
  SLOT_TAIL.forEach(pair=>add(pair[0], pair[1]));
  addPad();                          /* それでも足りない場合の最後の保険 */
  return out;
}

/* ---------- 案の組み立て ---------- */
function buildPlan(st){
  const genre = N(st.genre) || PK2.GENRES[0];
  const hook  = H(st.hook)  || PK2.HOOKS[0];
  const twist = T(st.twist || genre.twist) || PK2.TWISTS[0];
  const cap   = (PK2.EXP.find(e=>e.id===st.exp)||{}).cap || 2;

  const title = (TITLES[genre.id]||'{w}ゲーム').replace('{w}', hook.word);
  const cores = picoFits(genre.id, hook.id);
  const juice = pickJuice(genre.id, twist.id);
  const absurd = absurdOf(genre.id, hook.id);

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
    /* 「面白い」の3点セット。ここが空だと、どの案も同じ説明文になって
       「ゲームがつまらない」に見える（2026-10-30 計測：22ジャンル全て空だった） */
    kick:genre.kick || '',
    spike:genre.spike || '',
    again:genre.again || '',
    music:genre.music || '',
    unity:genre.unity,
    impl:hook.impl,
    conceptHook:hook.concept,
    cores,
    coreLine:cores.map(k=>(PICO_CORE.find(c=>c.k===k)||{}).t).filter(Boolean).join('。'),
    level:genre.level, overCap: genre.level > cap,
    assets:genre.assets.slice(),
    juice,
    juiceLine:`${juice[0].name}と${juice[1].name}を入れるだけで、同じ1回の当たりが3倍気持ちよくなる。`,
    absurd,
    sheet:[]
  };
  plan.sheet = sheetSlots(plan);

  /* 後付けコンセプト（先に考えさせない。結果から逆算して書く） */
  plan.pitch = `${genre.label}の「${genre.why}」に、ピコ太郎の${cores.join('と')}を1か所だけ乗せた${duration}秒のゲーム。`
    + `一見「無理やん」に見えて、${absurd.rescue}。だから失敗しても笑って終わる。`;
  plan.whyPico = `この形にしたのは、${hook.one.replace(/。$/,'')}を、そのままルールにすると一番早く「面白い」に届くから。`
    + `ピコ太郎の${cores.join('・')}は、説明を足さなくても遊びの中で体感できる。`;
  plan.whyShape = `ピコ太郎の要素は、見た目ではなく「${twist.label}（${twist.one}）」という1つの仕掛けに入れた。`
    + ''
    + `キャラを別のものに差し替えても遊びは成立するが、${hook.word}であることで迷わず伝わる。`
    + `${hook.concept}`;
  plan.appeal = [
    `1分で「分かった」が出る（${genre.why}）`,
    `無理やん→できた、が起きる（${absurd.rescue}）`,
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

PK2.plan = { recommendGenres, recommendHooks, buildPlan, alternatives, caution, topPick,
             TITLES, SHOW, PICO_CORE, JUICE, pickJuice, sheetSlots,
             ABSURD, ABSURD_HOOK, absurdOf };
})();
