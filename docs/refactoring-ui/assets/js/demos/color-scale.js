(function () {
  "use strict";
  var K = window.RUIDemo.kit;
  var STYLE_ID = "cs-style";
  var LEVELS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  var SAT_MULT = [0.5, 0.58, 0.7, 0.85, 1, 0.97, 0.92, 0.86, 0.8];
  var BASE_L = 50, BASE_S = 70, LIGHT_END = 96, DARK_END = 17;

  function hex(rgb) {
    var s = "#";
    for (var i = 0; i < 3; i++) {
      var v = rgb[i].toString(16);
      s += v.length < 2 ? "0" + v : v;
    }
    return s.toUpperCase();
  }

  function makeScale(hue) {
    return LEVELS.map(function (lv, i) {
      var t = (i - 4) / 4;
      var l = t < 0
        ? BASE_L + (LIGHT_END - BASE_L) * Math.pow(-t, 1.12)
        : BASE_L + (DARK_END - BASE_L) * Math.pow(t, 1.05);
      var s = Math.min(100, BASE_S * SAT_MULT[i]);
      var rgb = K.hslToRgb(hue, s, l);
      return { level: lv, rgb: rgb, css: K.rgbCss(rgb), hex: hex(rgb) };
    });
  }

  function pct(r) { return Math.log(r) / Math.log(21) * 100; }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent =
      ".cs-wrap{display:grid;gap:15px;width:100%}" +
      ".cs-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:13px}" +
      ".cs-field{display:grid;gap:6px}" +
      ".cs-field__label{font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--ink-3)}" +
      ".cs-select{width:100%;padding:8px 10px;border:1px solid var(--rule);border-radius:4px;" +
      "background:var(--surface);color:var(--ink);font:inherit;font-size:12px;cursor:pointer}" +
      ".cs-hue{--cs-rainbow:linear-gradient(90deg,hsl(0 72% 52%),hsl(60 72% 52%)," +
      "hsl(120 72% 52%),hsl(180 72% 52%),hsl(240 72% 52%),hsl(300 72% 52%),hsl(360 72% 52%))}" +
      ".cs-hue input[type=range].range::-webkit-slider-runnable-track{height:6px;" +
      "border-radius:999px;background:var(--cs-rainbow)}" +
      ".cs-hue input[type=range].range::-webkit-slider-thumb{margin-top:-4.5px;background:#fff;" +
      "border:2px solid #fff;box-shadow:0 0 0 1.5px rgba(20,20,30,.5)}" +
      ".cs-hue input[type=range].range::-moz-range-track{height:6px;border-radius:999px;" +
      "background:var(--cs-rainbow)}" +
      ".cs-hue input[type=range].range::-moz-range-thumb{background:#fff;border:2px solid #fff;" +
      "box-shadow:0 0 0 1.5px rgba(20,20,30,.5)}" +
      ".cs-scene{display:grid;gap:15px;width:100%;max-width:600px;margin:0 auto}" +
      ".cs-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;" +
      "font-size:9.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-3)}" +
      ".cs-head b{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);" +
      "font-size:10.5px;font-weight:600;letter-spacing:.02em;text-transform:none;color:var(--ink-2)}" +
      ".cs-head__dot{width:10px;height:10px;border-radius:50%}" +
      ".cs-swatchrow{display:flex;gap:5px;width:100%}" +
      ".cs-cell{position:relative;flex:1;min-width:0;display:grid;gap:4px}" +
      ".cs-cell__fill{display:block;height:54px;border-radius:2px;" +
      "box-shadow:inset 0 0 0 1px rgba(0,0,0,.07)}" +
      ".cs-cell__no{font-family:var(--font-mono);font-size:10px;font-weight:600;" +
      "color:var(--ink-2);text-align:center}" +
      ".cs-cell__hex{font-family:var(--font-mono);font-size:8.5px;color:var(--ink-3);text-align:center}" +
      ".cs-cell__mark{position:absolute;top:5px;width:15px;height:15px;border-radius:50%;" +
      "background:rgba(255,255,255,.94);color:#1b1b1f;font-size:9px;font-weight:700;" +
      "display:grid;place-items:center}" +
      ".cs-cell__mark--fg{left:5px}.cs-cell__mark--bg{right:5px}" +
      ".cs-demo{width:100%;border-radius:10px;padding:18px 20px;transition:background .15s,color .15s;" +
      "box-shadow:inset 0 0 0 1px rgba(0,0,0,.06)}" +
      ".cs-demo__kicker{font-size:9.5px;font-weight:700;letter-spacing:.16em;" +
      "text-transform:uppercase;margin-bottom:6px}" +
      ".cs-demo__title{font-size:20px;font-weight:800;letter-spacing:-.02em;line-height:1.3;margin-bottom:6px}" +
      ".cs-demo__body{font-size:14px;line-height:1.7;margin-bottom:10px}" +
      ".cs-demo__cap{font-size:11.5px}" +
      ".cs-readout{display:flex;align-items:center;gap:16px;flex-wrap:wrap}" +
      ".cs-ratio{font-family:var(--font-mono);font-size:27px;font-weight:700;letter-spacing:-.03em;" +
      "color:var(--ink);line-height:1}" +
      ".cs-ratio span{font-size:13px;font-weight:600;color:var(--ink-3)}" +
      ".cs-pills{display:flex;flex-wrap:wrap;gap:6px}" +
      ".cs-pill,.cs-flag{padding:2px 9px;border-radius:999px;font-size:10.5px;font-weight:700}" +
      ".cs-pill--ok,.cs-flag--ok{background:color-mix(in srgb,var(--blue) 13%,transparent);color:var(--blue)}" +
      ".cs-pill--bad,.cs-flag--bad{background:color-mix(in srgb,var(--accent) 13%,transparent);color:var(--accent)}" +
      ".cs-gauge{position:relative;height:38px}" +
      ".cs-gauge::before{content:\"\";position:absolute;left:0;right:0;top:13px;height:8px;" +
      "border-radius:999px;background:linear-gradient(90deg," +
      "color-mix(in srgb,var(--accent) 34%,var(--rule)) 0 36.1%," +
      "color-mix(in srgb,#b7791f 34%,var(--rule)) 36.1% 49.4%," +
      "color-mix(in srgb,var(--blue) 42%,var(--rule)) 49.4% 63.9%," +
      "color-mix(in srgb,#2f7d5a 42%,var(--rule)) 63.9% 100%)}" +
      ".cs-gauge__needle{position:absolute;top:9px;width:2px;height:16px;border-radius:2px;" +
      "background:var(--ink);transform:translateX(-1px);transition:left .12s}" +
      ".cs-gauge__tick{position:absolute;top:13px;width:1px;height:8px;background:rgba(20,20,30,.2)}" +
      ".cs-gauge__tick span{position:absolute;top:10px;left:0;transform:translateX(-50%);" +
      "font-family:var(--font-mono);font-size:9px;color:var(--ink-3);white-space:nowrap}" +
      ".cs-gauge__end{position:absolute;top:-3px;font-family:var(--font-mono);font-size:9px;color:var(--ink-3)}" +
      ".cs-gauge__end--l{left:0}.cs-gauge__end--r{right:0}" +
      ".cs-meta{font-family:var(--font-mono);font-size:10.5px;line-height:1.6;color:var(--ink-3)}" +
      ".cs-verdict{display:flex;align-items:center;gap:9px;flex-wrap:wrap;" +
      "font-size:11.5px;line-height:1.6;color:var(--ink-3)}" +
      ".cs-flag{flex:none}" +
      ".cs-flag--warn{background:color-mix(in srgb,#b7791f 15%,transparent);color:#b7791f}" +
      "@media(max-width:560px){.cs-hue{grid-template-columns:1fr}" +
      ".cs-swatchrow{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}" +
      ".cs-cell__fill{height:42px}.cs-demo{padding:15px 16px}" +
      ".cs-ratio{font-size:23px}}";
    document.head.appendChild(s);
  }

  window.RUIDemo.register("color-scale", {
    build: function (body) {
      injectStyle();

      var state = { hue: 210, fg: 0, bg: 4 };
      var wrap = K.el("div", { class: "cs-wrap" });
      var controls = K.el("div", { class: "controls" });
      var stage = K.stage("demo__stage--plain");
      var scene = K.el("div", { class: "cs-scene" });
      var verdict = K.el("div", { class: "cs-verdict" });
      var meta = K.el("div", { class: "cs-meta" });

      var dot = K.el("i", { class: "cs-head__dot" });
      var baseText = K.el("span", { text: "基色 500 · #3B82C4" });
      var head = K.el("div", { class: "cs-head" }, [
        K.el("span", { text: "9 级色阶" }),
        K.el("b", null, [dot, baseText])
      ]);

      var swatchRow = K.el("div", { class: "cs-swatchrow" });
      var cells = LEVELS.map(function (lv) {
        var fill = K.el("i", { class: "cs-cell__fill" });
        var fgMark = K.el("b", { class: "cs-cell__mark cs-cell__mark--fg", text: "前" });
        var bgMark = K.el("b", { class: "cs-cell__mark cs-cell__mark--bg", text: "背" });
        var hx = K.el("span", { class: "cs-cell__hex" });
        var cell = K.el("div", { class: "cs-cell" }, [
          fill, fgMark, bgMark,
          K.el("span", { class: "cs-cell__no", text: String(lv) }),
          hx
        ]);
        swatchRow.appendChild(cell);
        return { fill: fill, fg: fgMark, bg: bgMark, hex: hx };
      });

      var demo = K.el("div", { class: "cs-demo" });
      demo.innerHTML = '<div class="cs-demo__kicker">数据周报</div>' +
        '<div class="cs-demo__title">季度复盘</div>' +
        '<div class="cs-demo__body">这周的转化率比上周高了 12%，主要来自新用户的首次购买。</div>' +
        '<div class="cs-demo__cap">数据更新于 10 月 28 日</div>';

      var ratioEl = K.el("b", { class: "cs-ratio" });
      var pills = [
        K.el("span", { class: "cs-pill" }),
        K.el("span", { class: "cs-pill" }),
        K.el("span", { class: "cs-pill" })
      ];
      var readout = K.el("div", { class: "cs-readout" }, [
        ratioEl,
        K.el("div", { class: "cs-pills" }, pills)
      ]);

      var needle = K.el("i", { class: "cs-gauge__needle" });
      var gauge = K.el("div", { class: "cs-gauge" }, [needle]);
      gauge.insertAdjacentHTML("beforeend",
        '<i class="cs-gauge__tick" style="left:' + pct(3).toFixed(2) + '%"><span>3</span></i>' +
        '<i class="cs-gauge__tick" style="left:' + pct(4.5).toFixed(2) + '%"><span>4.5</span></i>' +
        '<i class="cs-gauge__tick" style="left:' + pct(7).toFixed(2) + '%"><span>7</span></i>' +
        '<span class="cs-gauge__end cs-gauge__end--l">1:1</span>' +
        '<span class="cs-gauge__end cs-gauge__end--r">21:1</span>');

      var hueCtl = K.range({
        label: "基色色相",
        min: 0, max: 360, step: 1, value: 210,
        format: function (v) { return v + "°"; },
        onInput: function (v) { state.hue = v; render(); }
      });
      hueCtl.el.classList.add("cs-hue");

      function makeSelect(label, value) {
        var sel = K.el("select", { class: "cs-select", "aria-label": label });
        LEVELS.forEach(function (lv, i) {
          sel.appendChild(K.el("option", {
            value: String(i),
            text: lv === 500 ? "500 · 基色" : String(lv)
          }));
        });
        sel.value = String(value);
        return sel;
      }
      var fgSel = makeSelect("前景色阶", state.fg);
      var bgSel = makeSelect("背景色阶", state.bg);
      fgSel.addEventListener("change", function () { state.fg = Number(fgSel.value); render(); });
      bgSel.addEventListener("change", function () { state.bg = Number(bgSel.value); render(); });

      function field(label, sel) {
        return K.el("label", { class: "cs-field" }, [
          K.el("span", { class: "cs-field__label", text: label }),
          sel
        ]);
      }

      var fields = K.el("div", { class: "cs-fields" }, [
        field("前景", fgSel),
        field("背景", bgSel)
      ]);
      controls.appendChild(hueCtl.el);
      controls.appendChild(fields);
      scene.appendChild(head);
      scene.appendChild(swatchRow);
      scene.appendChild(demo);
      stage.appendChild(scene);
      wrap.appendChild(controls);
      wrap.appendChild(stage);
      wrap.appendChild(readout);
      wrap.appendChild(gauge);
      wrap.appendChild(meta);
      wrap.appendChild(verdict);
      body.appendChild(wrap);

      function render() {
        var scale = makeScale(state.hue % 360);
        var ratio = K.contrast(scale[state.fg].rgb, scale[state.bg].rgb);

        cells.forEach(function (c, i) {
          c.fill.style.background = scale[i].css;
          c.hex.textContent = scale[i].hex;
          c.fg.style.display = i === state.fg ? "" : "none";
          c.bg.style.display = i === state.bg ? "" : "none";
        });
        dot.style.background = scale[4].css;
        baseText.textContent = "基色 500 · " + scale[4].hex;
        demo.style.background = scale[state.bg].css;
        demo.style.color = scale[state.fg].css;
        ratioEl.innerHTML = ratio.toFixed(2) + "<span>:1</span>";
        needle.style.left = pct(ratio).toFixed(2) + "%";

        var checks = [
          ["正文 AA", ratio >= 4.5],
          ["大字 AA", ratio >= 3],
          ["正文 AAA", ratio >= 7]
        ];
        pills.forEach(function (p, i) {
          p.className = "cs-pill " + (checks[i][1] ? "cs-pill--ok" : "cs-pill--bad");
          p.textContent = checks[i][0] + (checks[i][1] ? " ✓" : " ✗");
        });
        meta.textContent = "前景 " + scale[state.fg].level + " · " + scale[state.fg].hex +
          " → 背景 " + scale[state.bg].level + " · " + scale[state.bg].hex;

        var tone, flag, msg;
        if (ratio >= 7) {
          tone = "ok"; flag = "AAA";
          msg = "正文和大字都过了 AAA。对比够强，但也要留意别让正文比标题还抢眼。";
        } else if (ratio >= 4.5) {
          tone = "ok"; flag = "AA";
          msg = "正文达到 AA（4.5:1），大字也够——这是彩色界面的常用下限。";
        } else if (ratio >= 3) {
          tone = "warn"; flag = "仅大字达标";
          msg = state.bg >= 2 && state.bg <= 5
            ? "大字够（3:1），正文不够。500 这样的中间调最难配字：浅字深字都到不了 4.5。背景换 100 配 800/900 的字，或换 800 配 100 的字，或把正文放大到 18.66px 粗体。"
            : "大字够（3:1），正文不够。把文字换到更深的色阶，或把这段文字放大到 18.66px 粗体以上。";
        } else {
          tone = "bad"; flag = "不达标";
          msg = "正文和大字都不够。彩色背景配浅色字时，背景往往要深得多才达标——也可以反转对比：浅底深字。";
        }
        if (state.bg >= 6 && ratio >= 4.5) {
          msg += " 深底浅字对比够了，但深色块会抢注意力，书里建议把对比关系反过来。";
        }
        verdict.innerHTML = '<span class="cs-flag cs-flag--' + tone + '">' + flag +
          "</span><span>" + msg + "</span>";
      }

      render();
    }
  });
})();
