/* The Reverist: site behaviour. Everything runs in the browser; no outside services. */
(function () {
  "use strict";

  var ALL = window.REVERIST_LINES || [];
  var AUTHOR = window.REVERIST_AUTHOR || "Ankit Mehta";
  var HANDLE = "@_the.reverist_";
  var SITE = "https://thereverist.in";
  var COLORS = {
    night: { bg: "#000000", ink: "#F4EDE1", muted: "#8E8A82", gold: "#E3A857" },
    day: { bg: "#FFFFFF", ink: "#000000", muted: "#6B6B6B", gold: "#E3A857" }
  };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Lines appear once their Instagram time has passed. */
  function revealed() {
    var now = Date.now();
    return ALL.filter(function (l) { return Date.parse(l.at) <= now; });
  }
  var LINES = revealed();
  function byId(id) {
    for (var i = 0; i < ALL.length; i++) if (String(ALL[i].id) === String(id)) return ALL[i];
    return null;
  }
  function latest() { return LINES.length ? LINES[LINES.length - 1] : null; }
  function lineUrl(l) { return "/l/" + l.id + ".html"; }
  function niceDate(l) {
    return new Date(l.at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  /* ---------- Theme ---------- */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "day" ? "day" : "night";
  }
  function setTheme(theme, remember) {
    document.documentElement.setAttribute("data-theme", theme);
    if (remember) { try { sessionStorage.setItem("reverist-theme", theme); } catch (e) {} }
    var btn = document.querySelector("[data-mode]");
    if (btn) {
      btn.textContent = theme === "day" ? "Night" : "Day";
      btn.setAttribute("aria-label", theme === "day" ? "Switch to night mode" : "Switch to day mode");
    }
    drawLogos();
  }

  /* ---------- Logo ---------- */
  function starPath(c, cy, r) {
    var k = r * 0.12;
    return "M" + c + " " + (cy - r) +
      " C" + (c + k) + " " + (cy - k) + " " + (c + k) + " " + (cy - k) + " " + (c + r) + " " + cy +
      " C" + (c + k) + " " + (cy + k) + " " + (c + k) + " " + (cy + k) + " " + c + " " + (cy + r) +
      " C" + (c - k) + " " + (cy + k) + " " + (c - k) + " " + (cy + k) + " " + (c - r) + " " + cy +
      " C" + (c - k) + " " + (cy - k) + " " + (c - k) + " " + (cy - k) + " " + c + " " + (cy - r) + " Z";
  }
  function logoSVG(dot, star) {
    var rings = [[26, 8, 4.4], [42, 12, 3.8], [58, 16, 3.2], [74, 20, 2.6], [90, 26, 2.0]];
    var out = "";
    rings.forEach(function (ring, idx) {
      var g = '<g class="ring ring-' + idx + '">';
      for (var i = 0; i < ring[1]; i++) {
        var t = (2 * Math.PI * i) / ring[1] - Math.PI / 2;
        g += '<circle cx="' + (100 + ring[0] * Math.cos(t)).toFixed(2) + '" cy="' +
          (100 + ring[0] * Math.sin(t)).toFixed(2) + '" r="' + ring[2] + '"/>';
      }
      out += g + "</g>";
    });
    return '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><g fill="' + dot + '">' + out +
      '</g><path class="star" fill="' + star + '" d="' + starPath(100, 100, 17) + '"/></svg>';
  }
  function drawLogos() {
    var c = COLORS[currentTheme()];
    document.querySelectorAll("[data-logo]").forEach(function (el) { el.innerHTML = logoSVG(c.ink, c.gold); });
  }

  /* ---------- Small helpers ---------- */
  var statusTimer;
  function announce(message) {
    var el = document.querySelector(".status");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { el.classList.remove("is-visible"); }, 2400);
  }
  function saved() {
    try { return JSON.parse(localStorage.getItem("reverist-saved") || "[]"); } catch (e) { return []; }
  }
  function toggleSaved(id) {
    var list = saved(), i = list.indexOf(id);
    if (i === -1) list.push(id); else list.splice(i, 1);
    try { localStorage.setItem("reverist-saved", JSON.stringify(list)); } catch (e) {}
    return i === -1;
  }
  function heartButton(l) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "heart";
    function paint() {
      var on = saved().indexOf(l.id) !== -1;
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", on ? "Remove from saved lines" : "Save this line");
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.4-9.3C1.3 7.9 3.4 4.5 6.9 4.5c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.5 0 5.6 3.4 4.3 6.7-1.9 4.7-9.4 9.3-9.4 9.3z"/></svg>';
    }
    paint();
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation();
      var on = toggleSaved(l.id); paint();
      b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
      announce(on ? "Saved to your lines" : "Removed from saved");
      document.dispatchEvent(new CustomEvent("reverist:saved"));
    });
    return b;
  }
  function share(l) {
    var url = SITE + lineUrl(l);
    var text = "\u201C" + l.text + "\u201D \u2014 " + AUTHOR;
    if (navigator.share) {
      navigator.share({ title: "The Reverist", text: text, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text + "\n" + url).then(function () { announce("Link copied"); });
    } else {
      window.prompt("Copy this link", url);
    }
  }

  /* Words drift in one by one. */
  function setLineText(el, text) {
    el.innerHTML = "";
    var words = text.split(" ");
    words.forEach(function (w, i) {
      var s = document.createElement("span");
      s.className = "w"; s.textContent = w;
      s.style.animationDelay = (reduceMotion ? 0 : 0.06 * i) + "s";
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    el.setAttribute("aria-label", text);
  }

  /* ---------- Image cards (share post and wallpaper) ---------- */
  function wrap(ctx, text, maxWidth) {
    var words = text.split(/\s+/), lines = [], row = "";
    words.forEach(function (word) {
      var test = row ? row + " " + word : word;
      if (ctx.measureText(test).width > maxWidth && row) { lines.push(row); row = word; }
      else row = test;
    });
    if (row) lines.push(row);
    return lines;
  }
  function spaced(ctx, text, centerX, y, spacing) {
    var chars = text.split(""), total = 0;
    chars.forEach(function (ch) { total += ctx.measureText(ch).width + spacing; });
    total -= spacing;
    var x = centerX - total / 2;
    ctx.textAlign = "left";
    chars.forEach(function (ch) { ctx.fillText(ch, x, y); x += ctx.measureText(ch).width + spacing; });
    ctx.textAlign = "center";
  }
  function drawLogo(ctx, x, y, size, c) {
    var s = size / 200;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.fillStyle = c.ink;
    [[26, 8, 4.4], [42, 12, 3.8], [58, 16, 3.2], [74, 20, 2.6], [90, 26, 2.0]].forEach(function (ring) {
      for (var i = 0; i < ring[1]; i++) {
        var t = (2 * Math.PI * i) / ring[1] - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(100 + ring[0] * Math.cos(t), 100 + ring[0] * Math.sin(t), ring[2], 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.fillStyle = c.gold;
    ctx.fill(new Path2D(starPath(100, 100, 17)));
    ctx.restore();
  }

  function makeCard(line, kind) {
    var theme = currentTheme(), c = COLORS[theme];
    var isWall = kind === "wallpaper";
    var W = isWall ? 1170 : 1080, H = isWall ? 2532 : 1350;
    var size = isWall ? 86 : 88, lh = Math.round(size * 1.18), maxW = isWall ? 920 : 860;

    var canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

    ctx.font = '500 ' + size + 'px "Cormorant Garamond", Garamond, serif';
    var rows = wrap(ctx, line.text, maxW);
    /* Balance the lines: shrink the width as far as possible without adding a line, so no word sits alone. */
    var lo = maxW * 0.5, hi = maxW;
    while (hi - lo > 4) {
      var mid = (lo + hi) / 2;
      if (wrap(ctx, line.text, mid).length > rows.length) lo = mid; else hi = mid;
    }
    rows = wrap(ctx, line.text, hi);
    var textH = rows.length * lh;
    var after = 56 + 2 + (AUTHOR ? 56 + 24 : 0);
    var blockH = textH + after;

    var centerY = isWall ? H * 0.56 : H * 0.5;
    var top = Math.round(centerY - blockH / 2);

    if (isWall) {
      drawLogo(ctx, (W - 80) / 2, H - 330, 80, c);
    } else {
      drawLogo(ctx, (W - 96) / 2, 100, 96, c);
    }

    ctx.fillStyle = c.ink;
    rows.forEach(function (row, i) { ctx.fillText(row, W / 2, top + i * lh + size * 0.82); });

    var y = top + textH + 56;
    ctx.fillStyle = c.gold;
    ctx.fillRect((W - 80) / 2, y, 80, 2);

    if (AUTHOR) {
      ctx.fillStyle = c.ink;
      ctx.font = '500 24px "Jost", sans-serif';
      spaced(ctx, AUTHOR.toUpperCase(), W / 2, y + 2 + 56 + 18, 5);
    }

    ctx.fillStyle = c.muted;
    ctx.font = '400 22px "Jost", sans-serif';
    spaced(ctx, HANDLE, W / 2, isWall ? H - 200 : H - 100, 2);
    return canvas;
  }

  function download(line, kind) {
    var fonts = [
      document.fonts.load('500 88px "Cormorant Garamond"'),
      document.fonts.load('500 24px "Jost"'),
      document.fonts.load('400 22px "Jost"')
    ];
    Promise.all(fonts).catch(function () {}).then(function () {
      var canvas = makeCard(line, kind);
      canvas.toBlob(function (blob) {
        if (!blob) { announce("The image couldn't be created. Try again."); return; }
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "the-reverist-" + line.id + (kind === "wallpaper" ? "-wallpaper" : "") + "-" + currentTheme() + ".png";
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        announce(kind === "wallpaper" ? "Wallpaper saved" : "Image saved");
      }, "image/png");
    });
  }

  /* ---------- One line, full screen (home and line pages) ---------- */
  function initStage() {
    var lineEl = document.querySelector(".line");
    if (!lineEl) return;
    var page = document.body.getAttribute("data-page");
    var creditEl = document.querySelector(".credit");
    var artEl = document.querySelector(".festival");
    var heartSlot = document.querySelector("[data-heart]");
    var params = new URLSearchParams(location.search);
    var fixedId = document.body.getAttribute("data-line");
    var current;

    if (fixedId) {
      current = byId(fixedId);
      if (current && Date.parse(current.at) > Date.now()) {
        lineEl.textContent = "This line arrives on " + niceDate(current) + ".";
        document.querySelector(".actions").hidden = true; creditEl.hidden = true;
        return;
      }
    } else {
      current = byId(params.get("line"));
      if (current && Date.parse(current.at) > Date.now()) current = null;
      current = current || latest();
    }
    if (!current) { lineEl.textContent = "The first line is on its way."; return; }

    function show(l) {
      current = l;
      setLineText(lineEl, l.text);
      creditEl.textContent = AUTHOR; creditEl.hidden = false;
      if (heartSlot) { heartSlot.innerHTML = ""; heartSlot.appendChild(heartButton(l)); }
      if (artEl) {
        if (l.art) {
          artEl.hidden = false;
          artEl.querySelector("img").src = "/assets/art/" + l.art;
          artEl.querySelector("img").alt = l.special + " illustration";
          artEl.querySelector("figcaption").textContent = l.special;
        } else { artEl.hidden = true; }
      }
      if (page === "home") document.title = "The Reverist \u00B7 " + l.text;
    }
    function another() {
      if (LINES.length < 2) return;
      var next;
      do { next = LINES[Math.floor(Math.random() * LINES.length)]; } while (next.id === current.id);
      if (page === "home") history.replaceState(null, "", "?line=" + next.id);
      if (reduceMotion) { show(next); return; }
      lineEl.classList.add("is-leaving");
      setTimeout(function () { lineEl.classList.remove("is-leaving"); show(next); }, 450);
    }

    show(current);
    var a = document.querySelector("[data-another]");
    if (a) a.addEventListener("click", another);
    document.querySelector("[data-share]").addEventListener("click", function () { share(current); });
    document.querySelector("[data-post]").addEventListener("click", function () { download(current, "post"); });
    document.querySelector("[data-wallpaper]").addEventListener("click", function () { download(current, "wallpaper"); });
    document.addEventListener("keydown", function (e) {
      if (!a || e.target.closest("input, textarea, button, a")) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); another(); }
    });
  }

  /* ---------- Archive ---------- */
  function initArchive() {
    var list = document.querySelector(".list");
    if (!list) return;
    var tonesEl = document.querySelector(".tones");
    var search = document.querySelector(".search");
    var countEl = document.querySelector(".count");
    var params = new URLSearchParams(location.search);
    var tone = params.get("tone") || "all";

    var present = [];
    LINES.forEach(function (l) { if (present.indexOf(l.tone) === -1) present.push(l.tone); });
    var order = ["Hopeful", "Joyful", "Warm", "Calm", "Tender", "Playful", "Reflective", "Deep", "Bittersweet", "Quiet", "Haunting", "Special"];
    var options = ["all"].concat(order.filter(function (t) { return present.indexOf(t) !== -1; })).concat(["saved"]);
    options.forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = t === "all" ? "All" : t === "saved" ? "\u2661 Saved" : t === "Special" ? "Special days" : t;
      b.dataset.tone = t;
      b.addEventListener("click", function () {
        tone = t;
        history.replaceState(null, "", t === "all" ? "/archive.html" : "?tone=" + t);
        render();
      });
      tonesEl.appendChild(b);
    });

    var io = "IntersectionObserver" in window && !reduceMotion ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" }) : null;

    function render() {
      tonesEl.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tone === tone)); });
      var q = search.value.trim().toLowerCase();
      var mine = saved();
      var shown = LINES.slice().reverse().filter(function (l) {
        var okTone = tone === "all" || (tone === "saved" ? mine.indexOf(l.id) !== -1 : l.tone === tone);
        return okTone && (!q || l.text.toLowerCase().indexOf(q) !== -1);
      });
      list.innerHTML = "";
      if (!shown.length) {
        var empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = tone === "saved" ? "Tap the heart on any line to keep it here." : "No lines match that yet. Try another tone or word.";
        list.appendChild(empty);
      }
      shown.forEach(function (l) {
        var li = document.createElement("li");
        li.className = io ? "reveal" : "";
        var a = document.createElement("a");
        a.href = lineUrl(l);
        var t = document.createElement("span"); t.className = "text"; t.textContent = l.text;
        var m = document.createElement("span"); m.className = "meta";
        m.textContent = (l.special ? l.special : l.tone) + " \u00B7 " + niceDate(l);
        a.appendChild(t); a.appendChild(m); li.appendChild(a); li.appendChild(heartButton(l));
        list.appendChild(li);
        if (io) io.observe(li);
      });
      countEl.textContent = shown.length === 1 ? "1 line" : shown.length + " lines";
    }
    search.addEventListener("input", render);
    document.addEventListener("reverist:saved", function () { if (tone === "saved") render(); });
    render();
  }

  /* ---------- Author page ---------- */
  function initAuthor() {
    var box = document.querySelector("[data-signature]");
    if (!box) return;
    var picks = LINES.filter(function (l) { return !l.special; });
    // a few of the most recent lines, newest first
    picks.slice(-5).reverse().forEach(function (l) {
      var a = document.createElement("a"); a.href = lineUrl(l); a.className = "sig reveal";
      a.textContent = l.text; box.appendChild(a);
    });
    var c = document.querySelector("[data-count]");
    if (c) c.textContent = LINES.length;
    reveals();
  }

  /* ---------- Motion ---------- */
  function reveals() {
    var els = document.querySelectorAll(".reveal:not(.in)");
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }
  /* Slow golden dust drifting behind the page. */
  function dust() {
    var cv = document.querySelector(".dust");
    if (!cv || reduceMotion) return;
    var ctx = cv.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2), W, H, motes = [], raf;
    function size() {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size(); window.addEventListener("resize", size);
    var n = Math.round(Math.min(70, W * H / 22000));
    for (var i = 0; i < n; i++) motes.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.4 + 0.4,
      vy: -(Math.random() * 0.18 + 0.04), vx: (Math.random() - 0.5) * 0.08, p: Math.random() * 6.28 });
    function tick() {
      ctx.clearRect(0, 0, W, H);
      var night = currentTheme() === "night";
      motes.forEach(function (m) {
        m.y += m.vy; m.x += m.vx + Math.sin(m.p += 0.01) * 0.05;
        if (m.y < -5) { m.y = H + 5; m.x = Math.random() * W; }
        var a = (night ? 0.35 : 0.45) * (0.5 + 0.5 * Math.sin(m.p * 2));
        ctx.fillStyle = "rgba(227,168,87," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283); ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(tick);
    });
    raf = requestAnimationFrame(tick);
  }

  /* ---------- Start ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    setTheme(currentTheme(), false);
    var modeBtn = document.querySelector("[data-mode]");
    if (modeBtn) modeBtn.addEventListener("click", function () { setTheme(currentTheme() === "day" ? "night" : "day", true); });
    initStage();
    initArchive();
    initAuthor();
    reveals();
    dust();
  });
})();
