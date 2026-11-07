# Changelog

Semua perubahan penting pada repo ini dicatat di sini. Format mengikuti
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) — versi singkat.

All notable changes to this repository are documented here.

## [v2.0.0] — 7 November 2026

### Ditambahkan / Added

- **Anti-lag di HP**: patch mematikan filter blur (animasi blur tiap gambar,
  backdrop blur, drop-shadow tiap kursor), membatasi render ~30fps, dan
  mematikan suara secara default di layar ≤600px.
- **Sembunyikan bar sementara**: tombol **▾** di ujung bar menyembunyikan HUD
  tanpa mematikan rebuild; pil **👁 Tampilkan bar** di pojok kanan bawah
  mengembalikannya.
- Screenshot perangkat asli (`docs/screenshot-poco.jpg`) — POCO X6 Pro,
  Chrome Android.

## [v1.1.0] — 7 November 2026

### Ditambahkan / Added

- **Stub auto-update**: bookmark kini hanya memuat loader dari repo ini
  (`@main` via jsDelivr), jadi semua update langsung kepakai tanpa ganti
  bookmark.
- **Patch mobile** (`swarm-mobile.js`): bar bawah dirapikan supaya muat di
  layar HP (lebar dibatasi, bungkus ke baris kedua, font/tombol diperkecil,
  safe-area gesture bar).
- README Bahasa Indonesia + demo animasi (`demo.svg`).

### Diubah / Changed

- Loader memuat `swarm.js` upstream dari branch `main` (versi terbaru),
  dengan fallback otomatis ke commit `3d49e0ac` yang sudah teruji.

## [v1.0.0] — 7 November 2026

### Ditambahkan / Added

- Bookmarklet awal: loader memuat `swarm.js` upstream (pin commit `3d49e0ac`
  via jsDelivr). Ketuk sekali nyala, ketuk lagi mati (toggle).
- Teruji di perangkat asli: POCO X6 Pro, Chrome Android (halaman CNN
  Indonesia — kursor swarm muncul, bar "48 / 156 layers" jalan).
