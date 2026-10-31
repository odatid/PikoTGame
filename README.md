# PK//PROTO — ピコ太郎ゲーム企画ツール

大学の授業「ゲーム制作演習」で使う **ピコ太郎版 ゲーム企画具体化ツール**。
現在は **v2（好きなゲームにピコ太郎を乗せる方式）** が本線です。

## 今回（2026-10-31 / 笑いの層を同梱した版）

先生から「**一発でこのクオリティを出したい**」と完成品（`gemini-code-1793417764130.html`・28,934バイト）と、
それを出したプロンプトが渡されました。1行ずつ読んで分けた結果、**品質の正体は3層**でした。

| 層 | 中身 | 前回まで | 今回 |
|---|---|---|---|
| ① 骨格 | 入力・ジャンプ・粒・拡縮・揺れ・画面遷移・ループ | **同梱済み**（完成品に逐語一致で入っていた） | 変更なし |
| ② 音 | ファミコン後期風BGM＋効果音 | **同梱済み**（※完成品の音は簡易版で、こちらのほうが上） | RESULTで止まらない欠陥を修正 |
| ③ **笑いの層** | 名札・汗・押し戻し(lerp)・観客・擬音と実況 | **無かった（＝これが原因）** | **参照コード3（9,469字）として同梱** |

つまり「あのクオリティが出ない」のは才能ではなく、**③を渡していなかったこと**でした。
笑いは分解できるので、①や②と同じく「貼るコード」として渡します。

### 更新するファイルは3つ

| パス | 変更 |
|---|---|
| `assets/v2/prompts.js` | `HUMOR_CODE`（9,469字）＋`HUMOR_SPEC`（1,375字）を追加、`promptWeb` に配線。`AUDIO_CODE` の停止欠陥を修正 |
| `assets/v2/genres.js` | `PK2.VERSION` を「笑いの層を同梱した版」に |
| `index.html` | `<summary id="verChip">` を同じ文字に |

`assets/v2/{plan,app}.js` と `style.css` は**今回変更なし**。

### 笑いの5部品（`HUMOR_CODE` の中身）

| # | 部品 | 実装 |
|---|---|---|
| ① | **固有名詞を書く** | `humorName(x,y,'名前')` — 迫る物・足場・トロフィーに名前を付けて書く |
| ② | **大げさな身体反応** | 汗は大粒の青（6〜13px）＋黒縁＋白ハイライト。**ジャンプでもかく**（物理ではなく感情） |
| ③ | **なめらかな押し戻し** | 目標値だけ動かし表示は lerp（`hWallX += (hWallTX-hWallX)*min(1,dt*10)`） |
| ④ | **見られている** | 観客シルエット24人＋サイリウム10本 |
| ⑤ | **音と文字を同じフレームで** | 擬音「ド ド ド」＋実況「どもどもー」 |

### 設計上、あえて参照元から変えた2点（理由つき）

1. **`HUMOR.wallKill` の既定を `false` にした。**
   参照元の壁は上限が無く 24px/秒で迫るため、押し戻しを1度も呼ばない企画では**開始4秒で理不尽に死にます**。
   既定では「画面の左12%かつプレイヤーの左手前110px」で止め、**飲まれたら負けにしない**。
   `true` にしたときだけ負けます（実測：`wallKill=false` で30秒回して `STATE=PLAY` のまま、
   `true` で `RESULT` になることを確認）。
2. **`drawGameObjects` を包まない。**
   `drawGameObjects` と `updateGame` は「あなたが書く2か所」です。ここを包むと、生成AIが同名の
   関数宣言を後ろに書いたとき**巻き上げで上書きされ、笑いの層が丸ごと消えます**。
   包むのは `update` / `drawBackground` / `renderPlayScreen` の3つだけにしました。
3. **文字は canvas に1回だけ焼いて `drawImage`。** 毎フレーム `fillText` は自前の重さ規則③違反。

### 直した音の欠陥（実測で見つけた）

`AUDIO_CODE` は `state` が `RESULT` になっても小節を予約し続け、しかも**効果音も BGM のバス経由**でした。
そのため「RESULT で音を確実に止める」という要件を満たしていませんでした。

- `audioPlay(on)` を追加（`ABus.gain` を 0.05秒でランプ、`ANextBar` を捨てる）
- `audioUpdate()` に `if(state !== 'PLAY'){ return; }`
- 効果音は `ASe`（`AB.destination` 直結）へ移した → BGMを止めても失敗音は鳴る

### 実測（実ブラウザで実行して数えた）

**新規 `tools/v2_humor_check.html`（CORE→AUDIO→HUMOR→PICO を貼る順に流し込んで実行）**

```
HUMOR_CHARS=9469  HUMOR_SPEC_CHARS=1375  WEB_TOTAL_CHARS=54792
WEB_CONTAINS_CORE=true AUDIO=true HUMOR=true PICO=true  WEB_HAS_HUMOR_SPEC=true
HUMOR_BACKTICKS=0  HUMOR_DOLLAR_BRACE=0   ← テンプレートの罠なし
HUMOR_WRAPS_drawGameObjects=false  HUMOR_WRAPS_updateGame=false   ← 2か所を奪わない
HUMOR_5PARTS_ALL=true  HUMOR_Math_random=0
SWEAT_AFTER_JUMP=2  SWEAT_AFTER_40CALLS=24（上限）  SWEAT_AFTER_0.66s=0
TARGET_AFTER_PUSH=80  DISPLAY_BEFORE_STEP=200.00  DISPLAY_AFTER_1FRAME=180.86
FRAMES_TO_CONVERGE=22  ← 1フレームで飛ばない＝lerpが効いている
STATE_AFTER_30s=PLAY  WALL_AFTER_30s=115.0px  NO_INSTANT_DEATH=true
WALLKILL_ON_STATE=RESULT（trueのときだけ負ける）
LABEL_AFTER_1.12s=0  TELOP_AFTER_1.12s=0.00
RENDER_TITLE=OK RENDER_PLAY=OK RENDER_RESULT=OK
RETRY_STATE=PLAY RETRY_TIMELEFT=30 RETRY_SCORE=0 RETRY_PLAYER_X=180
PASS=63 FAIL=0 JS_ERRORS=0 ALL_OK=true
```

**目視（`tools/humor_visual.html` を実際に描画して確認）**
黒い canvas の左端に赤い帯（幅の約13%）、キャラの頭の上に**青い汗10個**（黒縁＋白ハイライト）、
黄色い名札3枚（`★人気` / `「生放送だよ！全員集合」` / `大人気トロフィー`）、
上部中央に黄帯で `どもどもー`、床ぎわに観客のシルエットとサイリウム、左上に `SCORE 300 TIME 19`。
**コードが文章として画面に漏れている箇所はなし。**

**回帰（既存の検証も維持）**
`tools/v2_core_check.html` → `PASS=71 FAIL=0 JS_ERRORS=0 ALL_OK=true`
`tools/v2_audio_code_check.html` → `PASS=64 FAIL=0 JS_ERRORS=0 ALL_OK=true`
`tools/v2_duration_bgm_check.html` → `NO_STALE_60=true` / `PLAN_DURATION_VALUES={"30":22}` / `BGM_CODE_ALL=true`

**測り方の注意（今回も同じ罠を踏んだ）**：最初の実行は `FAIL=6` でしたが、**6件とも私の検証ツールの誤り**でした
（`update()` を1回も呼ばずに汗を数えた／30pxから押し戻して下限clampに当たった／名札の寿命1.0秒を0.66秒で判定／
押しっぱなしの札を離さずにリトライを試した／`player.x=180` なのに上限115pxを期待した）。
製品を直す前にツールを直し、再実行して `FAIL=0` を確認しています。

### この方式の限界（正直に書く）

確かめられるのは「同梱したコードが正しく動くこと」までです。
**生成AIが実際に貼ったかどうかは、私からは見えません。** 学生側・生成側の最終確認は先生の目視が必要です。

### 未push（先生のpushが必要）

`assets/v2/prompts.js` / `assets/v2/genres.js` / `index.html` / `README.md` の今回ぶんは**未push**です
（エージェントに `.git/config` が無いため push できません）。
push 後、チップが **「笑いの層を同梱した版」** になっていれば反映済みです。

---

| 版 | リポジトリ | 公開URL | 状態 |
|---|---|---|---|
| **v2（本線）** | `odatid/PikoTGame` | https://odatid.github.io/PikoTGame/ | 学生に配るURL |
| v1（旧版・保存） | `odatid/PikoProgen` | https://odatid.github.io/PikoProgen/ | そのまま残す（触らない） |

- 静的サイト・ビルドなし。main へ push すると 1〜2分で反映。
- v2 の公開物は **6ファイルだけ**（下記「公開用ファイル」）。v1 の `csv/`・`assets/js/`・`assets/css/` は **v2 では読まない**。
- v2 のフッターにある「旧版はこちら」は、旧リポジトリのURLへ直接リンクしている（新リポジトリに `v1.html` は置かない）。

---

## テスト依頼のルール（2026-10-30 追加）

**成果物を渡すときは、ZIPのリンクを直接出す。** 「このファイルにチェックを入れて」という指示はしない。

### 渡し方：`package.html`（配布パッケージページ）

**URL：https://odatid.github.io/PikoTGame/package.html**

開いて「ZIPをダウンロード」を押すと、`PikoTGame_シチュエーション版_20261030.zip` が保存される。
中身は**フォルダ構成のまま**（`index.html` と `assets/v2/*.js|css` の6つ）。
`tools/`・`csv/`・v1のファイルは入らない。

- ボタンを押す前に、6ファイルすべてを読めてZIPを組めるか**自己検証**している（`SELFTEST_*` を console に出す）
- ZIPは外部ライブラリを使わず自前で組む（`store` 方式＝無圧縮）。CDNが使えない場所でも動く
- ファイル名は `PK2.VERSION.tag` と `date` から作るので、**版が上がればファイル名も変わる**
- READMEも入れたいときはチェックボックスを1つ入れるだけ

### エージェント側の制約（重要）

エージェントのツールは**テキストしか書けず、ZIPバイナリを直接作れない**。
そのため「ZIPファイルそのもののリンク」は作れない。代わりに
**ブラウザでZIPを組み立てるページ（`package.html`）のリンク**を渡す。
これは実質ワンクリックで、チェック作業もファイル選択も要らない。

