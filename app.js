/* The Reverist — site behaviour. No external services. */
(function () {
  "use strict";

  var LINES = window.REVERIST_LINES || [];
  var HANDLE = "@_the.reverist_";
  var COLORS = {
    night: { bg: "#000000", ink: "#F4EDE1", muted: "#8E8A82", gold: "#E3A857" },
    day: { bg: "#FFFFFF", ink: "#000000", muted: "#6B6B6B", gold: "#E3A857" }
  };

  /* ---------- Theme ---------- */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "day" ? "day" : "night";
  }
  function setTheme(theme, remember) {
    document.documentElement.setAttribute("data-theme", theme);
    if (remember) {
      try { sessionStorage.setItem("reverist-theme", theme); } catch (e) {}
    }
    var btn = document.querySelector("[data-mode]");
    if (btn) {
      btn.textContent = theme === "day" ? "Night" : "Day";
      btn.setAttribute("aria-label", theme === "day" ? "Switch to night mode" : "Switch to day mode");
    }
    drawLogos();
  }

  /* ---------- Logo (rings of dots around a star) ---------- */
  function logoSVG(dot, star) {
    var rings = [[26, 8, 4.4], [42, 12, 3.8], [58, 16, 3.2], [74, 20, 2.6], [90, 26, 2.0]];
    var dots = "";
    rings.forEach(function (ring) {
      for (var i = 0; i < ring[1]; i++) {
        var t = (2 * Math.PI * i) / ring[1] - Math.PI / 2;
        dots += '<circle cx="' + (100 + ring[0] * Math.cos(t)).toFixed(2) + '" cy="' +
          (100 + ring[0] * Math.sin(t)).toFixed(2) + '" r="' + ring[2] + '"/>';
      }
    });
    return '<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><g fill="' + dot + '">' +
      dots + '</g><path fill="' + star + '" d="' + starPath(100, 100, 17) + '"/></svg>';
  }
  function starPath(c, cy, r) {
    var k = r * 0.12;
    return "M" + c + " " + (cy - r) +
      " C" + (c + k) + " " + (cy - k) + " " + (c + k) + " " + (cy - k) + " " + (c + r) + " " + cy +
      " C" + (c + k) + " " + (cy + k) + " " + (c + k) + " " + (cy + k) + " " + c + " " + (cy + r) +
      " C" + (c - k) + " " + (cy + k) + " " + (c - k) + " " + (cy + k) + " " + (c - r) + " " + cy +
      " C" + (c - k) + " " + (cy - k) + " " + (c - k) + " " + (cy - k) + " " + c + " " + (cy - r) + " Z";
  }
  function drawLogos() {
    var c = COLORS[currentTheme()];
    document.querySelectorAll("[data-logo]").forEach(function (el) {
      el.innerHTML = logoSVG(c.ink, c.gold);
    });
  }

  /* ---------- Small helpers ---------- */
  function byId(id) {
    for (var i = 0; i < LINES.length; i++) if (String(LINES[i].id) === String(id)) return LINES[i];
    return null;
  }
  function todaysLine() {
    if (!LINES.length) return null;
    var now = new Date();
    var day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
    return LINES[day % LINES.length];
  }
  var statusTimer;
  function announce(message) {
    var el = document.querySelector(".status");
    if (!el) return;
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { el.classList.remove("is-visible"); }, 2400);
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
    var textH = rows.length * lh;
    var after = 56 + 2 + (line.by ? 56 + 24 : 0);
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

    if (line.by) {
      ctx.fillStyle = c.ink;
      ctx.font = '500 24px "Jost", sans-serif';
      spaced(ctx, line.by.toUpperCase(), W / 2, y + 2 + 56 + 18, 5);
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

  /* ---------- Home ---------- */
  function initHome() {
    var lineEl = document.querySelector(".line");
    if (!lineEl) return;
    var creditEl = document.querySelector(".credit");
    var moodEl = document.querySelector(".mood-link");
    var params = new URLSearchParams(location.search);
    var current = byId(params.get("line")) || todaysLine();
    if (!current) { lineEl.textContent = "No lines yet."; return; }

    function show(line) {
      current = line;
      lineEl.textContent = line.text;
      if (line.by) { creditEl.textContent = line.by; creditEl.hidden = false; }
      else { creditEl.textContent = ""; creditEl.hidden = true; }
      moodEl.textContent = "More on " + line.mood;
      moodEl.href = "archive.html?mood=" + encodeURIComponent(line.mood);
      document.title = line.text + " — The Reverist";
    }

    function another() {
      if (LINES.length < 2) return;
      var next;
      do { next = LINES[Math.floor(Math.random() * LINES.length)]; } while (next.id === current.id);
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      history.replaceState(null, "", "?line=" + next.id);
      if (reduce) { show(next); return; }
      lineEl.classList.add("is-leaving");
      setTimeout(function () {
        lineEl.classList.remove("is-leaving");
        lineEl.classList.add("is-arriving");
        show(next);
        void lineEl.offsetWidth;
        lineEl.classList.remove("is-arriving");
      }, 500);
    }

    show(current);
    document.querySelector("[data-another]").addEventListener("click", another);
    document.querySelector("[data-share]").addEventListener("click", function () { download(current, "post"); });
    document.querySelector("[data-wallpaper]").addEventListener("click", function () { download(current, "wallpaper"); });
    document.addEventListener("keydown", function (e) {
      if (e.target.closest("input, textarea, button, a")) return;
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); another(); }
    });
  }

  /* ---------- Archive ---------- */
  function initArchive() {
    var list = document.querySelector(".list");
    if (!list) return;
    var moodsEl = document.querySelector(".moods");
    var search = document.querySelector(".search");
    var countEl = document.querySelector(".count");
    var params = new URLSearchParams(location.search);
    var mood = params.get("mood") || "all";

    var options = ["all"].concat(window.REVERIST_MOODS || []);
    options.forEach(function (m) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = m === "all" ? "All" : m.charAt(0).toUpperCase() + m.slice(1);
      b.dataset.mood = m;
      b.addEventListener("click", function () {
        mood = m;
        history.replaceState(null, "", m === "all" ? "archive.html" : "?mood=" + m);
        render();
      });
      moodsEl.appendChild(b);
    });

    function render() {
      moodsEl.querySelectorAll("button").forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.mood === mood));
      });
      var q = search.value.trim().toLowerCase();
      var shown = LINES.filter(function (l) {
        return (mood === "all" || l.mood === mood) && (!q || l.text.toLowerCase().indexOf(q) !== -1);
      });
      list.innerHTML = "";
      if (!shown.length) {
        var empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = "No lines match that yet. Try another mood or a different word.";
        list.appendChild(empty);
      }
      shown.forEach(function (l) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "./?line=" + l.id;
        var t = document.createElement("span");
        t.className = "text"; t.textContent = l.text;
        var m = document.createElement("span");
        m.className = "meta";
        m.textContent = l.mood.charAt(0).toUpperCase() + l.mood.slice(1) + (l.by ? ", by " + l.by : "");
        a.appendChild(t); a.appendChild(m); li.appendChild(a); list.appendChild(li);
      });
      countEl.textContent = shown.length === 1 ? "1 line" : shown.length + " lines";
    }
    search.addEventListener("input", render);
    render();
  }

  /* ---------- Start ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    setTheme(currentTheme(), false);
    var modeBtn = document.querySelector("[data-mode]");
    if (modeBtn) modeBtn.addEventListener("click", function () {
      setTheme(currentTheme() === "day" ? "night" : "day", true);
    });
    initHome();
    initArchive();
  });
})();
