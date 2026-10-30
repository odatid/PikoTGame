# PK//PROTO 作り直し — 別チャット用 引継ぎプロンプト

以下をそのまま新しいチャットに貼ってください。長いですが、貼るだけで作業を始められます。

---

```
あなたは「PK//PROTO」というWebアプリを作り直す担当です。
私は大学の授業「ゲーム制作演習」（2026年度後期）の教員です。
学生はUnity初心者〜初級者。1プレイ3分以内、操作は1〜2種類という制約で作ります。

【今回の目的】
このツールを「もっと面白いゲームが出てくるツール」に作り直す。
具体的には次の3つを直したい。
 1. 質問項目（DNAシートの選択肢と問い方）
 2. 選ぶテンプレゲーム（作れる型＝操作・ジャンルの一覧）
 3. ゲームの種（パターン＝ゲーム案の原型データ）
まずは現状を把握して、私に「どこが弱いか」の診断を出してから、
修正案を出してください。いきなり全部書き換えないでください。

────────────────────────────────
■ 公開物（変更しない。この方式を維持する）
────────────────────────────────
・GitHubリポジトリ（Public）: https://github.com/odatid/PikoProgen
・公開URL（GitHub Pages）:    https://odatid.github.io/PikoProgen/
・公開方法：mainブランチに push すると 1〜2分で反映。ビルド不要の静的サイト。
・DBは「CSVモード」で運用中。assets/js/config.js は MODE:'csv'、CSV_BASE:'csv/'。
  スプレッドシート連携（Apps Script の API モード）は使わない。触らない。
  ※ APIモードは過去にCORSとアクセス権で何度も失敗した。復活させない。

────────────────────────────────
■ 絶対に守る設計思想
────────────────────────────────
1. 生成AIのAPIは使わない。
   プロンプトは「DBの文章セル＋ID参照」から決定的に組み立てる。
   同じ入力なら必ず同じ出力になること。乱数は使わない。
2. 学生はWebアプリだけを使う。
   スプレッドシートもApps Scriptも触らせない。教員だけがDBを保守する。
3. 出力する3プロンプト（企画書／画面イメージ／Webゲーム）には、
   「ジャンル・操作・勝敗条件を変えるな」という拘束文を必ず入れる。
   これを外すと、学生がAIに貼ったとき別のゲームが返ってくる。
4. 1プレイ3分以内、操作1〜2種類。これを超える案は出さない。
5. 学生の力量に合わせる。Unity初心者が15分で着手できる粒度で書く。

────────────────────────────────
■ 触ってはいけないもの（IP・権利）
────────────────────────────────
・ピコ太郎の公式素材、実在の人物の顔、既存ロゴは使わない。
・見た目の固定仕様（これを崩さない）:
    角刈りパンチパーマ／鼻にちょいがけの黒縁眼鏡（サングラスではない）／口髭／
    黄色×黒のヒョウ柄
・音は Web Audio で合成する（BPM128・4つ打ち・Am・8小節ループ）。
  音源ファイルは使わない。SEは8種。Pen / Apple / Pineapple を耳で区別できること。
・セリフは吹き出し4場面（開始／登場／成功／失敗）＋コンボのみ。
  歌詞は使わず、単語と掛け声だけ。

────────────────────────────────
■ 現在のアプリ構成
────────────────────────────────
画面は12ステップ。学生は上から順に選ぶだけ。

  00 intro        … 説明
  01 DNAシート    … なぜピコ太郎か（9択＋自由記述）／○○したい人／認知ゴール
  02 誰に         … 対象（10択）
  03 IPの価値     … 上限なしの複数選択
  04 感情         … 成功時・失敗時にどう感じさせたいか
  05 動詞         … 1〜3個選択。1個目が主動詞
  06 挑戦の宣言   … 2D/3D、できること16項目、挑戦10項目、指導希望メモ
  07 作れる型     … 26種類から選ぶ（難易度1〜3）
  08 確認
  09 ゲーム案     … 1案＋スコアの重み内訳＋「刺激の1手」
  10 プロンプト   … 企画書／画面イメージ／Webゲームの3本をコピー
  11 Unityへ      … 制作パッケージ（提案書/A最初に作るもの/B仕様/C構成要素/
                    D素材/E UI・SE・BGM/F Prefab/G刺激の1手/H演出/
                    I手引き9ステップ/J提出用テキスト）

ファイル構成（pikogen/ が公開ディレクトリ）:
  index.html            画面骨格。config.js→data.js→engines.js→db.js→generate.js→app.js の順で読む
  assets/js/config.js   DB接続設定（MODE:'csv'）
  assets/js/data.js     質問の選択肢とゲームの種（★主にここを直す）
  assets/js/engines.js  エンジン21種（実装の型）＋Prefab 27＋手引き
  assets/js/db.js       CSV/api/local の3モード読み込み
  assets/js/generate.js 採点・推薦・プロンプト組み立て（決定的）
  assets/js/app.js      全画面の描画とイベント、localStorage('pkproto.v1')、URL共有 #p=
  csv/                  27枚のCSV（実行時に読まれる実データ）
  pikogen_db.xlsx       スプレッドシートDB雛形（27シート）
  tools/dump_db.js      data.js/engines.js → tools/db.json
  tools/build_xlsx.py   tools/db.json → xlsx ＋ csv/
  tools/sheet_api.gs    Apps Script（APIモード用・今回は使わない）
  handout/twists.html   「刺激の1手」早見表（A4横）
  handout/setup.html    導入手順書（A4 4ページ）

現在のデータ量（実測）:
  PATTERNS 24件 / TYPES 26件 / TWISTS 20件 / ENGINES 21 / PREFABS 27
  AUDIENCES 10 / IP_VALUES 52 / EMOTIONS 10 / WHY_PICO 9 / WANT_TO 10
  PERCEPTION 10 / SKILLS 16 / CHALLENGES 10 / PICO_SE 8 / PICO_LINES 7
  csv 27枚

────────────────────────────────
■ 直したい3点のデータ構造（ここが作業の中心）
────────────────────────────────

【1. 質問項目】assets/js/data.js
  PK.WHY_PICO    : {id, short, text, tags[]}      なぜピコ太郎か（9択＋自由記述）
  PK.WANT_TO     : {id, label, note}              ○○したい人（10択）
  PK.PERCEPTION  : {id, label, tags[]}            認知ゴール（10択）
  PK.AUDIENCES   : {id, label, note, dev}         誰に（dev: pc/lap/both）
  PK.IP_VALUES   : {id, group, label, mech, note} IPの価値（mech: ◎/○/△）
  PK.EMOTIONS    : {id, label, ok, ng, tone}      感情
  PK.VERB_GROUPS : {id, group, label, pat, difficulty} 動詞（patは既定パターンID）
  PK.SKILLS      : できること16 / PK.CHALLENGES: 挑戦10 / PK.DIMENSIONS: 2D/3D
  ※ tags は IP_VALUES のIDを指す。ここが切れると採点が壊れる。

【2. テンプレゲーム】assets/js/data.js の PK.TYPES
  {id, label, engines:['E01','E03'], level:1|2|3}
  engines は engines.js に実在するIDのみ。存在しないIDを書くと案が出ない。
  現在26種（左右移動／自動ラン／タップ／落下／積む／ヴァンサバ型／
  横スクロール／リズム4ボタン／1人称ダンジョン など）

【3. ゲームの種】assets/js/data.js の PK.PATTERNS（24件）
  {id, name, family, engine, dim, level, input, duration, difficulty,
   oneline, action, successTpl, failTpl, loop, retry, ipHook,
   nums{target,life,...}, verbs[], verbGroup,
   ip{IPID:重み}, emo[], aud[],
   imageComp, imageMood, codeNotes,
   ui[[UIID,必須/任意]], assets[素材ID], se[SEID], bgm, warn[]}
  successTpl/failTpl は {{duration}} {{target}} {{life}} を差し込むテンプレート。
  ui / assets / se のIDは data.js の UI_MASTER / ASSET_MASTER / SE_MASTER に
  実在しないと参照切れになる。

【採点】PK.WEIGHTS = {ip:.30, verb:.22, emo:.18, aud:.12, tech:.18,
                      penaltyLevel:1, engineRepeat:.12, familyRepeat:.06}
  generate.js の scorePattern / recommend / pickTwist / consistency が担当。
  重みを変えると推薦が全部変わるので、変えたら必ず通し確認する。

【刺激の1手】PK.TWISTS（20件）。1ゲームに必ず1つだけ入れる。
  fit[]（エンジンID）と verbs[]（動詞）で候補を絞る。PK.SUBVERB_TWIST で
  副動詞から優先選択する。

────────────────────────────────
■ 作業の進め方（この順番を守る）
────────────────────────────────
STEP 0  まず GitHub から最新を取得して基準にする
          git clone --depth 1 https://github.com/odatid/PikoProgen.git
        作業フォルダの古いコピーと混ぜないこと。
        （過去に db.js の版がズレて混乱した）

STEP 1  現状を読んで診断する。コードはまだ書かない。
        ・24件のゲームの種を全部読み、似ているもの／弱いものを指摘
        ・26種の型のうち、学生が実際に作れないものを指摘
        ・質問項目のうち、答えても案が変わらない設問を指摘
        ・「同じ案ばかり出る」「面白くない」原因を特定
        診断は表で出し、私に優先順位を確認する。

STEP 2  直す。1回の変更は1テーマだけ（質問／型／種のどれか1つ）。
        データを足すときは、既存IDを壊さない。IDは英小文字とアンダースコア。

STEP 3  整合性を機械的に検証する（手で目視しない）。
        ・TYPES の engines が全部実在するか
        ・PATTERNS の ui / assets / se / ip / emo / aud が全部実在するか
        ・全TYPESが最低1つのPATTERNSに対応するか
        ・TWISTS の fit/verbs が実在するか
        検証スクリプトを書いて実行し、結果を私に見せる。
        （vm モジュールで data.js と engines.js を読み込んで数える方法が使える）

STEP 4  CSVを再生成する。ここを忘れると画面に反映されない。
          node tools/dump_db.js
          python3 tools/build_xlsx.py
        csv/ の27枚と pikogen_db.xlsx が更新される。
        ※ 実行時に読まれるのは csv/ であって data.js ではない。
          data.js は FALLBACK 用。両方そろって初めて正しくなる。

STEP 5  ブラウザで通し確認する（jsdom でもよい）。
        DNAシート→案→プロンプト3本→Unityパッケージまで実際にクリックし、
        JSエラー0件、出力が空でないことを確認する。

STEP 6  私に確認を取ってから push する。
        push 後 1〜2分で https://odatid.github.io/PikoProgen/ に反映。
        右上のチップが緑の「DB CSV」であることを確認する。

────────────────────────────────
■ 報告のルール
────────────────────────────────
・推測で「できました」と言わない。実行して確認した結果だけを報告する。
・件数は必ず数えて報告する（「増やしました」ではなく「24→31件」）。
・ファイルを私に渡すときは、そのまま使える形（zip か単体ファイル）で出す。
・日本語で書く。専門用語は学生にも分かる言葉に言い換える。
・私が「これで公開」と言うまで push しない。

────────────────────────────────
■ まず最初にやること
────────────────────────────────
git clone して上記のファイルを読み、
「いまのツールのどこが弱いか」の診断表を出してください。
コードの変更は、私が優先順位を決めてからにしてください。
```