### 実測した検証結果（`tools` ではなく `package.html` 自身が出す）

```
SELFTEST_CRC32_VECTOR=CBF43926 EXPECT=CBF43926 OK=true   ← 規格の既知値と一致
SELFTEST_CRC32_EMPTY=0 EXPECT=0 OK=true
SELFTEST_FILES_OK=6/6
SELFTEST_TOTAL_BYTES=213669
SELFTEST_ZIP_BYTES=214349
SELFTEST_ZIP_ENTRIES=6
SELFTEST_ZIP_NAMES=index.html,assets/v2/genres.js,assets/v2/plan.js,assets/v2/prompts.js,assets/v2/app.js,assets/v2/style.css
SELFTEST_ZIP_SAME_ORDER=true
SELFTEST_ZIP_HAS_EOCD=true
SELFTEST_ZIP_OK=true
SELFTEST_STARTS_WITH_PK=true
SELFTEST_NAME=PikoTGame_シチュエーション版_20261030.zip
SELFTEST_READY=true
```

**限界（正直に書く）**：ZIPの構造・CRC32・EOCD・PK署名は検証済みだが、
実際にOSの解凍ツールで開いた確認はしていない（この環境にシェルが無いため）。
`store`（無圧縮）方式なので、形式どおりなら解凍できる。

### 古いやり方（もう使わない）

| ツール | 何が分かるか |
|---|---|
| `tools/deploy_diff.html` | 6ファイルのうち、どれが公開中と違うか（`UPDATE_LIST=` で一覧が出る） |
| `tools/live_paths_check.html` | そのパスが公開リポジトリに既にあるか（200 / 404） |
| `tools/cache_header_check.html` | 公開中のレスポンスヘッダー（キャッシュが残る設定か） |

これらは調査用として残すが、**受け渡しには使わない**。

---

## 版の刻印（最新かどうかの確認方法）

ツール上部・ヘッダーの黄色いチップに **「30秒とBGMを直した版」** と出ていれば最新です。
押すと今回の目玉5点が出ます（`assets/v2/genres.js` の `PK2.VERSION` が唯一の出どころ）。
**この表示だけで判断できるので、配布前にプッシュ差分を調べる必要はありません。**

現在の版：`2026-10-31 / 30秒とBGMを直した版`
- genre.time 60秒×22件 → **30秒×22件**（`buildPlan` の duration も `{"30":22}`・40秒超0件）
- 展開を **0〜5秒／5〜18秒／残り12・7・3秒** に組み直し（BPMは128→143→164→182のまま）
- 目標値（target）を60秒前提から半分に換算（例：30→15、20→10、1000→500）
- BGMと効果音を **参照コード2（7,199字）** として同梱。実ブラウザ実行で `PASS=64 FAIL=0 JS_ERRORS=0`
- BGMは「文章」から「貼るコード」に移した（位置 76.7% → **33.8%**、参照コードの直後）

### 直した原因：60秒はデータ側にあった（2026-10-31）

先生の指摘「ゲーム時間が60秒になっている。30秒か長くても40秒と指示したはず」は**事実**でした。

**原因（推測ではなく、値を数えた結果）**
`PK2.GENRES` の全22件が `time:60` でした（`genre.time=60秒 → 22件`）。
`buildPlan` は `plan.duration = genre.time` をそのまま使うので、
プロンプトに何と書いても 60秒が出ていました（`PLAN_DURATION_VALUES={"60":22}` `OVER_40=22`）。
同梱した参照コードにも `duration: 60` が入っていました（`CORE_duration_lines=["duration: 60"]`）。
つまり**指示ではなくデータが原因**で、文章をいくら直しても直りませんでした。

**BGMについて（消えてはいなかったが、私が壊していた）**
ファミコン後期風BGMの指示は12項目すべて存在していました（`BGM見出し=true` `パルス2本=true` `duty 25%=true` …）。
ただし**私が壊した点が1つ**ありました。同梱した参照コードには**音が1行も入っていない**のに
「これを貼れ」と言っていたため、「貼った骨格にBGMを足せ」という矛盾した二重指示になっていました。
位置も 76.7%（参照コード終了が 37.7%）と後ろで、読み飛ばされる位置でした。
そこで **音も `AUDIO_CODE`（7,199字）として同梱**し、参照コードの直後（33.8%）に置きました。

**この方式の限界（正直に書く）**
確かめられるのは「同梱したコードが正しく動くこと」までです。
生成AIが実際に貼ったかどうかは、私からは見えません。

### 方針転換：文章で指示するのをやめ、動くコードを同梱する（2026-10-31）

先生の指摘「スペースキーでジャンプできない」が2回続けて直らなかったため、原因を切り分けました。

**原因（推測ではなく、Geminiの修正指示から読み取った事実）**
Gemini の修正指示は `keys[' ']` / `spawnParticles()` / `parts` / `pt.on` / `renderPlayScreen()` という
**具体名**で書かれていました。つまり向こうは「名前の決まったコード」が来ないと動かせない。
こちらが送っていたのは「こう書いてください」という日本語の説明で、コードではなかった。
これが2回続けて外した理由です。

**やったこと（禁止事項を守ったまま）**
プロンプトの中に `CORE_CODE`（12,715字）を同梱しました。中身は入力・ジャンプ・粒・拡縮・揺れ・
ヒットストップ・数字ポップ・画面遷移・ループが**全部つながった完成コード**です。
生成側（Gemini）が書くのは `updateGame(dt)` と `drawGameObjects()` の2か所だけになります。
- 乱数は使っていません（粒の散らばりは黄金角 `made * 2.399963`）。同じ入力なら同じ出力です。
- 生成AIのAPIは使っていません。プロンプト文字列を組み立てるだけです。
- 外部ライブラリ・CDN・画像ファイルは使いません（Canvas 2D の図形のみ）。

**この方式の限界（正直に書く）**
私が確かめられるのは「同梱したコードが正しく動くこと」までです。
Gemini が実際にそれを貼ったかどうかは、私からは見えません。
ですから学生側・生成側の最終確認は、これまでどおり先生の目視が必要です。

#### 実測：`tools/v2_core_check.html`（実ブラウザで実行して数えた）

このページは、プロンプトから `CORE_CODE` と `PICO_DRAW_SRC` を**取り出してそのまま実行**します。
つまり「生成AIが貼ったときと同じコード」が動きます。判定は文章ではなく実行結果です。

```
=== 1. 骨格がプロンプトに入っているか ===
CORE_CODE_CHARS=12715   WEB_CONTAINS_CORE=true   WEB_CONTAINS_PICO=true
CORE_BACKTICKS=0   CORE_DOLLAR_BRACE=0   CORE_HAS_UNDEFINED=false   PROMPT_HAS_UNDEFINED=false
（バックティック0件＝テンプレートリテラルが壊れない。過去2回踏んだ罠を作らない）

=== 2. 名前が揃っているか ===
registerInput / tryJump / startGame / endGame / squash / updateSquash /
spawnParticles / updateParticles / drawParticles / countParticles / parts / pt.on /
MAX_PARTS / renderPlayScreen / updateGame / drawGameObjects / jumpLatch / keys /
onGround / hitstop / shake / popups  → 22/22 true

=== 4〜7. スペースキー ===
T0_STATE=TITLE
AFTER_SPACE_STATE=PLAY        ← TITLE から1回で PLAY に入る
AFTER_SPACE_VY=-720           ← 上向きの初速が入っている
AFTER_SPACE_ONGROUND=false
AFTER_SPACE_LATCH=true
AFTER_SPACE_SX=0.82 / SY=1.22 ← 離陸の伸びが同時に立つ
AFTER_SPACE_PARTS=6           ← 粒が6個、同時に発生
REPEAT_KEYDOWN_PARTS=6        ← 押しっぱなしで増えない
AIR_RETRY_PARTS=6             ← 空中で押し直しても跳ばない
LAND_ONGROUND=true            ← 着地で戻る
LAND_SY=0.76                  ← 着地の潰れ
LAND_PARTS=16                 ← 着地で+10
SECOND_JUMP_VY=-720          ← 2回目も跳べる
JUMP_CALLS_PER_KEYDOWN=1     ← イベント二重登録なし（2なら重くなる原因）
RETRY_STATE=PLAY RETRY_TIMELEFT=60  ← RESULT からスペースで再開

=== 10〜15. 演出と重さ ===
JUICE_OFF_PARTS=0 / JUICE_ON_PARTS=6   ← TUNING.juice で完全に消える
PARTS_AFTER_0.66s=0                    ← 0.30秒で消える
RENDER_TITLE=OK RENDER_PLAY=OK RENDER_RESULT=OK
SQUASH_AFTER_30X=1.28/0.76             ← 連打しても積もらない（clamp が効く）
RAF_CALLS_IN_SRC=2                     ← 起動1＋ループ1（増殖しない）
SRC_shadowBlur=0 SRC_ctx_filter=0      ← 重くする6つのうち2つは不使用
SRC_canvas_width_assign=1              ← 初期化の1回だけ

=== 16. まとめ ===
PASS=71 FAIL=0 JS_ERRORS=0 ALL_OK=true
```

**測り方の注意（前回の反省）**：最初の実行では FAIL=4 でしたが、4件とも**私の検証ツールの誤り**でした
（hitstop を残したまま時間切れを判定／空中でキーを押していた／コメント中の語を数えていた）。
製品を直す前にツールを直し、再実行して `FAIL=0` を確認しています。

#### 実測：`tools/v2_core_check.html` の目視（スクリーンショット）

黒い canvas に、角刈りの頭・黒縁眼鏡・口髭・黄色に黒い斑点の服・白い足2つのキャラが床の上に描かれ、
左上に `SCORE 0  TIME 59`、下部に `スペースで ジャンプ／はじめる` が出ている。
**コードが文章として画面に漏れている箇所はなし**（バックティック0件の確認と一致）。

#### 実測：プロンプトの内訳 `tools/prompt_breakdown_check.html`

