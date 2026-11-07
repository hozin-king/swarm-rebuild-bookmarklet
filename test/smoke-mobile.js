// Smoke test patch mobile Swarm Rebuild (swarm-mobile.js) v3.0.0 di jsdom.
// Memverifikasi: semua cek v2 (CSS mobile, hemat GPU, tombol ▾ + pil,
// throttle render, mute suara, loader @main + fallback pin) PLUS v3:
// tombol ▾/⚙/📷 bekerja di KEDUA keadaan HUD (membangun & selesai),
// mode screenshot (host.swm-shot, toast, ketuk-di-mana-saja untuk kembali),
// FPS meter kiri bawah (nilai berubah), panel Pengaturan (kecepatan/suara/
// FPS/throttle benar-benar mengubah nilai upstream), dan penerapan ulang
// setelah toggle mati->nyala.
//
// BATAS UJI (jujur): jsdom tidak punya layout engine dan tidak mengimplementasi
// matchMedia, jadi TIDAK BISA memverifikasi bar bawah benar-benar muat dalam
// viewport 390px secara visual, TIDAK BISA mengukur lag asli, dan TIDAK BISA
// mengukur FPS akurat (rAF jsdom bukan GPU) — yang diuji adalah wiring +
// isi CSS + perilaku tombol + knob yang diubah. Verifikasi visual, rasa lag,
// dan akurasi FPS tetap butuh tes perangkat.
"use strict";

const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const DIR = path.resolve(__dirname, "..");
const REPO = path.join(DIR, "repo");
const BUNDLE = fs.readFileSync(path.join(DIR, "swarm-rebuild.js"), "utf8");
const PATCH = fs.readFileSync(path.join(REPO, "swarm-mobile.js"), "utf8");
const LOADER = fs.readFileSync(path.join(REPO, "swarm-bookmarklet.js"), "utf8")
  .replace(/^javascript:/, "");

