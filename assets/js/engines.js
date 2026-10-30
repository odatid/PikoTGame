/* =========================================================
   PK//PROTO — エンジン（実装テンプレート）9種 + Prefab辞書
   パターンは engine_id でここを参照する。
   ========================================================= */
window.PK = window.PK || {};

/* ---------- Prefab / 機能辞書 ---------- */
PK.PREFABS = {
  PlayerMove:      {name:'PlayerMove',      fn:'左右移動',              cat:'操作',   level:1, deps:[], done:'キーで動き、画面の端で止まる', check:'Gameビューで端まで移動して、はみ出さないこと', trap:'transform.position を直接書き換えず、x だけを Mathf.Clamp で制限する', min:20},
  InputManager:    {name:'InputManager',    fn:'キーとタップの吸収',    cat:'操作',   level:2, deps:[], done:'PCのキーとスマホのタップが同じ変数に入る', check:'スマホ幅にしても操作できる', trap:'Update内で入力を読むと二重に反応する。1か所にまとめる', min:15},
  AutoRun:         {name:'AutoRun',         fn:'自動前進',              cat:'操作',   level:1, deps:['PlayerMove'], done:'何もしなくても前へ進む', check:'放置して位置が進むこと', trap:'移動を固定値で足すとfpsで速度が変わる。Time.deltaTime を掛ける', min:10},
  FallingObject:   {name:'FallingObject',   fn:'上から落下',            cat:'生成',   level:1, deps:[], done:'上から落ちて画面外で消える', check:'3秒放置で見えなくなる', trap:'Destroyを忘れるとメモリに溜まる', min:15},
  SpawnManager:    {name:'SpawnManager',    fn:'一定時間ごとに生成',    cat:'生成',   level:2, deps:['FallingObject'], done:'等間隔でアイテムが出続ける', check:'10秒で個数が想定どおり', trap:'Instantiateの位置がPrefabの初期値になる。生成時に座標を上書きする', min:20},
  RandomSpawner:   {name:'RandomSpawner',   fn:'ランダムな位置・種類',  cat:'生成',   level:2, deps:['SpawnManager'], done:'位置と種類が毎回変わる', check:'20回出して偏りが少ない', trap:'Random.Range のint版とfloat版を間違える', min:15},
  SpeedUp:         {name:'SpeedUp',         fn:'時間経過で難易度上昇',  cat:'生成',   level:2, deps:['SpawnManager'], done:'後半で明らかに速くなる', check:'開始10秒と50秒で速度が違う', trap:'毎フレーム加算すると一気に速くなる。秒あたりで加算する', min:15},
  CollisionJudge:  {name:'CollisionJudge',  fn:'接触判定',              cat:'判定',   level:1, deps:[], done:'触れた瞬間にConsoleへログが出る', check:'Consoleに1行だけ出る', trap:'IsTriggerとTagの両方が必要。Rigidbody2Dもどちらかに要る', min:20},
  ScoreManager:    {name:'ScoreManager',    fn:'得点管理',              cat:'管理',   level:1, deps:['CollisionJudge'], done:'取ると数字が増える', check:'HUDの数字が1ずつ増える', trap:'UI更新を毎フレームやると重い。値が変わった時だけ更新', min:15},
  LifeManager:     {name:'LifeManager',     fn:'残機管理',              cat:'管理',   level:1, deps:[], done:'ミスで減り、0で終了する', check:'3回ミスで動きが止まる', trap:'0未満にならないようにClampする', min:15},
  Timer:           {name:'Timer',           fn:'制限時間',              cat:'管理',   level:1, deps:[], done:'残り時間が表示され、0で終わる', check:'60秒で必ず終了する', trap:'Time.time を直接使うとリトライで戻らない。残り時間を自前で持つ', min:15},
  ResultManager:   {name:'ResultManager',   fn:'結果表示',              cat:'画面',   level:1, deps:[], done:'成功／失敗と理由が出る', check:'勝ちと負けの両方で文言が変わる', trap:'PanelのSetActiveを戻し忘れて暗いままになる', min:20},
  Retry:           {name:'Retry',           fn:'再プレイ（状態初期化）',cat:'画面',   level:2, deps:['ResultManager'], done:'タイトルからやり直せる', check:'2周してもスコアが残らない', trap:'static変数が残る。リトライで明示的に0へ戻す', min:20},
  SceneLoader:     {name:'SceneLoader',     fn:'画面遷移',              cat:'画面',   level:1, deps:[], done:'タイトル→ゲーム→リザルトが切り替わる', check:'3画面を行き来できる', trap:'SceneManagerのusing忘れ', min:15},
  UIManager:       {name:'UIManager',       fn:'UI更新の一元化',        cat:'画面',   level:2, deps:[], done:'スコア／時間／ライフが1か所から更新される', check:'どの画面でも表示がずれない', trap:'TextMeshProとUI.Textを混ぜない', min:20},
  SoundManager:    {name:'SoundManager',    fn:'SE/BGM再生',            cat:'音',     level:2, deps:[], done:'決定音とミス音が鳴る', check:'Playで音が出る', trap:'AudioListenerが2つあると無音になる', min:15},
  ObjectPool:      {name:'ObjectPool',      fn:'生成破棄の再利用',      cat:'生成',   level:3, deps:['SpawnManager'], done:'アイテムが再利用される', check:'Hierarchyの数が増え続けない', trap:'SetActive(false)で戻す前に初期化する', min:30},
  DragObject:      {name:'DragObject',      fn:'ドラッグ操作',          cat:'操作',   level:3, deps:[], done:'アイテムを掴んで動かせる', check:'離すとその場に残る', trap:'ワールド座標とスクリーン座標を変換する（Camera.main.ScreenToWorldPoint）', min:25},
  DropSlot:        {name:'DropSlot',        fn:'ドロップ先の判定',      cat:'判定',   level:2, deps:['DragObject'], done:'正しい場所に置くと判定が返る', check:'置いた場所のTagが読める', trap:'コライダーのSizeが小さすぎて反応しない', min:20},
  StackObject:     {name:'StackObject',     fn:'積み上げ',              cat:'判定',   level:2, deps:['FallingObject'], done:'落とした物が上に乗る', check:'3段積める', trap:'Rigidbody2DのInterpolateを入れるとガタつきが減る', min:25},
  BalanceJudge:    {name:'BalanceJudge',    fn:'バランス判定',          cat:'判定',   level:3, deps:['StackObject'], done:'大きく傾くと崩れる', check:'わざと端に積むと崩れる', trap:'重心を自前で計算すると重い。合計位置÷個数で十分', min:30},
  RhythmJudge:     {name:'RhythmJudge',     fn:'タイミング判定（窓）',  cat:'判定',   level:3, deps:[], done:'PERFECT/GOOD/MISSが出る', check:'早すぎ・遅すぎで文言が変わる', trap:'判定窓を秒で持つ。フレームで持つとfpsで変わる', min:30},
  CombinationJudge:{name:'CombinationJudge',fn:'組み合わせ判定',        cat:'判定',   level:2, deps:[], done:'2つのIDの組で結果が返る', check:'正解と不正解の両方で反応が違う', trap:'組み合わせ表をif文で書くと破綻する。DictionaryかScriptableObjectにする', min:25},
  MatchJudge:      {name:'MatchJudge',      fn:'正誤判定（2択）',        cat:'判定',   level:1, deps:[], done:'押した側が正解か返る', check:'両方のボタンで試す', trap:'連打で2回判定される。判定中は入力を止める', min:15},
  ComboManager:    {name:'ComboManager',    fn:'連続成功',              cat:'管理',   level:2, deps:['ScoreManager'], done:'連続で成功すると数字が伸びる', check:'わざと外すと0に戻る', trap:'コンボのリセット条件を決めてから書く', min:20},
  OrderJudge:      {name:'OrderJudge',      fn:'順番判定',              cat:'判定',   level:2, deps:[], done:'決まった順番で押すと成功', check:'順番を変えると失敗する', trap:'配列の初期化をAwakeで行う（null参照の定番）', min:20},
  DifficultyCurve: {name:'DifficultyCurve', fn:'難易度の曲線',          cat:'管理',   level:2, deps:[], done:'時間で難しさが変わる', check:'最初と最後で体感が違う', trap:'AnimationCurveを使うと調整が楽', min:15}
};

/* ---------- 共通ステップ ---------- */
PK.GUIDE_FIRST = {
  h:'土台をつくる',
  w:'Unityで2Dプロジェクトを新規作成し、Gameビューを16:9（1920×1080）に固定、SampleSceneを保存する。',
  d:'空のシーンが16:9で表示され、保存されている。',
  c:'Gameビューの解像度表示が「1920×1080」になっていること。',
  t:'3Dで作ってしまうとSpriteが見えません。プロジェクト作成時に「2D」を選んでください。',
  m:10, p:'SceneLoader'
};
PK.GUIDE_LAST = {
  h:'仕上げて、もう一回遊べるようにする',
  w:'Retryで状態を完全に初期化し、SpeedUpと演出（成功・ミス・得点）を入れ、タイトル→プレイ→リザルト→もう一回が回るようにする。',
  d:'2周連続で遊んでも、スコア・時間・ライフが正しくリセットされる。',
  c:'2周目のスコアが0から始まり、前回の値が残っていないこと。',
  t:'static変数やScriptableObjectに値を残すと、2周目がおかしくなります。Retryで明示的に戻してください。',
  m:30, p:'Retry'
};

