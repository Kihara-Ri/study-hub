/* ==========================================================================
   hierarchy.js — 第 2 章 · 层级三要素（尺寸 / 字重 / 颜色）
   同一张卡片，三个变量一起决定视线先落在哪。
   ========================================================================== */
(function () {
  "use strict";

  var K = window.RUIDemo.kit;

  var STYLE_ID = "hg-style";
  var CSS = [
    ".hg-wrap{display:grid;gap:14px;width:100%}",
    ".hg-tools{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}",
    ".hg-tools .ctl{display:flex;align-items:center;gap:10px;margin:0}",
    ".hg-restore{padding:6px 13px;border:1px solid var(--rule);border-radius:999px;background:transparent;font-size:11.5px;color:var(--ink-2);cursor:pointer;transition:border-color .15s,color .15s,background .15s}",
    ".hg-restore:hover{border-color:var(--ink-2);color:var(--ink);background:var(--surface)}",
    ".hg-restore:focus-visible{outline:2px solid var(--accent);outline-offset:2px}",
    ".hg-stage{padding:24px 16px}",
    ".hg-card{width:100%;max-width:360px;padding:20px;background:#fff;border:1px solid #e8e8ec;border-radius:12px;box-shadow:0 1px 2px rgba(20,20,30,.05),0 16px 34px -22px rgba(20,20,30,.35);color:#1b1b1f;font-family:var(--font-ui);transition:filter .2s ease}",
    ".hg-stage.hg-squint .hg-card{filter:blur(3.4px) saturate(.92)}",
    ".hg-top{display:flex;align-items:center;gap:10px}",
    ".hg-avatar{width:32px;height:32px;border-radius:50%;background:#e8e8ec;display:grid;place-items:center;font-size:11px;font-weight:700;color:#6b6b74;flex:none;letter-spacing:.02em}",
    ".hg-who{display:grid;gap:1px;min-width:0}",
    ".hg-name{font-size:12.5px;font-weight:700;color:#4a4a52;line-height:1.3}",
    ".hg-meta{font-size:11px;line-height:1.35;transition:color .1s}",
    ".hg-tag{margin-left:auto;padding:2px 8px;border-radius:999px;background:#eef2f7;color:#2f5d8a;font-size:10px;font-weight:700;white-space:nowrap;flex:none}",
    ".hg-title{margin:15px 0 7px;line-height:1.24;letter-spacing:-.015em;transition:color .1s}",
    ".hg-copy{margin:0;font-size:13px;line-height:1.65;transition:color .1s}",
    ".hg-actions{display:flex;align-items:center;gap:9px;margin-top:15px}",
    ".hg-btn{flex:1;text-align:center;padding:9px 12px;border-radius:8px;font-size:12.5px;font-weight:600;border:1px solid #dcdce2;color:#4a4a52;background:#fff}",
    ".hg-btn--primary{background:#2f5d8a;border-color:#2f5d8a;color:#fff}",
    ".hg-metrics{display:flex;flex-wrap:wrap;gap:6px}",
    ".hg-chip{padding:3px 8px;border:1px solid var(--rule);border-radius:999px;background:var(--surface);font-family:var(--font-mono);font-size:10.5px;color:var(--ink-3);font-variant-numeric:tabular-nums}",
    ".hg-chip b{color:var(--ink);font-weight:700}",
    ".hg-verdict{margin:8px 0 0;font-size:12px;line-height:1.7;color:var(--ink-2);min-height:2.8em}",
    ".hg-verdict b{color:var(--ink)}",
    "@media (max-width:560px){.hg-card{padding:16px}.hg-stage{padding:18px 12px}}"
  ].join("");

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* 卡片固定白底，所以对比度对着白色算 */
  var WHITE = [255, 255, 255];
  var INK = [22, 22, 26];
  var BODY = [74, 74, 82];
  var MUTED = [138, 138, 147];
  var SOFT = [184, 184, 192];

  var DEF = { size: 22, weight: 700, contrast: 82 };

  function mix(a, b, t) {
    return [
      Math.round(K.lerp(a[0], b[0], t)),
      Math.round(K.lerp(a[1], b[1], t)),
      Math.round(K.lerp(a[2], b[2], t))
    ];
  }

  window.RUIDemo.register("hierarchy", {
    build: function (body) {
      injectStyle();

      var state = { size: DEF.size, weight: DEF.weight, contrast: DEF.contrast };

      /* ---------------- controls ---------------- */
      var sizeCtl = K.range({
        label: "标题字号", min: 14, max: 34, step: 1, value: state.size,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.size = v; render(); }
      });
      var weightCtl = K.range({
        label: "标题字重", min: 400, max: 800, step: 100, value: state.weight,
        format: function (v) { return String(v); },
        onInput: function (v) { state.weight = v; render(); }
      });
      var contrastCtl = K.range({
        label: "层级对比", min: 0, max: 100, step: 1, value: state.contrast,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.contrast = v; render(); }
      });

      var controls = K.el("div", { class: "controls" }, [
        sizeCtl.el, weightCtl.el, contrastCtl.el
      ]);

      /* ---------------- squint + restore ---------------- */
      var squint = K.toggle({
        label: "眯眼测试",
        checked: false,
        onChange: function (on) {
          stage.classList.toggle("hg-squint", on);
          render();
        }
      });
      var restore = K.el("button", {
        class: "hg-restore", type: "button", text: "恢复推荐值",
        onclick: function () {
          state.size = DEF.size;
          state.weight = DEF.weight;
          state.contrast = DEF.contrast;
          sizeCtl.set(DEF.size);
          weightCtl.set(DEF.weight);
          contrastCtl.set(DEF.contrast);
          squint.input.checked = false;
          stage.classList.remove("hg-squint");
          render();
        }
      });
      var tools = K.el("div", { class: "hg-tools" }, [squint.el, restore]);

      /* ---------------- stage ---------------- */
      var stage = K.stage("hg-stage");
      var card = K.el("div", {
        class: "hg-card",
        html:
          '<div class="hg-top">' +
            '<span class="hg-avatar">LM</span>' +
            '<span class="hg-who">' +
              '<span class="hg-name">林默</span>' +
              '<span class="hg-meta" data-hg="meta"></span>' +
            '</span>' +
            '<span class="hg-tag">设计随笔</span>' +
          '</div>' +
          '<h3 class="hg-title" data-hg="title">把复杂的事情做简单</h3>' +
          '<p class="hg-copy" data-hg="copy">层级不是把字做大，而是决定读者先看什么。先定重点，再处理其它。</p>' +
          '<div class="hg-actions">' +
            '<span class="hg-btn hg-btn--primary">阅读全文</span>' +
            '<span class="hg-btn">收藏</span>' +
          '</div>'
      });
      stage.appendChild(card);

      var titleEl = card.querySelector('[data-hg="title"]');
      var metaEl = card.querySelector('[data-hg="meta"]');
      var copyEl = card.querySelector('[data-hg="copy"]');

      /* ---------------- readout ---------------- */
      var chipTitle = K.el("span", { class: "hg-chip" });
      var chipMeta = K.el("span", { class: "hg-chip" });
      var chipSize = K.el("span", { class: "hg-chip" });
      var chipWeight = K.el("span", { class: "hg-chip" });
      var metrics = K.el("div", { class: "hg-metrics" }, [chipSize, chipWeight, chipTitle, chipMeta]);
      var verdict = K.el("p", { class: "hg-verdict", "aria-live": "polite" });

      /* ---------------- render ---------------- */
      function verdictText() {
        var c = state.contrast / 100;
        var s = state.size;
        var w = state.weight;
        if (c <= 0.3) {
          return "层级被抹平了：标题、正文、辅助文字几乎同一个颜色，视线只能落到<b>蓝色按钮</b>上。";
        }
        if (s >= 30) {
          return "字号拉到 " + s + "px，卡片开始挤。把字号收回来，用<b>字重或颜色</b>补上同样的层级。";
        }
        if (s <= 18 && w >= 700 && c >= 0.6) {
          return "标题只有 " + s + "px，但字重和颜色把它撑住了——<b>小字号也可以当第一落点</b>。";
        }
        if (w <= 500) {
          return "字重偏轻，标题只靠颜色和字号撑着。常规字重留给正文，标题再重一档更稳。";
        }
        if (s <= 26 && w >= 600 && c >= 0.55) {
          return "三要素配合到位：视线先落在标题，再滑到辅助信息，<b>不靠大字号也成立</b>。";
        }
        return "层级还在，但还能更省：把字号收一点，用<b>字重或颜色</b>补回来。";
      }

      function render() {
        var t = state.contrast / 100;
        var titleRgb = mix(MUTED, INK, t);
        var bodyRgb = mix(MUTED, BODY, t);
        var metaRgb = mix(MUTED, SOFT, t);

        titleEl.style.fontSize = state.size + "px";
        titleEl.style.fontWeight = String(state.weight);
        titleEl.style.color = K.rgbCss(titleRgb);
        copyEl.style.color = K.rgbCss(bodyRgb);
        metaEl.style.color = K.rgbCss(metaRgb);

        chipSize.innerHTML = "字号 <b>" + state.size + "</b>px";
        chipWeight.innerHTML = "字重 <b>" + state.weight + "</b>";
        chipTitle.innerHTML = "标题 <b>" + K.contrast(titleRgb, WHITE).toFixed(1) + ":1</b>";
        chipMeta.innerHTML = "辅助 <b>" + K.contrast(metaRgb, WHITE).toFixed(1) + ":1</b>";

        var text = verdictText();
        if (squint.input.checked) text += " 眯着眼看，还能分出主次吗？";
        verdict.innerHTML = text;
      }

      metaEl.textContent = "产品设计师 · 12 分钟前";
      render();

      var wrap = K.el("div", { class: "hg-wrap" }, [
        controls,
        tools,
        stage,
        metrics,
        verdict,
        K.note("三个变量都能建立层级。只靠字号，次要内容会被挤到很小；<strong>字重和颜色通常更省空间</strong>。")
      ]);
      body.appendChild(wrap);
    }
  });
})();
