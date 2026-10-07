export type Candle = {time:number; closeTime:number; open:number; high:number; low:number; close:number; volume:number; quoteVolume:number; takerBuyQuote:number};
export const HOUR=3_600_000;
export const TF={"1h":HOUR,"4h":4*HOUR,"1d":24*HOUR} as const;
export type Timeframe=keyof typeof TF;
export function validateCandles(rows:Candle[],interval:number,asOf=Infinity):Candle[]{
  const closed=rows.filter(c=>c.closeTime<asOf);
  for(let i=0;i<closed.length;i++){
    const c=closed[i];
    if(![c.time,c.closeTime,c.open,c.high,c.low,c.close,c.volume,c.quoteVolume,c.takerBuyQuote].every(Number.isFinite)||c.open<=0||c.low<=0||c.volume<0||c.quoteVolume<0||c.takerBuyQuote<0||c.takerBuyQuote>c.quoteVolume+0.01||c.high<Math.max(c.open,c.close)||c.low>Math.min(c.open,c.close)||c.high<c.low||c.closeTime!==c.time+interval-1||c.time%interval!==0)throw new Error("INVALID_CANDLE");
    if(i&&c.time!==closed[i-1].time+interval)throw new Error("DATA_GAP_OR_DUPLICATE");
  }
  return closed;
}
export function fromBinance(rows:unknown,tf:Timeframe,asOf=Date.now()):Candle[]{
  if(!Array.isArray(rows))throw new Error("INVALID_BINANCE_RESPONSE");
  return validateCandles(rows.map((r:any)=>({time:+r[0],open:+r[1],high:+r[2],low:+r[3],close:+r[4],volume:+r[5],closeTime:+r[6],quoteVolume:+r[7],takerBuyQuote:+r[10]})),TF[tf],asOf);
}
export function aggregate(rows:Candle[],hours:number):Candle[]{
  const buckets=new Map<number,Candle[]>();
  for(const c of rows){const t=Math.floor(c.time/(hours*HOUR))*hours*HOUR;const b=buckets.get(t)||[];b.push(c);buckets.set(t,b);}
  return [...buckets.entries()].filter(([t,b])=>b.length===hours&&b[0].time===t&&b.every((c,i)=>c.time===t+i*HOUR)).map(([t,b])=>({time:t,closeTime:t+hours*HOUR-1,open:b[0].open,high:Math.max(...b.map(c=>c.high)),low:Math.min(...b.map(c=>c.low)),close:b.at(-1)!.close,volume:b.reduce((a,c)=>a+c.volume,0),quoteVolume:b.reduce((a,c)=>a+c.quoteVolume,0),takerBuyQuote:b.reduce((a,c)=>a+c.takerBuyQuote,0)}));
}
export function universe(exchange:any,tickers:any[],limit=50){
  const eligible=new Set((exchange.symbols||[]).filter((s:any)=>s.contractType==="PERPETUAL"&&s.status==="TRADING"&&s.quoteAsset==="USDT"&&s.marginAsset==="USDT").map((s:any)=>s.symbol));
  return tickers.filter(t=>eligible.has(t.symbol)&&Number.isFinite(+t.quoteVolume)&&+t.quoteVolume>0).sort((a,b)=>+b.quoteVolume-+a.quoteVolume||a.symbol.localeCompare(b.symbol)).slice(0,Math.max(1,Math.min(250,limit)));
}
