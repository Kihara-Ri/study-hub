/* ==========================================================================
   layout.js — 第 3 章 · 布局与断点
   同一个产品页，在手机 / 平板 / 桌面之间切换；内容要不要拉满，是可以选的。
   ========================================================================== */
(function () {
  "use strict";

  var K = window.RUIDemo.kit;

  var STYLE_ID = "ly-style";
  var CSS = [
    ".ly-wrap{display:grid;gap:14px;width:100%}",
    ".ly-controls{display:grid;gap:10px 24px;grid-template-columns:auto minmax(0,1fr)}",
    ".ly-controls > .ctl:last-child{grid-column:1/-1}",
    ".ly-controls .seg{justify-self:start}",
    ".ly-stage{padding:20px 16px;display:block}",
    ".ly-avail{width:100%}",
    ".ly-frame{width:100%;margin:0 auto;border:1px solid var(--rule-strong);border-radius:10px;overflow:hidden;background:#fff;box-shadow:0 2px 6px rgba(20,20,30,.06),0 24px 48px -28px rgba(20,20,30,.4);transition:max-width .28s var(--ease,ease)}",
    ".ly--mobile{max-width:390px}",
    ".ly--tablet{max-width:720px}",
    ".ly--desktop{max-width:100%}",
    ".ly-chrome{display:flex;align-items:center;gap:5px;padding:8px 11px;background:#f3f3f5;border-bottom:1px solid #e8e8ec}",
    ".ly-chrome i{width:8px;height:8px;border-radius:50%;background:#dcdce1;flex:none}",
    ".ly-url{margin-left:8px;padding:2px 9px;border-radius:999px;background:#fff;border:1px solid #e8e8ec;font-family:var(--font-mono);font-size:9px;color:#8a8a93;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".ly-w{margin-left:auto;font-family:var(--font-mono);font-size:9px;color:#8a8a93;flex:none}",
    ".ly-page{background:#fff;color:#1b1b1f;font-family:var(--font-ui)}",
    ".ly-nav{display:flex;align-items:center;gap:18px;padding:12px 18px;border-bottom:1px solid #f0f0f2}",
    ".ly-logo{font-size:14px;font-weight:800;letter-spacing:-.02em;flex:none}",
    ".ly-links{display:flex;align-items:center;gap:16px;margin-left:4px}",
    ".ly-link{font-size:11px;color:#6b6b74;white-space:nowrap}",
    ".ly-cta{margin-left:auto;padding:5px 12px;border-radius:6px;background:#2f5d8a;color:#fff;font-size:10.5px;font-weight:600;white-space:nowrap;flex:none}",
    ".ly-burger{display:none;margin-left:auto;width:26px;height:22px;border:1px solid #dcdce2;border-radius:5px;flex-direction:column;align-items:center;justify-content:center;gap:3px;flex:none}",
    ".ly-burger i{display:block;width:12px;height:1.5px;background:#6b6b74}",
    ".ly-container{margin:0 auto;padding:22px 18px}",
    ".ly-kicker{font-size:8.5px;font-weight:700;letter-spacing:.18em;color:#8a8a93}",
    ".ly-h1{margin:6px 0;font-size:34px;line-height:1.14;letter-spacing:-.03em;font-weight:800}",
    ".ly-lede{margin:0;font-size:11.5px;line-height:1.6;color:#6b6b74;max-width:42ch}",
    ".ly-actions{display:flex;gap:8px;margin-top:12px}",
    ".ly-btn{padding:7px 14px;border-radius:7px;font-size:11px;font-weight:600;border:1px solid #dcdce2;color:#4a4a52}",
    ".ly-btn--primary{background:#2f5d8a;border-color:#2f5d8a;color:#fff}",
    ".ly-grid{display:grid;grid-template-columns:1fr;gap:var(--ly-gap,24px);margin-top:20px}",
    ".ly-card{border:1px solid #ececf0;border-radius:9px;padding:13px;background:#fff;min-width:0}",
    ".ly-cardtag{display:inline-block;font-size:8px;font-weight:700;letter-spacing:.12em;color:#2f5d8a;background:#eef2f7;padding:2px 6px;border-radius:4px}",
    ".ly-card h4{margin:8px 0 4px;font-size:12.5px;font-weight:700;letter-spacing:-.01em}",
    ".ly-card p{margin:0;font-size:10.5px;line-height:1.55;color:#8a8a93}",
    ".ly-foot{display:flex;justify-content:space-between;gap:8px;padding:12px 18px;border-top:1px solid #f0f0f2;font-size:9px;color:#b0b0b8}",
    ".ly--mobile .ly-links,.ly--mobile .ly-cta{display:none}",
    ".ly--mobile .ly-burger{display:flex}",
    ".ly--mobile .ly-h1{font-size:24px}",
    ".ly--mobile .ly-nav{padding:11px 14px}",
    ".ly--mobile .ly-container{padding:18px 14px}",
    ".ly--tablet .ly-links .ly-link:nth-child(n+3){display:none}",
    ".ly--tablet .ly-h1{font-size:30px}",
    ".ly--tablet .ly-grid{grid-template-columns:repeat(2,minmax(0,1fr))}",
    ".ly--desktop .ly-grid{grid-template-columns:repeat(3,minmax(0,1fr))}",
    ".ly-stage.ly-compact .ly--desktop .ly-links{gap:8px}",
    ".ly-stage.ly-compact .ly--desktop .ly-links .ly-link:nth-child(n+3){display:none}",
    ".ly-stage.ly-compact .ly--desktop .ly-links .ly-link{font-size:9.5px}",
    ".ly-stage.ly-compact .ly--desktop .ly-cta{padding:4px 8px;font-size:9.5px}",
    ".ly-stage.ly-compact .ly--desktop .ly-h1{font-size:22px}",
    ".ly-stage.ly-compact .ly--desktop .ly-grid{gap:8px}",
    ".ly-stage.ly-compact .ly--desktop .ly-card{padding:9px}",
    ".ly-stage.ly-compact .ly--desktop .ly-card p{display:none}",
    ".ly-stage.ly-compact .ly--tablet .ly-grid{gap:10px}",
    ".ly-stage.ly-compact .ly--tablet .ly-card p{font-size:9.5px}",
    ".ly-readout{display:flex;flex-wrap:wrap;gap:6px;align-items:center}",
    ".ly-chip{padding:3px 8px;border:1px solid var(--rule);border-radius:999px;background:var(--surface);font-family:var(--font-mono);font-size:10.5px;color:var(--ink-2);font-variant-numeric:tabular-nums}",
    ".ly-chip--accent{border-color:color-mix(in srgb,var(--accent) 55%,transparent);color:var(--accent);border-style:dashed}",
    ".ly-verdict{margin:8px 0 0;font-size:12px;line-height:1.7;color:var(--ink-2);min-height:2.8em}",
    ".ly-verdict b{color:var(--ink)}",
    "@media (max-width:560px){.ly-stage{padding:16px 10px}.ly-chrome{padding:7px 9px}}",
    "@media (max-width:700px){.ly-controls{grid-template-columns:1fr}.ly-controls > .ctl:first-child{grid-template-columns:1fr;gap:6px}.ly-controls > .ctl:first-child .seg{justify-self:stretch}}"
  ].join("");

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var CARDS = [
    ["01", "协作画布", "设计、评论、版本都在同一个画布里。"],
    ["02", "自动发布", "改完即上线，不用再走一遍流程。"],
    ["03", "数据回看", "每个版本的效果都留痕。"]
  ];

  function pageHtml() {
    var cards = CARDS.map(function (c) {
      return '<article class="ly-card">' +
        '<span class="ly-cardtag">' + c[0] + '</span>' +
        '<h4>' + c[1] + '</h4>' +
        '<p>' + c[2] + '</p>' +
      '</article>';
    }).join("");
    return '<div class="ly-chrome"><i></i><i></i><i></i>' +
        '<span class="ly-url">nimbus.app / product</span>' +
        '<span class="ly-w" data-ly="w">1024px+</span></div>' +
      '<div class="ly-page">' +
        '<div class="ly-nav">' +
          '<span class="ly-logo">Nimbus</span>' +
          '<span class="ly-links">' +
            '<span class="ly-link">产品</span>' +
            '<span class="ly-link">定价</span>' +
            '<span class="ly-link">文档</span>' +
            '<span class="ly-link">博客</span>' +
          '</span>' +
          '<span class="ly-cta">免费试用</span>' +
          '<span class="ly-burger"><i></i><i></i><i></i></span>' +
        '</div>' +
        '<div class="ly-container">' +
          '<div class="ly-kicker">PRODUCT</div>' +
          '<h2 class="ly-h1">把想法更快地发出去</h2>' +
          '<p class="ly-lede">从草稿到上线，一个工作台完成全部协作。</p>' +
          '<div class="ly-actions"><span class="ly-btn ly-btn--primary">开始使用</span><span class="ly-btn">看演示</span></div>' +
          '<div class="ly-grid">' + cards + '</div>' +
        '</div>' +
        '<div class="ly-foot"><span>© 2026 Nimbus</span><span>隐私 · 条款</span></div>' +
      '</div>';
  }

  var cleanup = null;

  window.RUIDemo.register("layout", {
    build: function (body) {
      injectStyle();

      var state = { mode: "desktop", gap: 24, limit: true };

      var modeCtl = K.seg({
        label: "断点",
        options: [
          { value: "mobile", label: "手机 390" },
          { value: "tablet", label: "平板 768" },
          { value: "desktop", label: "桌面 1024+" }
        ],
        value: "desktop",
        onChange: function (v) { state.mode = v; render(); }
      });
      var gapCtl = K.range({
        label: "栏距",
        min: 16, max: 40, step: 4, value: state.gap,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.gap = v; render(); }
      });
      var limitCtl = K.toggle({
        label: "内容限宽",
        checked: true,
        hint: "只在桌面宽度下生效",
        onChange: function (on) { state.limit = on; render(); }
      });
      var controls = K.el("div", { class: "controls ly-controls" }, [modeCtl.el, gapCtl.el, limitCtl.el]);

      var stage = K.stage("ly-stage");
      var availEl = K.el("div", { class: "ly-avail" });
      var frame = K.el("div", { class: "ly-frame ly--desktop", html: pageHtml() });
      availEl.appendChild(frame);
      stage.appendChild(availEl);

      var widthEl = frame.querySelector('[data-ly="w"]');
      var container = frame.querySelector(".ly-container");

      var badge = K.el("span", { class: "ly-chip" });
      var chipContent = K.el("span", { class: "ly-chip" });
      var chipSide = K.el("span", { class: "ly-chip" });
      var chipGap = K.el("span", { class: "ly-chip" });
      var readout = K.el("div", { class: "ly-readout" }, [badge, chipContent, chipSide, chipGap]);
      var verdict = K.el("p", { class: "ly-verdict", "aria-live": "polite" });

      function labels() {
        if (state.mode === "mobile") return { badge: "手机 · 1 栏", w: "390px" };
        if (state.mode === "tablet") return { badge: "平板 · 2 栏", w: "768px" };
        return { badge: "桌面 · 3 栏", w: "1024px+" };
      }

      function render() {
        frame.className = "ly-frame ly--" + state.mode;
        frame.style.setProperty("--ly-gap", state.gap + "px");

        var avail = availEl.clientWidth || 1024;
        stage.classList.toggle("ly-compact", avail < 560);

        var frameW = state.mode === "mobile" ? Math.min(390, avail)
          : state.mode === "tablet" ? Math.min(720, avail) : avail;
        var contentW = frameW;
        if (state.mode === "desktop" && state.limit) {
          contentW = Math.min(frameW, Math.max(520, Math.round(frameW * 0.78)));
        }
        container.style.maxWidth = contentW + "px";

        var side = Math.max(0, Math.round((frameW - contentW) / 2));
        var l = labels();
        widthEl.textContent = l.w;
        badge.textContent = l.badge;
        chipContent.textContent = "内容 " + contentW + "px";
        chipSide.textContent = "两侧 " + side + "px";
        chipSide.className = "ly-chip" + (side === 0 ? " ly-chip--accent" : "");
        chipGap.textContent = "栏距 " + state.gap + "px";

        var text;
        if (state.mode === "mobile") {
          text = "手机断点：单栏、导航收进菜单。小屏不用考虑「填满」——内容本来就占满宽度。";
        } else if (state.mode === "tablet") {
          text = "平板断点：两栏网格，导航只留两个入口。内容宽度刚好，不需要额外留白。";
        } else if (avail < 560) {
          text = "演示区只有 " + avail + "px 宽，桌面布局被压缩显示；在宽屏上打开，才能看清两侧的留白。";
        } else if (!state.limit) {
          text = "内容被拉到 " + contentW + "px：卡片变宽、行长变长，页面更满，但<b>更难扫读</b>。";
        } else {
          text = "内容只占 " + contentW + "px，两侧各留 " + side + "px。留白没有浪费空间——它让<b>行长和网格都更好读</b>。";
        }
        if (state.mode === "desktop" && avail >= 560) {
          if (state.gap >= 40) text += " 栏距 40px 偏松，卡片开始各自为政。";
          else if (state.gap <= 16) text += " 栏距 16px 偏紧，网格的边界开始糊在一起。";
        }
        verdict.innerHTML = text;
      }

      render();

      if (cleanup) cleanup();
      var onResize = function () { render(); };
      window.addEventListener("resize", onResize);
      cleanup = function () { window.removeEventListener("resize", onResize); };

      var wrap = K.el("div", { class: "ly-wrap" }, [
        controls,
        stage,
        readout,
        verdict,
        K.note("桌面端不是把内容拉满，而是给内容一个<b>刚好够用的宽度</b>，剩下的交给留白。")
      ]);
      body.appendChild(wrap);
    }
  });
})();