/* ---------- 9エンジン ---------- */
PK.ENGINES = {
E01:{
  juice:['dmg','recoil','shake','jumpCharge','landSquash','landDust','skid','freeze'],
  name:'落下回避（左右移動）', short:'上から落ちてくる物を左右に避ける',
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [Timer] [LifeManager]
├─ Canvas
│  ├─ HUD
│  │  ├─ TimerText        [TextMeshProUGUI]  "60"
│  │  ├─ LifeIcons        [HorizontalLayoutGroup]  ♥♥♥
│  │  └─ ScoreText        [TextMeshProUGUI]
│  └─ ResultPanel         [ResultManager]  (初期は非表示)
├─ Player                 [PlayerMove] [SpriteRenderer] [CircleCollider2D]  Tag=Player
├─ Spawner                [SpawnManager] [RandomSpawner] [SpeedUp]
├─ FallRoot               (生成された障害物の親。空のGameObject)
└─ Audio                  [SoundManager] [AudioSource]`,
  comps:[
    ['Player','PlayerMove','speed=8, clampX=±7.5','左右移動'],
    ['Player','CircleCollider2D','radius=0.35, IsTrigger=ON','当たり判定'],
    ['FallItem','Rigidbody2D','BodyType=Dynamic, gravityScale=1.2','落下'],
    ['FallItem','CircleCollider2D','radius=0.5, IsTrigger=ON','接触'],
    ['Spawner','SpawnManager','interval=0.75, prefab=FallingObject','生成'],
    ['GameManager','LifeManager','max=3','残機']
  ],
  flow:'Input → PlayerMove(X座標) → CollisionJudge → LifeManager → ResultManager → Retry',
  tuning:[
    ['moveSpeed',8.0,'移動速度','操作のキビキビ感'],
    ['fallSpeed',3.0,'落下速度','避ける猶予'],
    ['spawnInterval',0.75,'出現間隔','画面の密度'],
    ['speedUpPerSec',0.02,'加速率','後半の忙しさ'],
    ['maxLife',3,'残機','失敗の許容'],
    ['gameTime',60,'制限時間','1プレイの長さ']
  ],
  mid:[
    {h:'ピコ太郎を動かす',w:'PlayerにSpriteRenderer（仮素材：黄色い四角＋サングラス）とPlayerMoveを付け、←→キーで左右に動かす。',d:'キーで動き、画面の端で止まる。',c:'端まで押し続けても画面外に出ない。',t:'transform.position を丸ごと書き換えるとZが動いて見えなくなります。xだけ変える。',m:20,p:'PlayerMove'},
    {h:'落ちてくる物をつくる',w:'FallingItemを作り、Rigidbody2D（gravityScale=1.2）とCircleCollider2Dを付けてPrefab化。画面外に出たらDestroy。',d:'アイテムが上から落ちて、下で消える。',c:'3秒放置でHierarchyから消える。',t:'Colliderを付け忘れると、見た目は落ちるのに当たりません。',m:20,p:'FallingObject'},
    {h:'一定間隔で出す',w:'SpawnerにSpawnManagerを付け、x座標をランダムにして上から生成する。',d:'アイテムが等間隔で出続ける。',c:'10秒で13個前後出ている。',t:'Prefabの位置がそのまま出ます。生成直後に座標を上書きしてください。',m:20,p:'SpawnManager'},
    {h:'当たったら減らす',w:'TagをPlayer／Obstacleに設定し、OnTriggerEnter2DでLifeManagerを1減らす。',d:'当たるとライフが1減る。',c:'Consoleに「Hit」が1回だけ出る。',t:'IsTriggerがOFFだとすり抜けます。両方のColliderでONに。',m:20,p:'CollisionJudge'},
    {h:'時間で速くする',w:'SpeedUpで落下速度と出現間隔を毎秒少しずつ変える。',d:'後半で明らかに忙しくなる。',c:'開始10秒と50秒で落下速度が違う。',t:'毎フレーム加算すると数秒で爆速になります。秒あたりで。',m:15,p:'SpeedUp'},
    {h:'終わらせる',w:'Timerが0、またはライフが0でResultPanelを表示し、操作を止める。',d:'成功／失敗のどちらでも結果画面が出る。',c:'時間切れとミスの両方を試す。',t:'Time.timeScaleを0にするとReloadが効かなくなります。フラグで止める。',m:20,p:'ResultManager'},
    {h:'もう一回',w:'Retryボタンでシーンを再読み込みし、スポーンとタイマーを初期化する。',d:'2周目が1周目と同じ状態から始まる。',c:'2周してスコアが残っていない。',t:'staticなカウンタが残ります。Retryで0を代入。',m:20,p:'Retry'}
  ]
},
E03:{
  juice:['dmg','recoil','hitSpark','popup','landSquash','bloom','comboscale'],
  name:'落下キャッチ（選別）', short:'落ちてくる物のうち、必要なものだけを受ける',
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer]
├─ Canvas
│  ├─ HUD
│  │  ├─ TargetIcon       [Image]  今回取るアイテムのアイコン
│  │  ├─ ScoreText        [TextMeshProUGUI]
│  │  ├─ TimerText        [TextMeshProUGUI]
│  │  └─ LifeIcons        [HorizontalLayoutGroup]
│  └─ ResultPanel         [ResultManager]
├─ Player                 [PlayerMove] [BoxCollider2D]  Tag=Player
├─ CatchZone              [BoxCollider2D IsTrigger]  Playerの子。受け判定の帯
├─ Spawner                [SpawnManager] [RandomSpawner] [SpeedUp]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','PlayerMove','speed=8, clampX=±7','左右移動'],
    ['CatchZone','BoxCollider2D','size=(1.2, 0.5), IsTrigger=ON','受け判定'],
    ['Item','Rigidbody2D','gravityScale=0.9','落下'],
    ['Item','BoxCollider2D','IsTrigger=ON','接触'],
    ['Spawner','RandomSpawner','need:unneed = 1:2','種類の比率'],
    ['GameManager','ScoreManager','need=+1, unneed=-1','得点']
  ],
  flow:'Spawn(種類抽選) → FallingObject → CatchZone → Score/Life → HUD → Result',
  tuning:[
    ['moveSpeed',8.0,'移動速度','取りやすさ'],
    ['fallSpeed',2.2,'落下速度','判断の猶予'],
    ['spawnInterval',0.9,'出現間隔','同時に画面にある数'],
    ['needRatio',0.33,'必要アイテムの割合','選別の忙しさ'],
    ['targetCount',20,'成功に必要な数','1プレイの達成感'],
    ['maxLife',3,'残機','失敗の許容']
  ],
  mid:[
    {h:'受け皿を動かす',w:'PlayerにPlayerMoveを付け、左右に動かす。子オブジェクトにCatchZone（BoxCollider2D・IsTrigger）を作る。',d:'プレイヤーが動き、受け帯が一緒に動く。',c:'CatchZoneの緑の枠がPlayerの下に付いて動く。',t:'ColliderをPlayer本体に付けると、横から当たっても取れてしまいます。子の帯で受けます。',m:25,p:'PlayerMove'},
    {h:'アイテムを3種類つくる',w:'Pen・Apple・PineappleのPrefabを作り、色と形で見分けられるようにする（仮素材で可）。',d:'3種類が落ちてくる。',c:'見た目で区別できる。',t:'全部同じ色にすると、選別ゲームが成立しません。色は必ず分ける。',m:20,p:'FallingObject'},
    {h:'必要なものだけ出す',w:'SpawnManagerで種類を抽選。必要アイテムが約1/3になるようにする。',d:'必要なものが混ざって落ちてくる。',c:'20個出して必要が6〜7個。',t:'Random.Range(0,3) の上限は「含まれない」ので注意。',m:20,p:'RandomSpawner'},
    {h:'取れたら判定する',w:'CatchZoneのOnTriggerEnter2Dで、Itemの種類とTargetIconを比較する。',d:'正解で+1、不正解でライフ−1。',c:'両方のパターンを試す。',t:'ItemのTagだけで判定すると種類が増やせません。ItemDataにenumを持たせる。',m:25,p:'CollisionJudge'},
    {h:'スコアとライフを出す',w:'ScoreManagerとLifeManagerをHUDに反映する。値が変わった時だけ更新する。',d:'数字とハートが正しく変わる。',c:'10個取って数字が10になっている。',t:'毎フレームTextを書き換えると重くなります。変化時だけ。',m:20,p:'ScoreManager'},
    {h:'目標を見せる',w:'TargetIconに今回取るアイテムを表示し、残り数を出す。',d:'何を取ればいいかが一目で分かる。',c:'アイコンと落ちてくる物が一致している。',t:'アイコンが小さいと読めません。画面上部に大きく。',m:15,p:'UIManager'},
    {h:'終わらせる',w:'目標数に到達で成功、ライフ0または時間切れで失敗。ResultPanelを出す。',d:'勝敗が確定して結果が出る。',c:'成功と失敗の両方を確認。',t:'両方の条件が同時に成立した時の優先順位を決めておく。',m:20,p:'ResultManager'}
  ]
},
E06:{
  juice:['freeze','bloom','popup','chase','comboscale','hitSpark'],
  name:'タイミング一致', short:'表示に合わせて1つ（または方向）のキーを押す',
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer]
├─ Canvas
│  ├─ HUD
│  │  ├─ JudgeText        [TextMeshProUGUI]  PERFECT/GOOD/MISS
│  │  ├─ ComboText        [TextMeshProUGUI]
│  │  ├─ TimerText        [TextMeshProUGUI]
│  │  └─ ScoreText        [TextMeshProUGUI]
│  └─ ResultPanel         [ResultManager]
├─ Stage
│  ├─ Target              [TargetMover] [SpriteRenderer]  動く的
│  └─ AimLine             [SpriteRenderer]  判定ライン
├─ Cursor                 [CursorController]  1ボタン/方向入力
└─ Audio                  [SoundManager]`,
  comps:[
    ['Target','TargetMover','amplitude=4, speed=1.6','往復運動'],
    ['GameManager','RhythmJudge','perfect=0.08, good=0.18','判定窓（秒）'],
    ['Cursor','CursorController','key=Space / 方向キー','入力'],
    ['GameManager','ComboManager','resetOnMiss=true','連続成功'],
    ['Canvas','UIManager','JudgeText, ComboText','表示']
  ],
  flow:'TargetMover(位置) → 入力 → RhythmJudge(ズレ) → Score/Combo → Judge表示 → 次の的',
  tuning:[
    ['targetSpeed',1.6,'的の速さ','読みやすさ'],
    ['perfectWindow',0.08,'PERFECTの窓(秒)','手応え'],
    ['goodWindow',0.18,'GOODの窓(秒)','救済'],
    ['interval',1.6,'次の的までの間隔','テンポ'],
    ['targetCount',10,'成功に必要な数','達成感'],
    ['speedUpPerSec',0.02,'加速率','後半の難しさ']
  ],
  mid:[
    {h:'動く的をつくる',w:'TargetにTargetMoverを付け、sin波で左右（または上下）に往復させる。',d:'的が等速で往復する。',c:'端で自然に折り返す。',t:'Mathf.PingPongかSin。Sinは端で減速するので「合わせやすい」感触になります。',m:20,p:'PlayerMove'},
    {h:'判定ラインを引く',w:'AimLineを画面中央に固定し、的が来る位置を明示する。',d:'どこで押せばいいか分かる。',c:'線の上を的が通る。',t:'線が見えないとタイミングゲームになりません。太く、コントラスト強く。',m:10,p:'UIManager'},
    {h:'押した瞬間を取る',w:'Input.GetKeyDownで入力を取り、的の中心とラインのズレを秒に換算する。',d:'ズレが数値で出る。',c:'Consoleにズレが出る。',t:'GetKeyだと押しっぱなしで連打になります。GetKeyDownを使う。',m:20,p:'InputManager'},
    {h:'3段階で判定する',w:'RhythmJudgeでPERFECT／GOOD／MISSを返し、JudgeTextに0.4秒だけ表示する。',d:'判定が文字で出る。',c:'わざと早く押すとMISSになる。',t:'判定窓をフレームで持つとfpsで変わります。秒で。',m:25,p:'RhythmJudge'},
    {h:'コンボをつなぐ',w:'成功でコンボ+1、MISSで0に戻す。3以上で表示する。',d:'連続成功で数字が伸びる。',c:'わざと外すとリセットされる。',t:'リセット条件（MISSのみか、GOODでも切るか）を先に決める。',m:15,p:'ComboManager'},
    {h:'だんだん難しくする',w:'成功のたびに的の速度と判定窓を少し変える。',d:'後半でシビアになる。',c:'10回目の方が難しい。',t:'判定窓を狭めすぎると理不尽になります。下限を決める。',m:15,p:'DifficultyCurve'},
    {h:'終わらせる',w:'規定回数成功で成功、ライフ0または時間切れで失敗。',d:'勝敗が出る。',c:'両方のパターンを確認。',t:'成功と失敗が同じフレームで起きないよう優先順位を決める。',m:15,p:'ResultManager'}
  ]
},
E07:{
  juice:['freeze','hitSpark','bloom','moveTrail','comboscale'],
  name:'リズム（3レーン）', short:'流れるノーツを判定ラインで叩く',
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [ComboManager] [Timer]
├─ Canvas
│  ├─ LaneRoot            [HorizontalLayoutGroup]
│  │  ├─ Lane_0           [Image]  Pen
│  │  ├─ Lane_1           [Image]  Apple
│  │  └─ Lane_2           [Image]  Pineapple
│  ├─ JudgeLine           [Image]  画面下部
│  ├─ HUD
│  │  ├─ JudgeText        [TextMeshProUGUI]
│  │  ├─ ComboText        [TextMeshProUGUI]
│  │  └─ ScoreText        [TextMeshProUGUI]
│  └─ ResultPanel         [ResultManager]
├─ NoteSpawner            [SpawnManager] [RhythmJudge]
└─ Audio                  [SoundManager] [AudioSource]`,
  comps:[
    ['Note','NoteMover','speed=600px/s','落下'],
    ['Note','Image','lane=0/1/2','レーン'],
    ['JudgeLine','RectTransform','y=120','判定位置'],
    ['GameManager','RhythmJudge','perfect=45px, good=90px','判定'],
    ['Spawner','SpawnManager','bpm=120, 8分','ノーツ生成']
  ],
  flow:'Beat(時間) → NoteSpawner → NoteMover → キー入力 → RhythmJudge → Score/Combo → 判定表示',
  tuning:[
    ['noteSpeed',600,'ノーツ速度(px/秒)','読みやすさ'],
    ['bpm',120,'テンポ','曲の速さ'],
    ['perfectPx',45,'PERFECTの距離','シビアさ'],
    ['goodPx',90,'GOODの距離','救済'],
    ['laneCount',3,'レーン数','同時押しの複雑さ'],
    ['maxLife',5,'MISS許容','失敗の重さ']
  ],
  mid:[
    {h:'3本のレーンを引く',w:'CanvasにLane_0〜2を等間隔で配置し、下にJudgeLineを置く。',d:'3本のレーンと判定ラインが見える。',c:'画面幅を3等分できている。',t:'RectTransformのアンカーをStretchにすると端末幅で崩れません。',m:20,p:'UIManager'},
    {h:'ノーツを流す',w:'Noteプレハブを作り、上から下へ等速で動かす。判定ラインを越えたらMISS。',d:'ノーツが流れて消える。',c:'1個流して、ラインの下で消える。',t:'RectTransform.anchoredPosition を使う（ワールド座標ではありません）。',m:25,p:'FallingObject'},
    {h:'テンポで出す',w:'BPMからノーツ間隔を計算し、SpawnManagerで一定拍ごとに1個出す。',d:'規則正しくノーツが出る。',c:'10秒で20個前後。',t:'60/BPM を8分音符で割る計算を間違えやすい。まずは1拍1個で。',m:20,p:'SpawnManager'},
    {h:'叩いて判定する',w:'D／F／Jキーを3レーンに割り当て、判定ラインとの距離で判定する。',d:'PERFECT／GOOD／MISSが出る。',c:'早すぎ・ちょうど・遅すぎを試す。',t:'キーとレーンの対応がずれやすい。画面にキー名を出しておく。',m:25,p:'RhythmJudge'},
    {h:'音を鳴らす',w:'叩いた瞬間に短い音を鳴らし、判定でもう1音変える。',d:'叩くと音が出る。',c:'レーンごとに音が違う。',t:'AudioSource.PlayOneShotを連打すると音が割れます。音量を下げる。',m:20,p:'SoundManager'},
    {h:'コンボとスコア',w:'連続成功でコンボ、MISSでリセット。スコアは判定の重み付き。',d:'数字が伸びる。',c:'MISSで0に戻る。',t:'スコアの計算式をTUNINGにまとめる。',m:15,p:'ComboManager'},
    {h:'終わらせる',w:'制限時間で終了し、達成率と最大コンボを結果に出す。',d:'結果画面が出る。',c:'時間切れで必ず終わる。',t:'ノーツの残りが判定に干渉します。終了時は生成を止める。',m:20,p:'ResultManager'}
  ]
},
E08:{
  juice:['dmg','recoil','hitSpark','popup','landSquash','bloom','comboscale'],
  name:'仕分け', short:'落ちてくる物を正しい場所へ振り分ける',
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer] [ComboManager]
├─ Canvas
│  ├─ HUD
│  │  ├─ ScoreText / TimerText / LifeIcons / ComboText
│  │  └─ GuideText        [TextMeshProUGUI]  "Pen は左へ"
│  └─ ResultPanel         [ResultManager]
├─ Player                 [PlayerMove] [BoxCollider2D]  Tag=Player
├─ Slots
│  ├─ Slot_Pen            [DropSlot] Tag=Slot_Pen
│  ├─ Slot_Apple          [DropSlot] Tag=Slot_Apple
│  └─ Slot_Pine           [DropSlot] Tag=Slot_Pine
├─ Spawner                [SpawnManager] [RandomSpawner] [SpeedUp]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','PlayerMove','speed=9, clampX=±7.2','移動'],
    ['Player','BoxCollider2D','size=(1.4,1.4), IsTrigger=ON','受け'],
    ['Slot','BoxCollider2D','size=(2.4,6), IsTrigger=ON','仕分け先'],
    ['Slot','DropSlot','tag=Slot_Pen など','判定'],
    ['Item','ItemData','type=Pen/Apple/Pine','種類'],
    ['Spawner','SpeedUp','+0.015/秒','難易度']
  ],
  flow:'Spawn(種類) → PlayerMove → 接触 → DropSlot(Tag比較) → Score/Life/Combo → HUD → Result',
  tuning:[
    ['moveSpeed',9.0,'移動速度','取り回し'],
    ['fallSpeed',2.4,'落下速度','判断の猶予'],
    ['spawnInterval',0.85,'出現間隔','密度'],
    ['ppapBonusEvery',3,'PPAP完成に必要な連続数','ボーナスの頻度'],
    ['targetCount',24,'成功に必要な数','達成感'],
    ['maxLife',3,'残機','失敗の許容']
  ],
  mid:[
    {h:'3つの仕分け先をつくる',w:'画面下にSlot_Pen／Slot_Apple／Slot_Pineを等間隔で置き、それぞれTagを設定してBoxCollider2Dを付ける。',d:'3つの籠が見える。',c:'籠の上にアイコンが表示されている。',t:'ColliderのSizeが小さいと、見た目は入っているのに反応しません。帯を大きく。',m:20,p:'DropSlot'},
    {h:'アイテムに種類を持たせる',w:'ItemDataにenum（Pen/Apple/Pine）を持たせ、見た目と色を対応させる。',d:'3種類が見分けられる。',c:'生成時に種類がランダム。',t:'Tagは1オブジェクトに1つ。種類はenumで持つのが楽です。',m:20,p:'FallingObject'},
    {h:'落として、受ける',w:'Playerでアイテムを受ける。受けた瞬間に、PlayerがどのSlotの上にいるかを判定する。',d:'籠の上で受けると仕分けられる。',c:'3つの籠すべてで試す。',t:'アイテム側で判定すると、どの籠か分かりません。PlayerのX座標で籠を決めるのが簡単。',m:25,p:'CollisionJudge'},
    {h:'正誤を返す',w:'アイテムの種類と籠のTagが一致したら+1、違えばライフ−1。',d:'正しい籠で+1、間違いでライフ減。',c:'わざと間違えてみる。',t:'連続で当たると2回判定されます。判定済みフラグを立てる。',m:20,p:'MatchJudge'},
    {h:'PPAP完成ボーナス',w:'Pen→Apple→Pine→Pen の順で正しく仕分けられたら、ボーナス得点と演出。',d:'3連続でボーナスが出る。',c:'順番を変えるとボーナスが出ない。',t:'順番の配列を初期化し忘れるとnull参照になります。',m:20,p:'ComboManager'},
    {h:'だんだん速く',w:'時間経過で落下速度と出現間隔を変える。',d:'後半で忙しくなる。',c:'開始10秒と50秒を比べる。',t:'速くしすぎると理不尽。上限を決める。',m:15,p:'SpeedUp'},
    {h:'終わらせる',w:'目標数に到達で成功、ライフ0で失敗。結果に内訳を出す。',d:'勝敗と理由が出る。',c:'両方のパターンを確認。',t:'成功と失敗の同時成立を避ける。',m:15,p:'ResultManager'}
  ]
},
E09:{
  juice:['bloom','popup','comboscale','freeze','countUp'],
  name:'2択判断', short:'出題を見て、2つのボタンで即答する',
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer] [MatchJudge]
├─ Canvas
│  ├─ QuestionRoot
│  │  ├─ ItemA            [Image]
│  │  └─ ItemB            [Image]
│  ├─ BtnYes              [Button] "成立"
│  ├─ BtnNo               [Button] "不成立"
│  ├─ HUD
│  │  ├─ JudgeText / ScoreText / TimerText / ComboText
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['BtnYes','Button','onClick=Answer(true)','回答'],
    ['BtnNo','Button','onClick=Answer(false)','回答'],
    ['GameManager','MatchJudge','answerLock=0.4s','連打防止'],
    ['GameManager','QuestionDeck','pairs=組み合わせ表','出題'],
    ['ItemA','Image','sprite=種類に応じて','表示']
  ],
  flow:'QuestionDeck(抽選) → 2アイテム表示 → 回答 → MatchJudge → Score/Life → 次の問題',
  tuning:[
    ['questionInterval',1.8,'出題間隔(秒)','テンポ'],
    ['answerLock',0.4,'連打防止(秒)','誤入力の抑制'],
    ['targetCount',20,'成功に必要な正解数','達成感'],
    ['maxLife',3,'残機','失敗の許容'],
    ['speedUpAt',10,'加速が始まる問題数','後半の忙しさ']
  ],
  mid:[
    {h:'出題データをつくる',w:'「成立する組み合わせ」を10組、「しない組み合わせ」を10組、配列で用意する。',d:'20問のデータがある。',c:'配列の中身をConsoleで確認。',t:'配列はAwakeで初期化。null参照の定番です。',m:20,p:'MatchJudge'},
    {h:'2つのアイテムを表示する',w:'ItemA／ItemBにスプライトをセットして表示する。',d:'問題が画面に出る。',c:'毎回違う組み合わせが出る。',t:'同じ問題が連続しないよう、直前の問題IDを除外する。',m:20,p:'UIManager'},
    {h:'2つのボタンで答える',w:'BtnYes／BtnNoにonClickを設定し、正誤を判定する。',d:'押した側で正誤が出る。',c:'両方のボタンを押してみる。',t:'連打で2回判定されます。回答後0.4秒は入力を止める。',m:20,p:'MatchJudge'},
    {h:'正誤を見せる',w:'JudgeTextに○×を出し、0.4秒後に次の問題へ。',d:'判定が見えて、次に進む。',c:'テンポよく進む。',t:'コルーチンの中で次の問題を出すと、連打で多重実行されます。フラグで防ぐ。',m:20,p:'ResultManager'},
    {h:'スコアとライフ',w:'正解で+1、不正解でライフ−1。コンボも表示。',d:'数字が動く。',c:'わざと間違えるとライフが減る。',t:'ライフ0で即終了。問題の続行を止める。',m:15,p:'ScoreManager'},
    {h:'だんだん速く',w:'出題間隔を少しずつ短くする。',d:'後半は考える暇が減る。',c:'最初と最後で間隔が違う。',t:'0秒にすると理不尽。下限0.8秒。',m:15,p:'DifficultyCurve'},
    {h:'終わらせる',w:'制限時間か問題数で終了し、正答率を出す。',d:'結果に正答率が出る。',c:'正答率が計算されている。',t:'0除算に注意（出題0問）。',m:15,p:'ResultManager'}
  ]
},
E10:{
  juice:['freeze','hitSpark','chase','bloom','popup'],
  name:'組み合わせ', short:'2つを重ねて、成立する組み合わせを作る',
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [Timer] [CombinationJudge]
├─ Canvas
│  ├─ HUD
│  │  ├─ ScoreText / TimerText / ComboText
│  │  └─ HintText         [TextMeshProUGUI]  "2つを重ねろ"
│  └─ ResultPanel         [ResultManager]
├─ Field
│  ├─ Item_0 … Item_5     [DragObject] [CircleCollider2D]
│  ├─ SlotA               [DropSlot]
│  ├─ SlotB               [DropSlot]
│  └─ ResultPreview       [SpriteRenderer]  合成結果の表示
└─ Audio                  [SoundManager]`,
  comps:[
    ['Item','DragObject','returnToStart=false','ドラッグ'],
    ['Item','CircleCollider2D','radius=0.6, IsTrigger=ON','重なり判定'],
    ['SlotA/B','DropSlot','acceptedTag=Item','受け入れ'],
    ['GameManager','CombinationJudge','table=Dictionary<string,Result>','組み合わせ'],
    ['ResultPreview','SpriteRenderer','初期は透明','結果表示']
  ],
  flow:'Drag → SlotA/B確定 → CombinationJudge(key=A.id+"_"+B.id) → Score → 結果表示 → リセット',
  tuning:[
    ['dragSpeed',1.0,'追従の速さ','操作感'],
    ['snapDistance',0.8,'スナップ距離','置きやすさ'],
    ['comboTime',2.0,'組み合わせを保つ時間','テンポ'],
    ['targetCount',8,'成功に必要な組数','達成感'],
    ['resultShowTime',0.8,'結果を見せる時間','納得感']
  ],
  mid:[
    {h:'アイテムを並べる',w:'Itemを5〜6個、画面上に散らして配置する。',d:'アイテムが並ぶ。',c:'全部見えている。',t:'重なりすぎると掴めません。初期位置を離す。',m:20,p:'DragObject'},
    {h:'ドラッグできるようにする',w:'DragObjectでマウス／タッチの位置をワールド座標に変換して追従させる。',d:'掴んで動かせる。',c:'離すとその場に残る。',t:'ScreenToWorldPointのZを忘れると、カメラの裏に行って消えます。',m:25,p:'DragObject'},
    {h:'2つのスロットを置く',w:'SlotA／SlotBを置き、アイテムを離した位置で受け入れを判定する。',d:'スロットに入ると吸い付く。',c:'両方のスロットで試す。',t:'ColliderのSizeと見た目を一致させる。',m:20,p:'DropSlot'},
    {h:'組み合わせ表をつくる',w:'Dictionary<string, Result> に「Pen_Apple → 完成品」などを登録する。',d:'正しい組で結果が返る。',c:'Consoleで結果を確認。',t:'キーの順番を揃える（A_BとB_Aを同一視するならソートする）。',m:25,p:'CombinationJudge'},
    {h:'結果を見せる',w:'ResultPreviewに結果のスプライトを0.8秒表示し、元のアイテムを戻す。',d:'合成結果が見える。',c:'成立・不成立で表示が違う。',t:'不成立でも「別の結果」を返すと、試すのが楽しくなります。',m:20,p:'ResultManager'},
    {h:'スコアと制限時間',w:'成立で+1、規定数で成功。時間切れで終了。',d:'カウントと時間が動く。',c:'成功と時間切れを確認。',t:'成立判定の直後に同じ組を数えないようフラグを立てる。',m:15,p:'ScoreManager'},
    {h:'終わらせる',w:'ResultPanelに組数と、作れた組み合わせの一覧を出す。',d:'何を作れたか振り返れる。',c:'一覧が出る。',t:'Textの文字数制限（TextMeshProは大丈夫）。',m:20,p:'ResultManager'}
  ]
},
E11:{
  juice:['landSquash','landDust','shake','jumpCharge','freeze','hitSpark'],
  name:'積み上げ', short:'タイミングよく落として、上に積む',
  scene:`SampleScene
├─ GameManager            [GameManager] [GameManager] [Timer] [BalanceJudge]
├─ Canvas
│  ├─ HUD
│  │  ├─ HeightText       [TextMeshProUGUI]  段数
│  │  ├─ ScoreText / TimerText
│  └─ ResultPanel         [ResultManager]
├─ Base                   [BoxCollider2D]  固定の台
├─ Crane                  [CraneMove]  左右に往復する親
│  └─ HeldItem            [SpriteRenderer] [Rigidbody2D isKinematic]
├─ StackRoot              (積まれた物の親)
└─ Audio                  [SoundManager]`,
  comps:[
    ['Crane','CraneMove','amplitude=5, speed=2','左右往復'],
    ['HeldItem','Rigidbody2D','isKinematic=ON → OFFで落下','落下'],
    ['Base','BoxCollider2D','size=(4,0.5)','土台'],
    ['Stacked','Rigidbody2D','mass=1, freezeRotation=OFF','積み'],
    ['GameManager','BalanceJudge','tiltLimit=20度','崩れ判定']
  ],
  flow:'CraneMove → 入力(離す) → HeldItem落下 → StackObject(接触) → Height加算 → BalanceJudge → 崩壊/継続',
  tuning:[
    ['craneSpeed',2.0,'往復の速さ','狙いやすさ'],
    ['amplitude',5.0,'往復の幅','難しさ'],
    ['gravityScale',2.0,'落下の重さ','積もり方'],
    ['tiltLimit',20,'崩れる角度','シビアさ'],
    ['targetHeight',8,'成功に必要な段数','達成感'],
    ['perfectBonus',true,'中心ボーナス','上手さの報酬']
  ],
  mid:[
    {h:'台をつくる',w:'BaseにBoxCollider2Dを付け、動かない固定台にする。',d:'台の上に物が乗る。',c:'物を落として乗る。',t:'台にRigidbody2Dを付けると落ちます。Staticのままに。',m:15,p:'StackObject'},
    {h:'クレーンを往復させる',w:'CraneにCraneMoveを付け、左右に往復させる。子にHeldItemを置く。',d:'アイテムが左右に動く。',c:'端で折り返す。',t:'子オブジェクトのローカル座標で動かすと、親の移動と干渉しません。',m:20,p:'PlayerMove'},
    {h:'ボタンで落とす',w:'スペースでHeldItemのisKinematicをOFFにし、重力で落とす。',d:'押すと落ちる。',c:'落ちて台に乗る。',t:'親のCraneごと落とさない。子だけ切り離す（transform.SetParent(null)）。',m:20,p:'FallingObject'},
    {h:'積もらせる',w:'落ちた物にRigidbody2DとColliderを付け、摩擦と反発を調整する。',d:'上に乗る。',c:'3段積める。',t:'反発（Bounciness）が高いと弾んで積めません。0に近づける。',m:25,p:'StackObject'},
    {h:'崩れを判定する',w:'BalanceJudgeで全体の傾きを見て、一定角度を超えたら崩壊とする。',d:'傾くと崩れる。',c:'端に積むと崩れる。',t:'毎フレーム全オブジェクトを走査すると重い。積んだ時だけ計算。',m:25,p:'BalanceJudge'},
    {h:'段数とボーナス',w:'積むたびに段数を+1。中心に近いほど高得点。',d:'段数が表示される。',c:'中心に積むと点が高い。',t:'中心判定はBaseのX座標との差で。',m:15,p:'ScoreManager'},
    {h:'終わらせる',w:'崩壊または時間切れで終了。最高段数を結果に出す。',d:'結果が出る。',c:'崩しても時間切れでも結果が出る。',t:'崩壊後も操作を受け付けないようにする。',m:15,p:'ResultManager'}
  ]
},
E12:{
  juice:['hitSpark','freeze','shake','moveTrail','bloom','popup'],
  name:'ブロック崩し', short:'パドルで跳ね返してブロックを壊す',
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer]
├─ Canvas
│  ├─ HUD
│  │  ├─ ScoreText / TimerText / LifeIcons / BreakText
│  └─ ResultPanel         [ResultManager]
├─ Paddle                 [PlayerMove] [BoxCollider2D]  Tag=Paddle
├─ Ball                   [BallMove] [CircleCollider2D] [Rigidbody2D]
├─ Blocks
│  ├─ Block_0 …           [Block] [BoxCollider2D]  Tag=Block
│  └─ Block_17
├─ Walls                  [BoxCollider2D] ×3（左右・上）
└─ Audio                  [SoundManager]`,
  comps:[
    ['Paddle','PlayerMove','speed=10, clampX=±7.5','パドル'],
    ['Ball','Rigidbody2D','gravityScale=0, mass=1','反射'],
    ['Ball','CircleCollider2D','radius=0.2, bounciness=1','反射'],
    ['Block','BoxCollider2D','IsTrigger=OFF','破壊'],
    ['Block','Block','hp=1, type=Apple/Pine','種類'],
    ['GameManager','ScoreManager','break=+1','得点']
  ],
  flow:'Input → Paddle → 反射 → Ball → OnCollisionEnter2D(Block) → Destroy → 残数 → クリア/失敗',
  tuning:[
    ['paddleSpeed',10,'パドル速度','取り回し'],
    ['ballSpeed',7,'ボール速度','難易度'],
    ['ballSpeedUp',0.02,'反射ごとの加速','後半の忙しさ'],
    ['blockRows',3,'ブロックの行数','量'],
    ['blockCols',6,'ブロックの列数','量'],
    ['maxLife',3,'ボールを落とせる回数','失敗の許容']
  ],
  mid:[
    {h:'パドルを動かす',w:'PaddleにPlayerMoveとBoxCollider2Dを付け、左右に動かす。',d:'パドルが動く。',c:'端で止まる。',t:'パドルのColliderの厚みが薄すぎるとボールが抜けます。0.3以上。',m:15,p:'PlayerMove'},
    {h:'ボールを跳ね返す',w:'BallにRigidbody2D（gravityScale=0）とCircleCollider2Dを付け、初速を与える。',d:'ボールが飛んで壁で跳ね返る。',c:'壁で反射する。',t:'Physics Material 2DのBouncinessを1にしないと減速します。',m:25,p:'FallingObject'},
    {h:'ブロックを並べる',w:'Blockプレハブを作り、forループで3行×6列に配置する。',d:'ブロックが整列する。',c:'18個並んでいる。',t:'プレハブのスケールと間隔を揃えないと隙間ができます。',m:20,p:'SpawnManager'},
    {h:'壊す',w:'BlockにOnCollisionEnter2Dを付け、Ballが当たったらDestroyして得点。',d:'当たると消える。',c:'当たった数だけスコアが増える。',t:'BallとPaddleの衝突でも反応しないようTagで絞る。',m:20,p:'CollisionJudge'},
    {h:'落としたら減らす',w:'Ballが画面下に出たらライフ−1、Ballを初期位置に戻す。',d:'落とすとライフが減る。',c:'3回落とすと終了。',t:'ボールの速度をリセットしないと、再開時に速すぎます。',m:20,p:'LifeManager'},
    {h:'崩す順番でボーナス',w:'壊したブロックの並びが PPAP の順なら追加点。',d:'順番でボーナスが出る。',c:'順番を変えると出ない。',t:'壊した履歴を配列で持ち、直近3個だけ見る。',m:20,p:'ComboManager'},
    {h:'終わらせる',w:'全ブロック破壊で成功、ライフ0または時間切れで失敗。',d:'勝敗が出る。',c:'両方確認。',t:'最後の1個が残って詰むので、残数表示を必ず出す。',m:15,p:'ResultManager'}
  ]
},
E13:{
  name:'クイズ（2択）', short:'問題を見て、2つのボタンで答える',
  juice:['flash','popup','comboscale','hitstop'],
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer] [MatchJudge]
├─ Canvas
│  ├─ QuestionPanel       [Image] 白い角丸パネル
│  │  ├─ ItemA           [Image]
│  │  ├─ ItemB           [Image]
│  │  └─ QuestionText    [TextMeshProUGUI]  "これはPPAP?"
│  ├─ BtnYes              [Button] 成立
│  ├─ BtnNo               [Button] 不成立
│  ├─ HUD
│  │  ├─ JudgeText / ScoreText / TimerText / ComboText
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['BtnYes','Button','onClick=Answer(true)','回答'],
    ['BtnNo','Button','onClick=Answer(false)','回答'],
    ['GameManager','MatchJudge','lock=0.5s','連打防止'],
    ['GameManager','QuestionDeck','pairs=20問','出題'],
    ['QuestionPanel','CanvasGroup','alpha=0→1で0.15秒','出題演出']
  ],
  flow:'QuestionDeck(抽選) → パネル表示 → 回答 → MatchJudge → Score/Life → 解説 → 次の問題',
  tuning:[
    ['questionInterval',2.2,'出題間隔(秒)','テンポ'],
    ['answerLock',0.5,'入力ロック(秒)','誤入力の抑制'],
    ['targetCount',12,'成功に必要な正解数','達成感'],
    ['maxLife',3,'残機','失敗の許容'],
    ['explainTime',0.8,'解説を出す時間','納得感']
  ],
  mid:[
    {h:'問題データをつくる',w:'「成立する組み合わせ」10問と「しない組み合わせ」10問を配列で用意する。',d:'20問のデータがある。',c:'Consoleに20件出る。',t:'配列の初期化を忘れるとnull参照。Awakeで作る。',m:20,p:'MatchJudge'},
    {h:'パネルを出す',w:'QuestionPanelに2つのアイテム画像と問題文をセットし、CanvasGroupでフェードイン。',d:'問題が1問ずつ出る。',c:'20問が順に出る。',t:'前の問題が残ると二重に見えます。表示前に必ず消す。',m:20,p:'UIManager'},
    {h:'2択で答える',w:'左右に大きなボタンを置き、正誤を判定。回答後0.5秒は入力ロック。',d:'押した側で正誤が出る。',c:'両方のボタンを連打しても1回しか判定されない。',t:'ロックしないと連打で2問進みます。',m:20,p:'MatchJudge'},
    {h:'解説を出す',w:'正解のとき、なぜ成立するかを1行出す（例：「Pen＋Appleは…」）。',d:'納得できる。',c:'正解時だけ解説が出る。',t:'解説が長いとテンポが死ぬ。20文字以内。',m:15,p:'ResultManager'},
    {h:'点数とライフ',w:'正解+1、不正解でライフ−1。コンボも表示。',d:'数字が動く。',c:'わざと間違えると減る。',t:'ライフ0で即終了。問題の続行を止める。',m:15,p:'ScoreManager'},
    {h:'テンポを上げる',w:'正解が続くと出題間隔を少し縮める。',d:'後半は忙しい。',c:'最初と最後で間隔が違う。',t:'0.8秒以下にすると読めません。',m:15,p:'DifficultyCurve'},
    {h:'終わらせる',w:'制限時間か問題数で終了し、正答率を出す。',d:'結果が出る。',c:'正答率が計算される。',t:'出題0問でのゼロ除算に注意。',m:15,p:'ResultManager'}
  ]
},
E14:{
  name:'横スクロール（マリオ型）', short:'走って跳んで、ゴールを目指す',
  juice:['squash','hitstop','shake','particles','trail'],
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer]
├─ Main Camera            [CameraFollow]  プレイヤーを追う
├─ Player                 [PlayerMove] [JumpAction] [Rigidbody2D] [CapsuleCollider2D]  Tag=Player
│  └─ GroundCheck         [GroundCheck]  足元のRaycast起点
├─ Level
│  ├─ Ground_0 …          [BoxCollider2D]  足場
│  ├─ Coin_0 …            [CircleCollider2D IsTrigger]
│  ├─ Enemy_0 …           [EnemyWalker]
│  └─ Goal                [BoxCollider2D IsTrigger]  Tag=Goal
├─ Canvas
│  ├─ HUD (Score / Timer / Life / Coin)
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','PlayerMove','speed=8','左右移動'],
    ['Player','JumpAction','jump=11, 接地時のみ','ジャンプ'],
    ['Player','Rigidbody2D','gravityScale=3, FreezeRotation Z','物理'],
    ['Player','CapsuleCollider2D','size=(0.7,1.2)','当たり'],
    ['GroundCheck','GroundCheck','radius=0.15, layer=Ground','接地'],
    ['Coin','CircleCollider2D','IsTrigger=ON','取得'],
    ['Enemy','EnemyWalker','speed=2, 往復','敵'],
    ['Camera','CameraFollow','smooth=0.15, offsetX=3','追従']
  ],
  flow:'Input → PlayerMove/Jump → 接地判定 → Coin取得/Enemy接触 → Score/Life → Goal判定 → Result',
  tuning:[
    ['moveSpeed',8,'走る速さ','操作感'],
    ['jumpPower',11,'ジャンプ力','届く高さ'],
    ['gravityScale',3,'重力','落下の速さ'],
    ['cameraOffsetX',3,'カメラの先読み','見える範囲'],
    ['coinTarget',12,'コインの目標数','取りこぼしの悔しさ'],
    ['maxLife',3,'残機','失敗の許容']
  ],
  mid:[
    {h:'走らせる',w:'PlayerにRigidbody2DとCapsuleCollider2Dを付け、左右キーで速度を入れる。',d:'プレイヤーが走る。',c:'壁にぶつかっても止まる。',t:'transformを直接動かすと当たり判定がすり抜けます。Rigidbody2Dのvelocityを使う。',m:25,p:'PlayerMove'},
    {h:'跳ばせる',w:'足元にGroundCheckを置き、Raycastで接地を判定。接地中だけジャンプを受け付ける。',d:'ジャンプできて、空中では跳べない。',c:'2段ジャンプにならない。',t:'接地判定が広いと壁でも跳べます。半径0.15程度に。',m:25,p:'JumpAction'},
    {h:'足場を並べる',w:'Groundを並べ、間に穴を空ける。落ちたらスタート地点に戻す。',d:'渡って進める。',c:'穴に落ちると戻る。',t:'穴の幅はジャンプで届く距離の7割に。',m:20,p:'CollisionJudge'},
    {h:'コインを置く',w:'CoinにIsTriggerを付け、触れたら消して得点。',d:'取ると消える。',c:'取った数がHUDに出る。',t:'Triggerには Collider が2つ必要（片方にRigidbody2D）。',m:15,p:'ScoreManager'},
    {h:'敵を歩かせる',w:'EnemyWalkerで左右に往復させ、触れたらライフ−1。上から踏んだら倒せるようにする。',d:'敵が動き、踏むと倒せる。',c:'横から当たると減り、上からなら倒れる。',t:'踏んだ判定は「接触点のYが敵の中心より上か」で見る。',m:25,p:'CollisionJudge'},
    {h:'カメラを追わせる',w:'CameraFollowでプレイヤーの少し先を映す。',d:'自然に追いかける。',c:'急に飛ばない。',t:'Lerpを掛けないとガタつきます。',m:15,p:'CameraFollow'},
    {h:'ゴールと結果',w:'Goalに触れたら成功。時間切れ・ライフ0で失敗。',d:'勝敗が出る。',c:'両方のパターンを確認。',t:'ゴールとミスが同時に起きないよう優先順位を決める。',m:20,p:'ResultManager'}
  ]
},
E15:{
  name:'サバイバル（ヴァンサバ型）', short:'押し寄せる敵を自動攻撃で薙ぎ払う',
  juice:['hitstop','particles','comboscale','flash','popup'],
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [Timer] [LifeManager]
├─ Main Camera            [CameraFollow]
├─ Player                 [PlayerMove] [AutoAttack] [CircleCollider2D] [Rigidbody2D]
├─ EnemyRoot              (生成された敵の親)
├─ BulletRoot             (弾の親)
├─ XPRoot                 (経験値の粒)
├─ Canvas
│  ├─ HUD (Timer / HP / Level / Kill)
│  ├─ LevelUpPanel        [LevelUpSelect]  3択
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','PlayerMove','speed=5','移動'],
    ['Player','AutoAttack','interval=0.5, range=6','自動攻撃'],
    ['Enemy','EnemyChase','speed=1.8','追跡'],
    ['Enemy','CircleCollider2D','IsTrigger=ON','接触'],
    ['GameManager','SpawnManager','interval=0.7, 上限200','生成'],
    ['GameManager','LevelUpSelect','3択','強化']
  ],
  flow:'Spawn → EnemyChase → AutoAttack(最近傍) → 撃破 → XP取得 → LevelUp(3択) → 時間終了でResult',
  tuning:[
    ['moveSpeed',5,'移動速度','避けやすさ'],
    ['attackInterval',0.5,'攻撃間隔','殲滅速度'],
    ['attackRange',6,'攻撃範囲','届く距離'],
    ['enemySpeed',1.8,'敵の速さ','追いつかれるか'],
    ['spawnInterval',0.7,'出現間隔','密度'],
    ['maxEnemy',200,'敵の上限','重さ'],
    ['levelUpEvery',5,'レベルアップに必要なXP','成長のテンポ']
  ],
  mid:[
    {h:'動かして、追わせる',w:'Playerを移動させ、Enemyに「プレイヤーへ向かって進む」処理を入れる。',d:'敵が追ってくる。',c:'10体出して全部追ってくる。',t:'毎フレーム全敵でプレイヤーを探すと重い。参照を1つ持たせる。',m:25,p:'PlayerMove'},
    {h:'自動で攻撃する',w:'一定間隔で最も近い敵を選び、弾を飛ばす（または近接範囲攻撃）。',d:'敵が勝手に倒れる。',c:'近くの敵から倒れる。',t:'毎回全敵をソートすると重い。距離の2乗で最小を探す。',m:25,p:'CollisionJudge'},
    {h:'敵を湧かせる',w:'画面外のランダム位置に敵を生成し、上限を超えたら古いものを消す。',d:'敵が湧き続ける。',c:'200体で止まる。',t:'上限を決めないとフリーズします。',m:20,p:'SpawnManager'},
    {h:'経験値とレベルアップ',w:'倒した敵がXPを落とし、規定値で3択の強化を出す。',d:'強くなれる。',c:'5体倒すと選択が出る。',t:'選択中は時間を止める（Time.timeScale=0）。',m:30,p:'LevelUpSelect'},
    {h:'HPと被弾',w:'敵に触れたらHP−1、無敵時間0.5秒。',d:'連続で減らない。',c:'触れ続けても0.5秒に1回しか減らない。',t:'無敵時間を入れないと一瞬で死にます。',m:20,p:'LifeManager'},
    {h:'画面を賑やかに',w:'弾の軌跡、敵の消滅粒子、ダメージ数字を出す。',d:'気持ちいい。',c:'30体同時でも重くない。',t:'パーティクルの同時数を絞る。',m:20,p:'SoundManager'},
    {h:'90秒で終わらせる',w:'タイマー0で結果。撃破数とレベルを出す。',d:'結果が出る。',c:'90秒で必ず終わる。',t:'終了時に生成を止める。',m:15,p:'ResultManager'}
  ]
},
E16:{
  name:'縦シューティング', short:'上から来る敵を撃ち落とす',
  juice:['hitstop','particles','trail','flash','shake'],
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer]
├─ Player                 [PlayerMove4] [AutoShot] [CircleCollider2D]  小さめ
├─ EnemyRoot
├─ BulletRoot (自弾) / EnemyBulletRoot
├─ Canvas
│  ├─ HUD (Score / Life / Timer)
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','PlayerMove4','speed=7, 画面内クランプ','4方向'],
    ['Player','AutoShot','interval=0.12','自動射撃'],
    ['Player','CircleCollider2D','radius=0.18','当たり（見た目の6割）'],
    ['Enemy','EnemyPattern','move=直進/横揺れ','移動'],
    ['Enemy','EnemyShot','interval=1.2','敵弾'],
    ['GameManager','SpawnManager','interval=0.8','出現']
  ],
  flow:'Spawn → EnemyPattern → EnemyShot → 自弾 → 撃破 → Score → 被弾 → Life → Result',
  tuning:[
    ['moveSpeed',7,'自機の速さ','回避力'],
    ['shotInterval',0.12,'連射間隔','殲滅速度'],
    ['bulletSpeed',14,'弾速','当てやすさ'],
    ['enemyInterval',0.8,'敵の出現間隔','密度'],
    ['hitRadius',0.18,'当たり半径','被弾の厳しさ'],
    ['maxLife',3,'残機','失敗の許容']
  ],
  mid:[
    {h:'自機を動かす',w:'上下左右に移動させ、画面外に出ないようクランプする。',d:'自由に動く。',c:'端で止まる。',t:'見た目より当たりを小さくしないと理不尽になります。',m:20,p:'PlayerMove'},
    {h:'自動で撃つ',w:'一定間隔で上方向に弾を生成する。',d:'弾が出続ける。',c:'弾が画面上に流れる。',t:'Instantiateを毎回すると重い。最初はそれで良いが上限を決める。',m:20,p:'AutoShot'},
    {h:'敵を出す',w:'上から敵を出現させ、まっすぐ下ろす。',d:'敵が降ってくる。',c:'10体出る。',t:'出現位置が偏らないようXをランダムに。',m:20,p:'SpawnManager'},
    {h:'当たったら消す',w:'自弾と敵、敵弾と自機の当たりを取り、消して得点。',d:'撃つと敵が消える。',c:'当たった数だけスコアが増える。',t:'レイヤーを分けて、自弾が自機に当たらないように。',m:25,p:'CollisionJudge'},
    {h:'敵の攻撃',w:'敵が一定間隔で下向きの弾を撃つ。',d:'避ける必要が出る。',c:'被弾するとライフが減る。',t:'敵弾が速すぎると避けられません。',m:20,p:'EnemyShot'},
    {h:'かすり判定',w:'弾の近くをすれすれで通ると得点。',d:'上手いと点が伸びる。',c:'近づくほど点が入る。',t:'判定は当たりより少し大きい円で。',m:20,p:'ScoreManager'},
    {h:'終わらせる',w:'75秒で終了。撃墜数と残機を結果に。',d:'結果が出る。',c:'時間で必ず終わる。',t:'終了時に敵と弾の生成を止める。',m:15,p:'ResultManager'}
  ]
},
E17:{
  name:'横シューティング', short:'横から来る地形と敵をかわして飛ぶ',
  juice:['trail','hitstop','shake','particles','flash'],
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer]
├─ Main Camera            [CameraFollow]  横固定・前進
├─ Player                 [PlayerMoveV] [AutoShot] [CircleCollider2D]
├─ TerrainRoot            (流れてくる地形)
├─ EnemyRoot
├─ Canvas
│  ├─ HUD (Score / Life / Timer)
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','PlayerMoveV','speed=7, Yのみ','上下移動'],
    ['Player','AutoShot','interval=0.14, 右方向','自動射撃'],
    ['Terrain','TerrainScroll','speed=6','左へ流す'],
    ['Terrain','BoxCollider2D','IsTrigger=ON','接触'],
    ['GameManager','SpawnManager','interval=1.6','地形生成']
  ],
  flow:'地形生成 → 左へスクロール → 上下で回避 → 自弾で敵撃破 → 接触でLife → Result',
  tuning:[
    ['scrollSpeed',6,'スクロール速度','先読みの余裕'],
    ['moveSpeed',7,'上下の速さ','回避力'],
    ['shotInterval',0.14,'連射間隔','殲滅速度'],
    ['terrainGap',1.6,'地形の間隔','密度'],
    ['maxLife',3,'残機','失敗の許容']
  ],
  mid:[
    {h:'上下に動かす',w:'自機を上下のみ移動させ、画面内にクランプ。',d:'上下に動く。',c:'端で止まる。',t:'横移動を入れると地形の意味が薄れます。',m:15,p:'PlayerMove'},
    {h:'地形を流す',w:'地形のプレハブを作り、左へ流して画面外で消す。',d:'地形が流れる。',c:'一定間隔で来る。',t:'生成間隔がバラバラだと難易度が読めません。',m:25,p:'TerrainScroll'},
    {h:'隙間を作る',w:'上下に壁を置き、通れる隙間を空ける。',d:'隙間を抜ける。',c:'当たるとライフが減る。',t:'隙間の高さは自機の3倍以上に。',m:20,p:'CollisionJudge'},
    {h:'撃つ',w:'自動で右に弾を出し、敵に当てる。',d:'敵が壊れる。',c:'弾が当たると消える。',t:'弾の寿命を決めて必ず消す。',m:20,p:'AutoShot'},
    {h:'敵を出す',w:'地形の隙間に敵を配置し、上下に揺らす。',d:'避けながら撃つ。',c:'敵が動く。',t:'地形と敵が重なると理不尽。生成位置を分ける。',m:20,p:'SpawnManager'},
    {h:'スクロールを速く',w:'時間でスクロール速度を上げる。',d:'後半忙しい。',c:'最初と最後で違う。',t:'上げすぎると地形が読めません。',m:15,p:'DifficultyCurve'},
    {h:'終わらせる',w:'75秒で終了。撃墜数と生存を結果に。',d:'結果が出る。',c:'時間で終わる。',t:'終了時に流れを止める。',m:15,p:'ResultManager'}
  ]
},
E18:{
  name:'リズム（4レーン）', short:'流れる矢印を4つのキーで叩く',
  juice:['hitstop','particles','comboscale','flash'],
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [ComboManager] [Timer]
├─ Canvas
│  ├─ LaneRoot            [HorizontalLayoutGroup]
│  │  ├─ Lane_0 … Lane_3  [Image]
│  ├─ JudgeLine           [Image]
│  ├─ KeyHints            [TextMeshProUGUI]  D F J K
│  ├─ HUD (Judge / Combo / Score)
│  └─ ResultPanel         [ResultManager]
├─ NoteSpawner            [SpawnManager] [RhythmJudge]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Note','NoteMover','speed=650px/s','落下'],
    ['Note','Image','lane=0..3','レーン'],
    ['GameManager','RhythmJudge','perfect=40px, good=85px','判定'],
    ['Spawner','SpawnManager','bpm=120','生成'],
    ['Canvas','KeyHints','D/F/J/Kを表示','操作補助']
  ],
  flow:'Beat → NoteSpawner → NoteMover → キー入力 → RhythmJudge → Score/Combo → Judge表示',
  tuning:[
    ['noteSpeed',650,'ノーツ速度','読みやすさ'],
    ['bpm',120,'テンポ','曲の速さ'],
    ['perfectPx',40,'PERFECTの距離','シビアさ'],
    ['goodPx',85,'GOODの距離','救済'],
    ['maxLife',8,'MISS許容','失敗の重さ']
  ],
  mid:[
    {h:'4レーンを引く',w:'CanvasにLane_0〜3を等間隔で置き、下に判定ラインとキー表示。',d:'4本のレーンが見える。',c:'画面幅を4等分できている。',t:'アンカーをStretchにしないと端末で崩れます。',m:20,p:'UIManager'},
    {h:'ノーツを流す',w:'Noteプレハブを作り、上から下へ等速で動かす。',d:'ノーツが流れる。',c:'ラインの下で消える。',t:'anchoredPositionを使う（ワールド座標ではない）。',m:20,p:'FallingObject'},
    {h:'テンポで出す',w:'BPMから間隔を計算し、4レーンのどれかに出す。',d:'規則的に出る。',c:'10秒で約20個。',t:'60/BPMの計算を間違えやすい。まず1拍1個で。',m:20,p:'SpawnManager'},
    {h:'叩いて判定',w:'D／F／J／Kをレーンに割り当て、距離で判定する。',d:'判定が出る。',c:'早すぎ・ちょうど・遅すぎを試す。',t:'GetKeyDownを使う（GetKeyだと連打になる）。',m:25,p:'RhythmJudge'},
    {h:'音を鳴らす',w:'叩いた瞬間と判定で音を変える。',d:'叩くと音が出る。',c:'レーンごとに音が違う。',t:'同時に鳴らすと割れる。音量を下げる。',m:20,p:'SoundManager'},
    {h:'コンボとスコア',w:'連続成功でコンボ、MISSでリセット。',d:'数字が伸びる。',c:'MISSで0に戻る。',t:'リセット条件を決めてから書く。',m:15,p:'ComboManager'},
    {h:'終わらせる',w:'60秒で終了。達成率と最大コンボを出す。',d:'結果が出る。',c:'時間で終わる。',t:'終了時にノーツ生成を止める。',m:15,p:'ResultManager'}
  ]
},
E19:{
  name:'迷路探索（見下ろし）', short:'見下ろしの迷路を歩いてアイテムを集める',
  juice:['popup','particles','flash','zoom'],
  scene:`SampleScene
├─ GameManager            [GameManager] [Timer] [ScoreManager]
├─ Main Camera            [CameraFollow]
├─ Maze                   [MazeBuilder]  2次元配列から生成
│  ├─ Wall_0 …            [BoxCollider2D]  Tag=Wall
│  ├─ Item_0 …            [CircleCollider2D IsTrigger]
│  └─ Exit                [BoxCollider2D IsTrigger]  Tag=Exit
├─ Player                 [GridMove] [CircleCollider2D]  Tag=Player
├─ Canvas
│  ├─ HUD (Timer / ItemCount)
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','GridMove','speed=4','移動'],
    ['Maze','MazeBuilder','map=2次元配列','生成'],
    ['Wall','BoxCollider2D','size=(1,1)','壁'],
    ['Item','CircleCollider2D','IsTrigger=ON','取得'],
    ['Exit','BoxCollider2D','初期は閉（色を暗く）','出口']
  ],
  flow:'MazeBuilder(配列) → GridMove → Item取得 → 取得数 → 3つでExit開放 → Result',
  tuning:[
    ['moveSpeed',4,'移動速度','探索のテンポ'],
    ['mazeSize',15,'迷路の大きさ（マス）','広さ'],
    ['itemCount',3,'必要なアイテム数','達成感'],
    ['gameTime',90,'制限時間','緊張感'],
    ['cameraZoom',6,'カメラの距離','見える範囲']
  ],
  mid:[
    {h:'迷路をつくる',w:'2次元配列（1=壁、0=通路）を用意し、forループで壁を配置する。',d:'迷路が表示される。',c:'通路が繋がっている。',t:'配列の行と列を逆にするとグチャッとします。',m:25,p:'MazeBuilder'},
    {h:'歩かせる',w:'上下左右キーで1マスずつ移動。壁には入れない。',d:'迷路を歩ける。',c:'壁にぶつかると止まる。',t:'当たり判定で止めるより、移動先が壁か配列で見る方が確実。',m:25,p:'PlayerMove'},
    {h:'カメラを追わせる',w:'プレイヤーを追い、迷路全体が見えすぎない距離にする。',d:'追いかける。',c:'迷路の全貌は見えない。',t:'引きすぎると迷路の意味がなくなります。',m:15,p:'CameraFollow'},
    {h:'アイテムを置く',w:'通路のランダムな位置に3つ置き、触れたら消して数を数える。',d:'集められる。',c:'3つ取ると数が3になる。',t:'壁の中に置かないよう、通路だけから選ぶ。',m:20,p:'ScoreManager'},
    {h:'出口を開ける',w:'3つ揃うまで出口は閉。揃ったら色と音で開いたことを示す。',d:'揃うと開く。',c:'2つでは開かない。',t:'開いたことが分からないと詰みます。音と光を必ず。',m:20,p:'CollisionJudge'},
    {h:'迷わせる',w:'行き止まりを増やし、敵を1体うろつかせる。',d:'迷う。',c:'敵に触れるとスタートに戻る。',t:'敵が速いと理不尽。遅く、経路を固定。',m:20,p:'SpawnManager'},
    {h:'終わらせる',w:'出口で成功、時間切れで失敗。',d:'結果が出る。',c:'両方確認。',t:'取得数を結果に出すと達成感が出ます。',m:15,p:'ResultManager'}
  ]
},
E20:{
  name:'3Dラン', short:'3レーンを走って障害物を避ける',
  juice:['trail','shake','squash','particles','slowmo'],
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer]
├─ Main Camera            [CameraFollow]  後方固定
├─ Player                 [LaneMove] [JumpAction] [Rigidbody] [CapsuleCollider]  Tag=Player
├─ Road                   [RoadScroller]  3レーン
├─ ObstacleRoot
├─ CoinRoot
├─ Directional Light
├─ Canvas
│  ├─ HUD (Score / Life / Timer)
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','LaneMove','laneX=-3/0/3, lerp=0.15','レーン移動'],
    ['Player','JumpAction','jump=8','ジャンプ'],
    ['Player','Rigidbody','useGravity=ON, FreezeRotation','物理'],
    ['Road','RoadScroller','speed=12, tile=20m','無限スクロール'],
    ['Obstacle','BoxCollider','IsTrigger=ON','接触'],
    ['Camera','CameraFollow','offset=(0,3,-7)','追従']
  ],
  flow:'Input → LaneMove → Jump → RoadScroller → Obstacle接触/Coin取得 → Score/Life → Result',
  tuning:[
    ['laneWidth',3,'レーン幅(m)','読みやすさ'],
    ['lerpSpeed',0.15,'レーン移動の速さ','操作感'],
    ['runSpeed',12,'前進速度','難易度'],
    ['jumpPower',8,'ジャンプ力','越えやすさ'],
    ['obstacleInterval',1.1,'障害物の間隔','密度'],
    ['maxLife',3,'残機','失敗の許容']
  ],
  mid:[
    {h:'道をつくる',w:'Cubeを細長く伸ばして3レーンの道を作り、ヒョウ柄のテクスチャを貼る。',d:'道ができる。',c:'3レーンが見分けられる。',t:'PlaneよりCubeの方がスケールを扱いやすい。',m:20,p:'StackObject'},
    {h:'レーンを移動する',w:'左右キーでレーン番号を±1し、X座標をLerpで移動。',d:'レーンを行き来できる。',c:'3レーンにピタッと止まる。',t:'transform.positionを直接書くとガタつきます。Lerpで。',m:25,p:'PlayerMove'},
    {h:'走らせる',w:'道とオブジェクトを手前へ流し、プレイヤーは前進させる。',d:'走っているように見える。',c:'背景が流れる。',t:'道を動かすか、プレイヤーを動かすか、最初に決める。混ぜると壊れます。',m:25,p:'RoadScroller'},
    {h:'跳ばせる',w:'ジャンプで障害物を越える。接地判定を入れる。',d:'跳べる。',c:'連続ジャンプできない。',t:'3DはRaycastの向きが下方向になるので注意。',m:20,p:'JumpAction'},
    {h:'障害物とコイン',w:'障害物をランダムなレーンに置き、コインは別レーンに。',d:'避けながら取る。',c:'ぶつかるとライフ減。',t:'障害物とコインが同じ位置に出ると取れません。',m:25,p:'SpawnManager'},
    {h:'スピードを上げる',w:'走行速度を徐々に上げる。',d:'後半速い。',c:'最初と最後で違う。',t:'速くしすぎると避けられません。上限を決める。',m:15,p:'DifficultyCurve'},
    {h:'終わらせる',w:'60秒で終了。距離とコインを結果に。',d:'結果が出る。',c:'時間で終わる。',t:'終了時にスクロールを止める。',m:15,p:'ResultManager'}
  ]
},
E21:{
  name:'クリック連打', short:'出てきた物を連打して割る',
  juice:['squash','particles','popup','comboscale','flash'],
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer]
├─ Main Camera
├─ SpawnArea              (出現位置の範囲)
├─ ItemRoot
├─ Canvas
│  ├─ HUD (Score / Timer / Life / Combo)
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Item','ClickTarget','hits=3','連打対象'],
    ['Item','CircleCollider2D','クリック判定','入力'],
    ['GameManager','SpawnManager','interval=1.2','出現'],
    ['GameManager','ComboManager','resetOnEscape=true','コンボ'],
    ['Canvas','UIManager','スコア更新','表示']
  ],
  flow:'Spawn → ClickTarget(連打) → 破壊 → 破片 → Score/Combo → 逃げられるとLife減',
  tuning:[
    ['hitsToBreak',3,'割るのに必要な回数','手応え'],
    ['spawnInterval',1.2,'出現間隔','忙しさ'],
    ['itemLife',2.0,'消えるまでの秒数','猶予'],
    ['comboWindow',0.8,'コンボ継続時間','気持ちよさ'],
    ['maxLife',5,'逃がせる数','失敗の許容']
  ],
  mid:[
    {h:'物を出す',w:'画面内のランダム位置にアイテムを生成する。',d:'アイテムが出る。',c:'一定間隔で出る。',t:'端に出すと押しにくい。余白を取る。',m:15,p:'SpawnManager'},
    {h:'クリックを受け取る',w:'アイテムにColliderを付け、OnMouseDownで回数を数える。',d:'押すと反応する。',c:'Consoleに回数が出る。',t:'UIの上にColliderがあると押せません。Canvasの上に置く。',m:20,p:'ClickTarget'},
    {h:'割る',w:'規定回数で破片を出して消す。スコア加算。',d:'割れる。',c:'3回で割れる。',t:'破片を消し忘れると溜まります。',m:20,p:'CollisionJudge'},
    {h:'逃がす',w:'一定時間で消えたらライフ−1。',d:'逃すと減る。',c:'放置すると減る。',t:'消える前に点滅させると親切。',m:15,p:'LifeManager'},
    {h:'コンボ',w:'連続で割ると倍率が上がる。時間を空けると戻る。',d:'気持ちいい。',c:'連続で割ると数字が伸びる。',t:'コンボの窓を厳しくしすぎない。',m:20,p:'ComboManager'},
    {h:'忙しくする',w:'出現間隔を短くし、硬いアイテムを混ぜる。',d:'後半忙しい。',c:'最初と最後で違う。',t:'硬すぎると手が痛いだけ。2〜4回まで。',m:15,p:'DifficultyCurve'},
    {h:'終わらせる',w:'45秒で終了。割った数と最大コンボを結果に。',d:'結果が出る。',c:'時間で終わる。',t:'終了時に生成を止める。',m:15,p:'ResultManager'}
  ]
},
E22:{
  name:'1人称ダンジョン探索', short:'1人称で歩いてアイテムを集める',
  juice:['flash','particles','zoom','slowmo'],
  scene:`SampleScene
├─ GameManager            [GameManager] [Timer] [ScoreManager]
├─ Player                 [FirstPersonMove] [CharacterController]
│  └─ Main Camera         [Camera]  目の高さ1.6m
├─ Dungeon
│  ├─ Floor / Wall_0 …    [BoxCollider]
│  ├─ Item_0 …            [SphereCollider IsTrigger]
│  └─ ExitDoor            [BoxCollider]  取得3つで開く
├─ Canvas
│  ├─ HUD (Timer / ItemCount / Guide)
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','FirstPersonMove','speed=3.5, 旋回=90度/秒','移動'],
    ['Player','CharacterController','height=1.7, radius=0.3','当たり'],
    ['Camera','Camera','localPos=(0,1.6,0)','視点'],
    ['Item','SphereCollider','IsTrigger=ON, radius=0.4','取得'],
    ['ExitDoor','BoxCollider','取得3つまで閉','扉'],
    ['Dungeon','Light','黄色いポイントライト','雰囲気']
  ],
  flow:'FirstPersonMove(W/S＋A/D旋回) → Item取得 → Count → 3つでExitDoor開放 → Result',
  tuning:[
    ['moveSpeed',3.5,'歩く速さ','探索のテンポ'],
    ['turnSpeed',90,'旋回速度(度/秒)','操作感'],
    ['gameTime',120,'制限時間','緊張感'],
    ['itemCount',3,'必要なアイテム数','達成感'],
    ['fogDensity',0.02,'霧の濃さ','見える距離']
  ],
  mid:[
    {h:'歩けるようにする',w:'CharacterControllerを付け、W/Sで前進後退、A/Dで旋回。',d:'1人称で歩ける。',c:'壁にぶつかると止まる。',t:'RigidbodyよりCharacterControllerの方が扱いやすい。',m:25,p:'FirstPersonMove'},
    {h:'ダンジョンを作る',w:'Cubeの壁と床を並べて部屋と通路を作る。',d:'歩ける空間ができる。',c:'迷わず歩ける。',t:'天井を忘れると外が見えて雰囲気が壊れます。',m:25,p:'StackObject'},
    {h:'ライトを置く',w:'黄色いポイントライトを数か所に置き、霧を薄くかける。',d:'薄暗い雰囲気になる。',c:'先が見えすぎない。',t:'真っ暗にすると歩けません。床が見える明るさに。',m:15,p:'SoundManager'},
    {h:'アイテムを置く',w:'通路に3つ置き、近づいて触れたら取得。',d:'拾える。',c:'取ると数が増える。',t:'Triggerには Player 側の Collider も必要。',m:20,p:'ScoreManager'},
    {h:'扉を開ける',w:'3つ揃うまで扉は閉。揃ったら音と光で開く。',d:'開いたことが分かる。',c:'2つでは開かない。',t:'開閉の状態を bool で持つ。',m:20,p:'CollisionJudge'},
    {h:'迷わせる',w:'行き止まりを作り、目印になるものを置く。',d:'迷うが戻れる。',c:'目印で方向が分かる。',t:'完全な迷路にすると授業では詰みます。目印必須。',m:20,p:'MazeBuilder'},
    {h:'終わらせる',w:'扉で成功、時間切れで失敗。',d:'結果が出る。',c:'両方確認。',t:'取得数を結果に出す。',m:15,p:'ResultManager'}
  ]
},
E23:{
  name:'3Dキャッチ', short:'3D空間で落ちてくる物を受け止める',
  juice:['landSquash','landDust','hitSpark','bloom','dmg','popup'],
  scene:`SampleScene
├─ GameManager            [GameManager] [ScoreManager] [LifeManager] [Timer]
├─ Main Camera            [CameraFollow] 斜め上から
├─ Directional Light      影を落とす（重要）
├─ Player                 [LaneMove] [BoxCollider]  Tag=Player
├─ Spawner                [SpawnManager] [RandomSpawner] [SpeedUp]
├─ ItemRoot               (落ちてくるCubeの親)
├─ Canvas
│  ├─ HUD (Score / Timer / Life / Target)
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','LaneMove','speed=8, X軸のみ','左右移動'],
    ['Player','BoxCollider','size=(1.2,2,1.2)','受け判定'],
    ['Item','Rigidbody','useGravity=true, mass=1','落下'],
    ['Item','BoxCollider','size=(0.8,0.8,0.8)','接触'],
    ['Spawner','SpawnManager','interval=0.95','生成'],
    ['Light','Light','shadows=Soft, intensity=1.1','影']
  ],
  flow:'Spawn(3D座標) → Rigidbody落下 → Player接触 → 種類判定 → Score/Life → HUD → Result',
  tuning:[
    ['moveSpeed',8,'左右の速さ','合わせやすさ'],
    ['fallSpeed',3.5,'落下の初速','判断の猶予'],
    ['spawnInterval',0.95,'出現間隔','密度'],
    ['spawnHeight',9,'出現する高さ(m)','落下時間'],
    ['laneWidth',2.2,'アイテムの散らばり','取りやすさ'],
    ['maxLife',3,'残機','失敗の許容']
  ],
  mid:[
    {h:'3Dの床とプレイヤーを置く',w:'Planeを床にし、Cubeをプレイヤーとして置く。カメラを斜め上後方に固定する。',d:'3D空間に床と自機が見える。',c:'影が落ちている。',t:'Directional LightのShadowsをSoftにしないと、落下地点が読めません。',m:20,p:'PlayerMove'},
    {h:'左右に動かす',w:'PlayerをX軸のみ移動させ、範囲をクランプする。',d:'左右に動く。',c:'床から落ちない。',t:'Zまで動かすと奥行きが分からなくなります。まずXだけ。',m:20,p:'PlayerMove'},
    {h:'物を落とす',w:'CubeのPrefabを作り、Rigidbodyで上から落とす。',d:'物が落ちて床で止まる。',c:'10個落として全部落ちる。',t:'Colliderを付け忘れると床をすり抜けます。',m:20,p:'FallingObject'},
    {h:'影で落下地点を示す',w:'落ちてくるアイテムの真下に半透明の円（ProjectorかQuad）を出す。',d:'どこに落ちるか分かる。',c:'影とアイテムの位置が一致する。',t:'3Dは奥行きのせいで位置が読みにくい。影は必須です。',m:20,p:'UIManager'},
    {h:'受け止める',w:'PlayerとItemの接触で種類を判定し、正解なら得点、不正解ならライフ減。',d:'受けると反応する。',c:'正解と不正解で音が違う。',t:'Item側にRigidbodyが要ります（どちらか一方でOK）。',m:25,p:'CollisionJudge'},
    {h:'だんだん速く',w:'落下速度と出現間隔を時間で変える。',d:'後半忙しい。',c:'開始10秒と50秒で違う。',t:'速くしすぎると影を見る余裕が消えます。',m:15,p:'SpeedUp'},
    {h:'終わらせる',w:'目標数で成功、ライフ0か時間切れで失敗。',d:'結果が出る。',c:'両方確認。',t:'終了時に生成を止める。',m:15,p:'ResultManager'}
  ]
},
E24:{
  name:'3D迷路', short:'3Dの迷路を歩いてアイテムを集める',
  juice:['popup','hitSpark','bloom','chase','countUp'],
  scene:`SampleScene
├─ GameManager            [GameManager] [Timer] [ScoreManager]
├─ Main Camera            [CameraFollow] 斜め上から
├─ Maze                   [MazeBuilder3D]  2次元配列からCubeを並べる
│  ├─ Wall_0 …            [BoxCollider]  Tag=Wall
│  ├─ Item_0 …            [SphereCollider IsTrigger]
│  └─ Exit                [BoxCollider]  Tag=Exit
├─ Player                 [GridMove3D]  Tag=Player
├─ Directional Light
├─ Canvas
│  ├─ HUD (Timer / ItemCount / Guide)
│  └─ ResultPanel         [ResultManager]
└─ Audio                  [SoundManager]`,
  comps:[
    ['Player','GridMove3D','speed=5, 前後左右','移動'],
    ['Maze','MazeBuilder3D','cell=2m, map=配列','生成'],
    ['Wall','BoxCollider','size=(2,2,2)','壁'],
    ['Item','SphereCollider','IsTrigger=ON','取得'],
    ['Camera','CameraFollow','offset=(0,12,-9), angle=55','見下ろし'],
    ['Exit','BoxCollider','3つまで閉','扉']
  ],
  flow:'MazeBuilder3D → GridMove3D → Item取得 → 3つでExit開放 → Result',
  tuning:[
    ['moveSpeed',5,'歩く速さ','探索のテンポ'],
    ['mazeSize',11,'迷路の大きさ（奇数）','広さ'],
    ['cellSize',2,'1マスの大きさ(m)','見やすさ'],
    ['itemCount',3,'必要なアイテム数','達成感'],
    ['gameTime',90,'制限時間','緊張感'],
    ['cameraHeight',12,'カメラの高さ','見渡しやすさ']
  ],
  mid:[
    {h:'迷路を3Dで組む',w:'2次元配列を読み、1の位置にCube（壁）を並べる。',d:'3Dの迷路ができる。',c:'上から見て通路が繋がっている。',t:'mazeSizeは奇数にしないと外周が崩れます。',m:25,p:'MazeBuilder3D'},
    {h:'歩かせる',w:'前後左右に移動させ、壁はColliderで止める。',d:'迷路を歩ける。',c:'壁をすり抜けない。',t:'移動が速いと壁を抜けます。速度を上げすぎない。',m:25,p:'PlayerMove'},
    {h:'カメラを斜め上に',w:'カメラを斜め上から追従させ、迷路の形が見える角度にする。',d:'見下ろしで歩ける。',c:'先の曲がり角が見える。',t:'真上にすると立体感が消え、低すぎると迷います。',m:20,p:'CameraFollow'},
    {h:'アイテムを置く',w:'通路のランダムな位置に3つ置き、触れたら取得。',d:'拾える。',c:'取ると数が増える。',t:'壁の中に置かないよう、配列で0のマスから選ぶ。',m:20,p:'ScoreManager'},
    {h:'出口を開ける',w:'3つ揃うまで扉は閉。揃ったら色と音で開く。',d:'開いたことが分かる。',c:'2つでは開かない。',t:'開閉の状態をboolで持つ。',m:20,p:'CollisionJudge'},
    {h:'迷わせる',w:'行き止まりを作り、目印（色の違う壁）を置く。',d:'迷うが戻れる。',c:'目印で方向が分かる。',t:'完全な迷路は授業では詰みます。目印必須。',m:20,p:'SpawnManager'},
    {h:'終わらせる',w:'出口で成功、時間切れで失敗。取得数を結果に。',d:'結果が出る。',c:'両方確認。',t:'終了時に操作を止める。',m:15,p:'ResultManager'}
  ]
}
};

