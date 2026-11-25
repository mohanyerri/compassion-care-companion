/*
  Shared editor for every pamphlet version.
  A version page only needs: <div class="poster" id="poster"> ... </div>
    - data-edit="name"   text you can click and edit (saved per version, in this browser)
    - class="js-url"     shows the website link (updated from the "Website link" box)
    - class="qr" data-size="214"   QR code to the website link
    - data-logo="light|brand" data-stroke="#hex"   draws the withyouseniors logo mark
  This script adds the toolbar, preview scaling, saving, caption copy and PNG download.
*/
(function () {
  // ---- Versions shown in the "Style" menu. Add a new file here to list it. ----
  var VERSIONS = [
    { file: 'index.html',    name: '1 · Classic' },
    { file: 'question.html', name: '2 · Question' },
    { file: 'steps.html',    name: '3 · How it works' },
    { file: 'bold.html',     name: '4 · Bold' },
    { file: 'updates.html',  name: '5 · Live updates' },
    { file: 'complete.html', name: '6 · Full story' },
    { file: 'complete-illustrated.html', name: '7 · Full story + illustration' }
  ];
  var DEFAULT_URL = 'https://www.withyouseniors.in';
  var URL_KEY = 'wys-pamphlet-url';                       // link is shared by all versions
  var body = document.body;
  var KEY = body.dataset.key || 'wys-pamphlet-' + location.pathname.split('/').pop();
  var CAPTION = body.dataset.caption ||
    'Parents in India, you abroad? We go with them to every hospital visit. 👉 ';
  var FILE_NAME = body.dataset.download || 'withyouseniors-status.png';

  // ---- Logo mark ----
  function logoSvg(variant, stroke) {
    var light = variant !== 'brand';
    var c = light
      ? { a: '#7FA493', b: '#C9DCF2', c: '#FFFFFF', d: '#7FA493', e: '#4E7363', s: stroke || '#1B3C6B' }
      : { a: '#4E7363', b: '#1B3C6B', c: '#2B5A9B', d: '#4E7363', e: '#3A5A4B', s: stroke || '#FFFFFF' };
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 13 64 38" width="100%" height="100%" aria-hidden="true">' +
      '<path d="M56 30H27A7.5 7.5 0 0 0 27 45H56Z" fill="' + c.a + '"/>' +
      '<path d="M2 16H10V34H2Z" fill="' + c.b + '"/>' +
      '<path d="M10 17H35A11 11 0 0 1 46 28V43A5 5 0 0 1 36 43V34H10Z" fill="' + c.c + '" stroke="' + c.s + '" stroke-width="1.6" stroke-linejoin="round" paint-order="stroke"/>' +
      '<path d="M53.5 31.5L48 25.5" stroke="' + c.s + '" stroke-width="7.6" stroke-linecap="round"/>' +
      '<path d="M47 30H56V45H47Z" fill="' + c.d + '"/>' +
      '<path d="M53.5 31.5L48 25.5" stroke="' + c.d + '" stroke-width="5.4" stroke-linecap="round"/>' +
      '<path d="M62 29.5H56V46.5H62Z" fill="' + c.e + '"/>' +
      '<circle cx="59" cy="38" r="1.2" fill="#F0A868"/></svg>';
  }
  document.querySelectorAll('[data-logo]').forEach(function (el) {
    el.innerHTML = logoSvg(el.dataset.logo, el.dataset.stroke);
  });

  // ---- Build toolbar + stage around the poster ----
  var poster = document.getElementById('poster');
  var here = location.pathname.split('/').pop() || 'index.html';
  var options = VERSIONS.map(function (v) {
    return '<option value="' + v.file + '"' + (v.file === here ? ' selected' : '') + '>' + v.name + '</option>';
  }).join('');
  var bar = document.createElement('div');
  bar.className = 'toolbar';
  bar.innerHTML =
    '<label>Style <select id="styleSelect">' + options + '</select></label>' +
    '<button type="button" id="btnEdit" aria-pressed="false">Edit text</button>' +
    '<label>Website link <input id="urlInput" type="url"></label>' +
    '<button type="button" id="btnCaption">Copy caption</button>' +
    '<button type="button" class="primary" id="btnDownload">Download image</button>' +
    '<button type="button" id="btnReset">Reset</button>' +
    '<p class="hint" id="editHint" hidden>Click any outlined text on the pamphlet and type. Changes save automatically.</p>';
  var stage = document.createElement('div'); stage.className = 'stage';
  var frame = document.createElement('div'); frame.className = 'frame';
  var scaler = document.createElement('div'); scaler.className = 'scaler';
  poster.parentNode.insertBefore(stage, poster);
  scaler.appendChild(poster); frame.appendChild(scaler); stage.appendChild(frame);
  body.insertBefore(bar, body.firstChild);
  var toastEl = document.createElement('div');
  toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
  body.appendChild(toastEl);

  document.getElementById('styleSelect').addEventListener('change', function () { location.href = this.value; });

  var urlInput = document.getElementById('urlInput');
  var editables = Array.prototype.slice.call(poster.querySelectorAll('[data-edit]'));
  var defaults = {};
  editables.forEach(function (el) { defaults[el.dataset.edit] = el.innerHTML; });

  // ---- Save / restore ----
  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function save() {
    var text = {};
    editables.forEach(function (el) { text[el.dataset.edit] = el.innerHTML; });
    write(KEY, { text: text });
    write(URL_KEY, urlInput.value);
  }
  var saved = read(KEY) || {};
  urlInput.value = read(URL_KEY) || saved.url || DEFAULT_URL;
  if (saved.text) editables.forEach(function (el) {
    if (saved.text[el.dataset.edit] != null) el.innerHTML = saved.text[el.dataset.edit];
  });

  // ---- Fit poster to window ----
  function fit() {
    var availW = Math.min(window.innerWidth - 32, 1080);
    var availH = window.innerHeight - bar.offsetHeight - 60;
    var s = Math.min(availW / 1080, Math.max(availH, 500) / 1920);
    scaler.style.transform = 'scale(' + s + ')';
    frame.style.width = (1080 * s) + 'px';
    frame.style.height = (1920 * s) + 'px';
  }
  window.addEventListener('resize', fit);
  fit();

  // ---- Link + QR ----
  function prettyUrl(u) { return u.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, ''); }
  function normUrl(u) { u = (u || '').trim(); if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u; return u || DEFAULT_URL; }
  function renderUrl() {
    var u = normUrl(urlInput.value);
    poster.querySelectorAll('.js-url').forEach(function (el) { el.textContent = prettyUrl(u); });
    poster.querySelectorAll('.qr').forEach(function (qr) {
      var size = parseInt(qr.dataset.size, 10) || 214;
      qr.innerHTML = '';
      if (!window.QRCode) return;
      new QRCode(qr, { text: u, width: size * 2, height: size * 2,
        colorDark: qr.dataset.dark || '#1B3C6B', colorLight: '#FFFFFF', correctLevel: QRCode.CorrectLevel.M });
      qr.querySelectorAll('img, canvas').forEach(function (n) { n.style.width = size + 'px'; n.style.height = size + 'px'; });
    });
  }
  urlInput.addEventListener('input', function () { renderUrl(); save(); });
  renderUrl();

  // ---- Edit mode ----
  var btnEdit = document.getElementById('btnEdit');
  btnEdit.addEventListener('click', function () {
    var on = btnEdit.getAttribute('aria-pressed') !== 'true';
    btnEdit.setAttribute('aria-pressed', String(on));
    btnEdit.textContent = on ? 'Done editing' : 'Edit text';
    document.getElementById('editHint').hidden = !on;
    poster.classList.toggle('editing', on);
    editables.forEach(function (el) { el.contentEditable = on ? 'true' : 'false'; });
    fit();
  });
  editables.forEach(function (el) {
    el.addEventListener('input', save);
    el.addEventListener('paste', function (e) {           // paste as plain text
      e.preventDefault();
      document.execCommand('insertText', false, (e.clipboardData || window.clipboardData).getData('text'));
    });
  });

  // ---- Reset ----
  document.getElementById('btnReset').addEventListener('click', function () {
    if (!confirm('Reset this version\'s text to the defaults?')) return;
    editables.forEach(function (el) { el.innerHTML = defaults[el.dataset.edit]; });
    try { localStorage.removeItem(KEY); } catch (e) {}
  });

  // ---- Toast ----
  var toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2500);
  }

  // ---- Caption (the link in the caption is what people tap on WhatsApp Status) ----
  document.getElementById('btnCaption').addEventListener('click', function () {
    var text = CAPTION + normUrl(urlInput.value);
    function done() { toast('Caption copied. Paste it when you post the status.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { prompt('Copy this caption:', text); });
    } else { prompt('Copy this caption:', text); }
  });

  // ---- Download PNG at full 1080x1920 ----
  // Logos are left out of the capture and painted onto the canvas afterwards,
  // because some browsers (e.g. Safari) drop them during capture.
  function svgImage(svgEl, w, h) {
    var clone = svgEl.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', w); clone.setAttribute('height', h);
    var img = new Image();
    var ready = new Promise(function (res, rej) { img.onload = function () { res(img); }; img.onerror = rej; });
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    return ready;
  }
  document.getElementById('btnDownload').addEventListener('click', function () {
    if (!window.htmlToImage) { toast('Could not load the image tool. Check your internet connection.'); return; }
    var wasEditing = poster.classList.contains('editing');
    poster.classList.remove('editing');
    editables.forEach(function (el) { el.blur(); });

    var p = poster.getBoundingClientRect();
    var s = p.width / 1080;
    var logos = Array.prototype.slice.call(poster.querySelectorAll('[data-logo]')).map(function (el) {
      var r = el.getBoundingClientRect();
      var box = { x: (r.left - p.left) / s, y: (r.top - p.top) / s, w: r.width / s, h: r.height / s };
      return svgImage(el.querySelector('svg'), box.w, box.h).then(function (img) { box.img = img; return box; });
    });

    // Hide logos (keeping their space) while capturing.
    var logoEls = Array.prototype.slice.call(poster.querySelectorAll('[data-logo]'));
    function showLogos(v) { logoEls.forEach(function (el) { el.style.visibility = v ? '' : 'hidden'; }); }

    Promise.all(logos).then(function (boxes) {
      showLogos(false);
      return htmlToImage.toCanvas(poster, { width: 1080, height: 1920, pixelRatio: 1, cacheBust: true })
        .then(function (canvas) { showLogos(true); return [canvas].concat(boxes); },
              function (e) { showLogos(true); throw e; });
    })
    .then(function (r) {
      var canvas = r[0], ctx = canvas.getContext('2d');
      r.slice(1).forEach(function (b) { ctx.drawImage(b.img, b.x, b.y, b.w, b.h); });
      return canvas.toDataURL('image/png');
    })
    .then(function (dataUrl) {
      if (wasEditing) poster.classList.add('editing');
      var a = document.createElement('a');
      a.download = FILE_NAME; a.href = dataUrl; a.click();
      toast('Image downloaded. Post it with the copied caption.');
    })
    .catch(function () {
      if (wasEditing) poster.classList.add('editing');
      toast('Download failed. Try another browser, or take a screenshot.');
    });
  });
})();
