/* =========================================================
   PK//PROTO — マスタ + ゲームパターンDB（12件）
   ここは「スプレッドシートから書き出される側」。
   教員がシートを編集したら tools/sheet_export.gs でこの形式に落とす。
   ========================================================= */
window.PK = window.PK || {};

/* ---------- STEP1 誰に ---------- */
PK.AUDIENCES = [
  {id:'aud_kids',   label:'小学生',            note:'漢字は少なめ。失敗しても痛くない', dev:'tap'},
  {id:'aud_teen',   label:'中高生',            note:'短くて派手。SNS的なノリ', dev:'both'},
  {id:'aud_20s',    label:'10〜20代',          note:'テンポと気持ちよさ重視', dev:'both'},
  {id:'aud_pico',   label:'ピコ太郎を知っている世代', note:'元ネタの記憶がある', dev:'both'},
  {id:'aud_nonppap',label:'PPAPを知らない若年層', note:'初見で伝わる必要がある', dev:'tap'},
  {id:'aud_global', label:'海外ユーザー',      note:'言語に頼れない', dev:'both'},
  {id:'aud_family', label:'親子・ファミリー',  note:'大人と子どもが一緒に遊ぶ', dev:'both'},
  {id:'aud_sns',    label:'SNSユーザー',       note:'見せたくなる瞬間が要る', dev:'tap'},
  {id:'aud_casual', label:'短時間の暇つぶし',  note:'1分で終わる', dev:'tap'},
  {id:'aud_class',  label:'授業内で遊ぶ',      note:'静かな環境。音は控えめ', dev:'pc'}
];

/* ---------- STEP2 ピコ太郎の価値 ---------- */
/* mech: ◎=ゲームの仕組みにできる / ○=構造に効く / △=見た目・雰囲気のみ */
PK.IP_VALUES = [
  {id:'ip_combine',   g:'PPAP由来', label:'異なるものを組み合わせる', mech:'◎', note:'PPAPの構造そのもの。判定や得点にできる'},
  {id:'ip_unexpected',g:'PPAP由来', label:'予想外の組み合わせ',       mech:'◎', note:'結果が裏切る。当てる／外す遊びになる'},
  {id:'ip_repeat',    g:'PPAP由来', label:'反復',                     mech:'◎', note:'同じ動作を繰り返す。リズムと相性が良い'},
  {id:'ip_nonsense',  g:'PPAP由来', label:'意味不明なのに成立する',   mech:'○', note:'ルールの説明を短くできる'},
  {id:'ip_mimic',     g:'PPAP由来', label:'真似できる',               mech:'○', note:'身体を動かす遊びになる'},
  {id:'ip_gesture',   g:'PPAP由来', label:'身振り',                   mech:'○', note:'言葉なしで伝える遊びになる'},
  {id:'ip_rhythm',    g:'PPAP由来', label:'リズム',                   mech:'◎', note:'タイミング判定に直結'},
  {id:'ip_short',     g:'PPAP由来', label:'短い',                     mech:'△', note:'尺の設計に効く'},
  {id:'ip_phrase',    g:'PPAP由来', label:'フレーズ',                 mech:'△', note:'文言・掛け声に使う'},

  {id:'vis_leopard',  g:'ビジュアル', label:'ヒョウ柄',       mech:'△', note:'背景・UIの柄'},
  {id:'vis_yellow',   g:'ビジュアル', label:'黄色',           mech:'△', note:'主役の色。視認性が高い'},
  {id:'vis_gold',     g:'ビジュアル', label:'金色',           mech:'△', note:'得点・成功演出'},
  {id:'vis_sunglass', g:'ビジュアル', label:'サングラス',     mech:'△', note:'シルエットの記号'},
  {id:'vis_loud',     g:'ビジュアル', label:'派手',           mech:'△', note:'画面のテンション'},
  {id:'vis_silhouette',g:'ビジュアル',label:'一発で分かるシルエット', mech:'△', note:'小さい画面でも見分けられる'},
  {id:'vis_pose',     g:'ビジュアル', label:'変なポーズ',     mech:'○', note:'ポーズ当てになる'},
  {id:'vis_face',     g:'ビジュアル', label:'表情',           mech:'△', note:'リアクションの強さ'},

  {id:'ch_deadpan',   g:'キャラクター', label:'真面目に変なことをする', mech:'○', note:'失敗の見せ方が笑いになる'},
  {id:'ch_exaggerate',g:'キャラクター', label:'大げさ',       mech:'○', note:'成功・失敗の演出'},
  {id:'ch_surreal',   g:'キャラクター', label:'シュール',     mech:'○', note:'間の取り方'},
  {id:'ch_silly',     g:'キャラクター', label:'バカバカしい', mech:'○', note:'失敗を罰にしない'},
  {id:'ch_wordless',  g:'キャラクター', label:'言葉が分からなくても伝わる', mech:'◎', note:'海外・子ども向けの核'},
  {id:'ch_body',      g:'キャラクター', label:'身体表現',     mech:'○', note:'操作と直結させやすい'},
  {id:'ch_kids',      g:'キャラクター', label:'子供でも分かる', mech:'○', note:'ルールを1文に'},
  {id:'ch_confident', g:'キャラクター', label:'自信満々',     mech:'△', note:'口上・UIの文言'},
  {id:'ch_friendly',  g:'キャラクター', label:'親しみやすい', mech:'△', note:'導入のしやすさ'},
  {id:'ch_weird',     g:'キャラクター', label:'怪しいが怖くない', mech:'△', note:'トーン調整'},

  {id:'sp_mimic',     g:'拡散性', label:'真似したくなる',     mech:'○', note:'身体動作に落とす'},
  {id:'sp_show',      g:'拡散性', label:'他人に見せたくなる', mech:'△', note:'結果画面の設計'},
  {id:'sp_reaction',  g:'拡散性', label:'リアクション',       mech:'○', note:'失敗時の表情・音'},
  {id:'sp_oneneta',   g:'拡散性', label:'一発ネタ',           mech:'△', note:'短さで成立させる'},
  {id:'sp_short',     g:'拡散性', label:'短尺',               mech:'△', note:'60秒設計'},
  {id:'sp_parody',    g:'拡散性', label:'パロディ',           mech:'○', note:'元ネタの構造を使う'},
  {id:'sp_global',    g:'拡散性', label:'世界共通で理解できる', mech:'○', note:'言語非依存'},

  {id:'in_visual',    g:'国際性', label:'視覚だけで分かる',   mech:'○', note:'アイコン・色で伝える'},
  {id:'in_sound',     g:'国際性', label:'音',                 mech:'◎', note:'リズム・効果音がルールになる'},
  {id:'in_gesture',   g:'国際性', label:'ジェスチャー',       mech:'◎', note:'ポーズ入力'},
  {id:'in_repeat',    g:'国際性', label:'繰り返し',           mech:'◎', note:'同じ形が続くと覚える'},
  {id:'in_culture',   g:'国際性', label:'異文化をつなぐ',     mech:'○', note:'モチーフの混在'},
  {id:'in_language',  g:'国際性', label:'言語依存が少ない',   mech:'○', note:'文言を減らす'},

  {id:'so_handwash',  g:'社会・教育', label:'手洗い・感染症対策', mech:'◎', note:'順番を守る遊びになる'},
  {id:'so_traffic',   g:'社会・教育', label:'交通安全',       mech:'◎', note:'判断する遊びになる'},
  {id:'so_eco',       g:'社会・教育', label:'環境・ゴミ分別', mech:'◎', note:'仕分ける遊びになる'},
  {id:'so_sdgs',      g:'社会・教育', label:'SDGs',           mech:'○', note:'テーマの重み付け'},
  {id:'so_edu',       g:'社会・教育', label:'教育',           mech:'○', note:'学びの要素'},
  {id:'so_explain',   g:'社会・教育', label:'難しいことを楽しく伝える', mech:'○', note:'比喩に落とす'},
  {id:'so_admin',     g:'社会・教育', label:'行政・啓発',     mech:'△', note:'文言のトーン'},

  {id:'co_char',      g:'コラボ性', label:'他キャラと組み合わせ', mech:'○', note:'2体目のキャラ'},
  {id:'co_anything',  g:'コラボ性', label:'何でもPPAP化できる', mech:'◎', note:'アイテムの追加が遊びになる'},
  {id:'co_involve',   g:'コラボ性', label:'他人を巻き込む',   mech:'○', note:'2人プレイ・交代制'},
  {id:'co_talent',    g:'コラボ性', label:'タレントとの共演', mech:'△', note:'画像のトーン'},
  {id:'co_brand',     g:'コラボ性', label:'ブランドとのコラボ', mech:'△', note:'配色・ロゴ位置'}
];

/* ---------- STEP3 感情 ---------- */
PK.EMOTIONS = [
  {id:'emo_laugh',      label:'笑わせたい',           ok:'思わず吹き出す',       ng:'失敗が罰にならない', tone:'コミカル'},
  {id:'emo_surprise',   label:'驚かせたい',           ok:'予想を裏切る',         ng:'驚くが理不尽ではない', tone:'サプライズ'},
  {id:'emo_comfort',    label:'気持ちよくしたい',     ok:'連続で決まる',         ng:'テンポが落ちない', tone:'爽快'},
  {id:'emo_hype',       label:'盛り上がらせたい',     ok:'音と速度で高まる',     ng:'熱量が落ちない', tone:'アツい'},
  {id:'emo_show',       label:'誰かに見せたくなりたい',ok:'結果が語りたくなる',   ng:'恥ずかしくない', tone:'見せたくなる'},
  {id:'emo_failsmile',  label:'失敗して笑わせたい',   ok:'転んでも笑える',       ng:'理不尽に殺さない', tone:'おとぼけ'},
  {id:'emo_retry',      label:'もう一回挑戦したくなりたい', ok:'あと少しで届く',  ng:'悔しさが残る', tone:'挑戦'},
  {id:'emo_unexpected', label:'予想外を楽しませたい', ok:'結果が読めない',       ng:'ランダムすぎない', tone:'変'},
  {id:'emo_mimic',      label:'つい真似したくなりたい',ok:'身体が動く',          ng:'恥ずかしくない', tone:'身体'},
  {id:'emo_rhythm',     label:'リズムに乗せたい',     ok:'音に乗る',             ng:'ズレが気持ちいい', tone:'ノリ'}
];

/* ---------- STEP4 動詞 ---------- */
PK.VERB_GROUPS = [
  {g:'組み合わせ系', verbs:[
    {id:'v_combine',label:'組み合わせる',pat:'P07',d:2},{id:'v_merge',label:'合体する',pat:'P07',d:2},
    {id:'v_link',label:'つなげる',pat:'P07',d:2},{id:'v_mix',label:'混ぜる',pat:'P07',d:2},
    {id:'v_stack2',label:'重ねる',pat:'P09',d:3},{id:'v_align',label:'合わせる',pat:'P04',d:1},
    {id:'v_synth',label:'合成する',pat:'P07',d:3},{id:'v_pair',label:'ペアにする',pat:'P07',d:1},
    {id:'v_match',label:'マッチさせる',pat:'P07',d:1},{id:'v_swap',label:'入れ替える',pat:'P07',d:2}
  ]},
  {g:'リズム・身体系', verbs:[
    {id:'v_press',label:'押す',pat:'P06',d:1},{id:'v_tap',label:'タップする',pat:'P06',d:1},
    {id:'v_stop',label:'止める',pat:'P05',d:2},{id:'v_mimic',label:'真似する',pat:'P12',d:1},
    {id:'v_dance',label:'踊る',pat:'P06',d:2},{id:'v_swing',label:'振る',pat:'P06',d:2},
    {id:'v_pose',label:'ポーズする',pat:'P05',d:1},{id:'v_timing',label:'タイミングを取る',pat:'P04',d:2},
    {id:'v_beat',label:'リズムを刻む',pat:'P06',d:1}
  ]},
  {g:'選択系', verbs:[
    {id:'v_choose',label:'選ぶ',pat:'P01',d:1},{id:'v_hit',label:'当てる',pat:'P04',d:1},
    {id:'v_distinguish',label:'見分ける',pat:'P03',d:1},{id:'v_judge',label:'判断する',pat:'P08',d:1},
    {id:'v_sort',label:'仕分ける',pat:'P03',d:2},{id:'v_search',label:'探す',pat:'P11',d:1},
    {id:'v_compare',label:'比べる',pat:'P08',d:1},{id:'v_line',label:'並べる',pat:'P03',d:2},
    {id:'v_find',label:'見つける',pat:'P11',d:1}
  ]},
  {g:'反射系', verbs:[
    {id:'v_avoid',label:'避ける',pat:'P02',d:1},{id:'v_take',label:'取る',pat:'P01',d:1},
    {id:'v_catch',label:'捕まえる',pat:'P01',d:1},{id:'v_return',label:'打ち返す',pat:'P10',d:2},
    {id:'v_break',label:'壊す',pat:'P10',d:2},{id:'v_bounce',label:'跳ね返す',pat:'P10',d:3},
    {id:'v_run',label:'逃げる',pat:'P02',d:1},{id:'v_chase',label:'追う',pat:'P02',d:2},
    {id:'v_touch',label:'タッチする',pat:'P05',d:1}
  ]},
  {g:'積む・物理系', verbs:[
    {id:'v_stack',label:'積む',pat:'P09',d:2},{id:'v_drop',label:'落とす',pat:'P04',d:1},
    {id:'v_throw',label:'投げる',pat:'P04',d:2},{id:'v_roll',label:'転がす',pat:'P09',d:3},
    {id:'v_support',label:'支える',pat:'P09',d:2},{id:'v_balance',label:'バランスを取る',pat:'P09',d:2},
    {id:'v_collapse',label:'崩す',pat:'P09',d:2},{id:'v_ride',label:'乗せる',pat:'P09',d:2},
    {id:'v_carry',label:'運ぶ',pat:'P01',d:2}
  ]},
  {g:'収集系', verbs:[
    {id:'v_collect',label:'集める',pat:'P01',d:1},{id:'v_pick',label:'拾う',pat:'P01',d:1},
    {id:'v_steal',label:'奪う',pat:'P01',d:2},{id:'v_absorb',label:'取り込む',pat:'P01',d:2},
    {id:'v_complete',label:'そろえる',pat:'P01',d:2},{id:'v_comp',label:'コンプリートする',pat:'P01',d:3}
  ]},
  {g:'コミュニケーション系', verbs:[
    {id:'v_tell',label:'伝える',pat:'P12',d:2},{id:'v_answer',label:'応える',pat:'P05',d:1},
    {id:'v_call',label:'呼びかける',pat:'P12',d:1},{id:'v_share',label:'通じ合わせる',pat:'P05',d:2},
    {id:'v_gesture',label:'身振りする',pat:'P05',d:1},{id:'v_signal',label:'合図する',pat:'P05',d:2},
    {id:'v_react',label:'反応する',pat:'P12',d:1}
  ]},
  {g:'変化・意外性系', verbs:[
    {id:'v_change',label:'変える',pat:'P07',d:2},{id:'v_transform',label:'変身する',pat:'P07',d:2},
    {id:'v_predict',label:'予想する',pat:'P08',d:1},{id:'v_betray',label:'裏切る',pat:'P08',d:2},
    {id:'v_discover',label:'発見する',pat:'P11',d:2},{id:'v_try',label:'試す',pat:'P07',d:1},
    {id:'v_watch',label:'反応を見る',pat:'P07',d:1}
  ]}
];

