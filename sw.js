// sw.js - Service Worker Básico
const CACHE_NAME = 'mi-app-cache-v1';
const urlsToCache =[
  './',
  './index.html',
  './css/base.css',
  './css/tareas.css',
  './css/notas.css',
  './css/auth.css',
  './js/app.js',
  './js/tareas.js',
  './js/notas.js',
  './js/auth.js'
];

// Instalar el Service Worker y guardar archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Archivos cacheados con éxito');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones para que la app cargue más rápido
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve el archivo del caché si existe, si no, lo pide a internet
        return response || fetch(event.request);
      })
  );
});