PK.FIRST_STEP = {
  E01:{prefab:'PlayerMove', why:'左右キーでピコ太郎が動くところから始めます。当たり判定より先に、まず動かす。'},
  E03:{prefab:'PlayerMove', why:'受け皿が左右に動くところから始めます。動かないと、落ちてくる物を受けられません。'},
  E06:{prefab:'PlayerMove', why:'動く的（TargetMover）を1つ作るところから始めます。的が動けば、タイミングの練習ができます。'},
  E07:{prefab:'FallingObject', why:'ノーツが上から落ちて消えるところから始めます。判定は後回し。'},
  E08:{prefab:'PlayerMove', why:'プレイヤーが左右に動き、3つの籠の上に立てるところから始めます。'},
  E09:{prefab:'MatchJudge', why:'2択のボタンで○×が出るところから始めます。出題の見た目は後回し。'},
  E10:{prefab:'DragObject', why:'アイテムを1つ掴んで動かせるところから始めます。'},
  E11:{prefab:'StackObject', why:'台の上に1個だけ乗るところから始めます。積み上げは1段目が9割。'},
  E12:{prefab:'PlayerMove', why:'パドルが左右に動くところから始めます。ボールはその次。'},
E13:{prefab:'MatchJudge', why:'2択のボタンで○×が出るところから始めます。出題の見た目は後回し。'},
  E14:{prefab:'PlayerMove', why:'左右に走るところから始めます。ジャンプと足場はその次。'},
  E15:{prefab:'PlayerMove', why:'プレイヤーが動き、敵1体が追ってくるところから始めます。'},
  E16:{prefab:'PlayerMove', why:'自機が上下左右に動くところから始めます。弾は後回し。'},
  E17:{prefab:'PlayerMove', why:'自機が上下に動くところから始めます。地形は静止で置いてから流します。'},
  E18:{prefab:'FallingObject', why:'ノーツが上から落ちて消えるところから始めます。'},
  E19:{prefab:'PlayerMove', why:'1マスずつ歩けるところから始めます。迷路は後から差し替えられます。'},
  E20:{prefab:'PlayerMove', why:'3レーンの間を左右に動けるところから始めます。'},
  E21:{prefab:'MatchJudge', why:'クリックで1つ割れるところから始めます。'},
  E22:{prefab:'PlayerMove', why:'1人称で前進と旋回ができるところから始めます。'},
  E23:{prefab:'PlayerMove', why:'3D空間で左右に動けるところから始めます。影を出すのはその次。'},
  E24:{prefab:'PlayerMove', why:'3Dの床の上を前後左右に歩けるところから始めます。'}
};
