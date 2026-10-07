import fs from 'node:fs';
import crypto from 'node:crypto';
import {backtest,metrics,bootstrap,type Trade} from '../core/backtest.ts';
import {aggregate,validateCandles,HOUR,type Candle} from '../core/market.ts';
import {analyze,VERSION,RULES} from '../core/engine.ts';
const root=process.env.MALOMO_HISTORY_DIR||'public/data';
const historyPath=(symbol:string)=>fs.existsSync(`${root}/${symbol}.json`)&&root!=='public/data'?`${root}/${symbol}.json`:`${root}/history-${symbol}.json`;
const symbols=['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','DOGEUSDT'];
let trades:Trade[]=[],stress:Trade[]=[];const perPair:any[]=[],open:any[]=[],snapshots:any[]=[];
for(const symbol of symbols){
 const rows=JSON.parse(fs.readFileSync(historyPath(symbol),'utf8')) as Candle[];validateCandles(rows,HOUR);
 const result=backtest(symbol,rows),doubleCost=backtest(symbol,rows,RULES.costPerSide*2);trades.push(...result.trades);stress.push(...doubleCost.trades);perPair.push({symbol,...result.metrics,holdout:metrics(result.trades.filter(t=>t.period==='HOLDOUT'))});if(result.openAtEnd)open.push(result.openAtEnd);
 const one=rows.slice(-800),four=aggregate(rows,4).slice(-400),day=aggregate(rows,24).slice(-350);const analysis=analyze(symbol,one,four,day);
 const snapshot={symbol,source:'Binance official public archive',mode:'ARCHIVE',asOf:rows.at(-1)!.closeTime,one,four,day,analysis};fs.writeFileSync(`public/data/${symbol}.json`,JSON.stringify(snapshot));snapshots.push({symbol,asOf:snapshot.asOf,analysis,quoteVolume24h:one.slice(-24).reduce((s,c)=>s+c.quoteVolume,0)});
 console.log(symbol,result.metrics);
}
trades.sort((a,b)=>a.exitTime-b.exitTime||a.symbol.localeCompare(b.symbol));stress.sort((a,b)=>a.exitTime-b.exitTime||a.symbol.localeCompare(b.symbol));
const periods=['DEVELOPMENT','OOS','HOLDOUT'].map(period=>({period,...metrics(trades.filter(t=>t.period===period)),bootstrap:bootstrap(trades.filter(t=>t.period===period))}));
const holdout=periods[2];const passed=holdout.trades>=100&&holdout.profitFactor!==null&&holdout.profitFactor>1&&holdout.bootstrap.meanR95[0]>0&&perPair.filter(p=>p.holdout.totalR>0).length>=4;
const report={version:VERSION,rules:RULES,source:'Binance USD-M public archive / 1h',start:'2025-01-01',end:'2026-09-30',generatedAt:new Date().toISOString(),verdict:passed?'RESEARCH_PASS':'NOT_VALIDATED',scope:'Research screening and paper trading only',limitations:['Funding not modeled: verdict is conditional and cannot authorize real-money execution.','Six fixed surviving pairs; dynamic-universe and delisting bias not measured.','No portfolio-level return estimate.','Holdout consumed by this report; future revisions require a fresh holdout.'],overall:metrics(trades),doubleCost:metrics(stress),periods,perPair,openAtEnd:open,topWinnerRemoval:[1,3,5].map(n=>({removed:n,...metrics([...trades].sort((a,b)=>b.netR-a.netR).slice(n).sort((a,b)=>a.exitTime-b.exitTime))})),bootstrap:bootstrap(trades),equity:trades.reduce((a:any[],t)=>{a.push({time:t.exitTime,r:(a.at(-1)?.r||0)+t.netR});return a;},[]),trades};
fs.writeFileSync('public/data/research.json',JSON.stringify(report));fs.writeFileSync('public/data/universe.json',JSON.stringify({mode:'ARCHIVE',source:report.source,asOf:snapshots[0].asOf,items:snapshots.sort((a,b)=>b.quoteVolume24h-a.quoteVolume24h)}));
fs.writeFileSync('research/RESULTS.json',JSON.stringify(report,null,2));if(fs.existsSync(`${root}/manifest.json`))fs.copyFileSync(`${root}/manifest.json`,'research/DATA_MANIFEST.json');
const hashes=['core/market.ts','core/engine.ts','core/backtest.ts'].map(p=>({path:p,sha256:crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')}));fs.writeFileSync('research/ENGINE_HASHES.json',JSON.stringify(hashes,null,2));
console.log(JSON.stringify({verdict:report.verdict,periods,overall:report.overall,doubleCost:report.doubleCost,open:open.length},null,2));
