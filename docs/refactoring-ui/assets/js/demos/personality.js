/* personality.js — 风格个性实验室：字体、颜色、圆角、语气要指向同一个方向 */
(function () {
  "use strict";
  var K = window.RUIDemo.kit;

  var STYLE_ID = "ps-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent =
      ".ps-wrap{display:grid;gap:18px;width:100%}" +
      ".ps-card{width:100%;max-width:360px;padding:22px;background:#fff;border:1px solid rgba(20,20,30,.08);" +
      "color:#1b1b1f;transition:border-radius .18s,background .18s,color .18s,box-shadow .18s;font-family:var(--font-ui)}" +
      ".ps-top{display:flex;align-items:center;justify-content:space-between;gap:10px}" +
      ".ps-kicker{font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;opacity:.55}" +
      ".ps-tag{display:inline-block;padding:3px 9px;border-radius:999px;font-size:10.5px;font-weight:700;letter-spacing:.04em;transition:background .18s,color .18s,border-radius .18s}" +
      ".ps-title{margin:16px 0 6px;font-size:21px;line-height:1.3;font-weight:800;letter-spacing:-.01em;transition:color .18s,font-weight .18s}" +
      ".ps-sub{font-size:12.5px;line-height:1.6;opacity:.72}" +
      ".ps-streak{display:flex;align-items:baseline;gap:8px;margin:20px 0 12px}" +
      ".ps-streak b{font-size:40px;line-height:1;font-weight:800;letter-spacing:-.03em;font-variant-numeric:tabular-nums;transition:color .18s}" +
      ".ps-streak span{font-size:11.5px;opacity:.62}" +
      ".ps-track{height:6px;border-radius:999px;background:rgba(20,20,30,.08);overflow:hidden}" +
      ".ps-track i{display:block;height:100%;border-radius:inherit;transition:background .18s,width .18s}" +
      ".ps-actions{display:flex;align-items:center;gap:10px;margin-top:20px}" +
      ".ps-btn{flex:1;padding:11px 16px;text-align:center;font-size:13px;font-weight:700;border:1px solid transparent;transition:background .18s,color .18s,border-radius .18s}" +
      ".ps-ghost{padding:11px 14px;font-size:12.5px;opacity:.55;transition:border-radius .18s}" +
      ".ps-tokens{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px 16px;margin-top:2px;padding:14px 16px;border:1px dashed var(--rule-strong);font-size:11.5px}" +
      ".ps-tokens div{display:grid;gap:2px}" +
      ".ps-tokens dt{color:var(--ink-3);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}" +
      ".ps-tokens dd{color:var(--ink-2);font-weight:600}" +
      ".ps-verdict{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:11.5px;color:var(--ink-3)}" +
      ".ps-verdict b{color:var(--ink-2)}" +
      ".ps-verdict .ps-flag{padding:2px 9px;border-radius:999px;font-size:10.5px;font-weight:700}" +
      ".ps-flag--ok{background:color-mix(in srgb,var(--blue) 12%,transparent);color:var(--blue)}" +
      ".ps-flag--mix{background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)}";
    document.head.appendChild(s);
  }

  var PRESETS = {
    warm: {
      name: "亲切",
      hue: 16, sat: 72, light: 50,
      radius: 18, btnRadius: 999,
      bg: "#fff8f2", ink: "#2a1d17", font: "var(--font-ui)",
      copy: { title: "今天也来打个卡吧", sub: "连续 12 天 · 慢慢来就好", btn: "开始今天的打卡", ghost: "今天先跳过", tag: "温柔坚持", kicker: "DAILY HABIT" }
    },
    neutral: {
      name: "中性",
      hue: 212, sat: 48, light: 38,
      radius: 8, btnRadius: 8,
      bg: "#ffffff", ink: "#1b1b1f", font: "var(--font-ui)",
      copy: { title: "习惯追踪", sub: "连续 12 天，保持节奏", btn: "打卡", ghost: "跳过", tag: "效率", kicker: "HABIT TRACKER" }
    },
    editorial: {
      name: "克制",
      hue: 160, sat: 26, light: 24,
      radius: 2, btnRadius: 0,
      bg: "#fbfaf7", ink: "#191c1a",
      font: '"Songti SC", "Noto Serif CJK SC", Georgia, serif',
      copy: { title: "第十二日", sub: "一件小事，重复十二次", btn: "记录今天", ghost: "略过", tag: "长期主义", kicker: "NO. 12" }
    }
  };

  function tint(base, accentRgb, amount) {
    function parse(h) {
      h = h.replace("#", "");
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    }
    var a = typeof base === "string" ? parse(base) : base;
    var b = accentRgb;
    return "rgb(" + [0, 1, 2].map(function (i) {
      return Math.round(a[i] + (b[i] - a[i]) * amount);
    }).join(",") + ")";
  }

  function hexOf(rgb) {
    return "#" + rgb.map(function (v) {
      var h = Math.max(0, Math.min(255, Math.round(v))).toString(16);
      return h.length === 1 ? "0" + h : h;
    }).join("");
  }

  window.RUIDemo.register("personality", {
    build: function (body, ctx) {
      injectStyle();

      var state = { preset: "warm", radius: PRESETS.warm.radius, sat: PRESETS.warm.sat };

      var wrap = K.el("div", { class: "ps-wrap" });

      /* --- canvas --- */
      var stage = K.stage("demo__stage--plain");
      var card = K.el("div", { class: "ps-card" });
      card.innerHTML =
        '<div class="ps-top"><span class="ps-kicker" data-ps="kicker"></span>' +
        '<span class="ps-tag" data-ps="tag"></span></div>' +
        '<div class="ps-title" data-ps="title"></div>' +
        '<div class="ps-sub" data-ps="sub"></div>' +
        '<div class="ps-streak"><b>12</b><span data-ps="streakLabel">天连续</span></div>' +
        '<div class="ps-track"><i data-ps="bar" style="width:60%"></i></div>' +
        '<div class="ps-actions"><span class="ps-btn" data-ps="btn"></span>' +
        '<span class="ps-ghost" data-ps="ghost"></span></div>';
      stage.appendChild(card);

      var tokens = K.el("dl", { class: "ps-tokens" });
      var verdict = K.el("p", { class: "ps-verdict" });

      /* --- controls --- */
      var controls = K.el("div", { class: "controls" });
      var presetSeg = K.seg({
        label: "个性预设",
        options: [
          { value: "warm", label: "亲切 · 暖" },
          { value: "neutral", label: "中性 · 稳" },
          { value: "editorial", label: "克制 · 雅" }
        ],
        value: "warm",
        onChange: function (v) {
          state.preset = v;
          state.radius = PRESETS[v].radius;
          state.sat = PRESETS[v].sat;
          radiusCtl.set(state.radius);
          satCtl.set(state.sat);
          render();
        }
      });
      var radiusCtl = K.range({
        label: "圆角",
        min: 0, max: 24, step: 1, value: state.radius,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.radius = v; custom(); render(); }
      });
      var satCtl = K.range({
        label: "色彩浓度",
        min: 0, max: 100, step: 1, value: state.sat,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.sat = v; custom(); render(); }
      });
      controls.appendChild(presetSeg.el);
      controls.appendChild(radiusCtl.el);
      controls.appendChild(satCtl.el);

      wrap.appendChild(controls);
      wrap.appendChild(stage);
      wrap.appendChild(tokens);
      wrap.appendChild(verdict);
      body.appendChild(wrap);

      function custom() {
        state.preset = "custom";
        presetSeg.set("");
      }

      function render() {
        var p = PRESETS[state.preset] || PRESETS.warm;
        var accentRgb = K.hslToRgb(p.hue, K.round(p.sat * state.sat / 100), p.light);
        var accent = K.rgbCss(accentRgb);
        var q = function (k) { return card.querySelector('[data-ps="' + k + '"]'); };

        card.style.background = p.bg;
        card.style.color = p.ink;
        card.style.fontFamily = p.font;
        card.style.borderRadius = state.radius + "px";
        card.style.boxShadow = "0 " + Math.round(2 + state.radius * 0.6) + "px " +
          Math.round(10 + state.radius * 1.6) + "px -14px rgba(16,20,28,.28)";

        q("kicker").textContent = p.copy.kicker;
        q("tag").textContent = p.copy.tag;
        q("tag").style.background = tint("#ffffff", accentRgb, 0.12);
        q("tag").style.color = accent;
        q("tag").style.borderRadius = Math.min(999, state.radius * 3) + "px";
        q("title").textContent = p.copy.title;
        q("sub").textContent = p.copy.sub;
        q("btn").textContent = p.copy.btn;
        q("ghost").textContent = p.copy.ghost;
        q("bar").style.background = accent;
        q("bar").style.borderRadius = state.radius + "px";
        q("btn").style.background = accent;
        q("btn").style.color = "#fff";
        q("btn").style.borderRadius = state.preset === "custom"
          ? Math.round(state.radius * 0.55) + "px" : PRESETS[state.preset].btnRadius + "px";
        q("ghost").style.borderRadius = Math.round(state.radius * 0.5) + "px";

        /* token readout */
        var radiusWord = state.radius >= 14 ? "大圆角" : state.radius >= 6 ? "中圆角" : "直角";
        var satWord = state.sat >= 70 ? "高饱和" : state.sat >= 40 ? "中等饱和" : "低饱和";
        tokens.innerHTML =
          "<div><dt>字体</dt><dd>" + (p.font.indexOf("Songti") !== -1 ? "宋体 / 衬线" : "系统黑体") + "</dd></div>" +
          "<div><dt>主色</dt><dd style=\"color:" + accent + "\">" + hexOf(accentRgb) + "</dd></div>" +
          "<div><dt>圆角</dt><dd>" + radiusWord + " · " + state.radius + "px</dd></div>" +
          "<div><dt>色彩</dt><dd>" + satWord + "</dd></div>" +
          "<div><dt>语气</dt><dd>" + (state.preset === "warm" ? "鼓励、口语" : state.preset === "editorial" ? "克制、书面" : "直接、功能") + "</dd></div>";

        if (state.preset === "custom") {
          verdict.innerHTML = '<span class="ps-flag ps-flag--mix">自定义混搭</span>' +
            "<span>你已经离开了预设。个性不是某一个滑块，而是<b>字体、颜色、圆角、语气</b>同时指向一个方向。</span>";
        } else {
          verdict.innerHTML = '<span class="ps-flag ps-flag--ok">预设 · ' + p.name + "</span>" +
            "<span>四个维度彼此呼应，界面就会有一致的性格。</span>";
        }
      }

      render();
    }
  });
})();
