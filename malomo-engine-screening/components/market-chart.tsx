'use client';
import {useState} from 'react';
import type {Candle} from '@/core/market';
import {Button} from '@/components/ui/button';
import {Minus,Plus} from 'lucide-react';
export function MarketChart({candles,symbol}:{candles:Candle[];symbol:string}){
 const [length,setLength]=useState(72),[hover,setHover]=useState<number|null>(null);const rows=candles.slice(-length);if(!rows.length)return <div className="chart-empty">Belum ada candle tervalidasi.</div>;
 const W=940,H=300,L=12,R=90,T=12,B=62;const lo=Math.min(...rows.map(c=>c.low)),hi=Math.max(...rows.map(c=>c.high)),padding=(hi-lo)*.12||1,min=lo-padding,max=hi+padding,step=(W-L-R)/rows.length;
 const y=(p:number)=>T+(max-p)/(max-min)*(H-T-B);const active=rows[hover??rows.length-1]||rows.at(-1)!;const volume=Math.max(...rows.map(c=>c.quoteVolume));
 const price=(p:number)=>p.toLocaleString('en-US',{maximumFractionDigits:p<1?5:2});
 return <div className="market-chart"><div className="ohlc"><span>O <b>{price(active.open)}</b></span><span>H <b>{price(active.high)}</b></span><span>L <b>{price(active.low)}</b></span><span>C <b className={active.close>=active.open?'positive':'negative'}>{price(active.close)}</b></span><span className="chart-legend">Volume (USDT)</span></div>
 <svg role="img" aria-label={`${symbol} candlestick chart, ${rows.length} candle historis`} viewBox={`0 0 ${W} ${H}`} onMouseLeave={()=>setHover(null)} onMouseMove={e=>{const b=e.currentTarget.getBoundingClientRect();setHover(Math.max(0,Math.min(rows.length-1,Math.floor(((e.clientX-b.left)/b.width*W-L)/step))));}}>
 {Array.from({length:5},(_,i)=>{const v=min+(max-min)*i/4;return <g key={i}><line x1={L} x2={W-R} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="3 5"/><text x={W-R+12} y={y(v)+4} fill="var(--muted-foreground)" fontSize="12">{price(v)}</text></g>;})}
 {rows.map((c,i)=>{const x=L+step*(i+.5),color=c.close>=c.open?'#66cf9f':'#ed8585';return <g key={c.time}><rect x={x-step*.3} width={Math.max(1,step*.6)} y={H-28-(c.quoteVolume/volume)*24} height={(c.quoteVolume/volume)*24} fill={color} opacity=".24"/><line x1={x} x2={x} y1={y(c.high)} y2={y(c.low)} stroke={color}/><rect x={x-step*.3} width={Math.max(1,step*.6)} y={y(Math.max(c.open,c.close))} height={Math.max(1,Math.abs(y(c.open)-y(c.close)))} fill={color}/>{i%Math.max(1,Math.floor(rows.length/6))===0&&<text x={x} y={H-6} fill="var(--muted-foreground)" fontSize="12">{new Date(c.time).toLocaleDateString('en-GB',{day:'2-digit',month:'short',timeZone:'Asia/Makassar'})}</text>}</g>;})}
 {hover!==null&&<line x1={L+step*(hover+.5)} x2={L+step*(hover+.5)} y1={T} y2={H-25} stroke="#b9c6d4" strokeDasharray="3 4"/>}
 <line x1={L} x2={W-R} y1={y(rows.at(-1)!.close)} y2={y(rows.at(-1)!.close)} stroke="#c2ec99" strokeDasharray="2 4" opacity=".5"/>
 </svg><div className="chart-foot"><span>{hover===null?'Arahkan kursor untuk detail OHLC':new Date(active.time).toLocaleString('id-ID',{timeZone:'Asia/Makassar'})+' WITA'}</span><div><Button size="icon-sm" variant="ghost" aria-label="Perkecil chart" disabled={length>=180} onClick={()=>setLength(Math.min(180,length+24))}><Minus size={15}/></Button><Button size="icon-sm" variant="ghost" aria-label="Perbesar chart" disabled={length<=24} onClick={()=>setLength(Math.max(24,length-24))}><Plus size={15}/></Button></div></div></div>;
}
