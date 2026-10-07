import type {Candle} from './market.ts';
import {HOUR} from './market.ts';
import {RULES,type Analysis} from './engine.ts';
import {exitPrice} from './backtest.ts';
export type Paper={id:string;symbol:string;mode:string;state:string;plan:NonNullable<Analysis['plan']>;quantity:number;riskAmount:number;signalTime:number;lastTime:number;entryTime?:number;exitTime?:number;exit?:number;netPnl?:number;note?:string;trackingError?:string};
export function reconcile(p:Paper,candles:Candle[]):Paper{
  if(!['WAITING_ENTRY','ACTIVE'].includes(p.state))return p;
  let next={...p,plan:{...p.plan},trackingError:''};const bars=candles.filter(c=>c.time>p.lastTime);
  if(bars.length&&bars[0].time!==p.lastTime+1)return {...p,trackingError:'DATA_GAP: muat kembali candle sejak pembaruan terakhir.'};
  for(const c of bars){
    if(next.state==='WAITING_ENTRY'){
      if(c.time>next.plan.expires)return {...next,state:'INVALIDATED',lastTime:c.closeTime};
      const sign=next.plan.side==='LONG'?1:-1,risk=(c.open-next.plan.stop)*sign;
      if(risk<=0)return {...next,state:'INVALIDATED',lastTime:c.closeTime};
      next.plan={...next.plan,entry:c.open,riskPerUnit:risk,target:c.open+sign*risk*RULES.targetR};
      next.quantity=Math.min(next.quantity,next.riskAmount/risk);next.riskAmount=next.quantity*risk;
      next.entryTime=c.time;next.state='ACTIVE';
    }
    const out=exitPrice(c,next.plan);next.lastTime=c.closeTime;
    if(out)return closePaper(next,out.price,c.closeTime,out.reason.startsWith('STOP')?'STOPPED':'TARGET');
  }
  return next;
}
export function closePaper(p:Paper,price:number,time:number,state='CLOSED'):Paper{
  const sign=p.plan.side==='LONG'?1:-1;
  return {...p,state,exit:price,exitTime:time,lastTime:time,netPnl:p.quantity*(sign*(price-p.plan.entry)-RULES.costPerSide*(p.plan.entry+price))};
}
