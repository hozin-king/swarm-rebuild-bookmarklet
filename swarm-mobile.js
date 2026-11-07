/* swarm-mobile.js — Patch optimasi mobile untuk Swarm Rebuild (bookmarklet).
 *
 * APA INI:
 *   Patch kecil untuk Swarm Rebuild di layar HP. BUKAN salinan kode upstream:
 *   file ini HANYA menyuntik CSS + tombol + penyesuaian kecil ke dalam shadow
 *   root yang dibuat oleh swarm.js asli (DhvanilPatel/swarm-cursors). Kode
 *   swarm.js sendiri tidak diubah, tidak disalin, dan tetap dimuat langsung
 *   dari repo pembuat via jsDelivr.
 *
 * VERSI 2.0.0 (baru):
 *   A. Performa anti-lag (layar <=600px):
 *      - CSS: matikan filter blur yang mahal di GPU HP — blur(6px) pada
 *        animasi swap tiap gambar, backdrop-filter blur(14px) pada backdrop,
 *        backdrop-filter blur(12px) pada HUD, drop-shadow tiap kursor,
 *        animasi box-shadow tombol suara, transisi clip-path (wipe) gambar
 *        jadi fade biasa, dan transisi box-shadow. Semuanya tetap terbaca
 *        karena latar belakang solid-nya dipertahankan.
 *      - JS: render DOM di-throttle ke ~30fps (tiap frame kedua dilewati).
 *        Aman karena view.render() upstream murni sinkronisasi DOM dari
 *        state engine (renderItem bahkan early-return bila tidak ada yang
 *        berubah); logika engine tetap jalan tiap frame, hanya tampilan
 *        yang diperbarui tiap ~33ms.
 *      - JS: suara dimatikan secara default di HP (AudioContext + reverb
 *        upstream nyala secara default). Tombol suara di HUD tetap bisa
 *        menyalakannya lagi — ini hanya default, bukan penghapusan.
 *   B. Sembunyikan HUD sementara (semua ukuran layar):
 *      - Tombol "▾" di ujung bar bawah menyembunyikan HUD; rebuild tetap
 *        jalan di belakang. Pil kecil "👁 Tampilkan bar" di pojok kanan
 *        bawah mengembalikannya. Tombol ✕ (keluar dari swarm) tidak
 *        disentuh dan tetap berfungsi.
 *
 * YANG TIDAK BISA DIUBAH DARI PATCH (jujur, dari kode upstream):
 *   - Jumlah agen/kursor (MIN 8, maks 48, flock 36) adalah konstanta di
 *     dalam swarm.js dan TIDAK diekspos ke luar. Engine mengaturnya sendiri
 *     (menambah saat antrean menumpuk, memensiunkan yang menganggur).
 *     Memaksa dari luar akan dilawan loop spawn-nya, jadi tidak dilakukan.
 *   - Kecepatan build (engine.speed 1/2/3, default 1 = paling ringan)
 *     sengaja tidak dikunci — itu pilihan user lewat tombol 1× di HUD.
 *
 * CARA KERJA:
 *   1. Menunggu host <swarm-rebuild> muncul (MutationObserver + polling
 *      cadangan, karena swarm.js dimuat asinkron dari CDN).
 *   2. Menyuntik satu <style data-swarm-mobile> ke shadow root-nya (terbuka)
 *      + tombol sembunyikan HUD + pil "tampilkan lagi".
 *   3. Menunggu window.__swarmRebuild.app ada, lalu menerapkan optimasi JS
 *      (throttle render + mute suara) sekali per instance app.
 *   4. Idempotent: bila style/tombol sudah ada, tidak dibuat dua kali.
 *   5. Observer tetap hidup, jadi saat swarm di-toggle mati lalu nyala lagi
 *      (host + app baru), patch otomatis diterapkan ulang.
 *   6. Gagal dimuat = tidak apa-apa: swarm tetap jalan tanpa patch.
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

  var VERSION = "2.0.0";
  var HOST_TAG = "swarm-rebuild";
  var MARK = "data-swarm-mobile";

  var CSS = [
    "/* --- Sembunyikan HUD sementara (semua ukuran layar) --- */",
    ".hud.swm-hidden{display:none !important;}",
    ".swm-hide{padding:7px 9px !important;color:#aaa !important;}",
    ".swm-showhud{position:absolute !important;right:12px !important;bottom:12px !important;bottom:calc(12px + env(safe-area-inset-bottom, 0px)) !important;z-index:6 !important;display:flex !important;align-items:center !important;gap:6px !important;padding:8px 12px !important;border:0 !important;border-radius:999px !important;background:rgba(30,30,30,.94) !important;color:#fff !important;font:500 12px/1 Inter,system-ui,-apple-system,'Segoe UI',sans-serif !important;cursor:pointer !important;box-shadow:0 6px 20px rgba(0,0,0,.35) !important;pointer-events:auto !important;}",
    ".swm-showhud[hidden]{display:none !important;}",
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
    "  /* --- Hemat GPU HP: matikan filter blur & bayangan yang mahal. --- */",
    "  /* Animasi swap gambar: blur(6px) -> fade polos. */",
    "  @keyframes swap{from{opacity:0}}",
    "  /* Backdrop sticky + HUD: backdrop-filter blur -> latar solid saja. */",
    "  .bd{-webkit-backdrop-filter:none !important;backdrop-filter:none !important;}",
    "  .hud{-webkit-backdrop-filter:none !important;backdrop-filter:none !important;}",
    "  /* Kursor: drop-shadow per kursor per frame -> tanpa bayangan. */",
    "  .cursor svg{filter:none !important;}",
    "  /* Gambar muncul: wipe clip-path -> fade biasa. */",
    "  .m>.md{transition:opacity .35s ease !important;}",
    "  /* Transisi box-shadow -> buang (opacity/warna/radius tetap). */",
    "  .r>.f{transition:opacity .22s ease,background-color .35s ease,border-radius .35s ease,border-color .35s ease !important;}",
    "  .hud button.snd.tap{animation:none !important;}",
    "}",
    "@media (max-width: 360px) {",
    "  .hud { gap: 4px !important; padding: 5px 6px !important; }",
    "  .hud .bar { width: 36px !important; }",
    "}"
  ].join("\n");

  function isMobile() {
    try {
      if (typeof window.matchMedia === "function") {
        return window.matchMedia("(max-width: 600px)").matches;
      }
    } catch (_) {}
    return typeof window.innerWidth === "number" && window.innerWidth <= 600;
  }

  function hideHud(root) {
    if (!root) return;
    var hud = root.querySelector(".hud");
    if (hud) hud.classList.add("swm-hidden");
    var pill = root.querySelector(".swm-showhud");
    if (pill) pill.hidden = false;
  }

  function showHud(root) {
    if (!root) return;
    var hud = root.querySelector(".hud");
    if (hud) hud.classList.remove("swm-hidden");
    var pill = root.querySelector(".swm-showhud");
    if (pill) pill.hidden = true;
  }

  function addHideUi(host) {
    if (!host || !host.shadowRoot) return false;
    var root = host.shadowRoot;
    var hud = root.querySelector(".hud");
    if (!hud) return false;
    // Tombol sembunyikan di ujung HUD. Tanpa data-a supaya delegasi klik
    // upstream (yang membaca b.dataset.a) mengabaikannya.
    if (!root.querySelector(".swm-hide")) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "swm-hide";
      b.textContent = "▾";
      b.title = "Sembunyikan bar sementara";
      b.setAttribute("aria-label", "Sembunyikan bar sementara");
      b.addEventListener("click", function (ev) {
        ev.stopPropagation();
        hideHud(root);
      });
      hud.appendChild(b);
    }
    // Pil pemulih di pojok kanan bawah; muncul hanya saat HUD tersembunyi.
    if (!root.querySelector(".swm-showhud")) {
      var p = document.createElement("button");
      p.type = "button";
      p.className = "swm-showhud";
      p.hidden = true;
      p.textContent = "👁 Tampilkan bar";
      p.setAttribute("aria-label", "Tampilkan kembali bar Swarm Rebuild");
      p.addEventListener("click", function () { showHud(root); });
      root.appendChild(p);
    }
    return true;
  }

  function applyToHost(host) {
    if (!host || !host.shadowRoot) return false;
    var root = host.shadowRoot;
    if (!root.querySelector("style[" + MARK + "]")) {
      var st = document.createElement("style");
      st.setAttribute(MARK, VERSION);
      st.textContent = CSS;
      root.appendChild(st);
    }
    addHideUi(host);
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

  // Optimasi JS per instance app (hanya layar kecil). Dipanggil berulang
  // sampai app ada; sekali per instance (ditandai app.__swmPerf).
  function applyPerf() {
    if (!isMobile()) return false;
    var SR = window.__swarmRebuild;
    if (!SR || !SR.app) return false;
    var app = SR.app;
    if (app.__swmPerf) return true;
    app.__swmPerf = true;
    try {
      // Throttle render DOM ke ~30fps: lewati tiap frame kedua. Logika
      // engine tetap jalan tiap frame; render upstream murni sinkronisasi
      // DOM (renderItem early-return bila tidak ada yang berubah).
      var view = app.view;
      if (view && view.render && !view.render.__swmThrottled) {
        var orig = view.render;
        var tick = 0;
        var wrapped = function (E) {
          tick++;
          if (tick % 2 === 0) return;
          return orig.call(this, E);
        };
        wrapped.__swmThrottled = true;
        view.render = wrapped;
      }
    } catch (_) {}
    try {
      // Suara mati secara default di HP (upstream nyala default).
      // Tombol suara di HUD tetap bisa menyalakannya lagi.
      if (app.sfx && app.sfx.setOn) app.sfx.setOn(false);
    } catch (_) {}
    return true;
  }

  function watch() {
    applyAll();
    applyPerf();
    // Observer tetap hidup: host baru (habis toggle mati -> nyala lagi)
    // otomatis ikut ter-patch, dan applyPerf mengejar app barunya.
    if (typeof MutationObserver !== "undefined") {
      var mo = new MutationObserver(function () {
        applyAll();
        applyPerf();
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    }
    // Polling cadangan ~30 detik untuk host/app yang dibuat tanpa mutasi.
    var tries = 0;
    var iv = setInterval(function () {
      applyAll();
      applyPerf();
      if (++tries >= 60) clearInterval(iv);
    }, 500);
  }

  window.__swarmMobile = {
    version: VERSION,
    apply: applyAll,
    perf: applyPerf,
    isMobile: isMobile,
    css: CSS,
    hide: function () {
      var h = document.querySelector(HOST_TAG);
      if (h && h.shadowRoot) hideHud(h.shadowRoot);
    },
    show: function () {
      var h = document.querySelector(HOST_TAG);
      if (h && h.shadowRoot) showHud(h.shadowRoot);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watch);
  } else {
    watch();
  }
})();