```
WEB_TOTAL_CHARS=36632  WEB_LINES=1020
   12715字  34.7%  ★参照コード（CORE_CODE）
    4845字  13.2%  drawPico のソース（PICO_DRAW_SRC）
    2046字   5.6%  BGM仕様（NES_BGM）
    1525字   4.2%  キャラ仕様の数値表
    1419字   3.9%  エフェクトの確認（EFFECT_CHECK）
    1296字   3.5%  重くする書き方6つ（PERF_HARD）
    1038字   2.8%  拡縮の数値表（JUICE_SCALE）
     913字   2.5%  入力キー（INPUT_SPEC）
     834字   2.3%  クネクネ仕様（WIGGLE_SPEC）
MUST_COUNT(必ず)=32  FORBID_COUNT(禁止/しない)=51  MUST_PER_1000CHARS=0.87

位置（前は 47〜85% 地点に埋もれていた）
  スペースキーの判定   7.6%地点  ← 参照コードの前倒しで、47% から大きく前へ
  粒の発生            17.2%地点
  クネクネ            25.1%地点
  拡縮の数値表         51.2%地点
  重さの6項目          58.2%地点
```

**「必ず」は32回**（前回31回）。同梱したコードのぶん総量が増えたのに、命令の密度はほぼ変えていません。
二重記述（入力の9項目を文章でも全部書く／演出を文章でも全部書く／クネクネの式を文章でも書く）を
**参照に置き換えて削り**、水増しを相殺しました。

#### 回帰（既存の検証も維持）

`tools/v2_nes_check.html`：`ALL_OK=true` / `JS_ERRORS=0` / `VERSION_TAG=動く骨格を同梱した版` /
`CHIP_MATCHES=true` / `POINTS=5` / `BGM_ALL_6=true` / `GENRES_OK=22/22` /
`P1_NO_FILTER〜P6_RESTORE_CTX=true` / `WEB_OVER_40K=false`

`tools/v2_input_juice_check.html`（判定を参照コード側に付け替えて再実行）：
`CORE_HAS_SPACE_KEYNAME=true` / `CORE_HAS_PREVENTDEFAULT=true` / `CORE_HAS_KEYUP=true` /
`CORE_HAS_POINTER_ALT=true` / `CORE_HAS_TRYJUMP=true` / `CORE_HAS_JUMPLATCH=true` /
`CORE_HAS_INPUT_READY=true` / `WEB_CONTAINS_CORE=true` / `SPACE_MENTIONS=10`（前回0） /
`CORE_HAS_PARTS_POOL=true` / `CORE_HAS_LIGHTER=true` / `CORE_HAS_RESTORE=true` /
`HAS_UNDEFINED=false` / `HAS_NAN=false` / `SAME_OUTPUT=true`

### 2026-10-31 に直した4症状（前回ぶん・すべて実測にもとづく）

| 症状（先生の指摘） | 実測した原因 | 直し方 |
|---|---|---|
| スペースキーでジャンプできない | **`prompts.js` 全体に「スペース」が0件**。キー名の指定がどこにも無かった | `INPUT_SPEC` を追加（`e.key===' '`／`e.code==='Space'`／`preventDefault`／`keyup`／タッチ代替）。2.4%地点 |
| エフェクトが消えた | 「入れる」とは書いてあるが、**出ているかを確かめる手順が無かった** | `EFFECT_CHECK`（粒・数字・揺れ・止め・白飛びの5つを口に出して数える）を追加 |
| 拡縮のジューシーが無い | 倍率は書いてあったが**秒数とイージングと原点が弱く、旧数値と二重**になり得た | `JUICE_SCALE` に9行の数値表（sx/sy/戻す秒数/意味）＋`1-(1-t)^3`＋clamp 0.75〜1.30 |
| 手足は不要かも | 手足で 209命令。落とすと **137命令（34%減）** | `drawPico` から腕・脚を削除。`H=3.05→2.50`、足は白い箱2つだけ |
| WEB版が重い | **キャラは無実**（3分割でも0.0817ms＝予算16.67msの0.5%） | `PERF_HARD` で重くする6つを名指しで禁止＋FPS計測コード |

**重さについての結論（数字で）**：ピコ太郎を3分割で描いても 0.0817ms／フレーム。
60fpsの予算16.67msに対して **0.5%**。つまり「キャラの絵が重い」は誤りで、
重くしているのは `shadowBlur`・`ctx.filter`・毎フレームの `fillText`・
`canvas.width` の再設定・ループ内 `new`・`requestAnimationFrame` の増殖の6つ。

### 版名はHTMLに直接書く（JSで書き換えない）

**2026-10-30 に実際に起きた誤解**：push は成功していたのに、画面のチップが「v2」のままで
「最新になっていない」と判断された。原因はキャッシュで、実測は次のとおり。

```
HDR index.html           cache-control="max-age=600"
HDR assets/v2/app.js     cache-control="max-age=600"
HDR assets/v2/genres.js  cache-control="max-age=600"
HDR assets/v2/style.css  cache-control="max-age=600"
```

`?v=20261030` を付けても効くのは**HTMLだけ**。`assets/v2/*.js` は同じURLのままなので、
ブラウザは10分間キャッシュした古い `app.js` を使い続ける。
古い `app.js` には `renderVersion()` が無いため、チップは静的HTMLの「v2」で止まる。

対策として `index.html` の `<summary id="verChip">` に **版名を直接書いた**。
これで HTML が新しければ必ず新しい版名が出る。JSが読めたときは `renderVersion()` が
`PK2.VERSION.tag` で上書きする（同じ値なので見た目は変わらない）。

**注意：`?v=` をアセットURLに付けてはいけない。** この開発環境のプレビューは
クエリ付きパスを 400 / `application/json` で返すため、CSSとJSが読めなくなり
レイアウトが崩れる（実測）。GitHub Pages では通るが、検証できなくなるので使わない。

版を上げるときは、次の2か所を同じ値にする。
1. `assets/v2/genres.js` の `PK2.VERSION.tag` / `date`
2. `index.html` の `<summary id="verChip">` の文字

---

## シチュエーション版で入った仕様

### 1. シチュエーション（タイトル画面の「どういう状況か」）
ピコ太郎の立場を `PK2.PICO_STANCE`（活動・希望・恐れ・ありたい）として固定し、
そこから作った12本のネタを `PK2.SITUATIONS` に持つ。`plan.js` の `SITU_FIT`（ジャンル→3候補）と
`stableHash`（文字コード合計）で**決定的に1本選ぶ**。乱数は使わない。
出力6種すべてに `situBlock()` で入り、タイトル画面の3行（タイトル／状況／目的）を指定する。
状況は文章ではなく「物」で見せ、その物に名前を書く（例：下から迫る赤い床に「迫るライバルの人気」）。

### 2. 味付け（16項目 → 3区分）
`PK2.TWISTS` を、要望の16項目に合わせて3区分にした（重複定義もしていたので整理済み）。
- `always:true` 3件＝障害物が増え続ける／最後に加速する／高得点ほど小さい的（**画面に出さない**）
- 選べる8件＝足場が消える／立場が逆／動く障害物／敵か自分が分裂する／シューティング要素を足す／読めない要素が1つ／ダメージに対して回復（挽回）要素を足す／偽物を混ぜて惑わせる
- `hidden:true` 8件＝連鎖で跳ねる／積み上がる／順番がある／見せてから出す／3段階の判定 ほか既存の3件（参照破壊を避けて残置）

結果画面は `PK2.TWIST_PICK` だけを出し、先頭に「おすすめ」を明示する。
古い保存データがデフォルト3つを指していても、`buildPlan` が選べる物へ戻す（計測済み）。

### 3. 展開（Startはふつう → 不条理 → 最後に加速）
`PK2.plan.PHASES` の6段階。速度とBPMを**同じタイミングで**上げる。

| 時間 | 段階 | 速さ | BGM | 同時出現 |
|---|---|---|---|---|
| 0〜8秒 | START（ふつう） | ×1.00 | 128 | 1 |
| 8秒 | 予告（気配だけ） | ×1.00 | 128 | 増やさない |
| 8〜40秒 | 不条理が出る | ×1.05 | 128 | 1 |
| 残り20秒 | 加速1段目 | ×1.12 | 143 | 2 |
| 残り10秒 | ラッシュ2段目 | ×1.28 | 164 | 3 |
| 残り5秒 | 最後3段目 | ×1.42 | 182 | 4 |

難易度の目標は「慣れた人が10回に4〜5回、初見が10回に1回」。速くするのは速度と数だけで、操作は増やさない。

### 4. ピコ太郎は四角（矩形）だけで描く

**2026-10-30 に起きた不具合と原因（実測）**：デザインを曲線にした版から、
「ジャンプしない・クネクネしない・重い・エフェクトが消えた」が同時に起きた。
原因は3つで、実測して切り分けた。

| 実測したもの | 曲線版 | 四角版 | 何が起きたか |
|---|---|---|---|
| `drawPico` のソース量 | 11,495字（プロンプトの**45.3%**） | 6,052字（30.0%） | コードが巨大で指示を押し出した |
| 描画命令数（1体） | 508 | **209** | 1フレームの描画予算を食う |
| 実描画時間（HEAD=34px） | 0.116ms/回 | **0.0613ms/回** | 3分割で0.35→0.18ms |
| ジャンプ指示の位置 | **79.8%地点（518行目）** | **47.4%地点（266行目）** | 後ろすぎて生成側が落とした |
| クネクネ指示の位置 | **85.1%地点** | **44.3%地点** | 同上 |

**つまり「重い」と「動きが消えた」は同じ原因。** キャラを曲線で凝ったらコードが膨れ、
プロンプトの45%をキャラが占め、ジャンプ・クネクネ・粒の指示が最後尾へ追いやられて、
生成AIがそこまで読まずに「キャラだけ描いた動かないゲーム」を出していた。
（`drawPico` 自体は 0.116ms と軽く、描画そのものが重さの原因ではなかった。
　重かったのは**指示の順序**と、生成側が曲線を毎フレーム描き直していたこと。）

**対策（3つ）**
1. `drawPico` を四角（矩形）だけに戻した。曲線版は `drawPicoCurved` として記録用に退避（プロンプトには出さない）
2. **キャラの描画コードをプロンプトの最後に移した。** 動き（クネクネ）・演出（粒）・音を前半に置いた
3. 「形の決まり：四角だけで描く」を独立した見出しにして、理由（命令数）まで書いた

