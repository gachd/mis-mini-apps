const CACHE_NAME = 'repositorio-apps-v1';

// Lista de archivos que se guardarán permanentemente en el almacenamiento local del cliente
const urlToCache = [
  './',
  './index.html',
  './manifest.json',
  './apps/calculadora-deuda/index.html',
  './apps/convertidor-viajes/index.html', // <--- Agregar así en tu sw.js cada app nueva
  'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4'
];

// Instala el Service Worker y almacena los archivos en la caché del dispositivo
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Guardando archivos estáticos en el almacenamiento local...');
        return cache.addAll(urlToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activa el SW y limpia cachés antiguas si las hubiera
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// ESTRATEGIA DE RED: Cache First para la interfaz, Network First para las APIs externas
self.addEventListener('fetch', event => {
  // Si la petición es hacia una API externa (como mindicador.cl), ve SIEMPRE a buscar el dato fresco a internet
  if (event.request.url.includes('mindicador.cl') || event.request.url.includes('api')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Si no hay internet al consultar la API, deja que la lógica interna de la app use su respaldo offline
        return caches.match(event.request);
      })
    );
  } else {
    // Para los archivos de la interfaz de tus aplicaciones, sírvelos desde el almacenamiento local instantáneamente
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
