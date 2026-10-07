import fs from 'node:fs';
import {analyze} from '../core/engine.ts';
import {aggregate,type Candle} from '../core/market.ts';
const r=JSON.parse(fs.readFileSync('research/RESULTS.json','utf8'));
for(const symbol of ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','DOGEUSDT']){
 const rows=JSON.parse(fs.readFileSync(`public/data/history-${symbol}.json`,'utf8')) as Candle[];
 const t=r.trades.filter((t:any)=>t.symbol===symbol).at(-1);if(!t)continue;
 const i=rows.findIndex(c=>c.time===t.entryTime)-1,one=rows.slice(i-799,i+1),four=aggregate(rows,4).filter(c=>c.closeTime<=one.at(-1)!.closeTime).slice(-400),day=aggregate(rows,24).filter(c=>c.closeTime<=one.at(-1)!.closeTime).slice(-350);
 const analysis=analyze(symbol,one,four,day);if(!analysis.plan)throw Error(`${symbol} replay not causal`);
 fs.writeFileSync(`public/data/replay-${symbol}.json`,JSON.stringify({symbol,source:'Binance official public archive',mode:'REPLAY',asOf:one.at(-1)!.closeTime,one,four,day,future:rows.slice(i+1,i+97),analysis}));
}
