import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {aggregate,type Candle} from '../core/market.ts';
import {analyze} from '../core/engine.ts';
import {backtest} from '../core/backtest.ts';
const symbols=['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','DOGEUSDT'];
test('CAUSALITY: closed trades before a cut are identical without later candles',()=>{
 const rows=JSON.parse(fs.readFileSync('public/data/history-BTCUSDT.json','utf8')) as Candle[];
 const full=backtest('BTCUSDT',rows);
 for(const end of [Date.UTC(2025,7,1),Date.UTC(2026,2,1),Date.UTC(2026,6,1)]){
  const prefix=rows.filter(c=>c.closeTime<end),result=backtest('BTCUSDT',prefix);
  assert.deepEqual(result.trades,full.trades.filter(t=>t.exitTime<end));
 }
});
test('REPLAY: all six archived setups reproduce using only their historical prefix',()=>{
 for(const symbol of symbols){
  const packet=JSON.parse(fs.readFileSync(`public/data/replay-${symbol}.json`,'utf8'));
  const rows=(JSON.parse(fs.readFileSync(`public/data/history-${symbol}.json`,'utf8')) as Candle[]).filter(c=>c.closeTime<=packet.asOf);
  const result=analyze(symbol,rows.slice(-800),aggregate(rows,4).slice(-400),aggregate(rows,24).slice(-350));
  assert.deepEqual(result,packet.analysis);assert.ok(result.plan);assert.equal(result.trigger,'CONFIRMED');
 }
});
