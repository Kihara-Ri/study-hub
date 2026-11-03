/* ==========================================================================
   第 8 章 · 实时重制图（live figures）
   08-5  把表单控件换成品牌色
   08-22 空状态要主动设计
   08-28 下拉菜单不必是链接列表
   ========================================================================== */
(function () {
  "use strict";

  var K = window.RUILive.kit;

  /* ---------------------------------------------------------------- 样式 */
  if (!document.getElementById("lv-08-style")) {
    var css = [
      '.l08-form, .l08-win, .l08-site { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif; line-height: 1.5; color: #1b2733; }',
      '.l08-win [hidden], .l08-form [hidden] { display: none !important; }',

      /* ---- 08-5 ---- */
      '.l08-form { width: 100%; max-width: 396px; background: #fff; border: 1px solid #e4eaf1; border-radius: 12px; padding: 20px 18px 18px; box-shadow: 0 18px 44px -36px rgba(20,30,40,.55); }',
      '.l08-kicker { margin: 0 0 5px; font-size: 10px; font-weight: 700; letter-spacing: .16em; color: #94a0ad; }',
      '.l08-form__h { margin: 0 0 13px; font-size: 17px; font-weight: 700; letter-spacing: -.01em; color: #16222e; }',
      '.l08-checkrow { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border: 1px solid #e7ecf2; border-radius: 9px; background: #f8fafc; cursor: pointer; }',
      '.l08-checkrow b { font-size: 12.5px; font-weight: 600; }',
      '.l08-form__sub { margin: 14px 0 5px; font-size: 10.5px; font-weight: 700; letter-spacing: .06em; color: #94a0ad; }',
      '.l08-opt { display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; border: 1px solid transparent; border-radius: 9px; cursor: pointer; }',
      '.l08-opt:hover { background: #f7fafc; }',
      '.l08-opt:has(input:checked) { background: #f5f9fd; border-color: #e6eef7; }',
      '.l08-opt input { margin-top: 2px; }',
      '.l08-opt__body { min-width: 0; }',
      '.l08-opt__t { display: block; font-size: 12.5px; font-weight: 600; color: #1b2733; }',
      '.l08-opt__d { display: block; margin-top: 1px; font-size: 10.5px; line-height: 1.55; color: #6b7a89; }',
      '.l08-check, .l08-radio { flex: none; margin: 0; width: var(--l08-ctl, 19px); height: var(--l08-ctl, 19px); border: 1.5px solid #c6d0dc; border-radius: 5px; background-color: #fff; background-repeat: no-repeat; background-position: center; background-size: 72%; -webkit-appearance: none; appearance: none; cursor: pointer; transition: background-color .15s, border-color .15s; }',
      '.l08-check:hover, .l08-radio:hover { border-color: var(--l08-acc, #6d4bd8); }',
      '.l08-check:checked { background-color: var(--l08-acc, #6d4bd8); border-color: var(--l08-acc, #6d4bd8); background-image: var(--l08-tick); }',
      '.l08-radio { border-width: 2px; border-radius: 50%; }',
      '.l08-radio:checked { border-color: var(--l08-acc, #6d4bd8); background-image: radial-gradient(circle, var(--l08-acc, #6d4bd8) 0 34%, transparent 36%); }',
      '.l08-check:focus-visible, .l08-radio:focus-visible { outline: 2px solid var(--l08-acc, #6d4bd8); outline-offset: 2px; }',
      '.l08-native .l08-check, .l08-native .l08-radio { -webkit-appearance: auto; appearance: auto; width: 17px; height: 17px; border: 0; border-radius: 0; background: none; transform: scale(var(--l08-scale, 1)); transform-origin: center; }',
      '.l08-save { display: inline-flex; align-items: center; justify-content: center; margin-top: 13px; padding: 9px 16px; border-radius: 7px; background: var(--l08-acc, #6d4bd8); color: #fff; font-size: 12px; font-weight: 700; letter-spacing: .02em; }',

      /* ---- 08-22 ---- */
      '.l08-win { width: 100%; border: 1px solid #d5dbe2; border-radius: 10px; overflow: hidden; background: #eef1f5; box-shadow: 0 20px 44px -34px rgba(20,30,40,.55); }',
      '.l08-winbar { display: flex; align-items: center; gap: 6px; padding: 8px 11px; background: #fff; border-bottom: 1px solid #e3e8ee; }',
      '.l08-dot { width: 8px; height: 8px; border-radius: 50%; background: #dbe2ea; }',
      '.l08-url { flex: 1; height: 15px; border-radius: 999px; background: #f1f4f7; border: 1px solid #e6ebf1; }',
      '.l08-app { display: flex; min-height: 300px; }',
      '.l08-side { width: 128px; flex: none; background: #fff; border-right: 1px solid #e3e8ee; padding: 12px 9px; }',
      '.l08-brand { display: flex; align-items: center; gap: 7px; margin-bottom: 12px; padding: 0 4px; }',
      '.l08-brand i { width: 17px; height: 17px; border-radius: 5px; background: #274b6d; }',
      '.l08-brand b { font-size: 10px; letter-spacing: .08em; color: #274b6d; }',
      '.l08-navitem { display: flex; align-items: center; gap: 7px; height: 25px; padding: 0 8px; border-radius: 6px; font-size: 10.5px; color: #5b6b7b; white-space: nowrap; }',
      '.l08-navitem i { width: 9px; height: 9px; border-radius: 3px; background: #c6d0dc; }',
      '.l08-navitem.on { background: #e8eef5; color: #1b2733; font-weight: 700; }',
      '.l08-main { flex: 1; min-width: 0; background: #f6f8fb; }',
      '.l08-main__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 14px 9px; }',
      '.l08-title { font-size: 14px; font-weight: 700; color: #16222e; }',
      '.l08-btn { display: inline-flex; align-items: center; justify-content: center; gap: 5px; border: 0; border-radius: 6px; background: var(--l08-acc, #274b6d); color: #fff; font-size: 10.5px; font-weight: 700; padding: 6px 10px; white-space: nowrap; }',
      '.l08-aux { padding: 0 14px 8px; }',
      '.l08-tabs { display: flex; gap: 13px; border-bottom: 1px solid #e3e8ee; }',
      '.l08-tab { position: relative; flex: none; padding: 0 0 7px; font-size: 10.5px; color: #7c8794; white-space: nowrap; }',
      '.l08-tab.on { color: #16222e; font-weight: 700; }',
      '.l08-tab.on::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--l08-acc, #274b6d); }',
      '.l08-filters { display: flex; gap: 7px; padding: 8px 0 0; }',
      '.l08-filter, .l08-search { display: flex; align-items: center; height: 26px; border: 1px solid #dde4ec; border-radius: 6px; background: #fff; padding: 0 8px; font-size: 10.5px; color: #8a95a2; white-space: nowrap; }',
      '.l08-search { flex: 1; min-width: 0; overflow: hidden; }',
      '.l08-content { padding: 2px 14px 16px; }',
      '.l08-row { padding: 9px 1px; border-bottom: 1px solid #e8edf3; }',
      '.l08-row:last-child { border-bottom: 0; }',
      '.l08-row__top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }',
      '.l08-code { font-family: var(--font-mono, ui-monospace, Menlo, monospace); font-size: 9.5px; font-weight: 700; letter-spacing: .04em; background: #eef2f7; color: #33506c; border-radius: 4px; padding: 2px 5px; }',
      '.l08-pill { font-size: 9px; padding: 2px 6px; border-radius: 999px; background: #eaf6ef; color: #2b7a4b; white-space: nowrap; }',
      '.l08-pill--wait { background: #fdf3e2; color: #96690f; }',
      '.l08-pill--off { background: #f1f3f6; color: #7c8794; }',
      '.l08-row__bot { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-top: 3px; }',
      '.l08-row__bot b { font-size: 11px; font-weight: 600; color: #1b2733; }',
      '.l08-uses { font-size: 9.5px; color: #8a95a2; white-space: nowrap; }',
      '.l08-raw { display: grid; place-items: center; min-height: 178px; color: #9aa6b3; font-size: 11.5px; }',
      '.l08-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 208px; padding: 12px 8px 22px; text-align: center; }',
      '.l08-illo { position: relative; width: 92px; height: 66px; margin-bottom: 2px; }',
      '.l08-illo__tag { position: absolute; left: 6px; top: 14px; width: 48px; height: 32px; border: 2px solid #c2d0e1; border-radius: 9px; background: #fff; transform: rotate(-16deg); box-shadow: 0 8px 16px -12px rgba(30,50,70,.5); }',
      '.l08-illo__tag::after { content: ""; position: absolute; left: 6px; top: 50%; width: 5px; height: 5px; margin-top: -2.5px; border-radius: 50%; background: #c2d0e1; }',
      '.l08-illo__pct { position: absolute; right: 4px; bottom: 4px; display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--l08-acc, #274b6d); background: #f4f8fd; font-size: 11px; font-weight: 700; color: var(--l08-acc, #274b6d); }',
      '.l08-empty h5 { margin: 0; font-size: 13px; font-weight: 700; color: #16222e; }',
      '.l08-empty p { margin: 0; max-width: 34ch; font-size: 10.5px; line-height: 1.6; color: #6b7a89; }',
      '.l08-empty .l08-btn { margin-top: 5px; padding: 7px 13px; font-size: 11px; }',

      /* ---- 08-28 ---- */
      '.l08-site { width: 100%; }',
      '.l08-page { width: 100%; padding: 14px; background: #f3f5f8; border-radius: 10px; }',
      '.l08-sitebar { display: flex; align-items: center; gap: 15px; padding: 10px 13px; background: #fff; border: 1px solid #e3e8ee; border-radius: 9px; }',
      '.l08-sitebar__brand { display: flex; align-items: center; gap: 7px; margin-right: 2px; }',
      '.l08-sitebar__brand i { width: 16px; height: 16px; border-radius: 5px; background: #2f5d8a; }',
      '.l08-sitebar__brand b { font-size: 11px; letter-spacing: .02em; color: #16222e; }',
      '.l08-navlink { position: relative; font-size: 11px; color: #5b6b7b; padding: 2px 0 4px; white-space: nowrap; }',
      '.l08-navlink.on { color: #16222e; font-weight: 700; box-shadow: inset 0 -2px 0 var(--l08-acc, #2f5d8a); }',
      '.l08-navbtn { margin-left: auto; display: inline-flex; align-items: center; padding: 5px 9px; border-radius: 6px; background: #2f5d8a; color: #fff; font-size: 10px; font-weight: 700; white-space: nowrap; }',
      '.l08-menu { position: relative; margin-top: 7px; padding: 13px; background: #fff; border: 1px solid #e3e8ee; border-radius: 10px; box-shadow: 0 24px 46px -34px rgba(20,30,40,.6); }',
      '.l08-menu::before { content: ""; position: absolute; top: -6px; left: 72px; width: 10px; height: 10px; background: #fff; border-left: 1px solid #e3e8ee; border-top: 1px solid #e3e8ee; transform: rotate(45deg); }',
      '.l08-menu__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px 10px; }',
      '.l08-plain .l08-menu__grid { grid-template-columns: 1fr; }',
      '.l08-mi { display: flex; align-items: flex-start; gap: 9px; padding: 7px 7px; border-radius: 7px; }',
      '.l08-mi:hover { background: #f5f8fb; }',
      '.l08-ic { flex: none; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 7px; background: #eef3f9; color: #3b6ea5; }',
      '.l08-ic svg { width: 13px; height: 13px; }',
      '.l08-mi b { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; color: #16222e; }',
      '.l08-mi em { display: block; margin-top: 1px; font-style: normal; font-size: 10px; line-height: 1.5; color: #7c8794; }',
      '.l08-new { font-size: 8px; font-weight: 700; letter-spacing: .06em; padding: 1px 4px; border-radius: 999px; background: #fdf0d8; color: #96690f; }',
      '.l08-menu__foot { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 9px; padding: 9px 7px 2px; border-top: 1px solid #edf1f5; }',
      '.l08-menu__foot span { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; color: #4c5b6a; white-space: nowrap; }',
      '.l08-menu__foot i { display: grid; place-items: center; width: 15px; height: 15px; border-radius: 5px; background: #eef3f9; color: #3b6ea5; }',
      '.l08-menu__foot svg { width: 9px; height: 9px; }',
      '.l08-hide-icons .l08-ic { display: none; }',
      '.l08-hide-desc .l08-mi em { display: none; }',
      '.l08-hide-foot .l08-menu__foot { display: none; }',

      '@media (max-width: 600px) {',
      '  .l08-side { display: none; }',
      '  .l08-navbtn { display: none; }',
      '  .l08-menu::before { left: 54px; }',
      '  .l08-menu__grid { grid-template-columns: 1fr; }',
      '  .l08-empty { min-height: 186px; }',
      '  .l08-menu__foot span { font-size: 9.5px; }',
      '}'
    ].join("\n");
    var style = document.createElement("style");
    style.id = "lv-08-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  var TICK = 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22%3E%3Cpath d=%22M3.4 8.7l2.9 2.9 6.3-7.2%22 fill=%22none%22 stroke=%22%23fff%22 stroke-width=%222.2%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E")';

  /* ================================================================ 08-5 */
  window.RUILive.register("08-5", {
    build: function (body) {
      var state = { native: false, hue: 262, size: 20 };

      function opt(title, desc, checked) {
        return K.el("label", { class: "l08-opt" }, [
          K.el("input", { class: "l08-radio", type: "radio", name: "l08-biz", checked: !!checked }),
          K.el("div", { class: "l08-opt__body" }, [
            K.el("b", { class: "l08-opt__t", text: title }),
            K.el("span", { class: "l08-opt__d", text: desc })
          ])
        ]);
      }

      var form = K.el("div", { class: "l08-form" }, [
        K.el("p", { class: "l08-kicker", text: "账户设置" }),
        K.el("h4", { class: "l08-form__h", text: "你经营的是哪种业务？" }),
        K.el("label", { class: "l08-checkrow" }, [
          K.el("input", { class: "l08-check", type: "checkbox", checked: true }),
          K.el("b", { text: "我用自己的品牌经营业务" })
        ]),
        K.el("p", { class: "l08-form__sub", text: "业务类型" }),
        opt("服务型业务", "提供没有实体的服务，比如咨询、设计与代运营。", true),
        opt("零售型业务", "低价买入、加价卖出，库存和物流是重点。", false),
        opt("制造型业务", "自己生产产品，需要管理生产与分销。", false),
        K.el("span", { class: "l08-save", text: "保存偏好" })
      ]);

      function paint() {
        form.classList.toggle("l08-native", state.native);
        form.style.setProperty("--l08-acc", "hsl(" + state.hue + " 58% 42%)");
        form.style.setProperty("--l08-ctl", state.size + "px");
        form.style.setProperty("--l08-scale", String(Math.round((state.size / 17) * 100) / 100));
      }

      var seg = K.seg({
        label: "控件样式",
        options: [
          { value: "brand", label: "品牌化" },
          { value: "native", label: "浏览器默认" }
        ],
        value: "brand",
        onChange: function (v) { state.native = v === "native"; paint(); }
      });

      var hue = K.range({
        label: "品牌色色相",
        min: 0, max: 360, step: 4, value: state.hue,
        format: function (v) { return v + "°"; },
        onInput: function (v) { state.hue = v; paint(); }
      });

      var size = K.range({
        label: "控件尺寸",
        min: 15, max: 28, step: 1, value: state.size,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.size = v; paint(); }
      });

      var canvas = K.canvas();
      canvas.appendChild(form);

      body.appendChild(K.controls([seg.el, hue.el, size.el]));
      body.appendChild(canvas);
      body.appendChild(K.note("选中态不用浏览器默认样式，直接从品牌色里挑一个——往往就足够让表单从乏味变得精致、有设计感。"));

      form.style.setProperty("--l08-tick", TICK);
      paint();
    }
  });

  /* =============================================================== 08-22 */
  window.RUILive.register("08-22", {
    build: function (body) {
      var state = { mode: "polish", aux: false, hue: 214 };

      var ROWS = [
        ["WELCOME10", "新客首单立减 10 元", "进行中", "已用 42 次", ""],
        ["SPRING20", "全店 8 折", "已排期", "下月生效", "wait"],
        ["VIP50", "会员专享 5 折", "已过期", "19 天前", "off"]
      ];

      function rowDom(r) {
        return K.el("div", { class: "l08-row" }, [
          K.el("div", { class: "l08-row__top" }, [
            K.el("span", { class: "l08-code", text: r[0] }),
            K.el("span", { class: "l08-pill" + (r[4] ? " l08-pill--" + r[4] : ""), text: r[2] })
          ]),
          K.el("div", { class: "l08-row__bot" }, [
            K.el("b", { text: r[1] }),
            K.el("span", { class: "l08-uses", text: r[3] })
          ])
        ]);
      }

      var topBtn = K.el("span", { class: "l08-btn", text: "新建折扣码" });

      var aux = K.el("div", { class: "l08-aux" }, [
        K.el("div", { class: "l08-tabs" }, ["全部", "进行中", "已排期", "已过期"].map(function (t, i) {
          return K.el("span", { class: "l08-tab" + (i === 0 ? " on" : ""), text: t });
        })),
        K.el("div", { class: "l08-filters" }, [
          K.el("span", { class: "l08-filter", text: "筛选器 ▾" }),
          K.el("span", { class: "l08-search", text: "搜索折扣码…" })
        ])
      ]);

      var content = K.el("div", { class: "l08-content" });

      var main = K.el("div", { class: "l08-main" }, [
        K.el("div", { class: "l08-main__head" }, [
          K.el("span", { class: "l08-title", text: "折扣码" }),
          topBtn
        ]),
        aux,
        content
      ]);

      var side = K.el("div", { class: "l08-side" }, [
        K.el("div", { class: "l08-brand" }, [K.el("i"), K.el("b", { text: "ACME" })])
      ].concat(["概览", "折扣码", "订单", "客户", "设置"].map(function (t, i) {
        return K.el("div", { class: "l08-navitem" + (i === 1 ? " on" : "") }, [
          K.el("i"), K.el("span", { text: t })
        ]);
      })));

      var win = K.el("div", { class: "l08-win" }, [
        K.el("div", { class: "l08-winbar" }, [
          K.el("i", { class: "l08-dot" }), K.el("i", { class: "l08-dot" }), K.el("i", { class: "l08-dot" }),
          K.el("span", { class: "l08-url" })
        ]),
        K.el("div", { class: "l08-app" }, [side, main])
      ]);

      function emptyDom() {
        return K.el("div", { class: "l08-empty" }, [
          K.el("div", { class: "l08-illo" }, [
            K.el("i", { class: "l08-illo__tag" }),
            K.el("i", { class: "l08-illo__pct", text: "%" })
          ]),
          K.el("h5", { text: "用折扣码带来第一笔订单" }),
          K.el("p", { text: "给客户一个下单的理由：满减、限时折扣，或者只给老客的专属优惠。" }),
          K.el("span", { class: "l08-btn", text: "创建第一个折扣码" })
        ]);
      }

      function paint() {
        win.style.setProperty("--l08-acc", "hsl(" + state.hue + " 52% 38%)");
        aux.hidden = !state.aux;
        topBtn.hidden = state.mode === "polish";
        content.innerHTML = "";
        if (state.mode === "data") {
          ROWS.forEach(function (r) { content.appendChild(rowDom(r)); });
        } else if (state.mode === "raw") {
          content.appendChild(K.el("div", { class: "l08-raw", text: "暂无折扣码。" }));
        } else {
          content.appendChild(emptyDom());
        }
      }

      var seg = K.seg({
        label: "内容状态",
        options: [
          { value: "data", label: "有数据" },
          { value: "raw", label: "空状态·原样" },
          { value: "polish", label: "空状态·打磨" }
        ],
        value: "polish",
        onChange: function (v) { state.mode = v; paint(); }
      });

      var auxT = K.toggle({
        label: "显示标签页和筛选器",
        checked: state.aux,
        onChange: function (c) { state.aux = c; paint(); }
      });

      var hue = K.range({
        label: "强调色色相",
        min: 0, max: 360, step: 4, value: state.hue,
        format: function (v) { return v + "°"; },
        onInput: function (v) { state.hue = v; paint(); }
      });

      var canvas = K.canvas();
      canvas.appendChild(win);

      body.appendChild(K.controls([seg.el, auxT.el, hue.el]));
      body.appendChild(canvas);
      body.appendChild(K.note("空状态是用户和新功能的第一次接触。藏起此刻用不上的标签页与筛选器，再用一句标题、一颗按钮告诉他下一步该做什么。"));

      paint();
    }
  });

  /* =============================================================== 08-28 */
  window.RUILive.register("08-28", {
    build: function (body) {
      var state = { multi: true, icons: true, desc: true };

      var svg = function (inner) {
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
      };
      var ICONS = {
        chart: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
        bell: svg('<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>'),
        funnel: svg('<path d="M3 4h18l-7 8v7l-4 2v-9z"/>'),
        trend: svg('<path d="M3 17l6-6 4 4 7-8"/><path d="M14 7h6v6"/>'),
        sync: svg('<path d="M20 11a8 8 0 0 0-14-5L3 9"/><path d="M3 4v5h5"/><path d="M4 13a8 8 0 0 0 14 5l3-3"/><path d="M21 20v-5h-5"/>'),
        grid: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>')
      };

      var FOOT = {
        doc: svg('<path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v17H7a2 2 0 0 0-2 2z"/><path d="M5 4.5v16"/><path d="M9 7h6M9 10h6"/>'),
        code: svg('<path d="M8 8l-4 4 4 4"/><path d="M16 8l4 4-4 4"/>'),
        fork: svg('<circle cx="6" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="M6 7v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7"/><path d="M12 12v5"/>')
      };

      var ITEMS = [
        ["chart", "互动分析", "衡量用户在页面上做了什么。", true],
        ["bell", "自动化提醒", "在关键时刻收到通知。", false],
        ["funnel", "漏斗与转化", "看看客户在哪一步流失。", false],
        ["trend", "实时趋势", "监控指标今天的走势。", false],
        ["sync", "数据同步", "连接你现有的数据源。", false],
        ["grid", "看板搭建", "拖拽拼出自己的仪表盘。", false]
      ];

      var grid = K.el("div", { class: "l08-menu__grid" }, ITEMS.map(function (it) {
        return K.el("div", { class: "l08-mi" }, [
          K.el("span", { class: "l08-ic", html: ICONS[it[0]] }),
          K.el("div", { class: "l08-mi__body" }, [
            K.el("b", { text: it[1] }, it[3] ? [K.el("span", { class: "l08-new", text: "NEW" })] : null),
            K.el("em", { text: it[2] })
          ])
        ]);
      }));

      var foot = K.el("div", { class: "l08-menu__foot" }, [
        ["doc", "文档"],
        ["code", "API"],
        ["fork", "开源项目"]
      ].map(function (it) {
        return K.el("span", null, [K.el("i", { html: FOOT[it[0]] }), K.el("span", { text: it[1] })]);
      }));

      var menu = K.el("div", { class: "l08-menu" }, [grid, foot]);

      var sitebar = K.el("div", { class: "l08-sitebar" }, [
        K.el("div", { class: "l08-sitebar__brand" }, [K.el("i"), K.el("b", { text: "Anchor" })])
      ].concat(["功能", "定价", "公司"].map(function (t, i) {
        return K.el("span", { class: "l08-navlink" + (i === 0 ? " on" : ""), text: t });
      }), [K.el("span", { class: "l08-navbtn", text: "免费试用" })]));

      var page = K.el("div", { class: "l08-page" }, [sitebar, menu]);

      function paint() {
        menu.classList.toggle("l08-plain", !state.multi);
        menu.classList.toggle("l08-hide-icons", !state.icons);
        menu.classList.toggle("l08-hide-desc", !state.desc);
        menu.classList.toggle("l08-hide-foot", !state.multi);
      }

      var multi = K.toggle({
        label: "多列分组 + 底部文档",
        checked: state.multi,
        onChange: function (c) { state.multi = c; paint(); }
      });
      var icons = K.toggle({
        label: "彩色图标",
        checked: state.icons,
        onChange: function (c) { state.icons = c; paint(); }
      });
      var desc = K.toggle({
        label: "一行辅助说明",
        checked: state.desc,
        onChange: function (c) { state.desc = c; paint(); }
      });

      var canvas = K.canvas();
      canvas.appendChild(page);

      body.appendChild(K.controls([multi.el, icons.el, desc.el]));
      body.appendChild(canvas);
      body.appendChild(K.note("下拉菜单不过是屏幕上悬浮的一个盒子——拆成两列、配上图标、写一行说明，同样的链接就有了「被设计过」的感觉。"));

      paint();
    }
  });
})();
