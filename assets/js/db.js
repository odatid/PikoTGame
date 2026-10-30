/* =========================================================
   PK//PROTO — スプレッドシートDB ローダ
   読み込み先：Apps Script(api) / 公開CSV(csv) / 同梱(local)
   どのモードでも、最終的に PK.* の形へ変換して差し替える。
   ========================================================= */
window.PK = window.PK || {};
(function(){
'use strict';

const SHEETS = [
  '設定','マスタ_なぜ','マスタ_欲求','マスタ_認知','マスタ_対象','マスタ_IP','マスタ_感情','マスタ_動詞','マスタ_型',
  'パターン','パターン_IP','パターン_UI','パターン_素材','パターン_音','パターン_感情','パターン_対象',
  'エンジン','エンジン_手引き','ツイスト','ツイスト_動詞',
  '素材','UI','SE','BGM','Prefab','ジュース','IP事実'
];

/* ---------------- CSV ---------------- */
function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  text = text.replace(/^\uFEFF/,'');
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){
      if(c==='"'){ if(text[i+1]==='"'){cell+='"';i++;} else q=false; }
      else cell+=c;
    }else{
      if(c==='"') q=true;
      else if(c===','){ row.push(cell); cell=''; }
      else if(c==='\n'){ row.push(cell); rows.push(row); row=[]; cell=''; }
      else if(c==='\r'){ /* skip */ }
      else cell+=c;
    }
  }
  if(cell!==''||row.length){ row.push(cell); rows.push(row); }
  return rows.filter(r=>r.some(x=>String(x).trim()!==''));
}
function toObjects(rows){
  if(!rows.length) return [];
  const head = rows[0].map(h=>String(h).trim());
  return rows.slice(1).map(r=>{
    const o={};
    head.forEach((h,i)=>{ if(h) o[h]= r[i]===undefined?'':String(r[i]).trim(); });
    return o;
  });
}
const num = (v,d)=>{ const n=Number(v); return isNaN(n)?d:n; };
const bool = v=> String(v).toUpperCase()!=='FALSE' && String(v)!=='0' && String(v)!=='';
const list = v=> String(v||'').split(/[,、\s]+/).map(s=>s.trim()).filter(Boolean);
const json = (v,d)=>{ try{ return v?JSON.parse(v):d; }catch(e){ return d; } };

