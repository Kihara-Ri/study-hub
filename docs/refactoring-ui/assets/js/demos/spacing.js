/* ==========================================================================
   spacing.js — 第 3 章 · 间距系统
   同一张卡片，在「随手间距」和「系统间距」之间切换，看节奏从哪来。
   ========================================================================== */
(function () {
  "use strict";

  var K = window.RUIDemo.kit;

  var STYLE_ID = "sp-style";
  var CSS = [
    ".sp-wrap{display:grid;gap:14px;width:100%}",
    ".sp-controls{display:grid;gap:10px 24px;grid-template-columns:auto minmax(0,1fr)}",
    ".sp-controls > .ctl:last-child{grid-column:1/-1}",
    ".sp-controls .seg{justify-self:start}",
    ".sp-stage{padding:26px 16px;transition:background-color .2s}",
    ".sp-stage.sp-grid{background-color:var(--bg-2);background-image:linear-gradient(to right,rgba(47,93,138,.15) 1px,transparent 1px),linear-gradient(to bottom,rgba(47,93,138,.15) 1px,transparent 1px),linear-gradient(to right,rgba(47,93,138,.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(47,93,138,.07) 1px,transparent 1px);background-size:16px 16px,16px 16px,4px 4px,4px 4px}",
    ".sp-card{width:100%;max-width:380px;padding:var(--sp-pad,16px);background:#fff;border:1px solid #e8e8ec;border-radius:12px;box-shadow:0 1px 2px rgba(20,20,30,.05),0 16px 34px -22px rgba(20,20,30,.35);color:#1b1b1f;font-family:var(--font-ui);transition:padding .16s ease,background-color .2s}",
    ".sp-stage.sp-grid .sp-card{background:rgba(255,255,255,.84)}",
    ".sp-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin-bottom:var(--sp-head,12px)}",
    ".sp-title{font-size:14px;font-weight:700;letter-spacing:-.01em;line-height:1.3}",
    ".sp-count{font-size:10.5px;font-weight:700;color:#2f5d8a;background:#eef2f7;padding:2px 8px;border-radius:999px;white-space:nowrap}",
    ".sp-row{display:flex;align-items:center;gap:var(--sp-inner,12px);transition:margin-top .16s ease}",
    ".sp-avatar{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:10.5px;font-weight:700;flex:none}",
    ".sp-avatar--a{background:#e8edf4;color:#3c5b7c}",
    ".sp-avatar--b{background:#f1ece2;color:#7a6340}",
    ".sp-avatar--c{background:#e9f0ea;color:#3f6b4f}",
    ".sp-avatar--d{background:#efe9f0;color:#6a4c6d}",
    ".sp-main{min-width:0;flex:1;display:grid;gap:1px}",
    ".sp-name{font-size:12px;font-weight:700;line-height:1.35;color:#3d3d44;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".sp-msg{font-size:11px;line-height:1.4;color:#8a8a93;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".sp-time{font-size:10px;line-height:1.4;color:#b0b0b8;flex:none;font-variant-numeric:tabular-nums}",
    ".sp-readout{display:flex;flex-wrap:wrap;gap:6px}",
    ".sp-chip{padding:3px 8px;border:1px solid var(--rule);border-radius:999px;background:var(--surface);font-family:var(--font-mono);font-size:10.5px;color:var(--ink-2);font-variant-numeric:tabular-nums}",
    ".sp-chip--off{border-style:dashed;border-color:color-mix(in srgb,var(--accent) 60%,transparent);color:var(--accent)}",
    ".sp-verdict{margin:8px 0 0;font-size:12px;line-height:1.7;color:var(--ink-2);min-height:2.8em}",
    ".sp-verdict b{color:var(--ink)}",
    "@media (max-width:560px){.sp-stage{padding:20px 12px}}",
    "@media (max-width:700px){.sp-controls{grid-template-columns:1fr}.sp-controls > .ctl:first-child{grid-template-columns:1fr;gap:6px}.sp-controls > .ctl:first-child .seg{justify-self:stretch}}"
  ].join("");

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  var TOKENS = [4, 8, 12, 16, 24, 32];

  var ROWS = [
    ["a", "陈", "陈可", "更新了「设计规范」", "2 分钟前"],
    ["b", "王", "王野", "在「落地页」留了 3 条评论", "1 小时前"],
    ["c", "李", "李想", "邀请你加入「品牌升级」", "昨天"],
    ["d", "周", "周野", "发来一份新的周报", "周一"]
  ];

  function rowsHtml() {
    return ROWS.map(function (r) {
      return '<div class="sp-row">' +
        '<span class="sp-avatar sp-avatar--' + r[0] + '">' + r[1] + '</span>' +
        '<span class="sp-main">' +
          '<span class="sp-name">' + r[2] + '</span>' +
          '<span class="sp-msg">' + r[3] + '</span>' +
        '</span>' +
        '<span class="sp-time">' + r[4] + '</span>' +
      '</div>';
    }).join("");
  }

  window.RUIDemo.register("spacing", {
    build: function (body) {
      injectStyle();

      var state = { system: true, level: 3, grid: false };

      var modeCtl = K.seg({
        label: "间距来源",
        options: [
          { value: "free", label: "随手间距" },
          { value: "system", label: "系统间距" }
        ],
        value: "system",
        onChange: function (v) { state.system = v === "system"; render(); }
      });
      var levelCtl = K.range({
        label: "间距档位",
        min: 0, max: 5, step: 1, value: state.level,
        format: function (v) { return TOKENS[v] + "px"; },
        onInput: function (v) { state.level = v; render(); }
      });
      var gridCtl = K.toggle({
        label: "网格参考线",
        checked: false,
        hint: "4px 网格",
        onChange: function (on) {
          state.grid = on;
          stage.classList.toggle("sp-grid", on);
          render();
        }
      });
      var controls = K.el("div", { class: "controls sp-controls" }, [modeCtl.el, levelCtl.el, gridCtl.el]);

      var stage = K.stage("sp-stage");
      var card = K.el("div", {
        class: "sp-card",
        html:
          '<div class="sp-head">' +
            '<span class="sp-title">通知</span>' +
            '<span class="sp-count">4 条未读</span>' +
          '</div>' +
          '<div class="sp-rows">' + rowsHtml() + '</div>'
      });
      stage.appendChild(card);

      var rowEls = Array.prototype.slice.call(card.querySelectorAll(".sp-row"));

      var chips = [
        K.el("span", { class: "sp-chip" }),
        K.el("span", { class: "sp-chip" }),
        K.el("span", { class: "sp-chip" }),
        K.el("span", { class: "sp-chip" })
      ];
      var readout = K.el("div", { class: "sp-readout" }, chips);
      var verdict = K.el("p", { class: "sp-verdict", "aria-live": "polite" });

      function values() {
        var i = state.level;
        var base = TOKENS[i];
        var prev = TOKENS[Math.max(0, i - 1)];
        if (state.system) {
          return {
            pad: base,
            head: prev,
            inner: i <= 1 ? 8 : 12,
            rows: [prev, prev, prev]
          };
        }
        return {
          pad: base + 3,
          head: base + 5,
          inner: 9 + (i % 2) * 4,
          rows: [prev + 2, Math.max(3, prev - 3), prev + 6]
        };
      }

      function onGrid(v) { return v % 4 === 0; }

      function render() {
        var v = values();
        card.style.setProperty("--sp-pad", v.pad + "px");
        card.style.setProperty("--sp-head", v.head + "px");
        card.style.setProperty("--sp-inner", v.inner + "px");
        for (var r = 1; r < rowEls.length; r++) {
          rowEls[r].style.marginTop = v.rows[r - 1] + "px";
        }

        var flat = [v.pad, v.head, v.inner].concat(v.rows);
        var offCount = flat.filter(function (x) { return !onGrid(x); }).length;

        chips[0].textContent = "内边距 " + v.pad;
        chips[1].textContent = "标题 " + v.head;
        chips[2].textContent = "头像 " + v.inner;
        chips[3].textContent = "行距 " + v.rows.join(" / ");
        chips[0].className = "sp-chip" + (onGrid(v.pad) ? "" : " sp-chip--off");
        chips[1].className = "sp-chip" + (onGrid(v.head) ? "" : " sp-chip--off");
        chips[2].className = "sp-chip" + (onGrid(v.inner) ? "" : " sp-chip--off");
        chips[3].className = "sp-chip" + (v.rows.every(onGrid) ? "" : " sp-chip--off");

        var msg;
        if (offCount === 0) {
          msg = "6 个值全部落在 4px 网格上。";
        } else if (offCount === 6) {
          msg = "6 个值全都不在 4px 网格上。";
        } else {
          msg = offCount + " 个值不在 4px 网格上。";
        }

        var text;
        if (!state.system) {
          text = "内边距 " + v.pad + "、标题 " + v.head + "、行距 " + v.rows.join(" / ") +
            "——单看都还行，放在一起就<b>没有节奏</b>。";
        } else if (state.level <= 1) {
          text = "紧凑也是一种决定：所有值都从同一套阶梯里挑，再挤也<b>整齐</b>。";
        } else if (state.level >= 5) {
          text = "留白给足了，节奏来自重复：内边距 " + v.pad + "、标题 " + v.head +
            "、行距 " + v.rows[0] + "，同一步长反复出现。";
        } else {
          text = "内边距 " + v.pad + "、标题 " + v.head + "、行距 " + v.rows[0] +
            "——都来自同一套阶梯，重复出现，<b>节奏就成立</b>。";
        }
        if (state.grid) text += " 网格线就是 4px 的步长。";
        text += " " + msg;
        verdict.innerHTML = text;
      }

      render();

      var wrap = K.el("div", { class: "sp-wrap" }, [
        controls,
        stage,
        readout,
        verdict,
        K.note("间距不用每次都刚好；需要的是<b>每次都从同一组值里挑</b>。4 / 8 / 12 / 16 / 24 / 32，就是一组够用的阶梯。")
      ]);
      body.appendChild(wrap);
    }
  });
})();
