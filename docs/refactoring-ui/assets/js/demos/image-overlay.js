/* image-overlay.js — 第 7 章：照片上的文字，先把背景对比度做稳 */
(function () {
  "use strict";
  var K = window.RUIDemo.kit;
  var STYLE_ID = "io-style";

  /* 一张“照片”：日落、地平线、沙丘，全部是垂直 / 径向渐变，采样可解析 */
  function rgba(c, a) { return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function stopAt(stops, t) {
    if (t <= stops[0][0]) return stops[0][1].slice();
    for (var i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        var a = stops[i - 1], b = stops[i], k = (t - a[0]) / (b[0] - a[0] || 1);
        return [0, 1, 2, 3].map(function (j) { return a[1][j] + (b[1][j] - a[1][j]) * k; });
      }
    }
    return stops[stops.length - 1][1].slice();
  }
  function cssStops(stops) {
    return stops.map(function (s) { return rgba(s[1], s[1][3]) + " " + (s[0] * 100).toFixed(1) + "%"; }).join(",");
  }
  function vlin(stops) {
    return {
      css: "linear-gradient(180deg," + cssStops(stops) + ")",
      at: function (u, v) { return stopAt(stops, K.clamp(v, 0, 1)); }
    };
  }
  function rad(rx, ry, cx, cy, stops) {
    return {
      css: "radial-gradient(" + rx + "% " + ry + "% at " + cx + "% " + cy + "%," + cssStops(stops) + ")",
      at: function (u, v) {
        var dx = (u - cx / 100) / (rx / 100), dy = (v - cy / 100) / (ry / 100);
        return stopAt(stops, K.clamp(Math.sqrt(dx * dx + dy * dy), 0, 1));
      }
    };
  }
  var LAYERS = [
    vlin([[0, [8, 16, 30, 1]], [0.16, [22, 40, 62, 1]], [0.32, [54, 82, 108, 1]], [0.44, [120, 146, 160, 1]],
      [0.5, [190, 190, 178, 1]], [0.535, [236, 214, 176, 1]], [0.545, [250, 224, 180, 1]],
      [0.548, [226, 178, 120, 1]], [0.6, [238, 190, 128, 1]], [0.7, [248, 206, 150, 1]],
      [0.82, [255, 222, 176, 1]], [0.9, [255, 233, 192, 1]], [0.97, [240, 203, 150, 1]], [1, [210, 166, 116, 1]]]),
    rad(5.5, 8, 72, 45.5, [[0, [255, 250, 232, 1]], [0.62, [255, 246, 218, 1]], [0.66, [255, 240, 204, 0.85]], [1, [255, 236, 196, 0]]]),
    rad(42, 30, 72, 46, [[0, [255, 236, 190, 0.5]], [0.6, [255, 226, 170, 0.18]], [1, [255, 226, 170, 0]]]),
    rad(30, 4.5, 24, 20, [[0, [30, 48, 72, 0.5]], [1, [30, 48, 72, 0]]]),
    rad(24, 3.5, 78, 30, [[0, [24, 38, 58, 0.55]], [1, [24, 38, 58, 0]]]),
    rad(34, 3, 48, 37, [[0, [255, 214, 170, 0.3]], [1, [255, 214, 170, 0]]]),
    rad(7, 16, 62, 58, [[0, [255, 246, 214, 0.5]], [1, [255, 246, 214, 0]]]),
    rad(34, 42, 0, 98, [[0, [34, 22, 16, 0.92]], [0.62, [34, 22, 16, 0.92]], [0.64, [34, 22, 16, 0.55]], [1, [34, 22, 16, 0]]]),
    rad(28, 26, 100, 100, [[0, [24, 16, 12, 0.55]], [1, [24, 16, 12, 0]]]),
    rad(95, 95, 50, 50, [[0, [0, 0, 0, 0]], [0.72, [0, 0, 0, 0]], [1, [0, 0, 0, 0.16]]])
  ];
  function over(dst, src) {
    var a = src[3];
    return [dst[0] * (1 - a) + src[0] * a, dst[1] * (1 - a) + src[1] * a, dst[2] * (1 - a) + src[2] * a];
  }
  function baseAt(u, v) {
    var c = [0, 0, 0];
    for (var i = 0; i < LAYERS.length; i++) c = over(c, LAYERS[i].at(u, v));
    return c;
  }
  var photoCss = LAYERS.slice().reverse().map(function (l) { return l.css; }).join(",");

  var MASKS = { black: [8, 10, 14], white: [255, 255, 255], blue: [47, 93, 138] };
  var MODES = [
    { value: "none", label: "只加文字" },
    { value: "flat", label: "加遮罩" },
    { value: "grad", label: "遮罩+渐变" }
  ];
  var COLORS = [
    { value: "black", label: "黑" },
    { value: "white", label: "白" },
    { value: "blue", label: "品牌蓝" }
  ];

  function maskAlpha(mode, op, v) {
    if (mode === "none") return 0;
    if (mode === "flat") return op;
    return Math.min(1, v <= 0.45 ? op : op * (1 + 0.6 * (v - 0.45) / 0.55));
  }
  function composite(bg, color, op, mode, v) {
    var a = maskAlpha(mode, op, v);
    if (!a) return bg;
    var m = MASKS[color];
    return [bg[0] * (1 - a) + m[0] * a, bg[1] * (1 - a) + m[1] * a, bg[2] * (1 - a) + m[2] * a];
  }
  function maskBg(color, op, mode) {
    var c = MASKS[color], a = K.round(op, 3);
    if (mode === "flat") return rgba(c, a);
    var a2 = K.round(Math.min(1, op * 1.6), 3);
    return "linear-gradient(180deg," + rgba(c, a) + " 0%," + rgba(c, a) + " 45%," + rgba(c, a2) + " 100%)";
  }
  function textRgb(color, mode) { return color === "white" && mode !== "none" ? [27, 27, 31] : [255, 255, 255]; }
  function cssRgb(c) { return "rgb(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + ")"; }
  function fmt(v) { return K.round(v, 1).toFixed(1); }
  function verdict(min) {
    if (min >= 4.5) return { key: "good", label: "可读" };
    if (min >= 3) return { key: "warn", label: "勉强" };
    return { key: "bad", label: "不可读" };
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent =
      ".io-stage{padding:24px 22px}" +
      ".io-photo{position:relative;width:100%;max-width:560px;aspect-ratio:16/9;min-height:220px;border-radius:10px;" +
      "overflow:hidden;background:#0a1422;box-shadow:0 2px 6px rgba(0,0,0,.14),0 26px 50px -26px rgba(0,0,0,.5)}" +
      ".io-mask{position:absolute;inset:0;pointer-events:none}" +
      ".io-copy{position:absolute;left:8%;right:8%;top:70%;transform:translateY(-50%);text-align:center;pointer-events:none}" +
      ".io-title{display:inline-block;margin:0;font-weight:800;line-height:1.12;letter-spacing:.01em;color:#fff;transition:color .15s}" +
      ".io-wrap .seg--demo{justify-self:start}" +
      ".io-readout{display:grid;gap:9px;margin-top:14px}" +
      ".io-verdict{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}" +
      ".io-chip{display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.04em}" +
      ".io-chip--good{background:rgba(31,122,77,.14);color:#1f7a4d}" +
      ".io-chip--warn{background:rgba(154,106,14,.15);color:#8a5f0c}" +
      ".io-chip--bad{background:rgba(180,35,24,.14);color:#b42318}" +
      "html[data-theme=dark] .io-chip--good{background:rgba(126,224,168,.16);color:#7ee0a8}" +
      "html[data-theme=dark] .io-chip--warn{background:rgba(255,209,102,.16);color:#ffd166}" +
      "html[data-theme=dark] .io-chip--bad{background:rgba(255,122,107,.18);color:#ff8f82}" +
      ".io-num{font-family:var(--font-mono);font-size:26px;font-weight:700;line-height:1;letter-spacing:-.02em;font-variant-numeric:tabular-nums}" +
      ".io-num span{font-size:12px;font-weight:400;color:var(--ink-3);margin-left:2px}" +
      ".io-cap{font-size:11.5px;color:var(--ink-3)}" +
      ".io-meter{position:relative;height:6px;border-radius:3px;background:var(--rule)}" +
      ".io-meter__fill{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:var(--ink-3);transition:width .12s,background .12s}" +
      ".io-meter__fill.is-good{background:#2f9e6a}.io-meter__fill.is-warn{background:#c08a1e}.io-meter__fill.is-bad{background:#d05a4c}" +
      ".io-tick{position:absolute;top:-3px;bottom:-3px;width:1px;background:var(--rule-strong)}" +
      ".io-compare{display:flex;flex-wrap:wrap;gap:6px}" +
      ".io-cmp{display:inline-flex;align-items:baseline;gap:6px;padding:3px 8px;border:1px solid var(--rule);border-radius:4px;font-size:11px;color:var(--ink-3)}" +
      ".io-cmp b{font-family:var(--font-mono);font-size:11.5px;font-weight:600;color:var(--ink-2);font-variant-numeric:tabular-nums}" +
      ".io-cmp.is-on{border-color:var(--ink-2);background:var(--bg-2);color:var(--ink-2)}.io-cmp.is-on b{color:var(--ink)}" +
      "@media (max-width:560px){.io-stage{padding:18px 14px}.io-photo{min-height:230px}}";
    document.head.appendChild(s);
  }

  function noteText(cur, v, st) {
    var n = fmt(cur);
    if (st.mode === "none") {
      return "白字直接压在照片上，最亮处只有 <strong>" + n + ":1</strong>。照片动态范围太大——换字色、加粗都救不回来，得先处理背景。";
    }
    if (st.color === "white") {
      return "白遮罩把背景提亮，文字换成深色：这就是书里说的「把对比关系反过来」。亮照片上深色字反而更好读。";
    }
    if (v.key === "bad") {
      return "遮罩还太薄：亮部只压到 <strong>" + n + ":1</strong>，白字仍然站不住。把浓度推到 50% 以上，或换「遮罩+渐变」把浓度留在亮部。";
    }
    if (v.key === "warn") {
      return "刚过大字底线 3:1，但照片上的文字最好留点余量：再厚一点，或换渐变，让最亮的地方也够反差。";
    }
    if (st.mode === "grad") {
      return "同样的浓度，渐变把更多遮罩留在亮部，比整片遮罩更省。对比度 <strong>" + n + ":1</strong>，白字稳了。";
    }
    return "亮部被压到 <strong>" + n + ":1</strong>，白字稳稳站住。代价是整张照片都暗了一档——可读性是拿画面换来的。";
  }

  window.RUIDemo.register("image-overlay", {
    build: function (body) {
      injectStyle();
      var state = { mode: "flat", color: "black", op: 0.3, size: 30 };
      var controls = K.el("div", { class: "controls" });
      var modeSeg = K.seg({
        label: "方案", options: MODES, value: state.mode,
        onChange: function (v) { state.mode = v; render(); }
      });
      var colorSeg = K.seg({
        label: "遮罩颜色", options: COLORS, value: state.color,
        onChange: function (v) { state.color = v; render(); }
      });
      var opRange = K.range({
        label: "遮罩浓度", min: 0, max: 80, step: 1, value: 30,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.op = v / 100; render(); }
      });
      var sizeRange = K.range({
        label: "文字大小", min: 16, max: 40, step: 1, value: 30,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.size = v; render(); }
      });
      controls.appendChild(modeSeg.el);
      controls.appendChild(colorSeg.el);
      controls.appendChild(opRange.el);
      controls.appendChild(sizeRange.el);

      var stage = K.stage("demo__stage--plain io-stage");
      var photo = K.el("div", { class: "io-photo" });
      photo.style.backgroundImage = photoCss;
      var mask = K.el("div", { class: "io-mask" });
      var copy = K.el("div", { class: "io-copy" });
      var title = K.el("h4", { class: "io-title", html: "把复杂的事情<br>做得简单一点" });
      copy.appendChild(title);
      photo.appendChild(mask);
      photo.appendChild(copy);
      stage.appendChild(photo);

      var chip = K.el("span", { class: "io-chip" });
      var num = K.el("strong", { class: "io-num" });
      var verdictRow = K.el("div", { class: "io-verdict", role: "status", "aria-live": "polite" }, [
        chip, num, K.el("span", { class: "io-cap", text: "9 点采样 · 大字 3:1 / 正文 4.5:1" })
      ]);
      var fill = K.el("i", { class: "io-meter__fill" });
      var meter = K.el("div", { class: "io-meter" }, [fill]);
      [33.3, 50].forEach(function (p) { meter.appendChild(K.el("b", { class: "io-tick", style: { left: p + "%" } })); });
      var cmpWrap = K.el("div", { class: "io-compare" });
      var cmpNodes = ["白字裸图", "整片遮罩", "遮罩+渐变"].map(function (label) {
        var b = K.el("b");
        var row = K.el("div", { class: "io-cmp" }, [K.el("span", { text: label }), b]);
        cmpWrap.appendChild(row);
        return { row: row, b: b };
      });
      var readout = K.el("div", { class: "io-readout" }, [verdictRow, meter, cmpWrap]);
      var note = K.note("");

      var wrap = K.el("div", { class: "io-wrap" }, [controls, stage, readout, note]);
      body.appendChild(wrap);

      function render() {
        var text = textRgb(state.color, state.mode);
        title.style.color = cssRgb(text);
        title.style.fontSize = state.size + "px";
        if (state.mode === "none") {
          mask.style.display = "none";
        } else {
          mask.style.display = "block";
          mask.style.background = maskBg(state.color, state.op, state.mode);
        }
        var pr = photo.getBoundingClientRect(), tr = title.getBoundingClientRect();
        if (!pr.width || !pr.height || !tr.height) return;
        var u0 = (tr.left - pr.left) / pr.width, u1 = (tr.right - pr.left) / pr.width;
        var v0 = (tr.top - pr.top) / pr.height, v1 = (tr.bottom - pr.top) / pr.height;
        var du = (u1 - u0) * 0.06, dv = (v1 - v0) * 0.1;
        u0 += du; u1 -= du; v0 += dv; v1 -= dv;
        var pts = [];
        for (var j = 0; j < 3; j++) {
          for (var i = 0; i < 3; i++) pts.push([u0 + (u1 - u0) * i / 2, v0 + (v1 - v0) * j / 2]);
        }
        function minContrast(rgb, mode) {
          var m = 99;
          for (var k = 0; k < pts.length; k++) {
            var p = pts[k];
            var c = K.contrast(rgb, composite(baseAt(p[0], p[1]), state.color, state.op, mode, p[1]));
            if (c < m) m = c;
          }
          return m;
        }
        var cur = minContrast(text, state.mode);
        var flat = minContrast(textRgb(state.color, "flat"), "flat");
        var grad = minContrast(textRgb(state.color, "grad"), "grad");
        var naked = minContrast([255, 255, 255], "none");
        var v = verdict(K.round(cur, 1));
        chip.className = "io-chip io-chip--" + v.key;
        chip.textContent = v.label;
        num.innerHTML = fmt(cur) + "<span>:1</span>";
        fill.className = "io-meter__fill is-" + v.key;
        fill.style.width = Math.min(100, (cur / 9) * 100).toFixed(1) + "%";
        cmpNodes[0].b.textContent = fmt(naked);
        cmpNodes[1].b.textContent = fmt(flat);
        cmpNodes[2].b.textContent = fmt(grad);
        var active = state.mode === "none" ? 0 : state.mode === "flat" ? 1 : 2;
        cmpNodes.forEach(function (n, i) { n.row.classList.toggle("is-on", i === active); });
        note.innerHTML = noteText(cur, v, state);
      }

      render();
    }
  });
})();
