/* swarm-bookmarklet.js — Loader Swarm Rebuild (bookmarklet) + update otomatis.
 *
 * CARA KERJA:
 *   1. File ini dimuat dari repo ini lewat jsDelivr (@main) oleh bookmark
 *      kecil di browser. Jadi SEMUA perubahan di repo ini (patch mobile,
 *      perbaikan loader, pin upstream) langsung kepakai tanpa ganti bookmark.
 *   2. Loader memuat swarm.js upstream dari branch main (versi terbaru).
 *      Bila gagal (mis. file dipindah), otomatis fallback ke commit pin
 *      3d49e0ac yang sudah teruji.
 *   3. Setelah swarm jalan, loader memuat swarm-mobile.js (patch tampilan HP)
 *      dari repo ini. Bila patch gagal dimuat, swarm tetap jalan normal.
 *   4. Ketuk bookmark kedua kali = toggle mati (window.__swarmRebuild.toggle).
 */
(function(){if(window.__swarmRebuild){window.__swarmRebuild.toggle();return;}
var PIN='https://cdn.jsdelivr.net/gh/DhvanilPatel/swarm-cursors@3d49e0ac96172eb6af7ae8229b2152121bed2092/swarm-rebuild/swarm.js';
var MAIN='https://cdn.jsdelivr.net/gh/DhvanilPatel/swarm-cursors@main/swarm-rebuild/swarm.js';
function loadPatch(){var m=document.createElement('script');m.src='https://cdn.jsdelivr.net/gh/hozin-king/swarm-rebuild-bookmarklet@main/swarm-mobile.js';m.onerror=function(){};(document.head||document.documentElement).appendChild(m);}
function loadSwarm(src,fallback){var s=document.createElement('script');s.src=src;s.onload=loadPatch;s.onerror=function(){if(fallback){loadSwarm(fallback,null);}else{alert('Swarm Rebuild gagal dimuat. Cek koneksi internet atau CSP halaman ini.');}};(document.head||document.documentElement).appendChild(s);}
loadSwarm(MAIN,PIN);})();