/* ---------- STEP5 作れる型 ---------- */
PK.TYPES = [
  {id:'t_lr',    label:'左右移動',   engines:['E01','E03','E08'], level:1},
  {id:'t_run',   label:'自動ラン',   engines:['E01'], level:2},
  {id:'t_tap',   label:'タップ',     engines:['E06','E09'], level:1},
  {id:'t_click', label:'クリック',   engines:['E06','E09'], level:1},
  {id:'t_drag',  label:'ドラッグ',   engines:['E08','E10'], level:2},
  {id:'t_fall',  label:'落下',       engines:['E03','E08'], level:1},
  {id:'t_stack', label:'積む',       engines:['E11'], level:2},
  {id:'t_avoid', label:'避ける',     engines:['E01'], level:1},
  {id:'t_collect',label:'集める',    engines:['E03'], level:1},
  {id:'t_break', label:'壊す',       engines:['E12'], level:2},
  {id:'t_bounce',label:'跳ね返す',   engines:['E12'], level:2},
  {id:'t_choose',label:'選ぶ',       engines:['E09'], level:1},
  {id:'t_sort',  label:'仕分ける',   engines:['E08'], level:2},
  {id:'t_match', label:'合わせる',   engines:['E06','E10'], level:2},
  {id:'t_timing',label:'タイミング', engines:['E06','E07'], level:1},
  {id:'t_phys',  label:'簡単な物理', engines:['E11'], level:2},
  {id:'t_quiz',  label:'クイズ', engines:['E13'], level:1},
  {id:'t_plat',  label:'横スクロール（マリオ型）', engines:['E14'], level:2},
  {id:'t_surv',  label:'ヴァンサバ型（大量の敵）', engines:['E15'], level:3},
  {id:'t_vshoot',label:'縦シューティング', engines:['E16'], level:2},
  {id:'t_hshoot',label:'横シューティング', engines:['E17'], level:2},
  {id:'t_rhythm4',label:'リズム（4ボタン）', engines:['E18'], level:1},
  {id:'t_maze',  label:'迷路探索', engines:['E19'], level:2},
  {id:'t_run3d', label:'3Dラン', engines:['E20'], level:3},
  {id:'t_clickrate', label:'クリック連打', engines:['E21'], level:1},
  {id:'t_fps',   label:'1人称ダンジョン探索', engines:['E22'], level:3}
];

/* ---------- UI マスタ ---------- */
PK.UI_MASTER = {
  SCORE:  {label:'SCORE',   pos:'右上',     why:'今の得点。増えた瞬間にポップさせる'},
  TIMER:  {label:'TIMER',   pos:'上中央',   why:'残り時間。最後の10秒は色を変える'},
  LIFE:   {label:'LIFE',    pos:'左上',     why:'残機。減ったら画面を一瞬揺らす'},
  COMBO:  {label:'COMBO',   pos:'中央上',   why:'連続成功。3以上で表示する'},
  JUDGE:  {label:'JUDGE',   pos:'中央',     why:'PERFECT / MISS を0.4秒だけ出す'},
  TARGET: {label:'TARGET',  pos:'左上',     why:'集める数や残り数を常時表示'},
  NEXT:   {label:'NEXT',    pos:'右上',     why:'次に来るアイテムを予告する'},
  GUIDE:  {label:'操作説明',pos:'開始時のみ',why:'最初の3秒だけ出す'},
  RESULT: {label:'RESULT',  pos:'結果画面', why:'成功／失敗と理由を1文で'},
  START:  {label:'START',   pos:'タイトル', why:'開始ボタン。押しやすく大きく'},
  RETRY:  {label:'RETRY',   pos:'結果画面', why:'もう一回。押したら完全初期化'},
  LANE:   {label:'レーン表示',pos:'下部',   why:'受け皿の位置を示す'}
};

/* ---------- 素材マスタ ---------- */
PK.ASSET_MASTER = {
  a_pico:    {role:'キャラクター', name:'ピコ太郎（記号化）', size:'256×256', fake:'黄色×黒ヒョウ柄の体／黒い角刈りパンチ（縮れ頭）／鼻にちょいがけの黒縁眼鏡／口髭', pri:'中', path:'Assets/Sprites/Player'},
  a_pico_dot:{role:'キャラクター', name:'ピコ太郎 ドット絵', size:'64×64（4倍表示）', fake:'16×16ドットの黄色×黒／角刈りパンチ／鼻にちょいがけ眼鏡／口髭', pri:'中', path:'Assets/Sprites/Player'},
  a_pen:     {role:'アイテム', name:'Pen',    size:'128×128', fake:'白い棒＋黒い線1本', pri:'低', path:'Assets/Sprites/Items'},
  a_apple:   {role:'アイテム', name:'Apple',  size:'128×128', fake:'赤い丸＋緑の葉', pri:'低', path:'Assets/Sprites/Items'},
  a_pine:    {role:'アイテム', name:'Pineapple', size:'128×128', fake:'黄色い楕円＋緑のトゲ', pri:'低', path:'Assets/Sprites/Items'},
  a_leopard: {role:'背景', name:'ヒョウ柄ステージ', size:'1920×1080', fake:'黄色地に黒い斑点のタイル', pri:'高', path:'Assets/Sprites/BG'},
  a_floor:   {role:'背景', name:'床・ライン', size:'1920×200', fake:'黒い帯＋黄色のライン', pri:'低', path:'Assets/Sprites/BG'},
  a_basket:  {role:'UI', name:'受け皿（籠）', size:'256×128', fake:'茶色の台形＋ラベル', pri:'中', path:'Assets/Sprites/UI'},
  a_sunglass:{role:'UI', name:'サングラス',   size:'128×64', fake:'黒い2つの丸＋ブリッジ', pri:'低', path:'Assets/Sprites/UI'},
  a_badge:   {role:'UI', name:'コンボバッジ', size:'128×128', fake:'黄色い星', pri:'低', path:'Assets/Sprites/UI'},
  a_fx_ok:   {role:'エフェクト', name:'成功', size:'256×256', fake:'黄色い星の拡散', pri:'低', path:'Assets/Prefabs/FX'},
  a_fx_miss: {role:'エフェクト', name:'ミス', size:'256×256', fake:'赤い×の拡散＋画面揺れ', pri:'低', path:'Assets/Prefabs/FX'},
  a_fx_pop:  {role:'エフェクト', name:'得点ポップ', size:'128×128', fake:'数字が上に跳ねる', pri:'低', path:'Assets/Prefabs/FX'},
  a_block:   {role:'足場', name:'ブロック', size:'128×128', fake:'茶色の四角＋黒い線', pri:'低', path:'Assets/Sprites/Stage'},
  a_enemy:   {role:'敵', name:'敵', size:'128×128', fake:'紫の丸＋目2つ', pri:'中', path:'Assets/Sprites/Enemy'},
  a_bullet:  {role:'弾', name:'弾', size:'32×32', fake:'白い丸＋黄色い縁', pri:'低', path:'Assets/Sprites/Bullet'},
  a_coin:    {role:'アイテム', name:'コイン', size:'64×64', fake:'黄色い丸＋白い光', pri:'低', path:'Assets/Sprites/Items'},
  a_wall:    {role:'背景', name:'壁', size:'128×128', fake:'灰色の四角＋影', pri:'低', path:'Assets/Sprites/Stage'},
  a_goal:    {role:'目標', name:'ゴール', size:'128×192', fake:'赤い旗＋白いポール', pri:'中', path:'Assets/Sprites/Stage'},
  a_cube3d:  {role:'3D', name:'キューブ（Primitive）', size:'−', fake:'Unity標準のCubeをそのまま使う', pri:'低', path:'（生成）'},
  a_panel:   {role:'UI', name:'問題パネル', size:'800×300', fake:'白い角丸＋黒縁', pri:'低', path:'Assets/Sprites/UI'},
  a_arrow:   {role:'UI', name:'矢印', size:'96×96', fake:'白い三角＋黒縁', pri:'低', path:'Assets/Sprites/UI'},
  a_door:    {role:'ギミック', name:'扉', size:'128×192', fake:'茶色の四角＋金の取っ手', pri:'中', path:'Assets/Sprites/Stage'}
};

/* ---------- SE マスタ ---------- */
PK.SE_MASTER = {
  se_decide:{label:'決定', file:'se_decide.wav', len:'0.08秒', when:'ボタンを押した瞬間', tone:'短い矩形波（ピッ）', vol:'-6dB'},
  se_tap:   {label:'タップ', file:'se_tap.wav', len:'0.04秒', when:'入力のたび', tone:'ごく短いクリック（カッ）', vol:'-10dB'},
  se_get:   {label:'アイテム取得', file:'se_get.wav', len:'0.18秒', when:'正しく取れた瞬間', tone:'上がる2音（C5→E5）', vol:'-4dB'},
  se_ok:    {label:'正解', file:'se_ok.wav', len:'0.25秒', when:'判定が成功した瞬間', tone:'明るい3音（C-E-G）', vol:'-4dB'},
  se_ng:    {label:'不正解', file:'se_ng.wav', len:'0.22秒', when:'判定が失敗した瞬間', tone:'下がる2音（G3→D3）', vol:'-6dB'},
  se_hit:   {label:'衝突', file:'se_hit.wav', len:'0.15秒', when:'障害物に当たった瞬間', tone:'短いノイズ＋低音', vol:'-3dB'},
  se_score: {label:'得点', file:'se_score.wav', len:'0.12秒', when:'スコアが増えた瞬間', tone:'高い1音（E6）', vol:'-8dB'},
  se_start: {label:'ゲームスタート', file:'se_start.wav', len:'0.6秒', when:'プレイ開始時', tone:'3音の上昇（ドミソ）', vol:'-4dB'},
  se_end:   {label:'ゲーム終了', file:'se_end.wav', len:'0.8秒', when:'リザルトへ移る瞬間', tone:'2音の下降＋余韻', vol:'-4dB'},
  se_combo: {label:'コンボ', file:'se_combo.wav', len:'0.14秒', when:'3連続ごと', tone:'音程が上がる（コンボ数×半音）', vol:'-6dB'}
};

/* BGM：エンジンごとの基準。感情でムードを差し替える */
PK.BGM_MASTER = {
  E01:{bpm:132, key:'Am', mood:'せわしないコミカル', instr:'ドラム＋跳ねるベース＋短いブラス', loop:45},
  E03:{bpm:120, key:'C',  mood:'軽快で前向き',       instr:'マリンバ＋クラップ＋ウッドベース', loop:45},
  E06:{bpm:112, key:'F',  mood:'緊張と解放',         instr:'ピアノ＋指パッチン＋低いドローン', loop:40},
  E07:{bpm:120, key:'Em', mood:'ノリ重視',           instr:'キック＋ハイハット＋シンセベース', loop:60},
  E08:{bpm:124, key:'G',  mood:'真面目に忙しい',     instr:'マリンバ＋カウベル＋ブラス', loop:45},
  E09:{bpm:116, key:'D',  mood:'クイズ番組的',       instr:'シンセブラス＋ティンパニ＋拍手', loop:40},
  E10:{bpm:110, key:'Bb', mood:'実験室的わくわく',   instr:'マリンバ＋グロッケン＋軽いベース', loop:45},
  E11:{bpm:100, key:'A',  mood:'不安定でコミカル',   instr:'ピチカート＋チューブラーベル', loop:40},
  E12:{bpm:126, key:'Cm', mood:'レトロゲーム',       instr:'矩形波リード＋ノイズドラム', loop:50}
};

/* =========================================================
   ゲームパターン 12件
   ========================================================= */
