import {aggregate,type Candle,HOUR,validateCandles} from './market.ts';
import {context,swings,decide,RULES,VERSION,type Analysis,type Context,type Structure} from './engine.ts';
export type Trade={symbol:string;side:string;entryTime:number;exitTime:number;entry:number;exit:number;stop:number;target:number;netR:number;netPct:number;exitReason:string;period:string};
export function exitPrice(c:Candle,p:{side:string;stop:number;target:number}):{price:number;reason:string}|null{
  const long=p.side==='LONG';
  if(long?c.open<=p.stop:c.open>=p.stop)return {price:c.open,reason:'STOP_GAP'};
  if(long?c.low<=p.stop:c.high>=p.stop)return {price:p.stop,reason:'STOP'};
  if(long?c.open>=p.target:c.open<=p.target)return {price:p.target,reason:'TARGET'};
  if(long?c.high>=p.target:c.low<=p.target)return {price:p.target,reason:'TARGET'};
  return null;
}
export function metrics(trades:Trade[]){const gains=trades.filter(t=>t.netR>0).reduce((s,t)=>s+t.netR,0),loss=-trades.filter(t=>t.netR<0).reduce((s,t)=>s+t.netR,0);let equity=0,peak=0,dd=0;for(const t of trades){equity+=t.netR;peak=Math.max(peak,equity);dd=Math.max(dd,peak-equity);}return {trades:trades.length,winRate:trades.length?100*trades.filter(t=>t.netR>0).length/trades.length:0,profitFactor:loss?gains/loss:null,meanR:trades.length?equity/trades.length:0,totalR:equity,maxDrawdownR:dd};}
export function bootstrap(trades:Trade[],runs=1000){
  let seed=1701;const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};const means:number[]=[];
  if(!trades.length)return {meanR95:[0,0],runs,blockSize:5};
  for(let k=0;k<runs;k++){let sum=0;for(let i=0;i<trades.length;i+=5){const start=Math.floor(rand()*trades.length);for(let j=0;j<5&&i+j<trades.length;j++)sum+=trades[(start+j)%trades.length].netR;}means.push(sum/trades.length);}
  means.sort((a,b)=>a-b);return {meanR95:[means[Math.floor(runs*.025)],means[Math.floor(runs*.975)]],runs,blockSize:5};
}
export function backtest(symbol:string,rows:Candle[],costPerSide:number=RULES.costPerSide){
  validateCandles(rows,HOUR);const four=aggregate(rows,4),day=aggregate(rows,24);
  const fContexts:(Context|null)[]=four.map((_,i)=>i>=79?context(four.slice(Math.max(0,i-299),i+1)):null);
  const dContexts:(Structure|null)[]=day.map((_,i)=>i>=59?swings(day.slice(Math.max(0,i-299),i+1)):null);
  let fi=-1,di=-1;let active:null|{plan:NonNullable<Analysis['plan']>;entry:number;entryTime:number}=null;const trades:Trade[]=[],seen=new Set<string>();let signals=0,waits=0;
  for(let i=0;i<rows.length;i++){
    const c=rows[i];
    if(active){const x=exitPrice(c,active.plan);if(x){const sign=active.plan.side==='LONG'?1:-1,risk=Math.abs(active.entry-active.plan.stop),net=sign*(x.price-active.entry)-costPerSide*(active.entry+x.price);const entryTime=active.entryTime;trades.push({symbol,side:active.plan.side,entryTime,exitTime:c.closeTime,entry:active.entry,exit:x.price,stop:active.plan.stop,target:active.plan.target,netR:net/risk,netPct:100*net/active.entry,exitReason:x.reason,period:entryTime<Date.UTC(2025,6,1)?'DEVELOPMENT':entryTime<Date.UTC(2026,0,1)?'OOS':'HOLDOUT'});active=null;}}
    while(fi+1<four.length&&four[fi+1].closeTime<=c.closeTime)fi++;
    while(di+1<day.length&&day[di+1].closeTime<=c.closeTime)di++;
    if(!fContexts[fi]||!dContexts[di]||i<80)continue;
    const a=decide(symbol,rows.slice(Math.max(0,i-99),i+1),fContexts[fi]!,dContexts[di]!);
    if(a.decision==='WAIT')waits++;
    if(a.plan&&!seen.has(a.plan.id)){
      signals++;seen.add(a.plan.id);if(active||!rows[i+1])continue;
      const entry=rows[i+1].open,sign=a.plan.side==='LONG'?1:-1,risk=sign*(entry-a.plan.stop);
      if(risk<=0||rows[i+1].time>a.plan.expires)continue;
      active={plan:{...a.plan,entry,riskPerUnit:risk,target:entry+sign*risk*RULES.targetR},entry,entryTime:rows[i+1].time};
    }
  }
  return {symbol,version:VERSION,signals,waits,trades,openAtEnd:active?{symbol,side:active.plan.side,entry:active.entry,entryTime:active.entryTime,unrealizedR:((rows.at(-1)!.close-active.entry)*(active.plan.side==='LONG'?1:-1))/active.plan.riskPerUnit}:null,metrics:metrics(trades)};
}
