import {rawDb} from '@/lib/storage';
import {archives,replays,type Packet} from '@/lib/archives';
import {analyze,riskCheck,DEFAULT_RISK,VERSION,type RiskSettings} from '@/core/engine';
import {aggregate,validateCandles,TF,type Candle} from '@/core/market';
import {reconcile,closePaper,type Paper} from '@/core/paper';
import {z} from 'zod';
const riskSchema=z.object({equity:z.number().min(100).max(1e9),riskPct:z.number().min(.05).max(1),maxPortfolioRiskPct:z.number().min(.05).max(3),maxPositions:z.number().int().min(1).max(10),killSwitch:z.boolean()}).strict().refine(s=>s.riskPct<=s.maxPortfolioRiskPct,'Risiko per posisi melebihi batas portfolio.');
// Binance identifiers are UTF-8, case-sensitive, and may have a one-character base.
const symbolSchema=z.string().max(100).regex(/^[\p{L}\p{M}\p{N}]{1,48}USDT$/u,'Nama pair USDT tidak valid.');
async function settings(){const db=rawDb();await db.prepare('INSERT OR IGNORE INTO settings (id,payload) VALUES (?,?)').bind('risk',JSON.stringify(DEFAULT_RISK)).run();const row=await db.prepare('SELECT payload FROM settings WHERE id=?').bind('risk').first<any>();return riskSchema.parse(JSON.parse(row.payload));}
async function active(){const r=await rawDb().prepare("SELECT payload FROM positions WHERE state IN ('WAITING_ENTRY','ACTIVE')").all<any>();return r.results.map(x=>JSON.parse(x.payload) as Paper);}
const json=(data:any,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const db=rawDb();const [config,w,j,p]=await Promise.all([settings(),db.prepare('SELECT symbol FROM watchlist ORDER BY created_at DESC').all<any>(),db.prepare('SELECT * FROM journal ORDER BY created_at DESC LIMIT 200').all<any>(),db.prepare('SELECT payload FROM positions ORDER BY updated_at DESC LIMIT 200').all<any>()]);return json({settings:config,watchlist:w.results.map(x=>x.symbol),journal:j.results.map(x=>({...x,payload:JSON.parse(x.payload)})),positions:p.results.map(x=>JSON.parse(x.payload))});}catch(e){console.error('workspace_get',e);return json({error:'Penyimpanan tidak tersedia. Muat ulang untuk mencoba lagi.'},503);}}
function replayPacket(symbol:string,step:number):Packet{
 const p=replays[symbol];if(!p)throw Error('Replay tidak tersedia.');const one=[...p.one,...(p.future||[]).slice(0,step)];
 const merge=(a:Candle[],b:Candle[])=>[...new Map([...a,...b].map(c=>[c.time,c])).values()].sort((a,b)=>a.time-b.time);
 return {...p,one,four:merge(p.four,aggregate(one,4)),day:merge(p.day,aggregate(one,24)),asOf:one.at(-1)!.closeTime};
}
export async function POST(req:Request){
 try{
  const origin=req.headers.get('origin');if(origin&&new URL(origin).host!==new URL(req.url).host)return json({error:'Origin tidak diizinkan.'},403);
  if(!req.headers.get('content-type')?.includes('application/json'))return json({error:'JSON diperlukan.'},415);
  const text=await req.text();if(text.length>3_000_000)return json({error:'Permintaan terlalu besar.'},413);const body=JSON.parse(text);const db=rawDb();
  if(body.action==='watch'){
   const symbol=symbolSchema.parse(body.symbol);if(typeof body.enabled!=='boolean')throw Error('Pilihan watchlist tidak valid.');
   await (body.enabled?db.prepare('INSERT OR IGNORE INTO watchlist (symbol,created_at) VALUES (?,?)').bind(symbol,Date.now()):db.prepare('DELETE FROM watchlist WHERE symbol=?').bind(symbol)).run();return json({ok:true});
  }
  if(body.action==='settings'){const value=riskSchema.parse(body.settings);await db.prepare('INSERT INTO settings(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').bind('risk',JSON.stringify(value)).run();return json({ok:true,settings:value});}
  if(body.action==='note'){const id=z.string().max(200).parse(body.id),note=z.string().max(2000).parse(body.note);await db.prepare('UPDATE journal SET note=? WHERE id=?').bind(note,id).run();return json({ok:true});}
  if(body.action==='scan'){
   const {mode,step,symbols}=z.object({mode:z.enum(['ARCHIVE','REPLAY','LIVE']),step:z.number().int().min(0).max(96).default(0),symbols:z.array(z.string().max(100)).min(1).max(6)}).parse(body);const config=await settings();let positions=await active();const results=[];
   for(const symbol of symbols){
    try{
     symbolSchema.parse(symbol);
     let packet:Packet;
     if(mode==='LIVE'){
      packet=body.packets?.find((p:Packet)=>p.symbol===symbol);if(!packet)throw Error('Data live belum tersedia.');
      const now=Date.now();for(const [key,tf] of [['one','1h'],['four','4h'],['day','1d']] as const){if(!Array.isArray(packet[key])||packet[key].length>1200)throw Error('Ukuran candle tidak valid.');packet[key]=validateCandles(packet[key],TF[tf],now);const last=packet[key].at(-1);if(!last||now-last.closeTime>TF[tf]+120_000)throw Error('STALE_DATA');}
     }else packet=mode==='REPLAY'?replayPacket(symbol,step):archives[symbol];
     if(!packet)throw Error('Symbol tidak ada di arsip riset.');
     const a=analyze(symbol,packet.one,packet.four,packet.day);const id=`${VERSION}-${mode}-${symbol}-${a.asOf}`;
     // Reconcile existing paper positions before computing the new risk snapshot.
     for(let i=0;i<positions.length;i++)if(positions[i].symbol===symbol&&positions[i].mode===mode){const previous=JSON.stringify(positions[i]),p=reconcile(positions[i],packet.one);const updated=await db.prepare('UPDATE positions SET state=?,risk_amount=?,payload=?,updated_at=? WHERE id=? AND payload=?').bind(p.state,p.riskAmount,JSON.stringify(p),Date.now(),p.id,previous).run();if(updated.meta.changes)positions[i]=p;else{const current=await db.prepare('SELECT payload FROM positions WHERE id=?').bind(p.id).first<any>();if(current)positions[i]=JSON.parse(current.payload);}}
     const risk=a.plan?riskCheck(a.plan,config,positions.filter(p=>['WAITING_ENTRY','ACTIVE'].includes(p.state))):null;
     const payload={...a,risk,mode,id};await db.prepare('INSERT OR IGNORE INTO journal (id,symbol,as_of,mode,decision,payload,note,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,symbol,a.asOf,mode,a.decision,JSON.stringify(payload),'',Date.now()).run();results.push(payload);
    }catch(e){const error=e instanceof z.ZodError?'Nama pair USDT tidak valid.':e instanceof Error?e.message:'Scan gagal';const now=Date.now(),id=`ERROR-${symbol}-${now}`;await db.prepare('INSERT INTO journal (id,symbol,as_of,mode,decision,payload,note,created_at) VALUES(?,?,?,?,?,?,?,?)').bind(id,symbol,now,mode,'DATA_ERROR',JSON.stringify({symbol,reason:error,mode}),'',now).run();results.push({symbol,error});}
   }
   return json({results});
  }
  if(body.action==='createPaper'){
   const id=z.string().max(200).parse(body.journalId);const row=await db.prepare('SELECT payload FROM journal WHERE id=?').bind(id).first<any>();if(!row)return json({error:'Keputusan tidak ditemukan.'},404);
   const a=JSON.parse(row.payload);if(!a.plan||a.trigger!=='CONFIRMED')throw Error('Keputusan tidak memiliki trade plan valid.');
   if(a.mode==='LIVE'&&Date.now()>a.plan.expires)throw Error('Trade plan sudah kedaluwarsa.');
   const config=await settings(),risk=riskCheck(a.plan,config,await active());if(!risk.pass)throw Error(risk.reason);
   const paper:Paper={id:`${a.mode}-${a.plan.id}`,symbol:a.symbol,mode:a.mode,state:'WAITING_ENTRY',plan:a.plan,quantity:risk.quantity,riskAmount:risk.riskAmount,signalTime:a.asOf,lastTime:a.asOf};
   const result=await db.prepare(`INSERT OR IGNORE INTO positions(id,symbol,mode,state,risk_amount,payload,updated_at)
     SELECT ?,?,?,?,?,?,? WHERE
     (SELECT COUNT(*) FROM positions WHERE state IN ('WAITING_ENTRY','ACTIVE')) < ?
     AND (SELECT COALESCE(SUM(risk_amount),0) FROM positions WHERE state IN ('WAITING_ENTRY','ACTIVE')) + ? <= ?
     AND COALESCE((SELECT json_extract(payload,'$.killSwitch') FROM settings WHERE id='risk'),1)=0
     AND NOT EXISTS (SELECT 1 FROM positions WHERE symbol=? AND state IN ('WAITING_ENTRY','ACTIVE'))`).bind(paper.id,paper.symbol,paper.mode,paper.state,paper.riskAmount,JSON.stringify(paper),Date.now(),config.maxPositions,paper.riskAmount,config.equity*config.maxPortfolioRiskPct/100,paper.symbol).run();
   if(!result.meta.changes)return json({error:'Plan duplikat, posisi pair masih aktif, atau batas risiko tercapai.'},409);return json({ok:true,position:paper});
  }
  if(body.action==='closePaper'){
   const id=z.string().max(250).parse(body.id),row=await db.prepare('SELECT payload FROM positions WHERE id=?').bind(id).first<any>();if(!row)return json({error:'Posisi tidak ditemukan.'},404);const previous=row.payload;let p=JSON.parse(row.payload) as Paper;
   if(p.state==='WAITING_ENTRY')p={...p,state:'CANCELLED'};
   else if(p.state==='ACTIVE'){
    const latest=await db.prepare('SELECT payload FROM journal WHERE symbol=? AND mode=? AND as_of>=? AND decision<>? ORDER BY as_of DESC LIMIT 1').bind(p.symbol,p.mode,p.lastTime,'DATA_ERROR').first<any>();if(!latest)throw Error('Perbarui scan sebelum menutup posisi.');const a=JSON.parse(latest.payload);if(!Number.isFinite(a.price))throw Error('Harga belum tersedia.');if(p.mode==='LIVE'&&Date.now()-a.asOf>TF['1h']+120000)throw Error('Harga kedaluwarsa; scan ulang.');p=closePaper(p,a.price,a.asOf);
   }else throw Error('Posisi sudah selesai.');
   const result=await db.prepare('UPDATE positions SET state=?,payload=?,updated_at=? WHERE id=? AND payload=?').bind(p.state,JSON.stringify(p),Date.now(),p.id,previous).run();if(!result.meta.changes)return json({error:'Posisi diperbarui oleh scan lain. Muat ulang dan coba lagi.'},409);return json({ok:true,position:p});
  }
  return json({error:'Aksi tidak dikenal.'},400);
 }catch(e){const details=e instanceof z.ZodError?e.issues.map(i=>({field:i.path.join('.'),message:i.message})):undefined;console.error('workspace_post',details||e);return json({error:details?`Input tidak valid pada ${details.map(d=>d.field||'permintaan').join(', ')}.`:e instanceof Error?e.message:'Permintaan gagal.',...(details?{details}:{})},400);}
}
