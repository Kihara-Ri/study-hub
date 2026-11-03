/* ==========================================================================
   emphasis.js — 第 2 章 · 强调与弱化
   突出不了一个东西时，先把它周围的东西压下去。
   ========================================================================== */
(function () {
  "use strict";

  var K = window.RUIDemo.kit;

  var STYLE_ID = "em-style";
  var CSS = [
    ".em-wrap{display:grid;gap:14px;width:100%}",
    ".em-controls{gap:10px 24px}",
    ".em-stage{padding:24px 16px}",
    ".em-card{width:100%;max-width:380px;padding:18px;background:#fff;border:1px solid #e8e8ec;border-radius:12px;box-shadow:0 1px 2px rgba(20,20,30,.05),0 16px 34px -22px rgba(20,20,30,.35);color:#1b1b1f;font-family:var(--font-ui)}",
    ".em-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:4px}",
    ".em-title{font-size:15px;font-weight:700;letter-spacing:-.01em;line-height:1.35}",
    ".em-sub{margin-top:2px;font-size:11.5px;line-height:1.4;color:#8a8a93;transition:color .18s}",
    ".em-tag{padding:2px 8px;border-radius:999px;background:#eef2f7;color:#2f5d8a;font-size:10px;font-weight:700;white-space:nowrap;flex:none;transition:background .18s,color .18s}",
    ".em-rows{display:grid}",
    ".em-row{display:flex;align-items:center;gap:11px;padding:11px 0;border-bottom:1px solid #ececf0;transition:border-color .18s}",
    ".em-row:last-child{border-bottom-color:transparent}",
    ".em-icon{width:32px;height:32px;border-radius:8px;display:grid;place-items:center;font-size:12.5px;font-weight:700;flex:none;transition:background .18s,color .18s}",
    ".em-icon--a{background:#eef2f7;color:#2f5d8a}",
    ".em-icon--b{background:#fdf2e4;color:#a86a1c}",
    ".em-icon--c{background:#eaf4ee;color:#2b7a52}",
    ".em-rowtext{min-width:0;flex:1;display:grid;gap:1px}",
    ".em-label{font-size:13px;font-weight:600;line-height:1.35;color:#1b1b1f;transition:color .18s,font-size .18s}",
    ".em-desc{font-size:11.5px;line-height:1.4;color:#8a8a93;transition:color .18s,font-size .18s}",
    ".em-switch{position:relative;width:34px;height:19px;border-radius:999px;background:#2f5d8a;flex:none;transition:background .18s}",
    ".em-switch i{position:absolute;top:2.5px;left:17px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.2);transition:left .18s}",
    ".em-switch--off{background:#d6d6dc}",
    ".em-switch--off i{left:2.5px}",
    ".em-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding-top:14px}",
    ".em-btn{padding:9px 14px;border-radius:8px;font-size:12.5px;font-weight:600;border:1px solid #dcdce2;color:#4a4a52;background:#fff;transition:background .18s,color .18s,border-color .18s,box-shadow .18s}",
    ".em-card--strong .em-btn--primary{background:#2f5d8a;border-color:#2f5d8a;color:#fff;box-shadow:0 8px 16px -10px rgba(47,93,138,.85)}",
    ".em-card--muted .em-row{border-bottom-color:transparent}",
    ".em-card--muted .em-icon{background:#f2f2f4;color:#a4a4ac}",
    ".em-card--muted .em-label{color:#6b6b74;font-size:12.5px}",
    ".em-card--muted .em-desc{color:#b0b0b8;font-size:11px}",
    ".em-card--muted .em-sub{color:#b0b0b8}",
    ".em-card--muted .em-tag{background:#f2f2f4;color:#a4a4ac}",
    ".em-card--muted .em-switch{background:#dcdce2}",
    ".em-readout{display:flex;flex-wrap:wrap;gap:6px}",
    ".em-badge{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border:1px solid var(--rule);border-radius:999px;background:var(--surface);font-size:10.5px;color:var(--ink-3);transition:border-color .15s,background .15s}",
    ".em-badge b{font-family:var(--font-mono);font-size:10.5px;font-weight:700;color:var(--ink-2)}",
    ".em-badge--on{border-color:color-mix(in srgb,var(--blue) 40%,transparent);background:color-mix(in srgb,var(--blue) 10%,transparent)}",
    ".em-badge--on b{color:var(--blue)}",
    ".em-verdict{margin:8px 0 0;font-size:12px;line-height:1.7;color:var(--ink-2);min-height:2.8em}",
    ".em-verdict b{color:var(--ink)}",
    "@media (max-width:560px){.em-card{padding:15px}.em-stage{padding:18px 12px}}"
  ].join("");

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function rowsHtml() {
    var rows = [
      ["a", "邮", "邮件通知", "每天一封摘要，早上 9 点发出", true],
      ["b", "铃", "桌面提醒", "只在重要事件时弹出", true],
      ["c", "报", "每周报告", "周一上午 9 点汇总", false]
    ];
    return rows.map(function (r) {
      return '<div class="em-row">' +
        '<span class="em-icon em-icon--' + r[0] + '">' + r[1] + '</span>' +
        '<span class="em-rowtext">' +
          '<span class="em-label">' + r[2] + '</span>' +
          '<span class="em-desc">' + r[3] + '</span>' +
        '</span>' +
        '<span class="em-switch' + (r[4] ? "" : " em-switch--off") + '"><i></i></span>' +
      '</div>';
    }).join("");
  }

  window.RUIDemo.register("emphasis", {
    build: function (body) {
      injectStyle();

      var state = { strong: true, muted: false };

      var strongCtl = K.toggle({
        label: "强调主操作",
        checked: true,
        hint: "把主按钮填成实心",
        onChange: function (on) { state.strong = on; render(); }
      });
      var mutedCtl = K.toggle({
        label: "弱化次要信息",
        checked: false,
        hint: "去边框 · 降饱和 · 变灰 · 缩小字号",
        onChange: function (on) { state.muted = on; render(); }
      });
      var controls = K.el("div", { class: "controls controls--row em-controls" }, [strongCtl.el, mutedCtl.el]);

      var stage = K.stage("em-stage");
      var card = K.el("div", {
        class: "em-card",
        html:
          '<div class="em-head">' +
            '<div>' +
              '<div class="em-title">账户设置</div>' +
              '<div class="em-sub">通知与提醒</div>' +
            '</div>' +
            '<span class="em-tag">已同步</span>' +
          '</div>' +
          '<div class="em-rows">' + rowsHtml() + '</div>' +
          '<div class="em-actions">' +
            '<span class="em-btn">取消</span>' +
            '<span class="em-btn em-btn--primary">保存修改</span>' +
          '</div>'
      });
      stage.appendChild(card);

      var badgeStrong = K.el("span", { class: "em-badge" });
      var badgeMuted = K.el("span", { class: "em-badge" });
      var readout = K.el("div", { class: "em-readout" }, [badgeStrong, badgeMuted]);
      var verdict = K.el("p", { class: "em-verdict", "aria-live": "polite" });

      function verdictText() {
        if (state.strong && state.muted) {
          return "周围退后，按钮浮出来。<b>加法 + 减法一起用</b>，主操作才是第一落点。";
        }
        if (state.strong) {
          return "按钮已经点亮，但周围还是热闹——只做加法，<b>视线落点不稳</b>。";
        }
        if (state.muted) {
          return "周围安静下来了，可按钮本身没接住视线。<b>只做减法也不够</b>。";
        }
        return "每个元素分量都差不多：图标、开关、分隔线都在抢视线，主操作排不到第一。";
      }

      function render() {
        card.classList.toggle("em-card--strong", state.strong);
        card.classList.toggle("em-card--muted", state.muted);

        badgeStrong.className = "em-badge" + (state.strong ? " em-badge--on" : "");
        badgeStrong.innerHTML = "强调主操作 <b>" + (state.strong ? "开" : "关") + "</b>";
        badgeMuted.className = "em-badge" + (state.muted ? " em-badge--on" : "");
        badgeMuted.innerHTML = "弱化次要信息 <b>" + (state.muted ? "开" : "关") + "</b>";
        verdict.innerHTML = verdictText();
      }

      render();

      var wrap = K.el("div", { class: "em-wrap" }, [
        controls,
        stage,
        readout,
        verdict,
        K.note("想突出一个东西，除了把它变亮，还可以<b>把周围变暗</b>。只做加法容易失效——因为周围也在加法。")
      ]);
      body.appendChild(wrap);
    }
  });
})();
