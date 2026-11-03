/* polish.js — 第 8 章：同一张卡片，逐项收尾打磨 */
(function () {
  "use strict";
  var K = window.RUIDemo.kit;
  var STYLE_ID = "pl-style";
  var TOGGLES = ["去边框改阴影", "统一间距", "对齐基线", "限制颜色", "突出主按钮", "加空状态"];
  var CARD =
    '<div class="pl-head">' +
      '<span class="pl-ava">项</span>' +
      '<div class="pl-headtext"><div class="pl-title">新建项目</div><div class="pl-sub">把想法放进一个地方</div></div>' +
      '<span class="pl-tag">草稿</span>' +
    '</div>' +
    '<div class="pl-field"><label class="pl-label">项目名称</label><input class="pl-input" value="网站改版" readonly tabindex="-1"></div>' +
    '<div class="pl-field"><label class="pl-label">一句话描述</label><input class="pl-input" value="把首页讲清楚" readonly tabindex="-1"></div>' +
    '<div class="pl-section">' +
      '<div class="pl-sec-title">最近项目</div>' +
      '<div class="pl-empty"><span class="pl-ico"></span><div class="pl-empty-text">还没有项目</div>' +
        '<button type="button" class="pl-cta" tabindex="-1">新建第一个项目</button></div>' +
    '</div>' +
    '<div class="pl-foot"><button type="button" class="pl-cancel" tabindex="-1">取消</button>' +
      '<button type="button" class="pl-save" tabindex="-1">创建项目</button></div>';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent =
      ".pl-stage{padding:28px 20px}" +
      ".pl-controls{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 16px;margin-top:16px}" +
      "@media(max-width:720px){.pl-controls{grid-template-columns:repeat(2,minmax(0,1fr))}}" +
      ".pl-card{max-width:340px;width:100%;padding:10px;border:1px solid #c9c4b8;border-radius:3px;box-shadow:none;background:#fff}" +
      ".pl-head{display:flex;align-items:flex-start;gap:4px;padding:4px;border:1px solid #e3b5c4}" +
      ".pl-ava{flex:none;width:22px;height:22px;border-radius:50%;background:#7b2ff7;color:#fff;font-size:10px;display:grid;place-items:center}" +
      ".pl-headtext{flex:1;min-width:0}" +
      ".pl-title{font-size:15px;font-weight:700;line-height:1.15;color:#7b2ff7}" +
      ".pl-sub{font-size:10px;color:#d6336c;margin-top:1px}" +
      ".pl-tag{flex:none;align-self:flex-start;margin-top:1px;font-size:9px;padding:1px 4px;border:1px solid #b2e0b2;border-radius:2px;background:#e6f7e6;color:#2b8a3e}" +
      ".pl-field{display:flex;align-items:flex-end;gap:4px;margin-top:4px}" +
      ".pl-field+.pl-field{padding-left:8px}" +
      ".pl-label{flex:none;font-size:10px;color:#d6336c;white-space:nowrap}" +
      ".pl-input{flex:1;min-width:0;padding:2px 4px;border:1px solid #d0a0a0;border-radius:1px;background:#fff;color:#1b1b1f;font-size:11px;font-family:inherit}" +
      ".pl-section{margin-top:4px;padding:4px;border:1px solid #e0b060}" +
      ".pl-sec-title{font-size:10px;font-weight:700;color:#e8590c}" +
      ".pl-empty{margin-top:3px;padding:8px 4px;border:1px dashed #b0b0b0;text-align:center}" +
      ".pl-ico{display:block;width:12px;height:12px;margin:0 auto 2px;border:1px solid #999}" +
      ".pl-empty-text{font-size:10px;color:#8a8a93}" +
      ".pl-cta{display:none}" +
      ".pl-foot{display:flex;gap:3px;margin-top:4px}" +
      ".pl-cancel,.pl-save{font-size:11px;padding:3px 6px;border:1px solid #c9c4b8;border-radius:2px;background:#fff;color:#1b1b1f;font-family:inherit;cursor:default}" +
      ".pl-save{font-size:12px;padding:5px 8px;border-color:#b197fc;background:#e9e0ff;color:#5f3dc4}" +
      ".pl-c1{border:0;border-radius:12px;padding:16px;box-shadow:0 1px 2px rgba(0,0,0,.05),0 12px 30px -14px rgba(0,0,0,.22)}" +
      ".pl-c1 .pl-head{border:0;background:#f6f5f1;border-radius:8px;padding:8px}" +
      ".pl-c1 .pl-input{border:0;background:#f4f3ef;border-radius:6px;padding:6px 8px}" +
      ".pl-c1 .pl-section{border:0;padding:0}" +
      ".pl-c1 .pl-empty{border:0;background:#faf9f6;border-radius:8px;padding:14px 8px}" +
      ".pl-c1 .pl-tag{border:0}" +
      ".pl-c1 .pl-cancel,.pl-c1 .pl-save{border:0}" +
      ".pl-c1 .pl-cancel{background:transparent}" +
      ".pl-c2{padding:20px}" +
      ".pl-c2 .pl-head{gap:10px;padding:10px}" +
      ".pl-c2 .pl-field{margin-top:12px}" +
      ".pl-c2 .pl-section{margin-top:16px}" +
      ".pl-c2 .pl-empty{margin-top:8px;padding:16px 8px}" +
      ".pl-c2 .pl-foot{margin-top:18px;gap:8px;justify-content:flex-end}" +
      ".pl-c3 .pl-field{display:block;padding-left:0;margin-top:10px}" +
      ".pl-c3 .pl-field+.pl-field{padding-left:0}" +
      ".pl-c3 .pl-label{display:block;margin-bottom:4px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8a8a93}" +
      ".pl-c3 .pl-input{display:block;width:100%}" +
      ".pl-c3 .pl-head{align-items:flex-start}" +
      ".pl-c3 .pl-sub{margin-top:2px}" +
      ".pl-c3 .pl-foot{align-items:center}" +
      ".pl-c3 .pl-save,.pl-c3 .pl-cancel{height:30px;display:inline-flex;align-items:center;padding-top:0;padding-bottom:0}" +
      ".pl-c4 .pl-title{color:#1b1b1f}.pl-c4 .pl-sub{color:#6b6b74}.pl-c4 .pl-label{color:#6b6b74}" +
      ".pl-c4 .pl-sec-title{color:#1b1b1f}.pl-c4 .pl-empty-text{color:#6b6b74}.pl-c4 .pl-ico{border-color:#b9b4a8}" +
      ".pl-c4 .pl-tag{background:#eef2f7;border-color:transparent;color:#2f5d8a}.pl-c4 .pl-ava{background:#2f5d8a}" +
      ".pl-c5 .pl-save{background:#2f5d8a;border-color:#2f5d8a;color:#fff;font-weight:600;padding:7px 14px;border-radius:8px}" +
      ".pl-c5 .pl-cancel{background:transparent;border-color:transparent;color:#6b6b74}" +
      ".pl-c6 .pl-empty{display:flex;flex-direction:column;align-items:center;border:0;background:#f7f9fc;border-radius:10px;padding:20px 10px}" +
      ".pl-c6 .pl-ico{width:28px;height:28px;border:0;border-radius:50%;background:#e3edf7;position:relative;margin:0 auto 8px}" +
      '.pl-c6 .pl-ico::after{content:"+";position:absolute;inset:0;display:grid;place-items:center;color:#2f5d8a;font-size:16px;font-weight:700}' +
      ".pl-c6 .pl-empty-text{font-size:12px;color:#4a4a52;margin-bottom:8px}" +
      ".pl-c6 .pl-cta{display:inline-flex;align-items:center;padding:5px 10px;border:1px solid #dcdce2;border-radius:6px;background:#fff;color:#2f5d8a;font-size:11px;font-weight:600;font-family:inherit;cursor:default}" +
      ".pl-card.pl-done{box-shadow:inset 0 3px 0 #2f5d8a,0 1px 2px rgba(0,0,0,.05),0 16px 36px -16px rgba(0,0,0,.25)}" +
      ".pl-progress{margin-top:16px;display:grid;gap:7px}" +
      ".pl-bar{height:8px;border-radius:4px;background:var(--rule);overflow:hidden}" +
      ".pl-bar i{display:block;height:100%;width:0;background:var(--blue);border-radius:4px;transition:width .2s}" +
      ".pl-meta{display:flex;align-items:baseline;gap:8px;font-size:12px;color:var(--ink-3)}" +
      ".pl-count{font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--ink);font-variant-numeric:tabular-nums}" +
      ".pl-pct{margin-left:auto;font-family:var(--font-mono);font-size:12px;color:var(--ink-2);font-variant-numeric:tabular-nums}";
    document.head.appendChild(s);
  }

  function build(body) {
    injectStyle();
    var on = [false, false, false, false, false, false];
    var controls = K.el("div", { class: "pl-controls" });
    TOGGLES.forEach(function (label, i) {
      controls.appendChild(K.toggle({
        label: label,
        checked: false,
        onChange: function (v) { on[i] = v; render(); }
      }).el);
    });

    var stage = K.stage("demo__stage--plain pl-stage");
    var card = K.el("div", { class: "ui-card pl-card" });
    card.innerHTML = CARD;
    stage.appendChild(card);

    var fill = K.el("i");
    var bar = K.el("div", { class: "pl-bar" }, [fill]);
    var count = K.el("b", { class: "pl-count" });
    var pct = K.el("em", { class: "pl-pct" });
    var meta = K.el("div", { class: "pl-meta" }, [count, K.el("span", { text: "项细节已修复" }), pct]);
    var note = K.note("");
    var progress = K.el("div", { class: "pl-progress" }, [bar, meta]);
    body.appendChild(K.el("div", { class: "pl-wrap" }, [controls, stage, progress, note]));

    function render() {
      var n = 0;
      var miss = [];
      on.forEach(function (v, i) { if (v) n++; else miss.push(TOGGLES[i]); });
      card.className = "ui-card pl-card" + on.map(function (v, i) { return v ? " pl-c" + (i + 1) : ""; }).join("") + (n === 6 ? " pl-done" : "");
      fill.style.width = (n / 6 * 100) + "%";
      count.textContent = n + "/6";
      pct.textContent = Math.round(n / 6 * 100) + "%";
      if (n === 6) {
        note.innerHTML = "收尾完成：功能一个没加，卡片却像换了一个产品。<strong>边框、间距、颜色、强调、空状态</strong>——专业感就是这些细节的总和。";
      } else {
        note.innerHTML = "还差 <strong>" + miss.length + " 项</strong>：" + miss.join("、") + "。每修一项，界面就少一点「各说各话」。";
      }
    }
    render();
  }

  window.RUIDemo.register("polish", { build: build });
})();
