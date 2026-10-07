"""Download public Binance UM monthly archives; never falls back to another market."""
import urllib.request, zipfile, io, csv, json, hashlib, pathlib, concurrent.futures, datetime, os
ROOT=pathlib.Path(os.environ.get('MALOMO_HISTORY_DIR','work/history')); ROOT.mkdir(parents=True,exist_ok=True)
SYMBOLS=['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','DOGEUSDT']
MONTHS=[f'{y}-{m:02}' for y in [2025,2026] for m in range(1,13 if y==2025 else 10)]
def download(item):
 s,m=item; p=ROOT/f'{s}-{m}.json'; z=ROOT/f'{s}-{m}.zip'
 u=f'https://data.binance.vision/data/futures/um/monthly/klines/{s}/1h/{s}-1h-{m}.zip'
 if not z.exists():
  for attempt in range(3):
   try:
    z.write_bytes(urllib.request.urlopen(u,timeout=30).read()); break
   except Exception:
    if attempt==2: raise
 raw=z.read_bytes(); arc=zipfile.ZipFile(io.BytesIO(raw))
 rows=list(csv.reader(io.StringIO(arc.read(arc.namelist()[0]).decode())))
 if not rows[0][0].isdigit(): rows=rows[1:]
 data=[{'time':int(r[0]),'open':float(r[1]),'high':float(r[2]),'low':float(r[3]),'close':float(r[4]),'volume':float(r[5]),'closeTime':int(r[6]),'quoteVolume':float(r[7]),'takerBuyQuote':float(r[10])} for r in rows]
 p.write_text(json.dumps(data,separators=(',',':')))
 return {'symbol':s,'month':m,'url':u,'sha256':hashlib.sha256(raw).hexdigest(),'candles':len(data)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
 manifest=[]
 for n,row in enumerate(pool.map(download,[(s,m) for s in SYMBOLS for m in MONTHS]),1):
  manifest.append(row)
  if n%12==0: print(f'{n}/126 archives downloaded',flush=True)
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2))
for s in SYMBOLS:
 data=[]
 for m in MONTHS: data.extend(json.loads((ROOT/f'{s}-{m}.json').read_text()))
 (ROOT/f'{s}.json').write_text(json.dumps(data,separators=(',',':')))
print('DONE',sum(x['candles'] for x in manifest),'candles',flush=True)