**変えてはいけない記号**（四角でも「ピコ太郎に見える」根拠）
- 髪：てっぺんが平らな箱（角刈りパンチ）＋上端に刻み3つ
- 眼鏡：黒縁の横長。**枠を4本の矩形で描き、中は半透明**（黒く塗ると目が消える）
- 掛け方：レンズ下端を鼻の先にそろえる（鼻にちょいがけ）
- 口髭：横一文字＋端を少し垂らす。顎髭なし
- 服：黄色地に黒い四角の斑点（ヒョウ柄）
- 目は全ポーズで細い横線のまま。口だけ開く

ポーズは12種のまま（`idle/run/jump/land/hit/success/fail/dance/cheer/slip/peek/dizzy`）。
手足は「回転させた矩形1本」で描くので、ポーズを変えても命令数が増えない（全ポーズ209で一定）。

### 5. ファミコン後期BGM（`NES_BGM` / `NES_BGM_CORE`）＝**必須**
**「晩年のファミコン風（ロックマン／忍者龍剣伝／カービィ系）」をマストにした。**
前期ファミコン（メロディ1本＋ベース）で済ませると、1分のゲームが安っぽく聞こえるため。
音源ファイルは使わず Web Audio で合成。8小節ループ・Am・BPM128。
後期に聞こえるための5要素を、文章でなく数値で固定した。

| # | 要素 | 数値 |
|---|---|---|
| ① | パルス2本 | 旋律 duty 25% / アルペジオ duty 12.5%（16分で和音を刻む） |
| ② | 三角ベース | 8分刻み。A2→A3 とオクターブを跳ばす |
| ③ | ノイズのドラム | キック(lowpass180Hz)・スネア(bandpass1800Hz)・ハット(highpass6000Hz)。**4つ打ち禁止** |
| ④ | エコー | 1/8音符ディレイを1本だけ（フィードバック無し）。旋律のみ |
| ⑤ | ビブラート | 5.5Hz・±12セント。伸ばす音だけ |

- 音量：master 0.22 / 旋律 0.16 / アルペジオ 0.09 / ベース 0.13 / ドラム 0.07（SEが埋もれない）
- 既存の phone 対策（200Hz以下が出ない→ベースに第3倍音、キックに900Hzクリック）は**維持**
- 加速はBPM143→164→182。上げるときは**音符を増やさず刻みを細かくする**（音数を増やすと速く聞こえない）
- 4音の動機（Pen=A4／Apple=C5／Pineapple=E5／締め=A4）は変えない。後期らしさは装飾で出す

**配線先は6出力すべて。** `promptPlan` は要約版（`NES_BGM_CORE`）、
`promptWeb`/`promptUnity` は完成仕様（`NES_BGM`）、`promptImage` は音の前提、
`promptAssets` は制作時に守る事項、`promptProposal` は「ウリ」として1文。
Unity は後期ファミコンの本質が「チャンネルが5本ある」ことなので、
AudioSource を BgmCh1/Ch2/BgmBass/BgmDrums の4本に分け、Ch1に AudioEchoFilter を付ける形にした。

### 6. 重くしない（`PERF_RULE`）＝エフェクトは全部入れるが軽く保つ
演出は削らない。代わりに**書き方**を5つに固定した。

1. 配列を毎フレーム作らない（`parts.filter(...)` を update 内に書かない）→ 固定長プールで空き枠再利用
2. 上限を数値で決める（`TUNING.limits = { parts:30, popups:6, trail:3, sparks:6 }`）
3. ループの外で決まる値は外で1回だけ計算（`Math.sin` を粒1個ごとに呼ばない）
4. アニメーションループは1本だけ（requestAnimationFrame を複数立てない／setInterval 併用しない）
5. `ctx.save()` したら必ず `restore()`。`globalCompositeOperation`/`globalAlpha` を必ず戻す

出力側の具体化：
- WEB：`parts = new Array(32)` / `popups = new Array(6)` の固定長。ノイズBufferは1回だけ生成、`DelayNode` は1つだけ、`OscillatorNode` は必ず `stop()`
- Unity：`Instantiate`/`Destroy` を毎回呼ばず `SetActive` でプール。ParticleSystem は1つ、`Max Particles = 30`。`Update` 内で `GetComponent` を呼ばない
- アセットシート：エフェクトのマスは「1マス＝1種類」。粒を何十個も描き込まない（描き込んだ粒は実装で動かせず、重いだけの飾りになる）
- 合格の目安：粒が30個出ている瞬間に60fps付近を保てること。落ちたら②の上限を下げる（①〜⑤は変えない）

### 7. まとめてコピーを削除
出力画面の「6種類をまとめてコピー」を削除（検証で `COPYALL_BUTTON=false` を確認）。タブは6つのまま。

---

## 検証（実測値）

### 今回（入力と手足の版）— 4症状の検証 `tools/v2_input_juice_check.html`

```
=== 1. スペースキー ===
WEB_HAS_SPACE_KEYNAME=true  WEB_HAS_PREVENTDEFAULT=true  WEB_HAS_KEYUP=true
WEB_HAS_TOUCH_ALT=true      WEB_HAS_ONSCREEN_HINT=true
SPACE_MENTIONS=5（前回 0 ← キー指定が存在しなかった）

=== 2. 拡縮 ===
WEB_HAS_SCALE_TABLE=true  WEB_HAS_LAND_128=true  WEB_HAS_LAND_076=true
WEB_HAS_EASING=true  WEB_HAS_CLAMP=true  WEB_HAS_FOOT_ORIGIN=true
CONFLICT_OLD_LAND_12=false  CONFLICT_OLD_JUMP_085=false（数値の二重が無い）

=== 3. エフェクト ===
WEB_HAS_EFFECT_CHECK=true  EFFECT_ITEMS=5  WEB_HAS_5COUNT=true  WEB_HAS_JUICE_SWITCH=true

=== 4. 重さ ===
WEB_HAS_PERF_HARD=true  WEB_HAS_FPS_METER=true
shadowBlur=3  ctx.filter=2  fillText=2  devicePixelRatio=2  new Array=3  requestAnimationFrame=2

=== 5. 手足 ===
SPEC_SAYS_NO_LIMBS=true  PROMPT_SAYS_NO_LIMBS=true
手足を描く旧指示 6パターンすべて false（残っていない）
DRAW_SRC_HAS_SEG=false  DRAW_SRC_HAS_LIMB=false  DRAW_SRC_CHARS=4845（21.0%）

=== 6. 位置 ===
WEB_CHARS=23098（前回 18966 → +4132字）  WEB_LINES=620
  スペースキーの判定  2.4%地点
  拡縮の数値表        23.7%地点
  重さの6項目        34.7%地点
  エフェクトの確認    40.3%地点
  クネクネの実装      55.3%地点

=== 7. 健全性 ===
HAS_UNDEFINED=false  HAS_NAN=false  SAME_OUTPUT=true  （JS_ERRORS=0）
PLAN=5607 IMAGE=3794 ASSETS=3100 WEB=23098 UNITY=11127 PROPOSAL=2437
```

### 今回 — 描画コスト `tools/pico_cost_check.html`

```
手足あり（前回）  idle/run/jump/land/success/dance = すべて 209 命令
手足なし（今回）  idle/run/jump/land/success/dance = すべて 137 命令  ← 34%減
                  3SPLIT_OPS=411
```

**実時間は実行ごとにぶれる（正直に書く）。** 同じページを5回測って、
1体3分割は **0.087〜0.135ms** の範囲で動いた（60fps予算16.67msの0.5〜0.8%）。
回を追うごとに 0.1261 → 0.0868 と変わるので、**1回の測定値を根拠にしない**。
**命令数（209→137）は毎回まったく同じ**なので、こちらを判断の根拠にする。

### 重さの切り分け `tools/perf_check.html`（新規）

キャラを3分割で描いても 0.08ms前後（予算16.67msの0.5%）。
つまり「キャラの絵」は重さの原因ではない。原因は `shadowBlur`・`ctx.filter`・
毎フレームの `fillText`・`canvas.width` の再設定・ループ内 `new`・`rAF` の増殖。
**この測定器の限界**：ヘッドレス環境では合成（GPU）が効くため、`shadowBlur` などの
実コストが実機より小さく出る（実測で dpr=3 が dpr=1 より速い 0.72倍という
あり得ない値が出た）。したがって「どの命令が重いか」の順位づけには使えるが、
絶対値（ms）は実機の保証にならない。実機の判断は `TUNING.fps` の表示で行う。

### 実描画の確認 `tools/pico_draw_check.html`（スクリーンショット目視）

```
13ポーズすべて：角刈り・黒縁眼鏡（レンズ越しに目）・口髭・ヒョウ柄・白い足2つ
手足（腕・脚・手）の描画：0（全ポーズ）
接地：足の底が足元原点にそろう（浮き・沈みなし）
```

### 回帰（既存の検証も維持）

`tools/v2_nes_check.html`：`ALL_OK=true` / `GENRES_OK=22/22` / `BGM_ALL_6=true` /
`P1_NO_FILTER〜P6_RESTORE_CTX=true` / `JS_ERRORS=0` /
`VERSION_TAG=入力と手足の版 POINTS=5 CHIP_MATCHES=true`

`tools/v2_check.html`：`combos=176 bad=0 emptyFields=0` / `GENRES=22 HOOKS=8 TWISTS=19` /
`GENRE_TWIST_BAD=0` / `same_output=true` / `TABS=6`
（web 20,152→23,098字。4仕様を足したぶん増えた）

`tools/v2_situation_check.html`：`SITU_ALL_OUTPUT_OK=true` / `SITU_USED_ALL=12/12` /
`PHASES=6 START_NORMAL=true SPEED_ASCENDS=true BPM_ASCENDS=true` /
`WEB_HAS_3SPLIT=true WEB_WIGGLE_USES_BPM=true` / `BAD_TOKENS=0` / `JS_ERRORS=0 OK`

### 前回（晩年ファミコン版）の実測値

- `TOTAL=19 ALWAYS=3 PICK=8 HIDDEN=8` / `ALWAYS_MISSING=0 PICK_MISSING=0 HIDDEN_LEAKED=0`
- `RESULT_CHIPS=8 MATCH_PICK=true DEFAULT_SHOWN=0 RECOMMEND_MARKS=1`
- `OLD_TW_DENSE→tw_shrink IS_PICK=true` / `OLD_TW_CHAIN→tw_shrink IS_PICK=true`
- `STANCE=4/4 SITU_DB=12 SITU_EMPTY=0/22 BAD_TOKEN=0`
- `SITU_MISSING_IN_OUTPUT={"plan":0,"image":0,"assets":0,"web":0,"unity":0,"proposal":0}`
- `SITU_USED_ALL=12/12 SITU_UNUSED=0`（s_boss:4 まで到達）

