/* ============================================================
   i18n — English lives in the HTML, Indonesian lives here.
   English is the source of truth, so the page is complete and
   readable even if this script never runs.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'bb-lang';
  var SUPPORTED = ['en', 'id'];

  var ID = {
    /* chrome */
    'skip': 'Lewati ke konten utama',
    'nav.features': 'Fitur',
    'nav.accessibility': 'Aksesibilitas',
    'nav.themes': 'Tema',
    'nav.support': 'Bantuan',
    'nav.privacy': 'Privasi',
    'nav.open': 'Buka menu',
    'nav.close': 'Tutup menu',

    /* hero */
    'hero.eyebrow': 'iPhone & iPad · Aksesibilitas lebih dulu',
    'hero.title': 'Main Tanpa Batas',
    'hero.sub': 'Puzzle balok yang dibuat untuk semua orang — awas, tunanetra, atau buta warna.',
    'hero.note': 'Segera hadir. Gratis, tanpa iklan, tanpa pelacakan.',
    'cta.appstore': 'Dapatkan di App Store',
    'cta.appstore.short': 'Buka App Store',
    'cta.learn': 'Pelajari lebih lanjut',

    /* features */
    'features.kicker': 'Fitur',
    'features.title': 'Satu permainan, tiga cara membacanya',
    'features.lede': 'Setiap langkah disampaikan secara visual, suara, dan getaran sekaligus — jadi kehilangan salah satu saluran tetap menyisakan papan yang sepenuhnya bisa dimainkan.',
    'features.c1.title': 'Tiga cara bermain',
    'features.c1.body': 'Seret balok, atau ketuk balok lalu ketuk sel, atau biarkan kontrol tahan menempatkannya setelah jeda yang kamu tentukan. Ketiganya menjalankan permainan yang sama dan bisa ditukar di tengah permainan.',
    'features.c2.title': 'Dengarkan papannya',
    'features.c2.body': 'Setiap sel punya nada untuk barisnya dan posisi ruang untuk kolomnya. Sapukan jari dan papan berbunyi kembali — pembersihan berkilau, kombo menumpuk harmonik, langkah salah berdengung.',
    'features.c3.title': 'Lihat polanya',
    'features.c3.body': 'Warna tidak pernah menjadi satu-satunya sinyal. Ketujuh balok membawa pola berbeda — titik, garis, silang, gelombang — ditambah kontras tinggi, enam tema, dan simulasi buta warna langsung.',

    /* accessibility */
    'a11y.kicker': 'Aksesibilitas',
    'a11y.title': 'Dibangun di dalam modelnya, bukan di halaman pengaturan',
    'a11y.blind.title': 'Bisa dimainkan dengan layar mati',
    'a11y.blind.body': 'Setiap sel dan slot baki adalah elemen VoiceOver berlabel: “Baris 3, kolom 5, merah dengan titik-titik, muat di sini, membersihkan 2 baris.” Jelajah Audio mengubah papan menjadi permukaan sentuh langsung — geser untuk mendengar tiap sel, angkat untuk mendengar deskripsinya, ketuk tiga kali untuk menempatkan. Semuanya jalan dengan Tirai Layar aktif.',
    'a11y.color.title': 'Terbaca tanpa penglihatan warna',
    'a11y.color.body': 'Tujuh warna, tujuh pola, selalu digambar. Simulasi deuteranopia, protanopia, tritanopia, dan akromatopsia berlaku untuk seluruh permainan, bukan sekadar contoh warna — dan tema Minimal mewarnai semua balok dengan putih yang sama, bukti bahwa permainan ini tidak pernah bergantung pada warna.',
    'a11y.motor.title': 'Tidak ada gerakan yang tak bisa kamu lakukan',
    'a11y.motor.body': 'Menyeret tidak pernah diwajibkan. Kontrol tahan menempatkan balok setelah jeda yang kamu atur antara 0,4 hingga 4 detik dan cocok dengan Kontrol Sakelar. Nyaris meleset akan menempel ke posisi yang sah, urung diperoleh terus-menerus, dan mode Zen tidak punya kekalahan sama sekali.',
    'a11y.demo.alt': 'Tujuh balok puzzle, masing-masing dengan warna dan pola berbeda: titik, garis mendatar, garis tegak, silang rapat, garis diagonal, papan catur, dan gelombang.',
    'a11y.demo.cap': 'Tujuh warna, tujuh pola. Nyalakan simulasi untuk melihat palet seperti yang dilihat pemain buta warna.',
    'a11y.demo.group': 'Simulasi penglihatan warna',
    'a11y.sim.none': 'Normal',
    'a11y.sim.deuter': 'Deuteranopia',
    'a11y.sim.protan': 'Protanopia',
    'a11y.sim.tritan': 'Tritanopia',
    'a11y.sim.achroma': 'Akromatopsia',

    /* themes */
    'themes.kicker': 'Tema',
    'themes.title': 'Enam cara memandangnya',
    'themes.lede': 'Setiap tema tetap mempertahankan pola. Pilih yang paling nyaman untuk matamu — termasuk satu tema khusus kontras, dan satu yang menghapus warna sepenuhnya dari persamaan.',
    'themes.region': 'Pratinjau tema — gulir atau pakai tombol panah',
    'themes.classic': 'Balok cerah dan pekat.',
    'themes.neon': 'Balok bercahaya di atas hitam pekat.',
    'themes.pastel': 'Warna lembut berintensitas rendah.',
    'themes.contrast': 'Isian solid, batas tebal, pemisahan maksimal.',
    'themes.nature': 'Nuansa kayu, batu, dan daun.',
    'themes.minimal': 'Satu warna. Pola membawa seluruh identitas.',

    /* stats */
    'stats.title': 'Dalam angka',
    'stats.grid': 'Papan',
    'stats.pieces': 'Bentuk balok',
    'stats.themes': 'Tema',
    'stats.langs': 'Bahasa',

    /* voices */
    'voices.kicker': 'Untuk siapa kami merancang',
    'voices.title': 'Para pemain yang menentukan standarnya',
    'voices.lede': 'Inilah kebutuhan yang menjadi tolok ukur permainan ini — ditulis sebagai komitmen desain, bukan ulasan pengguna. Masukan beta yang sesungguhnya datang bersama peluncuran.',
    'voices.q1': 'Saya seharusnya tidak perlu bertanya kepada orang awas di mana papan sudah penuh. Permainannya yang harus memberi tahu saya — dengan jelas, tanpa saya perlu menghafal manual.',
    'voices.a1': 'Pemain VoiceOver, menavigasi lewat suara',
    'voices.q2': 'Merah dan hijau adalah balok yang sama bagi saya. Kalau sebuah puzzle meminta saya membedakannya, ia sudah memutuskan bahwa saya bukan audiensnya.',
    'voices.a2': 'Pemain dengan deuteranopia',
    'voices.q3': 'Seretan yang presisi justru satu hal yang tidak bisa saya andalkan. Beri saya cara membidik perlahan dan menetapkan dengan sengaja, dan saya bisa memainkan apa pun.',
    'voices.a3': 'Pemain Kontrol Sakelar',

    /* cta */
    'cta.title': 'Segera hadir di App Store',
    'cta.lede': 'Gratis, tanpa iklan, tanpa pelacakan, tanpa akun. iPhone dan iPad, bahasa Inggris dan Indonesia.',
    'cta.store.small': 'Segera hadir di',
    'cta.store.big': 'App Store',
    'cta.form.label': 'Beri tahu saya saat sudah rilis',
    'cta.form.placeholder': 'kamu@contoh.com',
    'cta.form.button': 'Beri tahu saya',
    'cta.form.fine': 'Satu email saat peluncuran, lalu tidak ada lagi. Tanpa daftar, tanpa berbagi — formulir demo ini tidak menyimpan apa pun.',

    /* form status */
    'form.invalid': 'Masukkan alamat email yang valid.',
    'form.success': 'Terima kasih! Ini demo — tidak ada yang dikirim atau disimpan.',

    /* footer */
    'footer.tag': 'Puzzle balok yang dibuat untuk semua orang.',
    'footer.press': 'Kit pers',
    'footer.github': 'Repositori GitHub',
    'footer.x': 'X (Twitter)',
    'footer.copy': '© 2026 Block Blast. Dibangun dengan aksesibilitas lebih dulu.',

    /* support page */
    'support.title': 'Bantuan',
    'support.lede': 'Semua yang perlu diketahui untuk memasang, menyiapkan, dan memainkan Block Blast: Accessible Edition.',
    'support.updated': 'Terakhir diperbarui 13 Agustus 2026',
    'support.toc': 'Di halaman ini',

    /* privacy page */
    'privacy.title': 'Kebijakan Privasi',
    'privacy.lede': 'Ringkasnya: permainan ini berjalan di perangkatmu dan tidak mengumpulkan apa pun tentangmu.',
    'privacy.updated': 'Berlaku 13 Agustus 2026',
    'privacy.toc': 'Di halaman ini'
  };

  var english = new WeakMap();   // element -> original English strings
  var current = 'en';

  function cache(el, key, value) {
    var store = english.get(el) || {};
    if (!(key in store)) { store[key] = value; english.set(el, store); }
    return store[key];
  }

  function apply(lang) {
    var isID = lang === 'id';

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var original = cache(el, 'text', el.textContent);
      el.textContent = isID && ID[key] ? ID[key] : original;
    });

    [['data-i18n-aria', 'aria-label'], ['data-i18n-placeholder', 'placeholder']].forEach(function (pair) {
      document.querySelectorAll('[' + pair[0] + ']').forEach(function (el) {
        var key = el.getAttribute(pair[0]);
        var original = cache(el, pair[1], el.getAttribute(pair[1]) || '');
        el.setAttribute(pair[1], isID && ID[key] ? ID[key] : original);
      });
    });

    // Long-form pages ship both languages in the markup.
    document.querySelectorAll('[data-lang-block]').forEach(function (el) {
      el.hidden = el.getAttribute('data-lang-block') !== lang;
    });

    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-btn') === lang));
    });

    current = lang;
    document.dispatchEvent(new CustomEvent('bb:langchange', { detail: { lang: lang } }));
  }

  function set(lang) {
    if (SUPPORTED.indexOf(lang) === -1 || lang === current) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode */ }
    apply(lang);
  }

  function initial() {
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) { /* private mode */ }
    if (stored && SUPPORTED.indexOf(stored) !== -1) return stored;
    return (navigator.language || 'en').toLowerCase().indexOf('id') === 0 ? 'id' : 'en';
  }

  document.addEventListener('click', function (event) {
    var btn = event.target.closest('[data-lang-btn]');
    if (btn) set(btn.getAttribute('data-lang-btn'));
  });

  window.BBi18n = {
    get lang() { return current; },
    set: set,
    t: function (key, fallback) { return current === 'id' && ID[key] ? ID[key] : fallback; }
  };

  apply(initial());
})();
