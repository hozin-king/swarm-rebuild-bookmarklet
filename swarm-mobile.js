/* swarm-mobile.js — Patch optimasi mobile untuk Swarm Rebuild (bookmarklet).
 *
 * APA INI:
 *   Patch kecil yang merapikan bar bawah (.hud) Swarm Rebuild supaya muat di
 *   layar HP. BUKAN salinan kode upstream: file ini HANYA menyuntik CSS
 *   tambahan ke dalam shadow root yang dibuat oleh swarm.js asli
 *   (DhvanilPatel/swarm-cursors). Kode swarm.js sendiri tidak diubah,
 *   tidak disalin, dan tetap dimuat langsung dari repo pembuat via jsDelivr.
 *
 * MASALAH YANG DIPERBAIKI (dites di POCO X6 Pro, Chrome Android):
 *   Bar bawah upstream didesain untuk desktop: `display:flex` tanpa
 *   `flex-wrap`, `white-space:nowrap`, tanpa `max-width`. Lebar intrinsiknya
 *   ~600px (avatar agen + "48 / 156 layers" + "scroll to keep building" +
 *   progress bar + tombol Tour + 1x + suara + tutup), sementara viewport HP
 *   cuma ~360-430px. Karena bar diposisikan di tengah
 *   (`left:50%` + `translateX(-50%)`), kelebihannya terpotong di KEDUA sisi:
 *   avatar agen hilang di kiri, tombol 1x/tutup mepet atau keluar di kanan.
 *   Patch ini membatasi lebar bar ke viewport, mengizinkan isinya membungkus
 *   ke baris kedua, dan mengecilkan font/padding — semua HANYA di layar
 *   <=600px, desktop tidak tersentuh. Animasi muncul (geser ke atas) dan
 *   posisi tengah dipertahankan.
 *
 * CARA KERJA:
 *   1. Menunggu host <swarm-rebuild> muncul (MutationObserver + polling
 *      cadangan, karena swarm.js dimuat asinkron dari CDN).
 *   2. Menyuntik satu <style data-swarm-mobile> ke shadow root-nya (terbuka).
 *   3. Idempotent: bila style sudah ada, tidak disuntik dua kali.
 *   4. Observer tetap hidup, jadi saat swarm di-toggle mati lalu nyala lagi
 *      (host baru dibuat), patch otomatis diterapkan ulang.
 *   5. Gagal dimuat = tidak apa-apa: swarm tetap jalan tanpa patch.
 *
 * LISENSI/KREDIT:
 *   Swarm Rebuild oleh DhvanilPatel (tribut untuk situs Swarm karya Joel
 *   Califa). Repo upstream belum berlisensi — hormati permintaan pembuat
 *   untuk tidak memakai ulang kodenya tanpa mengecek ke Joel Califa.
 *   Patch ini karya sendiri, bebas dipakai.
 */
(function () {
  "use strict";

  // Bila patch dimuat dua kali, jangan daftarkan observer dua kali.
  if (window.__swarmMobile) return;

  var VERSION = "1.0.0";
  var HOST_TAG = "swarm-rebuild";
  var MARK = "data-swarm-mobile";

  var CSS = [
    "@media (max-width: 600px) {",
    "  /* Batasi lebar ke viewport + bungkus isi ke baris kedua. */",
    "  .hud {",
    "    max-width: calc(100vw - 16px) !important;",
    "    box-sizing: border-box !important;",
    "    flex-wrap: wrap !important;",
    "    justify-content: center !important;",
    "    gap: 6px !important;",
    "    padding: 6px 8px !important;",
    "    font-size: 11px !important;",
    "    bottom: 12px !important;",
    "    bottom: calc(12px + env(safe-area-inset-bottom, 0px)) !important;",
    "  }",
    "  /* Teks status boleh menyusut + elipsis, jangan memaksa bar melebar. */",
    "  .hud .txt { min-width: 0 !important; }",
    "  .hud .status {",
    "    min-width: 0 !important;",
    "    overflow: hidden !important;",
    "    text-overflow: ellipsis !important;",
    "    white-space: nowrap !important;",
    "  }",
    "  .hud .bar { width: 48px !important; flex: 0 0 auto !important; }",
    "  .hud button { padding: 6px 8px !important; }",
    "  .hud .dots i { width: 16px !important; height: 16px !important; }",
    "}",
    "@media (max-width: 360px) {",
    "  .hud { gap: 4px !important; padding: 5px 6px !important; }",
    "  .hud .bar { width: 36px !important; }",
    "}"
  ].join("\n");

  function applyToHost(host) {
    if (!host || !host.shadowRoot) return false;
    var root = host.shadowRoot;
    if (root.querySelector("style[" + MARK + "]")) return true; // sudah ter-patch
    var st = document.createElement("style");
    st.setAttribute(MARK, VERSION);
    st.textContent = CSS;
    root.appendChild(st);
    return true;
  }

  function applyAll() {
    var hosts = document.querySelectorAll(HOST_TAG);
    var patched = false;
    for (var i = 0; i < hosts.length; i++) {
      if (applyToHost(hosts[i])) patched = true;
    }
    return patched;
  }

  function watch() {
    applyAll();
    // Observer tetap hidup: host baru (habis toggle mati -> nyala lagi)
    // otomatis ikut ter-patch.
    if (typeof MutationObserver !== "undefined") {
      var mo = new MutationObserver(function () { applyAll(); });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    }
    // Polling cadangan ~30 detik untuk host yang dibuat tanpa mutasi teramati.
    var tries = 0;
    var iv = setInterval(function () {
      applyAll();
      if (++tries >= 60) clearInterval(iv);
    }, 500);
  }

  window.__swarmMobile = { version: VERSION, apply: applyAll, css: CSS };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watch);
  } else {
    watch();
  }
})();
