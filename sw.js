/* ソフトボール成績帳 Service Worker: オフライン起動用。更新は「通信できるときは常に最新」を優先します */
const V='sbook-v1';
const APP=['./','index.html','config.js','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
const CDN=['https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js'];
const timeout=(r,ms)=>Promise.race([fetch(r),new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),ms))]);
self.addEventListener('install',e=>{
 e.waitUntil(caches.open(V).then(async c=>{
  await Promise.all(APP.map(u=>c.add(u).catch(()=>{})));
  await Promise.all(CDN.map(u=>fetch(u,{mode:'no-cors'}).then(r=>c.put(u,r)).catch(()=>{})));
 }).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{
 e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const u=new URL(r.url);
 if(u.origin===location.origin){
  /* 自サイト: 通信を優先(電波が弱いときは3秒でキャッシュに切替) */
  e.respondWith(timeout(r,3000).then(res=>{if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}return res})
   .catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('index.html')||caches.match('./'))));
  return}
 if(['www.gstatic.com','fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)){
  /* Firebase SDK・フォント: キャッシュ優先 */
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res})))}
});
