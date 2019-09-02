// serviceWorker有効化
self.addEventListener('install', function() {
  console.log('serviceWorker installed.')
})

// リクエストのフック
self.addEventListener('fetch', function() {
  console.log('resource fetched.')
})
