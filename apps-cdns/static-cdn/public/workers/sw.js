self.__INITIAL_STATE__ = {}

const pretext = 'vx-cache-'
const version = '26.0.0-alpha.1'
const CACHE_NAME = pretext + version
const HOME_URL = '/index.html'
const OFFLINE_URL = '/offline.html'
const VASSEST_URL = 'https://static.cdn.vezham.com/vassets/'
const NO_INTERNET = 'no-internet.svg'
const assets = [
  '/',
  '/manifest.json',
  HOME_URL,
  OFFLINE_URL,
  VASSEST_URL + NO_INTERNET
]

// wjdlz/NOTE: cache size limit function
// const limitCacheSize = (name, size) => {
//   caches.open(name).then(cache => {
//     cache.keys().then(keys => {
//       if (keys.length > size) {
//         cache.delete(keys[0]).then(limitCacheSize(name, size))
//       }
//     })
//   })
// }

self.addEventListener('install', event => {
  // wjdlz/REF: console.log("service_worker | evt install", event);
  event.waitUntil(
    (async () => {
      self.skipWaiting()

      caches.open(CACHE_NAME).then(cache => {
        // wjdlz/REF: console.log("service_worker | cache assets");
        return cache.addAll(assets)
      })
    })()
  )
})

self.addEventListener('activate', event => {
  // wjdlz/REF: console.log("service_worker | evt activate", event);
  event.waitUntil(
    (async () => {
      // wjdlz/NOTE: Tell the active service worker to take control of the page immediately.
      await self.clients.claim()

      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      })

      // vx-bot/NOTE: Navigation preload starts the request while the worker boots.
      // See https://developers.google.com/web/updates/2017/02/navigation-preload
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable()
      }
    })()
  )
})

self.addEventListener('fetch', event => {
  // wjdlz/REF: console.log("service_worker | evt fetch", event);
  // if (event.request.mode === "navigate") {

  event.respondWith(
    (async () => {
      try {
        if (event.request.url.startsWith(VASSEST_URL)) {
          const cachedResponse = await caches.match(event.request).then(res => {
            return res
          })
          if (cachedResponse) {
            return cachedResponse
          }
        }

        // wjdlz/NOTE: old impl
        // let url = event.request
        // if (url.startsWith(VASSEST_URL)) {
        //   url.replace(VASSEST_URL, '/')
        // }
        // caches.match(url).then(res => {
        //   return res
        // })
        // caches.match(evt.request).then((response) => {
        //   if (response) {
        //     return response;
        //   } else {
        //     return fetch(evt.request).then((res) => {
        //       return caches.open(CACHE_NAME).then((cache) => {
        //         cache.put(evt.request.url, res.clone());
        //         // check cached items size
        //         limitCacheSize(CACHE_NAME, 25);
        //         return res;
        //       });
        //     });
        //   }
        // });

        // vx-bot/NOTE: Reuse the preload response to avoid a duplicate network request.
        const preloadResponse = await event.preloadResponse
        if (preloadResponse) {
          return preloadResponse
        }

        const networkResponse = await fetch(event.request)
        return networkResponse
      } catch (error) {
        // vx-bot/NOTE: Network exceptions use the offline page; HTTP errors remain responses.
        console.info('Fetch failed; returning offline page instead.', error)

        const cache = await caches.open(CACHE_NAME)
        const cachedResponse = await cache.match(OFFLINE_URL)
        return cachedResponse
      }
    })()
  )
})

// vx-bot/NOTE: The app can activate a waiting worker with a SKIP_WAITING message.
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// wjdlz/NOTE: for ref
// self.addEventListener('appinstalled', event => {
//   console.log("service_worker | PWA was installed");
// })