---

## 今回の受け渡し（2026-10-31 / 動く骨格を同梱した版）

### 更新するファイルは3つ（`tools/size_check.html` で実測したバイト数）

| パス | 変更 | 前 → 後 |
|---|---|---|
| `assets/v2/prompts.js` | `CORE_CODE`（参照コード12,715字）の追加、`INPUT_SPEC`/`EFFECT_CHECK`/ジュース/クネクネを参照形式へ | 115,686 → **128,683** B |
| `assets/v2/genres.js` | `PK2.VERSION` の版名と目玉5点 | 48,436 → **48,642** B |
| `index.html` | `<summary id="verChip">` の静的文字 | 3,329 → **3,338** B |

`assets/v2/{plan,app}.js` と `assets/v2/style.css` は**今回変更なし**（`更新不要`）。
`tools/` は公開物ではないので push しなくてよい（`v2_core_check.html` を追加、`prompt_breakdown_check.html`・
`v2_input_juice_check.html` の判定を参照コード側へ付け替え）。

実測の合計：`TOTAL_BYTES=264125` / 6ファイル / 全ファイル `tabs=0`

### ダウンロードする場所

**① 配布パッケージページ（6ファイルだけのZIP）**

https://odatid.github.io/PikoTGame/package.html

- ページを開く → 中央の黄色い大きなボタン**「ZIPをダウンロード」**を押す
- 保存される名前：`PikoTGame_動く骨格を同梱した版_20261031.zip`（ファイル名は `PK2.VERSION` から作るので版が上がれば変わる）
- **ただしこのページはまだリポジトリに入っていません。** 実測で `HTTP 404` でした。
  使うには `package.html` を `PikoTGame` に push する必要があります。

**② リポジトリを丸ごとZIP（今すぐ落とせる・確認済み）**

https://codeload.github.com/odatid/PikoTGame/zip/refs/heads/main

- 開くとそのまま `PikoTGame-main.zip`（321,526バイト）が落ちます。認証不要です。
- **中身はリポジトリ全部**です（`tools/`・`csv/`・v1の控えも入る）。
  **学生に配るのは①の6ファイルだけ**にしてください。

### 未push（先生のpushが必要）

| ファイル | 状態 |
|---|---|
| `assets/v2/prompts.js` / `genres.js` / `index.html` | **今回の変更ぶんが未push**（公開中は旧版のまま） |
| `package.html` | **未push**（実測 `HTTP 404`） |
| `README.md` | この追記ぶんが未push |

**先生の push が必要です**（エージェントに `.git/config` が無いため push できません）。
push 後、`https://odatid.github.io/PikoTGame/` を **Ctrl+Shift+R**（Mac は Cmd+Shift+R）で
再読み込みし、チップが **「動く骨格を同梱した版」** になっていれば反映済みです。

---


## 0. v2 が解こうとしている問題

学生は「ピコ太郎を理解し、行動指標をゲームに落とす」という**コンセプトワークで疲れて手が止まる**。
しかも何かを作ろうという意思が薄い層で、やる気のある学生はすでに Unity で着手している。

そこで **順番を逆にする**。

1. 自分が好きなジャンルを選ぶ（1分で面白いと分かる型だけ）
2. そこにピコ太郎を **1か所だけ** 乗せる
3. 先に「面白そう」なプロトに着地する
4. 企画コンセプトは **後付け** で自動的に付いてくる

「自分が好きなゲームにピコ太郎が乗ってたら面白そう」「他人からも面白いねと言われそう」を最短で作るのが目的です。

---

## 1. 設計思想（変更禁止）

1. **生成AIのAPIは使わない。** 出力は「DBの文章セル＋ID参照」から決定的に組み立てる。乱数なし。同じ入力＝同じ出力。
2. 学生はWebアプリだけを使う。DB（CSV）を触るのは教員だけ。
3. 出力プロトコルに「ジャンル・操作・勝敗条件を変えるな」の拘束文（`LOCK`）を必ず入れる。
4. 1プレイ3分以内、操作1〜2種類。超える案は出さない（超過時は警告を出す）。
5. Unity初心者が15分で着手できる粒度で書く。
6. RPG・シミュレーションは**ジャンル候補から外す**（1分で面白さが伝わらないため）。

## 2. 触ってはいけないもの（IP・権利）

- ピコ太郎の公式素材、実在の人物の顔、既存ロゴは使わない。
- 見た目の固定仕様：角刈りパンチパーマ／鼻にちょいがけの黒縁眼鏡（サングラスではない）／口髭／黄色×黒のヒョウ柄。
  → `assets/v2/prompts.js` の `PICO_LOOK` に1か所だけ定義。
- 音は Web Audio で合成（BPM128・Am・8小節ループ）。音源ファイルは使わない。ドラムは4つ打ちにしない（後期ファミコンのノリは4拍目が抜ける）。
- セリフは吹き出し4場面（開始／登場／成功／失敗）＋コンボのみ。歌詞は使わず、単語と掛け声だけ。

---

## 3. 入口とファイル構成

### 公開用ファイル（`PikoTGame` に置くのはこの6つだけ）

| パス | 役割 |
|---|---|
| `index.html` | **v2 の入口**。`assets/v2/*` を順に読む |
| `assets/v2/genres.js` | v2 データ層。GAMES 41／GENRES 22／HOOKS 8／TWISTS 16／POP 22／EXP／GOALS |
| `assets/v2/plan.js` | v2 決定ロジック。`buildPlan` / `recommendGenres` / `topPick` / `pickJuice` / `sheetSlots` / `absurdOf` |
| `assets/v2/prompts.js` | v2 出力プロトコル6種。`prompt{Plan,Image,Assets,Web,Unity,Proposal}`＋`juiceBlock` / `absurdBlock` |
| `assets/v2/app.js` | v2 画面。7ステップ、`localStorage['pkproto.v2']` |
| `assets/v2/style.css` | v2 デザイン（黄×黒、印刷用CSS込み） |

**実サイズ（`tools/size_check.html` で fetch して UTF-8 バイトを実測）**

| ファイル | バイト | 行 |
|---|---|---|
| `index.html` | 2,326 | 49 |
| `assets/v2/genres.js` | 39,706 | 496 |
| `assets/v2/plan.js` | 30,204 | 526 |
| `assets/v2/prompts.js` | 66,369 | 1,078 |
| `assets/v2/app.js` | 31,073 | 684 |
| `assets/v2/style.css` | 11,430 | 220 |
| **合計** | **181,108** | —（`tabs=0`：全ファイルにタブ文字なし） |

### このプロジェクトにだけあるもの（公開不要）

| パス | 役割 |
|---|---|
| `tools/v2_check.html` | **v2 の機械検証**。全組み合わせの出力監査・決定性・推薦分布・JSエラー |
| `tools/v2_juice_check.html` | **ジューシー＆素材シートの検証**。352通りで5つの演出・スケール誇張・12マスを実測 |
| `tools/v2_absurd_check.html` | **不条理の検証**。22ジャンル×8乗せ方で5項目・救いの実装指示・6出力への反映を実測 |
| `tools/v2_fun_check.html` | **面白さの芯と推薦の偏りの検証**。1位/top3分布・リズムの中身・kick/spike/again の6出力反映を実測 |
| `tools/v2_pop_tune.html` | **推薦の重み調整**。係数を差し替えて「上位3位にリズムが入る率」を比較する計算用 |
| `tools/pico_draw_check.html` | **ピコ太郎の描画検証**。`drawPico()` の12ポーズ＋潰れ2種＋実寸（HEAD=34/24px）を実際に描いて破綻を目視確認 |
| `tools/pico_face_check.html` | **顔の比率の実測**。描いた画素を走査して頭の幅を測り、`PICO_SPEC` の数値と突き合わせる |
| `tools/v2_audio_check.html` | **リズム仕様の実測**。4レーンの音を実際に合成（OfflineAudioContext＋DFT）し、山場が来るか・スマホで聞こえるかを測る |
| `tools/size_check.html` | **公開物の実サイズ計測**。6ファイルを fetch して UTF-8 バイト数・行数・タブ数を実測 |
| `tools/v2_review.html` | **全10画面の見た目確認**。上タブで画面を切り替える（状態は固定シード） |
| `tools/v2_view.html` | ゲーム案（ジュース表示）と素材シートの2画面だけを見る確認用 |
| `tools/scroll_check.html` | スクロール位置の6項目自動計測 |
| `v1.html`, `assets/js/*`, `assets/css/*`, `csv/` | v1 一式。**v2 は読まない**。旧リポジトリ `PikoProgen` 側の控え |
| `tools/validate.html` | v1 の整合性チェック（参照切れ・候補数・推薦の偏りを実測） |
| `PKPROTO_引継ぎプロンプト.md` | 作業指示書（原本） |

> v1 を新リポジトリへコピーしないこと。`index.html` のフッターは旧URLへ直接リンクしている。

### v2 の流れ（7ステップ）

`00 はじめる` → `01 好きなゲーム（話題作から最大3本）` → `02 ジャンル（22種・例文つき・おすすめ印つき）`
→ `03 ピコ太郎の乗せ方（8種）` → `04 経験と目的（**答えなくてOK**）` → `05 ゲーム案` → `06 出力（6種）`

### まぎらわしい2組（ジャンル選択画面の上部に注釈を表示）

| ジャンル | 意味 | 例 |
|---|---|---|
| 射撃 | **競技**。1本ずつ正確さを競う | アーチェリー、競技射撃 |
| 射的 | **屋台の遊び**。景品を倒して競う | 縁日のコルク鉄砲、輪投げ、スマートボール |
| パズルアクション | **消すのが主役** | ぷよぷよ、テトリス、ツムツム、モンスト |
| アクションパズル | **仕掛けを解くのが主役**（消す遊びではない） | 倉庫番、8番出口、ゼルダの祠 |

### 強烈におすすめ（STEP 02 の最上部）

意志薄弱な層が「考えずに乗れる」ように、ジャンル画面の一番上に**1つだけ大きく**出します（`.pick` ブロック＋黄色の「これで進む（おすすめ）」）。

推薦は2軸で決めます（`PK2.plan.topPick()`、乱数なし）。

