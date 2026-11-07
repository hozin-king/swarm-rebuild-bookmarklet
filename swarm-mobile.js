/* swarm-mobile.js — Patch optimasi mobile untuk Swarm Rebuild (bookmarklet).
 *
 * APA INI:
 *   Patch kecil untuk Swarm Rebuild di layar HP. BUKAN salinan kode upstream:
 *   file ini HANYA menyuntik CSS + tombol + penyesuaian kecil ke dalam shadow
 *   root yang dibuat oleh swarm.js asli (DhvanilPatel/swarm-cursors). Kode
 *   swarm.js sendiri tidak diubah, tidak disalin, dan tetap dimuat langsung
 *   dari repo pembuat via jsDelivr.
 *
 * VERSI 3.0.0 (baru):
 *   A. Performa anti-lag (layar <=600px) — dari v2.0.0, tidak berubah:
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
 *        yang diperbarui tiap ~33ms. Kini bisa dimatikan dari Pengaturan.
 *      - JS: suara dimatikan secara default di HP (AudioContext + reverb
 *        upstream nyala secara default). Tombol suara di HUD tetap bisa
 *        menyalakannya lagi — ini hanya default, bukan penghapusan.
 *   B. Sembunyikan HUD sementara (semua ukuran layar) — dari v2.0.0:
 *      - Tombol "▾" di ujung bar bawah menyembunyikan HUD; rebuild tetap
 *        jalan di belakang. Pil kecil "👁 Tampilkan bar" di pojok kanan
 *        bawah mengembalikannya. Tombol ✕ (keluar dari swarm) tidak
 *        disentuh dan tetap berfungsi.
 *      - Tombol ▾ bekerja di KEDUA keadaan HUD (saat membangun maupun saat
 *        selesai "Rebuilt by N agents..."): HUD upstream adalah SATU elemen
 *        yang sama — saat selesai hanya isi status dan tombol yang
 *        diganti, bukan elemennya.
 *   C. Mode screenshot (baru):
 *      - Tombol "📷" di HUD (atau dari panel Pengaturan) menyembunyikan
 *        SEMUA chrome swarm sekaligus: HUD, semua kursor, label ukuran,
 *        garis ruler, garis overlay, logo intro, FPS meter, panel, dan
 *        pil-pil — yang tersisa hanya halaman hasil rebuild. Ketuk di mana
 *        saja untuk mengembalikan semuanya.
 *      - JUJUR: tidak ada cara otomatis menyembunyikan saat screenshot —
 *        browser tidak memberi tahu halaman saat tombol screenshot ditekan.
 *        Satu-satunya jalan adalah menyembunyikan dulu, baru memotret;
 *        mode ini melakukannya dalam satu ketukan. Toast petunjuk muncul
 *        ~2 detik lalu menghilang sendiri; tunggu toast hilang sebelum
 *        memotret supaya tidak ikut ke-capture.
 *   D. FPS meter (baru):
 *      - Pil kecil di kiri bawah menampilkan FPS live (diukur dari delta
 *        requestAnimationFrame, dihaluskan rata-rata ~500ms). Di HP
 *        diletakkan di atas bar supaya tidak menumpuk. Ikut tersembunyi
 *        saat HUD disembunyikan atau saat mode screenshot. Bisa dimatikan
 *        dari Pengaturan.
 *   E. Panel Pengaturan (baru):
 *      - Tombol gerigi "⚙" di HUD membuka panel kecil (ramah layar HP).
 *        Isinya HANYA kontrol yang benar-benar jalan, diverifikasi ke kode
 *        upstream: kecepatan build (engine.speed 1/2/3), suara on/off
 *        (sfx.setOn), FPS meter on/off, throttle render on/off, sembunyikan
 *        bar, mode screenshot.
 *
 * YANG TIDAK BISA DIUBAH DARI PATCH (jujur, dari kode upstream):
 *   - Jumlah agen/kursor (MIN 8, maks 48, flock 36) adalah konstanta di
 *     dalam swarm.js dan TIDAK diekspos ke luar. Engine mengaturnya sendiri
 *     (menambah saat antrean menumpuk, memensiunkan yang menganggur).
 *     Memaksa dari luar akan dilawan loop spawn-nya, jadi tidak dilakukan
 *     — dan TIDAK dipasang sebagai toggle palsu di Pengaturan.
 *   - Kecepatan build (engine.speed 1/2/3, default 1 = paling ringan)
 *     kini bisa diatur dari Pengaturan (dan tetap lewat tombol 1× di HUD);
 *     setelah rebuild selesai, kontrol kecepatan tidak berpengaruh lagi
 *     (engine sudah berhenti) sehingga barisnya dinonaktifkan.
 *   - Pengaturan hanya hidup selama halaman ini (in-memory): tiap halaman
 *     baru atau refresh kembali ke default (FPS nyala, throttle nyala,
 *     suara mati di HP). Tidak ada penyimpanan lintas halaman karena patch
 *     berjalan di situs apa pun (localStorage per-origin tidak bisa
 *     dipakai untuk ini).
 *
 * CARA KERJA:
 *   1. Menunggu host <swarm-rebuild> muncul (MutationObserver + polling
 *      cadangan, karena swarm.js dimuat asinkron dari CDN).
 *   2. Menyuntik satu <style data-swarm-mobile> ke shadow root-nya (terbuka)
 *      + tombol HUD (▾/⚙/📷) + pil "tampilkan lagi" + FPS meter + panel
 *      Pengaturan + toast.
 *   3. Menunggu window.__swarmRebuild.app ada, lalu menerapkan optimasi JS
 *      (throttle render sesuai pengaturan + mute suara sekali per instance
 *      app) dan menjalankan loop pengukur FPS.
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

  var VERSION = "3.0.0";
  var HOST_TAG = "swarm-rebuild";
  var MARK = "data-swarm-mobile";
  var TOAST_MS = 1800;

  // Pengaturan (in-memory, per halaman): default = perilaku v2.
  var S = {
    fpsOn: true,
    throttleOn: true,
    hudHidden: false,
    shotMode: false,
    panelOpen: false
  };

  // State pengukur FPS (rAF delta, EMA ~500ms).
  var FPS = { last: 0, frames: 0, ema: 0, running: false };

  var CSS = [
    "/* --- Sembunyikan HUD sementara (semua ukuran layar) --- */",
    ".hud.swm-hidden{display:none !important;}",
    ".swm-hide{padding:7px 9px !important;color:#aaa !important;}",
    ".swm-hbtn{padding:7px 9px !important;color:#aaa !important;}",
    ".swm-showhud{position:absolute !important;right:12px !important;bottom:12px !important;bottom:calc(12px + env(safe-area-inset-bottom, 0px)) !important;z-index:6 !important;display:flex !important;align-items:center !important;gap:6px !important;padding:8px 12px !important;border:0 !important;border-radius:999px !important;background:rgba(30,30,30,.94) !important;color:#fff !important;font:500 12px/1 Inter,system-ui,-apple-system,'Segoe UI',sans-serif !important;cursor:pointer !important;box-shadow:0 6px 20px rgba(0,0,0,.35) !important;pointer-events:auto !important;}",
    ".swm-showhud[hidden]{display:none !important;}",
    "/* --- FPS meter: pil kecil kiri bawah --- */",
    ".swm-fps{position:absolute !important;left:12px !important;bottom:12px !important;z-index:6 !important;padding:6px 9px !important;border-radius:999px !important;background:rgba(30,30,30,.85) !important;color:#9fd8ff !important;font:600 11px/1 Inter,system-ui,-apple-system,'Segoe UI',sans-serif !important;font-variant-numeric:tabular-nums !important;pointer-events:none !important;white-space:nowrap !important;}",
    ".swm-fps[hidden]{display:none !important;}",
    "/* --- Panel Pengaturan --- */",
    ".swm-panel{position:absolute !important;left:16px !important;right:16px !important;margin:0 auto !important;max-width:320px !important;bottom:84px !important;z-index:7 !important;background:rgba(30,30,30,.97) !important;color:#fff !important;border-radius:12px !important;padding:10px 12px !important;box-shadow:0 10px 30px rgba(0,0,0,.4) !important;font:500 12px/1.4 Inter,system-ui,-apple-system,'Segoe UI',sans-serif !important;pointer-events:auto !important;}",
    ".swm-panel[hidden]{display:none !important;}",
    ".swm-ptitle{display:flex !important;align-items:center !important;justify-content:space-between !important;font-weight:600 !important;padding-bottom:6px !important;}",
    ".swm-pclose{all:unset !important;cursor:pointer !important;padding:4px 8px !important;border-radius:7px !important;background:#2c2c2c !important;color:#aaa !important;font:500 12px/1 Inter,system-ui,-apple-system,'Segoe UI',sans-serif !important;}",
    ".swm-row{display:flex !important;align-items:center !important;justify-content:space-between !important;gap:8px !important;padding:7px 0 !important;border-top:1px solid rgba(255,255,255,.08) !important;}",
    ".swm-row.swm-off{opacity:.45 !important;}",
    ".swm-seg{display:flex !important;gap:4px !important;}",
    ".swm-seg button{all:unset !important;cursor:pointer !important;padding:6px 9px !important;border-radius:7px !important;background:#2c2c2c !important;color:#ddd !important;font:500 12px/1 Inter,system-ui,-apple-system,'Segoe UI',sans-serif !important;white-space:nowrap !important;}",
    ".swm-seg button.on{background:#0D99FF !important;color:#fff !important;}",
    ".swm-note{color:#999 !important;font-size:11px !important;padding-top:6px !important;line-height:1.5 !important;}",
    "/* --- Toast mode screenshot (muncul ~2 detik, lalu hilang sendiri) --- */",
    ".swm-toast{position:absolute !important;left:0 !important;right:0 !important;margin:0 auto !important;width:max-content !important;max-width:calc(100vw - 32px) !important;top:14px !important;z-index:8 !important;padding:9px 14px !important;border-radius:999px !important;background:rgba(30,30,30,.94) !important;color:#fff !important;font:500 12px/1.3 Inter,system-ui,-apple-system,'Segoe UI',sans-serif !important;text-align:center !important;pointer-events:none !important;opacity:1 !important;transition:opacity .5s ease !important;}",
    ".swm-toast.fade{opacity:0 !important;}",
    ".swm-toast[hidden]{display:none !important;}",
    "/* --- Mode screenshot: sembunyikan SEMUA chrome swarm --- */",
    ":host(.swm-shot) .hud,",
    ":host(.swm-shot) .cursors,",
    ":host(.swm-shot) .badges,",
    ":host(.swm-shot) .rulers,",
    ":host(.swm-shot) svg.ov,",
    ":host(.swm-shot) .intro,",
    ":host(.swm-shot) .swm-fps,",
    ":host(.swm-shot) .swm-panel,",
    ":host(.swm-shot) .swm-showhud{display:none !important;}",
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
    "  /* FPS meter di atas bar (bar membungkus 2 baris di HP). */",
    "  .swm-fps{left:8px !important;bottom:calc(96px + env(safe-area-inset-bottom, 0px)) !important;}",
    "  .swm-panel{bottom:100px !important;}",
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

  function getHost() { return document.querySelector(HOST_TAG); }
  function getRoot() {
    var h = getHost();
    return h && h.shadowRoot ? h.shadowRoot : null;
  }
  function getApp() {
    var SR = window.__swarmRebuild;
    return SR ? SR.app : null;
  }

  // --- Visibilitas chrome patch: satu tempat, dipanggil tiap perubahan state.
  function syncChrome(root) {
    if (!root) return;
    var fps = root.querySelector(".swm-fps");
    if (fps) fps.hidden = !(S.fpsOn && !S.hudHidden && !S.shotMode);
    var pill = root.querySelector(".swm-showhud");
    if (pill) pill.hidden = !(S.hudHidden && !S.shotMode);
    var panel = root.querySelector(".swm-panel");
    if (panel) panel.hidden = !S.panelOpen || S.shotMode;
  }

  function hideHud(root) {
    if (!root) return;
    S.hudHidden = true;
    var hud = root.querySelector(".hud");
    if (hud) hud.classList.add("swm-hidden");
    syncChrome(root);
  }

  function showHud(root) {
    if (!root) return;
    S.hudHidden = false;
    var hud = root.querySelector(".hud");
    if (hud) hud.classList.remove("swm-hidden");
    syncChrome(root);
  }

  function showToast(root) {
    var t = root.querySelector(".swm-toast");
    if (!t) return;
    t.hidden = false;
    t.classList.remove("fade");
    if (t.__swmT) clearTimeout(t.__swmT);
    t.__swmT = setTimeout(function () {
      t.classList.add("fade");
      setTimeout(function () { t.hidden = true; }, 600);
    }, TOAST_MS);
  }

  function enterShotMode(host) {
    host = host || getHost();
    if (!host) return false;
    S.shotMode = true;
    S.panelOpen = false;
    host.classList.add("swm-shot");
    syncChrome(host.shadowRoot);
    showToast(host.shadowRoot);
    return true;
  }

  function exitShotMode(host) {
    host = host || getHost();
    if (!host) return false;
    S.shotMode = false;
    host.classList.remove("swm-shot");
    var t = host.shadowRoot.querySelector(".swm-toast");
    if (t) {
      if (t.__swmT) clearTimeout(t.__swmT);
      t.hidden = true;
      t.classList.remove("fade");
    }
    syncChrome(host.shadowRoot);
    return true;
  }

  // --- Kontrol upstream (semua diverifikasi ke swarm.js) ---
  function setSpeed(ix, root) {
    var app = getApp();
    if (!app || !app.engine || !app.speeds) return false;
    if (app.complete) return false; // engine sudah berhenti
    app.speedIx = ix;
    app.engine.speed = app.speeds[ix];
    var sb = root && root.querySelector('[data-a="speed"]');
    if (sb) sb.textContent = app.speeds[ix] + "×";
    refreshPanel(root || getRoot());
    return true;
  }

  function setSound(on, root) {
    var app = getApp();
    if (!app || !app.sfx || !app.sfx.setOn) return false;
    app.sfx.setOn(on);
    try { if (app.renderSoundBtn) app.renderSoundBtn(); } catch (_) {}
    refreshPanel(root || getRoot());
    return true;
  }

  function setThrottle(on, root) {
    S.throttleOn = !!on;
    var app = getApp();
    if (!app || !app.view || !isMobile()) {
      refreshPanel(root || getRoot());
      return false;
    }
    var view = app.view;
    var cur = view.render;
    if (S.throttleOn) {
      if (!cur.__swmThrottled) {
        var orig = cur;
        var tick = 0;
        var wrapped = function (E) {
          tick++;
          if (tick % 2 === 0) return;
          return orig.call(this, E);
        };
        wrapped.__swmThrottled = true;
        wrapped.__swmOrig = orig;
        view.render = wrapped;
      }
    } else if (cur.__swmThrottled && cur.__swmOrig) {
      view.render = cur.__swmOrig;
    }
    refreshPanel(root || getRoot());
    return true;
  }

  function setFps(on, root) {
    S.fpsOn = !!on;
    syncChrome(root || getRoot());
    refreshPanel(root || getRoot());
    return true;
  }

  // --- Panel Pengaturan ---
  function refreshPanel(root) {
    if (!root) return;
    var panel = root.querySelector(".swm-panel");
    if (!panel) return;
    var app = getApp();
    var ix = app && typeof app.speedIx === "number" ? app.speedIx : 0;
    var btns = panel.querySelectorAll("[data-set]");
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var set = b.getAttribute("data-set");
      var val = b.getAttribute("data-val");
      if (set === "speed") b.classList.toggle("on", parseInt(val, 10) === ix);
      else if (set === "sound") b.classList.toggle("on", (val === "1") === !!(app && app.sfx && app.sfx.on));
      else if (set === "fps") b.classList.toggle("on", (val === "1") === S.fpsOn);
      else if (set === "throttle") b.classList.toggle("on", (val === "1") === S.throttleOn);
    }
    var speedRow = panel.querySelector('[data-row="speed"]');
    if (speedRow) speedRow.classList.toggle("swm-off", !app || !!app.complete);
    var soundRow = panel.querySelector('[data-row="sound"]');
    if (soundRow) soundRow.classList.toggle("swm-off", !app || !app.sfx);
    var thrRow = panel.querySelector('[data-row="throttle"]');
    if (thrRow) thrRow.classList.toggle("swm-off", !isMobile());
  }

  function togglePanel(root) {
    if (!root) return;
    S.panelOpen = !S.panelOpen;
    if (S.panelOpen) refreshPanel(root);
    var gear = root.querySelector(".swm-gear");
    if (gear) gear.classList.toggle("on", S.panelOpen);
    syncChrome(root);
  }

  function buildPanel(root) {
    if (root.querySelector(".swm-panel")) return;
    var p = document.createElement("div");
    p.className = "swm-panel";
    p.hidden = true;
    p.innerHTML =
      '<div class="swm-ptitle"><span>Pengaturan</span><button type="button" class="swm-pclose" aria-label="Tutup pengaturan">✕</button></div>' +
      '<div class="swm-row" data-row="speed"><span>Kecepatan</span><span class="swm-seg">' +
      '<button type="button" data-set="speed" data-val="0">1×</button>' +
      '<button type="button" data-set="speed" data-val="1">2×</button>' +
      '<button type="button" data-set="speed" data-val="2">3×</button></span></div>' +
      '<div class="swm-row" data-row="sound"><span>Suara</span><span class="swm-seg">' +
      '<button type="button" data-set="sound" data-val="0">Mati</button>' +
      '<button type="button" data-set="sound" data-val="1">Nyala</button></span></div>' +
      '<div class="swm-row" data-row="fps"><span>FPS meter</span><span class="swm-seg">' +
      '<button type="button" data-set="fps" data-val="1">Nyala</button>' +
      '<button type="button" data-set="fps" data-val="0">Mati</button></span></div>' +
      '<div class="swm-row" data-row="throttle"><span>Throttle 30fps</span><span class="swm-seg">' +
      '<button type="button" data-set="throttle" data-val="1">Nyala</button>' +
      '<button type="button" data-set="throttle" data-val="0">Mati</button></span></div>' +
      '<div class="swm-row"><span>Sembunyikan bar</span><span class="swm-seg">' +
      '<button type="button" data-set="hidebar">Sembunyikan</button></span></div>' +
      '<div class="swm-row"><span>Mode screenshot</span><span class="swm-seg">' +
      '<button type="button" data-set="shot">📷 Sembunyikan semua</button></span></div>' +
      '<div class="swm-note">Jumlah agen tidak bisa diatur — ditentukan engine upstream (8–48).</div>';
    p.addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button") : null;
      if (!b) return;
      if (b.classList.contains("swm-pclose")) {
        S.panelOpen = false;
        var gear = root.querySelector(".swm-gear");
        if (gear) gear.classList.remove("on");
        syncChrome(root);
        return;
      }
      if (b.closest(".swm-off")) return; // baris nonaktif
      var set = b.getAttribute("data-set");
      var val = b.getAttribute("data-val");
      if (set === "speed") setSpeed(parseInt(val, 10), root);
      else if (set === "sound") setSound(val === "1", root);
      else if (set === "fps") setFps(val === "1", root);
      else if (set === "throttle") setThrottle(val === "1", root);
      else if (set === "hidebar") { S.panelOpen = false; hideHud(root); }
      else if (set === "shot") { S.panelOpen = false; syncChrome(root); enterShotMode(getHost()); }
    });
    root.appendChild(p);
  }

  // --- FPS meter: loop rAF sendiri, EMA ~500ms ---
  function fpsTick(ts) {
    if (!FPS.running) return;
    if (!getHost()) { FPS.running = false; return; }
    var now = typeof ts === "number" ? ts : (window.performance ? window.performance.now() : Date.now());
    if (!FPS.last) FPS.last = now;
    FPS.frames++;
    var el = now - FPS.last;
    if (el >= 500) {
      var inst = (FPS.frames * 1000) / el;
      FPS.ema = FPS.ema ? FPS.ema * 0.6 + inst * 0.4 : inst;
      var root = getRoot();
      var pill = root && root.querySelector(".swm-fps");
      if (pill) pill.textContent = Math.round(FPS.ema) + " FPS";
      FPS.frames = 0;
      FPS.last = now;
    }
    requestAnimationFrame(fpsTick);
  }

  function startFps() {
    if (FPS.running) return;
    if (typeof requestAnimationFrame !== "function") return;
    FPS.running = true;
    FPS.last = 0;
    FPS.frames = 0;
    FPS.ema = 0;
    requestAnimationFrame(fpsTick);
  }

  function addChrome(host) {
    if (!host || !host.shadowRoot) return false;
    var root = host.shadowRoot;
    var hud = root.querySelector(".hud");
    if (!hud) return false;
    // Tombol patch di HUD. Tanpa data-a supaya delegasi klik upstream
    // (yang membaca b.dataset.a) mengabaikannya.
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
    if (!root.querySelector(".swm-gear")) {
      var g = document.createElement("button");
      g.type = "button";
      g.className = "swm-hbtn swm-gear";
      g.textContent = "⚙";
      g.title = "Pengaturan";
      g.setAttribute("aria-label", "Buka pengaturan");
      g.addEventListener("click", function (ev) {
        ev.stopPropagation();
        togglePanel(root);
      });
      hud.appendChild(g);
    }
    if (!root.querySelector(".swm-shotbtn")) {
      var s = document.createElement("button");
      s.type = "button";
      s.className = "swm-hbtn swm-shotbtn";
      s.textContent = "📷";
      s.title = "Mode screenshot: sembunyikan semua";
      s.setAttribute("aria-label", "Mode screenshot: sembunyikan semua elemen swarm");
      s.addEventListener("click", function (ev) {
        ev.stopPropagation();
        enterShotMode(host);
      });
      hud.appendChild(s);
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
    // FPS meter kiri bawah.
    if (!root.querySelector(".swm-fps")) {
      var f = document.createElement("div");
      f.className = "swm-fps";
      f.hidden = true;
      f.textContent = "— FPS";
      root.appendChild(f);
    }
    buildPanel(root);
    // Toast mode screenshot.
    if (!root.querySelector(".swm-toast")) {
      var t = document.createElement("div");
      t.className = "swm-toast";
      t.hidden = true;
      t.textContent = "Mode screenshot aktif — ketuk di mana saja untuk kembali";
      root.appendChild(t);
    }
    // Ketuk di mana saja untuk keluar dari mode screenshot. Listener
    // dipasang di host; target asli diambil dari composedPath()[0]
    // karena klik dari dalam shadow DOM di-retarget jadi host saat
    // mencapai listener di luar shadow tree.
    // Aman: .port/.world/.cursors/.badges upstream pointer-events:none,
    // jadi ketukan di area halaman mendarat di .bg (atau host sendiri).
    if (!host.__swmClick) {
      host.__swmClick = true;
      host.addEventListener("click", function (ev) {
        if (!S.shotMode) return;
        var t = ev.target;
        if (ev.composedPath) {
          var p = ev.composedPath();
          if (p && p.length) t = p[0];
        }
        if (t && t.closest) {
          if (t.closest("button, .hud, .swm-panel, .swm-fps, .swm-showhud")) return;
        }
        exitShotMode(host);
      });
    }
    startFps();
    syncChrome(root);
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
    addChrome(host);
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

  // Optimasi JS per instance app (hanya layar kecil). Dipanggil berulang;
  // throttle diterapkan sesuai pengaturan, suara di-mute SEKALI per app.
  function applyPerf() {
    var app = getApp();
    if (!app) return false;
    if (isMobile()) setThrottle(S.throttleOn);
    if (isMobile() && !app.__swmSoundInit) {
      app.__swmSoundInit = true;
      try {
        // Suara mati secara default di HP (upstream nyala default).
        // Tombol suara di HUD / Pengaturan tetap bisa menyalakannya lagi.
        if (app.sfx && app.sfx.setOn) app.sfx.setOn(false);
      } catch (_) {}
    }
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
    settings: S,
    fps: function () { return Math.round(FPS.ema); },
    hide: function () {
      var h = getHost();
      if (h && h.shadowRoot) hideHud(h.shadowRoot);
    },
    show: function () {
      var h = getHost();
      if (h && h.shadowRoot) showHud(h.shadowRoot);
    },
    shot: { enter: enterShotMode, exit: exitShotMode },
    panel: { toggle: togglePanel, refresh: refreshPanel },
    setSpeed: setSpeed,
    setSound: setSound,
    setThrottle: setThrottle,
    setFps: setFps
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", watch);
  } else {
    watch();
  }
})();
