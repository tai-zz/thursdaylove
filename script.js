/* ============================================================
   Certidão de Casamento — Ana Júlia & João Eduardo
   ============================================================ */
(function () {
  'use strict';

  var NOIVA = 'Ana Júlia Bassani de Souza Nascimento';
  var NOIVO = 'João Eduardo Pinto';
  var STORE = 'certidao-anajulia-v1';

  var MESES = ['janeiro','fevereiro','março','abril','maio','junho',
               'julho','agosto','setembro','outubro','novembro','dezembro'];

  var $ = function (id) { return document.getElementById(id); };

  var intro    = $('intro'),    envelope = $('envelope');
  var stage    = $('stage'),    frame    = $('frame');
  var cert     = $('cert'),     certImg  = $('certImg');
  var fNoiva   = $('fNoiva'),   fNoivo   = $('fNoivo');
  var fDia     = $('fDia'),     fMes     = $('fMes');
  var stamp    = $('stamp'),    stampDate= $('stampDate');
  var pad      = $('pad'),      padWrap  = pad.parentNode;
  var signLabel= $('signLabel');
  var btnClear = $('btnClear'), btnSign  = $('btnSign');
  var done     = $('done'),     doneDate = $('doneDate');
  var btnDown  = $('btnDownload'), btnRedo = $('btnRedo');
  var fx       = $('fx'),       flash    = $('flash');

  /* ---------- imagem para exportar (data: URI, não contamina o canvas) ---------- */
  var exportImg = null;
  (function prepararExport() {
    if (!window.CERT_DATA_URL) { setTimeout(prepararExport, 250); return; }
    var im = new Image();
    im.onload = function () { exportImg = im; };
    im.src = window.CERT_DATA_URL;
  })();

  /* ---------- data de hoje ---------- */
  var hoje = new Date();
  var DIA  = String(hoje.getDate()).padStart(2, '0');
  var MES  = MESES[hoje.getMonth()];
  var ANO  = hoje.getFullYear();
  var DATA_LONGA = DIA + ' de ' + MES + ' de ' + ANO;
  var DATA_CURTA = DIA + '/' + String(hoje.getMonth() + 1).padStart(2, '0') + '/' + ANO;

  stampDate.textContent = DATA_CURTA;
  doneDate.textContent  = DATA_LONGA;

  /* ---------- preenche e ajusta os campos à largura das linhas ---------- */
  var CAMPOS = [[fNoiva, NOIVA], [fNoivo, NOIVO], [fDia, DIA], [fMes, MES + ' de ' + ANO]];
  CAMPOS.forEach(function (c) { c[0].firstElementChild.textContent = c[1]; });

  function ajustar(el) {
    var b = el.firstElementChild;
    var limite = cert.clientWidth * parseFloat(el.dataset.max || 1);
    if (!limite) return;
    el.style.fontSize = '';
    b.style.transform = '';
    var base = parseFloat(getComputedStyle(el).fontSize) || 14;
    var w = b.getBoundingClientRect().width;
    if (!w || w <= limite) return;
    var fs = Math.max(base * 0.60, base * (limite / w));
    el.style.fontSize = fs.toFixed(2) + 'px';
    w = b.getBoundingClientRect().width;
    if (w > limite) b.style.transform = 'scaleX(' + (limite / w).toFixed(3) + ')';
  }
  function ajustarTodos() { CAMPOS.forEach(function (c) { ajustar(c[0]); }); }
  window.addEventListener('resize', ajustarTodos);
  if (certImg.complete) ajustarTodos(); else certImg.addEventListener('load', ajustarTodos);

  /* ============================================================
     Coraçõezinhos de fundo
     ============================================================ */
  (function hearts() {
    var box = $('heartsBg');
    var glyphs = ['\u2764\uFE0F', '💕', '💖', '🤍', '💞', '✨', '🌸'];
    var n = window.innerWidth < 500 ? 14 : 22;
    for (var i = 0; i < n; i++) {
      var el = document.createElement('i');
      el.textContent = glyphs[(Math.random() * glyphs.length) | 0];
      el.style.left = (Math.random() * 100) + '%';
      el.style.fontSize = (10 + Math.random() * 20) + 'px';
      el.style.animationDuration = (11 + Math.random() * 14) + 's';
      el.style.animationDelay = (-Math.random() * 20) + 's';
      el.style.setProperty('--dx', ((Math.random() * 120) - 60) + 'px');
      el.style.setProperty('--rot', ((Math.random() * 400) - 200) + 'deg');
      box.appendChild(el);
    }
  })();

  /* ============================================================
     Abertura
     ============================================================ */
  var opened = false;
  function abrir() {
    if (opened) return;
    opened = true;
    envelope.classList.add('open');
    burst(window.innerWidth / 2, window.innerHeight / 2, 34, 0.75);

    setTimeout(function () {
      intro.classList.add('gone');
      stage.setAttribute('aria-hidden', 'false');
      stage.classList.add('live');
      cert.classList.add('sweep');

      [fNoiva, fNoivo, fDia, fMes].forEach(function (el, i) {
        setTimeout(function () { el.classList.add('in'); }, 900 + i * 330);
      });

      setTimeout(function () {
        if (!assinado) {
          btnSign.disabled = false;
          btnClear.disabled = false;
        }
      }, 2200);

      setTimeout(function () { intro.style.display = 'none'; }, 1000);
    }, 900);
  }
  envelope.addEventListener('click', abrir);

  /* ============================================================
     Prancheta de assinatura
     ============================================================ */
  var ctx, dpr = Math.min(window.devicePixelRatio || 1, 3);
  var strokes = [], current = null, drawing = false, dirty = false;

  function sizePad() {
    var r = pad.getBoundingClientRect();
    pad.width  = Math.round(r.width  * dpr);
    pad.height = Math.round(r.height * dpr);
    ctx = pad.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1f3d78';
    repaint();
  }

  function repaint() {
    if (!ctx) return;
    var r = pad.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    strokes.forEach(drawStroke);
    if (current) drawStroke(current);
  }

  function drawStroke(s) {
    if (s.length < 2) {
      if (s.length === 1) {
        ctx.beginPath();
        ctx.arc(s[0].x, s[0].y, s[0].w / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#1f3d78';
        ctx.fill();
      }
      return;
    }
    for (var i = 1; i < s.length; i++) {
      ctx.beginPath();
      ctx.lineWidth = s[i].w;
      ctx.moveTo(s[i - 1].x, s[i - 1].y);
      ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    }
  }

  function pos(e) {
    var r = pad.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  var lastT = 0, lastP = null;

  function start(e) {
    if (assinado) return;
    e.preventDefault();
    drawing = true;
    pad.setPointerCapture && pad.setPointerCapture(e.pointerId);
    var p = pos(e);
    lastP = p; lastT = performance.now();
    current = [{ x: p.x, y: p.y, w: 3.2 }];
    if (!dirty) { dirty = true; padWrap.classList.add('dirty'); }
    repaint();
  }

  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    var p = pos(e), now = performance.now();
    var dx = p.x - lastP.x, dy = p.y - lastP.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var v = dist / Math.max(now - lastT, 1);
    var w = Math.max(1.4, Math.min(4.6, 4.6 - v * 2.6));
    // suavização
    var sm = { x: lastP.x + dx * 0.62, y: lastP.y + dy * 0.62, w: w };
    current.push(sm);
    current.push({ x: p.x, y: p.y, w: w });
    lastP = p; lastT = now;
    repaint();
    updateButtons();
  }

  function end(e) {
    if (!drawing) return;
    drawing = false;
    if (current && current.length) strokes.push(current);
    current = null;
    repaint();
    updateButtons();
  }

  pad.addEventListener('pointerdown', start);
  pad.addEventListener('pointermove', move);
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);
  pad.addEventListener('pointerleave', end);
  pad.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
  pad.addEventListener('touchmove',  function (e) { e.preventDefault(); }, { passive: false });

  function hasInk() {
    var n = 0;
    strokes.forEach(function (s) { n += s.length; });
    return n > 6;
  }

  function updateButtons() {
    if (assinado) return;
    btnSign.disabled = !hasInk();
    btnClear.disabled = !dirty;
  }

  btnClear.addEventListener('click', function () {
    if (assinado) return;
    strokes = []; current = null; dirty = false;
    padWrap.classList.remove('dirty');
    repaint();
    btnSign.disabled = true;
    btnClear.disabled = true;
  });

  window.addEventListener('resize', function () {
    var r = pad.getBoundingClientRect();
    if (Math.abs(r.width * dpr - pad.width) > 2) sizePad();
  });

  /* ============================================================
     Confetes / corações em partículas
     ============================================================ */
  var fxCtx = fx.getContext('2d'), parts = [], rafOn = false;

  function sizeFx() {
    fx.width  = Math.round(window.innerWidth  * dpr);
    fx.height = Math.round(window.innerHeight * dpr);
    fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeFx();
  window.addEventListener('resize', sizeFx);

  var CORES = ['#ff5f8d', '#ff9ec4', '#ffd166', '#f6b7cb', '#c0315c', '#fff0f5', '#e8c87a'];
  var EMOJIS = ['\u2764\uFE0F', '💖', '💕', '✨', '💍', '🌸'];

  function burst(x, y, n, scale) {
    scale = scale || 1;
    for (var i = 0; i < n; i++) {
      var ang = (Math.random() * Math.PI * 2);
      var sp = (2.5 + Math.random() * 8.5) * scale;
      parts.push({
        x: x, y: y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 3.5 * scale,
        g: 0.16 + Math.random() * 0.14,
        life: 1,
        decay: 0.006 + Math.random() * 0.008,
        rot: Math.random() * 6.28,
        vr: (Math.random() - 0.5) * 0.3,
        size: (6 + Math.random() * 10) * scale,
        emoji: Math.random() < 0.38 ? EMOJIS[(Math.random() * EMOJIS.length) | 0] : null,
        color: CORES[(Math.random() * CORES.length) | 0]
      });
    }
    if (!rafOn) { rafOn = true; requestAnimationFrame(tick); }
  }

  function rain(ms) {
    var t0 = performance.now();
    (function drop() {
      if (performance.now() - t0 > ms) return;
      for (var i = 0; i < 4; i++) {
        parts.push({
          x: Math.random() * window.innerWidth, y: -20,
          vx: (Math.random() - 0.5) * 2, vy: 1 + Math.random() * 2.5,
          g: 0.05, life: 1, decay: 0.0035,
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.22,
          size: 7 + Math.random() * 11,
          emoji: Math.random() < 0.45 ? EMOJIS[(Math.random() * EMOJIS.length) | 0] : null,
          color: CORES[(Math.random() * CORES.length) | 0]
        });
      }
      if (!rafOn) { rafOn = true; requestAnimationFrame(tick); }
      setTimeout(drop, 55);
    })();
  }

  function tick() {
    fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      p.vx *= 0.995;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > window.innerHeight + 60) { parts.splice(i, 1); continue; }
      fxCtx.save();
      fxCtx.globalAlpha = Math.max(0, Math.min(1, p.life));
      fxCtx.translate(p.x, p.y);
      fxCtx.rotate(p.rot);
      if (p.emoji) {
        fxCtx.font = (p.size * 2) + 'px serif';
        fxCtx.textAlign = 'center';
        fxCtx.textBaseline = 'middle';
        fxCtx.fillText(p.emoji, 0, 0);
      } else {
        fxCtx.fillStyle = p.color;
        fxCtx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      }
      fxCtx.restore();
    }
    if (parts.length) requestAnimationFrame(tick);
    else { rafOn = false; fxCtx.clearRect(0, 0, window.innerWidth, window.innerHeight); }
  }

  /* ============================================================
     Assinar
     ============================================================ */
  var assinado = false;

  btnSign.addEventListener('click', function () {
    if (assinado || !hasInk()) return;
    celebrar(true);
  });

  function celebrar(animar) {
    assinado = true;
    btnSign.disabled = true;
    btnClear.disabled = true;
    pad.style.cursor = 'default';

    signLabel.innerHTML = 'assinado com amor 💖';
    signLabel.classList.add('done-state');
    padWrap.classList.add('dirty');

    if (animar) {
      flash.classList.remove('go'); void flash.offsetWidth; flash.classList.add('go');
      frame.classList.add('celebrate');
      frame.classList.remove('shake'); void frame.offsetWidth; frame.classList.add('shake');

      if (navigator.vibrate) { try { navigator.vibrate([18, 60, 30, 60, 90]); } catch (e) {} }

      var r = cert.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 60, 1.1);
      setTimeout(function () { burst(r.left + r.width * 0.15, r.top + r.height * 0.4, 28, .9); }, 180);
      setTimeout(function () { burst(r.left + r.width * 0.85, r.top + r.height * 0.4, 28, .9); }, 320);
      rain(2600);

      setTimeout(function () {
        stamp.classList.add('on');
        if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) {} }
        var sr = stamp.getBoundingClientRect();
        burst(sr.left + sr.width / 2, sr.top + sr.height / 2, 30, .8);
      }, 520);

      setTimeout(function () { frame.classList.remove('celebrate'); }, 4200);
    } else {
      stamp.classList.add('on');
    }

    setTimeout(function () {
      $('actions').style.display = 'none';
      done.classList.add('show');
      done.setAttribute('aria-hidden', 'false');
      if (animar) done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, animar ? 1100 : 0);

    salvar();
  }

  /* ---------- persistência ---------- */
  function salvar() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        strokes: strokes,
        w: pad.getBoundingClientRect().width,
        h: pad.getBoundingClientRect().height,
        data: DATA_LONGA,
        em: Date.now()
      }));
    } catch (e) {}
  }

  function restaurar() {
    var raw;
    try { raw = localStorage.getItem(STORE); } catch (e) { return false; }
    if (!raw) return false;
    try {
      var d = JSON.parse(raw);
      if (!d || !d.strokes || !d.strokes.length) return false;
      var r = pad.getBoundingClientRect();
      var k = d.w ? r.width / d.w : 1;
      strokes = d.strokes.map(function (s) {
        return s.map(function (p) { return { x: p.x * k, y: p.y * k, w: p.w }; });
      });
      dirty = true;
      if (d.data) { doneDate.textContent = d.data; }
      repaint();
      return true;
    } catch (e) { return false; }
  }

  btnRedo.addEventListener('click', function () {
    try { localStorage.removeItem(STORE); } catch (e) {}
    location.reload();
  });

  /* ============================================================
     Gerar a imagem final para salvar
     ============================================================ */
  function montarCanvas() {
    var base = exportImg || certImg;
    var W = base.naturalWidth  || 486;
    var H = base.naturalHeight || 586;
    var S = 2;                       // super-amostragem
    var PAD = 34;                    // margem rosa ao redor
    var SIGN = 190;                  // faixa da assinatura

    var cw = W + PAD * 2;
    var ch = H + PAD * 2 + SIGN;

    var c = document.createElement('canvas');
    c.width = cw * S; c.height = ch * S;
    var g = c.getContext('2d');
    g.scale(S, S);

    // fundo
    var grad = g.createLinearGradient(0, 0, cw, ch);
    grad.addColorStop(0, '#fff6f9');
    grad.addColorStop(0.5, '#ffe8ef');
    grad.addColorStop(1, '#fbdbe5');
    g.fillStyle = grad;
    g.fillRect(0, 0, cw, ch);

    // moldura dourada externa
    var gold = g.createLinearGradient(0, 0, cw, ch);
    gold.addColorStop(0, '#c9962f');
    gold.addColorStop(0.35, '#f6d98a');
    gold.addColorStop(0.6, '#f9efc8');
    gold.addColorStop(1, '#c9962f');
    g.strokeStyle = gold; g.lineWidth = 6;
    roundRect(g, 10, 10, cw - 20, ch - 20, 18); g.stroke();
    g.strokeStyle = 'rgba(244,143,177,.75)'; g.lineWidth = 1.5;
    roundRect(g, 18, 18, cw - 36, ch - 36, 13); g.stroke();

    // certidão
    g.drawImage(exportImg || certImg, PAD, PAD, W, H);

    // campos preenchidos
    g.fillStyle = '#1f4e8c';
    g.textBaseline = 'alphabetic';
    var fs = Math.round(W * 0.0255);
    var font = fs + 'px "Parisienne", cursive';

    desenhaTexto(g, NOIVA, PAD + W * 0.472, PAD + H * 0.200, font, W * 0.372);
    desenhaTexto(g, NOIVO, PAD + W * 0.104, PAD + H * 0.259, font, W * 0.420);
    desenhaTexto(g, DIA,   PAD + W * 0.706, PAD + H * 0.259, font, W * 0.175);
    desenhaTexto(g, MES + ' de ' + ANO, PAD + W * 0.140, PAD + H * 0.320, font, W * 0.200);

    // carimbo
    desenhaCarimbo(g, PAD + W * 0.840, PAD + H * 0.853, W * 0.135);

    // ---- faixa de assinatura ----
    var y0 = PAD + H + 16;
    g.fillStyle = 'rgba(255,255,255,.72)';
    roundRect(g, PAD, y0, W, SIGN - 30, 14); g.fill();

    g.fillStyle = '#b07c90';
    g.font = '600 13px "Cormorant Garamond", Georgia, serif';
    g.textAlign = 'center';
    g.fillText('A S S I N A T U R A   D A   N O I V A', PAD + W / 2, y0 + 26);

    // assinatura desenhada — enquadrada pelo contorno real do traço
    var ly = y0 + SIGN - 76;
    var bb = contorno(strokes);
    var sw = Math.max(bb.x1 - bb.x0, 1);
    var sh = Math.max(bb.y1 - bb.y0, 1);
    var k = Math.min((W - 110) / sw, 62 / sh, 1.8);
    var ox = PAD + (W - sw * k) / 2 - bb.x0 * k;
    var oy = ly - 10 - bb.y1 * k;

    g.save();
    g.translate(ox, oy);
    g.scale(k, k);
    g.strokeStyle = '#1f3d78';
    g.lineCap = 'round'; g.lineJoin = 'round';
    strokes.forEach(function (s) {
      if (s.length < 2) return;
      for (var i = 1; i < s.length; i++) {
        g.beginPath();
        g.lineWidth = s[i].w;
        g.moveTo(s[i - 1].x, s[i - 1].y);
        g.lineTo(s[i].x, s[i].y);
        g.stroke();
      }
    });
    g.restore();

    // linha + nome
    g.strokeStyle = '#d9a8ba'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(PAD + 48, ly); g.lineTo(PAD + W - 48, ly); g.stroke();

    g.fillStyle = '#6b505a';
    g.font = '600 14px "Cormorant Garamond", Georgia, serif';
    g.fillText(NOIVA, PAD + W / 2, ly + 20);

    g.fillStyle = '#b07c90';
    g.font = '12px "Cormorant Garamond", Georgia, serif';
    g.fillText('assinado em ' + DATA_LONGA, PAD + W / 2, ly + 38);

    g.fillStyle = '#c0315c';
    g.font = '18px "Parisienne", cursive';
    g.fillText('Ana Júlia  ❤  João Eduardo', PAD + W / 2, ch - 22);

    return c;
  }

  function desenhaTexto(g, txt, x, y, font, maxW) {
    g.save();
    g.textAlign = 'left';
    g.font = font;
    var w = g.measureText(txt).width;
    if (w > maxW && w > 0) {
      // comprime horizontalmente para caber dentro da linha
      g.translate(x, y);
      g.scale(maxW / w, 1);
      g.fillText(txt, 0, 0);
    } else {
      g.fillText(txt, x, y);
    }
    g.restore();
  }

  function desenhaCarimbo(g, cx, cy, r) {
    g.save();
    g.translate(cx, cy);
    g.rotate(-13 * Math.PI / 180);
    g.globalAlpha = 0.88;
    g.strokeStyle = '#c0315c';
    g.lineWidth = 2.2;
    g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 1;
    g.beginPath(); g.arc(0, 0, r - 5, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#c0315c';
    g.textAlign = 'center';
    g.font = '700 ' + Math.round(r * 0.34) + 'px "Cormorant Garamond", Georgia, serif';
    g.fillText('ASSINADO', 0, -r * 0.08);
    g.font = '700 ' + Math.round(r * 0.22) + 'px "Cormorant Garamond", Georgia, serif';
    g.fillText('COM AMOR', 0, r * 0.22);
    g.font = Math.round(r * 0.20) + 'px "Cormorant Garamond", Georgia, serif';
    g.fillText(DATA_CURTA, 0, r * 0.5);
    g.restore();
  }

  function contorno(ss) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    ss.forEach(function (s) {
      s.forEach(function (p) {
        if (p.x < x0) x0 = p.x;
        if (p.y < y0) y0 = p.y;
        if (p.x > x1) x1 = p.x;
        if (p.y > y1) y1 = p.y;
      });
    });
    if (!isFinite(x0)) { x0 = y0 = 0; x1 = y1 = 1; }
    return { x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }

  var tentativas = 0;
  btnDown.addEventListener('click', function () {
    if (!exportImg && tentativas < 12) {
      tentativas++;
      btnDown.textContent = 'preparando... ⏳';
      setTimeout(function () {
        btnDown.textContent = 'Salvar certidão 📜';
        btnDown.click();
      }, 500);
      return;
    }
    var c;
    try { c = montarCanvas(); } catch (e) { alert('Não consegui gerar a imagem 😢'); return; }
    var nome = 'certidao-ana-julia-e-joao-eduardo.png';

    c.toBlob(function (blob) {
      if (!blob) { alert('Não consegui gerar a imagem 😢'); return; }
      var file = null;
      try { file = new File([blob], nome, { type: 'image/png' }); } catch (e) {}

      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Nossa certidão 💍' }).catch(function () { baixar(blob, nome); });
      } else {
        baixar(blob, nome);
      }
      burst(window.innerWidth / 2, window.innerHeight * 0.75, 26, .8);
    }, 'image/png');
  });

  function baixar(blob, nome) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nome;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  /* ============================================================
     Início
     ============================================================ */
  function boot() {
    sizePad();
    ajustarTodos();
    var jaAssinou = restaurar();
    if (jaAssinou) {
      // pula o envelope: já está assinado
      intro.classList.add('gone');
      setTimeout(function () { intro.style.display = 'none'; }, 900);
      opened = true;
      stage.setAttribute('aria-hidden', 'false');
      stage.classList.add('live');
      [fNoiva, fNoivo, fDia, fMes].forEach(function (el) { el.classList.add('in'); });
      celebrar(false);
    }
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(boot).catch(boot);
    setTimeout(function () { if (!ctx) boot(); }, 1800);
  } else {
    window.addEventListener('load', boot);
  }
})();