| 軸 | 中身 | 重み |
|---|---|---|
| ① 好きなゲームの選択傾向 | `GAMES[].genres` と選択順（1本目を1.0、以降0.6） | **主役**（×2.0） |
| ② 18〜20歳の友だちに「面白い」と言われやすいか | `PK2.POP[genreId] = {pop:1-3, hot, why}` | pop 0 / 0.45 / 0.90、hot で +0.25 |

- 何も選ばない人には、②の力で **マリオ型（横スクロールアクション）** が自然に出ます。
- **今年の学生人気（`hot:true`）はマリオ型とリズムゲーム**。リズムを作りたい学生が多いため、リズムを選べばそのまま1位になります。
- 理由は2〜3個、画面にそのまま箇条書きで出ます（本人の好み／友人ウケ／今年の人気）。
- 効果の実測（`tools/v2_check.html` の F節）：`TOP_FOR_MARIO=g_platx` / `TOP_FOR_TAIKO=g_rhythm` / `TOP_FOR_PUYO=g_otoshimono` / `TOP_FOR_NONE=g_platx`、41本での1位分布は **16種類に分散**（`g_platx:7, g_gun:6, g_rhythm:5, …`）。特定の型への張り付きなし。

#### 推薦の偏りを緩めた（2026-10-30）

「おすすめがリズムに偏りすぎ」という指摘を受けて、**データは正直なまま（`pop:3, hot:true`）、重みだけを下げました**。

| 係数 | 変更前 | 変更後 |
|---|---|---|
| `pop` 1段階あたり | 0.65 | **0.45** |
| `hot` の加点 | 0.45 | **0.25** |

実測（`tools/v2_pop_tune.html`、全123条件で「おすすめ上位3位」に `g_rhythm` が入る回数）：

| 条件 | 実測 |
|---|---|
| 変更前 | 62/123（**50.4%**） |
| pop2・hot なし（下げすぎ） | 15/123（12.2%） |
| **採用：pop3・hot あり 0.45/0.25** | **31/123（25.2%）** |
| 0.5/0.35（まだ強い） | 39/123（31.7%） |

- 「半分くらい」を狙って 25.2% を採用。12.2% まで落とすと、リズムを作りたい学生にリズムが出なくなるため採らない。
- リズムと無関係なゲームだけを選んだ108条件で、リズムが**1位になったのは 0/108**（元から1位にはならない）。偏りの実体は「上位3位の枠と『今年の学生人気』バッジ」だった。

### 面白さの芯：0秒の1手 → 山場 → もう一回（`plan.kick` / `plan.spike` / `plan.again`）

「どの案もつまらない」の原因は、ルール以前に**触った瞬間に何が起きるか**が決まっていないことでした。
実測すると、WEB出力は platx と rhythm で **88行中71行が同一**（＝ジャンルを変えても同じ文が並ぶ）。
そこで**22ジャンル全部に3項目**を持たせ、6出力すべてに流しています。

| 項目 | 意味 | 例（マリオ型） |
|---|---|---|
| `kick` 0秒の1手 | 起動して最初の1操作で必ず起きること（説明を読ませない） | 右を押すと走り出す。跳んで着地すると、キャラが縦に潰れて戻る。 |
| `spike` 山場 | 1プレイに1回、スクショで伝わる画 | 段差を跳び越えて、真顔のまま空中に浮いている1コマ。 |
| `again` もう一回の理由 | 失敗の理由が1行で分かる | 落ちた原因は1つだけ（すべった）。次は助走をつける。 |

- `PK2.prompts.FUN_RULE` ＋ `funBlock(plan)` が6出力に入る（`promptPlan` / `promptImage` / `promptAssets` / `promptWeb` / `promptUnity` / `promptProposal`）。
- 画面（`05 ゲーム案`）にも「面白さの芯」ブロックとして表示。
- 実測（`tools/v2_fun_check.html`）：

| 検査 | 実測値 |
|---|---|
| 3項目の欠け | `KICK_MISSING=0` / `SPIKE_MISSING=0` / `AGAIN_MISSING=0` |
| plan に入っているジャンル | `PLAN_HAS_KICK_SPIKE_AGAIN=22/22` |
| 6出力すべてに反映 | `KICKSPIKE_IN_OUTPUT={plan:22,image:22,assets:22,web:22,unity:22,proposal:22}` |
| 出力の健全性 | `OUTPUT_BAD=0` |
| platx と rhythm の WEB 共通行 | **71/88行 → 344/385行**（差分行が 17 → 41 に増えた） |

### リズムゲーム：4レーン＝4楽器（`plan.music` / `MUSIC_SPEC`）

「リズムを奏でている感じがしない」の原因は、ループ文が `流れてくるノーツを判定ラインで叩く。` だけで、
**叩いた結果どうなるか**が書かれていなかったこと。実測でも WEB 出力に 奏で／楽器／和音／メロディ／層 が **0/5語**でした。

そこでリズムだけ、**「音を鳴らす」ではなく「音を重ねる」**設計に変えました。

| レーン | 楽器 | 音（Web Audio・音源ファイルなし） | 実測ピーク | 第3倍音/基音 |
|---|---|---|---|---|
| 1（左） | キック | `sine 60Hz`・減衰0.18秒 | `60Hz` | 0.051 |
| 2 | スネア | `square 240Hz`・減衰0.09秒＋ノイズ | `240Hz` | 0.381 |
| 3 | ベース | `triangle 110Hz`・減衰0.35秒（次の小節から鳴り続ける） | `112Hz` | 0.079 |
| 4（右） | メロディ | `square 660Hz`・減衰0.12秒 | `660Hz` | 0.336 |

- `TUNING.music = { enabled:true, layers:[0,0,0,0], notesPerBarPerLane:1, spikeFired:false }`。ヒットで `+1`、ミスで `−1`（0未満にしない）。
- 音量は `gain = [0, 0.10, 0.20, 0.32][layers[lane]]`。**0なら鳴らさない**。
- レーンが光るのは**その楽器が鳴った瞬間だけ**。常時光らせない。
- 実測（`tools/v2_fun_check.html` B節）：`WEBに「楽器」=true 「メロディ」=true 「層」=true`、`リズム: WEB出力に音楽語=true / Unity出力に音楽語=true`。

#### 音を実際に合成して測った（`tools/v2_audio_check.html`）

仕様の数値をそのまま `OfflineAudioContext` で鳴らし、DFT で測りました。**3つの実欠陥が出たので直しました。**

| 見つかった欠陥 | 実測 | 修正 |
|---|---|---|
| ① 山場が「来ない」ことがある | 命中率60%だと、8小節周の終わりに層が `2/2/2/1` のまま＝**4レーン同時が一度も起きない** | 周の最後の小節で層0のレーンを自動で1に上げる → **遅くとも8小節目（15秒）に山場** |
| ② スマホで2レーン消える | **200Hz未満のレーンが2本**（kick 60Hz / bass 110Hz）。スマホのスピーカーはほぼ出さない | kick に `square 900Hz` 0.02秒のクリック、bass に `triangle 330Hz` を音量0.10で重ねる |
| ③ 「耳で区別できる」の根拠が無い | SE の行に**周波数の数値が0個**（「高い2音」等の形容だけ） | Pen `880/1320Hz`・Apple `sine 440Hz`・Pineapple `sawtooth 330Hz + square 335Hz`（5Hzのうなり）等を明記 |

- 修正後：`SE_FREQ_TOKENS_FOUND=7/7` / `GUARDS_PRESENT=5/5` / `WEB_HAS_NOTE_DENSITY=true` / `SIM_NO_SPIKE_CASES=0`。
- 4レーンのペア6組すべてが区別可能（`PAIRS_INDISTINCT=0`）。判定は「周波数比1.4倍以上／倍音構成の差0.10以上／減衰の差0.06秒以上」のいずれか。
- 山場の条件を **「4レーン全部が3/3/3/3」→「最初に4レーンが同時に鳴った小節」**に変更。3/3/3/3 は「パーフェクト」として別演出に分離（混ぜると山場でなくなる）。
- ノーツ密度を **1小節＝各レーン1個（計4個）** に固定。密度を上げると層が0に戻らず山場が来なくなるため（実測で確認）。
- 埋め込み描画コードの検証：`EMBEDDED_SAME_AS_EXPORT=true` / `EMBEDDED_SYNTAX_OK=true` / `EMBEDDED_RUN_OK=true` / `EMBEDDED_EXTERNALS=none`（＝プロンプト本文のコードをそのまま実行して2ポーズ描けた）。

### 不条理（無理やん → でも惜しい）：`plan.absurd`

ピコ太郎の笑いの核は **「真顔で、無理なことをやる」**。この企画では、その不条理をゲームの面白さの芯として扱います。

**原則（`ABSURD_RULE`、6出力すべてに同じ文で入る）**

| 原則 | 中身 |
|---|---|
| 無理なのは「要求」 | 操作は1〜2種類のまま増やさない。操作を増やすと難易度ではなく作業量になる |
| 救いは**1つだけ** | 2つ以上入れると簡単になりすぎて「無理やん」の面白さが消える |
| 理不尽にしない | 手も足も出ない状態は**笑いではなく怒り**になる。必ず「触れば分かる救い」を入れる |
| 難易度の帯 | 「10回に2〜3回は成功」。0回だと投げられ、10回だと笑いにならない |
| 失敗の回収 | 失敗した理由をリザルトに1行出す。「今のは惜しい」で終わらせる |

**5項目の構造（`PK2.plan.absurd`）**

| 項目 | 例（マリオ型×ピコ太郎） |
|---|---|
| `demand` 要求される無理 | ヒョウ柄の靴がすべって、止まれない。しかも動かすのはピコ太郎本人。 |
| `impossible` なぜ無理に見えるか | 減速できないので、狙った位置に立てない |
| `rescue` でも、できそう（救い） | 助走をつけて跳ぶと、すべりが前に乗って遠くまで届く |
| `rate` 合格の目安 | 10回に3回はゴールできる |
| `laugh` 笑いが起きる1コマ | 止まろうとして、そのまま滑って落ちる |

