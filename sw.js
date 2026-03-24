// sw.js - Service Worker Inteligente (Network First)
const CACHE_NAME = 'mi-app-cache-v2';

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

// Instalamos y guardamos la caché inicial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Limpiamos cachés antiguas si cambiamos la versión
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ESTRATEGIA "NETWORK FIRST" (La red primero, caché como respaldo)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si hay internet y encontramos el archivo nuevo, lo guardamos en caché y lo mostramos
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Si falla internet (modo offline), buscamos en la caché
        return caches.match(event.request);
      })
  );
});