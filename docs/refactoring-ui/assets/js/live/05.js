/* ==========================================================================
   第 5 章 · 实时重制图（色彩的运用）
   05-6  HSL：色相 / 饱和度 / 明度各管一件事
   05-23 九级色阶：先定两端，再补中间
   05-42 对比度：深底白字不行，就反过来
   05-48 不要只靠颜色：箭头与色盲视角
   ========================================================================== */
(function () {
  "use strict";
  var K = window.RUILive.kit;

  // 让 .lv-canvas 的网格列跟随画布宽度，避免长内容把画布撑宽（窄屏横向溢出）
  function liveCanvas() {
    var cv = K.canvas();
    cv.style.gridTemplateColumns = "minmax(0,1fr)";
    return cv;
  }

  /* ---------------------------------------------------------- helpers */
  function hslToRgb(h, s, l) {
    s /= 100;
    l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var hp = (((h % 360) + 360) % 360) / 60;
    var x = c * (1 - Math.abs((hp % 2) - 1));
    var r = 0, g = 0, b = 0;
    if (hp < 1) { r = c; g = x; }
    else if (hp < 2) { r = x; g = c; }
    else if (hp < 3) { g = c; b = x; }
    else if (hp < 4) { g = x; b = c; }
    else if (hp < 5) { r = x; b = c; }
    else { r = c; b = x; }
    var m = l - c / 2;
    return [
      Math.round(K.clamp(r + m, 0, 1) * 255),
      Math.round(K.clamp(g + m, 0, 1) * 255),
      Math.round(K.clamp(b + m, 0, 1) * 255)
    ];
  }
  function pad2(v) {
    var s = v.toString(16);
    return s.length < 2 ? "0" + s : s;
  }
  function rgbToHex(rgb) {
    return "#" + pad2(rgb[0]) + pad2(rgb[1]) + pad2(rgb[2]);
  }
  function hexToRgb(hex) {
    var v = hex.replace("#", "");
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  }
  function hslCss(h, s, l) {
    return "hsl(" + Math.round(h) + ", " + Math.round(s) + "%, " + Math.round(l) + "%)";
  }
  function srgbToLin(c) {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }
  function linToSrgb(c) {
    if (c <= 0.0031308) c = c * 12.92;
    else c = 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(K.clamp(c, 0, 1) * 255);
  }
  function relLum(rgb) {
    return 0.2126 * srgbToLin(rgb[0]) + 0.7152 * srgbToLin(rgb[1]) + 0.0722 * srgbToLin(rgb[2]);
  }
  function contrast(a, b) {
    var la = relLum(a), lb = relLum(b);
    var hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }
  var SIM = {
    deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
    protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
  };
  function simulate(rgb, mode) {
    var m = SIM[mode];
    if (!m) return rgb;
    var lin = [srgbToLin(rgb[0]), srgbToLin(rgb[1]), srgbToLin(rgb[2])];
    var out = [];
    for (var i = 0; i < 3; i++) {
      out.push(linToSrgb(m[i][0] * lin[0] + m[i][1] * lin[1] + m[i][2] * lin[2]));
    }
    return out;
  }
  var HUE_NAMES = [[0, "红"], [32, "橙"], [55, "黄"], [115, "绿"], [175, "青"], [225, "蓝"], [275, "紫"], [320, "洋红"], [360, "红"]];
  function hueName(h) {
    var best = HUE_NAMES[0], bd = 999;
    for (var i = 0; i < HUE_NAMES.length; i++) {
      var d = Math.abs(h - HUE_NAMES[i][0]);
      d = Math.min(d, 360 - d);
      if (d < bd) { bd = d; best = HUE_NAMES[i]; }
    }
    return best[1];
  }

  /* ------------------------------------------------------------ style */
  var style = document.createElement("style");
  style.id = "lv-05-style";
  style.textContent = [
    ".l05-sub{font-size:10px;font-family:var(--font-mono);color:var(--ink-3)}",
    ".l05-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:12px}",

    /* ------------------------------------------------------- 05-6 HSL */
    ".l05-hsl{width:100%;max-width:580px;display:grid;grid-template-columns:repeat(auto-fit,minmax(234px,1fr));gap:12px;align-items:stretch}",
    ".l05-hsl__panel{background:#fff;border:1px solid #e3e8ee;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:11px;box-shadow:0 18px 40px -34px rgba(20,32,48,.5)}",
    ".l05-hsl__swatch{position:relative;height:66px;border-radius:7px;display:grid;place-items:end start;padding:7px 10px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.07);transition:background .1s}",
    ".l05-hsl__hex{font-family:var(--font-mono);font-size:10.5px;font-weight:700;letter-spacing:.04em}",
    ".l05-hsl__axis{display:flex;align-items:center;gap:8px}",
    ".l05-hsl__axlab{width:26px;flex:none;font-size:10px;font-weight:700;color:#8792a0;letter-spacing:.04em}",
    ".l05-hsl__track{position:relative;flex:1;height:12px;border-radius:3px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)}",
    ".l05-hsl__mk{position:absolute;top:-3px;width:3px;height:18px;margin-left:-2px;background:#fff;border:1px solid rgba(0,0,0,.5);border-radius:1px;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:left .1s}",
    ".l05-hsl__code{font-family:var(--font-mono);font-size:11px;color:#52606d;background:#f6f8fb;border:1px solid #e7ecf3;border-radius:6px;padding:6px 9px;letter-spacing:.01em}",
    ".l05-hsl__code b{color:#1f2933;font-weight:700}",
    ".l05-hsl__ui{background:#fff;border:1px solid #e3e8ee;border-radius:10px;padding:15px 15px 17px;display:flex;flex-direction:column;gap:10px;justify-content:center;box-shadow:0 18px 40px -34px rgba(20,32,48,.5)}",
    ".l05-hsl__uihead{display:flex;align-items:center;justify-content:space-between;gap:8px}",
    ".l05-hsl__ui-h{font-size:15px;font-weight:800;letter-spacing:-.01em;transition:color .1s}",
    ".l05-hsl__pill{font-size:10.5px;font-weight:700;border-radius:999px;padding:3px 9px;transition:background .1s,color .1s}",
    ".l05-hsl__field{border:1px solid #dbe2ea;border-radius:6px;padding:8px 10px;font-size:11.5px;transition:border-color .1s,color .1s,background .1s}",
    ".l05-hsl__uirow{display:flex;gap:8px;margin-top:1px}",
    ".l05-hsl__btn{flex:1;text-align:center;border-radius:6px;padding:8px 0;font-size:11.5px;font-weight:700;color:#fff;transition:background .1s,color .1s}",
    ".l05-hsl__ghost{flex:0 0 auto;border:1px solid #d7dfe8;border-radius:6px;padding:8px 12px;font-size:11.5px;font-weight:700;background:#fff;transition:color .1s,border-color .1s}",
    ".l05-hsl__link{font-size:11px;font-weight:700;text-decoration:underline;text-underline-offset:2px;transition:color .1s}",

    /* -------------------------------------------------- 05-23 色阶 */
    ".l05-scale{width:100%;max-width:560px;display:flex;flex-direction:column;gap:10px}",
    ".l05-scale__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(56px,1fr));gap:5px}",
    ".l05-scale__sw{position:relative;height:50px;border-radius:6px;display:grid;place-items:end center;padding-bottom:5px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.06);transition:background .12s}",
    ".l05-scale__lb{font-family:var(--font-mono);font-size:9.5px;font-weight:700;letter-spacing:.02em;transition:color .12s}",
    ".l05-scale__alert{display:flex;gap:11px;align-items:flex-start;border:1px solid;border-radius:9px;padding:12px 14px;transition:background .12s,border-color .12s}",
    ".l05-scale__icon{width:22px;height:22px;border-radius:50%;flex:none;margin-top:1px;transition:background .12s}",
    ".l05-scale__txt{display:flex;flex-direction:column;gap:3px;min-width:0}",
    ".l05-scale__title{font-size:13px;font-weight:800;transition:color .12s}",
    ".l05-scale__body{font-size:11.5px;line-height:1.55;transition:color .12s}",
    ".l05-scale__link{align-self:flex-start;font-size:11px;font-weight:700;text-decoration:underline;text-underline-offset:2px;margin-top:2px;transition:color .12s}",
    ".l05-scale__meta{display:flex;flex-wrap:wrap;gap:6px;font-family:var(--font-mono);font-size:10px;color:var(--ink-3)}",
    ".l05-scale__chip{background:var(--code-bg);border:1px solid var(--rule);border-radius:4px;padding:2px 6px;color:var(--ink-2)}",
    ".l05-scale__chip.is-warn{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 34%,transparent);background:color-mix(in srgb,var(--accent) 8%,transparent)}",

    /* -------------------------------------------- 05-42 对比度反转 */
    ".l05-pol{width:100%;max-width:470px;background:#fff;border:1px solid #e3e8ee;border-radius:11px;padding:15px 17px 8px;box-shadow:0 20px 44px -34px rgba(20,32,48,.5)}",
    ".l05-pol__head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;padding-bottom:10px;border-bottom:1px solid #eef1f5}",
    ".l05-pol__title{font-size:15px;font-weight:800;color:#1d2733;letter-spacing:-.01em}",
    ".l05-pol__sub{font-size:10.5px;color:#9aa5b1}",
    ".l05-pol__row{display:flex;align-items:center;gap:9px;padding:10px 0;border-bottom:1px solid #f3f5f8}",
    ".l05-pol__row:last-child{border-bottom:0}",
    ".l05-pol__name{font-size:11.5px;color:#52606d;min-width:0;flex:1}",
    ".l05-pol__name b{font-family:var(--font-mono);font-size:10.5px;color:#8792a0;font-weight:700;margin-right:2px}",
    ".l05-pol__pill{border-radius:999px;padding:4px 10px;font-weight:700;flex:none;line-height:1.2;transition:background .12s,color .12s,font-size .12s}",
    ".l05-pol__ratio{font-family:var(--font-mono);font-size:10px;font-weight:700;flex:none;min-width:56px;text-align:right;color:#1f7a4d}",
    ".l05-pol__ratio.is-bad{color:#c22525}",
    ".l05-pol__meta{width:100%;max-width:470px;display:flex;flex-wrap:wrap;gap:6px;font-family:var(--font-mono);font-size:10px}",
    ".l05-pol__chip{border:1px solid var(--rule);background:var(--code-bg);border-radius:4px;padding:2px 6px;color:var(--ink-2)}",
    ".l05-pol__chip.is-ok{color:var(--blue);border-color:color-mix(in srgb,var(--blue) 36%,transparent);background:color-mix(in srgb,var(--blue) 8%,transparent)}",
    ".l05-pol__chip.is-bad{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 36%,transparent);background:color-mix(in srgb,var(--accent) 8%,transparent)}",

    /* --------------------------------------------- 05-48 不只靠颜色 */
    ".l05-a11y{width:100%;max-width:520px;display:flex;flex-direction:column;gap:10px}",
    ".l05-a11y__cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(146px,1fr));gap:10px}",
    ".l05-a11y__card{background:#fff;border:1px solid #e3e8ee;border-radius:10px;padding:13px 14px 11px;display:flex;flex-direction:column;gap:6px;box-shadow:0 18px 40px -34px rgba(20,32,48,.5)}",
    ".l05-a11y__lab{font-size:11.5px;color:#7b8794;font-weight:600}",
    ".l05-a11y__row{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}",
    ".l05-a11y__num{font-size:23px;font-weight:800;color:#1d2733;letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums}",
    ".l05-a11y__delta{display:inline-flex;align-items:center;gap:2px;font-family:var(--font-mono);font-size:10.5px;font-weight:700;border-radius:999px;padding:2px 7px;border:1px solid;transition:color .12s,background .12s,border-color .12s}",
    ".l05-a11y__arw{font-style:normal;font-size:11.5px;line-height:1;font-weight:700}",
    ".l05-a11y__spark{height:38px;margin-top:1px}",
    ".l05-a11y__spark svg{display:block;width:100%;height:38px}",
    ".l05-a11y__foot{font-size:10px;color:#9aa5b1}",
    ".l05-a11y__hint{font-family:var(--font-mono);font-size:10.5px;line-height:1.55;color:var(--ink-3)}",
    ".l05-a11y__hint b{color:var(--ink-2)}"
  ].join("\n");
  document.head.appendChild(style);

  /* ============================================================ 05-6 */
  RUILive.register("05-6", {
    build: function (body) {
      var state = { h: 210, s: 84, l: 56 };

      function axis(label) {
        var mk = K.el("i", { class: "l05-hsl__mk" });
        var track = K.el("div", { class: "l05-hsl__track" }, [mk]);
        var row = K.el("div", { class: "l05-hsl__axis" }, [
          K.el("span", { class: "l05-hsl__axlab", text: label }),
          track
        ]);
        return { row: row, track: track, mk: mk };
      }
      var axH = axis("色相");
      var axS = axis("饱和");
      var axL = axis("明度");

      var hex = K.el("span", { class: "l05-hsl__hex" });
      var swatch = K.el("div", { class: "l05-hsl__swatch" }, [hex]);
      var code = K.el("div", { class: "l05-hsl__code" });
      var panelA = K.el("div", { class: "l05-hsl__panel" }, [swatch, axH.row, axS.row, axL.row, code]);

      var uiH = K.el("div", { class: "l05-hsl__ui-h", text: "项目设置" });
      var uiPill = K.el("span", { class: "l05-hsl__pill", text: "进行中" });
      var uiField = K.el("div", { class: "l05-hsl__field", text: "输入项目名称" });
      var uiBtn = K.el("span", { class: "l05-hsl__btn", text: "保存更改" });
      var uiGhost = K.el("span", { class: "l05-hsl__ghost", text: "取消" });
      var uiLink = K.el("span", { class: "l05-hsl__link", text: "查看全部成员" });
      var panelB = K.el("div", { class: "l05-hsl__ui" }, [
        K.el("div", { class: "l05-hsl__uihead" }, [uiH, uiPill]),
        uiField,
        K.el("div", { class: "l05-hsl__uirow" }, [uiBtn, uiGhost]),
        uiLink
      ]);
      var wrap = K.el("div", { class: "l05-hsl" }, [panelA, panelB]);

      function paint() {
        var h = state.h, s = state.s, l = state.l;
        var rgb = hslToRgb(h, s, l);
        swatch.style.background = hslCss(h, s, l);
        hex.textContent = rgbToHex(rgb);
        hex.style.color = relLum(rgb) > 0.36 ? "#1f2933" : "#ffffff";

        axH.track.style.background = "linear-gradient(90deg," + [0, 60, 120, 180, 240, 300, 360].map(function (x) {
          return hslCss(x, s, l);
        }).join(",") + ")";
        axH.mk.style.left = (h / 360 * 100) + "%";
        axS.track.style.background = "linear-gradient(90deg," + hslCss(h, 0, l) + "," + hslCss(h, 100, l) + ")";
        axS.mk.style.left = s + "%";
        axL.track.style.background = "linear-gradient(90deg," + hslCss(h, s, 0) + "," + hslCss(h, s, 50) + "," + hslCss(h, s, 100) + ")";
        axL.mk.style.left = l + "%";

        uiH.style.color = hslCss(h, s, K.clamp(l - 34, 8, 30));
        uiPill.style.background = hslCss(h, s, Math.min(97, l + 40));
        uiPill.style.color = hslCss(h, s, K.clamp(l - 30, 12, 30));
        uiField.style.borderColor = hslCss(h, s, Math.min(90, l + 24));
        uiField.style.background = hslCss(h, s, Math.min(99, l + 43));
        uiField.style.color = hslCss(h, s, K.clamp(l - 16, 12, 46));
        var btnBg = hslToRgb(h, s, K.clamp(l - 8, 26, 62));
        uiBtn.style.background = rgbToHex(btnBg);
        uiBtn.style.color = relLum(btnBg) > 0.4 ? "#1f2933" : "#ffffff";
        uiGhost.style.borderColor = hslCss(h, s, Math.min(88, l + 24));
        uiGhost.style.color = hslCss(h, s, K.clamp(l - 18, 12, 34));
        uiLink.style.color = hslCss(h, s, K.clamp(l - 10, 12, 40));

        code.innerHTML = "<b>hsl(" + h + ", " + s + "%, " + l + "%)</b> · " + hueName(h) + " · " + rgbToHex(rgb);
      }

      var rh = K.range({
        label: "色相", min: 0, max: 360, step: 1, value: 210,
        format: function (v) { return v + "°"; },
        hint: "0° 红 · 120° 绿 · 240° 蓝",
        onInput: function (v) { state.h = v; paint(); }
      });
      var rs = K.range({
        label: "饱和度", min: 0, max: 100, step: 1, value: 84,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.s = v; paint(); }
      });
      var rl = K.range({
        label: "明度", min: 0, max: 100, step: 1, value: 56,
        format: function (v) { return v + "%"; },
        hint: "0% 黑 · 100% 白 · 50% 左右才是「纯色」",
        onInput: function (v) { state.l = v; paint(); }
      });

      body.appendChild(K.controls([rh.el, rs.el, rl.el]));
      var cv = liveCanvas();
      cv.appendChild(wrap);
      body.appendChild(cv);
      body.appendChild(K.note("HSL 三个数各管一件事：色相决定是哪一种颜色，饱和度决定有多浓，明度决定有多亮。改一个数，另外两个的意思不变——这就是它比 hex 好调的地方。"));
      paint();
    }
  });

  /* =========================================================== 05-23 */
  RUILive.register("05-23", {
    build: function (body) {
      var state = { h: 214, s: 68, comp: true };
      var STEPS = [94, 87, 79, 68, 56, 46, 36, 27, 18];
      var NAMES = ["100", "200", "300", "400", "500", "600", "700", "800", "900"];

      var grid = K.el("div", { class: "l05-scale__grid" });
      var boxes = [];
      NAMES.forEach(function (nm) {
        var lab = K.el("span", { class: "l05-scale__lb", text: nm });
        var box = K.el("div", { class: "l05-scale__sw" }, [lab]);
        boxes.push({ box: box, lab: lab });
        grid.appendChild(box);
      });

      var icon = K.el("i", { class: "l05-scale__icon" });
      var title = K.el("div", { class: "l05-scale__title", text: "设置已保存" });
      var msg = K.el("div", { class: "l05-scale__body", text: "你的修改已经同步到所有设备，可以随时回来继续调整。" });
      var link = K.el("span", { class: "l05-scale__link", text: "查看变更记录" });
      var alert = K.el("div", { class: "l05-scale__alert" }, [
        icon,
        K.el("div", { class: "l05-scale__txt" }, [title, msg, link])
      ]);
      var meta = K.el("div", { class: "l05-scale__meta" });
      var wrap = K.el("div", { class: "l05-scale" }, [grid, alert, meta]);

      function sat(i) {
        if (!state.comp) return state.s;
        var f = Math.abs(STEPS[i] - 50) / 50;
        return Math.min(100, state.s + (100 - state.s) * f * 0.55);
      }

      function paint() {
        var colors = [];
        for (var i = 0; i < 9; i++) {
          var s = sat(i);
          var css = hslCss(state.h, s, STEPS[i]);
          colors.push(css);
          boxes[i].box.style.background = css;
          boxes[i].lab.style.color = STEPS[i] > 55 ? hslCss(state.h, Math.max(s, 40), 26) : "rgba(255,255,255,.92)";
          boxes[i].box.title = "S " + Math.round(s) + "% · L " + STEPS[i] + "%";
        }
        alert.style.background = colors[0];
        alert.style.borderColor = colors[2];
        icon.style.background = colors[4];
        title.style.color = colors[8];
        msg.style.color = colors[7];
        link.style.color = colors[6];

        meta.innerHTML = "";
        meta.appendChild(K.el("span", { class: "l05-scale__chip", text: "500 是基色 · S " + Math.round(sat(4)) + "%" }));
        meta.appendChild(K.el("span", { class: "l05-scale__chip", text: "100 最浅 · 900 最深" }));
        meta.appendChild(K.el("span", {
          class: "l05-scale__chip" + (state.comp ? "" : " is-warn"),
          text: state.comp ? "两端已补偿 · 边缘 S 到 " + Math.round(sat(0)) + "%" : "未补偿 · 两端发灰"
        }));
      }

      var rh = K.range({
        label: "色相", min: 0, max: 360, step: 1, value: 214,
        format: function (v) { return v + "°"; },
        hint: "拖动色相，整页强调色一起换",
        onInput: function (v) { state.h = v; paint(); }
      });
      var rs = K.range({
        label: "饱和度", min: 0, max: 100, step: 1, value: 68,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.s = v; paint(); }
      });
      var comp = K.toggle({
        label: "补偿两端饱和度",
        checked: true,
        hint: "明度离 50% 越远，同样的饱和度看起来越灰",
        onChange: function (v) { state.comp = v; paint(); }
      });

      body.appendChild(K.controls([rh.el, rs.el, comp.el]));
      var cv = liveCanvas();
      cv.appendChild(wrap);
      body.appendChild(cv);
      body.appendChild(K.note("九级色阶从两端做起：先定最浅的 100 和最深的 900，再慢慢往中间补。靠近黑白两端的颜色会发灰，要单独把饱和度补一点回来。"));
      paint();
    }
  });

  /* =========================================================== 05-42 */
  RUILive.register("05-42", {
    build: function (body) {
      var state = { l: 46, txt: "white", size: "small" };
      var ROWS = [
        { id: "#4821", name: "住院医疗", status: "已通过", hue: 148 },
        { id: "#4822", name: "门诊报销", status: "审核中", hue: 38 },
        { id: "#4823", name: "意外伤害", status: "待补充", hue: 352 }
      ];
      var rows = ROWS.map(function (r) {
        var pill = K.el("span", { class: "l05-pol__pill", text: r.status });
        var ratio = K.el("span", { class: "l05-pol__ratio" });
        var row = K.el("div", { class: "l05-pol__row" }, [
          K.el("span", { class: "l05-pol__name" }, [
            K.el("b", { text: r.id }),
            K.el("span", { text: " · " + r.name })
          ]),
          pill,
          ratio
        ]);
        return { row: row, pill: pill, ratio: ratio };
      });
      var card = K.el("div", { class: "l05-pol" }, [
        K.el("div", { class: "l05-pol__head" }, [
          K.el("div", { class: "l05-pol__title", text: "理赔申请" }),
          K.el("div", { class: "l05-pol__sub", text: "3 条待处理 · 刚刚更新" })
        ])
      ].concat(rows.map(function (r) { return r.row; })));

      var meta = K.el("div", { class: "l05-pol__meta" });
      var wrap = K.el("div", { class: "l05-wrap" }, [card, meta]);

      function paint() {
        var thr = state.size === "big" ? 3 : 4.5;
        var passed = 0;
        ROWS.forEach(function (r, i) {
          var bg = hslToRgb(r.hue, 62, state.l);
          var txt = state.txt === "white" ? [255, 255, 255] : hslToRgb(r.hue, 46, 16);
          var c = contrast(bg, txt);
          var ok = c >= thr;
          if (ok) passed++;
          rows[i].pill.style.background = rgbToHex(bg);
          rows[i].pill.style.color = rgbToHex(txt);
          rows[i].pill.style.fontSize = (state.size === "big" ? 19 : 12) + "px";
          rows[i].ratio.textContent = c.toFixed(2) + ":1 " + (ok ? "✓" : "✗");
          rows[i].ratio.className = "l05-pol__ratio" + (ok ? "" : " is-bad");
        });
        meta.innerHTML = "";
        function chip(text, cls) {
          meta.appendChild(K.el("span", { class: "l05-pol__chip" + (cls ? " " + cls : ""), text: text }));
        }
        chip((state.txt === "white" ? "白色文字" : "深色文字") + " · 阈值 " + thr.toFixed(1) + ":1");
        chip("背景明度 " + state.l + "%");
        chip("通过 " + passed + " / 3", passed === 3 ? "is-ok" : "is-bad");
        if (passed < 3) {
          chip(state.txt === "white" ? "试试提高明度，再换成深色字" : "试试再亮一点", "is-bad");
        }
      }

      var rl = K.range({
        label: "背景明度", min: 20, max: 95, step: 1, value: 46,
        format: function (v) { return v + "%"; },
        hint: "同一个色相，明度决定它是深底还是浅底",
        onInput: function (v) { state.l = v; paint(); }
      });
      var segTxt = K.seg({
        label: "文字颜色",
        options: [{ value: "white", label: "白色字" }, { value: "dark", label: "深色字" }],
        value: "white",
        onChange: function (v) { state.txt = v; paint(); }
      });
      var segSize = K.seg({
        label: "文字大小",
        options: [{ value: "small", label: "小字 12px" }, { value: "big", label: "大字 19px" }],
        value: "small",
        onChange: function (v) { state.size = v; paint(); }
      });

      body.appendChild(K.controls([rl.el, segTxt.el, segSize.el]));
      var cv = liveCanvas();
      cv.appendChild(wrap);
      body.appendChild(cv);
      body.appendChild(K.note("深色背景配白字，对比度很容易卡在 4.5:1 以下。把它反过来——浅色的底、深色的字——同一个色相就能轻松过线，看起来还更轻。"));
      paint();
    }
  });

  /* =========================================================== 05-48 */
  RUILive.register("05-48", {
    build: function (body) {
      var state = { arrows: false, sim: "none" };
      var GREEN = "#1f9d6b", RED = "#d2473f";
      var A = [40, 43, 41, 47, 52, 55, 58, 64];
      var B = [31, 33, 30, 28, 27, 25, 24, 22];

      function sparkline(data) {
        var w = 140, h = 34;
        var max = Math.max.apply(null, data), min = Math.min.apply(null, data);
        var pts = data.map(function (v, i) {
          var x = (i / (data.length - 1)) * w;
          var y = h - 2 - ((v - min) / (max - min || 1)) * (h - 6);
          return x.toFixed(1) + "," + y.toFixed(1);
        });
        return '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-hidden="true">' +
          '<path d="M' + pts.join(" L") + '" fill="none" stroke="#cfd6df" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>' +
          '<circle cx="' + pts[pts.length - 1].split(",")[0] + '" cy="' + pts[pts.length - 1].split(",")[1] + '" r="2.2" fill="#aab4c2"></circle>' +
          "</svg>";
      }

      function card(label, value, delta, data) {
        var arw = K.el("i", { class: "l05-a11y__arw", text: "↑" });
        var deltaEl = K.el("span", { class: "l05-a11y__delta" }, [arw, K.el("span", { text: delta })]);
        var root = K.el("div", { class: "l05-a11y__card" }, [
          K.el("div", { class: "l05-a11y__lab", text: label }),
          K.el("div", { class: "l05-a11y__row" }, [
            K.el("span", { class: "l05-a11y__num", text: value }),
            deltaEl
          ]),
          K.el("div", { class: "l05-a11y__spark", html: sparkline(data) }),
          K.el("div", { class: "l05-a11y__foot", text: "较上月" })
        ]);
        return { root: root, delta: deltaEl, arw: arw };
      }

      var cA = card("本月新增用户", "2,481", "12.4%", A);
      var cB = card("本月流失用户", "612", "3.2%", B);
      var hint = K.el("div", { class: "l05-a11y__hint" });
      var wrap = K.el("div", { class: "l05-a11y" }, [
        K.el("div", { class: "l05-a11y__cards" }, [cA.root, cB.root]),
        hint
      ]);

      var HINT = {
        none: "正常视觉：绿色是「涨得好」，红色是「要注意」。",
        deutan: "红绿色盲视角：绿色和红色几乎收敛成同一种土黄，只看颜色已经分不出好坏。",
        tritan: "蓝黄色盲视角：红绿之间的差异同样被抹平，只剩亮度的细微区别。"
      };

      function paint() {
        var g = simulate(hexToRgb(GREEN), state.sim);
        var r = simulate(hexToRgb(RED), state.sim);
        var pairs = [[cA, g], [cB, r]];
        pairs.forEach(function (p) {
          var el = p[0].delta, col = rgbToHex(p[1]);
          el.style.color = col;
          el.style.borderColor = "rgba(" + p[1].join(",") + ",.38)";
          el.style.background = "rgba(" + p[1].join(",") + ",.1)";
          p[0].arw.style.display = state.arrows ? "inline" : "none";
        });
        hint.innerHTML = "";
        hint.appendChild(K.el("b", { text: state.arrows ? "箭头已打开：" : "只有颜色时：" }));
        hint.appendChild(K.el("span", { text: HINT[state.sim] + (state.arrows ? " 现在不看颜色，也能从 ↑ ↓ 读出方向。" : "") }));
      }

      var tgArrow = K.toggle({
        label: "显示涨跌箭头",
        checked: false,
        hint: "箭头把方向从颜色里解放出来",
        onChange: function (v) { state.arrows = v; paint(); }
      });
      var segSim = K.seg({
        label: "色觉视角",
        options: [{ value: "none", label: "正常" }, { value: "deutan", label: "红绿色盲" }, { value: "tritan", label: "蓝黄色盲" }],
        value: "none",
        onChange: function (v) { state.sim = v; paint(); }
      });

      body.appendChild(K.controls([tgArrow.el, segSim.el]));
      var cv = liveCanvas();
      cv.appendChild(wrap);
      body.appendChild(cv);
      body.appendChild(K.note("颜色是最不可靠的信号：色盲读者看到的红绿可能一模一样。把方向做成箭头、把好坏写进文案，颜色只当锦上添花。"));
      paint();
    }
  });
})();
