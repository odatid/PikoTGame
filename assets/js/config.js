/* =========================================================
   PK//PROTO — DB接続設定
   GitHub Pages に上げる前に、ここだけ書き換える。
   ========================================================= */
window.PK_CONFIG = {
  /* 'api'   : Google Apps Script の Web App から JSON を受け取る（推奨・非公開シートも可）
     'csv'   : 公開したスプレッドシートのCSVを読む（GitHub Pages だけで完結）
     'local' : 同梱の data.js を使う（オフライン・予備） */
  MODE: 'csv',

  /* MODE='api' のとき：Apps Script をデプロイして出た URL を貼る
     例）https://script.google.com/macros/s/AKfycb..../exec */
  API_URL: 'https://script.google.com/macros/s/AKfycbxZX8Az0YFSWfGFsVlxWc1IWTDzDfCpnZTuUyu9bUHoP_yqd_t_K5QDv_lvbOOb75ow/exec',

  /* MODE='csv' のとき：公開CSVの置き場所（末尾スラッシュあり）
     Apps Script の exportCsv() で Google ドライブに書き出した公開URL、
     または同じリポジトリに置いた csv/ フォルダ */
  CSV_BASE: 'csv/',

  /* 起動時にDBが読めなかったとき、同梱データで動かす（授業を止めない） */
  FALLBACK: true,

  /* 読み込みログをコンソールに出す */
  DEBUG: true
};