/* ---------------- 変換 ---------------- */
function build(S){
  const g = n => toObjects(parseCSV(S[n]||''));
  const out = {};
  const errs = [];

  /* 設定 */
  const cfg = {};
  g('設定').forEach(r=>{ cfg[r.key]= r.value; });

  /* マスタ */
  out.AUDIENCES = g('マスタ_対象').map(r=>({id:r.id,label:r.label,note:r.note,dev:r.dev||'both'}));
  out.IP_VALUES = g('マスタ_IP').map(r=>({id:r.id,g:r.group,label:r.label,mech:r.mech||'△',note:r.note}));

  const byGroup = (rows, key)=>{
    const map=new Map(); const order=[];
    rows.forEach(r=>{ const k=r[key]||'その他'; if(!map.has(k)){ map.set(k,[]); order.push(k); } map.get(k).push(r); });
    return {map, order};
  };

  /* 動詞（groupでまとめる） */
  const vrows = g('マスタ_動詞');
  const vg = byGroup(vrows,'group');
  out.VERB_GROUPS = vg.order.map(k=>({
    g:k, verbs: vg.map.get(k).map(r=>({id:r.id,label:r.label,pat:r.pat,d:num(r.difficulty,1)}))
  }));

  out.EMOTIONS = g('マスタ_感情').map(r=>({id:r.id,label:r.label,ok:r.ok,ng:r.ng,tone:r.tone}));
  out.TYPES = g('マスタ_型').map(r=>({id:r.id,label:r.label,engines:list(r.engines),level:num(r.level,1)}));
  out.WANT_TO = g('マスタ_欲求').map(r=>({id:r.id,label:r.label,note:r.note}));
  out.PERCEPTION = g('マスタ_認知').map(r=>({id:r.id,label:r.label,tags:list(r.tags)}));
  out.WHY_PICO = g('マスタ_なぜ').map(r=>({id:r.id,short:r.short,text:r.text,tags:list(r.tags)}));

  /* 子テーブル */
  const pIp={}, pUi={}, pAs={}, pSe={}, pEm={}, pAu={};
  g('パターン_IP').forEach(r=>{ (pIp[r.pattern_id]=pIp[r.pattern_id]||{})[r.ip_id]=num(r.weight,0.5); });
  g('パターン_UI').forEach(r=>{ (pUi[r.pattern_id]=pUi[r.pattern_id]||[]).push([r.ui_id, r.req||'必須']); });
  g('パターン_素材').forEach(r=>{ (pAs[r.pattern_id]=pAs[r.pattern_id]||[]).push(r.asset_id); });
  g('パターン_音').forEach(r=>{ (pSe[r.pattern_id]=pSe[r.pattern_id]||[]).push(r.se_id); });
  g('パターン_感情').forEach(r=>{ (pEm[r.pattern_id]=pEm[r.pattern_id]||[]).push(r.emo_id); });
  g('パターン_対象').forEach(r=>{ (pAu[r.pattern_id]=pAu[r.pattern_id]||[]).push(r.aud_id); });

  /* パターン本体 */
  out.PATTERNS = g('パターン').filter(r=>r.id && bool(r.active)).map(r=>({
    id:r.id, name:r.name, family:r.family, engine:r.engine, dim:r.dim||'2D',
    level:num(r.level,1), input:r.input, duration:num(r.duration,60), difficulty:num(r.difficulty,1),
    oneline:r.oneline, action:r.action, successTpl:r.success_tpl, failTpl:r.fail_tpl,
    loop:r.loop, retry:r.retry_reason, ipHook:r.ip_hook,
    nums:{ target:num(r.target,0), life:num(r.life,3), fall:num(r.fall,0), interval:num(r.interval,0), speedup:num(r.speedup,0) },
    verbs:[], verbGroup:r.verb_group||'',
    ip:pIp[r.id]||{}, emo:pEm[r.id]||[], aud:pAu[r.id]||[],
    imageComp:r.image_comp, imageMood:r.image_mood, codeNotes:r.code_notes,
    ui:pUi[r.id]||[], assets:pAs[r.id]||[], se:pSe[r.id]||[], bgm:r.bgm||'', warn:[]
  }));
  /* 動詞の逆引き（pattern_id → verb label） */
  const vByPat={};
  vrows.forEach(r=>{ (vByPat[r.pat]=vByPat[r.pat]||[]).push(r.label); });
  out.PATTERNS.forEach(p=>{ p.verbs = vByPat[p.id] || []; });

  /* エンジン */
  out.ENGINES = {};
  g('エンジン').forEach(r=>{
    out.ENGINES[r.id] = {
      name:r.name, short:r.short, scene:r.scene,
      comps:json(r.comps,[]), tuning:json(r.tuning,[]), flow:r.flow, juice:list(r.juice), mid:[]
    };
  });
  g('エンジン_手引き').sort((a,b)=>num(a.order,0)-num(b.order,0)).forEach(r=>{
    if(!out.ENGINES[r.engine_id]) return;
    out.ENGINES[r.engine_id].mid.push({h:r.heading,w:r.work,d:r.done,c:r.check,t:r.trap,m:num(r.minutes,15),p:r.prefab});
  });

  /* ツイスト */
  out.TWISTS = g('ツイスト').map(r=>({
    id:r.id, type:r.type, name:r.name, one:r.one, what:r.what, how:r.how,
    effect:r.effect, tune:r.tune, fit:list(r.fit_engines), verbs:list(r.fit_verbs)
  }));
  out.SUBVERB_TWIST = {};
  g('ツイスト_動詞').forEach(r=>{ if(r.verb) out.SUBVERB_TWIST[r.verb]=r.twist_id; });

  /* 素材・UI・音 */
  out.ASSET_MASTER = {};
  g('素材').forEach(r=>{ out.ASSET_MASTER[r.id]={role:r.role,name:r.name,size:r.size,fake:r.fake,pri:r.priority,path:r.path}; });
  out.UI_MASTER = {};
  g('UI').forEach(r=>{ out.UI_MASTER[r.id]={label:r.label,pos:r.pos,why:r.why}; });
  out.SE_MASTER = {};
  g('SE').forEach(r=>{ out.SE_MASTER[r.id]={label:r.label,file:r.file,len:r.length,when:r.when,tone:r.tone,vol:r.volume}; });
  out.BGM_MASTER = {};
  g('BGM').forEach(r=>{ out.BGM_MASTER[r.engine_id]={bpm:num(r.bpm,120),key:r.key,mood:r.mood,instr:r.instr,loop:num(r.loop_sec,45)}; });

  /* Prefab / ジュース / 事実 */
  out.PREFABS = {};
  g('Prefab').forEach(r=>{ out.PREFABS[r.id]={name:r.name,fn:r.fn,cat:r.cat,level:num(r.level,1),deps:list(r.deps),done:r.done,check:r.check,trap:r.trap,min:num(r.minutes,15)}; });
  out.JUICE = {};
  g('ジュース').forEach(r=>{ out.JUICE[r.id]={name:r.name,when:r.when,how:r.how,tune:r.tune}; });
  out.DNA_FACTS = g('IP事実').map(r=>({id:r.id,y:r.year,title:r.title,fact:r.fact,insight:r.insight,src:r.source,tags:list(r.tags)}));

  /* 設定 → 重み */
  out.WEIGHTS = {
    ip:num(cfg.ip,0.30), verb:num(cfg.verb,0.22), emo:num(cfg.emo,0.18),
    aud:num(cfg.aud,0.12), tech:num(cfg.tech,0.18),
    penaltyLevel:1, engineRepeat:0.12, familyRepeat:0.06
  };
  out._meta = {version:cfg.version||'0', sheets:Object.keys(S).length};

  /* 検証 */
  if(out.PATTERNS.length < 5) errs.push('パターンが'+out.PATTERNS.length+'件しかありません');
  if(!out.ENGINES || Object.keys(out.ENGINES).length < 3) errs.push('エンジンが足りません');
  out.PATTERNS.forEach(p=>{
    if(!out.ENGINES[p.engine]) errs.push(p.id+': エンジン '+p.engine+' がありません');
    if(!p.oneline || !p.action) errs.push(p.id+': oneline か action が空です');
  });
  if(errs.length) throw new Error(errs.slice(0,6).join(' / '));
  return out;
}

