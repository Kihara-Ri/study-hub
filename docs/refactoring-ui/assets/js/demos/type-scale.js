/* type-scale.js — 第 4 章 · 字号阶梯：随手挑 vs 等比阶梯 */
(function () {
  "use strict";
  var K = window.RUIDemo.kit;
  var STYLE_ID = "ts-style";

  var ROWS = [
    { role: "大标题", text: "把复杂变简单", weight: 800, step: 3, arb: 1.5 },
    { role: "节标题", text: "先建立层级", weight: 700, step: 2, arb: 1.25 },
    { role: "小标题", text: "尺寸只是工具", weight: 600, step: 1, arb: 1.0625 },
    { role: "正文", text: "字号之间的跨度要足够大，视线才能分出先后。", weight: 400, step: 0, arb: 1 },
    { role: "辅助", text: "2024 · 设计笔记", weight: 500, step: -1, arb: 0.75 }
  ];

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent =
      ".ts-wrap{display:grid;gap:18px;width:100%}" +
      ".ts-doc{width:100%;max-width:580px;margin:0 auto;padding:20px 24px 14px;background:#fff;color:#1b1b1f;" +
      "font-family:var(--font-ui);border-radius:3px;" +
      "box-shadow:0 1px 2px rgba(0,0,0,.05),0 24px 48px -34px rgba(0,0,0,.4)}" +
      ".ts-doc__top{display:flex;align-items:baseline;justify-content:space-between;gap:12px;" +
      "padding-bottom:11px;border-bottom:1px solid #ededf0;font-size:9.5px;font-weight:700;" +
      "letter-spacing:.14em;text-transform:uppercase;color:#9a9aa4}" +
      ".ts-doc__top b{font-weight:600;letter-spacing:.02em;text-transform:none;color:#6f6f78}" +
      ".ts-row{display:flex;align-items:baseline;gap:12px;padding:10px 0;border-bottom:1px dashed #f1f1f4}" +
      ".ts-row:last-child{border-bottom:0}" +
      ".ts-row__role{flex:none;width:44px;font-family:var(--font-mono);font-size:9.5px;color:#a6a6ae}" +
      ".ts-row__text{flex:1;min-width:0;line-height:1.2;letter-spacing:-.01em;" +
      "overflow-wrap:anywhere;transition:font-size .12s ease}" +
      ".ts-row__meta{flex:none;width:56px;text-align:right;font-family:var(--font-mono);" +
      "font-variant-numeric:tabular-nums}" +
      ".ts-row__meta b{display:block;font-size:11px;font-weight:600;color:#4c4c55}" +
      ".ts-row__meta i{display:block;font-style:normal;font-size:10px;color:#a6a6ae}" +
      ".ts-row__meta i.is-bad{color:#c0392b}.ts-row__meta i.is-warn{color:#b7791f}" +
      ".ts-row__meta i.is-good{color:#2f6f4f}" +
      ".ts-verdict{display:flex;align-items:center;gap:9px;flex-wrap:wrap;" +
      "font-size:11.5px;line-height:1.6;color:var(--ink-3)}" +
      ".ts-verdict em{font-style:normal;color:var(--ink-2)}" +
      ".ts-flag{flex:none;padding:2px 9px;border-radius:999px;font-size:10.5px;font-weight:700}" +
      ".ts-flag--ok{background:color-mix(in srgb,var(--blue) 13%,transparent);color:var(--blue)}" +
      ".ts-flag--warn{background:color-mix(in srgb,#b7791f 15%,transparent);color:#b7791f}" +
      ".ts-flag--bad{background:color-mix(in srgb,var(--accent) 13%,transparent);color:var(--accent)}" +
      ".ts-controls{grid-template-columns:1fr 1fr}" +
      "@media(max-width:560px){.ts-controls{grid-template-columns:1fr}" +
      ".ts-controls .seg--demo button{padding:6px 8px;font-size:11px}" +
      ".ts-doc{padding:15px 16px 12px}.ts-row__role{display:none}" +
      ".ts-row__meta{width:50px}.ts-row{padding:8px 0}}";
    document.head.appendChild(s);
  }

  window.RUIDemo.register("type-scale", {
    build: function (body) {
      injectStyle();

      var state = { t: 0, ratio: 1.25, base: 16 };
      var wrap = K.el("div", { class: "ts-wrap" });
      var controls = K.el("div", { class: "controls ts-controls" });
      var stage = K.stage("demo__stage--plain");
      var verdict = K.el("div", { class: "ts-verdict" });

      var doc = K.el("div", { class: "ts-doc" });
      doc.innerHTML = '<div class="ts-doc__top"><span>字号阶梯 · 5 级</span>' +
        '<b data-ts="top">基准 16px · ×1.25</b></div>';
      var top = doc.querySelector('[data-ts="top"]');
      var refs = [];

      ROWS.forEach(function (row) {
        var text = K.el("span", { class: "ts-row__text", text: row.text });
        text.style.fontWeight = String(row.weight);
        var px = K.el("b", { text: "16px" });
        var ratio = K.el("i", { text: "×1.00" });
        var meta = K.el("span", { class: "ts-row__meta" }, [px, ratio]);
        var line = K.el("div", { class: "ts-row" }, [
          K.el("span", { class: "ts-row__role", text: row.role }),
          text,
          meta
        ]);
        doc.appendChild(line);
        refs.push({ text: text, px: px, ratio: ratio });
      });

      var ladder = K.range({
        label: "阶梯化",
        min: 0, max: 100, step: 1, value: 0,
        format: function (v) { return v === 0 ? "随手" : v === 100 ? "阶梯" : v + "%"; },
        onInput: function (v) { state.t = v / 100; render(); }
      });
      var ratioSeg = K.seg({
        label: "比例",
        options: [
          { value: 1.125, label: "1.125 · 紧" },
          { value: 1.25, label: "1.25 · 常用" },
          { value: 1.333, label: "1.333 · 松" }
        ],
        value: 1.25,
        onChange: function (v) { state.ratio = Number(v); render(); }
      });
      var base = K.range({
        label: "基准字号",
        min: 14, max: 20, step: 1, value: 16,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.base = v; render(); }
      });

      ladder.el.style.gridColumn = "1 / -1";
      controls.appendChild(ladder.el);
      controls.appendChild(ratioSeg.el);
      controls.appendChild(base.el);
      stage.appendChild(doc);
      wrap.appendChild(controls);
      wrap.appendChild(stage);
      wrap.appendChild(verdict);
      body.appendChild(wrap);

      function render() {
        var sizes = ROWS.map(function (row) {
          var arb = state.base * row.arb;
          var sc = state.base * Math.pow(state.ratio, row.step);
          return Math.round(K.lerp(arb, sc, state.t));
        });
        var minR = 99, maxR = 0;
        for (var i = 0; i < sizes.length; i++) {
          refs[i].text.style.fontSize = sizes[i] + "px";
          refs[i].px.textContent = sizes[i] + "px";
          if (i < sizes.length - 1) {
            var r = sizes[i] / sizes[i + 1];
            if (r < minR) minR = r;
            if (r > maxR) maxR = r;
            refs[i].ratio.textContent = "×" + r.toFixed(2);
            refs[i].ratio.className = r < 1.1 ? "is-bad" : r < 1.17 ? "is-warn" : "is-good";
          } else {
            refs[i].ratio.textContent = "";
            refs[i].ratio.className = "";
          }
        }
        top.textContent = "基准 " + state.base + "px · ×" + state.ratio;

        var tone, flag, msg;
        if (state.t < 0.15) {
          tone = "bad"; flag = "随手挑";
          msg = "相邻比例从 <em>×" + minR.toFixed(2) + "</em> 到 <em>×" + maxR.toFixed(2) +
            "</em>：有的字号只差 1px，标题和正文挤在一起，视线排不出先后。";
        } else if (state.t < 0.85) {
          tone = "warn"; flag = "过渡中";
          msg = "阶梯正在把字号拉成固定比例——看右侧的比例值逐渐靠拢。";
        } else if (state.ratio === 1.125) {
          tone = "warn"; flag = "×1.125 · 偏挤";
          msg = "每级只差 12%，层级偏弱。适合信息密度极高的界面，但很难只靠字号撑起主次。";
        } else if (state.ratio === 1.333) {
          tone = "ok"; flag = "×1.333 · 跨度大";
          msg = "每级差 33%，适合文章式版面；界面里 1.25 更常用，因为还塞得下中间层级。";
        } else {
          tone = "ok"; flag = "×1.25 · 常用";
          msg = "每级稳定相差 25%：标题、正文、辅助文字一眼分层，也不会大到放不下中间尺寸。";
        }
        verdict.innerHTML = '<span class="ts-flag ts-flag--' + tone + '">' + flag +
          '</span><span>' + msg + "</span>";
      }

      render();
    }
  });
})();
