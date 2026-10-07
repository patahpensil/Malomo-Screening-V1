import {type Candle,HOUR} from './market.ts';
export const VERSION='malomo-research-1.0.0';
export const RULES=Object.freeze({fractalSides:2,setupExpiryHours:12,targetR:2,costPerSide:0.0005,minDailyBars:60,minFourHourBars:80});
export type Direction='BULLISH'|'BEARISH'|'NEUTRAL'|'TRANSITION';
export type Swing={price:number;time:number;confirmedAt:number;index:number};
export type Structure={direction:Direction;highs:Swing[];lows:Swing[]};
export function swings(bars:Candle[]):Structure{
  const highs:Swing[]=[],lows:Swing[]=[];
  for(let i=2;i<bars.length-2;i++){
    const c=bars[i],others=[bars[i-2],bars[i-1],bars[i+1],bars[i+2]];
    if(others.every(x=>c.high>x.high))highs.push({price:c.high,time:c.time,confirmedAt:bars[i+2].closeTime,index:i});
    if(others.every(x=>c.low<x.low))lows.push({price:c.low,time:c.time,confirmedAt:bars[i+2].closeTime,index:i});
  }
  let direction:Direction='NEUTRAL';const [h0,h1]=highs.slice(-2),[l0,l1]=lows.slice(-2);const last=bars.at(-1);
  if(h0&&h1&&l0&&l1&&last){
    if(h1.price>h0.price&&l1.price>l0.price)direction=last.close<l1.price?'TRANSITION':'BULLISH';
    else if(h1.price<h0.price&&l1.price<l0.price)direction=last.close>h1.price?'TRANSITION':'BEARISH';
    else direction='TRANSITION';
  }
  return {direction,highs,lows};
}
export function atr(bars:Candle[],period=14){const tail=bars.slice(-(period+1));if(tail.length<period+1)return 0;return tail.slice(1).reduce((s,c,i)=>s+Math.max(c.high-c.low,Math.abs(c.high-tail[i].close),Math.abs(c.low-tail[i].close)),0)/period;}
const mean=(v:number[])=>v.length?v.reduce((a,b)=>a+b,0)/v.length:0;
export function quality(bars:Candle[]){
  const c=bars.at(-1);if(!c)return {momentum:'NEUTRAL',participation:'UNAVAILABLE',volatility:'UNAVAILABLE',location:'UNAVAILABLE',rvol:0,atr:0,takerRatio:0,change:0};
  const a=atr(bars),baseline=mean(bars.slice(-21,-1).map(x=>x.quoteVolume)),rvol=baseline?c.quoteVolume/baseline:0;
  const move=c.close-(bars.at(-4)?.close||c.close),takerRatio=c.quoteVolume?c.takerBuyQuote/c.quoteVolume:0.5;
  const history=bars.slice(-80,-1),ranges=history.map(x=>(x.high-x.low)/x.close).sort((a,b)=>a-b);const normalized=(c.high-c.low)/c.close;const percentile=ranges.length?ranges.filter(x=>x<normalized).length/ranges.length:0.5;
  const hi=Math.max(...bars.slice(-20).map(x=>x.high)),lo=Math.min(...bars.slice(-20).map(x=>x.low));
  return {momentum:move>0?'BULLISH':move<0?'BEARISH':'NEUTRAL',participation:takerRatio>0.5?'BUY_DOMINANT':takerRatio<0.5?'SELL_DOMINANT':'BALANCED',volatility:percentile>=0.95?'EXTREME':percentile>=0.75?'EXPANDING':percentile<=0.25?'LOW':'NORMAL',location:hi===lo?'MID_RANGE':(c.close-lo)/(hi-lo)>0.8?'UPPER_RANGE':(c.close-lo)/(hi-lo)<0.2?'LOWER_RANGE':'MID_RANGE',rvol,atr:a,takerRatio,change:bars.length>24?(c.close/bars.at(-25)!.close-1)*100:0};
}
export type Setup={id:string;side:'LONG'|'SHORT';level:number;stop:number;high:number;low:number;time:number;expires:number};
export type Context={asOf:number;direction:Direction;structure:Structure;setup:Setup|null};
export function context(bars:Candle[]):Context{
  const structure=swings(bars),c=bars.at(-1)!;let setup:Setup|null=null;
  for(let k=Math.max(5,bars.length-3);k<bars.length;k++){
    const before=swings(bars.slice(0,k)),h=before.highs.at(-1),l=before.lows.at(-1),b=bars[k],prev=bars[k-1];
    if(!h||!l)continue;
    const side=b.close>h.price&&prev.close<=h.price?'LONG':b.close<l.price&&prev.close>=l.price?'SHORT':null;
    if(side){const level=side==='LONG'?h.price:l.price;setup={id:`${b.closeTime}-${side}`,side,level,stop:side==='LONG'?l.price:h.price,high:b.high,low:b.low,time:b.closeTime,expires:b.closeTime+12*HOUR};}
  }
  return {asOf:c?.closeTime||0,direction:structure.direction,structure,setup};
}
export type Analysis={symbol:string;version:string;asOf:number;direction:Direction;fourHour:Direction;setup:string;trigger:string;decision:'LONG'|'SHORT'|'WAIT'|'NO_TRADE';reason:string;price:number;quality:ReturnType<typeof quality>;plan:null|{id:string;side:'LONG'|'SHORT';entry:number;stop:number;target:number;riskPerUnit:number;rr:number;expires:number;setupTime:number};};
export function decide(symbol:string,one:Candle[],four:Context,daily:Structure):Analysis{
  const c=one.at(-1)!,p=one.at(-2),q=quality(one),s=four.setup;
  const out:Analysis={symbol,version:VERSION,asOf:c?.closeTime||0,direction:daily.direction,fourHour:four.direction,setup:'NO_SETUP',trigger:'NOT_READY',decision:'NO_TRADE',reason:'Arah 1D dan 4H belum selaras.',price:c?.close||0,quality:q,plan:null};
  if(!c||!p)return {...out,reason:'DATA_INCOMPLETE'};
  const side=daily.direction==='BULLISH'&&four.direction==='BULLISH'?'LONG':daily.direction==='BEARISH'&&four.direction==='BEARISH'?'SHORT':null;
  if(!side)return out;
  if(!s||s.side!==side)return {...out,decision:'WAIT',reason:'Arah selaras; menunggu setup struktur 4H.'};
  if(c.closeTime<=s.time||c.closeTime>s.expires)return {...out,decision:'WAIT',reason:'Belum ada trigger 1H dalam masa berlaku setup.'};
  if(side==='LONG'?c.close<=s.stop:c.close>=s.stop)return {...out,reason:'Struktur invalidasi tertembus.'};
  const breakout=side==='LONG'?c.close>s.high&&p.close<=s.high:c.close<s.low&&p.close>=s.low;
  const retest=side==='LONG'?c.low<=s.level&&c.close>s.level&&c.close>p.high:c.high>=s.level&&c.close<s.level&&c.close<p.low;
  out.setup=retest?'RETEST':side==='LONG'?'BREAKOUT':'BREAKDOWN';
  if(!breakout&&!retest)return {...out,decision:'WAIT',reason:'Setup aktif; menunggu close 1H menembus ekstrem atau reclaim retest.'};
  const risk=side==='LONG'?c.close-s.stop:s.stop-c.close;
  if(risk<=0)return {...out,reason:'Jarak stop tidak valid.'};
  return {...out,trigger:'CONFIRMED',decision:side,reason:'Direction, setup, dan trigger terpenuhi. Kandidat riset; evaluasi risk terpisah.',plan:{id:`${VERSION}-${symbol}-${s.id}`,side,entry:c.close,stop:s.stop,target:c.close+(side==='LONG'?1:-1)*risk*RULES.targetR,riskPerUnit:risk,rr:RULES.targetR,expires:s.expires,setupTime:s.time}};
}
export function analyze(symbol:string,one:Candle[],four:Candle[],day:Candle[]):Analysis{
  if(one.length<80||four.length<RULES.minFourHourBars||day.length<RULES.minDailyBars)throw new Error('INSUFFICIENT_HISTORY');
  return decide(symbol,one.slice(-100),context(four.slice(-300)),swings(day.slice(-300)));
}
export type RiskSettings={equity:number;riskPct:number;maxPortfolioRiskPct:number;maxPositions:number;killSwitch:boolean};
export const DEFAULT_RISK:RiskSettings={equity:10000,riskPct:0.5,maxPortfolioRiskPct:1.5,maxPositions:3,killSwitch:false};
export function riskCheck(plan:NonNullable<Analysis['plan']>,settings:RiskSettings,open:{riskAmount:number}[]=[]){
  const {equity,riskPct,maxPortfolioRiskPct,maxPositions,killSwitch}=settings;
  const base={pass:false,quantity:0,riskAmount:0,notional:0,reason:''};
  if(killSwitch)return {...base,reason:'KILL_SWITCH'};
  if(![equity,riskPct,maxPortfolioRiskPct,maxPositions,plan.entry,plan.stop,plan.riskPerUnit].every(Number.isFinite)||equity<=0||riskPct<=0||riskPct>1||maxPortfolioRiskPct<=0||maxPortfolioRiskPct>3||maxPositions<1||maxPositions>10||plan.entry<=0||plan.stop<=0||plan.riskPerUnit<=0)return {...base,reason:'INVALID_RISK_INPUT'};
  if(open.length>=maxPositions)return {...base,reason:'MAX_POSITIONS'};
  const riskAmount=equity*riskPct/100;
  if(open.reduce((s,p)=>s+p.riskAmount,0)+riskAmount>equity*maxPortfolioRiskPct/100+1e-8)return {...base,reason:'PORTFOLIO_RISK_LIMIT'};
  const quantity=Math.min(riskAmount/plan.riskPerUnit,equity/plan.entry);
  return {pass:true,quantity,riskAmount:quantity*plan.riskPerUnit,notional:quantity*plan.entry,reason:'PASS_PAPER'};
}
