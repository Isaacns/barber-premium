/* Vizio Barber · Service Worker (PWA) — network-first para evitar cache velho.
   Mantém um shell mínimo em cache só para fallback offline. */
const CACHE='vb-v073';
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
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  e.respondWith(
    fetch(e.request).then(function(r){
      var cp=r.clone(); caches.open(CACHE).then(function(c){c.put(e.request,cp).catch(function(){});});
      return r;
    }).catch(function(){
      return caches.match(e.request).then(function(m){return m||caches.match('./index.html');});
    })
  );
});
