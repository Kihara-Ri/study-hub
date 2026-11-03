/* 第 3 章 · 实时重制图：布局与间距
   03-3 评价卡留白 / 03-22 侧栏固定宽 / 03-36 表单间距 */
(function () {
  "use strict";
  var K = window.RUILive.kit;

  if (!document.getElementById("lv-03-style")) {
    var st = document.createElement("style");
    st.id = "lv-03-style";
    st.textContent = [
      ".l03-canvas{background:#e7ecf2;border-color:#d7dfe8}",
      ".l03-wrap{width:100%;display:flex;flex-direction:column;align-items:center;container-type:inline-size}",

      /* ---------- 03-3 评价卡 ---------- */
      ".l03-card{width:100%;max-width:400px;box-sizing:border-box;background:#fff;border-radius:10px;box-shadow:0 18px 40px -30px rgba(20,32,45,.45);color:#22303c;font-family:var(--font-ui);text-align:left}",
      ".l03-rtitle{font-size:20px;font-weight:700;line-height:1.3;color:#1d2b36}",
      ".l03-rows{display:flex;flex-direction:column;margin-top:2px}",
      ".l03-brow{display:grid;grid-template-columns:42px minmax(0,1fr) 38px;gap:10px;align-items:center}",
      ".l03-blabel{font-size:13.5px;font-weight:700;color:#4b6fd6;white-space:nowrap}",
      ".l03-track{height:8px;border-radius:4px;background:#e8ebef;overflow:hidden}",
      ".l03-fill{display:block;height:100%;border-radius:4px;background:#f6a82c}",
      ".l03-pct{font-size:12.5px;color:#7b8794;text-align:right;font-variant-numeric:tabular-nums}",
      ".l03-ctat{font-size:15px;font-weight:700;color:#1d2b36}",
      ".l03-ctad{margin-top:4px;font-size:13px;line-height:1.5;color:#7b8794}",
      ".l03-ctab{margin-top:12px;border:1px solid #cfd6de;background:#fff;color:#3a4a57;font-family:inherit;font-size:12.5px;font-weight:600;padding:8px 16px;border-radius:7px;cursor:pointer}",
      ".l03-ctab:hover{background:#f5f8fb;border-color:#a9b7c5}",

      /* ---------- 03-36 表单 ---------- */
      ".l03-formcard{width:100%;max-width:420px;box-sizing:border-box;background:#fff;border-radius:10px;box-shadow:0 18px 40px -30px rgba(20,32,45,.4);padding:20px 22px;color:#22303c;font-family:var(--font-ui);text-align:left}",
      ".l03-fhead{display:flex;align-items:baseline;justify-content:space-between;gap:4px 12px;flex-wrap:wrap;margin-bottom:16px}",
      ".l03-kick{font-size:11px;font-weight:700;letter-spacing:.12em;color:#8a97a4}",
      ".l03-link{border:0;background:none;padding:0;font-family:inherit;font-size:12.5px;color:#3b6fd6;cursor:pointer;text-align:left}",
      ".l03-link:hover{text-decoration:underline}",
      ".l03-glabel{display:block;font-size:12.5px;font-weight:600;color:#46586a}",
      ".l03-input{display:block;width:100%;box-sizing:border-box;border:1px solid #d8dfe7;border-radius:6px;background:#fff;color:#26404f;font-family:inherit;font-size:13.5px;padding:8px 10px;margin:0}",
      ".l03-input:focus{outline:none;border-color:#7f9fd6;box-shadow:0 0 0 3px rgba(90,130,200,.16)}",
      ".l03-formcard.is-grouped .l03-group{background:#f4f7fb;border:1px solid #e3eaf2;border-radius:8px;padding:9px 11px}",
      ".l03-verdict{width:100%;max-width:420px;box-sizing:border-box;display:flex;align-items:flex-start;gap:6px;margin-top:12px;font-size:11.5px;font-weight:600;line-height:1.5;padding:7px 10px;border-radius:6px}",
      ".l03-verdict.ok{background:#e7f4ec;color:#1d6b48}",
      ".l03-verdict.warn{background:#fdf1e2;color:#91601a}",

      /* ---------- 03-22 发票仪表盘 ---------- */
      ".l03-frame{width:100%;display:flex;justify-content:center;position:relative}",
      ".l03-holder{position:relative;overflow:hidden;border-radius:9px;background:#f4f6fa;box-shadow:0 22px 45px -30px rgba(18,30,42,.55)}",
      ".l03-app{position:absolute;top:0;left:0;transform-origin:top left;box-sizing:border-box;background:#f4f6fa;color:#1f2b36;font-family:var(--font-ui);text-align:left}",
      ".l03-chrome{display:flex;align-items:center;height:34px;padding:0 12px;background:#28323f}",
      ".l03-dots{display:flex;gap:5px}",
      ".l03-dot{width:8px;height:8px;border-radius:50%}",
      ".l03-dot.a{background:#e0705f}.l03-dot.b{background:#dfb45e}.l03-dot.c{background:#5fae7a}",
      ".l03-url{margin-left:10px;font-family:var(--font-mono);font-size:9px;color:#8b97a6;letter-spacing:.02em}",
      ".l03-body{display:flex;align-items:stretch}",
      ".l03-side{flex:none;background:#2b3648;padding:14px 12px;display:flex;flex-direction:column;gap:13px;overflow:hidden;box-sizing:border-box}",
      ".l03-logo{display:flex;align-items:center;gap:3px;height:20px;padding-left:2px}",
      ".l03-logo i{display:block;width:6px;height:17px;border-radius:2px;transform:skewX(-18deg);background:linear-gradient(#a4a8ea,#7178ca)}",
      ".l03-logo i:last-child{background:linear-gradient(#8f93dd,#5f66bb)}",
      ".l03-nbtn{display:flex;align-items:center;justify-content:center;gap:6px;background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.16);color:#e8edf4;font-size:12px;font-weight:600;border-radius:6px;padding:8px 6px;white-space:nowrap;overflow:hidden;box-sizing:border-box}",
      ".l03-nav{display:flex;flex-direction:column;gap:2px;min-width:0}",
      ".l03-nitem{display:flex;align-items:center;gap:8px;color:#9aa7b8;font-size:12.5px;padding:7px 8px;border-radius:6px;white-space:nowrap;overflow:hidden}",
      ".l03-nitem.is-on{background:rgba(255,255,255,.10);color:#fff;font-weight:600}",
      ".l03-nitem svg{flex:none}",
      ".l03-side-note{font-size:10.5px;line-height:1.5;color:#788596;padding:0 4px}",
      ".l03-user{margin-top:auto;display:flex;align-items:center;gap:8px;padding-top:11px;border-top:1px solid rgba(255,255,255,.1);min-width:0}",
      ".l03-uavt{width:22px;height:22px;border-radius:50%;flex:none;background:linear-gradient(135deg,#c9a06a,#8f6b45)}",
      ".l03-uinfo{min-width:0;flex:1}",
      ".l03-uname{font-size:12px;color:#e8edf4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".l03-umail{font-size:10px;color:#8b97a6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".l03-main{flex:1;min-width:0;display:flex;flex-direction:column;background:#f4f6fa}",
      ".l03-top{display:flex;align-items:center;gap:8px;height:48px;padding:0 15px;background:#fff;border-bottom:1px solid #e6ebf1;box-sizing:border-box}",
      ".l03-search{display:flex;align-items:center;gap:6px;flex:1;max-width:220px;min-width:0;background:#f2f5f9;border:1px solid #e4eaf1;border-radius:999px;padding:6px 11px;color:#8b98a6;font-size:11.5px;white-space:nowrap;overflow:hidden}",
      ".l03-ico{width:22px;height:22px;border-radius:6px;display:grid;place-items:center;color:#7c8998;flex:none}",
      ".l03-tavt{width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#a9c2d2,#d8a06c);margin-left:2px;flex:none}",
      ".l03-content{flex:1;padding:16px 18px 20px;min-width:0;box-sizing:border-box}",
      ".l03-chead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:13px;flex-wrap:wrap}",
      ".l03-h1{font-size:20px;font-weight:600;color:#243342;letter-spacing:-.01em}",
      ".l03-select{display:flex;align-items:center;gap:7px;background:#fff;border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;font-size:11.5px;color:#4d5d6d;white-space:nowrap}",
      ".l03-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px}",
      ".l03-icard{background:#fff;border:1px solid #e8edf3;border-radius:7px;overflow:hidden}",
      ".l03-icbody{padding:11px 12px 9px}",
      ".l03-irow{display:flex;align-items:center;gap:6px;justify-content:space-between}",
      ".l03-iname{font-size:13.5px;font-weight:600;color:#243342;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".l03-ipill{flex:none;font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:999px;white-space:nowrap}",
      ".l03-ipill.pending{background:#fdf3df;color:#95661a}.l03-ipill.overdue{background:#fdeaea;color:#a83b37}.l03-ipill.paid{background:#e7f5ec;color:#1d7a4e}",
      ".l03-iamt{margin-top:5px;font-size:19px;font-weight:600;color:#4f57c8;letter-spacing:-.01em;white-space:nowrap}",
      ".l03-imeta{margin-top:3px;font-size:10.5px;color:#8b98a6}",
      ".l03-ift{display:flex;align-items:center;justify-content:center;gap:3px;border-top:1px solid #eef2f6;padding:7px;font-size:10.5px;color:#5b7f95;font-weight:600}",
      ".l03-read{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;margin-top:10px;font-size:10.5px}",
      ".l03-rb{background:rgba(255,255,255,.8);border:1px solid #d9e1ea;border-radius:999px;padding:2px 8px;color:#4d5d6d;font-variant-numeric:tabular-nums}",
      ".l03-rb b{color:#243342;font-weight:700}",
      ".l03-verdict2{width:100%;box-sizing:border-box;margin-top:8px;font-size:11.5px;font-weight:600;line-height:1.5;color:#8a5b14;background:#fdf1e2;border-radius:6px;padding:6px 10px}",
      ".l03-verdict2.ok{color:#1d6b48;background:#e7f4ec}",
      "@container (max-width:540px){.l03-card,.l03-formcard,.l03-verdict{max-width:none}.l03-formcard{padding:16px 15px}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  var IC = {
    board: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/></svg>',
    doc: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 1.8h5l3.2 3.2V14H4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 7h4M6 9.5h4M6 12h2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    card: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="1.8" y="3.6" width="12.4" height="8.8" rx="1.6" stroke="currentColor" stroke-width="1.4"/><path d="M1.8 6.6h12.4" stroke="currentColor" stroke-width="1.4"/></svg>',
    clock: '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.4"/><path d="M8 4.6V8l2.4 1.6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    search: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.4" stroke="currentColor" stroke-width="1.6"/><path d="M10.4 10.4L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    bell: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6.5a4 4 0 018 0c0 3 .8 4 1.2 4.4H2.8C3.2 10.5 4 9.5 4 6.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6.4 13a1.7 1.7 0 003.2 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    gear: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="2.4" stroke="currentColor" stroke-width="1.4"/><path d="M8 1.8v1.6M8 12.6v1.6M1.8 8h1.6M12.6 8h1.6M3.6 3.6l1.2 1.2M11.2 11.2l1.2 1.2M12.4 3.6l-1.2 1.2M4.8 11.2l-1.2 1.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    cal: '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="2.2" y="3.4" width="11.6" height="10.4" rx="1.4" stroke="currentColor" stroke-width="1.4"/><path d="M2.2 6.6h11.6M5.4 2v2.4M10.6 2v2.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
  };

  /* ------------------------------------------------------------ 03-3 */
  RUILive.register("03-3", {
    build: function (body) {
      var state = { pad: 32, gap: 18 };
      var BARS = [
        { s: "5 星", p: 56 }, { s: "4 星", p: 20 }, { s: "3 星", p: 14 },
        { s: "2 星", p: 2 }, { s: "1 星", p: 8 }
      ];

      var rows = K.el("div", { class: "l03-rows" });
      BARS.forEach(function (b) {
        var fill = K.el("span", { class: "l03-fill" });
        fill.style.width = b.p + "%";
        rows.appendChild(K.el("div", { class: "l03-brow" }, [
          K.el("span", { class: "l03-blabel", text: b.s }),
          K.el("span", { class: "l03-track" }, [fill]),
          K.el("span", { class: "l03-pct", text: b.p + "%" })
        ]));
      });

      var cta = K.el("div", {}, [
        K.el("div", { class: "l03-ctat", text: "写下你的评价" }),
        K.el("div", { class: "l03-ctad", text: "把你的使用感受分享给其他买家。" }),
        K.el("button", { class: "l03-ctab", type: "button", text: "写评价" })
      ]);
      var card = K.el("div", { class: "l03-card" }, [
        K.el("div", { class: "l03-rtitle", text: "50 条商品评价" }),
        rows,
        cta
      ]);

      function paint() {
        card.style.padding = state.pad + "px";
        Array.prototype.forEach.call(rows.children, function (r, i) {
          r.style.marginTop = i === 0 ? (state.gap * 0.7) + "px" : state.gap + "px";
        });
        cta.style.marginTop = Math.round(state.gap * 1.9) + "px";
      }
      paint();

      var padR = K.range({
        label: "卡片内边距",
        min: 12, max: 48, step: 1, value: 32,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.pad = v; paint(); }
      });
      var gapR = K.range({
        label: "条目间距",
        min: 6, max: 40, step: 1, value: 18,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.gap = v; paint(); }
      });

      body.appendChild(K.controls([padR.el, gapR.el]));
      var canvas = K.canvas("l03-canvas");
      canvas.appendChild(K.el("div", { class: "l03-wrap" }, [card]));
      body.appendChild(canvas);
      body.appendChild(K.note("留白几乎总是被一点点加上去的，结果每个元素只拿到「不至于明显很糟」的空间。更好的做法反过来：<b>先给足，再慢慢减</b>——单独看觉得「稍多」的留白，放进完整界面往往刚刚好。"));
    }
  });

  /* ----------------------------------------------------------- 03-36 */
  RUILive.register("03-36", {
    build: function (body) {
      var state = { inGap: 10, between: 20, grouped: false };
      var FIELDS = [
        { l: "姓名", p: "张伟" },
        { l: "街道地址", p: "建国路 88 号 12 层" },
        { l: "城市", p: "北京" },
        { l: "省 / 直辖市", p: "北京市" },
        { l: "地区", p: "朝阳区" },
        { l: "邮政编码", p: "100022" }
      ];

      var groups = FIELDS.map(function (f) {
        var label = K.el("label", { class: "l03-glabel", text: f.l });
        var input = K.el("input", { class: "l03-input", type: "text", placeholder: f.p });
        label.setAttribute("for", "l03-f-" + f.l);
        input.id = "l03-f-" + f.l;
        return K.el("div", { class: "l03-group" }, [label, input]);
      });
      var card = K.el("div", { class: "l03-formcard" }, [
        K.el("div", { class: "l03-fhead" }, [
          K.el("span", { class: "l03-kick", text: "2 · 账单地址" }),
          K.el("button", { class: "l03-link", type: "button", text: "帮别人购买？" })
        ])
      ].concat(groups));
      var verdict = K.el("div", { class: "l03-verdict" });

      function paint() {
        card.classList.toggle("is-grouped", state.grouped);
        groups.forEach(function (g) {
          g.querySelector(".l03-glabel").style.marginBottom = state.inGap + "px";
          g.querySelector(".l03-input").style.marginBottom = state.between + "px";
        });
        if (state.grouped) {
          verdict.className = "l03-verdict ok";
          verdict.textContent = "分组底色一加，归属立刻清楚——可见的分隔甚至比间距更直接。";
        } else if (state.between > state.inGap + 2) {
          verdict.className = "l03-verdict ok";
          verdict.textContent = "组周围比组内更空：标签和输入框的从属关系一眼就能看出来。";
        } else {
          verdict.className = "l03-verdict warn";
          verdict.textContent = "组内和组间一样大：标签到底配哪个输入框？读者得靠猜。";
        }
      }
      paint();

      var inR = K.range({
        label: "标签与输入框间距",
        min: 0, max: 28, step: 1, value: 10,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.inGap = v; paint(); }
      });
      var betweenR = K.range({
        label: "字段组之间间距",
        min: 4, max: 48, step: 1, value: 20,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.between = v; paint(); }
      });
      var groupT = K.toggle({
        label: "给每组加底色",
        checked: false,
        onChange: function (c) { state.grouped = c; paint(); }
      });

      body.appendChild(K.controls([inR.el, betweenR.el, groupT.el]));
      var canvas = K.canvas("l03-canvas");
      canvas.appendChild(K.el("div", { class: "l03-wrap" }, [card, verdict]));
      body.appendChild(canvas);
      body.appendChild(K.note("只要你靠间距来关联元素，<b>组周围的空间就必须大于组内</b>：组内 10、组间 20，六个字段立刻分成六组；两者一样大，表单就糊成一片。"));
    }
  });

  /* ----------------------------------------------------------- 03-22 */
  RUILive.register("03-22", {
    build: function (body) {
      var state = { w: 900, pct: true };
      var INVOICES = [
        { n: "Carl Phillips", s: "待付款", c: "pending", a: "US$249.00", t: "2 天前" },
        { n: "Adam Harris", s: "已逾期", c: "overdue", a: "US$612.00", t: "5 天前" },
        { n: "Mary Butler", s: "已付款", c: "paid", a: "US$180.00", t: "3 天前" },
        { n: "Kelly Soto", s: "已付款", c: "paid", a: "US$320.00", t: "1 天前" }
      ];
      var NAV = [
        { i: IC.board, t: "仪表盘", on: true },
        { i: IC.doc, t: "发票" },
        { i: IC.card, t: "支出" },
        { i: IC.clock, t: "工时追踪" }
      ];

      var cards = INVOICES.map(function (v) {
        return K.el("div", { class: "l03-icard" }, [
          K.el("div", { class: "l03-icbody" }, [
            K.el("div", { class: "l03-irow" }, [
              K.el("span", { class: "l03-iname", text: v.n }),
              K.el("span", { class: "l03-ipill " + v.c, text: v.s })
            ]),
            K.el("div", { class: "l03-iamt", text: v.a }),
            K.el("div", { class: "l03-imeta", text: v.t })
          ]),
          K.el("div", { class: "l03-ift", html: "查看发票 <span aria-hidden=\"true\">›</span>" })
        ]);
      });

      var side = K.el("aside", { class: "l03-side" }, [
        K.el("div", { class: "l03-logo", "aria-hidden": "true" }, [K.el("i"), K.el("i")]),
        K.el("div", { class: "l03-nbtn", text: "+ 新建发票" }),
        K.el("nav", { class: "l03-nav", "aria-label": "主导航" }, NAV.map(function (n) {
          return K.el("div", { class: "l03-nitem" + (n.on ? " is-on" : ""), html: n.i + "<span>" + n.t + "</span>" });
        })),
        K.el("div", { class: "l03-side-note", text: "本月已开 12 张发票" }),
        K.el("div", { class: "l03-user" }, [
          K.el("span", { class: "l03-uavt" }),
          K.el("div", { class: "l03-uinfo" }, [
            K.el("div", { class: "l03-uname", text: "Mia Chen" }),
            K.el("div", { class: "l03-umail", text: "mia.chen@invoicer.app" })
          ])
        ])
      ]);

      var main = K.el("div", { class: "l03-main" }, [
        K.el("div", { class: "l03-top" }, [
          K.el("div", { class: "l03-search", html: IC.search + "<span>搜索发票…</span>" }),
          K.el("span", { class: "l03-ico", html: IC.bell }),
          K.el("span", { class: "l03-ico", html: IC.gear }),
          K.el("span", { class: "l03-tavt" })
        ]),
        K.el("div", { class: "l03-content" }, [
          K.el("div", { class: "l03-chead" }, [
            K.el("div", { class: "l03-h1", text: "仪表盘" }),
            K.el("div", { class: "l03-select", html: IC.cal + "<span>最近 30 天</span><span aria-hidden=\"true\">⌄</span>" })
          ]),
          K.el("div", { class: "l03-grid" }, cards)
        ])
      ]);

      var app = K.el("div", { class: "l03-app" }, [
        K.el("div", { class: "l03-chrome" }, [
          K.el("div", { class: "l03-dots" }, [
            K.el("span", { class: "l03-dot a" }),
            K.el("span", { class: "l03-dot b" }),
            K.el("span", { class: "l03-dot c" })
          ]),
          K.el("span", { class: "l03-url", text: "invoicer.app/dashboard" })
        ]),
        K.el("div", { class: "l03-body" }, [side, main])
      ]);

      var holder = K.el("div", { class: "l03-holder" }, [app]);
      var frame = K.el("div", { class: "l03-frame" }, [holder]);
      var read = K.el("div", { class: "l03-read" });
      var verdict = K.el("div", { class: "l03-verdict2" });
      var wrap = K.el("div", { class: "l03-wrap" }, [frame, read, verdict]);

      function badge(label, val) {
        var b = K.el("span", { class: "l03-rb", html: label + " <b>" + val + "</b>" });
        return b;
      }

      function paint() {
        var avail = frame.clientWidth || 640;
        app.style.width = state.w + "px";
        var sideW = state.pct ? Math.round(state.w * 0.25) : 220;
        side.style.width = sideW + "px";
        var h = app.offsetHeight || 1;
        var s = Math.min(1, avail / state.w);
        holder.style.width = Math.round(state.w * s) + "px";
        holder.style.height = Math.round(h * s) + "px";
        app.style.transform = "scale(" + s + ")";

        var mainW = state.w - sideW;
        var cols = Math.max(1, Math.floor((mainW - 36 + 12) / 180));
        read.innerHTML = "";
        read.appendChild(badge("模拟屏幕", state.w + "px"));
        read.appendChild(badge("侧栏", sideW + "px"));
        read.appendChild(badge("主内容", mainW + "px"));
        read.appendChild(badge("每行", cols + " 张"));

        verdict.className = "l03-verdict2" + (state.pct ? "" : " ok");
        if (!state.pct) {
          verdict.textContent = "侧栏固定 220px（按内容定），窗口再宽也先喂饱主内容——这才是真正会伸缩的地方。";
        } else if (sideW > 260) {
          verdict.textContent = "侧栏被撑到 " + sideW + "px，右半边空着，主内容白白少了一截。";
        } else if (sideW < 200) {
          verdict.textContent = "侧栏只剩 " + sideW + "px：邮箱被截断，导航挤成一团。";
        } else {
          verdict.textContent = "中等屏幕上百分比侧栏勉强能用——但它的宽度会跟着窗口一直变。";
        }
      }

      function onResize() {
        if (!app.isConnected) { window.removeEventListener("resize", onResize); return; }
        paint();
      }

      var wR = K.range({
        label: "模拟屏幕宽度",
        min: 620, max: 1120, step: 10, value: 900,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.w = v; paint(); }
      });
      var sideSeg = K.seg({
        label: "侧栏宽度",
        options: [{ value: "pct", label: "按 25% 栅格" }, { value: "fixed", label: "固定 220px" }],
        value: "pct",
        onChange: function (v) { state.pct = v === "pct"; paint(); }
      });

      body.appendChild(K.controls([wR.el, sideSeg.el]));
      var canvas = K.canvas("l03-canvas");
      canvas.appendChild(wrap);
      body.appendChild(canvas);
      window.addEventListener("resize", onResize);
      paint();
      body.appendChild(K.note("侧栏是「按 25% 栅格」还是「给内容优化过的固定宽度」？<b>主内容区该弹性伸缩，侧栏不该</b>——不然大屏上它空出一大片，小屏上它又挤得没法用。"));
    }
  });
})();
