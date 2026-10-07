import {fromBinance,universe} from '@/core/market';
import type {Packet} from './archives';
const BASE='https://fapi.binance.com';
async function get(path:string):Promise<any>{let r:Response;try{r=await fetch(BASE+path,{signal:AbortSignal.timeout(12000)});}catch{throw Error('REST Binance tidak dapat dijangkau. Periksa akses jaringan/lokasi; data live belum tersedia.');}if(!r.ok)throw Error(`Binance HTTP ${r.status}. Koneksi live tidak tersedia dari lokasi ini.`);return r.json();}
export async function liveUniverse(limit:number){const [info,tickers]=await Promise.all([get('/fapi/v1/exchangeInfo'),get('/fapi/v1/ticker/24hr')]);return universe(info,tickers,limit);}
export async function livePacket(symbol:string):Promise<Packet>{
 const [one,four,day]=await Promise.all(['1h','4h','1d'].map(tf=>get(`/fapi/v1/klines?symbol=${encodeURIComponent(symbol)}&interval=${tf}&limit=400`)));
 const closed=fromBinance(one,'1h');return {symbol,mode:'LIVE',asOf:closed.at(-1)?.closeTime||0,one:closed,four:fromBinance(four,'4h'),day:fromBinance(day,'1d')};
}
