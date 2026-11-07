# Swarm Rebuild — Bookmarklet untuk Chrome Android

[![GitHub stars](https://img.shields.io/github/stars/hozin-king/swarm-rebuild-bookmarklet?style=flat-square)](https://github.com/hozin-king/swarm-rebuild-bookmarklet/stargazers)
[![License: MIT](https://img.shields.io/github/license/hozin-king/swarm-rebuild-bookmarklet?style=flat-square)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/hozin-king/swarm-rebuild-bookmarklet?style=flat-square)](https://github.com/hozin-king/swarm-rebuild-bookmarklet/commits/main)
[![Chrome Android](https://img.shields.io/badge/Chrome-Android-4285F4?style=flat-square&logo=google-chrome&logoColor=white)](https://github.com/hozin-king/swarm-rebuild-bookmarklet)

Ubah halaman web apa pun jadi kanvas kosong, lalu saksikan kursor-kursor warna-warni membangunnya kembali — langsung di Chrome Android, tanpa install aplikasi apa pun. Sekali ketuk bookmark, efeknya jalan.

Ini adalah versi bookmarklet dari ekstensi Chrome **Swarm Rebuild** karya [DhvanilPatel](https://github.com/DhvanilPatel/swarm-cursors) (tribut untuk situs Swarm karya Joel Califa). Ekstensi aslinya hanya untuk Chrome desktop — versi ini membuatnya bisa dipakai di HP Android lewat teknik bookmark, sama seperti Eruda.

> 📖 **English version:** [README_EN.md](README_EN.md)

![Demo Swarm Rebuild](demo.svg)

## Daftar isi

- [Fitur](#fitur)
- [Diuji di perangkat asli](#diuji-di-perangkat-asli)
- [Mulai cepat](#mulai-cepat)
- [Cara pasang di Chrome Android](#cara-pasang-di-chrome-android)
- [Cara pakai](#cara-pakai)
- [Sembunyikan bar sementara](#sembunyikan-bar-sementara)
- [Optimasi mobile](#optimasi-mobile)
- [Performa di HP (anti-lag)](#performa-di-hp-anti-lag)
- [Update otomatis](#update-otomatis)
- [FAQ](#faq)
- [Cara kerja](#cara-kerja)
- [Batasan](#batasan)
- [Changelog](#changelog)
- [Kredit & lisensi](#kredit--lisensi)

## Fitur

- 🖱️ **Rebuild live** — halaman dihapus jadi kanvas kosong, lalu dibangun kembali blok demi blok oleh kursor swarm.
- 📱 **Dioptimasi untuk HP** — bar bawah dirapikan supaya muat penuh di layar kecil, lengkap dengan safe-area gesture bar Android.
- 🚀 **Anti-lag** — efek berat GPU dimatikan dan render dibatasi ~30fps khusus di layar HP.
- 👁️ **Bar bisa disembunyikan** — sembunyikan bar bawah sementara tanpa mematikan rebuild.
- 🔄 **Update otomatis** — bookmark memuat loader dari repo ini, jadi perbaikan langsung kepakai tanpa ganti bookmark.
- 🔁 **Toggle** — ketuk sekali nyala, ketuk lagi mati.

## Diuji di perangkat asli

Tested on real device — **POCO X6 Pro, Chrome Android**. Bar bawah yang kompak di screenshot ini adalah hasil patch mobile (bandingkan dengan versi awal yang kepotong di kedua sisi):

<img src="docs/screenshot-poco.jpg" width="360" alt="Swarm Rebuild di POCO X6 Pro, Chrome Android — bar bawah kompak hasil patch mobile">

## Mulai cepat

1. Salin [kode bookmarklet](#kode-bookmarklet) di bawah.
2. Buat bookmark baru di Chrome Android, lalu edit URL-nya dengan kode tersebut (nama: `Swarm Rebuild`).
3. Buka halaman apa saja → ⋮ → **Bookmark** → ketuk **Swarm Rebuild**. Selesai.

## Kode bookmarklet

Salin kode di bawah ini utuh (satu baris). Ini kode **stub** — tugasnya cuma memuat loader dari repo ini. Semua logika (termasuk update) tinggal di repo, jadi bookmark ini tidak perlu diganti lagi saat ada update:

```js
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/hozin-king/swarm-rebuild-bookmarklet@main/swarm-bookmarklet.js';s.onerror=function(){alert('Swarm Rebuild gagal dimuat. Cek koneksi internet atau CSP halaman ini.');};(document.head||document.documentElement).appendChild(s);})();
```

## Cara pasang di Chrome Android

Chrome Android memotong skema `javascript:` kalau ditempel di address bar, jadi pasangnya lewat edit bookmark:

1. Buka halaman apa saja di Chrome, lalu buat bookmark seperti biasa (ketuk ⋮ → ikon bintang).
2. Buka daftar bookmark (⋮ → **Bookmark**), cari bookmark yang barusan dibuat.
3. Tekan lama bookmark itu, lalu pilih **Edit**.
4. Ganti **Nama** jadi `Swarm Rebuild`.
5. Ganti **URL** dengan kode bookmarklet di atas (tempel utuh, satu baris).
6. Simpan. Selesai — bookmarklet siap dipakai di halaman mana pun.

## Cara pakai

1. Buka halaman web apa saja (misalnya halaman berita).
2. Buka Bookmark (⋮ → **Bookmark**), lalu ketuk **Swarm Rebuild**.
3. Halaman akan terhapus jadi kanvas kosong, lalu kursor-kursor swarm membangunnya kembali blok demi blok. Bar di bawah layar menunjukkan progres (`48 / 156 layers`) dan tulisan `scroll to keep building` kalau masih ada bagian halaman di bawah yang belum dibangun.
4. Ketuk bookmarklet sekali lagi untuk mematikan efek dan kembali ke halaman asli.

Tombol-tombol di bar bawah:

- **Tour** — auto-scroll selagi swarm membangun.
- **1×** — kecepatan build (ketuk untuk mengganti).
- **Go live** — kembali ke halaman asli setelah rebuild selesai.
- **Replay** — hapus dan bangun ulang dari awal.
- **▾** — sembunyikan bar sementara (lihat di bawah).
- **✕** — keluar.

## Sembunyikan bar sementara

Kalau bar bawah menghalangi halaman yang sedang dibangun ulang, ketuk tombol **▾** di ujung bar. Bar hilang, tapi rebuild **tetap jalan** di belakang — kursor-kursor terus bekerja. Di pojok kanan bawah muncul pil kecil **👁 Tampilkan bar**; ketuk pil itu untuk mengembalikan barnya. Tombol **✕** (keluar dari swarm) tidak disentuh dan tetap berfungsi; kalau bar sedang tersembunyi, tampilkan dulu baru ketuk ✕, atau tekan tombol kembali/Escape.

## Optimasi mobile

Versi awal bar bawahnya kepotong di layar HP (avatar agen hilang di kiri, tombol `1×` mepet di kanan) karena bar itu didesain untuk desktop: lebarnya ~600px, sementara viewport HP cuma ~360–430px.

Versi ini menambahkan `swarm-mobile.js` — patch kecil yang merapikan bar bawah khusus di layar kecil:

- Lebar bar dibatasi ke lebar layar, isinya membungkus ke baris kedua bila perlu.
- Font, jarak, dan tombol diperkecil supaya semua muat.
- Bar tidak lagi menabrak gesture bar Android (safe-area).
- Desktop tidak berubah sama sekali — patch hanya aktif di layar ≤600px.

Patch dimuat otomatis oleh bookmarklet. Kalau patch gagal dimuat (misalnya tidak ada internet), Swarm Rebuild tetap jalan normal seperti versi awal.

## Performa di HP (anti-lag)

Supaya tidak lag di HP, patch juga meringankan beban render khusus di layar kecil:

- **Filter blur dimatikan**: animasi blur tiap gambar, backdrop blur, dan bayangan tiap kursor adalah yang paling berat di GPU HP — semuanya diganti efek yang lebih ringan (fade polos, latar solid). Tampilan rebuild tetap sama, hanya sedikit kurang "berkilau".
- **Render dibatasi ~30fps**: tampilan diperbarui tiap frame kedua; logika rebuild tetap jalan penuh, jadi tidak ada yang terlewat atau rusak.
- **Suara mati secara default**: bunyi-bunyian swarm tidak menyala sendiri di HP (hemat baterai). Ketuk tombol suara di bar bawah kalau mau menyalakannya.

Yang sengaja **tidak** diubah: jumlah kursor (diatur sendiri oleh engine, 8–48 ekor, tidak bisa dikunci dari luar tanpa merusak cara kerjanya) dan kecepatan build (tetap pilihanmu lewat tombol 1× — makin cepat makin berat per frame).

Catatan jujur: seberapa terasa penghematan ini tergantung HP dan berat halamannya — angka pastinya hanya bisa dirasakan lewat tes di perangkat asli, bukan diuji dari simulasi.

## Update otomatis

Bookmark di atas **tidak perlu diganti lagi** kalau ada update. Cara kerjanya:

- Bookmark hanya memuat `swarm-bookmarklet.js` dari repo ini (branch `main`, lewat jsDelivr). Setiap perbaikan — patch mobile, perbaikan loader, sampai pin upstream — cukup di-push ke repo ini, langsung kepakai tanpa sentuh bookmark.
- `swarm.js` upstream juga ikut versi terbaru (`main` repo pembuat). Kalau versi terbaru gagal dimuat (misalnya file dipindah), loader otomatis jatuh ke commit `3d49e0ac` yang sudah teruji.
- Cache jsDelivr biasanya ikut refresh beberapa menit setelah push, paling lambat beberapa jam. Kalau baru saja update tapi bookmark masih memuat versi lama, tunggu sebentar lalu coba lagi.

## FAQ

**Apakah ini clone website?**
Tidak. Ini rebuild visual: Swarm menghapus halaman lalu membangunnya kembali di depan matamu. Animasi membeku saat diklik, dan tidak ada file situs yang dihasilkan atau bisa disimpan.

**Apakah perlu install aplikasi?**
Tidak. Ini bookmarklet — cuma bookmark biasa berisi kode JavaScript. Tidak ada aplikasi, tidak ada ekstensi, tidak ada izin aneh.

**Apakah render-nya pakai GPU?**
Ya, sebagian. Pergerakan kursor dan layer sudah memakai `transform: translate()` + `will-change: transform`, jadi yang menggerakkannya adalah GPU. Yang bikin berat di HP bukan posisinya, melainkan banyaknya elemen yang disinkronkan tiap frame ditambah biaya menggambar ulang (paint) — makanya patch v2 mematikan blur/bayangan dan membatasi render ~30fps. Swarm tidak menggambar ke canvas/WebGL karena ia membangun ulang DOM asli (tetap bisa diklik, strukturnya asli) — mengubah itu butuh tulis ulang engine, bukan sekadar patch.

**Kenapa tidak jalan di situs tertentu?**
Situs dengan CSP ketat (misalnya github.com, google.com) bisa menolak script dari CDN. Halaman `chrome://` juga tidak bisa dijangkau bookmarklet.

**Apakah bookmarklet ini mengumpulkan data?**
Tidak. Bookmarklet hanya memuat dua script: loader dari repo ini dan `swarm.js` dari repo pembuat (keduanya lewat jsDelivr). Tidak ada pelacakan, tidak ada data yang dikirim ke mana pun.

**Bisa dipakai di Chrome desktop?**
Bisa — kodenya sama. Patch mobile hanya aktif di layar ≤600px, jadi di desktop tampilannya tetap seperti ekstensi aslinya.

**Bagaimana cara update?**
Otomatis. Bookmark memuat loader dari repo ini (`main`), jadi setiap push langsung kepakai begitu cache jsDelivr refresh (beberapa menit sampai beberapa jam).

**Kenapa tampilan bar bawah saya berbeda dari video aslinya?**
Itu patch mobile: bar dirapikan supaya muat di layar HP. Di desktop, bar tampil seperti aslinya.

## Cara kerja

Bookmarklet memuat script berurutan:

1. **Stub di bookmark** memuat `swarm-bookmarklet.js` dari repo ini (`main`, lewat jsDelivr).
2. **Loader** memuat `swarm.js` asli dari repo [DhvanilPatel/swarm-cursors](https://github.com/DhvanilPatel/swarm-cursors) — versi terbaru (`main`), dengan fallback otomatis ke commit `3d49e0ac` yang sudah teruji bila gagal. Sekali dimuat, script ini langsung berjalan sendiri; dimuat kedua kali, ia mematikan efek (toggle).
3. **Loader** lalu memuat `swarm-mobile.js` dari repo ini — patch yang disuntikkan ke shadow root Swarm Rebuild supaya bar bawah muat di layar HP, lebih ringan, dan bisa disembunyikan. Kalau gagal dimuat, efek tetap jalan tanpa patch.

Repo ini **tidak** menyertakan salinan `swarm.js` — file aslinya selalu diambil dari repo pembuat.

## Batasan

- **Ini rebuild visual, bukan clone.** Animasi membeku saat diklik, elemen dekoratif (pseudo-element) dilewati, dan canvas/video/iframe di bawah layar pertama jadi placeholder. Tidak menghasilkan file situs yang bisa disimpan atau di-deploy.
- Maksimal sekitar 4.000 layer / 40.000px per halaman.
- Butuh internet saat pertama dimuat di tiap halaman (script diambil dari CDN).
- Situs dengan CSP ketat (misalnya github.com, google.com) bisa menolak script dari CDN.
- Tidak jalan di halaman `chrome://`.
- Harus diketuk ulang setiap pindah halaman atau refresh.

## Changelog

Lihat [CHANGELOG.md](CHANGELOG.md) — v1.0 bookmarklet awal, v1.1 stub auto-update, v2.0 anti-lag + sembunyikan bar.

## Kredit & lisensi

- Swarm Rebuild: [DhvanilPatel/swarm-cursors](https://github.com/DhvanilPatel/swarm-cursors) — tribut untuk situs Swarm karya Joel Califa.
- Repo upstream belum berlisensi. Pembuatnya meminta untuk tidak memakai ulang kodenya tanpa mengecek ke Joel Califa — repo ini menghormati itu: tidak ada kode upstream yang didistribusikan ulang di sini, hanya dimuat langsung dari repo pembuat, ditambah patch kecil (`swarm-mobile.js`) buatan sendiri.
- Loader, patch, panduan, dan demo di repo ini berlisensi [MIT](LICENSE). Lisensi itu **tidak** mencakup `swarm.js` upstream.

---

⭐ Kalau bookmarklet ini bikin kamu senyum, kasih bintang di repo ini — gratis, dan bikin pembuatnya semangat.