PK.PATTERNS = [
{
  id:'P01', name:'PPAPキャッチ', family:'落下系', engine:'E03', dim:'2D', level:1,
  input:'左右移動', duration:60, difficulty:1,
  oneline:'上から落ちてくるPen・Apple・Pineappleのうち、必要なものだけを受ける。',
  action:'左右に移動して、上から落ちてくるアイテムのうち、指定されたものだけを受ける。',
  successTpl:'{{duration}}秒で{{target}}個正しく取る',
  failTpl:'{{life}}回、不要なもの（または取り逃し）を取る',
  loop:'指定を見る → 左右に動く → 受ける → 正誤の音と数字が返る',
  retry:'後半で落下速度が上がる／自己ベストの1個差／コンボが切れた地点からやり直したい',
  ipHook:'「Pen + Apple = 正解」など、2つ揃った瞬間だけボーナス。組み合わせが得点の仕組みに入る。',
  nums:{target:20, life:3, fall:2.2, interval:0.9, speedup:0.012},
  verbs:['取る','集める','選ぶ','見分ける'], verbGroup:'収集系',
  ip:{ip_combine:1.0, vis_leopard:.5, vis_yellow:.6, vis_sunglass:.4, ch_deadpan:.5, ip_repeat:.6, sp_short:.4},
  emo:['emo_comfort','emo_retry','emo_laugh'], aud:['aud_kids','aud_casual','aud_family','aud_class'],
  imageComp:'横3レーン。上からPen・Apple・Pineappleが落ちてくる。下に受け皿（籠）を3つ、その上にピコ太郎が立っている。上部に「今回取るもの」のアイコンを大きく1つ表示。',
  imageMood:'黄色と黒のヒョウ柄の背景に、原色のアイテムが映える。画面全体がにぎやかで、少し安っぽいくらいが正しい。',
  codeNotes:'レーンは3本。アイテムは x = laneX + ゆれ、で落下。受け判定はプレイヤーの当たり判定とアイテムの矩形の重なり。必要アイテムと不要アイテムを1:2の比率で出す。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['TARGET','必須'],['COMBO','任意'],['GUIDE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_pen','a_apple','a_pine','a_leopard','a_basket','a_fx_ok','a_fx_miss','a_fx_pop'],
  se:['se_get','se_ng','se_score','se_start','se_end','se_combo'],
  bgm:'BGMなしでも成立（取得音の連打が気持ちよさになる）',
  warn:[]
},
{
  id:'P02', name:'ピコ太郎 落下回避', family:'落下系', engine:'E01', dim:'2D', level:1,
  input:'左右移動', duration:60, difficulty:1,
  oneline:'上から降ってくる巨大なPenとPineappleを、ひたすら避ける。',
  action:'左右に移動して、上から落ちてくる障害物（Pen・Pineapple・Apple）を避ける。',
  successTpl:'{{duration}}秒 生き残る',
  failTpl:'障害物に{{life}}回当たる',
  loop:'影を見る → 左右に逃げる → ぎりぎりで避ける → 速度が上がる',
  retry:'あと3秒だった／避け方が分かってきた／速度が上がるほど気持ちいい',
  ipHook:'当たった瞬間に「あぁ〜」の大げさなリアクションと、ヒョウ柄の画面が割れる演出。失敗が笑いになる。',
  nums:{target:0, life:3, fall:3.0, interval:0.75, speedup:0.02},
  verbs:['避ける','逃げる','追う'], verbGroup:'反射系',
  ip:{vis_leopard:.8, ch_exaggerate:1.0, ch_silly:.7, vis_yellow:.5, sp_reaction:.6, ip_short:.4},
  emo:['emo_failsmile','emo_hype','emo_laugh'], aud:['aud_kids','aud_teen','aud_casual','aud_class'],
  imageComp:'縦長の画面に、上から巨大なPenとPineappleが降ってくる。下でピコ太郎が左右に逃げている。落下地点に赤い影。画面の端にライフが3つ。',
  imageMood:'黄色と黒の派手な背景。障害物は画面の1/3くらいの大きさで、当たると痛そうに見える。',
  codeNotes:'障害物は x をランダム、y を画面外から。落下中に影（半透明の円）を地面に描く。当たり判定は円で近似。speedupで落下速度に毎秒加算。',
  ui:[['SCORE','任意'],['TIMER','必須'],['LIFE','必須'],['GUIDE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_pen','a_pine','a_leopard','a_fx_miss','a_fx_pop'],
  se:['se_hit','se_start','se_end','se_decide'],
  bgm:'BGMなしでも成立（効果音と「あぁ〜」の掛け声だけで成立）',
  warn:['ip']
},
{
  id:'P03', name:'PPAP仕分け', family:'仕分け', engine:'E08', dim:'2D', level:2,
  input:'左右移動', duration:60, difficulty:2,
  oneline:'落ちてくるPen・Apple・Pineappleを、正しい籠に振り分ける。',
  action:'左右に移動して、落ちてくるアイテムを正しい籠の位置で受ける。',
  successTpl:'{{duration}}秒で{{target}}個 正しく仕分ける',
  failTpl:'{{life}}回 間違った籠に入れる',
  loop:'アイテムを見る → 籠の位置へ動く → 仕分ける → 正誤が返る → 次が落ちる',
  retry:'速度が上がる／連続正解の記録／どの籠か一瞬迷う難しさ',
  ipHook:'Pen + Apple + Pineapple + Pen の順で入れると「PPAP完成」ボーナス。順番そのものが得点になる。',
  nums:{target:24, life:3, fall:2.4, interval:0.85, speedup:0.015},
  verbs:['仕分ける','見分ける','選ぶ','並べる','判断する'], verbGroup:'選択系',
  ip:{ip_combine:1.0, ip_repeat:.8, vis_leopard:.6, vis_yellow:.5, ch_kids:.5, in_visual:.5},
  emo:['emo_comfort','emo_hype','emo_retry'], aud:['aud_kids','aud_teen','aud_family','aud_global','aud_class'],
  imageComp:'画面下に3つの籠（Pen用・Apple用・Pineapple用）。上からアイテムが落ちてくる。中央にピコ太郎。籠には大きくアイコンが描かれている。',
  imageMood:'業務用の仕分け現場のような、妙に真面目な雰囲気。黄色と黒で統一。',
  codeNotes:'籠は3つ、x座標で判定。アイテムの種類と籠のタグが一致したら正解。3連続で「PPAP完成」ボーナス。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['COMBO','必須'],['TARGET','必須'],['LANE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_pen','a_apple','a_pine','a_basket','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_get','se_ok','se_ng','se_combo','se_start','se_end'],
  bgm:'BGMなしでも成立',
  warn:[]
},
{
  id:'P04', name:'PenをAppleへ刺せ', family:'タイミング', engine:'E06', dim:'2D', level:1,
  input:'1ボタン', duration:45, difficulty:1,
  oneline:'左右に動くAppleめがけて、タイミングよくPenを落とす。',
  action:'Appleが的中心に来た瞬間にボタンを押して、Penを落とす。',
  successTpl:'{{duration}}秒で{{target}}回 成功させる',
  failTpl:'{{life}}回 外す',
  loop:'動きを読む → 押す → 刺さる／外れる → 判定が出る → 次が来る',
  retry:'判定が「あと少し」で外れる／連続成功の手触り／中心付近の音が気持ちいい',
  ipHook:'刺さった瞬間に「ペン・アップル！」と掛け声。成功の快感にフレーズを乗せる。',
  nums:{target:10, life:3, fall:5.0, interval:1.6, speedup:0.02},
  verbs:['合わせる','タイミングを取る','当てる','落とす','押す'], verbGroup:'リズム・身体系',
  ip:{ip_phrase:.8, ip_rhythm:1.0, ip_repeat:.7, vis_yellow:.6, ch_deadpan:.6, sp_mimic:.4},
  emo:['emo_comfort','emo_rhythm','emo_retry'], aud:['aud_teen','aud_20s','aud_pico','aud_casual','aud_class'],
  imageComp:'画面中央に大きなAppleが横に往復している。その真上にPenが待機。中心に照準のライン。右上に成功数。',
  imageMood:'的当ての緊張感。背景は暗めにして、Appleの赤とPenの白を際立たせる。',
  codeNotes:'Appleは sin 波で往復。中心からのズレで PERFECT / GOOD / MISS の3段階。押した瞬間にPenが落下し、刺さったら成功。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['JUDGE','必須'],['COMBO','必須'],['GUIDE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_pen','a_apple','a_leopard','a_fx_ok','a_fx_miss','a_fx_pop'],
  se:['se_ok','se_ng','se_score','se_combo','se_start','se_end'],
  bgm:'BGMなしでも成立（判定音のリズムで遊べる）',
  warn:[]
},
{
  id:'P05', name:'ポーズを合わせろ', family:'タイミング', engine:'E06', dim:'2D', level:1,
  input:'方向キー', duration:45, difficulty:1,
  oneline:'画面に出たポーズと同じ方向キーを、表示が消える前に押す。',
  action:'画面に表示されたポーズ（上下左右）と同じ方向キーを、制限時間内に押す。',
  successTpl:'{{duration}}秒で{{target}}回 成功させる',
  failTpl:'{{life}}回 間違える、または時間切れ',
  loop:'ポーズを見る → 方向を判断する → 押す → 合否が出る → 間隔が縮まる',
  retry:'後半の表示時間が短くなる／手が覚えてくる／連続成功の気持ちよさ',
  ipHook:'ポーズ自体がピコ太郎の身振り。真似する行為がそのままゲームの操作になる。',
  nums:{target:15, life:3, fall:0, interval:2.0, speedup:0.03},
  verbs:['真似する','ポーズする','合わせる','反応する','応える'], verbGroup:'リズム・身体系',
  ip:{ip_gesture:1.0, ip_mimic:1.0, ch_body:.8, ch_wordless:.7, vis_pose:.8, sp_mimic:.7},
  emo:['emo_mimic','emo_rhythm','emo_hype'], aud:['aud_kids','aud_global','aud_family','aud_sns','aud_class'],
  imageComp:'画面中央に大きくピコ太郎のシルエットがポーズを取っている。四隅に方向キーのアイコン。残り時間を示すリング。',
  imageMood:'サイネージのような明快さ。ポーズは1秒で読める太いシルエット。',
  codeNotes:'4方向のポーズをランダムに提示。表示時間は difficulty に応じて 1.2秒→0.6秒。キー入力の正誤で判定。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['JUDGE','必須'],['COMBO','必須'],['GUIDE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_ok','se_ng','se_combo','se_tap','se_start','se_end'],
  bgm:'BGMなしでも成立',
  warn:[]
},
{
  id:'P06', name:'PPAPリズム', family:'タイミング', engine:'E07', dim:'2D', level:2,
  input:'3キー', duration:60, difficulty:2,
  oneline:'流れてくるPen・Apple・Pineappleのレーンに合わせて、3つのキーを叩く。',
  action:'3本のレーンを流れるアイテムが判定ラインに来た瞬間に、対応するキーを押す。',
  successTpl:'{{duration}}秒で{{target}}回 判定を取る',
  failTpl:'{{life}}回 大きく外す（MISS）',
  loop:'見る → リズムを取る → 叩く → 判定が出る → 音が重なる',
  retry:'曲が頭に残る／FULL COMBOが近い／判定の幅が狭くなる',
  ipHook:'音と反復がそのままルール。言語が分からなくても遊べる。',
  nums:{target:40, life:5, fall:0, interval:0.55, speedup:0.0},
  verbs:['リズムを刻む','押す','タップする','タイミングを取る','合わせる'], verbGroup:'リズム・身体系',
  ip:{ip_rhythm:1.0, ip_repeat:1.0, in_sound:1.0, in_repeat:.9, vis_yellow:.5, ch_deadpan:.4},
  emo:['emo_rhythm','emo_comfort','emo_hype'], aud:['aud_teen','aud_20s','aud_global','aud_sns','aud_class'],
  imageComp:'3本の縦レーン。上からPen・Apple・Pineappleのノーツが流れる。下に判定ライン。背景にヒョウ柄。',
  imageMood:'音ゲーの画面。暗い背景に黄色いラインが光る。ノーツは原色で見分けやすい。',
  codeNotes:'ノーツは一定間隔で3レーンのどれかに生成。判定ラインとの距離で PERFECT/GOOD/MISS。音はWeb Audioの短い音で代用。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['JUDGE','必須'],['COMBO','必須'],['LANE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico_dot','a_pen','a_apple','a_pine','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_tap','se_ok','se_ng','se_combo','se_start','se_end'],
  bgm:'BGMがあると強い（なくても判定音だけで成立）',
  warn:[]
},
{
  id:'P07', name:'PPAP合体', family:'組み合わせ', engine:'E10', dim:'2D', level:2,
  input:'ドラッグ', duration:60, difficulty:2,
  oneline:'2つのアイテムをドラッグで重ねて、成立する組み合わせを作る。',
  action:'画面のアイテムをドラッグして重ね、成立する組み合わせを作る。',
  successTpl:'{{duration}}秒で{{target}}組 成立させる',
  failTpl:'{{life}}回 成立しない組み合わせを作る',
  loop:'アイテムを見る → 組み合わせを考える → 重ねる → 結果を見る → 次を探す',
  retry:'成立パターンの発見／奇妙な結果を見たい／残り時間で何組できるか',
  ipHook:'組み合わせそのものが遊び。成立しない組み合わせにも別の結果が返るので、試すこと自体が面白い。',
  nums:{target:8, life:3, fall:0, interval:0, speedup:0},
  verbs:['組み合わせる','合体する','つなげる','混ぜる','ペアにする','試す'], verbGroup:'組み合わせ系',
  ip:{ip_combine:1.0, ip_unexpected:1.0, co_anything:.9, ip_nonsense:.8, vis_loud:.5, sp_show:.5},
  emo:['emo_surprise','emo_unexpected','emo_show'], aud:['aud_teen','aud_20s','aud_pico','aud_sns','aud_global'],
  imageComp:'画面中央に2つのスロット。周囲にアイテムが散らばっている。スロットに重ねると結果が中央に出現。',
  imageMood:'実験室のようなわくわく感。結果のアイテムだけ大きく光る。',
  codeNotes:'アイテムはドラッグ可能。2つが重なったら組み合わせ表を参照。成立なら正解、不成立でも固有の結果を返す。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['NEXT','任意'],['GUIDE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_pen','a_apple','a_pine','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_decide','se_get','se_ok','se_ng','se_start','se_end'],
  bgm:'BGMなしでも成立',
  warn:[]
},
{
  id:'P08', name:'間違いPPAP', family:'組み合わせ', engine:'E09', dim:'2D', level:1,
  input:'2択', duration:60, difficulty:1,
  oneline:'出てきた組み合わせが「成立する」か「しない」かを、2つのボタンで即答する。',
  action:'画面に出た2つのアイテムの組み合わせを見て、成立するかどうかを左右のボタンで答える。',
  successTpl:'{{duration}}秒で{{target}}問 正解する',
  failTpl:'{{life}}回 間違える',
  loop:'組み合わせを見る → 判断する → 押す → 正誤が返る → 次が出る',
  retry:'テンポが上がる／見慣れない組み合わせが出る／連続正解',
  ipHook:'成立する／しないの基準が「PPAPかどうか」。判断の物差しがピコ太郎の世界観になる。',
  nums:{target:20, life:3, fall:0, interval:1.8, speedup:0.02},
  verbs:['判断する','見分ける','比べる','予想する','選ぶ'], verbGroup:'選択系',
  ip:{ip_combine:.9, ip_nonsense:.9, ip_unexpected:.8, ch_kids:.6, in_visual:.5, sp_parody:.5},
  emo:['emo_laugh','emo_surprise','emo_retry'], aud:['aud_kids','aud_teen','aud_family','aud_global','aud_class'],
  imageComp:'画面中央に2つのアイテムが並ぶ。左右に「成立」「不成立」の大きなボタン。上部に残り時間。',
  imageMood:'クイズ番組のような明快さ。ボタンは画面の3分の1を占める大きさ。',
  codeNotes:'組み合わせ表からランダムに1問。左＝成立、右＝不成立。回答後0.4秒で次へ。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['COMBO','必須'],['JUDGE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_pen','a_apple','a_pine','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_ok','se_ng','se_combo','se_tap','se_start','se_end'],
  bgm:'BGMなしでも成立',
  warn:[]
},
{
  id:'P09', name:'ピコ太郎タワー', family:'積み上げ', engine:'E11', dim:'2D', level:2,
  input:'1ボタン', duration:60, difficulty:2,
  oneline:'左右に揺れるPen・Apple・Pineappleを、タイミングよく落として積む。',
  action:'左右に揺れるアイテムの位置を見て、ボタンで落とし、下の台の上に積む。',
  successTpl:'{{target}}段 積み上げる（または{{duration}}秒で最高段数を狙う）',
  failTpl:'積み上が崩れて全部落ちる',
  loop:'揺れを見る → 離す → 積もる → 崩れそうになる → 次を狙う',
  retry:'あと1段で自己ベスト／崩れる寸前の緊張／積み方が上手くなる',
  ipHook:'積み上がった形がそのまんま「PPAP」。Pen・Apple・Pineappleの順で積むと完成ボーナス。',
  nums:{target:8, life:1, fall:2.0, interval:1.1, speedup:0.01},
  verbs:['積む','バランスを取る','支える','落とす','崩す'], verbGroup:'積む・物理系',
  ip:{ip_combine:.8, ip_repeat:.7, vis_loud:.7, ch_exaggerate:.7, vis_silhouette:.6, sp_show:.5},
  emo:['emo_hype','emo_retry','emo_failsmile'], aud:['aud_kids','aud_teen','aud_family','aud_sns'],
  imageComp:'画面下から積み上がったタワー。上に次のアイテムが左右に揺れている。積み上がった形が崩れそう。',
  imageMood:'不安定な積み木の緊張感。背景は派手だが、タワーはシルエットで読める。',
  codeNotes:'アイテムは左右に往復。ボタンで落下、下のオブジェクトに当たったら固定。重心が大きく外れたら崩れる判定。',
  ui:[['SCORE','必須'],['TARGET','必須'],['TIMER','任意'],['GUIDE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_pen','a_apple','a_pine','a_leopard','a_floor','a_fx_ok','a_fx_miss'],
  se:['se_hit','se_score','se_ok','se_start','se_end'],
  bgm:'BGMなしでも成立',
  warn:[]
},
{
  id:'P10', name:'Pen Pong', family:'ブロック崩し', engine:'E12', dim:'2D', level:2,
  input:'左右移動', duration:90, difficulty:2,
  oneline:'Penをパドルにして、AppleとPineappleのブロックを壊す。',
  action:'左右に移動してPenを操作し、跳ね返したボールでApple・Pineappleのブロックを壊す。',
  successTpl:'{{duration}}秒以内にブロックを{{target}}個 壊す',
  failTpl:'ボールを{{life}}回落とす',
  loop:'ボールを追う → 跳ね返す → ブロックが壊れる → 崩れ方が変わる',
  retry:'残りブロックが少ない／角度で崩し方が変わる／あと1個',
  ipHook:'壊したブロックの並びが「Pen・Apple・Pineapple」の順なら完成ボーナス。崩す順番が遊びになる。',
  nums:{target:18, life:3, fall:0, interval:0, speedup:0.005},
  verbs:['打ち返す','壊す','跳ね返す','追う'], verbGroup:'反射系',
  ip:{ip_combine:.7, ip_repeat:.6, vis_leopard:.7, vis_gold:.4, ch_confident:.4, sp_parody:.4},
  emo:['emo_comfort','emo_hype','emo_retry'], aud:['aud_teen','aud_20s','aud_pico','aud_class'],
  imageComp:'画面下部にPenのパドル。上部にApple（赤）とPineapple（黄）のブロックが整列。ボールは白い点。',
  imageMood:'レトロゲームの画面。暗い背景にブロックが原色で光る。',
  codeNotes:'パドルは左右移動、ボールは反射。ブロックはグリッド配置。壊した数をカウント。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['TARGET','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_pen','a_apple','a_pine','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_hit','se_score','se_ng','se_start','se_end'],
  bgm:'BGMなしでも成立（跳ね返る音の連打で成立）',
  warn:[]
},
{
  id:'P11', name:'ヒョウ柄だけ集めろ', family:'落下系', engine:'E03', dim:'2D', level:1,
  input:'左右移動', duration:60, difficulty:1,
  oneline:'大量に落ちてくるものの中から、ヒョウ柄のものだけを集める。',
  action:'左右に移動して、落ちてくるアイテムのうちヒョウ柄のものだけを取る。',
  successTpl:'{{duration}}秒で{{target}}個 集める',
  failTpl:'{{life}}回 ヒョウ柄以外を取る',
  loop:'見分ける → 動く → 取る → 見分けの速度が上がる',
  retry:'似た柄が増える／見分けが速くなる／取り逃しが悔しい',
  ipHook:'「ピコ太郎らしさ」を見分ける行為そのものがルール。柄が判断基準になる。',
  nums:{target:20, life:3, fall:2.6, interval:0.8, speedup:0.015},
  verbs:['見分ける','見つける','集める','選ぶ','探す'], verbGroup:'選択系',
  ip:{vis_leopard:1.0, vis_yellow:.8, vis_silhouette:.7, sp_mimic:.4, ch_kids:.5, in_visual:.6},
  emo:['emo_comfort','emo_unexpected','emo_retry'], aud:['aud_kids','aud_family','aud_sns','aud_class'],
  imageComp:'画面にヒョウ柄・水玉・無地など様々な柄のアイテムが降ってくる。ヒョウ柄だけが黄色く光っている。',
  imageMood:'柄の洪水。とにかく情報量が多く、見分けるのが少し大変そうに見える。',
  codeNotes:'アイテムに柄の種類を持たせ、ヒョウ柄だけ正解。似た柄（水玉・まだら）を混ぜる。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['TARGET','必須'],['COMBO','任意'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_leopard','a_pen','a_apple','a_pine','a_fx_ok','a_fx_miss'],
  se:['se_get','se_ng','se_score','se_combo','se_start','se_end'],
  bgm:'BGMなしでも成立',
  warn:[]
},
{
  id:'P12', name:'真似しろ！', family:'タイミング', engine:'E06', dim:'2D', level:1,
  input:'方向キー', duration:45, difficulty:1,
  oneline:'ピコ太郎の動きを、表示された順番どおりに再現する。',
  action:'画面に表示される3つの動き（上下左右）を覚えて、同じ順番でキーを押す。',
  successTpl:'{{duration}}秒で{{target}}回 成功させる',
  failTpl:'{{life}}回 順番を間違える',
  loop:'動きを見る → 覚える → 順番に押す → 正誤が出る → 長くなる',
  retry:'覚えられたのに手が滑る／だんだん長くなる／リズムで覚えられる',
  ipHook:'真似するという行為がそのままルール。身体表現がゲームの中心にある。',
  nums:{target:8, life:3, fall:0, interval:2.4, speedup:0.02},
  verbs:['真似する','真似する','覚える','応える','反応する'], verbGroup:'コミュニケーション系',
  ip:{ip_mimic:1.0, ip_gesture:.9, ch_body:.8, in_repeat:.8, ip_repeat:.8, sp_mimic:.6},
  emo:['emo_mimic','emo_laugh','emo_hype'], aud:['aud_kids','aud_global','aud_family','aud_sns','aud_class'],
  imageComp:'画面中央にピコ太郎。周囲に「上・下・左・右」の矢印が順番に光る。下に4方向のキーガイド。',
  imageMood:'ダンスの振り付けを覚えるような画面。矢印は大きく、色で区別。',
  codeNotes:'3〜5個の方向を順に提示（1つ0.5秒）。提示後にキー入力を受け、順番と一致するか判定。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['JUDGE','必須'],['COMBO','必須'],['GUIDE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_ok','se_ng','se_combo','se_tap','se_start','se_end'],
  bgm:'BGMなしでも成立（掛け声だけで成立）',
  warn:[]
}
];

/* 重み（教員がシートで変える前提。コードに直書きしない） */
PK.WEIGHTS = {ip:.30, verb:.22, emo:.18, aud:.12, tech:.18, penaltyLevel:1, engineRepeat:.12, familyRepeat:.06};

/* IPパッチ（弱い案に足す1手） */
PK.IP_PATCHES = [
  {id:'patch_combine', label:'組み合わせ', hook:'正しい2つの組み合わせでだけボーナスが入る。', prefab:'CombinationJudge'},
  {id:'patch_gesture', label:'身振り',     hook:'ポーズや方向の入力が判定に加わる。', prefab:'RhythmJudge'},
  {id:'patch_rhythm',  label:'リズム',     hook:'判定にタイミングの窓ができ、早い／遅いで得点が変わる。', prefab:'RhythmJudge'},
  {id:'patch_wordless',label:'言葉なし',   hook:'説明文を消し、アイコンと音だけでルールが伝わるようにする。', prefab:'UIManager'},
  {id:'patch_repeat',  label:'反復',       hook:'同じ動作を3回続けると完成する区切りを入れる。', prefab:'ComboManager'},
  {id:'patch_unexpected',label:'予想外',   hook:'一定確率で結果が変わり、外れても別の面白い結果が出る。', prefab:'RandomSpawner'},
  {id:'patch_social',  label:'社会啓発',   hook:'正しい行動を選ぶと得点になる判断を1つ足す。', prefab:'MatchJudge'}
];



PK.PATTERNS = PK.PATTERNS.concat([
{
  id:'P23', name:'3Dキャッチ', family:'落下系', engine:'E23', level:2, dim:'3D',
  input:'左右移動', duration:60, difficulty:2,
  oneline:'3Dの空間に落ちてくるPen・Apple・Pineappleを、動いて受け止める。',
  action:'左右に移動して、上から落ちてくるアイテムのうち指定されたものだけを、体で受け止める。',
  successTpl:'{{duration}}秒で{{target}}個 受け止める',
  failTpl:'{{life}}回 取り逃す、または不要なものを取る',
  loop:'影を見る → 3D空間で位置を合わせる → 受ける → 正誤が返る',
  retry:'奥行きの感覚が掴めてくる／後半で落下が速くなる／あと1個',
  ipHook:'受けたアイテムが手元に積まれ、Pen＋Apple＋Pineappleが揃うと「PPAP!」で一気に得点。',
  nums:{target:18, life:3, fall:2.2, interval:0.95, speedup:0.012},
  verbs:['取る','集める','受ける','選ぶ'], verbGroup:'収集系',
  ip:{ip_combine:.9, vis_leopard:.7, vis_yellow:.6, ch_exaggerate:.5, sp_short:.3},
  emo:['emo_comfort','emo_hype','emo_retry'], aud:['aud_teen','aud_20s','aud_pico','aud_class'],
  imageComp:'三人称の少し上から見た3D画面。手前にピコ太郎の後ろ姿、奥からアイテムが落ちてくる。地面に丸い影。' ,
  imageMood:'黄色と黒の3Dステージ。影がはっきり落ちるライティングで、落下地点が読める。',
  codeNotes:'アイテムは3DのCube（または球）。落下地点に影（半透明の円）を出す。プレイヤーはX軸のみ移動。当たりはBoxColliderの重なりで判定。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['TARGET','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_cube3d','a_pen','a_apple','a_pine','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_get','se_ng','se_score','se_combo','se_start','se_end'],
  bgm:'BGMなしでも成立', warn:[]
},
{
  id:'P24', name:'3D迷路', family:'迷路', engine:'E24', level:2, dim:'3D',
  input:'4方向移動', duration:90, difficulty:2,
  oneline:'3Dの迷路を歩いて、3つのアイテムを集めて出口へ。',
  action:'3D空間を上下左右に歩き、壁を避けながら3つのアイテムを集めて出口に入る。',
  successTpl:'{{duration}}秒以内に3つ集めて出口へ',
  failTpl:'時間切れ',
  loop:'歩く → 曲がる → 行き止まり → 戻る → 集める → 出口',
  retry:'地図を覚えた／あと1個／近道を見つけた',
  ipHook:'3つ揃うと出口の扉が開き、開いた瞬間に照明が黄色くなって「PPAP!」の掛け声が鳴る。',
  nums:{target:3, life:1, fall:0, interval:0, speedup:0},
  verbs:['歩く','探す','集める','迷う','見つける'], verbGroup:'収集系',
  ip:{ip_combine:.7, vis_leopard:.7, ch_deadpan:.5, in_visual:.5, ip_phrase:.4},
  emo:['emo_unexpected','emo_retry','emo_comfort'], aud:['aud_kids','aud_family','aud_class','aud_global'],
  imageComp:'3Dの見下ろし気味の迷路。壁は灰色のCube、床はヒョウ柄。アイテムが3つ光る。奥に扉。',
  imageMood:'薄暗い3Dの迷路に、黄色いライトが差す。',
  codeNotes:'迷路は2次元配列で生成し、1マス=2mのCubeを並べる。プレイヤーはTransformの前後左右移動のみ（回転なし）。カメラは斜め上から追従。',
  ui:[['TIMER','必須'],['TARGET','必須'],['GUIDE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_cube3d','a_coin','a_door','a_leopard','a_fx_ok'],
  se:['se_get','se_decide','se_ok','se_start','se_end'],
  bgm:'BGMありが望ましい（低いドローン）', warn:[]
}
]);

/* ---------- 演出（ジュース）辞書 ---------- */
PK.JUICE = {
  hitstop:   {name:'ヒットストップ', when:'当たった・決まった瞬間', how:'0.06秒だけ全オブジェクトの更新を止める（Time.timeScale=0 ではなく自前のフラグ）', tune:'0.05〜0.08秒。長いと重くなる'},
  shake:     {name:'画面揺れ',       when:'被弾・爆発・失敗',       how:'カメラのローカル座標をランダムに±0.15動かし、0.15秒で戻す', tune:'振幅0.1〜0.2、周波数は高すぎない'},
  squash:    {name:'つぶれ（伸縮）', when:'着地・ジャンプ・被弾',   how:'scale を (1.25,0.75) → (0.9,1.1) → (1,1) と0.2秒で補間', tune:'大きすぎるとゴムに見える'},
  flash:     {name:'フラッシュ',     when:'成功・大ダメージ',       how:'全画面の白パネルの alpha を 0.7→0 に0.08秒で', tune:'0.06〜0.1秒。 epilepsy 配慮で点滅は秒2回以下'},
  particles: {name:'粒子',           when:'成功・取得・破壊',       how:'ParticleSystem を1つ作り、色を変えて使い回す（Burst 8〜12個）', tune:'同時50個まで。Mobileなら20'},
  popup:     {name:'数字ポップ',     when:'得点が入った瞬間',       how:'TextMeshPro を生成し、上に0.5秒で移動＋フェード', tune:'+1 は小さく、+10 は大きく'},
  trail:     {name:'残像',           when:'移動・落下',             how:'SpriteRenderer のゴーストを0.1秒ごとに複製して alpha を落とす', tune:'3〜5枚まで'},
  anticipation:{name:'溜め（予兆）', when:'出現の0.2秒前',          how:'地面に影を出し、キャラを少し縮める。音は无声→「来る」と分かるだけ', tune:'0.15〜0.3秒。長いとテンポが死ぬ'},
  slowmo:    {name:'スロー',         when:'最後の1個・決定的瞬間',  how:'Time.timeScale を 0.35 にして 0.3秒後に戻す（コルーチン）', tune:'1プレイに1回まで'},
  zoom:      {name:'寄り',           when:'成功の瞬間',             how:'カメラの orthographicSize を 5% 縮めて0.2秒で戻す', tune:'5〜8%。大きくすると酔う'},

  dmg:       {name:'被弾エフェクト',  when:'ダメージを受けた瞬間',   how:'赤いビネット（画面端）を0.25秒出し、プレイヤーを0.1秒点滅、ノックバック0.2', tune:'赤は強すぎると不快。alpha 0.35まで'},
  recoil:    {name:'のけぞり',        when:'被弾・失敗',             how:'キャラを当たった方向と逆へ0.15だけ動かし、0.12秒で戻す', tune:'動かしすぎると操作が効かなくなる'},
  jumpCharge:{name:'ジャンプの溜め',  when:'ジャンプボタンを押した瞬間', how:'押した瞬間に scale を (1.15,0.85) にして0.08秒ためてから跳ぶ', tune:'0.06〜0.1秒。長いと反応が鈍く感じる'},
  landSquash:{name:'着地の沈み込み',  when:'着地した瞬間',           how:'scale を (1.2,0.8) → (0.95,1.05) → (1,1) と0.18秒で補間。同時に砂ぼこり', tune:'落下距離が長いほど強く（0.8〜1.3倍）'},
  landDust:  {name:'着地の砂ぼこり',  when:'着地した瞬間',           how:'足元にParticleSystem（横方向に広がる円形、8個、0.3秒）', tune:'色は背景に合わせて薄く'},
  skid:      {name:'急停止のブレーキ',when:'移動キーを離した瞬間',   how:'進行方向と逆に小さなパーティクルを出し、scaleを(1.1,0.9)に。0.1秒で戻す', tune:'出しすぎるとうるさい。速度が一定以上の時だけ'},
  moveTrail: {name:'移動の残像',      when:'移動中（速度が閾値以上）',how:'0.05秒ごとに半透明のゴーストを複製。alpha 0.35→0', tune:'3枚まで。止まったら出さない'},
  bloom:     {name:'ブルーム（発光）',when:'常時（弱く）／成功時に強く', how:'Post Processing VolumeでBloomを入れ、Threshold 1.0・Intensity 0.6。成功時だけ1.4へ', tune:'強すぎると白飛び。MobileではOFF推奨'},
  hitSpark:  {name:'火花',            when:'攻撃が当たった瞬間',     how:'当たった点にParticleSystem（放射状6個、0.15秒）＋一瞬の白い円', tune:'発生点は必ず当たり位置に'},
  chase:     {name:'寄り（成功時）',  when:'成功・レベルアップ',     how:'カメラの orthographicSize を5%縮め、0.25秒で戻す', tune:'5〜8%。連発すると酔う'},
  freeze:    {name:'一瞬の停止',      when:'大成功・決着',           how:'0.12秒だけ全更新を止め、白フラッシュと同時に', tune:'0.1秒を超えると「重い」と感じる'},
  countUp:   {name:'スコアのカウントアップ', when:'リザルト表示',    how:'0から最終値まで0.6秒で数字を回す（音は0.05秒ごと）', tune:'長すぎると待たされる。0.5〜0.8秒'},
  bgmDuck:   {name:'BGMの音量下げ',   when:'成功音・掛け声の瞬間',   how:'BGMのvolumeを0.6倍にし、0.3秒で戻す', tune:'SEを前に出す定番テク'},
  comboscale:{name:'コンボ演出',     when:'3連続ごと',              how:'コンボ数字を拡大→戻す。音程を上げる。背景の彩度を上げる', tune:'音程は半音ずつ、6回で頭打ち'}
};


/* ---------- 追加エンジン分のUI補助（既存UIマスタで足りる） ---------- */

/* ---------- 追加パターン 10件 ---------- */
PK.PATTERNS = PK.PATTERNS.concat([
{
  id:'P13', name:'PPAPクイズ', family:'クイズ', engine:'E13', dim:'2D', level:1,
  input:'2択（左右）', duration:60, difficulty:1,
  oneline:'「これはPPAPか？」。出てきた組み合わせを見て、2択で即答する。',
  action:'画面に出た2つのアイテムの組み合わせを見て、PPAPとして成立するかを左右のボタンで答える。',
  successTpl:'{{duration}}秒で{{target}}問 正解する',
  failTpl:'{{life}}回 間違える',
  loop:'組み合わせを見る → 考える → 押す → 正誤と解説が返る → 次へ',
  retry:'早押しのテンポ／見慣れない組み合わせ／連続正解',
  ipHook:'「PPAPかどうか」という判定基準そのものがピコ太郎の世界観。正解の理由に必ずフレーズが入る。',
  nums:{target:12, life:3, fall:0, interval:2.2, speedup:0.02},
  verbs:['判断する','見分ける','当てる','選ぶ','比べる'], verbGroup:'選択系',
  ip:{ip_combine:.9, ip_nonsense:.8, ip_phrase:.7, ch_kids:.6, in_visual:.5, sp_parody:.5},
  emo:['emo_laugh','emo_surprise','emo_retry'], aud:['aud_kids','aud_teen','aud_family','aud_global','aud_class'],
  imageComp:'中央に大きな問題パネル。中に2つのアイテムが並ぶ。下に左右2つの大きなボタン（成立／不成立）。上部に残り時間と正解数。',
  imageMood:'クイズ番組のセット。スポットライトが当たったような集中した明るさ。',
  codeNotes:'問題データは配列で20問用意（成立10・不成立10）。回答後0.5秒は入力ロック。正解時に解説を1行出す。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['JUDGE','必須'],['COMBO','任意'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_pen','a_apple','a_pine','a_leopard','a_panel','a_fx_ok','a_fx_miss'],
  se:['se_ok','se_ng','se_decide','se_combo','se_start','se_end'],
  bgm:'BGMなしでも成立（正誤音のテンポで遊べる）', warn:[]
},
{
  id:'P14', name:'ピコ太郎 横スクロール', family:'アクション', engine:'E14', dim:'2D', level:2,
  input:'左右＋ジャンプ', duration:90, difficulty:2,
  oneline:'走って、跳んで、PenとAppleを集めながらゴールを目指す。',
  action:'左右に移動し、ジャンプで足場を渡り、落ちずにゴールの旗までたどり着く。',
  successTpl:'{{duration}}秒以内にゴールする（コイン{{target}}枚で高得点）',
  failTpl:'穴に落ちる、または敵に{{life}}回触れる',
  loop:'走る → 跳ぶ → 集める → 落ちそうになる → ゴール',
  retry:'あと少しでゴール／取り逃したコイン／タイム更新',
  ipHook:'集めるものがPen・Apple・Pineappleで、3つ揃うと「PPAP完成」で1UP。道中の配置が組み合わせになっている。',
  nums:{target:12, life:3, fall:0, interval:0, speedup:0},
  verbs:['走る','跳ぶ','集める','避ける','進む'], verbGroup:'反射系',
  ip:{ip_combine:.7, vis_leopard:.7, vis_yellow:.6, ch_exaggerate:.5, sp_short:.4, in_visual:.4},
  emo:['emo_comfort','emo_hype','emo_retry'], aud:['aud_kids','aud_teen','aud_pico','aud_class'],
  imageComp:'横スクロールの1画面。左にピコ太郎、右にゴールの旗。足場が3段、間にPen・Apple・Pineappleが浮いている。穴が2か所。',
  imageMood:'昼の明るいステージ。空は水色、地面はヒョウ柄。遠景はパララックスで流れる。',
  codeNotes:'横スクロールはカメラがプレイヤーを追う。足場はBoxCollider2D、プレイヤーはRigidbody2D＋重力。接地判定はRaycast。穴に落ちたらリスポーン。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['TARGET','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_block','a_coin','a_goal','a_enemy','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_get','se_hit','se_ok','se_start','se_end','se_combo'],
  bgm:'BGMがあると強い（軽快なループ1本）', warn:[]
},
{
  id:'P15', name:'増殖ピコ太郎', family:'サバイバル', engine:'E15', dim:'2D', level:3,
  input:'自動＋左右', duration:90, difficulty:3,
  oneline:'押し寄せる敵を自動攻撃で薙ぎ払い、90秒生き延びる。',
  action:'左右に移動して敵を避けながら、自動で出る攻撃で敵を倒し続ける。',
  successTpl:'{{duration}}秒 生き残る',
  failTpl:'敵に触れてライフが{{life}}になる',
  loop:'敵が来る → 避ける → 自動で倒れる → レベルアップで強くなる',
  retry:'あと10秒／新しい強化を試したい／敵の量が気持ちいい',
  ipHook:'倒した敵がPen・Apple・Pineappleに分裂し、3種揃うと一気に薙ぎ払う「PPAPボム」が撃てる。',
  nums:{target:0, life:5, fall:0, interval:0.7, speedup:0.03},
  verbs:['避ける','倒す','集める','逃げる','強化する'], verbGroup:'反射系',
  ip:{ip_combine:.8, co_anything:.8, ip_repeat:.7, vis_loud:.6, ch_exaggerate:.5, sp_short:.3},
  emo:['emo_hype','emo_comfort','emo_retry'], aud:['aud_teen','aud_20s','aud_pico','aud_class'],
  imageComp:'画面中央にピコ太郎。周囲を数十体の敵が囲む。画面内に弾が飛び交い、経験値の粒が散らばる。上部にHPバーと経過時間。',
  imageMood:'夜の群衆。敵が多いのに画面が読めるよう、敵は暗く、自機と弾は明るく。',
  codeNotes:'敵はプレイヤーに向かって直進。攻撃は一定間隔で最も近い敵へ。経験値でレベルアップし、3択の強化。敵数は上限200体。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['COMBO','任意'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_enemy','a_bullet','a_pen','a_apple','a_pine','a_leopard','a_fx_ok'],
  se:['se_hit','se_get','se_score','se_combo','se_start','se_end'],
  bgm:'BGM必須級（テンポが体感を決める）', warn:['level3']
},
{
  id:'P16', name:'縦シュー PPAP', family:'シューティング', engine:'E16', dim:'2D', level:2,
  input:'4方向＋自動射撃', duration:75, difficulty:2,
  oneline:'上から降るPenとAppleを撃ち落とし、制限時間を生き延びる。',
  action:'上下左右に移動し、自動で出る弾で上から来る敵を撃つ。',
  successTpl:'{{duration}}秒 生き残る（撃墜{{target}}体で高得点）',
  failTpl:'敵の弾か敵本体に{{life}}回当たる',
  loop:'避ける → 撃つ → 敵が増える → かすりで得点',
  retry:'パターンを覚えた／あと1機／かすりの気持ちよさ',
  ipHook:'敵が「Pen＋Apple」の形で現れ、撃つと2つに割れて片方だけ残る。残った方を取るとボーナス。',
  nums:{target:30, life:3, fall:2.4, interval:0.8, speedup:0.02},
  verbs:['撃つ','避ける','倒す','当てる'], verbGroup:'反射系',
  ip:{vis_leopard:.6, ip_combine:.6, ip_repeat:.5, vis_silhouette:.6, ch_deadpan:.4, sp_short:.3},
  emo:['emo_comfort','emo_hype','emo_retry'], aud:['aud_teen','aud_20s','aud_pico','aud_class'],
  imageComp:'縦画面。下にピコ太郎の自機、上から敵と弾。画面全体に弾の軌跡。上部にスコア。',
  imageMood:'暗い宇宙に黄色い弾。敵は黒いシルエットで、弾だけが光る。',
  codeNotes:'自機は4方向移動＋自動射撃（0.12秒間隔）。敵はパターン移動。当たり判定は自機を小さめに（見た目の6割）。',
  ui:[['SCORE','必須'],['LIFE','必須'],['TIMER','必須'],['COMBO','任意'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_enemy','a_bullet','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_hit','se_score','se_ng','se_start','se_end','se_combo'],
  bgm:'BGMがあると強い（速めのループ）', warn:[]
},
{
  id:'P17', name:'横シュー Pen Striker', family:'シューティング', engine:'E17', dim:'2D', level:2,
  input:'上下＋自動射撃', duration:75, difficulty:2,
  oneline:'横から迫る障害物を撃ち抜き、地面スレスレを飛ぶ。',
  action:'上下に移動して地形を避け、自動で出る弾で敵を撃つ。',
  successTpl:'{{duration}}秒 飛び続ける（撃墜{{target}}体で高得点）',
  failTpl:'地形か敵に{{life}}回ぶつかる',
  loop:'地形を見る → 上下で避ける → 撃つ → 先の地形を覚える',
  retry:'地形を覚えた／あと1回／速度が上がる',
  ipHook:'地形がヒョウ柄のビル群で、隙間がPPAPの3つの形になっている。抜ける順番で得点が変わる。',
  nums:{target:25, life:3, fall:0, interval:1.6, speedup:0.02},
  verbs:['撃つ','避ける','進む','すり抜ける'], verbGroup:'反射系',
  ip:{vis_leopard:.8, vis_yellow:.6, ip_repeat:.5, vis_silhouette:.5, ch_exaggerate:.4, sp_short:.3},
  emo:['emo_hype','emo_comfort','emo_retry'], aud:['aud_teen','aud_20s','aud_pico','aud_class'],
  imageComp:'横長画面。左に自機、右から地形と敵。地形はヒョウ柄のビルのシルエット。弾の軌跡が横に流れる。',
  imageMood:'夕方の都市。シルエットの街並みに黄色い弾が走る。',
  codeNotes:'地形は一定間隔で生成し、左へ流す。上下移動のみ。当たり判定は自機の中心から小さな円。',
  ui:[['SCORE','必須'],['LIFE','必須'],['TIMER','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_enemy','a_bullet','a_wall','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_hit','se_score','se_ng','se_start','se_end'],
  bgm:'BGMがあると強い', warn:[]
},
{
  id:'P18', name:'4ボタンリズム', family:'リズム', engine:'E18', dim:'2D', level:1,
  input:'4キー', duration:60, difficulty:1,
  oneline:'4つのキーを、流れてくる矢印のとおりに叩く。',
  action:'画面を流れる矢印が判定ラインに重なった瞬間、対応するキーを押す。',
  successTpl:'{{duration}}秒で{{target}}回 判定を取る',
  failTpl:'{{life}}回 MISS する',
  loop:'見る → 叩く → 判定が出る → 音が重なる',
  retry:'FULL COMBO が近い／曲が覚えられる／判定が厳しくなる',
  ipHook:'矢印の並びが「ペン・アップル・パイン」の順で、3つ揃うと掛け声が入る。',
  nums:{target:60, life:8, fall:0, interval:0.45, speedup:0},
  verbs:['押す','リズムを刻む','合わせる','タップする'], verbGroup:'リズム・身体系',
  ip:{ip_rhythm:1.0, ip_repeat:.9, in_sound:.9, in_repeat:.8, vis_yellow:.4, ch_deadpan:.3},
  emo:['emo_rhythm','emo_comfort','emo_hype'], aud:['aud_kids','aud_teen','aud_global','aud_sns','aud_class'],
  imageComp:'4本の縦レーン。上から矢印（上下左右）が流れる。下に判定ラインとキー表示（D F J K）。背景にヒョウ柄。',
  imageMood:'音ゲーの画面。暗い背景に白い矢印と黄色いライン。',
  codeNotes:'ノーツは4レーン。判定は距離でPERFECT/GOOD/MISS。曲はWeb Audioで簡易的に（または無音でも成立）。BPMからノーツ間隔を計算。',
  ui:[['SCORE','必須'],['JUDGE','必須'],['COMBO','必須'],['LIFE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_arrow','a_leopard','a_fx_ok','a_fx_miss','a_pico_dot'],
  se:['se_tap','se_ok','se_ng','se_combo','se_start','se_end'],
  bgm:'BGM必須級（曲とノーツが一致している必要がある）', warn:[]
},
{
  id:'P19', name:'迷路でPPAP', family:'迷路', engine:'E19', dim:'2D', level:2,
  input:'4方向移動', duration:90, difficulty:2,
  oneline:'迷路を歩いて、3つのアイテムを集めて出口を目指す。',
  action:'上下左右に移動して迷路を進み、Pen・Apple・Pineappleを3つ集めて出口に入る。',
  successTpl:'{{duration}}秒以内に3つ集めて出口へ',
  failTpl:'時間切れ、または敵に{{life}}回捕まる',
  loop:'歩く → 行き止まり → 戻る → 集める → 出口を探す',
  retry:'地図を覚えた／あと1個／別ルートを試したい',
  ipHook:'3つ集めると道が開く仕掛け。集める順番で近道が変わる。',
  nums:{target:3, life:3, fall:0, interval:0, speedup:0},
  verbs:['歩く','探す','集める','迷う','見つける'], verbGroup:'収集系',
  ip:{ip_combine:.8, vis_leopard:.6, ip_repeat:.4, ch_deadpan:.4, in_visual:.4, sp_short:.3},
  emo:['emo_unexpected','emo_comfort','emo_retry'], aud:['aud_kids','aud_family','aud_class','aud_global'],
  imageComp:'見下ろしの迷路。壁は灰色、床はヒョウ柄。3つのアイテムが光る。出口に扉。上部に残り時間と取得数。',
  imageMood:'見下ろしのダンジョン。暗めの床にアイテムの光だけが目立つ。',
  codeNotes:'迷路は2次元配列（1=壁、0=通路）で作り、タイル1マス単位で移動。カメラはプレイヤー追従。アイテム3つ取得で出口の扉が開く。',
  ui:[['TIMER','必須'],['TARGET','必須'],['LIFE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_wall','a_coin','a_door','a_pen','a_apple','a_pine','a_leopard'],
  se:['se_get','se_decide','se_ok','se_start','se_end'],
  bgm:'BGMなしでも成立', warn:[]
},
{
  id:'P20', name:'3Dラン ヒョウ柄ロード', family:'3Dラン', engine:'E20', dim:'3D', level:3,
  input:'左右＋ジャンプ', duration:60, difficulty:3,
  oneline:'3Dの道を走り、障害物を避けてコインを集める。',
  action:'左右に移動してレーンを変え、ジャンプで障害物を越えながら走り続ける。',
  successTpl:'{{duration}}秒 走り切る（コイン{{target}}枚で高得点）',
  failTpl:'障害物に{{life}}回ぶつかる',
  loop:'走る → レーンを変える → 跳ぶ → コインを取る → 速くなる',
  retry:'あと1回／コインの取りこぼし／速度が上がる',
  ipHook:'コインがPen・Apple・Pineappleで、3つ連続で取ると「PPAP!」と表示されて加速する。',
  nums:{target:20, life:3, fall:0, interval:1.1, speedup:0.02},
  verbs:['走る','避ける','跳ぶ','集める'], verbGroup:'反射系',
  ip:{vis_leopard:.9, vis_yellow:.7, ip_combine:.6, ch_exaggerate:.4, sp_short:.3, in_visual:.3},
  emo:['emo_comfort','emo_hype','emo_retry'], aud:['aud_teen','aud_20s','aud_pico','aud_sns'],
  imageComp:'3Dの一人称寄り三人称。手前に自機の後ろ姿、奥へ続く道。道はヒョウ柄。左右にビル。空にコインが浮かぶ。',
  imageMood:'夕暮れの3Dラン。道だけが明るく、背景は暗いシルエット。',
  codeNotes:'3レーン固定（x = -3, 0, 3）。道とオブジェクトを手前へ流す。プレイヤーは左右移動とジャンプのみ。カメラは後方固定。',
  ui:[['SCORE','必須'],['LIFE','必須'],['TIMER','必須'],['TARGET','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pico','a_cube3d','a_coin','a_leopard','a_fx_ok','a_fx_miss'],
  se:['se_get','se_hit','se_score','se_start','se_end'],
  bgm:'BGMがあると強い', warn:['level3']
},
{
  id:'P21', name:'連打でPPAP', family:'クリック', engine:'E21', dim:'2D', level:1,
  input:'クリック／タップ', duration:45, difficulty:1,
  oneline:'出てきたアイテムを、制限時間内に決まった回数クリックして砕く。',
  action:'画面に出たアイテムを素早く連打して、決められた回数だけ叩く。',
  successTpl:'{{duration}}秒で{{target}}個 割る',
  failTpl:'{{life}}回、時間切れで逃がす',
  loop:'出る → 連打 → 割れる → 次が出る → 早くなる',
  retry:'指が覚えた／あと1個／連打の気持ちよさ',
  ipHook:'割ったアイテムが「Pen+Apple」に変わり、3種類割ると画面がヒョウ柄で埋まる。',
  nums:{target:15, life:5, fall:0, interval:1.2, speedup:0.03},
  verbs:['押す','叩く','壊す','タップする'], verbGroup:'リズム・身体系',
  ip:{ip_repeat:.9, vis_loud:.8, ch_exaggerate:.7, sp_reaction:.6, vis_leopard:.5, ip_short:.4},
  emo:['emo_comfort','emo_laugh','emo_hype'], aud:['aud_kids','aud_casual','aud_sns','aud_global'],
  imageComp:'画面中央に大きなアイテム。クリックするたびにひびが入る。周囲に飛び散る破片。上部に残り時間と割った数。',
  imageMood:'ポップで暴力的でない破壊。破片は紙吹雪のように派手。',
  codeNotes:'アイテムは一定間隔で出現。クリック回数が規定に達したら破片を出して消す。時間切れでライフ減。',
  ui:[['SCORE','必須'],['TIMER','必須'],['LIFE','必須'],['COMBO','任意'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_pen','a_apple','a_pine','a_leopard','a_fx_ok','a_fx_pop'],
  se:['se_tap','se_hit','se_score','se_combo','se_start','se_end'],
  bgm:'BGMなしでも成立（連打音がリズムになる）', warn:[]
},
{
  id:'P22', name:'ダンジョンPPAP', family:'1人称探索', engine:'E22', dim:'3D', level:3,
  input:'前後＋左右旋回', duration:120, difficulty:3,
  oneline:'1人称でダンジョンを歩き、3つのアイテムを取って出口の扉を開ける。',
  action:'前後に進み、左右に曲がりながら通路を探索して、3つのアイテムを集める。',
  successTpl:'{{duration}}秒以内に3つ集めて扉を開ける',
  failTpl:'時間切れ',
  loop:'歩く → 曲がる → 行き止まり → 戻る → アイテム → 扉',
  retry:'地図を覚えた／あと1個／別の順路',
  ipHook:'3つ揃うと扉が開き、開いた瞬間に「PPAP!」の掛け声とともに照明が黄色くなる。',
  nums:{target:3, life:1, fall:0, interval:0, speedup:0},
  verbs:['歩く','探す','曲がる','集める','見つける'], verbGroup:'収集系',
  ip:{ip_combine:.7, vis_leopard:.7, ch_deadpan:.5, in_visual:.4, ip_phrase:.4, sp_short:.2},
  emo:['emo_unexpected','emo_retry','emo_surprise'], aud:['aud_teen','aud_20s','aud_pico','aud_class'],
  imageComp:'1人称の廊下。石の壁、奥に扉。床にアイテムが落ちている。右下に手元（Penを持つ手）。視界の端にHP。',
  imageMood:'薄暗い石のダンジョンに、黄色い光だけが差す。',
  codeNotes:'グリッド移動ではなく、Transformの前進＋旋回。壁はBoxCollider。アイテムはTrigger。扉は3つ揃うまで開かない。',
  ui:[['TIMER','必須'],['TARGET','必須'],['GUIDE','必須'],['RESULT','必須'],['RETRY','必須']],
  assets:['a_wall','a_door','a_pen','a_apple','a_pine','a_leopard'],
  se:['se_get','se_decide','se_ok','se_start','se_end'],
  bgm:'BGMがあると没入する（低いドローンで可）', warn:['level3']
}
]);


/* ---------- 副動詞（2つ目・3つ目）が足す仕掛け ---------- */
PK.SUBVERB = {
  '集める':{a:'拾う小アイテムを3種配置し、規定数でボーナス',p:'ComboManager',u:'TARGET'},
  '拾う':  {a:'拾う小アイテムを3種配置し、規定数でボーナス',p:'ComboManager',u:'TARGET'},
  '避ける':{a:'避けるべき障害物を1種追加。当たると減点',p:'CollisionJudge',u:'LIFE'},
  '逃げる':{a:'追ってくる敵を1体追加',p:'',u:'LIFE'},
  '積む':  {a:'積み上げの段数で得点が伸びる',p:'StackObject',u:'SCORE'},
  '組み合わせる':{a:'2つ揃うとボーナス',p:'CombinationJudge',u:'COMBO'},
  '合わせる':{a:'タイミング判定の窓を追加（早い／遅いで得点差）',p:'RhythmJudge',u:'JUDGE'},
  '見分ける':{a:'似た見た目の偽物を混ぜる',p:'MatchJudge',u:'TARGET'},
  '選ぶ':  {a:'3択から1つ選ぶ場面を追加',p:'MatchJudge',u:'NEXT'},
  '壊す':  {a:'壊せるオブジェクトを配置',p:'',u:'SCORE'},
  '探す':  {a:'隠れた対象を1つ配置',p:'',u:'TARGET'},
  '予想する':{a:'次の展開を2択で予告',p:'MatchJudge',u:'NEXT'},
  '真似する':{a:'見本の動きを再現する場面を追加',p:'OrderJudge',u:'JUDGE'},
  '判断する':{a:'正誤の二択を挟む',p:'MatchJudge',u:'JUDGE'},
  '押す':  {a:'連打の受付を追加（押すほど強い）',p:'',u:'COMBO'},
  '撃つ':  {a:'撃てる攻撃を1種追加',p:'',u:'SCORE'},
  '走る':  {a:'走り続ける区間を追加',p:'AutoRun',u:''},
  '跳ぶ':  {a:'ジャンプで越える障害物を追加',p:'JumpAction',u:''},
  '歩く':  {a:'歩いて探索する区間を追加',p:'',u:''}
};


/* ---------- 2D / 3D の挑戦宣言 ---------- */
PK.DIMENSIONS = [
  {id:'2d',   label:'2Dで作る',        note:'Canvas・Sprite・当たり判定が平面。授業で習った範囲がほぼそのまま使える'},
  {id:'3d',   label:'3Dで作る',        note:'CubeとCameraで奥行きを扱う。当たり判定は3D。カメラの向きで難易度が変わる'},
  {id:'both', label:'どちらでも',      note:'企画に合う方を選ぶ（3Dは少し重くなる）'}
];

/* ---------- やれること（自己申告） ---------- */
PK.SKILLS = [
  {id:'sk_move',   label:'左右に動かす',        prefab:'PlayerMove',     note:'矢印キーで移動'},
  {id:'sk_jump',   label:'ジャンプさせる',      prefab:'JumpAction',     note:'重力と接地'},
  {id:'sk_hit',    label:'当たり判定を取る',    prefab:'CollisionJudge', note:'ColliderとTag'},
  {id:'sk_score',  label:'スコアを出す',        prefab:'ScoreManager',   note:'加算と表示'},
  {id:'sk_timer',  label:'タイマーを動かす',    prefab:'Timer',          note:'残り時間'},
  {id:'sk_scene',  label:'画面を切り替える',    prefab:'SceneLoader',    note:'タイトル→ゲーム→結果'},
  {id:'sk_ui',     label:'UIを更新する',        prefab:'UIManager',      note:'TextとImage'},
  {id:'sk_prefab', label:'Prefabを作る',        prefab:'',               note:'複製して使い回す'},
  {id:'sk_spawn',  label:'物を出現させる',      prefab:'SpawnManager',   note:'一定間隔で生成'},
  {id:'sk_phys',   label:'物理で転がす・積む',  prefab:'StackObject',    note:'Rigidbody'},
  {id:'sk_anim',   label:'アニメーションさせる',prefab:'',               note:'Animationかコードで動かす'},
  {id:'sk_sound',  label:'音を鳴らす',          prefab:'SoundManager',   note:'AudioSource'},
  {id:'sk_cam',    label:'カメラを追わせる',    prefab:'CameraFollow',   note:'追従と揺れ'},
  {id:'sk_drag',   label:'ドラッグで動かす',    prefab:'DragObject',     note:'マウス追従'},
  {id:'sk_data',   label:'配列でデータを持つ',  prefab:'',               note:'問題文・敵の種類など'},
  {id:'sk_rand',   label:'ランダムに出す',      prefab:'RandomSpawner',  note:'偏りのない抽選'}
];

/* ---------- 今回挑戦したいこと ---------- */
PK.CHALLENGES = [
  {id:'ch_input',   label:'新しい入力（ドラッグ／連打）', add:'入力の受付を1つ増やし、操作の幅を広げる', step:'入力の追加'},
  {id:'ch_juice',   label:'演出を入れる',                 add:'ヒットストップ・画面揺れ・粒子のいずれかを必ず入れる', step:'演出の実装'},
  {id:'ch_3d',      label:'3Dに挑戦する',                 add:'3D空間での配置とカメラを扱う', step:'3Dの基礎'},
  {id:'ch_cam',     label:'カメラワーク',                 add:'追従・寄り・揺れのいずれかを実装する', step:'カメラ'},
  {id:'ch_phys',    label:'物理挙動',                     add:'Rigidbodyで転がる・積もる・跳ねるを扱う', step:'物理の調整'},
  {id:'ch_sound',   label:'音（SE/BGM）',                 add:'SE 6種とBGM 1本を実装し、音量を揃える', step:'音の実装'},
  {id:'ch_ui',      label:'UIの見た目',                   add:'HUDの配置とアニメーションを整える', step:'UIの調整'},
  {id:'ch_level',   label:'ステージ／レベル設計',         add:'難易度の曲線を数値で設計する', step:'難易度設計'},
  {id:'ch_data',    label:'データ管理（配列・CSV）',      add:'問題や敵の種類をデータで持つ', step:'データ構造'},
  {id:'ch_opt',     label:'軽量化・最適化',               add:'生成と破棄を抑え、60fpsを保つ', step:'最適化'}
];

/* ---------- ピコ太郎の活動事実（提案の根拠） ---------- */
PK.DNA_FACTS = [
  {id:'f_ppap', y:'2016', title:'PPAPが世界に拡散',
   fact:'2016年にYouTubeへ公開した「PPAP（ペンパイナッポーアッポーペン）」が、Justin BieberやCNN、BBCなど海外メディアに取り上げられ、世界中でブレイクした。',
   src:'https://avex.jp/pikotaro/profile/', tags:['ip_combine','ip_nonsense','ip_short','sp_global','in_visual','ip_repeat','sp_short','in_repeat'],
   insight:'説明が要らない。4つの単語と1つの動作だけで、言語を越えて伝わる。'},
  {id:'f_guinness', y:'2016', title:'ビルボードHot100 最短期間でギネス認定',
   fact:'日本人として26年ぶりに米ビルボードHot100に入り、「ビルボードHot100にチャートインした最も短い曲」としてギネス世界記録に認定された。',
   src:'https://avex.jp/pikotaro/profile/', tags:['ip_short','sp_short','ip_repeat','in_sound'],
   insight:'短さは弱点ではなく、記録になる強み。1分以内で完結する体験に価値がある。'},
  {id:'f_state', y:'2017', title:'トランプ大統領来日時の晩餐会に出席',
   fact:'2017年、トランプ大統領来日時の晩餐会に出席した。',
   src:'https://avex.jp/pikotaro/profile/', tags:['co_talent','co_brand','sp_show','ch_confident'],
   insight:'首相官邸の晩餐会という「固い場」に呼ばれる希少さ。真面目な場に置かれることで笑いが生まれる。'},
  {id:'f_sdgs', y:'2017', title:'外務省 SDGs推進大使',
   fact:'2017年より、外務省からSDGs推進に係わる関連業務を行う「SDGs推進大使」に任命され、活動を続けている。',
   src:'https://avex.com/jp/ja/news/2021/unep/', tags:['so_sdgs','so_edu','so_explain','ch_wordless','in_culture'],
   insight:'難しい政策を、身振りと音楽で子どもにも届く形に変換できる数少ない人材。'},
  {id:'f_ccc', y:'2019', title:'文科省 CCC大使（古坂大魔王）',
   fact:'古坂大魔王が2019年より、文部科学省のクロスカルチュラルコミュニケーション大使（CCC大使）に任命された。',
   src:'https://www.mext.go.jp/a_menu/ikusei/gakusyushien/mext_00131.html', tags:['so_edu','in_culture','sp_global','co_involve'],
   insight:'教育の現場とIPが直結している。学校で使える形にできるのは強み。'},
  {id:'f_wash', y:'2020', title:'PPAP-2020- 手洗い推進',
   fact:'2020年、手洗いを促す「PPAP-2020-」を公開。文部科学省が手洗い推進ポスターとして紹介し、家庭・学校での利用が呼びかけられた。',
   src:'https://www.mext.go.jp/a_menu/ikusei/gakusyushien/mext_00131.html', tags:['so_handwash','so_edu','ip_repeat','ch_kids','sp_mimic','in_repeat'],
   insight:'歌と動作を覚えると、行動が変わる。啓発は「覚えられる形」にした瞬間に効く。'},
  {id:'f_unep', y:'2021', title:'UNEPサステナビリティアクション アドバイザー',
   fact:'2021年、古坂大魔王が国連環境計画 国際環境技術センター（UNEP-IETC）主導のUNEPサステナビリティアクションのアドバイザーに就任した。',
   src:'https://avex.com/jp/ja/news/2021/unep/', tags:['so_eco','so_sdgs','so_admin','in_culture'],
   insight:'環境という長い時間軸のテーマを、毎日の行動に落とす役割を担っている。'},
  {id:'f_10th', y:'2026', title:'PPAP 10周年 / Tottemo Release 80.8',
   fact:'2026年に迎えるPPAP10周年に向け、毎月連続リリース企画「Tottemo Release 80.8」を展開している。',
   src:'https://avex.jp/pikotaro/profile/', tags:['ip_repeat','sp_short','sp_show','co_anything','ip_phrase'],
   insight:'10年経っても月次で出し続けられる。反復と更新の両立がIPの寿命を作っている。'},
  {id:'f_team', y:'2018', title:'チーム古坂という制作体制',
   fact:'古坂大魔王を中心に、エイベックス・マネジメントのゼネラルマネージャー白取輝知、チーフマネージャー新井正則らによるチームでPPAP現象を生み出したと語られている。',
   src:'https://avex.com/jp/ja/contents/team-kosaka-ppap/', tags:['co_brand','co_talent','ch_confident','sp_show'],
   insight:'個人技ではなく、企画・制作・マネジメントの分業で作られている。提案もその分業に乗る形が望ましい。'},
  {id:'f_sns', y:'2016', title:'真似したくなる構造',
   fact:'PPAPは振り付けが単純で、各国の子どもや著名人が真似をして投稿する形で広がった。',
   src:'https://avex.jp/pikotaro/profile/', tags:['sp_mimic','ip_mimic','ch_body','in_gesture','so_handwash','ip_repeat'],
   insight:'見る人が「次は自分がやる」に変わる。参加の入口が動作にある。'}
];


/* ---------- DNAシート：第3回グループワークの決定事項 ---------- */
/* ターゲットの「○○したい人」 */
PK.WANT_TO = [
  {id:'w_laugh',   label:'友だちと笑いたい',       note:'失敗も笑いに変わる'},
  {id:'w_comfort', label:'短時間で気持ちよくなりたい', note:'1分で完結'},
  {id:'w_retry',   label:'何度も挑戦したい',       note:'あと少しで届く'},
  {id:'w_show',    label:'人に見せて自慢したい',   note:'結果が語れる'},
  {id:'w_casual',  label:'頭を使わず遊びたい',     note:'考えずに触れる'},
  {id:'w_connect', label:'世界とつながりたい',     note:'言葉を越える'},
  {id:'w_learn',   label:'遊びながら学びたい',     note:'気づきがある'},
  {id:'w_focus',   label:'静かに集中したい',       note:'手応えがある'},
  {id:'w_move',    label:'体を動かしたい',         note:'真似したくなる'},
  {id:'w_surprise',label:'予想外に驚きたい',       note:'裏切られる'}
];

/* 認知ゴールの「ピコ太郎は○○なIP」 */
PK.PERCEPTION = [
  {id:'p_combine', label:'異なるものを組み合わせて新しい価値を生むIP', tags:['ip_combine','ip_unexpected','co_anything']},
  {id:'p_wordless',label:'言葉が通じなくても伝わるIP',               tags:['ch_wordless','in_visual','in_gesture','in_sound']},
  {id:'p_mimic',   label:'思わず真似したくなるIP',                   tags:['sp_mimic','ip_mimic','ch_body','in_gesture']},
  {id:'p_social',  label:'社会の課題を楽しく伝えるIP',               tags:['so_handwash','so_traffic','so_eco','so_sdgs','so_edu']},
  {id:'p_short',   label:'短くて強いIP',                             tags:['ip_short','sp_short','sp_oneneta']},
  {id:'p_connect', label:'人と人、文化と文化をつなぐIP',             tags:['in_culture','co_involve','co_char','sp_global']},
  {id:'p_update',  label:'時代に合わせて更新され続けるIP',           tags:['ip_repeat','co_anything','sp_short']},
  {id:'p_serious', label:'真面目にふざけられるIP',                   tags:['ch_deadpan','ch_confident','ch_surreal','ch_silly']},
  {id:'p_kids',    label:'子どもにも大人にも届くIP',                 tags:['ch_kids','ch_friendly','so_edu','in_visual']},
  {id:'p_loud',    label:'画面いっぱいに主張する派手なIP',           tags:['vis_loud','vis_leopard','vis_yellow','vis_gold']}
];


/* =========================================================
   ツイスト（刺激の1手）
   「ただ避ける」で終わらせないために、必ず1つだけ足す。
   type: obstacle(お邪魔) / limit(しばり) / dual(○○しながら) / reverse(逆転) / tease(焦らし)
   ========================================================= */
PK.TWISTS = [
  /* ---- お邪魔 ---- */
  {id:'tw_decoy', type:'obstacle', name:'偽物を混ぜる', one:'本物とそっくりな偽物が混ざる',
   what:'見た目がほぼ同じで、色だけ少し違う／動きだけ違う偽物を1種追加する。',
   how:'同じPrefabの色違いを作り、正解判定のフラグだけfalseにする。出現比率は本物1：偽物1。',
   effect:'「見る」という行為が生まれる。判断の速さがスコアになる。',
   tune:'偽物の見分けにくさ（色差）で難易度を調整。最初は誰でも分かる差に。',
   fit:['E03','E08','E09','E11','E13','E19'], verbs:['見分ける','選ぶ','判断する','探す']},
  {id:'tw_chaser', type:'obstacle', name:'追ってくる物', one:'後ろから追ってくる存在がいる',
   what:'一定速度でプレイヤーを追う存在を1体追加。触れるとミス。',
   effect:'立ち止まれなくなる。移動に「逃げる」という意味が生まれる。',
   how:'毎フレーム「自分の位置 - 相手の位置」の方向へ一定速度で進む。距離が近いと警告音。',
   tune:'追う速さはプレイヤーの0.7倍から。同速にすると詰む。',
   fit:['E01','E14','E19','E20'], verbs:['避ける','逃げる','追う','走る']},
  {id:'tw_blocker', type:'obstacle', name:'動く障害物', one:'地形そのものが動いて道を塞ぐ',
   what:'左右または上下に往復する壁を1〜2個追加。',
   effect:'覚えたパターンが使えなくなる。リズムで避けるようになる。',
   how:'PingPongで往復。当たり判定は見た目より少し小さく。',
   tune:'往復の幅は画面の1/4まで。広いと避けられない。',
   fit:['E01','E16','E17','E20'], verbs:['避ける','すり抜ける']},
  {id:'tw_steal', type:'obstacle', name:'取られる', one:'集めた物を奪われる',
   what:'一定時間ごとに、持っている得点やアイテムを1つ奪う存在を追加。',
   effect:'取るだけでは終わらない。守るという判断が生まれる。',
   how:'接触時にスコア-1と「取られた」表示。奪った側は逃げる。',
   tune:'奪う頻度は15秒に1回まで。頻繁だと理不尽。',
   fit:['E03','E08','E14','E19'], verbs:['集める','守る','逃げる']},

  /* ---- しばり ---- */
  {id:'tw_spot', type:'limit', name:'見える範囲を絞る', one:'スポットライトの外が見えない',
   what:'プレイヤーの周囲だけ明るく、外は暗くする（マスク）。',
   effect:'先読みができなくなり、音と記憶で遊ぶようになる。',
   how:'Canvasに黒いパネル＋円形のマスク。マスクの位置はプレイヤーに追従。',
   tune:'半径は画面の25%から。狭すぎると理不尽。',
   fit:['E01','E19','E22','E03'], verbs:['探す','避ける','歩く']},
  {id:'tw_inertia', type:'limit', name:'止まれない', one:'キーを離しても少し滑る',
   what:'移動に慣性を入れ、急には止まれなくする。',
   effect:'操作の上手さがそのまま差になる。慣れると気持ちいい。',
   how:'速度に加速度と摩擦をかけ、入力が無くても徐々に減速。',
   tune:'摩擦は0.9/秒。滑りすぎると制御不能。',
   fit:['E01','E14','E17','E20','E03'], verbs:['避ける','走る','すり抜ける']},
  {id:'tw_oneway', type:'limit', name:'一度しか曲がれない', one:'曲がる回数に制限がある',
   what:'方向転換や入力の回数に上限を設け、使い切ると直進しかできなくなる。',
   effect:'1回の判断の重みが増す。計画性が問われる。',
   how:'残り回数をカウンタで持ち、0になったら入力を無視。UIに残数を出す。',
   tune:'残り3回から。少なすぎると詰む。',
   fit:['E19','E22','E10','E11'], verbs:['曲がる','選ぶ','積む']},
  {id:'tw_shrink', type:'limit', name:'足場が消える', one:'時間で床が抜けていく',
   what:'立っていた足場が一定時間で消える（または崩れる）。',
   effect:'同じ場所に留まれない。常に動く理由が生まれる。',
   how:'足場に接触したら0.8秒後に非表示。復活はしない。',
   tune:'消えるまでの猶予は1秒。短いと反応できない。',
   fit:['E14','E19','E11','E20'], verbs:['跳ぶ','走る','積む','避ける']},
  {id:'tw_flip', type:'limit', name:'操作が反転する', one:'一定時間、左右が逆になる',
   what:'5秒ごとに左右（または上下）の入力が反転する。',
   effect:'慣れを裏切る。ただし短時間に限定する。',
   how:'boolフラグを一定間隔でトグルし、入力の符号を反転。画面に「反転中」を表示。',
   tune:'反転は2秒まで。長いと不快になる。',
   fit:['E01','E20','E06','E18'], verbs:['避ける','押す','合わせる']},

  /* ---- ○○しながら ---- */
  {id:'tw_count', type:'dual', name:'数えながら', one:'別のものを数え続ける',
   what:'画面の端にカウント対象を出し、プレイ中に数えさせる（最後に回答）。',
   effect:'注意が分散する。慣れると無意識にできるようになる。',
   how:'通過した個数を内部で数え、リザルトで「何個だった？」と3択で聞く。正解でボーナス。',
   tune:'数える対象は10個まで。多すぎると数えられない。',
   fit:['E01','E03','E16','E20'], verbs:['数える','避ける','集める']},
  {id:'tw_rhythm', type:'dual', name:'リズムを刻みながら', one:'一定のテンポで余分に叩く',
   what:'プレイ中、4拍ごとに決まったキーを押す。押し続けないとゲージが減る。',
   effect:'手が2ついる状態になる。音楽と操作が一致する。',
   how:'BPMから拍を計算し、拍の前後0.12秒以内の入力を成功とする。',
   tune:'BPM100から。速すぎると他の操作がおろそかになる。',
   fit:['E01','E03','E14','E16','E18'], verbs:['リズムを刻む','避ける','走る']},
  {id:'tw_carry', type:'dual', name:'運びながら', one:'壊れやすい物を持ったまま動く',
   what:'アイテムを1つ持ち、落とさないように動く。強い衝撃で壊れる。',
   effect:'移動の丁寧さが問われる。雑に動けなくなる。',
   how:'持っている間は移動速度-20%。被弾または急停止で落とす。',
   tune:'速度低下は20%まで。強すぎると遅くて退屈。',
   fit:['E01','E03','E14','E19'], verbs:['運ぶ','支える','避ける','集める']},
  {id:'tw_aim', type:'dual', name:'狙いながら', one:'移動しながら別の的を狙う',
   what:'移動とは別に、照準を合わせて撃つ／指す操作を追加する。',
   effect:'2つの操作を同時に扱う。上級者ほど上手くなる。',
   how:'移動はキー、照準はマウスまたは自動。撃つのは1ボタン。',
   tune:'照準の追従速度を上げすぎない。',
   fit:['E14','E16','E17','E20'], verbs:['撃つ','狙う','避ける']},

  /* ---- 逆転 ---- */
  {id:'tw_reverse', type:'reverse', name:'取ると減る', one:'欲しい物と、避ける物が入れ替わる',
   what:'序盤は「取る」、後半は「避ける」にルールが反転する。',
   effect:'同じ画面なのに遊びが変わる。驚きが生まれる。',
   how:'経過時間の半分でフラグを切り替え、UIの色と文言も反転させる。',
   tune:'切り替えは1回だけ。何度も反転すると混乱する。',
   fit:['E03','E08','E11'], verbs:['選ぶ','見分ける','積む']},
  {id:'tw_swap', type:'reverse', name:'役割が入れ替わる', one:'途中から操作するものが変わる',
   what:'一定時間で操作対象が敵側に切り替わる（または2体を交互に操作）。',
   effect:'新しい操作を覚え直す楽しさが出る。',
   how:'操作対象の参照を差し替え、カメラも切り替える。',
   tune:'切り替えは1回。2回以上は説明が必要になる。',
   fit:['E01','E14','E19'], verbs:['変える','変身する','逃げる']},

  /* ---- 焦らし ---- */
  {id:'tw_charge', type:'tease', name:'溜めてから放つ', one:'押し続けて溜め、離すと発動する',
   what:'長押しで力を溜め、離した瞬間に効果が出る。溜めすぎると失敗。',
   effect:'「今だ」という判断が生まれる。手応えが強くなる。',
   how:'押している時間を計測し、0.3〜1.2秒の範囲だけ成功。それ以外は失敗。',
   tune:'最適な溜め時間は0.6秒。範囲は±0.3秒。',
   fit:['E11','E06','E10','E14'], verbs:['積む','合わせる','跳ぶ','放つ']},
  {id:'tw_grow', type:'obstacle', name:'増え続ける', one:'時間とともに数が増える',
   what:'時間経過で出現数が増え、画面が埋まっていく。',
   effect:'序盤の余裕が、終盤の切迫に変わる。',
   how:'出現間隔を毎秒1%ずつ短くする（下限0.25秒）。',
   tune:'下限を決めないと画面が溢れる。0.25秒で止める。',
   fit:['E01','E03','E16','E17'], verbs:['避ける','すり抜ける','集める']},
  {id:'tw_color', type:'tease', name:'色が変わる', one:'安全な場所が時間で入れ替わる',
   what:'床や足場の安全な色が数秒ごとに入れ替わる。',
   effect:'覚えた位置が使えず、見続ける理由が生まれる。',
   how:'床タイルに状態を持たせ、2秒ごとに安全／危険を入れ替える。',
   tune:'入れ替えは2秒。1秒だと反応できない。',
   fit:['E14','E19','E20'], verbs:['見分ける','避ける','跳ぶ']},
  {id:'tw_last', type:'tease', name:'最後に加速する', one:'残り10秒で全部が速くなる',
   what:'終盤だけ落下速度・移動速度・BGMのテンポが上がる。',
   effect:'最後まで気が抜けない。結果の差がつく。',
   how:'残り時間が10秒を切ったら、速度に1.6倍の係数をかける。画面の縁を赤く。',
   tune:'1.6倍まで。2倍にすると理不尽。',
   fit:['E01','E03','E08','E12','E16','E17','E20'], verbs:['避ける','集める','打ち返す','走る']},
  {id:'tw_bait', type:'tease', name:'見せてから出す', one:'出す直前に必ず予告がある',
   what:'出現の0.3秒前に影・音・点滅で予告し、その後必ず出る。',
   effect:'理不尽さが消え、覚える楽しさが出る。',
   how:'出現位置に半透明のマーカーを0.3秒表示してから生成。',
   tune:'予告は0.2〜0.4秒。長いとテンポが死ぬ。',
   fit:['E01','E03','E16','E17','E12'], verbs:['避ける','取る','打ち返す']}
];

/* 副動詞 → ツイストの対応（複合動詞を優先して使う） */
PK.SUBVERB_TWIST = {
  '避ける':'tw_last', '逃げる':'tw_chaser', '集める':'tw_steal', '拾う':'tw_decoy',
  '積む':'tw_charge', '組み合わせる':'tw_reverse', '合わせる':'tw_rhythm', '見分ける':'tw_decoy',
  '選ぶ':'tw_oneway', '壊す':'tw_last', '探す':'tw_spot', '予想する':'tw_reverse',
  '真似する':'tw_rhythm', '判断する':'tw_decoy', '押す':'tw_rhythm', '撃つ':'tw_aim',
  '走る':'tw_inertia', '跳ぶ':'tw_shrink', '歩く':'tw_spot', '運ぶ':'tw_carry',
  '守る':'tw_steal', '数える':'tw_count', '曲がる':'tw_oneway'
};


/* =========================================================
   ピコ太郎らしさの三種の神器（音・掛け声・間）
   プロトの最初から入れる。後付けにしない。
   ========================================================= */
PK.PICO_SOUND = {
  bpm:128,
  groove:'4つ打ち（1・2・3・4にキック）＋裏拍のハイハット＋跳ねるベース',
  instr:'キック／スネア（2・4）／ハイハット（8分）／シンセベース（8分の刻み）／短いブラス（4小節に1回）',
  key:'Am',
  loopBars:8,
  length:'8小節（約15秒）をシームレスにループ',
  volume:'-16dB（SEより必ず小さい）',
  build:`Web Audio APIだけで鳴らす（音源ファイルを読み込まない）。
・AudioContext を1つ作り、masterGain（0.18）→ destination。
・BGMは「8分音符ごとに時刻を予約する」方式（setInterval ではなく、次の拍の時刻を計算して予約する）。
・キック＝サイン波 60Hz→40Hz のピッチ落とし（0.12秒）
・スネア＝ホワイトノイズ 0.08秒＋バンドパス
・ハイハット＝ホワイトノイズ 0.03秒（高域）
・ベース＝矩形波 or ノコギリ波、A2を8分で刻む（Am–F–C–G の4小節を2周）
・ブラス＝矩形波の和音を0.15秒、4小節の頭だけ
・ループの継ぎ目で音が途切れないよう、次の小節の頭を先に予約しておく`,
  stop:'リザルトに入ったら masterGain を0.2秒でフェードアウト'
};

PK.PICO_SE = [
  {id:'se_pen',   label:'Pen',        when:'Penが登場／取得した時',      how:'短い矩形波 1200Hz → 1600Hz の2音（0.06秒）'},
  {id:'se_apple', label:'Apple',      when:'Appleが登場／取得した時',    how:'丸いサイン波 800Hz の1音（0.08秒）＋軽いビブラート'},
  {id:'se_pine',  label:'Pineapple',  when:'Pineappleが登場／取得した時',how:'ノコギリ波 600Hz → 900Hz（0.1秒）'},
  {id:'se_pop',   label:'ポン',       when:'何かが出現した瞬間',         how:'サイン波 300Hz→80Hz（0.05秒）'},
  {id:'se_ok',    label:'成功',       when:'正解・成功',                 how:'C5-E5-G5 の3音を0.05秒ずつ上昇'},
  {id:'se_ng',    label:'失敗',       when:'ミス・失敗',                 how:'G3→D3 の2音＋短いノイズ'},
  {id:'se_combo', label:'コンボ',     when:'3連続ごと',                  how:'コンボ数×半音で音程を上げる（6回で頭打ち）'},
  {id:'se_start', label:'開始',       when:'プレイ開始',                 how:'ドミソの上昇＋キック1発'}
];

/* キャラのセリフ（吹き出し）。歌詞は使わず、単語と掛け声に留める */
PK.PICO_LINES = {
  start:  ['Pen!', 'I have a pen.', 'Let\'s go!', 'Here we go!'],
  appear: ['Pen!', 'Apple!', 'Pineapple!', 'Oh!'],
  get:    ['Apple!', 'Pineapple!', 'Pen!', 'Nice!'],
  ok:     ['Yeah!', 'Pen-pineapple!', 'Good!', 'Ha!'],
  miss:   ['Oh no...', 'Oops!', 'Ah...', 'Hey!'],
  combo:  ['Apple-pen!', 'Pineapple-pen!', 'Yeah! Yeah!'],
  result: ['Thank you!', 'Pen-pineapple-apple-pen!', 'See you!']
};


/* ---------- 「なぜピコ太郎なのか」の候補文（第3回の議論から出てくる8種） ---------- */
PK.WHY_PICO = [
  {id:'why_wordless', short:'言葉が通じなくても伝わる',
   text:'ピコ太郎は、言葉が通じなくても身振りと音だけで伝わる。この「誰でも参加できる」構造をゲームにしたい。',
   tags:['ch_wordless','in_visual','in_gesture','in_sound','sp_global']},
  {id:'why_combine', short:'異なるものを組み合わせる',
   text:'ピコ太郎は、PenとAppleのように無関係なものを組み合わせて成立させる。この「組み合わせる」構造を遊びにしたい。',
   tags:['ip_combine','ip_unexpected','co_anything']},
  {id:'why_mimic', short:'真似したくなる',
   text:'ピコ太郎は、見た人がすぐ真似できる動きと短さを持っている。この「真似したくなる」参加性をゲームにしたい。',
   tags:['sp_mimic','ip_mimic','ch_body','ip_repeat']},
  {id:'why_short', short:'短くて強い',
   text:'ピコ太郎は、1分に満たない短さで世界に届いた。この「短いのに残る」強さを、1プレイの体験として作りたい。',
   tags:['ip_short','sp_short','sp_oneneta','ip_repeat']},
  {id:'why_social', short:'難しいことを楽しく伝える',
   text:'ピコ太郎は、手洗いやSDGsのような難しいテーマを、歌と動きで子どもにも伝えてきた。この「伝える力」をゲームにしたい。',
   tags:['so_handwash','so_sdgs','so_edu','so_explain','ch_kids']},
  {id:'why_connect', short:'人と人、文化をつなぐ',
   text:'ピコ太郎は、国の違いや世代の違いを越えて、同じ動作で笑える。この「つなぐ」力をゲームのルールにしたい。',
   tags:['in_culture','co_involve','co_char','in_repeat']},
  {id:'why_serious', short:'真面目にふざける',
   text:'ピコ太郎は、大真面目にバカバカしいことをする。この「真面目にふざける」姿勢を、ゲームの手触りにしたい。',
   tags:['ch_deadpan','ch_silly','ch_surreal','ch_confident']},
  {id:'why_update', short:'時代に合わせて更新される',
   text:'ピコ太郎は、PPAPの後も手洗い版や海外版として形を変えて続いている。この「更新され続ける」性質をゲームにしたい。',
   tags:['ip_repeat','co_anything','sp_short','vis_loud']},
  {id:'why_loud', short:'画面いっぱいに主張する',
   text:'ピコ太郎は、黄色とヒョウ柄で画面を埋め尽くす。この「遠目でも分かる」強さを、ゲームの画面にしたい。',
   tags:['vis_loud','vis_leopard','vis_yellow','vis_silhouette']}
];