/* ---------------- 適用 ---------------- */
function apply(db, mode){
  Object.keys(db).forEach(k=>{ if(k[0]!=='_') PK[k]=db[k]; });
  PK.DB_INFO = {mode:mode||'unknown', version:db._meta.version, patterns:PK.PATTERNS.length,
                engines:Object.keys(PK.ENGINES).length, at:new Date().toISOString()};
}

/* ---------------- 取得 ---------------- */
async function loadApi(url){
  const res = await fetch(url + (url.indexOf('?')<0?'?':'&') + 'action=db&v=' + Date.now());
  if(!res.ok) throw new Error('API '+res.status);
  const j = await res.json();
  if(!j || j.ok===false) throw new Error((j&&j.error)||'APIがエラーを返しました');
  const d = j.data || j;
  /* APIが整形済みJSONを返す場合 */
  if(Array.isArray(d.PATTERNS)) return d;
  /* シート名→CSV文字列 を返す場合 */
  return build(d);
}
async function loadCsv(base){
  const S = {};
  await Promise.all(SHEETS.map(async name=>{
    const res = await fetch(base + encodeURIComponent(name) + '.csv?t=' + Date.now());
    if(!res.ok) throw new Error(name+' を読めません ('+res.status+')');
    S[name] = await res.text();
  }));
  return build(S);
}

async function load(){
  const c = Object.assign({MODE:'local'}, window.PK_CONFIG||{});
  /* ?db=csv&base=... で上書きできる（動作確認・教員の検証用） */
  try{
    const q = new URLSearchParams(location.search);
    if(q.get('db')) c.MODE = q.get('db');
    if(q.get('base')) c.CSV_BASE = q.get('base');
    if(q.get('api')) c.API_URL = q.get('api');
  }catch(e){}
  const mode = (c.MODE||'local').toLowerCase();
  const chip = ()=>document.getElementById('dbChip');
  if(chip()) chip().textContent = 'DB…';
  try{
    if(mode==='api' && c.API_URL){ apply(await loadApi(c.API_URL),'api'); }
    else if(mode==='csv'){ apply(await loadCsv(c.CSV_BASE||'csv/'),'csv'); }
    else { PK.DB_INFO = {mode:'local', patterns:PK.PATTERNS.length, engines:Object.keys(PK.ENGINES).length}; }
    if(c.DEBUG) console.info('[PK//PROTO] DB:', PK.DB_INFO);
  }catch(e){
    console.warn('[PK//PROTO] DB読み込みに失敗:', e.message);
    if(c.FALLBACK!==false){
      PK.DB_INFO = {mode:'local(fallback)', error:e.message, patterns:PK.PATTERNS.length};
    }else{
      throw e;
    }
  }
  const el = chip();
  if(el){
    const m = PK.DB_INFO.mode;
    el.textContent = m==='local' ? 'LOCAL' : (m.indexOf('fallback')===0 ? 'LOCAL' : 'DB '+m.toUpperCase());
    el.className = 'db-chip ' + (m.indexOf('fallback')===0 ? 'warn' : (m==='local'?'local':'live'));
    el.title = m.indexOf('fallback')===0 ? ('DBに繋がりませんでした：'+PK.DB_INFO.error) : ('データ '+PK.DB_INFO.patterns+'件 / '+PK.DB_INFO.engines+'エンジン');
  }
  return PK.DB_INFO;
}

PK.db = { load, build, parseCSV, SHEETS };
})();