- 辞書は `PK2.plan.ABSURD`（**22ジャンル全部**）＋ `ABSURD_HOOK`（**8乗せ方**）。乗せ方で「無理」の質が変わる（例：ヒョウ柄→「床がところどころ滑る」、ポーズ→「決まったポーズを再現しながらやる」）。
- WEB / Unity には**実装の指示**まで入れる：
  - `TUNING.rescue = { assist: 1.0 }` / `[Header("不条理")] public float rescueAssist = 1.0f`（0.8で歯ごたえ増、0で無理ゲー）
  - 失敗理由をリザルトに1行出す仕組み
  - 成功時はジュースを最大にする（無理をやっていないゲームより強く喜ばせる）
- 画像プロンプトには「**真顔**のまま」「無理やんの材料を大きく1つ／いけそうな材料を小さく1つ、同じ画面に両方」を指示。
- 提案書には「不条理という笑いの型を、どのルールに変換したか」を独立した項として書かせる。
- 実測（`tools/v2_absurd_check.html`）：

| 検査 | 実測値 |
|---|---|
| 辞書の網羅 | `ABSURD_ENTRIES=22/22` / `ABSURD_HOOK_ENTRIES=8/8` / `ABSURD_MISSING=0` |
| 5項目の欠け | `ABSURD_FIELD_BAD=0` |
| 全組み合わせ（176） | `ABSURD_MISSING_ON_PLAN=0` / `ABSURD_UNDEF=0` |
| 乗せ方で文言が変わる | `HOOK_CHANGES_DEMAND=true` |
| 決定性 | `ABSURD_DETERMINISTIC=true` |
| 6出力すべてに不条理の記述 | `ABSURD_WORD_MISSING=0`（plan/image/assets/web/unity/proposal 各22/22） |
| 救いがWEB/Unityに入る | `WEB_HAS_RESCUE=true` / `UNITY_HAS_RESCUE=true` |
| 調整つまみ | `WEB_HAS_RESCUE_TUNING=true` / `UNITY_HAS_RESCUE_FIELD=true` |
| 出力の `undefined`/`NaN` | `OUTPUT_UNDEF_OR_NAN=0` |

### 気持ちよさ（ジュース）：`plan.juice`

「動くだけ」で終わらせないため、**演出を最初から5つ決めて**全出力に同じ内容で入れます（`PK2.plan.pickJuice()`、乱数なし）。

| 選ばれ方 | 中身 |
|---|---|
| 必ず入る3つ | `squash`（つぶれ＝スケール誇張）／`hitstop`（ヒットストップ）／`popup`（数字ポプ） |
| ジャンルで1つ | `J_GENRE[genreId]`（例：マリオ型→`landSquash`、リズム→`comboscale`、射撃系→`hitSpark`） |
| 刺激の1手で1つ | `J_TWIST[twistId]`（例：連鎖→`comboscale`、風→`trail`） |

- 辞書は `PK2.plan.JUICE`（15件）。語彙と数値は `csv/ジュース.csv` と揃えている。
- **スケール誇張の数値**は WEB と Unity の両方に明記：着地 `sx=1.2 / sy=0.8` → 0.18秒で戻す、ジャンプ `0.85 / 1.15` → 0.12秒、倍率は `0.85〜1.25` の範囲を超えない、**足元基準**で拡大縮小（中心基準だと浮いて見える）。
- ON/OFF を切り替えられるように指示（WEB: `TUNING.juice` / Unity: `juiceEnabled`）。発表で「入れた場合／入れない場合」を見せられる。
- 実測（`tools/v2_juice_check.html`）：**352通り**（ジャンル22×刺激16）で
  `JUICE_SHORT_LT5=0` / `JUICE_UNKNOWN_ID=0` / `COMBOS_WITHOUT_SQUASH=0` / `JUICE_DETERMINISTIC=true`。
  5つの演出が6出力すべてに入っているかも検査し `JUICE_WORD_MISSING=0`。

### 2D素材シート（A4 1枚・12マス）

v1の「素材ごとに1枚ずつ15枚生成」は**画像AIに断られる・崩れる・サイズ指定が無視される**ため、難易度を大きく下げました。

| 旧（v1方式） | 新（v2） |
|---|---|
| 画像15枚（1素材1ファイル） | **画像1枚だけ**（A4横のシート） |
| サイズ指定 256×256 など | **サイズ指定なし**（目安のみ） |
| 「背景は完全透明・市松模様にしない」 | **白い紙のままでよい**（透明指定を削除） |
| 命名規則15個（`Sprite_Player_Idle.png`…） | **12マスを3行×4列**に並べるだけ |
| 文字・ラベルを含む | **絵の中に文字を書かせない**（マス番号も書かせない） |

- 12マスの中身は `PK2.plan.sheetSlots()` が**決定的に**埋める（`plan.sheet`）。
  固定枠（主人公2枚＋ジャンル素材＋エフェクト2枚＋背景＋HUD3枚＋ボタン＋ヒョウ柄）が12に満たないときは `SLOT_PAD` で埋める。
- 失敗したときの逃げ道を**プロンプト内に**用意：
  - 簡単版A：6マスに減らす（主人公／動き／敵／足場orアイテム／成功エフェクト／背景）
  - 簡単版B：人物をやめて、ヒョウ柄の丸いキャラ1体（顔は眼鏡と口髭の記号だけ）
- 実測：22ジャンルすべてで `SHEET_SLOTS min=12 max=12 notTwelve=0 dup=0`、`SHEET_ONE_IMAGE_RULE=22/22`。

### ピコ太郎の見た目：数値仕様＋12ポーズ＋描画コード

**「毎回なんとなく別人になる」の原因は、文章だけの指定で寸法が無いこと**でした。
そこで比率を数値で固定し、その寸法どおりに描く**実動する関数**まで持たせています。

| 仕組み | 中身 |
|---|---|
| `PICO_SPEC` | 頭の幅を `W=1.00` とする比率表（頭身・顔の目盛り・髪・眼鏡・口髭・口・ヒョウ柄・色・NG） |
| `FACE_RULE` | **目は細めた横線のまま動かさない。変えるのは口の開きだけ**（ここを崩すと別キャラになる） |
| `PICO_POSES`（12種） | `idle / run / jump / land / hit / success / fail / dance / cheer / slip / peek / dizzy` |
| `POSE_BY_GENRE` | ジャンル→代表ポーズ（決定的）。`heroPose(plan)` が1枚絵のポーズを決める |
| `drawPico(ctx,x,y,s,pose,sx,sy,dir)` | 上記寸法どおりに描く**完成済みのCanvas関数**。手足の角度表12件＋口の開き量0〜1、`dir=-1` で左右反転 |
| `PICO_DRAW_SRC` | `drawPico.toString()`。**ソースをそのまま**WEBプロトのプロンプトに埋め込む（書き直させない） |

**寸法（顔の目盛り＝頭頂0.00 → 顎1.00）**

| 部位 | 値 | 部位 | 値 |
|---|---|---|---|
| 頭身（ゲーム内） | 2.6頭身（1枚絵は2.0） | 生え際 | 0.18 |
| 頭 | 全高の38%／`W1.00 × H1.28` | 眉 | 0.31 |
| 頬骨（最大幅） | `1.00W`（高さ0.46） | 目の中心 | 0.38 |
| 顎 | `0.52W` | 鼻の先 | 0.51 |
| 目 | 幅 `0.28W`／間隔 `0.16W` | 口髭 | 0.58 |
| 眼鏡レンズ | `0.36W × 0.16W`／枠 `0.030W` | 口の中心 | 0.67 |
| 口 | 幅 `0.48W` | ヒョウ柄 | 6角形 `Ø0.045W` を互い違いに12〜18個 |
| 耳 | 横 `0.452W`／半径 `0.045W × 0.100W` | 胴 | 高さ `0.80W` |

**輪郭は「半幅の表」で描く**（`PROFILE`）。一定幅にすると四角い顔になり、別人に見えます。

`高さ→半幅：0.00→0.000 / 0.05→0.260 / 0.12→0.400 / 0.20→0.455 / 0.28→0.480 / 0.38→0.495 / 0.46→0.500(最大) / 0.55→0.487 / 0.65→0.455 / 0.75→0.410 / 0.85→0.360 / 0.95→0.310 / 1.05→0.285 / 1.15→0.268 / 1.24→0.260`

**輪郭の実測（`tools/pico_face_check.html`）** — 描いた画素を走査して頭の幅を測った値

| 段階 | 最大幅の位置と値 | 顎（1.24）の幅 | 判定 |
|---|---|---|---|
| 修正前 | 高さ `0.485` で **1.188W**（耳が0.18Wはみ出し） | **0.613W**（下ぶくれ） | 仕様外 |
| 耳を内側へ | 高さ `0.430` で `1.087W` | `0.511W` | まだ横広 |
| **修正後** | 高さ `0.395` で **1.038W** | **0.536W** | 仕様内（±0.04W） |

- 鼻の高さ（0.51）の幅 `0.988W`、目の高さ（0.38）の幅 `0.988W` ＝ 頬骨付近が最も広く、顎へ細く落ちている。
- 眼鏡は**透明レンズ＋黒縁**。上端は目の中心の `0.03W` 上、下端は鼻の先（0.51）にそろえる＝**レンズの下側が鼻に乗る「ちょいがけ」**。サングラスにしない。
- 色は `肌 #FDC7A9 / 肌の影 #E7A483 / 髪・眼鏡・口髭 #1C1919 / ヒョウ柄 #FFD400 / 斑点 #141412 / 口の中 #C6392F / 歯と靴 #FFFFFF`。
- **任意の差し込み口 `PICO_ART`**（既定 `enabled:false`）：先生が手元の参考イラストを `assets/v2/pico/pico-ref.png` に置いたときだけ `enabled:true` にすると、WEBプロトは画像素材＋`drawPico` のフォールバックに切り替わります。**実在の人物の写真・公式素材は置きません**（上記IP節と同じ規則）。
- 実測（`tools/pico_draw_check.html`）：`POSES=12 ERRORS=0` / `DRAW_SRC_CHARS=11495` / `DRAW_SRC_HAS_BACKTICK=false` / `SPEC_BLOCK_CHARS=1609` / `HERO_POSE(platx)=success` / `WEB_CHARS=17946 WEB_HAS_DRAW=true WEB_HAS_POSES=true WEB_UNDEF=false`。
- ゲーム内の実寸 **HEAD=34px / 24px** でも、髪・眼鏡・口髭・口・ヒョウ柄が判別できることをスクリーンショットで確認済み。

### スクロール位置の扱い（`render({keepScroll:true})`）

