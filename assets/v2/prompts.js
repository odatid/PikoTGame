/* =========================================================
   PK//PROTO v2 — 出力プロトコル（6種）
   すべて「DB＋ID参照」から決定的に組み立てる。生成AIのAPIは使わない。
   1. 1枚企画書
   2. ゲームイメージ画像
   3. 2Dアセットシート（A4 1枚・12マス／イメージ画像 → Unity素材）
   4. WEBプロト生成プロトコル
   5. UnityMCP 依頼プロトコル（クレジット節約つき）
   6. ステークホルダー向け提案書生成プロンプト
   ========================================================= */
window.PK2 = window.PK2 || {};
(function(){
'use strict';

const PICO_LOOK = `角刈りパンチ（サイドと後ろは刈り上げ、てっぺんだけ短く縮れて立ち上がる）／鼻にちょいがけの黒縁眼鏡（サングラスではない・レンズ越しに目が見える）／口の上の口髭（細く短い・顎髭なし）／黄色×黒のヒョウ柄の衣装。表情は真顔寄り。`;

/* ------------------------------------------------------------------
   見た目の数値仕様。
   文章だけの指定では、生成のたびに別人になる（毎回「似ていない」）。
   比率を数値で固定すると、同じ絵が再現される。
   基準：頭の幅を W=1.00 とする。頭の高さは 1.28W。
   ------------------------------------------------------------------ */
const PICO_SPEC = {
  body: [
    '**すべて四角（矩形）で描く。丸・楕円・曲線を使わない。** これがピコ太郎の記号。',
    '**腕・脚・手・靴を描かない。** 頭・胴・足（白い箱2つ）だけで作る。手足は動きを伝えないので省く。',
    '頭身：ゲーム内のキャラは 2.0頭身（頭が大きい）。頭の幅 W1.00。',
    '頭：幅 W1.00 × 高さ 1.28W（縦長の箱）。全高の51%。',
    '首：幅 0.26W × 高さ 0.14W。ほぼ見えない。',
    '胴：幅 1.00W。箱を2段（腰 高さ0.46W ＋ 胸 高さ0.40W）。',
    '足：白い箱2つ。幅 0.34W × 高さ 0.24W。左右の中心は ±0.24W。底が足元（y=0）にそろう。',
    '動きは手足ではなく、**拡縮（sx/sy）・傾き（lean）・足の開き（split）**で作る。'
  ],
  face: [
    '頭頂を 0.00、顎を 1.00 とする縦の目盛りで置く（ここを外すと別人になる）。',
    '生え際 0.18／眉 0.31／目の中心 0.38／鼻の先 0.51／口髭 0.58／口の中心 0.67／顎 1.00。',
    '※ 目が上半分にあること。目を顔の真ん中に置くと、似なくなる。',
    '**輪郭は箱。幅を一定にする（1.00W）。** 四角い顔がピコ太郎の記号。',
    '耳：横 0.52W に幅 0.07W × 高さ 0.20W の箱。',
    '目：幅 0.28W／間隔 0.16W／高さ 0.05W の横線（箱）。点にしない。',
    '眉：幅 0.24W／高さ 0.03W の薄い箱。',
    '鼻：幅 0.26W × 高さ 0.11W の箱 1つ。'
  ],
  hair: [
    '**てっぺんは平らな箱**。頭頂から 0.18 まで。前髪は水平に切る（流さない・とがらせない）。',
    'パンチパーマの表現：上端に幅0.10W × 高さ0.035W の刻みを3つ。つるっとさせない。',
    'こめかみから下は刈り上げ。肌に近い色で幅 0.08W の箱。もみあげは耳の手前で止める。',
    '色 #141212。ツヤ・ハイライトは描かない。'
  ],
  glasses: [
    '**黒縁の横長。中は透けて目が見える（黒く塗らない）。**',
    'レンズ：幅 0.36W × 高さ 0.16W。左右の間隔 0.08W。中心は ±0.22W。',
    '**枠は4本の矩形で描く**（上下0.030W／左右0.030W）。中に半透明の白を重ねる。',
    'ブリッジとつるも矩形 0.030W。',
    '掛け方：レンズの上端は目の中心より 0.03W 上。下端は鼻の先（目盛り0.51）にそろえる。',
    'これは「鼻にちょいがけ」に見える形。サングラスにしない。レンズを黒く塗らない。'
  ],
  mustache: '口の上。幅 0.44W／高さ 0.05W の横一文字（箱）。'
    + '端に幅0.07W × 高さ0.08W の箱を少し下へ垂らす。顎髭は描かない。',
  mouth: '横に大きく開ける（幅 0.48W）。中は赤 #C6392F の箱。上の歯を白い帯（箱）で1本入れる。',
  leopard: [
    '下地 #FFD400。斑点 #141414。',
    '**斑点は四角**（一辺 0.09W）。丸にしない。',
    '横の間隔 0.20W、縦の間隔 0.17W。互い違いにずらす（縦にそろえない）。',
    '胴の範囲だけに置く。1体あたり12〜18個。増やしすぎない。'
  ],
  colors: '肌 #FDC7A9／肌の影 #E7A483／髪と眼鏡と口髭 #141212／ヒョウ柄の下地 #FFD400／斑点 #141412／口の中 #C6392F／歯と靴 #FFFFFF',
  ng: '丸・楕円・曲線で描く／サングラス／色眼鏡／坊主頭／長髪／顎髭／全身タイツ／実在の人物の写真をなぞる／公式ロゴ'
};

/* 目は全ポーズで「細めた横線」のまま。口だけ開く。この組み合わせが「似ている」の核。
   （実測：参考にした絵はどれも、口は大きく開き、目は細めたまま） */
const FACE_RULE = '目は細めた横線のまま動かさない。変えるのは口の開きだけ。'
  + '笑って目を三日月にすると、別のキャラになる。';

/* ポーズ12種。演出の状態と1対1で対応させる（スケール誇張とセットで使う） */
const PICO_POSES = [
  {id:'idle',    name:'立ち',     how:'まっすぐ。足は閉じぎみ（split 0.00）。口を少し開ける。傾き0度。'},
  {id:'run',     name:'走り',     how:'体を前へ8度傾ける。足を少し開く（split 0.10）。口を半開き。'},
  {id:'jump',    name:'跳び',     how:'**縦に伸びる（sx0.85／sy1.15）**。足を閉じる（split 0.06）。口を大きく開ける。'},
  {id:'land',    name:'着地',     how:'**縦に潰れる（sx1.20／sy0.80）**。足を大きく開く（split 0.16）。口を半開き。'},
  {id:'hit',     name:'被弾',     how:'上体を後ろへ12度。足は閉じる（split 0.02）。口を開ける。目は細めたまま。'},
  {id:'success', name:'成功',     how:'上体を後ろへ4度。足を開く（split 0.12）。口を最大に開ける。'},
  {id:'fail',    name:'失敗',     how:'上体を前へ10度。足を少し開く（split 0.04）。口は閉じる。目はそのまま。'},
  {id:'dance',   name:'リズム',   how:'足を大きく開く（split 0.20）。傾き0。胴を左右に振る。口を半開き。'},
  {id:'cheer',   name:'ガッツポーズ', how:'**上に伸びる（sx0.90／sy1.18）**。足を開く（split 0.14）。口を最大に開ける。'},
  {id:'slip',    name:'すべり',   how:'上体を後ろへ26度。足を最大に開く（split 0.24）。口を大きく開ける。'},
  {id:'peek',    name:'のぞきこむ', how:'上体を前へ14度。足は閉じる（split 0.02）。口を小さく開ける。'},
  {id:'dizzy',   name:'目を回す', how:'上体を右へ12度。足を開く（split 0.18）。口は半開き。'}
];

const POSE_BY_GENRE = {
  g_rhythm:'dance', g_fishing:'idle', g_wall:'hit', g_batting:'run', g_putting:'idle',
  g_tsubo:'success', g_haystack:'peek', g_gun:'idle', g_shot:'run', g_platy:'slip',
  g_otoshimono:'dizzy', g_puzzact:'cheer', g_horde:'hit', g_run:'run', g_run3d:'run'
};

/* この企画で使うポーズを決定的に選ぶ（乱数なし） */
function pickPoses(plan){
  const ids = ['idle','jump','land','success','fail'];
  const extra = POSE_BY_GENRE[plan.genreId];
  if(extra && ids.indexOf(extra)<0) ids.push(extra);
  if(ids.length<6 && ids.indexOf('run')<0) ids.push('run');
  return PICO_POSES.filter(p=>ids.indexOf(p.id)>=0);
}

/* 素材シート用の短い版。長くすると画像AIに断られるので、比率だけ4行に絞る */
function picoSpecShort(){
  return [
    '頭身は2.0頭身（頭が大きい）。頭の幅を1.00としたとき、高さ1.28。腕・脚・手は描かない。',
    '顔の目盛り（頭頂0.00→顎1.00）：生え際0.18／眉0.31／目0.38／鼻0.51／口髭0.58／口0.67。',
    'すべて四角（矩形）で描く。丸・楕円・曲線を使わない。この形がピコ太郎の記号。',
    '眼鏡は黒縁の横長（幅0.36・高さ0.16）。上端は目の中心より少し下（ちょいがけ）。中は透明で目が見える。',
    '口は横に大きく開け、目は細い横線のまま。ヒョウ柄は一辺0.09の黒い四角を互い違いに12〜18個。'
  ].join('\n');
}

/* ==================================================================
   【旧】曲線版の描画コード。**もう使わない。プロンプトにも出さない。**
   実測（2026-10-30）：1体あたり 508 命令／ソース 11,495 字。
   これが WEBプロンプトの 45.3% を占め、ジャンプ（79.8%地点）・
   クネクネ（85.1%地点）・エフェクトの指示を後ろへ押し出していた。
   残しているのは記録用。下の四角版（drawPico）が本体。
   ================================================================== */
function drawPicoCurved(ctx, x, y, s, pose, sx, sy, dir){
  /* 旧・曲線版。残してあるが、プロンプトには出さない（下の四角版を使う）。
     理由（実測）：1体あたり508命令・ソース11,495字。プロンプトの45%を占め、
     ジャンプ・クネクネ・エフェクトの指示を後ろへ押し出していた。 */
  var C = {skin:'#FDC7A9', skin2:'#E7A483', ink:'#141212', ink2:'#2A2522',
           leo:'#FFD400', leo2:'#D8B300', spot:'#141412', mouth:'#C6392F', white:'#FFFFFF'};
    /* 角度：0=右、90=上、270=下 */
  var POSES = {
    idle:    {lean:0,  aL:[250,265], aR:[290,275], lL:[265,265], lR:[275,275], mouth:0.35},
    run:     {lean:8,  aL:[215,240], aR:[325,300], lL:[300,285], lR:[240,255], mouth:0.50},
    jump:    {lean:0,  aL:[150,140], aR:[30,40],   lL:[275,270], lR:[265,270], mouth:0.70},
    land:    {lean:4,  aL:[200,215], aR:[340,325], lL:[245,215], lR:[295,325], mouth:0.55},
    hit:     {lean:-12,aL:[215,235], aR:[325,305], lL:[262,268], lR:[278,272], mouth:0.60},
    success: {lean:-4, aL:[120,110], aR:[60,70],   lL:[300,270], lR:[270,278], mouth:1.00},
    fail:    {lean:10, aL:[255,270], aR:[285,270], lL:[250,230], lR:[290,310], mouth:0.00},
    dance:   {lean:0,  aL:[160,120], aR:[300,340], lL:[280,270], lR:[260,270], mouth:0.65},
    cheer:   {lean:-6, aL:[110,105], aR:[70,75],   lL:[268,268], lR:[272,272], mouth:1.00},
    slip:    {lean:-26,aL:[200,150], aR:[340,30],  lL:[300,250], lR:[240,290], mouth:0.85},
    peek:    {lean:14, aL:[210,150], aR:[330,30],  lL:[265,265], lR:[275,275], mouth:0.30},
    dizzy:   {lean:12, aL:[280,300], aR:[260,240], lL:[250,240], lR:[290,300], mouth:0.45}
  };
  var p = POSES[pose] || POSES.idle;
  var H = 3.05;                       /* 全高（頭の幅=1.00 の単位）。頭1.28 → 2.38頭身 */
  var Y = function(v){ return v - H; };  /* 頭頂0 → 足元H を、足元原点へ */

  /* ---- 顔の目盛り（PICO_SPEC と同じ数字。ここが「似せる」の唯一の根拠） ----
     頭頂 0.00 → 顎 1.28（高さ 1.28W）。この区間を 0.00〜1.00 として置く。 */
  var HEAD_TOP = 0.00, HEAD_BOT = 1.28;
  var FY = function(f){ return HEAD_TOP + f * (HEAD_BOT - HEAD_TOP); };
  var F = {hairline:FY(0.18), brow:FY(0.31), eye:FY(0.38), nose:FY(0.51),
           mustache:FY(0.58), mouth:FY(0.67)};

  var D = (dir === -1) ? -1 : 1;      /* 左右反転（ポーズの向きを増やす） */

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (sx || 1) * D, s * (sy || 1));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.rotate(-p.lean * Math.PI / 180 * D);   /* 前傾・のけぞり */

  /* --- 手足：棒人間に見せないため、袖とズボンは「黒縁＋色」の2重ストロークで描く --- */
  var limb = function(x1, y1, l1, a1, l2, a2, w, col, ol){
    var r1 = a1 * Math.PI / 180, r2 = a2 * Math.PI / 180;
    var ex = x1 + Math.cos(r1) * l1, ey = y1 - Math.sin(r1) * l1;
    var hx = ex + Math.cos(r2) * l2, hy = ey - Math.sin(r2) * l2;
    if(ol){
      ctx.strokeStyle = C.ink; ctx.lineWidth = w + ol;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    }
    ctx.strokeStyle = col; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    return [hx, hy];
  };
  var hand = function(pt, col){
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(pt[0], pt[1], 0.095, 0, 6.284); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.028; ctx.stroke();
  };

  /* --- 奥の腕・脚（奥は少し暗くする） --- */
  var armL = limb(-0.46, Y(1.52), 0.48, p.aL[0], 0.44, p.aL[1], 0.15, C.leo2, 0.06);
  limb(-0.17, Y(2.20), 0.38, p.lL[0], 0.34, p.lL[1], 0.18, C.leo2, 0.06);
  limb( 0.17, Y(2.20), 0.38, p.lR[0], 0.34, p.lR[1], 0.18, C.leo2, 0.06);
  hand(armL, C.skin2);

  /* --- 靴（白・つま先を少しとがらせる） --- */
  var shoe = function(hx, hy, dir){
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.moveTo(hx - 0.11, hy);
    ctx.lineTo(hx + 0.11, hy);
    ctx.lineTo(hx + 0.11 + dir * 0.21, hy + 0.10);
    ctx.lineTo(hx - 0.11 + dir * 0.11, hy + 0.13);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.030; ctx.stroke();
  };
  var legL = [-0.17, Y(2.20)], legR = [0.17, Y(2.20)];
  var kneeL = [legL[0] + Math.cos(p.lL[0]*Math.PI/180)*0.38, legL[1] - Math.sin(p.lL[0]*Math.PI/180)*0.38];
  var kneeR = [legR[0] + Math.cos(p.lR[0]*Math.PI/180)*0.38, legR[1] - Math.sin(p.lR[0]*Math.PI/180)*0.38];
  var footL = [kneeL[0] + Math.cos(p.lL[1]*Math.PI/180)*0.34, kneeL[1] - Math.sin(p.lL[1]*Math.PI/180)*0.34];
  var footR = [kneeR[0] + Math.cos(p.lR[1]*Math.PI/180)*0.34, kneeR[1] - Math.sin(p.lR[1]*Math.PI/180)*0.34];
  shoe(footL[0], footL[1], -1);
  shoe(footR[0], footR[1], 1);

  /* --- 胴（ヒョウ柄）。柄は胴の形でマスクする --- */
  var torso = function(){
    ctx.beginPath();
    ctx.moveTo(-0.50, Y(1.40));
    ctx.quadraticCurveTo(-0.44, Y(2.20), -0.26, Y(2.22));
    ctx.lineTo(0.26, Y(2.22));
    ctx.quadraticCurveTo(0.44, Y(2.20), 0.50, Y(1.40));
    ctx.quadraticCurveTo(0, Y(1.32), -0.50, Y(1.40));
    ctx.closePath();
  };
  torso(); ctx.fillStyle = C.leo; ctx.fill();
  ctx.save(); torso(); ctx.clip();
  ctx.fillStyle = C.spot;
  var i, j, n = 0;
  for(j = 0; j < 6; j++){
    for(i = 0; i < 4; i++){
      if(n++ > 17) break;
      var px = -0.46 + i * 0.16 + (j % 2 ? 0.08 : 0);
      var py = Y(1.42) + j * 0.14;
      ctx.beginPath();
      ctx.moveTo(px + 0.023, py);
      ctx.lineTo(px + 0.011, py + 0.021);
      ctx.lineTo(px - 0.014, py + 0.014);
      ctx.lineTo(px - 0.023, py - 0.006);
      ctx.lineTo(px - 0.006, py - 0.021);
      ctx.lineTo(px + 0.019, py - 0.017);
      ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
  torso(); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.035; ctx.stroke();

  /* --- 首（幅0.26W。ほぼ見えない長さ） --- */
  ctx.fillStyle = C.skin2;
  ctx.fillRect(-0.13, Y(1.10), 0.26, 0.26);

  /* --- 頭：幅の表から輪郭を作る（数値で決まるので毎回同じ形になる） ---
     左半分の (高さ, 半幅) を上から下へ並べ、顎で閉じて右半分を戻す。
     実測で「下ぶくれ」だったので、顎に向かって細く落ちる表に置き換えた。
     仕様：最大幅 1.00W（頬骨あたり）／顎 0.52W／高さ 1.28W。 */
  var PROFILE = [
    [0.00, 0.000], [0.05, 0.260], [0.12, 0.400], [0.20, 0.455],
    [0.28, 0.480], [0.38, 0.495], [0.46, 0.500], [0.55, 0.487],
    [0.65, 0.455], [0.75, 0.410], [0.85, 0.360], [0.95, 0.310],
    [1.05, 0.285], [1.15, 0.268], [1.24, 0.260]
  ];
  var head = function(){
    var pts = PROFILE.map(function(q){ return [-q[1], Y(q[0])]; });
    var n = pts.length, k, mx, my;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for(k = 1; k < n - 1; k++){                     /* 左半分を上から下へ */
      mx = (pts[k][0] + pts[k+1][0]) / 2;
      my = (pts[k][1] + pts[k+1][1]) / 2;
      ctx.quadraticCurveTo(pts[k][0], pts[k][1], mx, my);
    }
    var lastL = pts[n - 1];                          /* 顎下を回り込む */
    ctx.quadraticCurveTo(lastL[0], Y(1.33), 0, Y(1.345));
    ctx.quadraticCurveTo(-lastL[0], Y(1.33), -lastL[0], lastL[1]);
    for(k = n - 2; k >= 1; k--){                    /* 右半分を下から上へ */
      mx = (-pts[k][0] - pts[k-1][0]) / 2;
      my = (pts[k][1] + pts[k-1][1]) / 2;
      ctx.quadraticCurveTo(-pts[k][0], pts[k][1], mx, my);
    }
    ctx.quadraticCurveTo(0, pts[0][1], pts[0][0], pts[0][1]);
    ctx.closePath();
  };
  /* 耳（顔の横。外側の端が頭の最大幅を超えないように置く。
     超えると「頭が横に広い」と測られる＝下ぶくれ・横広に見える原因になる） */
  var ear = function(sgn){
    ctx.beginPath();
    ctx.ellipse(sgn * 0.452, Y(0.50), 0.045, 0.100, 0, 0, 6.284);
    ctx.fillStyle = C.skin; ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.026; ctx.stroke();
  };
  ear(-1); ear(1);
  head(); ctx.fillStyle = C.skin; ctx.fill();
  head(); ctx.strokeStyle = C.ink; ctx.lineWidth = 0.035; ctx.stroke();

  /* --- 鼻（幅0.26W。小鼻を2つの丸で） --- */
  ctx.fillStyle = C.skin2;
  ctx.beginPath(); ctx.arc(-0.065, Y(F.nose), 0.055, 0, 6.284); ctx.fill();
  ctx.beginPath(); ctx.arc( 0.065, Y(F.nose), 0.055, 0, 6.284); ctx.fill();

  /* --- 目：細めた横線（幅0.28W・間隔0.16W・全ポーズ共通） --- */
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.045;
  ctx.beginPath(); ctx.moveTo(-0.36, Y(F.eye)); ctx.lineTo(-0.08, Y(F.eye)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 0.08, Y(F.eye)); ctx.lineTo( 0.36, Y(F.eye)); ctx.stroke();
  /* 眉（薄く1本。目との距離で顔の印象が決まる） */
  ctx.strokeStyle = 'rgba(20,18,18,0.55)'; ctx.lineWidth = 0.030;
  ctx.beginPath(); ctx.moveTo(-0.34, Y(F.brow)); ctx.lineTo(-0.10, Y(F.brow)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 0.10, Y(F.brow)); ctx.lineTo( 0.34, Y(F.brow)); ctx.stroke();

  /* --- 口髭（幅0.44W・太さ0.05W・端は少し下へ垂らす） --- */
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.050;
  ctx.beginPath();
  ctx.moveTo(-0.22, Y(F.mustache + 0.035));
  ctx.quadraticCurveTo(-0.11, Y(F.mustache - 0.012), 0, Y(F.mustache + 0.005));
  ctx.quadraticCurveTo(0.11, Y(F.mustache - 0.012), 0.22, Y(F.mustache + 0.035));
  ctx.stroke();

  /* --- 口：幅0.48W。開き量 p.mouth（0=閉じる、1=最大） --- */
  var mo = p.mouth;
  if(mo < 0.05){
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.040;
    ctx.beginPath(); ctx.moveTo(-0.20, Y(F.mouth)); ctx.lineTo(0.20, Y(F.mouth)); ctx.stroke();
  } else {
    var mw = 0.24 * (0.72 + 0.28 * mo), mh = 0.21 * mo;
    ctx.fillStyle = C.mouth;
    ctx.beginPath();
    ctx.ellipse(0, Y(F.mouth), mw, mh, 0, 0, 6.284);
    ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = 0.030; ctx.stroke();
    /* 上の歯（白い帯を1本） */
    ctx.save();
    ctx.beginPath(); ctx.ellipse(0, Y(F.mouth), mw, mh, 0, 0, 6.284); ctx.clip();
    ctx.fillStyle = C.white;
    ctx.fillRect(-mw, Y(F.mouth) - mh, mw * 2, mh * 0.42);
    ctx.restore();
  }

  /* --- 髪：平らな箱の角刈りパンチ（生え際 0.18 で水平に切る） --- */
  var HL = F.hairline;
  ctx.fillStyle = C.ink;
  ctx.beginPath();
  ctx.moveTo(-0.47, Y(HL));
  ctx.lineTo(-0.47, Y(-0.01));
  ctx.quadraticCurveTo(-0.47, Y(-0.045), -0.40, Y(-0.045));
  ctx.lineTo(0.40, Y(-0.045));
  ctx.quadraticCurveTo(0.47, Y(-0.045), 0.47, Y(-0.01));
  ctx.lineTo(0.47, Y(HL + 0.02));
  ctx.quadraticCurveTo(0, Y(HL - 0.02), -0.47, Y(HL));
  ctx.closePath(); ctx.fill();
  /* パンチの波（てっぺんの縁に4個。つるっとさせない） */
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 0.030;
  ctx.beginPath();
  ctx.moveTo(-0.34, Y(-0.005));
  ctx.quadraticCurveTo(-0.28, Y(-0.055), -0.22, Y(-0.005));
  ctx.quadraticCurveTo(-0.16, Y(-0.055), -0.10, Y(-0.005));
  ctx.quadraticCurveTo(-0.04, Y(-0.055), 0.02, Y(-0.005));
  ctx.quadraticCurveTo(0.08, Y(-0.055), 0.14, Y(-0.005));
  ctx.quadraticCurveTo(0.20, Y(-0.055), 0.26, Y(-0.005));
  ctx.quadraticCurveTo(0.32, Y(-0.055), 0.36, Y(-0.005));
  ctx.stroke();
  /* こめかみ下は刈り上げ（肌に近い色・幅0.06W）。もみあげは耳の手前で止める */
  ctx.fillStyle = 'rgba(20,18,18,0.30)';
  ctx.fillRect(-0.47, Y(HL), 0.07, 0.30);
  ctx.fillRect( 0.40, Y(HL), 0.07, 0.30);

  /* --- 眼鏡：黒縁の角丸。レンズは透明で目が透ける ---
     上端は目の中心の 0.03W 上、下端は鼻の先（0.51）に来る。
     つまりレンズの下っ側が鼻に乗る形になり、これが「鼻にちょいがけ」に見える。 */
  var lensW = 0.36, lensH = F.nose - (F.eye - 0.03), topY = F.eye - 0.03;
  var lens = function(cx){
    ctx.beginPath();
    var lx = cx - lensW / 2, ly = Y(topY);
    var r = 0.05;
    ctx.moveTo(lx + r, ly);
    ctx.lineTo(lx + lensW - r, ly);
    ctx.quadraticCurveTo(lx + lensW, ly, lx + lensW, ly + r);
    ctx.lineTo(lx + lensW, ly + lensH - r);
    ctx.quadraticCurveTo(lx + lensW, ly + lensH, lx + lensW - r, ly + lensH);
    ctx.lineTo(lx + r, ly + lensH);
    ctx.quadraticCurveTo(lx, ly + lensH, lx, ly + lensH - r);
    ctx.lineTo(lx, ly + r);
    ctx.quadraticCurveTo(lx, ly, lx + r, ly);
    ctx.closePath();
  };
  ctx.fillStyle = 'rgba(255,255,255,0.34)';
  lens(-0.22); ctx.fill();
  lens( 0.22); ctx.fill();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 0.030;
  lens(-0.22); ctx.stroke();
  lens( 0.22); ctx.stroke();
  /* ブリッジとつる */
  ctx.beginPath();
  ctx.moveTo(-0.04, Y(topY + 0.05)); ctx.lineTo(0.04, Y(topY + 0.05));
  ctx.moveTo(-0.40, Y(topY + 0.05)); ctx.lineTo(-0.50, Y(topY + 0.02));
  ctx.moveTo( 0.40, Y(topY + 0.05)); ctx.lineTo( 0.50, Y(topY + 0.02));
  ctx.stroke();

  /* --- 手前の腕（袖もヒョウ柄。手だけ肌） --- */
  var armR = limb(0.46, Y(1.52), 0.48, p.aR[0], 0.44, p.aR[1], 0.16, C.leo, 0.06);
  hand(armR, C.skin);
  ctx.restore();
}

/* ==================================================================
   ピコ太郎の描画コード（四角版・これが本体）
   Canvas 2D・図形のみ・外部変数なし。
   この1つの関数を、WEBプロトのプロンプトに「そのまま使え」と渡す。
   座標系：x,y = 足元の位置／s = 頭の幅（1.00 = s ピクセル）

   **なぜ四角に戻したか（2026-10-30 実測）**
   曲線版は 1体 508 命令・ソース 11,495 字で、WEBプロンプトの 45.3% を占有。
   その結果、ジャンプ（79.8%地点）・クネクネ（85.1%地点）・粒の指示が後ろに押し出され、
   生成側が「キャラを描くこと」に全力を使って、動きと演出が抜けた。
   四角版は 約120 命令（4分の1以下）で、同じ顔の記号（角刈り・黒縁眼鏡・口髭・ヒョウ柄）を保つ。

   **変えてはいけないもの（ここが「ピコ太郎に見える」の根拠）**
   ① 髪：てっぺんが平らな箱（角刈りパンチ）。丸くしない。
   ② 眼鏡：黒縁の横長。レンズは透けて目が見える。
   ③ 掛け方：レンズの下端が鼻の先そろえ（鼻にちょいがけ）。
   ④ 口髭：口の上に横一文字。顎髭は無し。
   ⑤ 服：黄色の下地に黒い四角の斑点（ヒョウ柄）。
   ⑥ 目は全ポーズで細い横線のまま。口だけ開く。
   ================================================================== */
function drawPico(ctx, x, y, s, pose, sx, sy, dir){
  var C = {skin:'#FDC7A9', skin2:'#E7A483', ink:'#141212', ink2:'#5A5550',
           leo:'#FFD400', spot:'#141412', mouth:'#C6392F', white:'#FFFFFF'};
  /* 手足は持たない。ポーズは「傾き・口の開き・足の開き」の3つだけで作る。
     実測（2026-10-31・tools/pico_cost_check.html）：
       描画命令 209 → 137（34%減）。**この数は毎回同じ**（決定的）。
       実時間は実行ごとにぶれる（5回測って 1体3分割 0.087〜0.135ms）。
       命令数だけを見ること。実時間の1回の測定値を信用しない。
     手足を外してもピコ太郎に見えるのは、顔の記号（角刈り・黒縁眼鏡・口髭・ヒョウ柄）が
     残るため。手足は動きを伝えないので、落としても情報が失われない。
     動きは「拡縮（sx/sy）＋傾き（lean）＋足の開き（split）」で作る。 */
  var POSES = {
    idle:    {lean:0,  mouth:0.35, split:0.00},
    run:     {lean:8,  mouth:0.50, split:0.10},
    jump:    {lean:0,  mouth:0.70, split:0.06},
    land:    {lean:4,  mouth:0.55, split:0.16},
    hit:     {lean:-12,mouth:0.60, split:0.02},
    success: {lean:-4, mouth:1.00, split:0.12},
    fail:    {lean:10, mouth:0.00, split:0.04},
    dance:   {lean:0,  mouth:0.65, split:0.20},
    cheer:   {lean:-6, mouth:1.00, split:0.14},
    slip:    {lean:-26,mouth:0.85, split:0.24},
    peek:    {lean:14, mouth:0.30, split:0.02},
    dizzy:   {lean:12, mouth:0.45, split:0.18}
  };
  var p = POSES[pose] || POSES.idle;
  var H = 2.50;   /* 全高（頭の幅=1.00）。頭1.28＋胴0.86＋足0.36 ≒ 2.50（≒2.0頭身） */
  var Y = function(v){ return v - H; };
  var D = (dir === -1) ? -1 : 1;

  /* 顔の目盛り：頭頂0.00 → 顰1.28 を 0.00〜1.00 として置く */
  var HEAD_BOT = 1.28;
  var FY = function(f){ return f * HEAD_BOT; };
  var F = {hairline:FY(0.18), brow:FY(0.31), eye:FY(0.38), nose:FY(0.51),
           mustache:FY(0.58), mouth:FY(0.67)};

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (sx || 1) * D, s * (sy || 1));
  ctx.rotate(-p.lean * Math.PI / 180 * D);

  /* box = 中心(cx,cy)の矩形。boxO = 黒縁つきの矩形。全部これだけで描く。 */
  var box = function(cx, cy, w, h, col){
    ctx.fillStyle = col;
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  };
  var boxO = function(cx, cy, w, h, col, ol){
    ctx.fillStyle = C.ink;
    ctx.fillRect(cx - w / 2 - ol, cy - h / 2 - ol, w + ol * 2, h + ol * 2);
    ctx.fillStyle = col;
    ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  };
  /* --- 足（白い箱2つ）。開き具合 split だけがポーズで変わる ---
     底がちょうど y=0（足元原点）に来るように置く。ここがズレると接地して見えない。 */
  var fs = p.split;
  boxO(-0.24 - fs, Y(2.38), 0.34, 0.24, C.white, 0.03);
  boxO( 0.24 + fs, Y(2.38), 0.34, 0.24, C.white, 0.03);

  /* --- 胴（箱を2段。黃の下地に黒い四角の斑点＝ヒョウ柄） --- */
  boxO(0, Y(1.54), 1.00, 0.52, C.leo, 0.035);
  boxO(0, Y(2.01), 0.86, 0.42, C.leo, 0.035);
  var j, i, px, py, lim;
  for(j = 0; j < 5; j++){
    py = Y(1.42 + j * 0.17);
    lim = (j < 2) ? 0.42 : 0.36;
    for(i = 0; i < 4; i++){
      px = -0.30 + i * 0.20 + (j % 2 ? 0.10 : 0);
      if(Math.abs(px) + 0.05 > lim) continue;
      box(px, py, 0.09, 0.09, C.spot);
    }
  }

  /* --- 首（ほぼ見えない） --- */
  boxO(0, Y(1.20), 0.26, 0.26, C.skin2, 0.03);

  /* --- 頭（四角）と耳 --- */
  boxO(0, Y(0.64), 1.00, 1.28, C.skin, 0.035);
  boxO(-0.52, Y(0.50), 0.07, 0.20, C.skin, 0.026);
  boxO( 0.52, Y(0.50), 0.07, 0.20, C.skin, 0.026);

  /* --- 髪：てっぺんが平らな箱（角刈りパンチ）。丸めない --- */
  boxO(0, Y(F.hairline / 2), 1.00, F.hairline, C.ink, 0.022);
  box(0, Y(-0.015), 0.98, 0.05, C.ink);
  /* パンチの波：上端に3つの刻み。つるっとさせない */
  box(-0.22, Y(-0.042), 0.10, 0.035, '#4A4545');
  box( 0.00, Y(-0.042), 0.10, 0.035, '#4A4545');
  box( 0.22, Y(-0.042), 0.10, 0.035, '#4A4545');
  /* こめかみ下は刈り上げ（肌に近い色） */
  box(-0.45, Y(F.hairline + 0.13), 0.08, 0.26, C.skin2);
  box( 0.45, Y(F.hairline + 0.13), 0.08, 0.26, C.skin2);

  /* --- 眉と目：細い横線（全ポーズ共通） --- */
  box(-0.22, Y(F.brow), 0.24, 0.030, C.ink2);
  box( 0.22, Y(F.brow), 0.24, 0.030, C.ink2);
  box(-0.22, Y(F.eye), 0.28, 0.050, C.ink);
  box( 0.22, Y(F.eye), 0.28, 0.050, C.ink);

  /* --- 鼻（四角1つ） --- */
  box(0, Y(F.nose), 0.26, 0.11, C.skin2);

  /* --- 口髭：横一文字。端を少し下へ垂らす。顰髭は無し --- */
  box(0, Y(F.mustache), 0.44, 0.05, C.ink);
  box(-0.21, Y(F.mustache + 0.03), 0.07, 0.08, C.ink);
  box( 0.21, Y(F.mustache + 0.03), 0.07, 0.08, C.ink);

  /* --- 口：開き量 p.mouth（0=閉じる、1=最大） --- */
  var mo = p.mouth;
  if(mo < 0.05){
    box(0, Y(F.mouth), 0.40, 0.04, C.ink);
  } else {
    var mw = 0.48 * (0.75 + 0.25 * mo), mh = 0.21 * mo;
    boxO(0, Y(F.mouth), mw, mh, C.mouth, 0.028);
    box(0, Y(F.mouth - mh * 0.26), mw * 0.84, mh * 0.34, C.white);
  }

  /* --- 眼鏡：黒縁の横長。中は透けて目が見える（鼻にちょいがけ） ---
     黒で塗りつぶすと目が消えるので、枠を4本の矩形で描き、中は半透明で重ねる。 */
  var gTop = F.eye - 0.03, gH = F.nose - gTop, gCy = gTop + gH / 2;
  var frame = function(cx){
    box(cx, Y(gTop), 0.42, 0.030, C.ink);
    box(cx, Y(gTop + gH), 0.42, 0.030, C.ink);
    box(cx - 0.195, Y(gCy), 0.030, gH, C.ink);
    box(cx + 0.195, Y(gCy), 0.030, gH, C.ink);
    box(cx, Y(gCy), 0.36, gH, 'rgba(255,255,255,0.28)');
  };
  frame(-0.22); frame(0.22);
  box(0, Y(gCy), 0.10, 0.030, C.ink);
  box(-0.46, Y(gCy), 0.12, 0.030, C.ink);
  box( 0.46, Y(gCy), 0.12, 0.030, C.ink);

  ctx.restore();
}
const PICO_DRAW_SRC = drawPico.toString();

/* ------------------------------------------------------------------
   参考イラストを「素材として置く」ための差し込み口。
   既定は enabled:false（＝drawPico の図形描画だけで動く）。
   先生が手元の参考イラストを用意して pico-ref.png として置いたときだけ、
   enabled を true にすると、WEBプロトのプロンプトが画像素材を使う指示に切り替わる。
   ※ 実在の人物の写真・公式素材は置かない（README の IP 節と同じ規則）。
   ------------------------------------------------------------------ */
const PICO_ART = {
  enabled: false,
  path: 'assets/v2/pico/pico-ref.png',
  note: '任意。置かない場合は drawPico の図形描画だけで動く（既定）。'
};

function picoArtBlock(plan){
  if(!PICO_ART.enabled) return '';
  return `【参考イラストを素材として使う（差し込み済み・この指示が優先）】
・画像ファイルは ${PICO_ART.path} の1枚だけ。複製してポーズを増やさない。
・<img src="${PICO_ART.path}" alt=""> を1つ置き、幅を HEAD × 3.4px に固定する（HEAD は TUNING.picoSize）。
・縦横比を変えない。width と height を両方指定しない（片方だけにする）。
・image-rendering: pixelated は使わない。ドット絵ではないため。
・着地・ジャンプの潰れは、画像ではなく親要素に transform: scale(sx, sy) を掛ける
  （transform-origin: bottom center）。画像自体の比率は触らない。
・画像が読めなかったとき（onerror）は drawPico(ctx, ...) に自動で切り替える。
  画像が無い状態でも最後まで遊べること。
・この画像を見本として画面に常時表示しない。素材として置くだけ。`;
}

function picoSpecBlock(){
  const L = [];
  L.push('【体の比率】'); PICO_SPEC.body.forEach(x=>L.push('・'+x));
  L.push('【顔の目盛り】'); PICO_SPEC.face.forEach(x=>L.push('・'+x));
  L.push('【髪（角刈り）】'); PICO_SPEC.hair.forEach(x=>L.push('・'+x));
  L.push('【眼鏡（ちょいがけ）】'); PICO_SPEC.glasses.forEach(x=>L.push('・'+x));
  L.push('【口髭】・'+PICO_SPEC.mustache);
  L.push('【口】・'+PICO_SPEC.mouth);
  L.push('【ヒョウ柄】'); PICO_SPEC.leopard.forEach(x=>L.push('・'+x));
  L.push('【色】・'+PICO_SPEC.colors);
  L.push('【やってはいけない】・'+PICO_SPEC.ng);
  return L.join('\n');
}

function poseBlock(plan){
  return pickPoses(plan).map(p=>'・'+p.name+'：'+p.how).join('\n');
}

/* 1枚絵で取るポーズ（ジャンルで決まる・決定的） */
function heroPose(plan){
  const want = POSE_BY_GENRE[plan.genreId] || 'success';
  return PICO_POSES.filter(p=>p.id===want)[0] || PICO_POSES[5];
}

/* 8状態ぶんのバリエーション。WEBプロトは状態で絵を差し替える */
function poseAllBlock(){
  return PICO_POSES.map(p=>'・'+p.id+'（'+p.name+'）：'+p.how).join('\n');
}

/* ------------------------------------------------------------------
   「面白さ」の3点セット。
   ここが空だと、どのジャンルを選んでも同じ説明文になり、
   出力を読んだ学生には「どの案もつまらない」に見える。
   ------------------------------------------------------------------ */
const FUN_RULE = `「つまらない」の原因は、たいてい中身ではなく「触った瞬間に何が起きるか」が決まっていないことです。
次の3つが決まっていれば、同じルールでも別のゲームになります。
・0秒の1手＝起動して最初の1操作で、必ず何かが起きる（説明を読ませない）
・山場＝1プレイに1回、スクショで伝わる画が来る
・もう一回の理由＝失敗したときに「今のは惜しい、次はこうする」が1行で分かる`;

function funBlock(plan){
  return `【0秒の1手（触った瞬間に起きること）】
${plan.kick || '（未設定）'}

【山場（1プレイに1回、必ず来る画）】
${plan.spike || '（未設定）'}

【もう一回の理由（失敗したときに必ず1行で出す）】
${plan.again || '（未設定）'}`;
}

/* ------------------------------------------------------------------
   リズムだけの追加仕様。「音に合わせて叩く」だけでは、叩いている感じしかしない。
   叩いた分だけ曲に層が増える形にして、手で曲を作っている状態にする。
   ------------------------------------------------------------------ */
const MUSIC_SPEC = `4本のレーンは、4つの楽器。叩いた分だけ曲に層が増える。
・BPM128・4拍子。1小節＝1.875秒。30秒＝16小節ぶん。
・ノーツは 1小節あたり各レーン1個（計4個）。8小節で1周（15秒）。
・レーン1（左）：キック。低い「ドン」。音量 0 → 0.35 → 0.70 → 1.00 の4段階。
・レーン2：スネア。乾いた「タン」。
・レーン3：ベース。持続する低音「ボーン」。レーン3を叩くと、次の小節から鳴り続ける。
・レーン4（右）：メロディ。高い「ピコッ」。4レーンそろうと、この音が一番上で鳴る。
・叩くと、そのレーンの音量が1段階上がる。ミスすると、そのレーンだけ1段階下がる（0より下がらない）。
・レーンが光るのは、その楽器が鳴った瞬間だけ。常時光らせない。
・**山場＝最初に4レーンが同時に鳴った小節（1プレイに1回だけ）。**4レーンが同時に光り、4音が重なる。
・**山場が必ず来る保証：**8小節の周の最後の小節で、層が0のレーンを自動で1に上げる。
  だから一度も叩けなくても、遅くとも8小節目（15秒）に山場が来る。放置しても山場は見られる。
・全レーンが3/3/3/3 になった小節は「パーフェクト」。山場とは別の演出で、画面を白く飛ばす（1プレイ1回）。
  パーフェクトを狙わせない。山場と混ぜると、山場でなくなる。
・スマホのスピーカーは200Hz以下がほぼ出ない。低い2音は、そのままだと聞こえない。
  キックにはクリック音を、ベースには倍音を足して、 phone でも4レーンが聞き分けられるようにする。`;

function musicBlock(plan){
  if(!plan.music) return '';
  return `【音楽の作り（このゲームの核。音は「鳴らす」のではなく「重ねる」）】
${plan.music}
${MUSIC_SPEC}`;
}

/* WEBプロト側だけに出す音楽ブロック（Canvas用の実装指示つき） */
function musicWebBlock(plan){
  if(!plan.music) return '';
  return `\n【このゲームの音楽：音を「鳴らす」のではなく「重ねる」】\n`
    + musicBlock(plan) + `\n`
    + `・TUNING.music = { enabled: true, layers: [0,0,0,0], notesPerBarPerLane: 1, spikeFired: false } を持つ。\n`
    + `・playNote(lane) を1つ作り、レーン番号で音色を切り替える。音色は OscillatorNode の type と音程だけで作る。\n`
    + `  レーン1 kick＝sine 60Hz・減衰0.18秒／レーン2 snare＝square 240Hz・減衰0.09秒＋ノイズ\n`
    + `  レーン3 bass＝triangle 110Hz・減衰0.35秒／レーン4 melody＝square 660Hz・減衰0.12秒\n`
    + `・**低い2音はスマホで聞こえない。必ず補正する（実測：200Hz以下はほぼ出ない）**\n`
    + `  キック：60Hzのサインに加えて、同じ時刻に square 900Hz・減衰0.02秒・音量0.12 を重ねる（アタックのクリック）。\n`
    + `  ベース：triangle 110Hz に加えて、triangle 330Hz（第3倍音）を音量0.10で重ねる。\n`
    + `  この2つを入れないと、phone では kick と bass が消えて「2レーンしか無い」ゲームになる。\n`
    + `・音量段階は gain = [0, 0.10, 0.20, 0.32][layers[lane]]。0なら鳴らさない。\n`
    + `・ヒットで layers[lane] を +1（最大3）、ミスで -1（最小0）。\n`
    + `・**ノーツ密度：1小節あたり各レーン1個（計4個）。**BPM128・4拍子なので1小節＝1.875秒。\n`
    + `  30秒＝16小節。8小節（15秒）で1周。密度を上げると層が0に戻らず、山場が来なくなるので上げない。\n`
    + `・毎小節、layers が1以上のレーンだけを鳴らし続ける（鳴っている層が耳で分かる）。\n`
    + `・**山場＝最初に4レーンが同時に鳴った小節。1プレイに1回だけ。**\n`
    + `  spikeFired が false のとき、4レーン全部の layers が1以上になった小節で発火し、spikeFired = true にする。\n`
    + `  発火した小節は、4レーンを同時に光らせ、4音を同時に鳴らし、画面を0.12秒だけ明るくする。\n`
    + `・**山場が来ないまま終わらせない。**8小節の周の最後の小節で、layers が0のレーンを1に上げる。\n`
    + `  一度も叩けなくても、遅くとも8小節目（15秒）に山場が来る。\n`
    + `・全レーンが3/3/3/3 になった小節は「パーフェクト」として別演出（画面を白く飛ばす）。山場とは混ぜない。\n`
    + `・AudioContext は1つだけ作る。開始時に resume する。`;
}

const LOCK = `この仕様は学生が自分で決めたもの。ジャンル・操作・勝敗条件・制限時間・画面構成を勝手に変えないこと。
あなたの仕事は、この仕様を読みやすく整え、足りない説明（見た目・UI配置・演出のタイミング）を補うことだけ。
別のゲームを提案しない。要素を足す場合も、この仕様の範囲内にとどめる。`;

/* ジューシー（気持ちよさ）の共通ブロック。すべてのプロンプトで同じ5つを使う */
function juiceBlock(plan){
  return (plan.juice||[]).map(j=>`・${j.name}（${j.when}）：${j.how}　※${j.tune}`).join('\n');
}

const JUICE_RULE = `見た目を「気持ちいい」にするのが、この企画の勝ち筋です。
同じ1回の当たりでも、つぶれ・止め・数字・粒を入れるだけで別物になります。
「動くだけ」で終わらせないこと。`;

/* ------------------------------------------------------------------
   演出は必ず入れる。ただし重くしない。
   エフェクトは「毎フレーム配列を作る」書き方をすると、粒が増えた瞬間に
   GC が走ってカクつく（見た目より先に、まず操作感が壊れる）。
   守ることは5つだけ。この5つで、演出を全部入れても軽いまま動く。
   ------------------------------------------------------------------ */
const PERF_RULE = `【重くしない（演出は全部入れる。ただしこの5つを守る）】
① **配列を毎フレーム作らない。**
   parts.filter(...) / popups.filter(...) を update の中に書かない。書くと毎フレーム新しい配列ができ、
   60fpsで毎秒60個のゴミが出る。粒が多い場面ほど、GCでカクつく。
   → parts も popups も**固定長で先に確保**する（parts = new Array(32) / popups = new Array(6)）。
     空き枠（使用中フラグ on=false）を探して使い回す。配列の長さは最後まで変えない。
② **上限を数値で決めて、コードに書く。**
   TUNING.limits = { parts: 30, popups: 6, trail: 3, sparks: 6 }
   上限に達したら「新しく作らない」。古いものを消して入れ替える（上書き）。
   粒が増え続けるのが、いちばん重くなる原因。
③ **ループの外で決まる値は、外で1回だけ計算する。**
   Math.sin / Math.cos / Math.PI*2 / 乱数相当の計算を、粒1個ごとに毎フレームやらない。
   クネクネの sin も、そのフレームで1回だけ計算して、頭・胴・腰で使い回す。
④ **アニメーションループは1本だけ。**
   requestAnimationFrame を複数立てない。setInterval を併用しない。
   描画・更新・掃除は、すべて同じ1本の関数の中で順番に呼ぶ。
⑤ **描画の状態を戻す。**
   ctx.save() したら必ず ctx.restore()。globalCompositeOperation と globalAlpha は、
   演出の描画が終わったら必ず既定値（'source-over' / 1）に戻す。
   戻し忘れると、次のフレームから画面全体が別の見え方になって、どんどん遅くなる。
・確認方法：ブラウザで遊びながら、**画面に粒が30個出ている瞬間のFPS**を見る。
  60fps付近を保てていれば合格。落ちる場合は、まず②の上限を下げる（①〜⑤は変えない）。`;

/* ------------------------------------------------------------------
   参照コード（CORE_CODE）。
   **方針転換（2026-10-31・先生の指示）**：
   これまでは「こう書け」と文章で指定していた。だが生成側は文章を写さない。
   Gemini の修正指示が keys[' '] / spawnParticles() / parts / pt.on / renderPlayScreen()
   という**具体名**で書かれていたのが証拠で、向こうは「名前の決まったコード」が来ないと動かせない。
   そこで、入力・ジャンプ・粒・拡縮・揺れ・止め・数字・画面遷移・ループを
   **俺が1本の完成コードとして書き**、プロンプトに同梱して「これをそのまま貼れ」と言う。
   生成側が書くのは敵・当たり判定・得点（updateGame / drawGameObjects）だけになる。
   実測（tools/v2_core_check.html・実ブラウザ実行）：
     スペース押下で state=TITLE→PLAY・vy=-720・sx=0.82・粒6個が同時に成立。
     空中で押し直しても2回目は跳ばない（jumpLatch）。
     着地で onGround が戻り、もう一度跳べる。RESULT からスペースで再開。
     この数値は実行するたびに同じ（乱数0・決定）。
   ------------------------------------------------------------------ */
const CORE_CODE = `/* ===================================================================
   【参照コード】この1本をそのまま使う（関数名・変数名を変えない・抜粋しない）
   入力・ジャンプ・粒・拡縮・揺れ・止め・数字・画面遷移・ループは、ここで全部つながっている。
   あなたが書くのは updateGame(dt) と drawGameObjects() の中だけ（敵・ゴール・当たり判定・得点）。
   この2つが空のままでも、スペースで跳ねて、着地で潰れて、粒が出るゲームとして動く。
   =================================================================== */
var canvas = document.getElementById('game');   /* canvas の id は game にする */
var ctx = canvas.getContext('2d');
var W = 960, H = 540;
canvas.width = W;        /* ★この2行以外で canvas.width に代入しない（毎フレーム代入＝重い） */
canvas.height = H;

var TUNING = {
  juice: true,           /* false にすると演出が全部止まる（発表で並べて見せる） */
  duration: 30,          /* ★この値が1プレイ秒数。30秒で確定（30秒か、長くても40秒。60秒にしない） */
  gravity: 2100,
  jumpV: 720,
  limits: { parts: 30, popups: 6 },
  fps: 0
};
var GROUND_Y = Math.round(H * 0.86);

var state = 'TITLE';     /* TITLE / PLAY / RESULT */
var timeLeft = TUNING.duration;
var score = 0;
var hitstop = 0;         /* 0より大きい間は更新を止める（秒） */
var flash = 0;           /* 白飛びの残り秒 */
var shakeT = 0, shakeDur = 0, shakeAmp = 0;
var failReason = '';

var player = {
  x: 180, y: GROUND_Y, vy: 0, onGround: true,
  sx: 1, sy: 1, sx0: 1, sy0: 1, sqT: 0, sqDur: 0
};

/* ============ ① 入力（登録は起動時に1回だけ） ============ */
var keys = { ' ':false, ArrowLeft:false, ArrowRight:false, a:false, d:false };
var jumpLatch = false;   /* 押しっぱなしで連続ジャンプしないための札 */
var inputReady = false;

function registerInput(){
  if(inputReady){ return; }        /* ★二重登録しない（リトライで壊れる原因） */
  inputReady = true;

  window.addEventListener('keydown', function(e){
    var k = (e.key || '').length === 1 ? e.key.toLowerCase() : e.key;

    /* ★ preventDefault は関数の先頭で呼ぶ。後ろに書くとページがスクロールする */
    if(k === ' ' || e.code === 'Space' || k === 'ArrowLeft' || k === 'ArrowRight'
       || k === 'ArrowUp' || k === 'ArrowDown'){ e.preventDefault(); }

    if(k === ' ' || e.code === 'Space'){
      if(!keys[' ']){ tryJump(); }  /* 押した瞬間に1回だけ */
      keys[' '] = true;
      return;
    }
    if(k === 'ArrowLeft'  || k === 'a'){ keys.ArrowLeft  = true; return; }
    if(k === 'ArrowRight' || k === 'd'){ keys.ArrowRight = true; return; }
  }, {passive:false});

  window.addEventListener('keyup', function(e){
    var k = (e.key || '').length === 1 ? e.key.toLowerCase() : e.key;
    if(k === ' ' || e.code === 'Space'){ keys[' '] = false; jumpLatch = false; return; }
    if(k === 'ArrowLeft'  || k === 'a'){ keys.ArrowLeft  = false; return; }
    if(k === 'ArrowRight' || k === 'd'){ keys.ArrowRight = false; return; }
  }, {passive:false});

  window.addEventListener('blur', function(){   /* 押しっぱなしが残らないように全消し */
    keys[' '] = false; keys.ArrowLeft = false; keys.ArrowRight = false; jumpLatch = false;
  });

  canvas.addEventListener('pointerdown', function(e){   /* スマホ：上半分タップ＝ジャンプ */
    e.preventDefault();
    var r = canvas.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width;
    var y = (e.clientY - r.top) / r.height;
    if(y < 0.5){ tryJump(); }
    else if(x < 0.5){ keys.ArrowLeft = true; }
    else { keys.ArrowRight = true; }
  }, {passive:false});
  canvas.addEventListener('pointerup', function(){
    keys.ArrowLeft = false; keys.ArrowRight = false; jumpLatch = false;
  });
}

/* ============ ② ジャンプの唯一の入口 ============ */
function tryJump(){
  if(state === 'TITLE' || state === 'RESULT'){ startGame(); }   /* 決定としても使う */
  if(state !== 'PLAY'){ return; }
  if(!player.onGround){ return; }
  if(jumpLatch){ return; }
  player.vy = -TUNING.jumpV;
  player.onGround = false;         /* ★false にしてよいのはここだけ */
  jumpLatch = true;
  squash(0.82, 1.22, 0.14);        /* 離陸：上に伸びる */
  spawnParticles(player.x, player.y, 6, '#FFD400');
}

function startGame(){
  state = 'PLAY';
  timeLeft = TUNING.duration;
  score = 0; failReason = '';
  keys[' '] = false; keys.ArrowLeft = false; keys.ArrowRight = false;
  jumpLatch = false;
  player.x = 180; player.y = GROUND_Y; player.vy = 0; player.onGround = true;
  player.sx = 1; player.sy = 1; player.sqDur = 0;
  hitstop = 0; flash = 0; shakeDur = 0; shakeAmp = 0;
  clearParticles();
  /* ★ゲーム固有の初期化はここに足す（敵・ゴール・残機） */
}

function endGame(reason){
  if(state !== 'PLAY'){ return; }
  state = 'RESULT';
  failReason = reason || '';
  flash = 0.12;
  spawnParticles(player.x, player.y, 12, '#FFD400');
}

/* ============ ③ 拡縮（足元原点・1-(1-t)^3 で戻す） ============ */
function squash(sx, sy, sec){
  if(!TUNING.juice){ return; }
  player.sx0 = Math.min(1.30, Math.max(0.75, sx));   /* ★clamp しないと連打で積もる */
  player.sy0 = Math.min(1.30, Math.max(0.75, sy));
  player.sx = player.sx0; player.sy = player.sy0;
  player.sqT = 0; player.sqDur = sec;
}
function updateSquash(dt){
  if(player.sqDur <= 0){ return; }
  player.sqT += dt;
  var t = player.sqT / player.sqDur;
  if(t >= 1){ player.sx = 1; player.sy = 1; player.sqDur = 0; return; }
  var e = 1 - Math.pow(1 - t, 3);    /* 線形で戻すと安っぽい。3乗で抜く */
  player.sx = player.sx0 + (1 - player.sx0) * e;
  player.sy = player.sy0 + (1 - player.sy0) * e;
}

/* ============ ④ 粒（固定長プール・乱数なし） ============ */
var MAX_PARTS = TUNING.limits.parts;
var parts = new Array(MAX_PARTS);
for(var i = 0; i < MAX_PARTS; i++){
  parts[i] = {on:false, x:0, y:0, vx:0, vy:0, life:0, max:1, col:'#FFD400', size:3};
}
function spawnParticles(x, y, n, col){
  if(!TUNING.juice){ return; }
  var made = 0;
  for(var i = 0; i < MAX_PARTS && made < n; i++){
    var pt = parts[i];
    if(pt.on){ continue; }
    pt.on = true; pt.x = x; pt.y = y;
    var a = made * 2.399963;         /* 黄金角で放射状に散らす（乱数を使わない） */
    var sp = 90 + (made % 3) * 45;
    pt.vx = Math.cos(a) * sp;
    pt.vy = Math.sin(a) * sp - 60;
    pt.max = 0.30; pt.life = 0.30;
    pt.col = (made % 2 === 0) ? col : '#FFFFFF';
    pt.size = 3 + (made % 2) * 2;
    made++;
  }
}
function updateParticles(dt){
  for(var i = 0; i < MAX_PARTS; i++){
    var pt = parts[i];
    if(!pt.on){ continue; }
    pt.life -= dt;
    if(pt.life <= 0){ pt.on = false; continue; }
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 520 * dt;
  }
}
function drawParticles(c){
  c.save();
  c.globalCompositeOperation = 'lighter';   /* ★これが無いと暗い背景に埋もれる */
  for(var i = 0; i < MAX_PARTS; i++){
    var pt = parts[i];
    if(!pt.on){ continue; }
    c.globalAlpha = Math.min(1, pt.life / pt.max * 1.4);
    c.fillStyle = pt.col;
    c.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
  }
  c.restore();                              /* ★合成と alpha を必ず戻す */
}
function clearParticles(){
  for(var i = 0; i < MAX_PARTS; i++){ parts[i].on = false; }
}
function countParticles(){                  /* 目で数えられないので、数える関数を用意する */
  var n = 0;
  for(var i = 0; i < MAX_PARTS; i++){ if(parts[i].on){ n++; } }
  return n;
}

/* ============ ⑤ 数字ポップ（固定長） ============ */
var MAX_POPUPS = TUNING.limits.popups;
var popups = new Array(MAX_POPUPS);
for(var pi = 0; pi < MAX_POPUPS; pi++){
  popups[pi] = {on:false, x:0, y:0, vy:0, life:0, max:0.5, txt:''};
}
function spawnPopup(x, y, txt){
  if(!TUNING.juice){ return; }
  for(var i = 0; i < MAX_POPUPS; i++){
    var p = popups[i];
    if(p.on){ continue; }
    p.on = true; p.x = x; p.y = y; p.vy = -90;
    p.max = 0.50; p.life = 0.50; p.txt = txt;
    return;
  }
}
function updatePopups(dt){
  for(var i = 0; i < MAX_POPUPS; i++){
    var p = popups[i];
    if(!p.on){ continue; }
    p.life -= dt;
    if(p.life <= 0){ p.on = false; continue; }
    p.y += p.vy * dt;
  }
}
function drawPopups(c){
  for(var i = 0; i < MAX_POPUPS; i++){
    var p = popups[i];
    if(!p.on){ continue; }
    c.globalAlpha = Math.min(1, p.life / p.max * 1.6);
    c.fillStyle = '#FFFFFF';
    c.font = 'bold 22px monospace';
    c.textAlign = 'center';
    c.fillText(p.txt, p.x, p.y);
  }
  c.globalAlpha = 1;
}
function addScore(n, x, y){ score += n; spawnPopup(x, y, '+' + n); }

/* ============ ⑥ 画面の揺れ ============ */
function shake(amp, sec){
  if(!TUNING.juice){ return; }
  shakeAmp = amp; shakeDur = sec; shakeT = 0;
}

/* ============ ⑥-2 クネクネ（待機中も止めない） ============
   BGMのテンポ bpm と、この揺れは**同じ変数から作る**。別々に持たない。
   加速したら、音も揺れも同時に速くなる（片方だけ先に速いと気持ち悪い）。 */
var bpm = 128;
var animT = 0;
function swayX(){
  var omega = 2 * Math.PI * bpm / 60 / 2;   /* 8分音符で1往復 */
  return Math.sin(animT * omega) * 0.10 * 34;   /* 頭の幅34pxの10%＝3.4px */
}

/* ============ ⑦ 更新（呼ぶ順番を変えない） ============ */
function update(dt){
  if(hitstop > 0){ hitstop -= dt; return; }   /* 止めている間は何も進めない */

  animT += dt;                /* ★クネクネの時計。待機中も必ず進める（止めない） */
  updateParticles(dt);        /* ★先頭で必ず呼ぶ（呼ばないと粒が固まる） */
  updatePopups(dt);
  updateSquash(dt);

  if(shakeDur > 0){
    shakeT += dt;
    if(shakeT >= shakeDur){ shakeDur = 0; shakeAmp = 0; shakeT = 0; }
  }
  if(flash > 0){ flash -= dt; if(flash < 0){ flash = 0; } }

  if(state === 'PLAY'){
    timeLeft -= dt;
    if(timeLeft <= 0){ timeLeft = 0; endGame('時間切れ'); return; }
    var dir = (keys.ArrowLeft ? -1 : 0) + (keys.ArrowRight ? 1 : 0);
    player.x += dir * 300 * dt;
    player.x = Math.max(40, Math.min(W - 40, player.x));
  }

  updatePlayer(dt);
  updateGame(dt);             /* ★ゲーム固有（敵・当たり判定）。中身は自分で書く */
}

function updatePlayer(dt){
  player.vy += TUNING.gravity * dt;
  player.y += player.vy * dt;
  if(player.y >= GROUND_Y){
    if(!player.onGround){
      squash(1.28, 0.76, 0.20);                    /* 着地：一番強く潰す */
      spawnParticles(player.x, GROUND_Y, 10, '#FFD400');
      shake(4, 0.15);
      hitstop = 0.06;                              /* 止めるのは着地と被弾だけ */
    }
    player.y = GROUND_Y; player.vy = 0; player.onGround = true;   /* ★戻すのはここだけ */
  }
}
function updateGame(dt){ /* ★敵・当たり判定・得点はここに書く（空のままでよい） */ }

/* ============ ⑧ 描画（順番を変えない） ============ */
function renderPlayScreen(){
  ctx.save();
  if(shakeDur > 0){                            /* 揺れは描画の最初に translate するだけ */
    var sk = 1 - shakeT / shakeDur;
    ctx.translate(Math.sin(shakeT * 90) * shakeAmp * sk,
                  Math.sin(shakeT * 70 + 1) * shakeAmp * sk * 0.6);
  }
  drawBackground();
  drawFloor();
  drawGameObjects();                           /* ★敵・ゴール・アイテム（空のままでよい） */
  var pose = 'idle';
  if(!player.onGround){ pose = 'jump'; }
  else if(player.sqDur > 0 && player.sy < 0.95){ pose = 'land'; }
  /* ★クネクネ：x を数pxだけずらす。待機中も止めない（止まると「動いていない絵」になる）.
     拡縮(sx/sy)は drawPico の中で足元原点に掛かる。ここは translate だけ足す。 */
  drawPico(ctx, player.x + swayX(), player.y, 34, pose, player.sx, player.sy, 1);
  drawPopups(ctx);
  drawParticles(ctx);      /* ★粒は最後。先に描くと床とキャラの下に隠れる */
  ctx.restore();           /* ★揺れと alpha を必ず戻す */

  if(flash > 0){
    ctx.fillStyle = 'rgba(255,255,255,' + (flash / 0.12 * 0.7).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  drawHUD();
}
function drawBackground(){ ctx.fillStyle = '#101014'; ctx.fillRect(0, 0, W, H); }
function drawFloor(){ ctx.fillStyle = '#2A2A32'; ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y); }
function drawGameObjects(){ /* ★敵・ゴール・アイテムを描く（空のままでよい） */ }

var hudKey = '', hudText = 'SCORE 0';
function drawHUD(){
  var k = score + '|' + Math.ceil(timeLeft);
  if(k !== hudKey){                 /* 文字は「変わったときだけ」組み立てる */
    hudKey = k;
    hudText = 'SCORE ' + score + '   TIME ' + Math.ceil(timeLeft);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#FFD400';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(hudText, 16, 34);
  /* ★「スペースで ジャンプ」は PLAY でも消さずに出す */
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('スペースで ジャンプ／はじめる', 16, H - 16);
}

/* ============ ⑨ TITLE と RESULT ============ */
function render(){
  if(state === 'PLAY'){ renderPlayScreen(); return; }
  ctx.save();
  drawBackground();
  drawFloor();
  ctx.textAlign = 'center';
  if(state === 'TITLE'){
    ctx.fillStyle = '#FFD400'; ctx.font = 'bold 44px monospace';
    ctx.fillText('タイトル', W / 2, H * 0.32);
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 22px monospace';
    ctx.fillText('スペースで ジャンプ／はじめる', W / 2, H * 0.52);
  }
  if(state === 'RESULT'){
    ctx.fillStyle = '#FFD400'; ctx.font = 'bold 40px monospace';
    ctx.fillText('RESULT  ' + score, W / 2, H * 0.34);
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 22px monospace';
    ctx.fillText(failReason, W / 2, H * 0.48);      /* ★失敗の理由を1行だけ */
    ctx.fillText('スペースで もう一回', W / 2, H * 0.60);
  }
  ctx.restore();
}

/* ============ ⑩ ループは1本だけ ============ */
var lastT = 0, fpsT = 0, fpsN = 0;
function loop(now){
  if(!lastT){ lastT = now; }
  var dt = Math.min(0.033, (now - lastT) / 1000);   /* ★dt は0.033秒が上限 */
  lastT = now;
  update(dt);
  render();
  fpsN++;
  if(now - fpsT > 500){ TUNING.fps = Math.round(fpsN * 1000 / (now - fpsT)); fpsT = now; fpsN = 0; }
  requestAnimationFrame(loop);                      /* ★ここ1か所だけ */
}

/* ============ 起動（この2行で始まる） ============ */
registerInput();
requestAnimationFrame(loop);`;

/* 参照コードを、プロンプトの中で「これを貼れ」と言い切るブロックにする。
   秒数は参照コード側に30秒で書いてあり、データ側（全22ジャンル）も30秒なので、
   **書き換えは発生しない**。40秒にしたい企画が出たときだけ、その1数字を名指しする。 */
function coreBlock(plan){
  return `【参照コード：この1本をそのまま使う（ここが本体。ここから作り足す）】
以下は、入力・ジャンプ・粒・拡縮・揺れ・止め・数字・画面遷移・ループが**もう全部つながった完成品**です。
**この文字列をそのまま貼ってください。参考にして書き直さない。関数名と変数名を変えない。抜粋しない。**
あなたが書くのは、この中の2か所だけです：
・\`updateGame(dt)\` … 敵・当たり判定・得点（空のままでも動く）
・\`drawGameObjects()\` … 敵・ゴール・アイテムの描画（空のままでも動く）

**書き換えてよいのは、次の1つだけです（それ以外の数値と名前は1文字も変えない）**
1. \`<canvas id="game">\` を HTML に置く（id は game。変えない）

・1プレイの秒数は \`duration: ${plan.duration}\` で、**もう参照コードに入っています。書き換えません**
  （この企画は${plan.duration}秒。30秒か、長くても40秒。**60秒にしない**）

**この骨格を「参考にして新しく書く」のではなく、この文字列を貼る。** それが唯一の合格条件です。

\`\`\`js
${CORE_CODE}
\`\`\``;
}

/* ------------------------------------------------------------------
   参照コード2（AUDIO_CODE）。
   2026-10-31 の実測で分かった矛盾：
     参照コード（CORE_CODE）には音が1行も入っていないのに「これを貼れ」と言っていた。
     そのため「貼った骨格にBGMを足せ」という二重の指示になり、
     実際に BGM が実装されない（＝「BGMの指示が消えた」に見える）原因になっていた。
   そこで音も**貼るコードとして同梱する**。設計の理由（なぜ後期ファミコンか）は
   これまで通り【BGM：ファミコン後期】の文章側に残す。
   CORE_CODE を書き換えずに音を足すため、loop を包んで（包む＝wrapper）、
   ・毎フレーム audioUpdate()（次の小節を先読みして予約）
   ・毎フレーム audioObserve()（状態と vy を見て SE を鳴らす）
   を差し込む。ゲーム側の関数を1行も書き換えない。
   実測（tools/v2_audio_code_check.html）: 実ブラウザで音が出る／例外0。
   ------------------------------------------------------------------ */
const AUDIO_CODE = `/* ===================================================================
   【参照コード2：音】これもそのまま貼る（1行も書き換えない）
   音源ファイルは使わない。Web Audio で合成する（ファミコン後期の5要素）。
   ① パルス2本（旋律 duty 25% / アルペジオ duty 12.5%）
   ② 三角ベースを8分で刻み、オクターブを跳ばす＋第3倍音を重ねる（phone 対策）
   ③ ノイズのドラム（キック1・3拍目／スネア2・4拍目／ハット8分＝4つ打ちにしない）
   ④ エコー（1/8音符ディレイを1本だけ・フィードバック無し）
   ⑤ ビブラート（5.5Hz・±12セント）
   乱数は使わない。ノイズも決まった式で作るので、鳴る音は毎回同じ。
   ゲーム側の関数は書き換えない（loop を包んで、音だけを横から足す）。
   =================================================================== */
var AB = null, ABus = null, ACh1 = null, ACh2 = null, ABass = null, ADrum = null;
var AEcho = null, ANoise = null, W25 = null, W125 = null;
var AOn = false, ANextBar = 0, ABar = 0;
var A_prev = { state: '', vy: 0, onGround: true, score: -1 };

var CHORD = [            /* 8小節で1周。変えない（Am Am F G Am F G Am） */
  [220.00, 261.63, 329.63], [220.00, 261.63, 329.63],
  [174.61, 220.00, 261.63], [196.00, 246.94, 293.66],
  [220.00, 261.63, 329.63], [174.61, 220.00, 261.63],
  [196.00, 246.94, 293.66], [220.00, 261.63, 329.63]
];
var ROOT = [110.00, 110.00, 87.31, 98.00, 110.00, 87.31, 98.00, 110.00];
var MEL  = [440.00, 523.25, 659.25, 440.00];   /* Pen / Apple / Pineapple / 締め */

function pulseWave(duty){                        /* duty 25% と 12.5% を波形で作る */
  var n = 32, re = new Float32Array(n), im = new Float32Array(n);
  for(var k = 1; k < n; k++){ im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty); }
  return AB.createPeriodicWave(re, im);
}
function makeNoise(){                            /* 乱数なしでノイズを作る（毎回同じ音） */
  var len = Math.floor(AB.sampleRate * 0.5);
  var buf = AB.createBuffer(1, len, AB.sampleRate);
  var d = buf.getChannelData(0), s = 12345;
  for(var i = 0; i < len; i++){
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    d[i] = ((s / 0x7fffffff) * 2 - 1) * 0.6;
  }
  return buf;
}
function audioInit(){
  if(AB){ if(AB.state === 'suspended'){ AB.resume(); } return; }
  var AC = window.AudioContext || window.webkitAudioContext;
  if(!AC){ return; }
  AB = new AC();
  ABus = AB.createGain();  ABus.gain.value  = 0.22; ABus.connect(AB.destination);
  ACh1 = AB.createGain();  ACh1.gain.value  = 0.16; ACh1.connect(ABus);
  ACh2 = AB.createGain();  ACh2.gain.value  = 0.09; ACh2.connect(ABus);
  ABass = AB.createGain(); ABass.gain.value = 0.13; ABass.connect(ABus);
  ADrum = AB.createGain(); ADrum.gain.value = 0.07; ADrum.connect(ABus);
  AEcho = AB.createDelay(1.0); AEcho.delayTime.value = 0.234;   /* 1/8音符（BPM128） */
  var eg = AB.createGain(); eg.gain.value = 0.30;
  ACh1.connect(AEcho); AEcho.connect(eg); eg.connect(ABus);      /* エコーは ch1 だけ */
  W25 = pulseWave(0.25); W125 = pulseWave(0.125);
  ANoise = makeNoise();                        /* ★ノイズのBufferは開始時に1回だけ作る */
  AOn = true; ANextBar = AB.currentTime + 0.10; ABar = 0;
}
function audioUnlock(){ audioInit(); if(AB && AB.state === 'suspended'){ AB.resume(); } }
window.addEventListener('keydown', audioUnlock, {passive:false});
window.addEventListener('pointerdown', audioUnlock, {passive:false});

function tone(dest, kind, freq, at, dur, vol){
  if(!AB){ return; }
  var o = AB.createOscillator(), g = AB.createGain();
  if(kind === 'pulse25'){ o.setPeriodicWave(W25); }
  else if(kind === 'pulse125'){ o.setPeriodicWave(W125); }
  else { o.type = kind; }
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g); g.connect(dest);
  o.start(at); o.stop(at + dur + 0.02);          /* ★鳴り終わったら必ず stop する */
  if(dur >= 0.25){                                /* 伸ばす音だけビブラート */
    var lfo = AB.createOscillator(), lg = AB.createGain();
    lfo.frequency.value = 5.5; lg.gain.value = freq * 0.0069;   /* ±12セント */
    lfo.connect(lg); lg.connect(o.frequency);
    lfo.start(at); lfo.stop(at + dur + 0.02);
  }
}
function noiseHit(at, type, freq, dur){
  if(!AB || !ANoise){ return; }
  var src = AB.createBufferSource(), f = AB.createBiquadFilter(), g = AB.createGain();
  src.buffer = ANoise;
  f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(0.9, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f); f.connect(g); g.connect(ADrum);
  src.start(at); src.stop(at + dur + 0.02);
}
function drum(kind, at){
  if(kind === 'kick'){
    tone(ADrum, 'sine', 120, at, 0.10, 0.55);
    tone(ADrum, 'square', 900, at, 0.02, 0.12);   /* phone で蹴りが聞こえるクリック */
    noiseHit(at, 'lowpass', 180, 0.06);
  } else if(kind === 'snare'){
    noiseHit(at, 'bandpass', 1800, 0.09);
  } else {
    noiseHit(at, 'highpass', 6000, 0.03);
  }
}
function playBar(at, bar){
  var spb = 60 / bpm;                             /* 1拍の秒数。bpm はゲーム側と同じ変数 */
  var c = CHORD[bar], m = MEL[bar % 4];
  tone(ACh1, 'pulse25', m, at, spb * 0.90, 0.90);
  tone(ACh1, 'pulse25', m * 1.0595, at + spb * 0.50, 0.06, 0.45);   /* 16分の経過音 */
  for(var i = 0; i < 16; i++){                    /* ② アルペジオを16分で刻む */
    tone(ACh2, 'pulse125', c[i % 3], at + spb * i / 4, 0.06, 0.70);
  }
  for(var j = 0; j < 8; j++){                     /* ② 8分・オクターブ跳び＋第3倍音 */
    var f = ROOT[bar] * (j % 2 === 0 ? 1 : 2);
    tone(ABass, 'triangle', f, at + spb * j / 2, 0.10, 0.80);
    tone(ABass, 'triangle', f * 3, at + spb * j / 2, 0.08, 0.10);
  }
  drum('kick', at); drum('snare', at + spb);      /* ③ 4つ打ちにしない */
  drum('kick', at + spb * 2); drum('snare', at + spb * 3);
  for(var h = 0; h < 8; h++){ drum('hat', at + spb * h / 2); }
  if(bar === 7){                                  /* 8小節目の最後：1オクターブ上で「終わり」 */
    tone(ACh1, 'pulse25', 880.00, at + spb * 2, spb * 0.90, 0.90);
  }
}
function audioUpdate(){                           /* 次の小節を先読みして予約する */
  if(!AOn || !AB){ return; }
  var now = AB.currentTime;
  while(ANextBar < now + 0.20){
    playBar(ANextBar, ABar);
    ABar = (ABar + 1) % 8;
    ANextBar += (60 / bpm) * 4;                   /* 1小節＝4拍。加速すれば自動で追従 */
  }
}
function se(kind){
  if(!AOn || !AB){ return; }
  var t = AB.currentTime + 0.001;
  if(kind === 'start'){ tone(ACh1, 'pulse25', 392, t, 0.15, 0.50); }
  else if(kind === 'jump'){ tone(ACh1, 'pulse25', 660, t, 0.06, 0.45); }
  else if(kind === 'land'){ tone(ACh1, 'triangle', 140, t, 0.07, 0.55); }
  else if(kind === 'score'){ tone(ACh1, 'pulse25', 990, t, 0.05, 0.40); }
  else if(kind === 'combo'){
    tone(ACh1, 'pulse25', 1047, t, 0.05, 0.45);
    tone(ACh1, 'pulse25', 1047, t + 0.05, 0.05, 0.45);
  }
  else if(kind === 'fail'){
    tone(ACh1, 'sawtooth', 220, t, 0.22, 0.50);
    tone(ACh1, 'sawtooth', 165, t + 0.06, 0.16, 0.40);
  }
}
/* SE はゲームの関数を書き換えずに、状態を見て鳴らす（観測するだけ） */
function audioObserve(){
  if(state !== A_prev.state){
    if(state === 'PLAY'){ se('start'); }
    if(state === 'RESULT'){ se('fail'); }
    A_prev.state = state;
  }
  if(player.vy < -600 && A_prev.vy >= -600){ se('jump'); }
  if(player.onGround && !A_prev.onGround){ se('land'); }
  if(score !== A_prev.score){
    if(A_prev.score >= 0){ se('score'); }
    A_prev.score = score;
  }
  A_prev.vy = player.vy; A_prev.onGround = player.onGround;
}
/* loop を包む（音だけを横から足す。ゲームの処理順は変えない） */
var loopBase = loop;
loop = function(now){
  audioUpdate();
  audioObserve();
  loopBase(now);
};`;

function audioBlock(plan){
  return `【参照コード2：音（BGMと効果音）】も、**そのまま貼ってください。書き換えません。**
音源ファイルは使いません。Web Audio で合成します。
・BGM：8小節ループ（Am Am F G Am F G Am）／BPM128／パルス2本＋三角ベース＋ノイズドラム＋エコー＋ビブラート
・加速：bpm をゲーム側と同じ変数から読むので、残り${plan.duration > 20 ? 12 : 8}秒・${plan.duration > 20 ? 7 : 5}秒・${plan.duration > 20 ? 3 : 2}秒で、絵と音が同じフレームで速くなる
・効果音6種：開始・ジャンプ・着地・得点・コンボ・失敗。ゲームの関数は書き換えず、状態を見て鳴らします
・音が鳴らないときは、その1行を足すだけで直ります：\`audioUnlock();\` を最初のクリックかキー入力で1回呼ぶ（参照コード2に入っています）
・設計の理由（なぜ前期ではなく後期ファミコンか）は、この後ろの【BGM：ファミコン後期】に書いてあります。音を削らないこと。

\`\`\`js
${AUDIO_CODE}
\`\`\``;
}

/* ------------------------------------------------------------------
   入力（キーボード）の指定。**ここが丸ごと抜けていた**（2026-10-31 実測）。
   prompts.js 全体に「スペース」という文字が1つも無く、キー名の指定が
   どこにも無かった。そのため生成側は「タップ／クリック」だけを実装し、
   スペースキーではジャンプしなかった（先生の指摘どおり）。
   キー名・preventDefault・キーリピート・スマホ側の代替を、数値で固定する。
   ------------------------------------------------------------------ */
const INPUT_SPEC = `【入力：参照コードの「① 入力」「② ジャンプの唯一の入口」「⑦ 更新」を、そのまま使う】
**スペースキーでジャンプしない不具合が実際に起きた。原因は「書いてあるが、つながっていない」こと。**
だから入力は文章で指定しない。**このプロンプトの【参照コード】に、もう動く形で入っている。**
書き直さない・書き足さない・名前を変えない。確認するのは、この9点だけ（すべて参照コードの中に既にある）。

1. キー名：' '（半角スペース1個）と e.code === 'Space' の**両方**で判定する。片方だけにしない。
2. preventDefault：keydown の**関数の先頭**で呼ぶ。後ろに書くとページがスクロールして、押した感じが消える。
3. 押した瞬間だけ1回：keys[' '] が false のときだけ tryJump() を呼ぶ（押しっぱなしで連続ジャンプしない）。
4. 離したら戻す：keyup で keys[' '] = false、jumpLatch = false。
5. 登録は1回だけ：registerInput() は起動時に1回。inputReady で二重登録を防ぐ。
6. 画面が変わっても登録し直さない：TITLE / PLAY / RESULT でリスナを共用する（これが「リトライ後に効かない」の原因）。
7. リトライの初期化：startGame() の先頭で keys と jumpLatch を必ず false に戻す。
8. onGround を true に戻すのは updatePlayer() の着地処理だけ。ほかの場所で書き換えない。
9. TITLE と RESULT では、スペースが「はじめる／もう一回」になる（tryJump の先頭で分岐している）。

・画面には「スペースで ジャンプ／はじめる」を、TITLE と PLAY の両方に出す（drawHUD の中にある。消さない）。
・スマホは canvas の pointerdown（上半分＝ジャンプ）で代替する。
・操作は【仕様（変更禁止）】の範囲を超えない（増やさない）。`;

/* ------------------------------------------------------------------
   拡縮（スクワッシュ＆ストレッチ）の数値仕様。
   「挙動を感じさせるジューシーな動きが無い」への対策。
   言葉で「潰す」と書いても、値と時間が無いと実装されない。
   縦横の倍率・戻す秒数・イージング・原点を、そのまま写せる形で固定する。
   ------------------------------------------------------------------ */
const JUICE_SCALE = `【拡縮（スクワッシュ＆ストレッチ）：この数値と秒数をそのまま使う】
体は必ず sx / sy の2つの倍率を持ち、描画の最初に掛ける。
**原点は必ず足元**（ctx.translate(px, py) してから ctx.scale(sx, sy)）。
中心を原点にすると、潰れたときに足が浮いて「ジャンプした」に見えない。

| きっかけ | sx | sy | 戻す秒数 | 意味 |
|---|---|---|---|---|
| ジャンプの瞬間（離陸） | 0.82 | 1.22 | 0.14秒 | 上に伸びる |
| 上昇中（最高点まで） | 0.92 | 1.08 | — | 伸びを残す |
| 落下中（速度が速いほど） | 1.00→0.94 | 1.00→1.10 | — | 落ちながら伸びる |
| 着地の瞬間 | 1.28 | 0.76 | 0.20秒 | 一番強く潰す |
| 着地の0.06秒後（跳ね返り） | 0.94 | 1.06 | 0.10秒 | 1回だけ小さく跳ねる |
| 被弾 | 1.18 | 0.86 | 0.16秒 | 横に潰れる |
| 成功・ゴール | 1.10 | 1.14 | 0.30秒 | ふくらむ |
| 待機（呼吸） | 1.00 | 1.00＋0.02×sin | 常時 | 生きている |

・イージングは **1-(1-t)^3**（t は 0→1）。t は「経過秒 ÷ 戻す秒数」。
  線形で戻すと、ゴムが戻るような安っぽい動きになる。3乗で抜く。
・**倍率は毎フレーム必ず 0.75〜1.30 の範囲に収める。**
  clamp を書かないと、連打で倍率が積もって「ゴム人間」になる。
  　sx = Math.min(1.30, Math.max(0.75, sx));
・sx と sy は**逆数を基本**にする（sx×sy ≒ 1.0）。体積を保つと生き物に見える。
  sx=1.28 なら sy≒0.78。両方を大きくすると「膨らんだ風船」になる。
・**クネクネと拡縮は同時に掛ける。** 拡縮は ctx.scale、クネクネは translate。
  片方が他方を上書きしないよう、save/restore の中で両方掛ける。
・TUNING.juice = true / false で、この拡縮だけを切れるようにする。
  （切ったときの見た目を、発表で並べて見せられる）`;

/* ------------------------------------------------------------------
   「エフェクトが消えた」への対策。**消えたのではなく、最初から書かれていない。**
   プロンプトに「入れる」とは書いてあるが、「消えていたら不合格」という
   判定条件が無かった。自己申告できる形のチェックリストにする。
   ------------------------------------------------------------------ */
const EFFECT_CHECK = `【エフェクト：参照コードの「④ 粒」「⑤ 数字ポップ」「⑥ 揺れ」「⑦ 更新」「⑧ 描画」を、そのまま使う】
**「エフェクトが消えた」が実際に起きた。原因は「書いてあるが、つながっていない」こと。**
だから演出も文章で指定しない。**このプロンプトの【参照コード】に、もう動く形で入っている。**
名前は変えない（parts / spawnParticles / updateParticles / drawParticles / pt.on / renderPlayScreen / countParticles）。
粒の数は MAX_PARTS = 30 の固定長。new しない・filter しない・乱数を使わない。

【エフェクト5つを「どこで呼ぶか」まで決める（ここが抜けると出ない）】
| 演出 | 呼ぶ場所 | 呼び忘れると |
|---|---|---|
| 粒 | spawnParticles() を 離陸・着地・取得・被弾の4か所で | 1つも出ない |
| 粒の更新 | updateParticles(dt) を update() の**先頭**で毎フレーム | 出た瞬間に固まる |
| 粒の描画 | drawParticles(ctx) を renderPlayScreen() の**最後** | 背景の下に隠れる |
| 数字ポップ | 得点が入った場所で popups の空き枠へ | 数字が出ない |
| 画面の揺れ | 着地・被弾で shake(4, 0.15) | 手応えが無い |
| ヒットストップ | 被弾・成功で hitstop = 0.06 | 当たった感触が無い |
| 白飛び | 成功・コンボで flash = 0.08 | 山場が地味 |

・**renderPlayScreen() の呼ぶ順番を固定する**（この順番を変えない）：
  　背景 → 床 → 敵 → ピコ太郎 → 数字ポップ → 粒 → 揺れを戻す → 白飛び
  粒を先に描くと、キャラと床の下に隠れて「出ていない」ように見える。**最後に描く。**
・**確認の手順（これをやらずに「できた」と言わない）**
  　① 起動して、タイトルから PLAY に入る
  　② スペースでジャンプ → 離陸と着地で粒が出るか
  　③ 1回当てる → 粒・数字・揺れ・止め・白飛びの5つを、1つずつ口に出して数える
  　④ 5つ未満なら、足りないものを実装してから、もう一度①から
・**演出を切るスイッチを必ず作る**（TUNING.juice = true/false）。
  切ったときに5つが全部消え、入れたときに全部出ることを確認する。
  ここが「入れたつもりで入っていない」を防ぐ唯一の方法。
・**粒が出ないときの切り分け（上から順に疑う）**
  　(a) parts を作っていない（未定義のまま）→ (b) spawnParticles を呼んでいない
  　→ (c) updateParticles を呼んでいない → (d) drawParticles を呼んでいない
  　→ (e) globalCompositeOperation を戻し忘れて、次フレームで見えなくなっている
  　→ (f) 発生位置が画面外（player.x / player.y を渡していない）`;

/* ------------------------------------------------------------------
   重さの本当の原因。**キャラの描画ではない**（実測：手足を外して137命令、
   3分割でも 0.08ms＝60fps予算の0.5%）。重くするのは次の6つ。
   ここを名指しで禁止しないと、生成側は毎回これをやる。
   ------------------------------------------------------------------ */
const PERF_HARD = `【重くする書き方：この6つをやらない（キャラの絵は重くない）】
実測：ピコ太郎を3分割で描いても 0.08ms／フレーム（60fps予算16.67msの0.5%）。
つまり**キャラを疑うのは間違い**。重くなるのは次の6つ。

① **shadowBlur を毎フレーム使わない。** 発光を shadowBlur で出すと、実機の
   スマホでは1個あたり数msかかる。光は「半透明の四角を2枚重ねる」で出す。
  　NG：ctx.shadowBlur = 12; ctx.shadowColor = '#FFD400';  …を粒の数だけ
  　OK：alpha 0.35 と 0.18 の四角を、少し大きいサイズで2枚重ねる
② **ctx.filter を使わない。** ctx.filter = 'blur(2px)' は、毎フレーム掛けると
   画面全体を作り直す。ぼかしが欲しいなら、ぼかした絵を先に1枚作っておく。
③ **fillText を毎フレーム大量に呼ばない。** スコアは文字が変わったときだけ描く。
   毎フレーム5個の文字を描くと、それだけで数msかかる端末がある。
   数字は変化したかを比べて（prevScore !== score）、変わったときだけ描く。
④ **キャンバスの大きさを毎フレーム変えない。** canvas.width = ... を
   resize の外で書くと、そのたびに描画面が作り直される（数ms）。
   端末の解像度に合わせて大きくするなら、**最初に1回だけ**にする。
   devicePixelRatio を掛けると面積が4〜9倍になる。掛けるなら
   「dpr は最大2まで」に制限する（const dpr = Math.min(2, window.devicePixelRatio||1)）。
⑤ **ループの中で new しない。** new Array / {} / オブジェクトリテラルを
   update や draw の中で書かない。すべて外で1回だけ作って使い回す。
   Vector クラスを作るのも同じ。数値 x, y を直接持つ。
⑥ **requestAnimationFrame は1本だけ。** draw の中から次の rAF を呼ぶ形にし、
   イベント（keydown・click）からは絶対に呼ばない。呼ぶとループが増えて、
   押すたびに倍々で重くなる（これが「だんだん重くなる」の正体）。

・**重さの測り方（推測しない）**
  PLAY 中に FPS を数える小さなカウンタを画面の隅に出す（消してよい）。
  　var fpsT = 0, fpsN = 0;
  　// ループ内：fpsN++; if(now - fpsT > 500){ TUNING.fps = Math.round(fpsN*1000/(now-fpsT)); fpsT=now; fpsN=0; }
  60付近なら合格。40を切るなら、上の①〜⑥のどれかをやっている。`;

/* 不条理（無理やん → でも惜しい）の共通ブロック。
   ピコ太郎の笑いの核は「真顔で、無理なことをやる」。
   要求は無理に見せるが、必ず救いを1つ入れる。救いが無いと笑いではなく怒りになる。 */
function absurdBlock(plan){
  const a = plan.absurd || {};
  return `【要求される無理（ここを薄めない）】
${a.demand || ''}

【なぜ無理に見えるか】
${a.impossible || ''}

【でも、できそう（救い・ここは必ず入れる）】
${a.rescue || ''}

【合格の目安】
${a.rate || ''}

【笑いが起きる1コマ】
${a.laugh || ''}`;
}

const ABSURD_RULE = `この企画の面白さの芯は「一見、無理やん」にあります。
無理なことを真顔でやっている絵が笑いになる。ピコ太郎の不条理はそこです。
ただし、理不尽（手も足も出ない）にしてはいけません。笑いではなく怒りになります。
必ず「触れば分かる救い」を1つ入れて、失敗しても惜しさで終わるようにしてください。
・無理なのは「要求」であって、操作ではありません。操作は1〜2種類のまま増やさない。
・救いは1つだけ。複数入れると難易度が下がって、無理やんの面白さが消えます。
・難易度は「10回に2〜3回は成功する」あたり。0回だと投げられ、10回だと笑いにならない。`;

/* ------------------------------------------------------------------
   シチュエーション（タイトル画面に出す「どういう状況か」）
   この企画のウリは「ピコ太郎がネタになった」こと。だからタイトルで状況を言い切る。
   ネタは PK2.PICO_STANCE（活動・希望・恐れ・ありたい）から作った12本を引用している。
   ------------------------------------------------------------------ */
function situBlock(plan){
  return `【タイトル画面に書く「どういう状況か」（必ず表示する。ここがこの企画のウリ）】
タイトル画面に、次の3行をそのまま出す（要約しない・言い換えない・英語にしない）。
　1行目（いちばん大きい文字）：${plan.title}
　2行目（中くらいの文字）：${plan.situTitle}
　3行目（小さい文字）：目的＝${plan.situGoal}

【その状況を、説明ではなく「物」で見せる（ここで笑いを取る）】
${plan.situGag}
・この仕掛けに、必ず名前を付けて画面の中に書く。このゲームでは「${plan.situEnemy}」。
  名前を書くと笑いになる。名前が無いと、ただの背景になる。
・ピコ太郎の希望（${plan.situWant}）と、恐れ（${plan.situFear}）を、
  画面の中に1つずつ「見える形」で置く。文章で説明しない。
・状況は必ず動かす。止まった背景に文字を置くだけでは、状況にならない。

【このゲームのピコ太郎の立場（作る人は読むだけ。画面には出さない）】
・している活動：${PK2.PICO_STANCE.活動}
・希望：${PK2.PICO_STANCE.希望}
・恐れ：${PK2.PICO_STANCE.恐れ}
・ありたい姿：${PK2.PICO_STANCE.ありたい}`;
}

/* ------------------------------------------------------------------
   常時クネクネ＋キラキラ。
   「ピコ太郎っぽさ」は形ではなく、動きと存在感で出す。
   止まった絵を1枚も出さない、が結論（待機中も動かす）。
   ------------------------------------------------------------------ */
const WIGGLE_SPEC = `【ピコ太郎は、待機中も止めない（常時クネクネ＋キラキラ）】
・待機（idle）でも止めない。止まった絵を1枚も出さないこと。
・**体を3分割（頭・胴・腰）して、ヘビのようにS字に振る。**
  　頭X = base + A*sin(t*ω)／胴X = base + A*sin(t*ω - 0.9)／腰X = base + A*sin(t*ω - 1.8)
  位相を0.9ラジアンずつ遅らせる。これで「ヘビ」に見える。3つを同じ位相で振ると、ただ揺れているだけになる。
・振れ幅 A は 頭 0.10W／胴 0.07W／腰 0.04W（W＝頭の幅）。頭がいちばん大きく振れる。
・**速さはBGMのテンポに合わせる。**ω = 2π × BPM ÷ 60 ÷ 2（8分音符で1往復）。
  BPM128なら ω ≈ 6.70 rad/s。BGMが加速したら、このωも同じ倍率で上げる（片方だけ変えない）。
・頭は胴より0.06秒だけ遅れて付いてくる（追従）。これで「生きている」に見える。
・**常にキラキラを纏わせる。** 粒を8〜12個、体の周りから外向きに流して0.6秒で消す。
  色は #FFD400 と #FFFFFF の2色だけ。globalCompositeOperation = 'lighter' で光らせる。
  同時30個まで。粒は**固定長プール（長さ32）で先に確保して使い回す**。
  **毎フレーム parts.filter(...) を書かない**（毎回新しい配列ができてGCが出て、スマホでカクつく）。
  掃除は「life を0にして on=false にする」だけ。配列の長さは変えない。
・キラキラの発生位置は、体の振れに追従させる（動いた場所から出す）。
  体と粒が別々に動くと嘘に見える。ここを合わせるだけで「存在感」が出る。
・走り・ジャンプ・被弾の最中もクネクネを止めない。振れ幅を0.6倍に落とすだけにする。`;

/* ------------------------------------------------------------------
   BGM。**ファミコン後期（ロックマン／忍者龍剣伝／カービィ系）で作る。ここは必須。**
   音源ファイルなし・Web Audioで合成。
   前期ファミコン＝2音＋シンプル。後期ファミコン＝
     ① パルス2本（旋律＋細かいアルペジオ）
     ② 三角ベースの8分刻み（オクターブ跳び）
     ③ ノイズのドラム（キック／スネア／ハット）
     ④ エコー（1/8音符ディレイ）
     ⑤ ビブラート・ピッチスライド
   この5つが揃って初めて「後期」に聞こえる。1つでも欠けると前期＝薄い音になる。
   ------------------------------------------------------------------ */
const NES_BGM_CORE = `【BGM（必須・ファミコン後期の5要素で作る）】
・音源ファイルを使わない。Web Audio で合成。8小節ループ。キーAm・4拍子。
・① パルス2本：旋律＝duty 25%、アルペジオ＝duty 12.5%（細い音）。役割を分ける。
・② 三角ベース：8分刻み。A2→A3 のようにオクターブを跳ばす（後期の推進力はここ）。
・③ ノイズのドラム：キック／スネア／ハットを noise で作る。4つ打ちにしない。
・④ エコー：旋律を1/8音符ぶん遅らせて音量0.30で重ねる。これが「後期の残響」。
・⑤ ビブラート：伸ばす音だけ 5.5Hz・±12セント。装飾にピッチスライドを1回。
・**間違っても「メロディ1本＋ベース」で終わらせない。** それは前期ファミコンで、この企画の音にはならない。`;

const NES_BGM = `【BGM：ファミコン後期（ロックマン／忍者龍剣伝／カービィ系）風。ここは必須。省略禁止】
・音源ファイルを使わない。Web Audio（OscillatorNode＋ノイズ）で合成する。8小節で1周し、最後は必ず頭へ戻る。
・キーAm。BPM128・4拍子。1小節＝1.875秒。8小節＝15秒。30秒＝2周。
・**なぜ「後期」なのか。** 前期（2音・単純）では、この企画の30秒のゲームが安っぽく聞こえる。
  後期は「音が多くて忙しいのに、耳に残る」。この差は音数ではなく、次の5つの作り方で出る。

【① パルス2本を、役割を分けて使う】
・ch1（旋律）：square / duty 25%。音量 0.16。
  　Pen＝A4(440Hz)／Apple＝C5(523Hz)／Pineapple＝E5(659Hz)／締め＝A4(440Hz)
  この4音の動機は変えない（歌詞は無し。音だけ）。後期らしさは、この4音に「装飾」を足して出す。
  　小節の頭に16分の経過音を1つ挟む（A4→C5 なら B4 を0.06秒だけ）。これだけで後期の表情になる。
・ch2（アルペジオ）：square / duty 12.5%。音量 0.09。
  和音を16分で刻む。Am=A4 C5 E5 C5／F=F4 A4 C5 A4／G=G4 B4 D5 B4 を、小節の頭から順に。
  **これが「後期ファミコン」の一番わかりやすい証拠。** 旋律が1本しか無いと、どう作っても前期に戻る。

【② 三角ベース：8分で刻み、オクターブを跳ばす】
・triangle。音量 0.13。A2=110Hz／F2=87Hz／G2=98Hz。
・8分ごとに A2→A3→A2→A3 と跳ばす（ルートだけを刻むと、後期の推進力が出ない）。
・**スマホのスピーカーは200Hz以下がほぼ出ない。** 三角ベースには第3倍音（×3）を音量0.10で重ねる。
  これが無いと phone ではベースが消えて、ドラムとアルペジオだけの薄い音になる（実測済み）。

【③ ノイズのドラム：4つ打ちにしない】
・noise（BufferSource・長さ0.5秒のホワイトノイズを1回だけ作り、使い回す）。音量 0.07。
  キック＝ノイズを lowpass 180Hz・減衰0.06秒／スネア＝bandpass 1800Hz・減衰0.09秒
  ハット＝highpass 6000Hz・減衰0.03秒
・配置：キック=1拍目と3拍目、スネア=2拍目と4拍目、ハット=8分。
  **キックを4つ打ちにしない。** 4つ打ちはダンスミュージックの音で、ファミコン後期の音ではない。
・キックには square 900Hz・0.02秒・音量0.12 のクリックを同時に重ねる（phone 対策。これが無いと蹴りが聞こえない）。

【④ エコー：1/8音符ディレイを1本だけ】
・ch1 の出力を、1/8音符ぶん（BPM128で0.234秒）遅らせて音量0.30で重ねる。
  遅延ノード（DelayNode）を1つだけ作り、フィードバックは掛けない（掛けると濁って、後期ではなくなる）。
・エコーは ch1 だけ。全部に掛けると音が溶けて、リズムが消える。

【⑤ ビブラートとピッチスライド】
・0.25秒以上伸ばす音だけ、5.5Hz・深さ±12セントでビブラートを掛ける（LFO を1つ作って gain で深さを決める）。
・小節の頭の装飾音に、-50セント→0 を0.08秒で上げるスライドを1回入れる（後期の「キュッ」）。

【コード進行（8小節・変えない）】
・Am → Am → F → G → Am → F → G → Am
・**8小節目の最後の2拍だけ、ch1 を1オクターブ上（A5=880Hz）に上げ、ch2 を32分に細かくする。**
  ここが「終わり」の合図になり、ループの頭に戻ったことが耳で分かる。

【音量（このバランスを守る）】
・master 0.22／ch1 0.16／ch2 0.09／三角ベース 0.13／ドラム 0.07。
・BGMは効果音より必ず小さくする。SE（0.3前後）が埋もれると、当たった手応えが消える。

【加速（ゲーム側と同じタイミングで必ず行う）】
・残り12秒でBPM143、残り7秒で164、残り3秒で182（1プレイ30秒の企画）。
・テンポを上げたら、ハットを8分→16分に増やし、残り10秒から ch2 のアルペジオを16分→32分に上げる。
  **音符を増やすのではなく、刻みを細かくする。** 音数を増やすと耳が飽和して、速く聞こえない。
・ゲーム側の速度倍率と、必ず同じフレームで切り替える。片方だけ速いと、音と絵がズレて気持ち悪くなる。
・BGMのテンポは、キャラのクネクネのωにもそのまま使う（1つの BPM 変数から両方作る。別々に持たない）。`;

/* 旧名の互換（既存の出力・検証が PPAP_BGM を参照しているため） */
const PPAP_BGM = NES_BGM;

/* ------------------------------------------------------------------
   WEB用の短いBGM仕様（2026-10-31）。
   WEBプロトは音を【参照コード2：音】として**実装ごと同梱**したので、
   文章で同じことを二重に書くと、プロンプトが44,367字まで膨れて
   他の指示（入力・演出・重さ）を押し出してしまう（実測）。
   だからWEBでは「なぜこの作り方か」と「変えてはいけない数値」だけを残し、
   実装の手順はコードに任せる。Unity側は今まで通り NES_BGM を全文使う
   （Unityはコードを渡さないので、文章が唯一の指示になる）。
   ------------------------------------------------------------------ */
const NES_BGM_WEB = `【BGM：ファミコン後期（ロックマン／忍者龍剣伝／カービィ系）風。ここは必須。省略禁止】
・音源ファイルを使わない。Web Audio で合成する。**すぐ上の【参照コード2：音】に、もう鳴る形で入っています。**
・キーAm。BPM128・4拍子。8小節＝15秒で1周し、最後は必ず頭へ戻る（30秒＝2周）。
・**前期（2音・単純）で済ませない。** 後期は次の5つで作る。揃って初めて「後期」に聞こえる。
　① パルス2本：旋律＝duty 25%、アルペジオ＝duty 12.5%（役割を分ける）
　② 三角ベース：8分刻みでオクターブを跳ばす（A2→A3）。第3倍音（×3）を音量0.10で重ねる
　　（**200Hz以下はスマホでほぼ出ない**。これが無いと phone でベースが消える）
　③ ノイズのドラム：キック1・3拍目／スネア2・4拍目／ハット8分。**4つ打ちにしない**
　④ エコー：1/8音符ディレイ（0.234秒）を**1本だけ**。フィードバック無し。ch1 だけに掛ける
　　（**遅延ノード DelayNode は1つだけ作る**。鳴らすたびに作ると後半で音が割れる）
　⑤ ビブラート：0.25秒以上伸ばす音だけ 5.5Hz・±12セント
・コード進行（8小節・変えない）：Am → Am → F → G → Am → F → G → Am
・加速：残り12秒でBPM143、残り7秒で164、残り3秒で182。**刻みを細かくする**（音数を増やさない）。
・**BGMのテンポは、キャラのクネクネのωにもそのまま使う（1つの BPM 変数から両方作る）.**`;

/* 全ゲームに必ず入る3つの味付け（画面には出さない） */
function alwaysTwistBlock(plan){
  const rows = (plan.alwaysTwists||[]).map(t=>`・${t.label}：${t.one}（理由：${t.why}）`).join('\n');
  return `【全ゲーム共通の味付け（必ず入れる・選択肢として画面に出さない）】\n${rows}`;
}

function head(plan){
  return `# ${plan.title}

- ジャンル：${plan.genreLabel}（${plan.family}）
- 操作：${plan.input}
- 画面：${plan.view}
- 1プレイ：${plan.duration}秒
- 成功条件：${plan.success}
- 失敗条件：${plan.fail}
- ピコ太郎の乗せ方：${plan.hookLabel}
- 刺激の1手：${plan.twistLabel}（${plan.twistOne}）`;
}

/* ---------- 1. 1枚企画書 ---------- */
function promptPlan(plan){
  return `あなたはゲーム企画の整理役です。以下の「学生が決めた仕様」を、A4 1枚の企画書に整えてください。

【最重要の拘束】
${LOCK}

${head(plan)}

【コアループ】
${plan.loop}

${situBlock(plan)}

${alwaysTwistBlock(plan)}

【展開（Startはふつう→不条理→最後に加速）】
${PK2.plan.escalateBlock(plan)}
${PK2.plan.ESCALATE_RULE}

【面白さの芯（ここを薄めない）】
${FUN_RULE}
${funBlock(plan)}

【ピコ太郎である理由（変更しない）】
${plan.hookLabel}：${plan.impl}
${plan.whyShape}

【見せ場（この1コマを必ず入れる）】
${plan.show}

【刺激の1手（1つだけ・変更禁止）】
${plan.twistLabel}：${plan.twistOne}
- 実装：${plan.twistHow || plan.twistLabel}
- 狙い：${plan.twistEffect}

【気持ちよさ（ジュース）：この5つを必ず入れる】
${JUICE_RULE}
${juiceBlock(plan)}

【音（必須・ここは削らない）】
${NES_BGM_CORE}
・この企画の音は「ファミコン後期」。前期（メロディ1本＋ベース）で済ませない。

【演出の重さ（必ず守る）】
${PERF_RULE}

【不条理（この企画の笑いの芯）】
${ABSURD_RULE}
${absurdBlock(plan)}

【出力形式】次の見出しのまま、各2〜4文で書いてください。前置き・後書き・別案は禁止。
1. タイトル
2. 一文コンセプト（誰が、何をして、どうなるか）
3. コアループ（○する→○が起きる→もう一度したくなる）※「0秒の1手」から書き始める
4. 操作と画面
5. 成功条件／失敗条件
6. 30秒の遊びの流れ（時系列で5段階）※山場はどこか
7. 見せ場（1コマの説明）
8. ピコ太郎の要素がどこに入っているか
9. 気持ちよさ（ジュース）＝上の5つのうち、どれをどこで出すか。秒数まで書く
10. 不条理の設計＝「無理やん」に思わせる要求／なぜ無理に見えるか／できそうな救い／合格の目安。この4つを必ず分けて書く
11. 作る順番（最初に作る1つ→次に作る2つ）※「0秒の1手」から作る
12. 削ってよいもの（時間が足りないときに捨てる順）※ジュース・救い・0秒の1手は削らない。先に削るのは背景と敵の種類`;
}

/* ---------- 2. ゲームイメージ画像 ---------- */
function promptImage(plan){
  return `16:9のゲームプレイ画面を1枚生成してください。完成したゲームのスクリーンショットとして見える画にします。

【ピコ太郎の見た目（寸法まで守る。ここが「似る／似ない」を決める）】
① 髪：角刈りパンチ。
② 眼鏡：黒縁の普通の眼鏡（サングラスではない）。レンズ越しに目が見える。
③ 掛け方：鼻の上に「ちょいがけ」。レンズの上端が目の少し下に来る。
④ 髭：口の上の口髭（細く短い）。顎髭はない。
補足：${PICO_LOOK}

${picoSpecBlock()}

【この1枚で取るポーズ】
${heroPose(plan).name}：${heroPose(plan).how}

【画風】
フラットな2Dゲーム画面。太い黒線、ベタ塗り、影は1段だけ。勢いのあるイラスト。

【このゲームの画面】
ジャンル：${plan.genreLabel}
視点：${plan.view}
主人公：${plan.hookWord}（ピコ太郎）
操作：${plan.input}
画面の配置：${plan.show}
タイトル画面に出す状況：${plan.situTitle}（この状況を、絵でも分かるように描く）

【画面内のUI（必ず文字を入れる・日本語）】
上段：残り時間 ${plan.duration} / スコア / ${plan.life>1?('ライフ '+plan.life):'到達度'}
下部または端：操作ガイドを1行だけ（例：${plan.input}）

【不条理の設計＝シチュエーションから出す】
・この画面のシチュエーション：${plan.situTitle}
・笑いの仕掛け（絵で見せる）：${plan.situGag}
・画面に書く名前：${plan.situEnemy}
→ 笑えるのは「状況の名前」が画面に書いてあるから。名前を描き込むこと。

【この画面が「面白い」と分かる材料】
・0秒の1手：${plan.kick}
・山場：${plan.spike}
→ 山場の画を描くこと。地味な通常状態を描かない。

【不条理：「無理やん」が絵で分かるように描く（重要）】
${ABSURD_RULE}
・この画面で起きている無理：${plan.absurd.demand}
・主人公は**真顔**のまま。焦る顔・困り顔にしない。真顔で無理をやっているから笑いになる。
・「無理やん」と分かる材料を1つ大きく描く：${plan.absurd.impossible}
・「でも、いけそう」と分かる材料を1つ小さく描く：${plan.absurd.rescue}
・この2つが同じ画面に両方入っていること。無理だけだと、ただの事故に見える。

【気持ちよさが「絵」で分かるように描く（重要）】
${JUICE_RULE}
・主人公の体を、動きに合わせて**わざと潰す／伸ばす**。
  例：着地の瞬間は縦に潰す（横に1.2倍・縦に0.8倍）。ジャンプ中は縦に伸ばす。
  腕・脚・手は描かない（この企画のキャラは頭・胴・足の箱だけでできている）。
・成功の瞬間なら、主人公の周りに「放射状の線」「星」「丸い粒」を8〜12個まき散らす。
・当たった場所に、白い円と短い線（火花）を1つ置く。
・得点が入った数字（+10など）を、主人公の上に1つ浮かべる。
・これらの演出は「あとから足した」と分かる重ね方でよい。線を太く、色を明るく。
・ただし画面を埋め尽くさない。主役の顔と、当たった場所が一番目立つようにする。

【吹き出し】
ピコ太郎の頭の横に、白地に黒縁の吹き出しを1つ。「Pen!」または「Oh!」を大きく。

【音の前提（絵では音は出せないが、この画面の音はファミコン後期で固定）】
・このゲームのBGMは「ファミコン後期（ロックマン／忍者龍剣伝／カービィ系）」で作る。前期の薄い音にはしない。
・だから絵も、色数を絞った後期ファミコンの画面として描く。階調を増やさない。
・効果音とキラキラは「後期の粒」。1つの当たりに白い円と短い線を必ず1つ置く。

【構図の条件】
・いちばん気持ちいい瞬間を切り取る（成功の直前か直後）。
・主役・敵・背景・UIが一目で区別できる。
・四角と丸だけで済ませず、題材らしい形と質感にする。
・画面外にはみ出すUIを描かない。

【禁止】
実在の人物の顔、公式ロゴ、実在ブランド、他社キャラクター、意味のない英字の羅列、透かし。`;
}

/* ---------- 3. 2Dアセットシート（A4 1枚にまとめる） ----------
   v1の「素材ごとに1枚ずつ15枚生成」は、画像AIに断られる・崩れる・
   サイズ指定が守られないで失敗しやすい。ここでは難易度を大きく下げる。
   ・画像は1枚だけ（A4横のシート）
   ・中に12マスを3行×4列で並べる
   ・透明なし・サイズ指定なし・文字なし
   ------------------------------------------------------------------ */
function promptAssets(plan){
  const rows = plan.sheet.map(s=>
    `　${String(s.n).padStart(2,'0')}｜${s.name}${s.note?'　… '+s.note:''}`
  ).join('\n');

  return `画像を1枚だけ作ってください。A4横の紙に、このゲームで使う絵を並べた「素材シート」です。

【いちばん大事なこと（これを守れば成功）】
1. 画像は1枚だけ。何枚も作らない。ファイルに分けない。
2. 1枚の中に、下の12マスを3行×4列で並べる。1マスに1つだけ描く。
3. 絵の中に文字を書かない。マス番号も書かない。数字も書かない。
4. 背景は白い紙。透明にしなくてよい。切り抜きも不要。
5. マスの区切りは、細い黒線を格子状に引くだけでよい。
6. 難しい描き込みをしない。太い黒線・ベタ塗り・影は1段だけ。
7. 途中で迷ったら、描く数を減らしてよい。全部そろえることより、1枚に収めることを優先する。

【このゲーム】
${plan.title}（${plan.genreLabel}／${plan.view}）

【このゲームの状況（絵の題材として使う。文字は描かない）】
${plan.situTitle}
・上の状況が分かる「物」を1マスに入れる：${plan.situGag}
・その物に付ける名前（文字は描かず、形で分かるように）：${plan.situEnemy}
・文字を描かない規則は守る。状況は「物の形」で表す。

【12マスの中身（左上から右へ、1行ずつ）】
${rows}

【共通の画風】
・フラットな2D。太い黒線、ベタ塗り、影は1段だけ。子どもの絵本のような素直な形。
・色は 黄 #FFD400 / 黒 #111111 / 白 #FFFFFF / 赤 #E23B2E / 緑 #2FA84F を基本に、必要な色だけ足す。
・輪郭は必ず黒。線をにじませない。

【主人公の見た目（登場するマスだけ。比率を守る）】
① 髪：角刈りパンチ。② 眼鏡：黒縁（サングラスではない）。③ 鼻にちょいがけ。④ 口髭（顎髭なし）。
衣装：黄色×黒のヒョウ柄。
${picoSpecShort()}
※ どのマスでも、目は細い横線のまま。口だけ開ける。表情を変えると別のキャラになる。

【マスの大きさの目安（指定ではなく目安）】
・1マスはだいたい同じ大きさにする。
・主役（01・02）のマスだけ、少し大きく描いてよい。
・背景のマス（09）は、マスいっぱいに広げる。

【うまくいかないときの簡単版（必ず添えて出す）】
もし12マスが多すぎる、または人物が描けないと言われた場合は、次のどちらかに落として作り直してください。
・簡単版A：マスを6つに減らす（01主人公 / 02動き / 03敵 / 04足場かアイテム / 05成功エフェクト / 06背景）。
・簡単版B：人物をやめて、ヒョウ柄の丸いキャラクター1体にする（顔は眼鏡と口髭の記号だけ）。

【エフェクトのマス（06・07）は、気持ちよさの演出をそのまま絵にする】
このゲームで使う演出：${(plan.juice||[]).slice(0,3).map(j=>j.name).join('・')}
・成功のマスは、放射状の線＋星＋丸い粒を8〜12個。中心を白く飛ばす。
・失敗のマスは、赤いバツ＋灰色の煙。
・線は太く、色は明るく。絵の上で「気持ちいい」と分かること。
・**エフェクトは「形を1つ作って色を変えて使い回す」前提で描く。**1マスに1種類まで。
  粒を何十個も描き込まない（描いても実装で使い回せず、そのまま重いゲームになる）。

【音（必須・素材ではないが、制作時に必ず守る）】
${NES_BGM_CORE}

【「面白い」が分かるマスを入れる（重要）】
・0秒の1手：${plan.kick}
・山場：${plan.spike}
→ 山場の画を、素材の中でも一番目立つマスに入れる。地味な通常状態だけにしない。

【不条理の手がかりになるマスを入れる】
このゲームの「無理やん」＝${plan.absurd.demand}
このゲームの「でも、いけそう」＝${plan.absurd.rescue}
・上の2つが、素材の中でも分かるように描く（例：「無理やん」の原因になる障害物と、
  救いになる小さな目印を、別々のマスに入れる）。
・主人公の表情は、どのマスでも真顔で統一する。笑っている顔にはしない。

【描かないもの】
実在の人物の顔、公式ロゴ、実在ブランド、他社キャラクター、意味のない英字、透かし、
影のグラデーション、3Dっぽい光沢、文字。

【重くしない（素材の時点で決めておく）】
・エフェクトのマスは「1マス＝1種類」にする。粒を何十個も描き込まない。
  描き込んだ粒は1枚の絵なので、実装では1個ずつ動かせない。動かせない粒は、そのまま「重いだけの飾り」になる。
・必要な粒の数は、実装側で「同時30個まで」と決めてある。だから素材は粒1〜3個でよい。
・同じ形を使い回す前提で描く（色だけ変えて使い回せる形にする）。形を毎回変えない。

【画像を出したあとに、文章で続けてください】
1. どのマスに何を描いたかを、12行で1行ずつ。
2. そのあと、Unityへの取り込み設定を表で：
   マス番号 / 素材名 / 切り抜き（Sprite Editorで矩形選択）/ Pixels Per Unit（100）/ 備考
3. どのマスが失敗していたら、そのマスだけ「もう一度、このマスだけ」と指示できるように、
   マスの位置（例：2行目の3番目）を添えて書く。`;
}

/* ---------- 4. WEBプロト ---------- */
function promptWeb(plan){
  return `HTML/CSS/JavaScriptを1ファイルにまとめて、${plan.duration}秒で遊べるWebミニゲームを作ってください。

【このプロンプトの読み方（これを最初に読む）】
このプロンプトは、**もう動く完成コードを最初に3つ並べてあります。文章より先に、この3つを貼ります。**
　1. 【参照コード】（すぐ下）… 入力・ジャンプ・粒・拡縮・揺れ・止め・数字・画面遷移・ループ
　2. 【参照コード2：音】（その直後）… ファミコン後期風のBGMと効果音6種（Web Audioで合成）
　3. 【キャラの描画コード】（最後）… ピコ太郎の drawPico
**あなたの仕事は、この3つを貼って、敵・当たり判定・得点（updateGame と drawGameObjects）だけを足すこと。**
骨格も音も自分で書き起こさない。貼ってから足す。これが今回の唯一の合格条件です。
そのあとに続く文章は、すべて**このコードを変えないための説明**です（読むだけ。コードを書き直す理由には使わない）。

【最重要の拘束】
${LOCK}

【仕様（変更禁止）】
・タイトル：${plan.title}
・ジャンル：${plan.genreLabel}
・プレイヤーがすること：${plan.loop}
・操作：${plan.input}
・成功条件：${plan.success}
・失敗条件：${plan.fail}
・1プレイ：${plan.duration}秒
・画面：TITLE → PLAY → RESULT（RESULTからRETRYで再開）

${coreBlock(plan)}

${audioBlock(plan)}

${INPUT_SPEC}

${situBlock(plan)}

${alwaysTwistBlock(plan)}

【展開：Startは普通。不条理は後から。最後は全員で加速】
${PK2.plan.escalateBlock(plan)}
${PK2.plan.ESCALATE_RULE}
・実装：TUNING.phases にこの6段階を配列で持ち、残り時間で nowPhase を切り替える。
  速度倍率は必ず「1つの変数 speedMul」に集約し、キャラも障害物もBGMもこの値から導く。

【刺激の1手（これが面白さの中心・1つだけ）】
${plan.twistLabel}：${plan.twistOne}
実装：${plan.twistHow || plan.twistOne}

【見せ場】
${plan.show}

【面白さの芯：「触った瞬間・山場・もう一回」の3つを必ず作る】
${FUN_RULE}
${funBlock(plan)}

【不条理：この企画の笑いの芯（ここを薄めない）】
${ABSURD_RULE}
${absurdBlock(plan)}

【不条理をコードで成立させる条件】
・**無理なのは要求であって、操作ではない。** 操作は「${plan.input}」のまま増やさない。
・上の「救い」を、必ず1つだけ実装する。救いを2つ以上入れない（簡単になりすぎて笑いが消える）。
・TUNING に難易度のつまみを置き、救いの効き具合を調整できるようにする：
  TUNING.rescue = { assist: 1.0 }   // 1.0が基準。0.8にすると歯ごたえが増す
・1プレイの成功率が「10回に2〜3回」になるように初期値を決める。
  0回（絶対無理）にも10回（余裕）にもしない。**失敗しても「今のは惜しい」で終わる**こと。
・失敗したときのリザルト画面に、失敗の理由を1行だけ出す（例：「幅が足りなかった」）。
  「もう一回」の理由を、笑いと一緒に渡す。
・成功したときは、無理をやっていない通常のゲームより強く喜ばせる（ジュースを最大にする）。

【実装条件】
・Canvas 2D APIのみ。外部ライブラリ・外部画像URL・CDN・Webフォントを使わない。
・図形・色・文字だけで描く。画像ファイルを読み込まない。
・TITLE→PLAY→RESULT→RETRYが必ず循環する。リトライは状態を完全に初期化する。
・移動・落下・タイマーは「1秒あたりの値 × dt」で更新し、dtは0.033秒を上限にする。
・コード冒頭に TUNING オブジェクトを置き、主要な数値を日本語コメント付きでまとめる。
・Consoleにエラーを出さない。配列は必ず初期化する。イベント登録は1回だけ。
・スマホでも遊べるように、画面内に大きなタップ領域を用意する。

【気持ちよさ（ジュース）：この5つを必ず実装する（ここが本題）】
${JUICE_RULE}
${juiceBlock(plan)}

${JUICE_SCALE}

【ジュースの書き方：参照コードの中に、もう実装済みで入っている】
下の【参照コード】の次の場所を**そのまま使う**（書き直さない）。ここには数値も再揭しない。
・ヒットストップ → \`var hitstop\` と \`update()\` の先頭2行（0より大きい間だけ全部止める）
・数字ポップ → \`⑤ 数字ポップ\`（popups を固定長6で確保、0.5秒で上へ、alpha 1→0）
・粒 → \`④ 粒\`（parts を固定長30で確保、0.30秒で消える、\`spawnParticles(30個上限)\`）
・画面の揺れ → \`⑥ 画面の揺れ\` と \`renderPlayScreen()\` の先頭（0.15秒で0へ戻す）
・拡縮 → \`③ 拡縮\`（足元原点・clamp 0.75〜1.30・1-(1-t)^3）
・演出のON/OFF → \`TUNING.juice = true / false\`（falseで全部止まる。発表で並べて見せる）
・クネクネ → \`⑥-2\`（bpm と同じ変数から作る。待機中も止めない）

**足すのは1つだけ**：このゲーム固有の「取得」「被弾」「成功」で
\`spawnParticles(x, y, 8, '#FFD400')\` と \`addScore(10, x, y)\` を呼ぶ（\`updateGame\` の中）。

${PERF_RULE}

${PERF_HARD}

${EFFECT_CHECK}

【ピコ太郎の見た目（図形で描く）】
${PICO_LOOK}

${picoSpecBlock()}

【描画の順番について（重要）】
この直後に「見た目」と「キャラの描画コード」があるが、コードは最後にもう一度出す。
先に読むのは「どう動かすか」のほう。**キャラを描くことに全力を使って、動きを忘れないこと。**

${WIGGLE_SPEC}

【実装：クネクネは参照コードの「⑥-2」に、もう入っている】
参照コードの中の \`swayX()\` がそれ。\`drawPico(ctx, player.x + swayX(), ...)\` の形で、
x を数pxだけずらしている。**このまま使う。書き直さない。**
・振れ幅は 34px（頭の幅）の 10%＝3.4px。これ以上大きくすると、別のキャラに見える。
・速さは **bpm から作る**（\`omega = 2π·bpm/60/2\`＝8分音符で1往復）。BGMと別々に持たない。
  加速したら、音も揺れも同じフレームで一緒に速くなる。
・**待機中も止めない。** 参照コードの \`update()\` の先頭で \`animT += dt\` を毎フレーム進めている。
  ここを if で囲むと、idle のときに止まって「止まった絵」になる。

【使うときのルール】
・呼び方は 参照コードの \`renderPlayScreen()\` の中の1行をそのまま使う：
  \`drawPico(ctx, player.x + swayX(), player.y, 34, pose, player.sx, player.sy, 1)\`
・拡縮の倍率と秒数は【拡縮（スクワッシュ＆ストレッチ）】の表から写す（ここには再揭しない）。
・足元基準で拡大縮小されるので、py は地面のYのままでよい（中心基準にしない）。
・顔（髪・眼鏡・口髭・目）は全ポーズ共通。**変えるのは傾きと口の開きと足の開きだけ。**
  目は細い横線のまま動かさない。口だけ開く。ここを崩すと別のキャラになる。
・**腕・脚・手は描かない**（このコードにもう入っていない。描き足さないこと）。
・第8引数 dir に -1 を渡すと左右反転する。走り・すべり・のぞきこむで向きを散らす。
${picoArtBlock(plan)}

吹き出しを1つ作り、開始・成功・失敗・コンボの4場面だけ「Pen!」「Oh!」「Yeah!」を0.9秒表示する。歌詞は使わない。

【音（Web Audioで合成・音源ファイルなし）】
**音は上の【参照コード2：音】に、もう鳴る形で入っています（書き直さない）。**
ここには「変えてはいけない数値」だけを書く。
・SEは6種（開始・ジャンプ・着地・得点・コンボ・失敗）。周波数は参照コード2から動かさない。
・「Pen」は高い2音（880Hz と 1320Hz を0.07秒ずらす）、「Apple」は丸い1音（sine 440Hz・0.16秒）。
  「Pineapple」は 330Hz に 335Hz を重ねてうならせる（差が5Hz。これより狭くしない。0.20秒）。
・**BGMは効果音より必ず小さくする**（master 0.22 に対し SE は0.4〜0.6）。埋もれると手応えが消える。
・うなり・2音ずらしは「耳で区別できる」ことを担保するための数値。変えない。

${NES_BGM_WEB}
${musicWebBlock(plan)}

【実装：BGMとクネクネと加速を1つの真実から作る】
**これは【参照コード2：音】に、もう入っています（\`var bpm\` を1つだけ持ち、BGMとswayX()が同じ値を見る）。**
・残り12秒→143／7秒→164／3秒→182。同じ場所で speedMul も切り替える（音と絵を同じフレームで）。
・**ノイズのBufferは1回だけ・DelayNode は1つだけ・OscillatorNode は必ず stop**（この3つもコードに入っている）。

【最後に：キャラの描画コード（これをそのまま使う・書き直さない・寸法を変えない）】
ここまでに書いた「動き・演出・音」が本体。キャラの絵は、それを成立させるための部品でしかない。
**キャラを凝ることに時間を使わないこと。コピーして、動かすことに集中する。**

【形の決まり：四角（矩形）だけで描く】
・このキャラは**四角の組み合わせ**でできている。丸・楕円・曲線を使わない。
・理由：四角なら描画命令が少なく、3分割クネクネで3回描いても軽い（実測 137命令／体）。
  手足を描くと209命令、曲線で描くと508命令になり、動きとエフェクトに使う処理を食う。
  **だから手足は描かない。**
・形を変えてもよいと思うのは「四角の大きさ」だけ。**角刈りハンバーグの箱・黒縁の四角い眼鏡・
  口髭の横一文字・黄色地に黒い四角の斑点**は変えない。ここがピコ太郎に見える根拠。

ポーズ名を変えるだけで、同じ顔のまま12の状態を作れます。
引数：ctx, x=足元のX, y=足元のY, s=頭の幅(px), pose, sx=横の潰れ倍率, sy=縦の伸び倍率

\`\`\`js
${PICO_DRAW_SRC}
\`\`\`

【この12ポーズを必ず使う（1つの絵を使い回さない）】
${poseAllBlock()}

【出力】
コード1つだけ。説明文は書かない。`;
}

/* ---------- 5. UnityMCP 依頼プロトコル ---------- */
function promptUnity(plan){
  return `添付する企画・資料・プロトタイプを解釈し、Unityでゲームを制作してください。
完成条件には、ゲームの動作だけでなく、私がUnity Editorから調整・拡張できる編集環境も含めます。

【制作方針】
・画面、キャラクター、アイテム、UIを実行時のコード生成だけで構成しないでください。
・シーン、プレハブ、Sprite、設定アセットとして保存し、Play前からHierarchyとInspectorで確認・編集できるようにしてください。
・コードは動作や判定を担当し、見た目・配置・調整値はUnity側のデータとして管理してください。

【編集できるようにするもの】
・キャラクター、アイテム、障害物は個別のプレハブにする。
・画像、サイズ、色、アニメーション、当たり判定を編集できるようにする。
・背景とUIはシーンまたはプレハブ内に配置し、Sceneビューで調整できるようにする。
・画像差し替えやプレハブの編集内容を、実行時にコードで元へ戻さない。
・制限時間、必要数、ライフ、速度、得点、難易度などはInspectorで調整できるようにする。
・ステージ設定はScriptableObject等のアセットに分離し、複製して別ステージを作れるようにする。
・出現時刻、位置、種類、数、速度など、レベルデザインに必要な項目を編集できるようにする。
・必要ならタイムラインや配置ツール、設定の不備を知らせる検証機能を用意する。

【テストと納品】
・UnityのPlay Modeでテストする。WebGL等のビルドは、私が明示的に依頼するまで実行しない。
・既存の変更を保護し、未保存シーンを勝手に上書きしない。
・完成時は編集対象のシーンを開き、何をどこで変更するかを説明する。
・制作手順だけを提案して終わらず、実際に編集できるシーン・プレハブ・設定アセットまで作成する。
・実際に確認した動作と未検証の項目を報告する。

────────────────────────
【この企画の仕様（ここは変えない）】
タイトル：${plan.title}
ジャンル：${plan.genreLabel}（${plan.family}）
視点：${plan.view}
操作：${plan.input}
1プレイ：${plan.duration}秒
成功条件：${plan.success}
失敗条件：${plan.fail}
刺激の1手：${plan.twistLabel}（${plan.twistOne}）
実装メモ：${plan.unity}
ピコ太郎の乗せ方：${plan.impl}
画面の見せ場：${plan.show}

【シーン構成（この3画面）】
Title / Game / Result

【Title画面に必ず出すもの（この企画のウリ）】
${situBlock(plan)}

${alwaysTwistBlock(plan)}

【展開：Startは普通→不条理→最後に加速】
${PK2.plan.escalateBlock(plan)}
${PK2.plan.ESCALATE_RULE}
・実装：StageConfig に6段階の配列（開始秒／速度倍率／BPM／同時出現数）を持たせ、残り時間で切り替える。
  速度倍率は1つのフィールド（speedMul）に集約し、キャラも障害物もBGMもここから導く。Inspectorで各段階を編集できるようにする。

【ピコ太郎のクネクネ＋キラキラ（待機中も止めない）】
${WIGGLE_SPEC}
・Unity側の実装：頭・胴・腰を別々の子オブジェクト（空のGameObject）に分けておき、
  それぞれの localPosition.x を sin(t*ω - 位相) で振る。SpriteRenderer はその子に付ける。
  ω は BGM の BPM から作る（AudioSource の pitch を変えたら、ω も同じ倍率で変える）。
・キラキラは ParticleSystem を1つ、発生位置を胴の子に追従させる（ルートに付けない）。

【BGM（必須：ファミコン後期／ロックマン・忍者龍剣伝・カービィ系）】
${NES_BGM}
・Unity側：音源ファイルは入れない指示と矛盾するので、BGMは「後で差し込む差し込み口」だけ作る。
  AudioSource を2つ（BGM用・SE用）置き、AudioSource.pitch = bpm / 128 で加速を表現できるようにする。
  ピッチを上げるとクネクネのωも同じ値から変わるように、BPMを1つのフィールドにしておく。
・**後期ファミコンは「チャンネルが5本ある」ことが本質。** 差し込み口もその前提で分けて作る：
  AudioSource を BgmCh1（旋律）／BgmCh2（アルペジオ）／BgmBass（三角）／BgmDrums（ノイズ）の4本に分け、
  加えてエコー用に AudioLowPassFilter と AudioEchoFilter を BgmCh1 に付ける。
  **1本のAudioSourceに全部まとめない。** まとめると、あとで音源を差し込むときに層を分けられなくなる。
・音量は ch1 0.16 / ch2 0.09 / bass 0.13 / drums 0.07 を、Inspector の volume に初期値として入れる。
  日本語の [Tooltip]（例：「旋律。ここだけエコーを掛ける」）を付ける。
・ピッチを上げるとクネクネのωも同じ値から変わるように、BPMを1つのフィールドにしておく。

【面白さの芯（この3つが無いと、動くだけのゲームになる）】
${FUN_RULE}
${funBlock(plan)}

【この3つの実装ルール】
・起動して1回目の入力で、必ず何かが起きるようにする（説明パネルを先に出さない）。
・山場の演出は1プレイ1回でよい。回数を増やすと、山場でなくなる。
・失敗リザルトに「もう一回の理由」を1行で出す（上の文章をそのまま使ってよい）。
${plan.music ? ('\n' + musicBlock(plan) + '\n') : ''}
【Prefab（この単位で作る）】
${plan.assets.map(a=>'・'+a).join('\n')}

【不条理：「無理やん → でも惜しい」を設計として入れる（この企画の笑いの芯）】
${ABSURD_RULE}
${absurdBlock(plan)}

【不条理の実装ルール】
・**無理なのは要求であって、操作ではない。** 操作は「${plan.input}」のまま増やさない。
・「救い」を必ず1つだけ実装する。2つ以上入れない（簡単になりすぎて笑いが消える）。
・救いの効き具合はInspectorで調整できるようにする：
  [Header("不条理")] public float rescueAssist = 1.0f;  // 1.0が基準。0.8で歯ごたえ増
  日本語の [Tooltip] で「小さくすると難しくなる。0にすると無理ゲーになる」と書く。
・成功率が「10回に2〜3回」になる初期値を入れる。0回にも10回にもしない。
・**失敗したときの理由を1行だけリザルトに出す**仕組みを作る（例：「幅が足りなかった」）。
  失敗の理由が分かると、もう一回を押す理由になる。ここが笑いの回収地点。
・成功時はジュースを最大にする（無理をやっていないゲームより強く喜ばせる）。
・主人公はどの状態でも真顔を保つ。表情差分を作らない（真顔で無理をやることが笑いの源）。

【気持ちよさ（ジュース）：この5つを必ず入れる】
${JUICE_RULE}
${juiceBlock(plan)}

【ジュースの実装ルール（コードで書くこと）】
・**スケールによる誇張**を必ず入れる。キャラのTransform.localScaleを直接書き換えるのではなく、
  子オブジェクトの見た目側（SpriteRendererを持つ子）のスケールを動かす。当たり判定を歪めないため。
  - 着地：localScale = (1.2, 0.8, 1) → 0.18秒で (1,1,1)。足元の位置が動かないよう、PivotはBottomにしておく。
  - ジャンプ：localScale = (0.85, 1.15, 1) → 0.12秒で戻す。
  - 倍率は 0.85〜1.25 の範囲を超えない。戻し忘れ防止に、コルーチンの終了時に必ず (1,1,1) を代入する。
・ヒットストップは自前のフラグ（例：bool frozen）で行う。Time.timeScale は 0 にしない。0.05〜0.08秒。
・数字ポップは TextMeshPro を1つ生成し、0.5秒で上へ移動＋alpha 0。使い終わったら Destroy する。
・粒子は ParticleSystem を1つ作り、色だけ変えて使い回す（Burst 8〜12個）。
・画面揺れはカメラのローカル座標を 0.15秒だけ動かして 0 に戻す（勝手に止まらないよう、コルーチンで必ず戻す）。
・演出の数値（0.18秒、1.2倍など）は、すべてInspectorで調整できるpublicフィールドに出す。
  [Header("ジュース")] を付け、日本語の [Tooltip] を書く。
・**ジュースをOFFにできるbool（例：bool juiceEnabled = true）を用意し、Inspectorから切り替えられるようにする。**

【重くしない（演出は全部入れる。ただしこの4つを守る）】
・**Instantiate / Destroy を毎回呼ばない。** 数字ポップも粒も、開始時にプール（配列）として先に作っておき、
  SetActive(true/false) で出し入れする。Destroy は毎フレームのGCを生み、Play中にカクつく原因になる。
・**ParticleSystem は1つだけ。** 色は ParticleSystem.MainModule.startColor で変える。色ごとに別のParticleSystemを作らない。
  Max Particles を 30 に明示的に設定する（既定は1000で、そのまま出すと重い）。
・**毎フレーム GetComponent を呼ばない。** Awake で1回だけ取ってフィールドに保持する。
  毎フレームの GetComponent は、粒が増えた瞬間に効いてくる。
・**Update の中で new を書かない。** Vector3 / Color などの構造体は問題ないが、
  List / 配列 / 文字列の連結を Update 内で作らない（毎フレーム確保するとGCが出る）。

【Inspectorで調整できるようにする値】
gameTime=${plan.duration} / targetScore=${plan.target} / maxLife=${plan.life}
moveSpeed / spawnInterval / fallSpeed（または弾速） / speedUpPerSec / comboMultiplier
※すべて [Header] と [Tooltip] を付け、日本語で意味を書く。

【ScriptableObjectにする設定アセット】
StageConfig（1ステージ分の上記パラメータ＋出現パターン）
複製してStageConfig_02 を作れば別ステージになる形にする。

────────────────────────
【トークンとクレジットを節約するための作業指示（重要）】
1. まず現状確認だけを行う。Hierarchy・Assets構成・既存スクリプト名を短く一覧で報告し、そこで一度止める。
2. 以後は「差分だけ」を書く。既存ファイルは全文を書き直さず、必要な箇所だけ変更する。
3. 同じ説明を繰り返さない。長い前置き・要約・感想・設計論を書かない。報告は箇条書き最大5行。
4. 画像は生成し直さず、私が添付した2D素材をそのまま使う。無い素材はプリミティブ（Cube/Quad）と単色で代用し、後で差し替えられるようにする。
5. アニメーションは Animator を作らず、コードの往復移動・スケール変化で表現してよい。凝ったTransitionを作らない。
6. 音は AudioSource の枠だけ用意し、音源ファイルは入れない（後で私が差し込む）。
7. パッケージ追加・Asset Store・有料アセットを使わない。標準の2D機能だけ。
8. 1回の返答で終わらせず、作業は「①シーンとPrefabの骨組み → ②入力と当たり判定 → ③スコア・時間・リザルト → ④演出」の4回に分けて進める。各回の最後に「次に作るもの」を1行だけ書く。
9. 私が「続けて」と書いたら、確認質問をせずに次の工程を実行する。
10. エラーが出た場合だけ、原因1行＋修正1行で報告する。

【最初にやること】
今のプロジェクト構成を確認して、上記のPrefabとシーンのうち「既にあるもの／無いもの」を表で出してください。まだファイルは作らないでください。`;
}

/* ---------- 6. 提案書生成プロンプト ---------- */
function promptProposal(plan, st){
  const gameNames = (st.games||[]).map(id=>(PK2.GAMES.find(g=>g.id===id)||{}).name).filter(Boolean);
  return `次のゲーム企画を、ステークホルダー向けの提案書に仕上げてください。
相手は「ピコ太郎（古坂大魔王）側の担当者」と「授業の評価者」です。読み手はゲームの内部事情を知りません。

【企画の素材（ここから動かさない）】
・タイトル：${plan.title}
・ジャンル：${plan.genreLabel}（${plan.family}）
・操作：${plan.input}／1プレイ：${plan.duration}秒
・コアループ：${plan.loop}
・成功条件：${plan.success}／失敗条件：${plan.fail}
・刺激の1手：${plan.twistLabel}（${plan.twistOne}）
・シチュエーション（タイトル画面に書く）：${plan.situTitle}
・その仕掛け（画面に名前を書く）：${plan.situEnemy}
・不条理（この企画の笑いの芯）：${plan.absurd.demand}
・でも、できそう：${plan.absurd.rescue}（合格の目安：${plan.absurd.rate}）
・0秒の1手：${plan.kick}
・山場：${plan.spike}
・もう一回の理由：${plan.again}
・学生が好きなゲーム：${gameNames.length?gameNames.join('・'):'（未選択）'}

【書く順番と内容】
1. **タイトル**：ゲーム名＋キャッチコピー1行（12文字以内）。
2. **後付けコンセプト**：この企画の「理屈」を2〜3文で。遊びが先にあり、意味は後から付いたことを隠さない書き方にする（「まず遊びがあり、そこに意味が重なる」という順序で書く）。誇張しない。
3. **なぜこの形なのか（ピコ太郎IPとの接続）**：
   - ピコ太郎の「${plan.cores.join('・')}」という性質を、どのルールに変換したか。
   - **不条理という笑いの型**：ピコ太郎の「真顔で、無理なことをやる」を、どのルールに変換したか。
     要求は無理に見えるのに、触れば「いける」と思える。その境界をどこに置いたかを書く。
     理不尽（手も足も出ない）にしていないことを、救いの1つを示して説明する。
   - 見た目・雰囲気の借用ではなく、判定・得点・失敗条件のどこに入っているかを具体的に。
   - このゲームからピコ太郎を外すと何が変わるか。
4. **ゲーム概要・説明**：遊び方を、画面の上から順に説明する。専門用語を使わない。1プレイの流れを時系列で。
   「一見うまくいきそうにないが、こうすれば通る」という説明を必ず1か所入れる。
5. **ウリのポイント／こだわりのポイント**：次の中から強いものを3つ選び、それぞれ「なぜそれが面白いのか」を1文添える。
   - ${plan.appeal.join('\n   - ')}
   さらに、次の3点は専門用語を使わずに、必ずそれぞれ1文ずつ入れる（選んだ3つとは別に書く）：
   - **ネタのウリ（必ず最初のほうに）**：タイトル画面に「${plan.situTitle}」と書いてあること。
     下から迫るものに「${plan.situEnemy}」と名前が付いていること。名前が笑いになる理由を1文で。
   - 気持ちよさの作り込み（つぶれ・止め・数字・粒）。実装名（ヒットストップ等）は書かず、遊んだ人が感じることだけを書く。
     例の形：「当たった瞬間にキャラが一瞬つぶれて、数字が跳ねる。同じ1回でも手応えが変わる。」
   - 不条理の笑し（無理やん→できた）。失敗しても惜しいので、もう一回を押したくなることを書く。
   - だんだん速くなること（メイドインワリオ式）。ただし「慣れればギリギリ通る」難易度にしたこと。
     難しくしすぎていないことを、数字で説明する（慣れた人で10回に4〜5回）。
   - **音の作り込み（必ず1文）**：BGMは「ファミコン後期（ロックマン／忍者龍剣伝／カービィ系）」の作り方で、
     旋律・アルペジオ・ベース・ドラムの4本を重ね、エコーとビブラートを掛けていること。
     曲名や実在アーティスト名は書かない。「後期ファミコンの音で作っている」とだけ書く。
   - **重くならない工夫（必ず1文・専門用語は使わない）**：演出は全部入れているが、同時に出る粒の数に上限を決め、
     使い回す形にしてあるので、遊んでいて重くならないこと。フレームレートの数値は書かない。
6. **ゲームイメージ**：初期構想の画像を1枚添える前提で、その画の説明を書く（${plan.show}）。
7. **古坂大魔王様へのメッセージ**：学生から直筆で出す想いとして、3〜4文。敬体。へりくだりすぎず、何を面白がっているかを自分の言葉で書く。持ち上げるだけの文章にしない。歌詞・既存フレーズの引用はしない。
   「無理やん、を真顔でやっている感じが面白いと思った」という方向のことを、自分の言葉で書く。

【トーン】
・背伸びをしない。等身大の学生の言葉で書く。
・「世界を変える」「革命」などの大げさな言葉を使わない。
・数字はこの企画にあるものだけを使う（${plan.duration}秒、${plan.life>1?'ライフ'+plan.life:'1発ミスまで'}、${plan.target?('目標'+plan.target):'生き残り'}）。

【出力形式】
Markdownの見出しだけで構成。前置き・自己紹介・謝辞の定型文は書かない。全体で1200〜1600字。`;
}

PK2.prompts = { promptPlan, promptImage, promptAssets, promptWeb, promptUnity, promptProposal,
                juiceBlock, absurdBlock, PICO_LOOK, LOCK, JUICE_RULE, ABSURD_RULE, PERF_RULE,
                INPUT_SPEC, JUICE_SCALE, EFFECT_CHECK, PERF_HARD, CORE_CODE, coreBlock,
                AUDIO_CODE, audioBlock,
                FUN_RULE, funBlock, musicBlock, musicWebBlock,
                situBlock, alwaysTwistBlock, WIGGLE_SPEC,
                NES_BGM, NES_BGM_CORE, NES_BGM_WEB, PPAP_BGM,
                PICO_SPEC, PICO_POSES, POSE_BY_GENRE, FACE_RULE,
                PICO_ART, picoArtBlock,
                picoSpecBlock, picoSpecShort, pickPoses, poseBlock, poseAllBlock, heroPose,
                drawPico, PICO_DRAW_SRC };
})();