const HTML = `<!DOCTYPE html><html><head><title>Test</title>
<style>
  body { font-family: sans-serif; margin: 0; }
  .hero { background: #0d99ff; color: white; padding: 40px; border-radius: 12px; }
  .card { border: 1px solid #ccc; padding: 16px; margin: 8px; }
</style></head><body>
<header class="hero"><h1>Judul Halaman</h1><p>Paragraf pembuka.</p></header>
<main>
  <div class="card"><h2>Kartu Satu</h2><p>Isi kartu pertama.</p></div>
  <div class="card"><h2>Kartu Dua</h2><p>Isi kartu kedua.</p></div>
</main></body></html>`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failures = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? " — " + extra : ""}`);
  if (!ok) failures++;
};

function countPatchStyles(host) {
  if (!host || !host.shadowRoot) return -1;
  return host.shadowRoot.querySelectorAll("style[data-swarm-mobile]").length;
}

function mediaRuleInfo(host) {
  if (!host || !host.shadowRoot) return null;
  const st = host.shadowRoot.querySelector("style[data-swarm-mobile]");
  if (!st || !st.sheet) return null;
  for (const rule of st.sheet.cssRules) {
    // type 4 = CSSMediaRule
    if (rule.type === 4 && /max-width:\s*600px/.test(rule.conditionText || "")) {
      return { condition: rule.conditionText, inner: rule.cssRules.length, text: rule.cssText };
    }
  }
  return null;
}

// jsdom tidak mengimplementasi matchMedia: stub layar HP (<=600px cocok).
function stubMobileViewport(window) {
  window.matchMedia = (q) => ({
    matches: /max-width:\s*600px/.test(q),
    media: q,
    addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  });
}

// Meniru mutasi DOM yang dilakukan App.onComplete() upstream:
// status jadi "Rebuilt by N agents...", Tour/Speed disembunyikan,
// Go live/Replay dimunculkan. HUD-nya sendiri TIDAK diganti.
function simulateComplete(root) {
  const status = root.querySelector(".status");
  if (status) status.innerHTML = 'Rebuilt by <b>70</b> agents in <b>51.8s</b>';
  const bar = root.querySelector(".bar i");
  if (bar) bar.style.width = "100%";
  const dots = root.querySelector(".dots");
  if (dots) dots.innerHTML = "";
  const q = (a) => root.querySelector('[data-a="' + a + '"]');
  if (q("live")) q("live").hidden = false;
  if (q("replay")) q("replay").hidden = false;
  if (q("tour")) q("tour").hidden = true;
  if (q("speed")) q("speed").hidden = true;
}

async function main() {
  // ---------- Tes 1: bundle + patch v3 ----------
  const errors = [];
  const dom = new JSDOM(HTML, {
    url: "https://example.com/",
    pretendToBeVisual: true,
    runScripts: "dangerously",
    virtualConsole: (() => {
      const { VirtualConsole } = require("jsdom");
      const vc = new VirtualConsole();
      vc.on("jsdomError", (e) => errors.push("jsdomError: " + (e.detail && e.detail.stack ? e.detail.stack.split("\n")[0] : e.message)));
      vc.on("error", (...a) => errors.push("console.error: " + a.join(" ")));
      return vc;
    })(),
  });
  const { window } = dom;
  window.addEventListener("error", (e) => errors.push("window.onerror: " + e.message));
  stubMobileViewport(window);

  window.eval(BUNDLE);
  await sleep(1200); // swarm start, host dibuat
  window.eval(PATCH);
  check("patch dievaluasi tanpa throw", true);
  check("window.__swarmMobile ada", !!window.__swarmMobile);
  check("__swarmMobile.version = 3.0.0", !!(window.__swarmMobile && window.__swarmMobile.version === "3.0.0"), window.__swarmMobile && window.__swarmMobile.version);
  check("__swarmMobile.isMobile() true (stub layar HP)", !!(window.__swarmMobile && window.__swarmMobile.isMobile()));

  await sleep(1500); // observer/polling menerapkan patch + perf + FPS
  let host = window.document.querySelector("swarm-rebuild");
  check("host <swarm-rebuild> ada", !!host);
  check("patch disuntik tepat 1x ke shadow root", countPatchStyles(host) === 1, `ditemukan ${countPatchStyles(host)}`);

  const st = host && host.shadowRoot ? host.shadowRoot.querySelector("style[data-swarm-mobile]") : null;
  const cssText = st ? st.textContent : "";
  check("CSS patch memuat @media (max-width: 600px)", cssText.includes("@media (max-width: 600px)"));
  check("CSS patch membatasi lebar bar (max-width 100vw-16px)", /max-width:\s*calc\(100vw - 16px\)/.test(cssText));
  check("CSS patch mengizinkan bungkus (flex-wrap: wrap)", /flex-wrap:\s*wrap/.test(cssText));
  check("CSS patch pakai safe-area bawah", cssText.includes("env(safe-area-inset-bottom"));
  check("CSS patch tidak menyentuh transform (animasi asli utuh)", !/transform:/.test(cssText));

  const mr = mediaRuleInfo(host);
  check("CSSOM: aturan @media ter-parse sebagai CSSMediaRule", !!mr, mr ? mr.condition : "tidak ditemukan");
  check("CSSOM: isi media rule memuat aturan .hud", !!(mr && /max-width/.test(mr.text) && /flex-wrap/.test(mr.text)));

  // --- v2: aturan hemat GPU ---
  check("CSS perf: keyframes swap tanpa blur", /@keyframes swap\{from\{opacity:0\}\}/.test(cssText));
  check("CSS perf: backdrop-filter .bd dimatikan", /\.bd\{[^}]*backdrop-filter:none/.test(cssText));
  check("CSS perf: backdrop-filter .hud dimatikan", /\.hud\{[^}]*backdrop-filter:none/.test(cssText));
  check("CSS perf: drop-shadow kursor dimatikan", /\.cursor svg\{[^}]*filter:none/.test(cssText));
  check("CSS perf: animasi hudpulse dimatikan", /\.hud button\.snd\.tap\{[^}]*animation:none/.test(cssText));
  check("CSS perf: wipe clip-path gambar jadi fade", /\.m>\.md\{[^}]*transition:opacity/.test(cssText));

  // Idempotent: panggil apply() manual 2x -> tetap 1 style
  window.__swarmMobile.apply();
  window.__swarmMobile.apply();
  await sleep(300);
  check("idempotent: apply() manual 2x tetap 1 style", countPatchStyles(host) === 1);

  // --- v2: tombol sembunyikan HUD ---
  const root = host.shadowRoot;
  const hud = root.querySelector(".hud");
  const hideBtn = root.querySelector(".swm-hide");
  const pill = root.querySelector(".swm-showhud");
  check("tombol ▾ ada di dalam .hud", !!hideBtn && !!hud && hud.contains(hideBtn));
  check("tombol ▾ tanpa data-a (diabaikan delegasi klik upstream)", !!hideBtn && !hideBtn.hasAttribute("data-a"));
  check("pil 'Tampilkan bar' ada dan awalnya tersembunyi", !!pill && pill.hidden === true);
  hideBtn.click();
  check("klik ▾ menyembunyikan HUD (class swm-hidden)", hud.classList.contains("swm-hidden"));
  check("pil tampil saat HUD tersembunyi", pill.hidden === false);
  pill.click();
  check("klik pil menampilkan HUD lagi", !hud.classList.contains("swm-hidden"));
  check("pil sembunyi lagi setelah HUD tampil", pill.hidden === true);

  // --- v3: tombol ▾/⚙/📷 ada; ▾ bekerja di keadaan HUD SELESAI ---
  const gearBtn = root.querySelector(".swm-gear");
  const shotBtn = root.querySelector(".swm-shotbtn");
  check("tombol ⚙ ada di dalam .hud", !!gearBtn && hud.contains(gearBtn));
  check("tombol 📷 ada di dalam .hud", !!shotBtn && hud.contains(shotBtn));
  check("tombol ⚙/📷 tanpa data-a", !!gearBtn && !!shotBtn && !gearBtn.hasAttribute("data-a") && !shotBtn.hasAttribute("data-a"));
  simulateComplete(root);
  check("HUD selesai: status 'Rebuilt by' tampil", (root.querySelector(".status") || {}).innerHTML ? root.querySelector(".status").innerHTML.includes("Rebuilt by") : false);
  check("HUD selesai: tombol ▾ masih ada", !!root.querySelector(".swm-hide"));
  check("HUD selesai: tombol ⚙/📷 masih ada", !!root.querySelector(".swm-gear") && !!root.querySelector(".swm-shotbtn"));
  root.querySelector(".swm-hide").click();
  check("HUD selesai: klik ▾ tetap menyembunyikan HUD", hud.classList.contains("swm-hidden"));
  root.querySelector(".swm-showhud").click();
  check("HUD selesai: pil mengembalikan HUD", !hud.classList.contains("swm-hidden"));

  // --- v3: FPS meter ---
  const fpsPill = root.querySelector(".swm-fps");
  check("FPS meter ada (kiri bawah)", !!fpsPill);
  check("FPS meter tampil saat HUD tampil", !!fpsPill && fpsPill.hidden === false);
  await sleep(1500); // beri waktu 2-3 jendela ukur 500ms
  const fpsVal = window.__swarmMobile.fps();
  check("FPS meter nilainya berubah (angka > 0)", typeof fpsVal === "number" && fpsVal > 0, `fps=${fpsVal}, teks="${fpsPill ? fpsPill.textContent : ""}"`);
  check("FPS meter teks cocok pola 'N FPS'", !!fpsPill && /^\d+ FPS$/.test(fpsPill.textContent));
  check("CSS FPS: posisi kiri bawah", /\.swm-fps\{[^}]*left:12px/.test(cssText));
  hideBtn.click();
  check("FPS ikut tersembunyi saat HUD disembunyikan", !!fpsPill && fpsPill.hidden === true);
  pill.click();
  check("FPS kembali tampil saat HUD tampil", !!fpsPill && fpsPill.hidden === false);

  // --- v3: mode screenshot ---
  check("CSS mode screenshot: aturan :host(.swm-shot) ada", cssText.includes(":host(.swm-shot)"));
  check("CSS mode screenshot: menyembunyikan .hud/.cursors/.badges", /:host\(\.swm-shot\)[^{]*\{[^}]*display:none/.test(cssText) && cssText.includes(".cursors") && cssText.includes(".badges"));
  const toast = root.querySelector(".swm-toast");
  check("toast mode screenshot ada dan awalnya tersembunyi", !!toast && toast.hidden === true);
  shotBtn.click();
  check("klik 📷 mengaktifkan mode screenshot (host.swm-shot)", host.classList.contains("swm-shot"));
  check("mode screenshot: FPS tersembunyi", !!fpsPill && fpsPill.hidden === true);
  check("mode screenshot: toast tampil", !!toast && toast.hidden === false);
  check("mode screenshot: pil tampil-bar tetap tersembunyi", !!pill && pill.hidden === true);
  await sleep(3200); // toast fade (1800ms) + sembunyi (600ms) + margin
  check("toast hilang sendiri setelah ~2,4 detik (shot mode tetap aktif)", !!toast && toast.hidden === true && host.classList.contains("swm-shot"));
  // Ketuk di mana saja (klik di host) -> keluar dari mode screenshot.
  host.click();
  check("ketuk di host keluar dari mode screenshot", !host.classList.contains("swm-shot"));
  check("keluar shot mode: HUD kembali tampil", !hud.classList.contains("swm-hidden"));
  check("keluar shot mode: FPS kembali tampil", !!fpsPill && fpsPill.hidden === false);

  // --- v3: panel Pengaturan ---
  const panel = root.querySelector(".swm-panel");
  check("panel Pengaturan ada dan awalnya tersembunyi", !!panel && panel.hidden === true);
  gearBtn.click();
  check("klik ⚙ membuka panel", !!panel && panel.hidden === false);
  const app = window.__swarmRebuild && window.__swarmRebuild.app;
  check("app ada (untuk tes pengaturan)", !!app);
  // Kecepatan 2× — paksa keadaan "masih membangun": halaman uji kecil
  // sehingga rebuild bisa sudah selesai saat tes ini berjalan, dan baris
  // kecepatan memang sengaja nonaktif setelah selesai (by design).
  if (app) {
    app.complete = false;
    const sb0 = root.querySelector('[data-a="speed"]');
    if (sb0) sb0.hidden = false;
    window.__swarmMobile.panel.refresh(root);
  }
  // Kecepatan 2×
  const speedBtn2 = panel.querySelector('[data-set="speed"][data-val="1"]');
  const hudSpeedBtn = root.querySelector('[data-a="speed"]');
  speedBtn2.click();
  check("pengaturan kecepatan 2×: engine.speed = 2", !!(app && app.engine && app.engine.speed === 2), app && app.engine ? `speed=${app.engine.speed}` : "tanpa app");
  check("pengaturan kecepatan 2×: speedIx = 1", !!(app && app.speedIx === 1));
  check("pengaturan kecepatan 2×: tombol HUD ikut jadi '2×'", !!hudSpeedBtn && hudSpeedBtn.textContent === "2×", hudSpeedBtn ? hudSpeedBtn.textContent : "tanpa tombol");
  // Suara nyala
  const sndOn = panel.querySelector('[data-set="sound"][data-val="1"]');
  sndOn.click();
  check("pengaturan suara Nyala: sfx.on = true", !!(app && app.sfx && app.sfx.on === true), app && app.sfx ? `sfx.on=${app.sfx.on}` : "tanpa sfx");
  const sndOff = panel.querySelector('[data-set="sound"][data-val="0"]');
  sndOff.click();
  check("pengaturan suara Mati: sfx.on = false", !!(app && app.sfx && app.sfx.on === false));
  // Throttle mati -> render tidak lagi dibungkus; nyala -> dibungkus lagi
  const thrOff = panel.querySelector('[data-set="throttle"][data-val="0"]');
  thrOff.click();
  check("pengaturan throttle Mati: render tidak ter-throttle", !!(app && app.view && app.view.render && !app.view.render.__swmThrottled));
  if (app && app.view && app.view.render) {
    window.cancelAnimationFrame(app.raf);
    let syncCalls = 0;
    const origSync = app.view.syncWorld.bind(app.view);
    app.view.syncWorld = function () { syncCalls++; return origSync(); };
    app.view.render(app.engine);
    app.view.render(app.engine);
    check("throttle Mati: 2x render -> 2x eksekusi nyata", syncCalls === 2, `syncWorld terpanggil ${syncCalls}x`);
  }
  const thrOn = panel.querySelector('[data-set="throttle"][data-val="1"]');
  thrOn.click();
  check("pengaturan throttle Nyala: render ter-throttle lagi", !!(app && app.view && app.view.render && app.view.render.__swmThrottled));
  // FPS meter on/off dari panel
  const fpsOff = panel.querySelector('[data-set="fps"][data-val="0"]');
  fpsOff.click();
  check("pengaturan FPS Mati: pil tersembunyi", !!fpsPill && fpsPill.hidden === true);
  const fpsOn = panel.querySelector('[data-set="fps"][data-val="1"]');
  fpsOn.click();
  check("pengaturan FPS Nyala: pil tampil lagi", !!fpsPill && fpsPill.hidden === false);
  // Sembunyikan bar dari panel
  const hideBarBtn = panel.querySelector('[data-set="hidebar"]');
  hideBarBtn.click();
  check("pengaturan Sembunyikan bar: HUD tersembunyi + panel tertutup", hud.classList.contains("swm-hidden") && panel.hidden === true);
  pill.click();
  check("pil mengembalikan HUD setelah hide dari panel", !hud.classList.contains("swm-hidden"));
  // Panel: buka lagi -> tutup via ✕
  gearBtn.click();
  check("panel dibuka lagi", !!panel && panel.hidden === false);
  const closeBtn = panel.querySelector(".swm-pclose");
  closeBtn.click();
  check("tombol ✕ menutup panel", !!panel && panel.hidden === true);
  gearBtn.click();
  check("klik ⚙ membuka lagi panel yang tertutup", !!panel && panel.hidden === false);
  gearBtn.click();
  check("klik ⚙ menutup panel yang terbuka", !!panel && panel.hidden === true);

  // --- v2: optimasi JS (throttle render + mute suara) ---
  check("render ter-throttle (flag __swmThrottled)", !!(app && app.view && app.view.render && app.view.render.__swmThrottled));
  if (app && app.view && app.view.render) {
    // Hentikan loop rAF supaya hitungan deterministik: 2 panggilan
    // berurutan harus mengeksekusi tepat 1x (yang kedua dilewati).
    window.cancelAnimationFrame(app.raf);
    let syncCalls = 0;
    const origSync = app.view.syncWorld.bind(app.view);
    app.view.syncWorld = function () { syncCalls++; return origSync(); };
    app.view.render(app.engine);
    app.view.render(app.engine);
    check("throttle: 2x render -> 1x eksekusi nyata", syncCalls === 1, `syncWorld terpanggil ${syncCalls}x`);
  }

  // Toggle off -> on: host baru harus ter-patch tepat 1x (observer hidup),
  // tombol + FPS + panel ada lagi, dan perf diterapkan ke app baru.
  window.__swarmRebuild.toggle();
  await sleep(400);
  check("toggle off: host terhapus", !window.document.querySelector("swarm-rebuild"));
  window.__swarmRebuild.toggle();
  await sleep(1500);
  host = window.document.querySelector("swarm-rebuild");
  check("toggle on: host baru dibuat", !!host);
  check("toggle on: patch diterapkan ulang tepat 1x", countPatchStyles(host) === 1, `ditemukan ${countPatchStyles(host)}`);
  const root2 = host && host.shadowRoot;
  check("toggle on: tombol ▾/⚙/📷 ada lagi di host baru", !!(root2 && root2.querySelector(".swm-hide") && root2.querySelector(".swm-gear") && root2.querySelector(".swm-shotbtn")));
  check("toggle on: FPS meter + panel ada lagi", !!(root2 && root2.querySelector(".swm-fps") && root2.querySelector(".swm-panel")));
  const app2 = window.__swarmRebuild && window.__swarmRebuild.app;
  check("toggle on: perf diterapkan ke app baru", !!(app2 && app2.view && app2.view.render && app2.view.render.__swmThrottled));
  check("toggle on: suara dimatikan lagi di app baru", !!(app2 && app2.sfx && app2.sfx.on === false));
  check("toggle tetap jalan (app ada)", !!app2);

  const realErrors = errors.filter((e) => !/Not implemented: (window\.scrollTo|HTMLCanvasElement.*getContext|navigation)/.test(e));
  check("tanpa error JS tak tertangkap saat patch jalan", realErrors.length === 0, realErrors.slice(0, 3).join(" | "));
  window.close();

  // ---------- Tes 2: loader baru (@main + fallback pin) ----------
  const alerts = [];
  const dom2 = new JSDOM(HTML, {
    url: "https://example.com/",
    pretendToBeVisual: true,
    runScripts: "dangerously",
    resources: "usable",
  });
  const w2 = dom2.window;
  w2.alert = (m) => alerts.push(m);
  check("loader berisi URL upstream @main", LOADER.includes("DhvanilPatel/swarm-cursors@main/swarm-rebuild/swarm.js"));
  check("loader berisi fallback pin commit", LOADER.includes("swarm-cursors@3d49e0ac96172eb6af7ae8229b2152121bed2092"));
  check("loader berisi URL patch repo user", LOADER.includes("hozin-king/swarm-rebuild-bookmarklet@main/swarm-mobile.js"));
  w2.eval(LOADER);
  // Tunggu swarm.js selesai dimuat dari CDN dulu (patch baru ditempelkan
  // di s.onload, jadi cek daftar script SETELAH fetch selesai).
  for (let i = 0; i < 40 && !w2.__swarmRebuild; i++) await sleep(200);
  const scripts = [...w2.document.querySelectorAll("script[src]")].map((s) => s.src);
  check("loader menempelkan script swarm.js upstream @main", scripts.some((s) => s.includes("DhvanilPatel/swarm-cursors@main")), scripts.join(" | "));
  check("loader menempelkan script patch repo user", scripts.some((s) => s.includes("hozin-king/swarm-rebuild-bookmarklet@main/swarm-mobile.js")), scripts.join(" | "));
  await sleep(1500); // beri waktu fetch patch selesai
  check("swarm jalan", !!w2.__swarmRebuild, w2.__swarmRebuild ? "ok" : "gagal");
  check("loader tidak memunculkan alert", alerts.length === 0, alerts.join(" | "));
  const host2 = w2.document.querySelector("swarm-rebuild");
  check("host swarm ada setelah loader", !!host2);
  w2.close();

  console.log(failures === 0 ? "\nSEMUA SMOKE TEST PATCH LULUS" : `\n${failures} TES GAGAL`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("HARNESS ERROR:", e);
  process.exit(2);
});
