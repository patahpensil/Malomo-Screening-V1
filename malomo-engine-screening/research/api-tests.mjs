import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {Miniflare}=createRequire(require.resolve('wrangler/package.json'))('miniflare');
const mf=new Miniflare({modules:[{type:'ESModule',path:'dist/server/index.js'},...fs.readdirSync('dist/server',{recursive:true}).filter(f=>f.endsWith('.js')&&f!=='index.js').map(path=>({type:'ESModule',path:'dist/server/'+path}))],modulesRoot:'dist/server',compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB']});
let checks=0;
const check=(value,message)=>{assert.ok(value,message);console.log('PASS',++checks,message);};
async function call(body,origin='http://localhost'){const r=await mf.dispatchFetch('http://localhost/api/workspace',body?{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)}:{});return {status:r.status,...await r.json()};}
try{
 const db=await mf.getD1Database('DB');for(const f of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')))for(const q of fs.readFileSync('drizzle/'+f,'utf8').split('--> statement-breakpoint'))if(q.trim())await db.prepare(q).run();
 let state=await call();check(state.status===200&&state.journal.length===0,'clean database migration and defaults');const defaults=state.settings;
 check((await call({action:'watch',symbol:'BTCUSDT',enabled:true},'https://other.example')).status===403,'foreign origin rejected');
 check((await call({action:'settings',settings:{...defaults,riskPct:4}})).status===400,'invalid risk rejected');
 await call({action:'watch',symbol:'BTCUSDT',enabled:true});check((await call()).watchlist.includes('BTCUSDT'),'watchlist persists');await call({action:'watch',symbol:'BTCUSDT',enabled:false});check(!(await call()).watchlist.length,'watchlist removal persists');
 const symbols=['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','DOGEUSDT'];
 let scan=await call({action:'scan',mode:'ARCHIVE',symbols});check(scan.results.length===6&&scan.results.every(r=>r.version&&!r.error),'all six archive decisions execute');
 await call({action:'scan',mode:'ARCHIVE',symbols});check((await call()).journal.length===6,'repeated same-candle scans are idempotent');
 await call({action:'note',id:scan.results[0].id,note:'Integration QA'});check((await call()).journal.some(j=>j.note==='Integration QA'),'journal note persists');
 let replay=await call({action:'scan',mode:'REPLAY',symbols:['BTCUSDT'],step:0});const signal=replay.results[0];check(signal.plan&&signal.trigger==='CONFIRMED','canonical replay is a valid structural signal');
 await call({action:'settings',settings:{...defaults,killSwitch:true}});check((await call({action:'createPaper',journalId:signal.id})).error==='KILL_SWITCH','server kill switch prevents new positions');await call({action:'settings',settings:defaults});
 let created=await call({action:'createPaper',journalId:signal.id});check(created.position.state==='WAITING_ENTRY','paper plan waits for next open');const id=created.position.id;
 check((await call({action:'createPaper',journalId:signal.id})).status===409,'duplicate plan rejected');
 await call({action:'scan',mode:'REPLAY',symbols:['BTCUSDT'],step:1});state=await call();let position=state.positions.find(p=>p.id===id);check(position.state==='ACTIVE'&&position.entryTime===signal.asOf+1,'next-open fill and active state');
 await call({action:'scan',mode:'REPLAY',symbols:['BTCUSDT'],step:0});check((await call()).positions.find(p=>p.id===id).lastTime===position.lastTime,'replaying older data never rewinds a position');
 let closed=await call({action:'closePaper',id});check(closed.position.state==='CLOSED'&&Number.isFinite(closed.position.netPnl),'manual paper close records net P&L');
 await call({action:'scan',mode:'REPLAY',symbols:['BTCUSDT'],step:2});check((await call()).positions.find(p=>p.id===id).state==='CLOSED','later scan does not reopen terminal position');
 const eth=(await call({action:'scan',mode:'REPLAY',symbols:['ETHUSDT'],step:0})).results[0];created=await call({action:'createPaper',journalId:eth.id});check(created.position.state==='WAITING_ENTRY','second pair paper plan created');check((await call({action:'closePaper',id:created.position.id})).position.state==='CANCELLED','waiting plan can be cancelled');
 const oldPacket=JSON.parse(fs.readFileSync('public/data/BTCUSDT.json','utf8'));let stale=await call({action:'scan',mode:'LIVE',symbols:['BTCUSDT'],packets:[oldPacket]});check(stale.results[0].error==='STALE_DATA','stale historical payload cannot masquerade as live');check((await call()).journal.some(j=>j.decision==='DATA_ERROR'),'data errors audited');
 const sol=(await call({action:'scan',mode:'REPLAY',symbols:['SOLUSDT'],step:0})).results[0];created=await call({action:'createPaper',journalId:sol.id});await call({action:'scan',mode:'REPLAY',symbols:['SOLUSDT'],step:96});position=(await call()).positions.find(p=>p.id===created.position.id);check(['ACTIVE','TARGET','STOPPED'].includes(position.state)&&position.lastTime>sol.asOf,'96-candle tracking reconciles in order');
 check((await call({action:'scan',mode:'REPLAY',symbols:['SOLUSDT'],step:97})).status===400,'out-of-range replay rejected');
 // Regression: legitimate UTF-8 and one-letter Binance symbols must not abort a scan.
 const freshPacket=symbol=>{const p=structuredClone(oldPacket);p.symbol=symbol;p.mode='LIVE';for(const [key,interval] of [['one',3600000],['four',14400000],['day',86400000]]){const end=Math.floor(Date.now()/interval)*interval-1;const shift=end-p[key].at(-1).closeTime;p[key]=p[key].map(c=>({...c,time:c.time+shift,closeTime:c.closeTime+shift}));}p.asOf=p.one.at(-1).closeTime;return p;};
 const mixed=['BTCUSDT','币安人生USDT','CUSDT','bad/pathUSDT'];
 const mixedScan=await call({action:'scan',mode:'LIVE',symbols:mixed,packets:mixed.map(freshPacket)});
 check(mixedScan.status===200&&mixedScan.results.length===4,'mixed live batch returns a result for every pair');
 check(mixedScan.results.slice(0,3).every(r=>r.version&&!r.error),'fresh ASCII, UTF-8 and one-character symbols reach engine');
 check(!!mixedScan.results[3].error,'invalid pair is isolated without rejecting valid peers');
 await call({action:'watch',symbol:'币安人生USDT',enabled:true});check((await call()).watchlist.includes('币安人生USDT'),'UTF-8 watchlist symbol round trips');
 await call({action:'watch',symbol:'币安人生USDT',enabled:false});
 const malformed=await call({action:'scan',mode:'LIVE',symbols:[null]});check(malformed.status===400&&malformed.details?.some(d=>d.field==='symbols.0'),'malformed request reports the invalid field');
 console.log(JSON.stringify({passed:checks,failed:0}));
}finally{await mf.dispose();}
