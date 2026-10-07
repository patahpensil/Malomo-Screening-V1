/* Malomo mobile v1: network-only data, with an explicit offline landing page. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || event.request.mode !== 'navigate' || url.origin !== self.location.origin || url.pathname !== '/') return;
  event.respondWith(fetch(event.request).catch(() => new Response(`<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111518"><title>Malomo · Tidak terhubung</title><style>body{margin:0;background:#111518;color:#ecf1e9;font:16px/1.6 system-ui;min-height:100dvh;display:grid;place-items:center}main{max-width:28rem;padding:2rem}h1{font-size:1.6rem}p{color:#abb7bf}a{display:inline-block;background:#c2ec99;color:#17210d;padding:.8rem 1.2rem;border-radius:.5rem;text-decoration:none;font-weight:600}</style></head><body><main><h1>Malomo belum terhubung</h1><p>Sambungkan internet untuk membuka workspace, memperbarui harga dan mengakses jurnal. Data live tidak tersedia saat offline.</p><a href="/">Coba lagi</a></main></body></html>`, {status: 503, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'}})));
});