同じ画面内の選択では**スクロール位置を保つ**。設問をまたぐ移動のときだけ先頭へ戻す。

| 操作 | 挙動 | 実測 |
|---|---|---|
| 好きなゲームを選ぶ／外す | 位置を保つ | y=700 → 700 |
| ジャンルを選ぶ | 位置を保つ | y=900 → 900 |
| ピコ太郎の乗せ方を選ぶ | 位置を保つ | y=479 → 479 |
| 刺激の1手を差し替える | 位置を保つ | y=1200 → 1200 |
| 出力タブを切り替える | 位置を保つ | y=400 → 400 |
| 「次へ」で設問を移動 | 先頭へ戻す | y=800 → 0 |

- 保存は描画直後と `requestAnimationFrame` 後の2回。フォント読込で高さが変わっても位置がずれない。
- 先頭へ戻すときは `behavior:'smooth'` を使わない。長い距離だと**途中の座標で止まる**（実測で y=800 → 1200 に残った）ため、`'auto'` で即時に戻す。
- 計測は `tools/scroll_check.html`（ブラウザで開くと6項目を自動計測してログに出す）。

### 経験の設問（STEP 04）の扱い

この層はツール＋UnityMCPで最後まで走り切る前提なので、経験は**参考値**として扱います。
未選択でも「少し触ったことがある」で進み、影響するのは**案の★の重さと補足文だけ**（案の内容自体は変わりません）。
画面には「この設問を答えずに進む」ボタン（`data-reset="exp"`）を置いています。

`05 ゲーム案` では案を1つ出したうえで、**刺激の1手（16種）／乗せ方（8種）／別ジャンル** をその場で差し替えできます（作り直しではなく味替え）。

---

## 4. v2 のデータ

- `PK2.GAMES`（41件）：18〜20歳に人気・直近の話題作。`genres[]` で相性ジャンルを持つ。
- `PK2.GENRES`（22件）：`label, eg, fam, level(1-3), input, view, time, target, life, loop, why, unity, hooks[], twist, assets[]`
  - `eg` は**全22件に必須**の「例：」文。ジャンル名だけでは区別できないため、実在の作品名で補う（`tools/v2_check.html` が `GENRE_NO_EG=0` を検査）。
- `PK2.HOOKS`（8件）：ピコ太郎を**ルールのどこに**乗せるか（アイテム／群れ／顔／身体／ポーズ／ヒョウ柄／観客／なりきり）。
- `PK2.TWISTS`（16件）：刺激の1手（密／速／縮／上昇／壁／連鎖／成長／順番／分裂／狙い／待ち／領域／値段／風／亀裂／偽物）。
- 保存は `localStorage['pkproto.v2']`。URL共有は未実装。

### 決定的であることの保証

`tools/v2_check.html` をブラウザで開くと、全 **176通り**（ジャンル22 × 乗せ方8）の出力を生成して
空フィールド0・`undefined`/`NaN` 0・同一入力で同一出力を自動検査します。乱数はどこにも使っていません。

`tools/v2_juice_check.html` は、さらに **352通り**（ジャンル22 × 刺激の1手16）で
ジュースの5点選出・スケール誇張の記述・素材シートの12マスを検査します。

| 検査 | 実測値 |
|---|---|
| 全組み合わせ出力（176通り） | `combos=176 bad=0 emptyFields=0` |
| ジューシー（352通り） | `JUICE_SHORT_LT5=0` / `JUICE_UNKNOWN_ID=0` / `COMBOS_WITHOUT_SQUASH=0` |
| 6出力すべてにジュースの記述 | `JUICE_WORD_MISSING=0`（plan/image/assets/web/unity/proposal 各22/22） |
| 素材シートのマス数 | `SHEET_SLOTS min=12 max=12 notTwelve=0 dup=0` |
| 使用された演出の種類 | 15件中 **14件**（`squash/hitstop/popup` は全352通りで必ず入る） |

---

## 5. v2 の出力6種

| # | 出力 | 用途 |
|---|---|---|
| 1 | 1枚企画書 | 生成AIに貼るとA4 1枚の企画書になる。まずこれだけで発表できる |
| 2 | ゲームイメージ画像 | 画像生成AI用。1の企画書と一緒に貼る。**真顔／無理やんの材料と救いの材料を同じ画面に**、ジュースも絵で分からせる |
| 3 | 2D素材シート（A4 1枚） | 2の画像を添付して依頼。**12マスを1枚に**まとめる低難易度版 |
| 4 | WEBプロト生成プロトコル | Canvas 2D・1ファイルで動くWebゲーム。外部ライブラリ/画像/CDNなし。**ジュース＋不条理（救いの調整つまみ・失敗理由の表示）入り** |
| 5 | UnityMCP 依頼プロトコル | 下記のとおり。**クレジット節約＋ジュース＋不条理の指示入り** |
| 6 | 提案書生成プロンプト | タイトル／後付けコンセプト／IP接続（**不条理の型**）／概要／ウリ／イメージ／古坂大魔王様へのメッセージ |

### 5. UnityMCP 依頼プロトコルの要点

- 教員指定の本文（制作方針／編集できるようにするもの／テストと納品）を**逐語で**含む。
- 加えて「トークンとクレジットを節約するための作業指示」10項：
  ①まず現状確認だけで一度止める ②以後は差分だけ書く ③報告は箇条書き最大5行
  ④画像は再生成せず添付素材を使う ⑤Animatorを作らずコードで動かす ⑥音源ファイルを入れない
  ⑦パッケージ追加なし ⑧4工程に分割し各回の最後に次の1行 ⑨「続けて」は確認なしで進行 ⑩エラー時は原因1行＋修正1行
- 最後に「今のプロジェクト構成を確認し、Prefab/シーンの有無を表で出す。まだファイルは作らない」で終わる。

---

## 6. 旧版 v1（別リポジトリで保存）

v1 は **`odatid/PikoProgen`（https://odatid.github.io/PikoProgen/）にそのまま残しています**。
新リポジトリ `PikoTGame` には v1 を置かない（`v2` と `v1` の取り違えを防ぐため）。

このプロジェクト内では `v1.html` ＋ `assets/js/*` ＋ `assets/css/*` ＋ `csv/` が v1 の控え。CSV DB（`csv/` 27枚）駆動、12ステップ、`localStorage['pkproto.v1']`。
`assets/js/config.js` は **`MODE:'csv'`, `CSV_BASE:'csv/'`**（API＝Apps Script モードは過去にCORSで失敗しているので復活させない）。

v1 の計測済みの弱点（`tools/validate.html`、2026-10-30）:

| 症状 | 実測 |
|---|---|
| 「なぜピコ太郎か」「○○したい人」「認知ゴール」が案の選択に効かない | 9/10/10通り総当たりで **top1がP14固定**（提案文にしか使われていない） |
| 型を選ぶと案が1つに決まる | 26型中 **18型が候補1件** |
| 型から到達できない案 | P23・P24 は**永久に出ない**（到達22/24）、E23/E24 は型に無い |
| 似た案が多い | 類似ペア **21組**（P06〜P18 はIP一致1.0） |
| 同じ案に偏る | 1980通りで**上位3案が46%**、P17・P20 は1位0回 |
| CSVモードで動詞が切れる | `マスタ_動詞.pat` が P01〜P12 しか指さず **P13〜P24 は動詞0件** |
| BGM欠落 | 21エンジン中 BGM定義は **9個だけ** |

v1 の修復は凍結（v2 を本線にするため）。必要になったら上表の順に1テーマずつ。

---

## 7. 確認方法

```
ブラウザで tools/v2_check.html を開く        … v2 の出力監査・決定性・推薦分布・JSエラー
ブラウザで tools/v2_juice_check.html を開く … ジューシー（5つの演出）と素材シート12マスの検証
ブラウザで tools/v2_absurd_check.html を開く … 不条理（無理やん→惜しい）の検証
ブラウザで tools/v2_review.html を開く       … 全10画面の見た目を上タブで切り替えて確認
ブラウザで tools/v2_view.html を開く         … ゲーム案（ジュース）と素材シートの2画面だけ
ブラウザで tools/scroll_check.html を開く    … スクロール位置の6項目計測
ブラウザで index.html を開く                 … 実際に操作して確認（これが公開物）
ブラウザで tools/validate.html を開く        … v1 のDB整合性（file:// ではCSVが読めない）
```

### 公開（`PikoTGame`）の手順

1. GitHub Desktop で `PikoTGame` リポジトリを作成（README初期化なし・Gitignoreなし）
2. **公開用6ファイル**を置く（`index.html` ＋ `assets/v2/` の5ファイル）
3. Commit to main → Push origin
4. GitHub の Settings → Pages で `Deploy from a branch` / `main` / **`/ (root)`** を選んで Save
5. 1〜2分後に https://odatid.github.io/PikoTGame/ を開き、`v2` バッジが出ることを確認

※ `.git` を OneDrive 同期フォルダに置くとロック競合が起きるので、push 中は OneDrive を一時停止する。

## 8. 残作業

- [ ] 実入力での調整（教員が実際に触りながら、推薦の重み・言い回しを詰める）
- [ ] 不条理の「救い」の文面を、実際に遊んで難易度を確かめる（今は10回に2〜3回の想定値）
- [ ] 素材シート方式を実際の画像AIで試す（Gemini で12マスが通るか、簡単版Aに落ちるか）
- [ ] **参考イラストを素材として置くか決める**：`PICO_ART.enabled` は既定 `false`。置く場合は `assets/v2/pico/pico-ref.png` に1枚だけ置いて `true` にする。
      ただし**実在の人物の写真・公式素材は置かない**（IP節）。現状の4点の添付は、セッション中にURLが失効して取得できず、リポジトリには入れていない。
- [ ] ピコ太郎の「似せ」をさらに詰めるなら、**顔の輪郭（頬骨の張り出しと顎の細さ）**が次の対象。パーツ位置は数値で固定済み。
- [ ] URL共有（案を `#p=` で渡す）— v2 では未実装
- [ ] 「他人から面白いねと言われそう」の担保：10秒テストの結果を出力に反映する
- [ ] 教員の実地テスト（学生3名程度で3分で着地するか）
- [ ] v1 の修復（凍結中）

## 9. ライセンス

授業利用を想定したサンプル。外部ライブラリなし（フォントのみ Google Fonts）。
