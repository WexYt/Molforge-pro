const V='wex-molforge-v1',B='/Molforge-pro/';
const CORE=['','index.html','404.html','manifest.webmanifest','favicon.svg','icon-192.png','icon-512.png',
'assets/index-DYEe31r0.css','assets/index-BZHH0yOC.js','assets/routes-DqBNg-0I.js','assets/arrow-right-CuuoCWW3.js','assets/download-DCwZp7t2.js',
'assets/fixtures-D22f8Dkt.js','assets/forja-D0LGHw2t.js','assets/biblioteca-DOUZmxgT.js','assets/external-link-D4hPHO-D.js'].map(x=>B+x);
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>Promise.all(CORE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=='GET'||u.origin!==location.origin||!u.pathname.startsWith(B))return;
 e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>{
  const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  return net.then(res=>res||(r.mode==='navigate'?c.match(B+'index.html'):Response.error()))})))});
