import type {Candle} from './market.ts';
import type {Analysis, Context} from './engine.ts';

// Display-only trigger references. They do not place an order or set an entry price.
export function pendingTrigger(a:Analysis, one:Candle[], four:Context){
  const c=one.at(-1), previous=one.at(-2), setup=four.setup;
  if(!c||!previous||!setup||a.decision!=='WAIT'||a.asOf!==c.closeTime||
     a.direction!==four.direction||!['BULLISH','BEARISH'].includes(a.direction)||
     setup.side!==(a.direction==='BULLISH'?'LONG':'SHORT')||
     c.closeTime<setup.time||c.closeTime>setup.expires||
     (setup.side==='LONG'?c.close<=setup.stop:c.close>=setup.stop))return null;
  const long=setup.side==='LONG';
  return {
    side:setup.side,
    breakout:long?setup.high:setup.low,
    breakoutReady:long?previous.close<=setup.high:previous.close>=setup.low,
    retestTouch:setup.level,
    retestClose:long?Math.max(setup.level,previous.high):Math.min(setup.level,previous.low),
    stop:setup.stop,
    expires:setup.expires,
  };
}
