// เปลี่ยนเลขเวอร์ชันทุกครั้งที่อัปโหลดไฟล์ใหม่ เพื่อให้ผู้ใช้ได้เวอร์ชันล่าสุด
const CACHE = 'payday-v2';
const FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// หน้าเว็บ: ลองโหลดจากเน็ตก่อน ถ้าออฟไลน์ใช้ของที่เก็บไว้
// ไฟล์อื่น (ฟอนต์ ไอคอน): ใช้ของที่เก็บไว้ก่อน แล้วค่อยอัปเดตเบื้องหลัง
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('./index.html', copy));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
