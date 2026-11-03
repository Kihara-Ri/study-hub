/* ==========================================================================
   第 9 章 · 实时重制图（live figures）
   09-1  把日期选择器反转过来
   09-4  重建练习：复刻这张卡片
   ========================================================================== */
(function () {
  "use strict";

  var K = window.RUILive.kit;

  /* ---------------------------------------------------------------- 样式 */
  if (!document.getElementById("lv-09-style")) {
    var css = [
      '.l09-win, .l09-rebuild, .l09-pop, .l09-card { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif; line-height: 1.5; color: #1b2733; }',

      /* ---- 09-1 日期选择器 ---- */
      '.l09-win { position: relative; width: 100%; background: #fbfcfd; border: 1px solid #dfe5ec; border-radius: 10px; overflow: hidden; box-shadow: 0 20px 46px -36px rgba(20,30,40,.55); }',
      '.l09-top { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #fff; border-bottom: 1px solid #e6ebf1; }',
      '.l09-brand { font-size: 12px; font-weight: 700; color: #16222e; letter-spacing: .02em; }',
      '.l09-range { display: flex; align-items: center; gap: 8px; margin-left: auto; padding: 5px 9px; background: #fff; border: 1px solid #e2e8ef; border-radius: 6px; font-size: 10.5px; font-weight: 600; color: #1b2733; white-space: nowrap; }',
      '.l09-range__dash { width: 12px; height: 1px; background: #c9d2dc; }',
      '.l09-burger { flex: none; width: 14px; height: 2px; margin-right: 2px; background: #3c4a58; box-shadow: 0 -4px 0 #3c4a58, 0 4px 0 #3c4a58; }',
      '.l09-body { position: relative; min-height: 302px; background: #fbfcfd; }',
      '.l09-table { padding: 2px 0 0; }',
      '.l09-tr { display: grid; grid-template-columns: 1.1fr 1fr 0.9fr; gap: 8px; align-items: center; padding: 9px 12px; font-size: 10.5px; border-bottom: 1px solid #edf1f5; color: #4c5b6a; }',
      '.l09-tr--head { padding-top: 8px; padding-bottom: 8px; background: #f6f8fa; border-bottom: 1px solid #e6ebf1; font-size: 9px; font-weight: 700; letter-spacing: .1em; color: #97a2af; }',
      '.l09-tr--head span:nth-child(3), .l09-tr span:nth-child(3) { text-align: right; }',
      '.l09-mut { color: #8a95a2; }',
      '.l09-pop { position: absolute; top: 44px; right: 12px; z-index: 2; width: 250px; padding: 11px 12px 13px; background: var(--pop-bg, #2b303c); border: 1px solid var(--pop-border, transparent); border-radius: 9px; box-shadow: var(--pop-shadow, 0 22px 44px -20px rgba(10,18,30,.65)); }',
      '.l09-pop__head { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 8px; }',
      '.l09-pop__head b { font-size: 12.5px; font-weight: 700; letter-spacing: .02em; color: var(--pop-ink, #fff); }',
      '.l09-tri { width: 0; height: 0; border: 5px solid transparent; }',
      '.l09-tri--l { border-left-width: 0; border-right-color: var(--pop-ink, #fff); }',
      '.l09-tri--r { border-right-width: 0; border-left-color: var(--pop-ink, #fff); }',
      '.l09-wk { display: flex; justify-content: space-between; padding: 0 1px 4px; }',
      '.l09-wk span { width: 30px; text-align: center; font-size: 9px; font-weight: 700; color: var(--pop-mute, #8f99aa); }',
      '.l09-row { display: flex; justify-content: space-between; align-items: center; height: 30px; border-radius: 4px; }',
      '.l09-day { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; font-size: 11px; font-weight: 700; color: var(--pop-ink, #fff); }',
      '.l09-row--band { background: var(--band, rgba(255,255,255,.08)); }',
      '.l09-day--sel { background: var(--acc, hsl(214 70% 58%)); color: #fff; box-shadow: 0 0 0 2px var(--pop-bg, #2b303c); }',
      '.l09-days { padding: 1px 0; }',

      /* ---- 09-4 重建挑战 ---- */
      '.l09-rebuild { width: 100%; }',
      '.l09-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }',
      '.l09-col { display: flex; flex-direction: column; gap: 7px; min-width: 0; }',
      '.l09-col__tag { align-self: center; font-size: 9px; font-weight: 700; letter-spacing: .14em; color: var(--ink-3, #6d6961); }',
      '.l09-card { background: #fff; border-radius: 10px; overflow: hidden; }',
      '.l09-card--ref { --l09-lh: 1.15; --l09-ls: .16em; box-shadow: 0 4px 6px rgba(20,30,40,.08), 0 5px 15px rgba(20,30,40,.12); }',
      '.l09-card--mine { --l09-lh: 1.7; --l09-ls: 0em; }',
      '.l09-card__h { margin: 16px 12px 3px; font-size: 18px; font-weight: 700; line-height: var(--l09-lh, 1.5); letter-spacing: -.01em; text-align: center; color: #2b3440; }',
      '.l09-map { position: relative; width: 100%; aspect-ratio: 40 / 16; margin-top: 2px; }',
      '.l09-dot { position: absolute; width: 3px; height: 3px; border-radius: 50%; background: #b9cde5; transform: translate(-50%, -50%); }',
      '.l09-pin { position: absolute; width: 8px; height: 8px; border-radius: 50% 50% 50% 0; background: #4c8cf0; transform: translate(-50%, -100%) rotate(45deg); box-shadow: 0 1px 3px rgba(30,60,100,.35); }',
      '.l09-pin::after { content: ""; position: absolute; left: 50%; top: 50%; width: 2.5px; height: 2.5px; margin: -1.25px 0 0 -1.25px; border-radius: 50%; background: #fff; }',
      '.l09-card__p { margin: 11px 14px 13px; font-size: 10.5px; line-height: 1.75; text-align: center; color: #6f7a88; }',
      '.l09-card__foot { padding: 11px 8px; background: #f2f4f7; text-align: center; }',
      '.l09-card__cta { font-size: 10px; font-weight: 700; letter-spacing: var(--l09-ls, 0em); color: #4a6f96; }',
      '.l09-score { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px 8px; margin-top: 14px; }',
      '.l09-score__n { margin-right: 2px; font-size: 11.5px; font-weight: 700; color: var(--ink, #161514); }',
      '.l09-chip { padding: 3px 8px; border: 1px solid var(--rule, #e2ddd2); border-radius: 999px; background: var(--surface-2, #faf7f0); font-size: 10px; color: var(--ink-3, #6d6961); }',
      '.l09-chip.is-on { background: #e7f4ec; border-color: #cfe8da; color: #2b7a4b; }',

      '@media (max-width: 600px) {',
      '  .l09-pop { position: static; width: auto; margin: 10px; box-shadow: 0 14px 30px -22px rgba(10,18,30,.5); }',
      '  .l09-body { min-height: 0; }',
      '  .l09-table { border-bottom: 1px solid #e6ebf1; }',
      '  .l09-cards { grid-template-columns: 1fr; gap: 12px; }',
      '  .l09-score { margin-top: 10px; }',
      '}'
    ].join("\n");
    var style = document.createElement("style");
    style.id = "lv-09-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ================================================================ 09-1 */
  window.RUILive.register("09-1", {
    build: function (body) {
      var state = { invert: true, hue: 214, len: 11 };
      var START = 9;
      var LEAD = 6; /* 2018-07-01 是周日，周一开头 → 前面空 6 格 */

      var startText = K.el("span", { text: "7月9日" });
      var endText = K.el("span", { text: "7月19日" });

      var pop = K.el("div", { class: "l09-pop" });
      var daysEl = K.el("div", { class: "l09-days" });
      pop.appendChild(K.el("div", { class: "l09-pop__head" }, [
        K.el("i", { class: "l09-tri l09-tri--l" }),
        K.el("b", { text: "2018 年 7 月" }),
        K.el("i", { class: "l09-tri l09-tri--r" })
      ]));
      pop.appendChild(K.el("div", { class: "l09-wk" }, ["一", "二", "三", "四", "五", "六", "日"].map(function (t) {
        return K.el("span", { text: t });
      })));
      pop.appendChild(daysEl);

      var rows = [
        ["7月3日", "已逾期 2 天", "¥1,280"],
        ["7月9日", "今天", "¥640"],
        ["7月19日", "还有 10 天", "¥2,400"]
      ];

      var table = K.el("div", { class: "l09-table" }, [
        K.el("div", { class: "l09-tr l09-tr--head" }, [
          K.el("span", { text: "日期" }),
          K.el("span", { text: "到期" }),
          K.el("span", { text: "金额" })
        ])
      ].concat(rows.map(function (r) {
        return K.el("div", { class: "l09-tr" }, [
          K.el("span", { text: r[0] }),
          K.el("span", { class: "l09-mut", text: r[1] }),
          K.el("span", { class: "l09-mut", text: r[2] })
        ]);
      })));

      var win = K.el("div", { class: "l09-win" }, [
        K.el("div", { class: "l09-top" }, [
          K.el("b", { class: "l09-brand", text: "付款" }),
          K.el("span", { class: "l09-range" }, [startText, K.el("i", { class: "l09-range__dash" }), endText]),
          K.el("i", { class: "l09-burger" })
        ]),
        K.el("div", { class: "l09-body" }, [table, pop])
      ]);

      function paint() {
        var end = START + state.len - 1;
        startText.textContent = "7月" + START + "日";
        endText.textContent = "7月" + end + "日";

        var inv = state.invert;
        pop.style.setProperty("--pop-bg", inv ? "#2b303c" : "#ffffff");
        pop.style.setProperty("--pop-ink", inv ? "#ffffff" : "#1b2733");
        pop.style.setProperty("--pop-mute", inv ? "#939db0" : "#8a95a2");
        pop.style.setProperty("--band", inv ? "rgba(255,255,255,.08)" : "hsl(" + state.hue + " 55% 93%)");
        pop.style.setProperty("--acc", K.hsl(state.hue, inv ? 70 : 62, inv ? 58 : 48));
        pop.style.setProperty("--pop-border", inv ? "transparent" : "#e3e8ef");
        pop.style.setProperty("--pop-shadow", inv
          ? "0 22px 44px -20px rgba(10,18,30,.65)"
          : "0 18px 36px -24px rgba(15,25,40,.35)");

        var rowStart = Math.floor((LEAD + START - 1) / 7);
        var rowEnd = Math.floor((LEAD + end - 1) / 7);

        daysEl.innerHTML = "";
        for (var r = 0; r < 6; r++) {
          var row = K.el("div", { class: "l09-row" + (r >= rowStart && r <= rowEnd ? " l09-row--band" : "") });
          for (var c = 0; c < 7; c++) {
            var idx = r * 7 + c;
            var d = idx - LEAD + 1;
            var sel = d === START || d === end;
            row.appendChild(K.el("span", {
              class: "l09-day" + (sel ? " l09-day--sel" : ""),
              text: d >= 1 && d <= 31 ? String(d) : ""
            }));
          }
          daysEl.appendChild(row);
        }
      }

      var seg = K.seg({
        label: "面板配色",
        options: [
          { value: "invert", label: "反转深色" },
          { value: "normal", label: "常规白色" }
        ],
        value: "invert",
        onChange: function (v) { state.invert = v === "invert"; paint(); }
      });

      var hue = K.range({
        label: "强调色色相",
        min: 0, max: 360, step: 4, value: state.hue,
        format: function (v) { return v + "°"; },
        onInput: function (v) { state.hue = v; paint(); }
      });

      var len = K.range({
        label: "高亮范围",
        min: 1, max: 12, step: 1, value: state.len,
        format: function (v) { return v + " 天"; },
        onInput: function (v) { state.len = v; paint(); }
      });

      var canvas = K.canvas();
      canvas.appendChild(win);

      body.appendChild(K.controls([seg.el, hue.el, len.el]));
      body.appendChild(canvas);
      body.appendChild(K.note("每次遇到很喜欢的设计，问一句：这位设计师有没有做什么我根本想不到的事？比如把日期选择器的背景反过来——深色浮层压住浅色界面，平平无奇的组件立刻变成亮点。"));

      paint();
    }
  });

  /* ================================================================ 09-4 */
  window.RUILive.register("09-4", {
    build: function (body) {
      var state = { lh: 1.7, ls: 0, shadow: "none" };

      /* 40×16 点阵世界地图（x0:count,... 每行游程） */
      var MAP = [
        "",
        "15:3",
        "2:12,15:3,27:12",
        "1:14,15:3,20:5,26:13",
        "3:12,18:7,25:15",
        "4:10,19:5,20:7,25:14",
        "5:8,20:7,26:12",
        "6:5,10:3,20:8,27:10",
        "8:3,12:4,21:5,27:2,30:3,33:3",
        "10:4,22:3,28:3,34:3",
        "10:4,22:2,32:3",
        "11:3,22:2,34:5",
        "11:3,23:2,34:6",
        "11:3,35:4",
        "12:2,36:2",
        "12:2"
      ];
      var PINS = [[4, 3], [8, 4], [12, 11], [21, 4], [22, 8], [27, 4], [35, 9], [36, 12]];

      function mapDom() {
        var map = K.el("div", { class: "l09-map" });
        MAP.forEach(function (line, y) {
          if (!line) return;
          line.split(",").forEach(function (run) {
            var p = run.split(":");
            var x0 = Number(p[0]);
            var n = Number(p[1]);
            for (var i = 0; i < n; i++) {
              map.appendChild(K.el("i", {
                class: "l09-dot",
                style: { left: ((x0 + i + 0.5) / 40 * 100) + "%", top: ((y + 0.5) / 16 * 100) + "%" }
              }));
            }
          });
        });
        PINS.forEach(function (pin) {
          map.appendChild(K.el("i", {
            class: "l09-pin",
            style: { left: ((pin[0] + 0.5) / 40 * 100) + "%", top: ((pin[1] + 0.5) / 16 * 100) + "%" }
          }));
        });
        return map;
      }

      function cardDom(kind) {
        return K.el("div", { class: "l09-card l09-card--" + kind }, [
          K.el("h4", { class: "l09-card__h", html: "业务遍布<br>全球各地" }),
          mapDom(),
          K.el("p", { class: "l09-card__p", text: "在 6 个国家设有办公室，每周 7 天、每天 24 小时提供支持。" }),
          K.el("div", { class: "l09-card__foot" }, [K.el("span", { class: "l09-card__cta", text: "创建账户" })])
        ]);
      }

      var refCard = cardDom("ref");
      var mineCard = cardDom("mine");
      var scoreEl = K.el("div", { class: "l09-score" });

      var stage = K.el("div", { class: "l09-rebuild" }, [
        K.el("div", { class: "l09-cards" }, [
          K.el("div", { class: "l09-col" }, [K.el("span", { class: "l09-col__tag", text: "原版" }), refCard]),
          K.el("div", { class: "l09-col" }, [K.el("span", { class: "l09-col__tag", text: "你的复刻" }), mineCard])
        ]),
        scoreEl
      ]);

      function paintScore() {
        var lhOk = Math.abs(state.lh - 1.15) < 0.001;
        var lsOk = Math.abs(state.ls - 0.16) < 0.001;
        var shOk = state.shadow === "multi";
        var n = (lhOk ? 1 : 0) + (lsOk ? 1 : 0) + (shOk ? 1 : 0);
        scoreEl.innerHTML = "";
        scoreEl.appendChild(K.el("b", { class: "l09-score__n", text: n === 3 ? "一模一样，收工！" : "复刻度 " + n + " / 3" }));
        [["行高", lhOk], ["字距", lsOk], ["阴影", shOk]].forEach(function (it) {
          scoreEl.appendChild(K.el("span", { class: "l09-chip" + (it[1] ? " is-on" : ""), text: (it[1] ? "✓ " : "○ ") + it[0] }));
        });
      }

      function paint() {
        mineCard.style.setProperty("--l09-lh", String(state.lh));
        mineCard.style.setProperty("--l09-ls", state.ls + "em");
        mineCard.style.boxShadow = state.shadow === "multi"
          ? "0 4px 6px rgba(20,30,40,.08), 0 5px 15px rgba(20,30,40,.12)"
          : state.shadow === "single"
            ? "0 5px 15px rgba(20,30,40,.16)"
            : "none";
        paintScore();
      }

      var lh = K.range({
        label: "标题行高",
        min: 1, max: 2, step: 0.05, value: state.lh,
        format: function (v) { return v.toFixed(2); },
        onInput: function (v) { state.lh = v; paint(); }
      });
      var ls = K.range({
        label: "大写字距",
        min: 0, max: 0.3, step: 0.01, value: state.ls,
        format: function (v) { return v.toFixed(2) + "em"; },
        onInput: function (v) { state.ls = v; paint(); }
      });
      var shadow = K.seg({
        label: "卡片阴影",
        options: [
          { value: "none", label: "无" },
          { value: "single", label: "单层" },
          { value: "multi", label: "多层" }
        ],
        value: "none",
        onChange: function (v) { state.shadow = v; paint(); }
      });

      var canvas = K.canvas();
      canvas.appendChild(stage);

      body.appendChild(K.controls([lh.el, ls.el, shadow.el]));
      body.appendChild(canvas);
      body.appendChild(K.note("把最喜欢的界面从头重建一遍、别偷看开发者工具——你会自己摸出「标题收紧行高」「大写文字加字距」「阴影叠两层」这些细节。"));

      paint();
    }
  });
})();
