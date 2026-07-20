/* Vizio Barber · Service Worker (PWA) — network-first para evitar cache velho.
   Mantém um shell mínimo em cache só para fallback offline. */
const CACHE='vb-v081';
const CORE=['./','./index.html','./icon-192.png','./icon-512.png','./manifest.json'];
self.addEventListener('install',function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE).catch(function(){});}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }).then(function(){return self.clients.claim();}));
});
/* o push (§14) pede ao SW em espera que assuma na hora */
self.addEventListener('message',function(e){
  if(e.data && e.data.type==='PULAR_ESPERA') self.skipWaiting();
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url; try{ url=new URL(e.request.url); }catch(_){ return; }
  /* não intercepta outras origens (CDN de fontes/Chart.js) */
  if(url.origin!==self.location.origin) return;
  /* Checagem de versão não entra no cache: cada uma usa ?_v=<timestamp> único e o
     cache criaria uma entrada nova a cada 10 min, para sempre. */
  if(url.searchParams.has('_v')) return;
  e.respondWith(
    fetch(e.request).then(function(r){
      var cp=r.clone(); caches.open(CACHE).then(function(c){c.put(e.request,cp).catch(function(){});});
      return r;
    }).catch(function(){
      return caches.match(e.request).then(function(m){return m||caches.match('./index.html');});
    })
  );
});
