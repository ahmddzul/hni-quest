// Service worker HNI Quest (PWA): buka cepat dari cache, tetap jalan saat offline, pengingat streak harian.
const VER='202611131250';const SHELL='hq-shell-'+VER;const IMGS='hq-img-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./assets/logo/full.webp','./assets/logo/full-dark.webp'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SHELL).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('hq-shell-')&&k!==SHELL).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
  // halaman: utamakan jaringan (dapat versi terbaru), jatuh ke cache saat offline
  if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(SHELL).then(c=>c.put('./index.html',cp));return r}).catch(()=>caches.match('./index.html')));return}
  // gambar & aset: cache dulu (hemat kuota)
  if(u.pathname.includes('/assets/')){e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{const cp=r.clone();caches.open(IMGS).then(c=>c.put(e.request,cp));return r})));return}
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)))});
// pengingat harian (Chrome Android, aplikasi terpasang): browser memanggil ini ±1x sehari
self.addEventListener('periodicsync',e=>{if(e.tag!=='hq-daily')return;e.waitUntil(remind())});
async function remind(){const h=new Date().getHours();if(h<17||h>21)return;
  const st=await readState();if(st&&st.doneToday)return;
  return self.registration.showNotification('Streak-mu menunggu 🔥',{body:st&&st.streak?`Streak ${st.streak} hari. Satu misi kecil saja cukup biar nggak putus.`:'Yuk buka HNI Quest, ada misi dan hadiah absen hari ini.',icon:'./icon-192.png',badge:'./icon-192.png',tag:'hq-daily',data:{url:'./'}})}
async function readState(){try{const c=await caches.open('hq-state');const r=await c.match('./__state');return r?await r.json():null}catch(e){return null}}
self.addEventListener('message',e=>{if(e.data&&e.data.type==='state'){caches.open('hq-state').then(c=>c.put('./__state',new Response(JSON.stringify(e.data.state),{headers:{'Content-Type':'application/json'}})))}});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(ws=>{const w=ws.find(x=>'focus' in x);return w?w.focus():self.clients.openWindow('./')}))});
