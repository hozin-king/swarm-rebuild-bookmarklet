# Swarm Rebuild — Bookmarklet untuk Chrome Android

![Demo Swarm Rebuild](demo.svg)

Ubah halaman web apa pun jadi kanvas kosong, lalu saksikan kursor-kursor warna-warni membangunnya kembali — langsung di Chrome Android, tanpa install aplikasi apa pun. Sekali ketuk bookmark, efeknya jalan.

Ini adalah versi bookmarklet dari ekstensi Chrome **Swarm Rebuild** karya [DhvanilPatel](https://github.com/DhvanilPatel/swarm-cursors) (tribut untuk situs Swarm karya Joel Califa). Ekstensi aslinya hanya untuk Chrome desktop — versi ini membuatnya bisa dipakai di HP Android lewat teknik bookmark, sama seperti Eruda.

## Kode bookmarklet

Salin kode di bawah ini utuh (satu baris). Ini kode **stub** — tugasnya cuma memuat loader dari repo ini. Semua logika (termasuk update) tinggal di repo, jadi bookmark ini tidak perlu diganti lagi saat ada update:

```js
javascript:(function(){var s=document.createElement('script');s.src='https://cdn.jsdelivr.net/gh/hozin-king/swarm-rebuild-bookmarklet@main/swarm-bookmarklet.js';s.onerror=function(){alert('Swarm Rebuild gagal dimuat. Cek koneksi internet atau CSP halaman ini.');};(document.head||document.documentElement).appendChild(s);})();
```

## Update otomatis

Bookmark di atas **tidak perlu diganti lagi** kalau ada update. Cara kerjanya:

- Bookmark hanya memuat `swarm-bookmarklet.js` dari repo ini (branch `main`, lewat jsDelivr). Setiap perbaikan — patch mobile, perbaikan loader, sampai pin upstream — cukup di-push ke repo ini, langsung kepakai tanpa sentuh bookmark.
- `swarm.js` upstream juga ikut versi terbaru (`main` repo pembuat). Kalau versi terbaru gagal dimuat (misalnya file dipindah), loader otomatis jatuh ke commit `3d49e0ac` yang sudah teruji.
- Cache jsDelivr biasanya ikut refresh beberapa menit setelah push, paling lambat beberapa jam. Kalau baru saja update tapi bookmark masih memuat versi lama, tunggu sebentar lalu coba lagi.

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
- **✕** — keluar.

## Yang baru: optimasi mobile

Versi awal bar bawahnya kepotong di layar HP (avatar agen hilang di kiri, tombol `1×` mepet di kanan) karena bar itu didesain untuk desktop: lebarnya ~600px, sementara viewport HP cuma ~360–430px.

Versi ini menambahkan `swarm-mobile.js` — patch kecil yang merapikan bar bawah khusus di layar kecil:

- Lebar bar dibatasi ke lebar layar, isinya membungkus ke baris kedua bila perlu.
- Font, jarak, dan tombol diperkecil supaya semua muat.
- Bar tidak lagi menabrak gesture bar Android (safe-area).
- Desktop tidak berubah sama sekali — patch hanya aktif di layar ≤600px.

Patch dimuat otomatis oleh bookmarklet. Kalau patch gagal dimuat (misalnya tidak ada internet), Swarm Rebuild tetap jalan normal seperti versi awal.

## Batasan

- **Ini rebuild visual, bukan clone.** Animasi membeku saat diklik, elemen dekoratif (pseudo-element) dilewati, dan canvas/video/iframe di bawah layar pertama jadi placeholder. Tidak menghasilkan file situs yang bisa disimpan atau di-deploy.
- Maksimal sekitar 4.000 layer / 40.000px per halaman.
- Butuh internet saat pertama dimuat di tiap halaman (script diambil dari CDN).
- Situs dengan CSP ketat (misalnya github.com, google.com) bisa menolak script dari CDN.
- Tidak jalan di halaman `chrome://`.
- Harus diketuk ulang setiap pindah halaman atau refresh.

## Cara kerja

Bookmarklet memuat script berurutan:

1. **Stub di bookmark** memuat `swarm-bookmarklet.js` dari repo ini (`main`, lewat jsDelivr).
2. **Loader** memuat `swarm.js` asli dari repo [DhvanilPatel/swarm-cursors](https://github.com/DhvanilPatel/swarm-cursors) — versi terbaru (`main`), dengan fallback otomatis ke commit `3d49e0ac` yang sudah teruji bila gagal. Sekali dimuat, script ini langsung berjalan sendiri; dimuat kedua kali, ia mematikan efek (toggle).
3. **Loader** lalu memuat `swarm-mobile.js` dari repo ini — patch CSS yang disuntikkan ke shadow root Swarm Rebuild supaya bar bawah muat di layar HP. Kalau gagal dimuat, efek tetap jalan tanpa patch.

Repo ini **tidak** menyertakan salinan `swarm.js` — file aslinya selalu diambil dari repo pembuat.

## Kredit & lisensi

- Swarm Rebuild: [DhvanilPatel/swarm-cursors](https://github.com/DhvanilPatel/swarm-cursors) — tribut untuk situs Swarm karya Joel Califa.
- Repo upstream belum berlisensi. Pembuatnya meminta untuk tidak memakai ulang kodenya tanpa mengecek ke Joel Califa — repo ini menghormati itu: tidak ada kode upstream yang didistribusikan ulang di sini, hanya dimuat langsung dari repo pembuat, ditambah patch kecil (`swarm-mobile.js`) buatan sendiri.
- Patch dan panduan di repo ini bebas dipakai.

---

## English summary

**Swarm Rebuild as a bookmarklet for Chrome Android.** Tap the bookmark on any page: the page is wiped to a blank canvas and rebuilt live by colorful swarm cursors. One tap toggles it on, another tap turns it off. Includes a small mobile patch (`swarm-mobile.js`) that keeps the bottom HUD bar inside phone viewports (≤600px); desktop is untouched. Visual rebuild only — not a clone, no site files are produced. The bookmark is a stub that loads the loader from this repo (`@main`), so updates ship automatically; the upstream `swarm.js` is loaded straight from the author's repo via jsDelivr (latest `main`, with a pinned-commit fallback) and no upstream code is redistributed here.
