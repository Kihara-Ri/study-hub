/* 第 2 章 · 实时重制图：层级就是一切
   02-2 仪表盘层级 / 02-5 旅行卡三要素 / 02-29 操作层级 */
(function () {
  "use strict";
  var K = window.RUILive.kit;

  if (!document.getElementById("lv-02-style")) {
    var st = document.createElement("style");
    st.id = "lv-02-style";
    st.textContent = [
      ".l02-canvas{background:#e9eef4;border-color:#d7dfe8}",
      ".l02-wrap{width:100%;display:flex;justify-content:center;container-type:inline-size}",

      /* ---------- 02-2 仪表盘 ---------- */
      ".l02-dash{width:100%;max-width:660px;background:#eef2f7;border:1px solid #dfe6ee;border-radius:10px;overflow:hidden;color:#1e2a38;font-family:var(--font-ui);line-height:1.45;text-align:left}",
      ".l02-dash *{box-sizing:border-box}",
      ".l02-nav{display:flex;align-items:center;gap:16px;padding:11px 16px;border-bottom:1px solid #e2e8f0}",
      ".l02-logo{flex:none;display:flex;color:#4a7aa8}",
      ".l02-navitems{display:flex;align-items:center;gap:15px;flex:1;min-width:0;overflow:hidden}",
      ".l02-navitem{font-size:12.5px;color:#7d8b9b;white-space:nowrap}",
      ".l02-navitem.is-on{color:#1e2a38;font-weight:700}",
      ".l02-avt{width:24px;height:24px;border-radius:50%;flex:none;background:linear-gradient(135deg,#a9c2d2,#d8a06c)}",
      ".l02-pad{padding:14px 16px 16px}",
      ".l02-head{display:flex;align-items:baseline;justify-content:space-between;gap:4px 10px;flex-wrap:wrap;margin-bottom:10px}",
      ".l02-h2{font-size:22px;font-weight:400;color:#233040;letter-spacing:-.01em}",
      ".l02-date{font-size:11px;color:var(--m2,#6b7a8a);white-space:nowrap}",
      ".l02-band{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:#5b87ad;border-radius:8px;overflow:hidden;border:1px solid transparent;transition:background .18s,border-color .18s}",
      ".l02-stat{padding:11px 13px;border-left:1px solid rgba(255,255,255,.2);min-width:0}",
      ".l02-stat:first-child{border-left:0}",
      ".l02-statl{display:block;font-size:9.5px;letter-spacing:.1em;color:#d5e3ee;margin-bottom:3px}",
      ".l02-statv{display:block;font-size:22px;font-weight:500;color:#fff;letter-spacing:-.01em;white-space:nowrap}",
      ".l02-statg{display:block;font-size:11px;color:#cfe0ee;margin-top:2px;white-space:nowrap}",
      ".l02-tabs{display:flex;align-items:center;gap:4px;margin:12px 0 10px;overflow:hidden}",
      ".l02-tab{font-size:12px;color:var(--m2,#6b7a8a);padding:4px 10px;border-radius:999px;white-space:nowrap}",
      ".l02-tab.is-on{background:#dde5ee;color:#233040;font-weight:600}",
      ".l02-tbl{background:#fff;border:1px solid #e6ecf3;border-radius:8px;overflow:hidden}",
      ".l02-tr{display:grid;grid-template-columns:minmax(84px,1.5fr) 50px 62px 72px minmax(70px,1fr) auto;gap:8px;align-items:center;padding:8px 11px;border-top:1px solid #eef2f7}",
      ".l02-tr:first-child{border-top:0}",
      ".l02-thead{padding:7px 11px;background:#fbfcfe}",
      ".l02-th{font-size:9.5px;letter-spacing:.06em;color:var(--m3,#8592a2);white-space:nowrap}",
      ".l02-td{font-size:11.5px;color:#33414f;white-space:nowrap}",
      ".l02-r{text-align:right}",
      ".l02-nm{font-size:12px;font-weight:600;color:#1e2a38;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".l02-sym{font-size:9.5px;color:var(--m3,#8592a2);white-space:nowrap}",
      ".l02-gain{font-size:11.5px;font-weight:600;color:#128a60;white-space:nowrap}",
      ".l02-gain.is-down{color:#cf5a52}",
      ".l02-gp{display:block;font-size:9.5px;font-weight:500;color:#3fa580}",
      ".l02-gain.is-down .l02-gp{color:#d98c86}",
      ".l02-mini{display:flex;gap:5px;justify-content:flex-end}",
      ".l02-mini button{font-family:inherit;font-size:10px;color:#33414f;background:#fff;border:1px solid #d5dde7;border-radius:4px;padding:3px 8px;cursor:pointer;white-space:nowrap}",
      ".l02-mini button:hover{border-color:#9fb2c4;background:#f7f9fc}",
      ".l02-dash.is-flat .l02-h2{font-size:15px;font-weight:400}",
      ".l02-dash.is-flat .l02-date{font-size:14px}",
      ".l02-dash.is-flat .l02-navitem,.l02-dash.is-flat .l02-navitem.is-on{font-size:13px;font-weight:400;color:#33414f}",
      ".l02-dash.is-flat .l02-tab,.l02-dash.is-flat .l02-tab.is-on{font-weight:400;font-size:12.5px}",
      ".l02-dash.is-flat .l02-statl{font-size:11px;letter-spacing:0}",
      ".l02-dash.is-flat .l02-statv{font-size:15px;font-weight:400}",
      ".l02-dash.is-flat .l02-statg{font-size:12px}",
      ".l02-dash.is-flat .l02-th{font-size:11.5px;letter-spacing:0;color:#33414f}",
      ".l02-dash.is-flat .l02-nm,.l02-dash.is-flat .l02-td{font-size:11.5px;font-weight:400}",
      ".l02-dash.is-flat .l02-mini button{color:#1e2a38;background:#fff;border-color:#1e2a38}",
      ".l02-dash.is-noband .l02-band{background:#fff;border-color:#e2e8f0}",
      ".l02-dash.is-noband .l02-statl{color:#7d8b9b}",
      ".l02-dash.is-noband .l02-statv{color:#233040}",
      ".l02-dash.is-noband .l02-statg{color:#7d8b9b}",
      "@container (max-width:540px){.l02-cq,.l02-cp,.l02-cv{display:none!important}.l02-tr{grid-template-columns:minmax(62px,1.2fr) minmax(66px,1fr) auto;gap:6px;padding:8px 9px}.l02-band{grid-template-columns:1fr 1fr}.l02-stat:nth-child(3){display:none}.l02-statv{font-size:17px}.l02-stat{padding:9px 10px}.l02-pad{padding:12px}.l02-h2{font-size:19px}.l02-nav{gap:10px;padding:10px 12px}.l02-navitems{gap:11px}.l02-ni4,.l02-ni5{display:none}}",

      /* ---------- 02-5 旅行卡 ---------- */
      ".l02-tour{display:flex;width:100%;max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 18px 40px -28px rgba(20,32,45,.45);color:#17303f;font-family:var(--font-ui);text-align:left}",
      ".l02-photo{position:relative;width:42%;min-width:140px;flex:none;overflow:hidden;background:linear-gradient(#cbdae5,#e6edf1 72%)}",
      ".l02-house{position:absolute;bottom:14%;display:block}",
      ".l02-water{position:absolute;left:0;right:0;bottom:0;height:14%;background:linear-gradient(#75909e,#41606f)}",
      ".l02-water::after{content:'';position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.16) 0 1px,transparent 1px 5px);opacity:.7}",
      ".l02-tree{position:absolute;left:36%;bottom:12%;width:23%;height:46%;border-radius:52% 48% 42% 40%;background:radial-gradient(circle at 38% 28%,#8fae67,#4c6b3c 72%);box-shadow:inset -5px -7px 10px rgba(0,0,0,.18)}",
      ".l02-tbody{flex:1;min-width:0;padding:22px 24px;display:flex;flex-direction:column}",
      ".l02-tt{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.15;color:#17303f}",
      ".l02-tdsc{margin-top:8px;font-size:18px;line-height:1.5;color:var(--soft,#465f6c)}",
      ".l02-price{margin-top:14px;font-size:20px;font-weight:700;color:#17303f}",
      ".l02-price em{font-style:normal;font-weight:400;color:var(--soft,#465f6c)}",
      ".l02-rev{display:flex;align-items:center;gap:8px;margin-top:5px;font-size:16px;color:var(--soft,#465f6c)}",
      ".l02-stars{color:#1f9d72;letter-spacing:1.5px;font-size:15px}",
      ".l02-foot{margin-top:11px;font-size:15px;line-height:1.45;color:var(--soft2,#748b98)}",
      ".l02-book{margin-top:16px;align-self:flex-end;border:0;border-radius:8px;background:#4353d8;color:#fff;font:inherit;font-size:15px;font-weight:700;padding:11px 22px;cursor:pointer;white-space:nowrap}",
      ".l02-book:hover{background:#3542b8}",
      "@container (max-width:520px){.l02-tour{flex-direction:column}.l02-photo{width:100%;height:148px}.l02-tbody{padding:16px 18px}.l02-book{align-self:stretch}}",

      /* ---------- 02-29 操作层级 ---------- */
      ".l02-shell{position:relative;width:100%;display:flex;justify-content:center}",
      ".l02-list{display:flex;width:100%;max-width:600px;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 18px 40px -28px rgba(20,32,45,.4);color:#14364f;font-family:var(--font-ui);text-align:left}",
      ".l02-stool{position:relative;width:38%;min-width:128px;flex:none;overflow:hidden;background:linear-gradient(152deg,#a8c9db,#cfe2ec 62%,#b6d2df)}",
      ".l02-seat{position:absolute;left:23%;top:21%;width:55%;height:11%;background:linear-gradient(#e7e0d1,#cbc1ac);clip-path:polygon(8% 0,100% 14%,92% 100%,0 78%)}",
      ".l02-leg{position:absolute;width:5%;background:linear-gradient(90deg,#d9d1be,#b8ad96);border-radius:1px}",
      ".l02-leg.a{left:27%;top:32%;height:41%;transform:rotate(6deg)}",
      ".l02-leg.b{left:45%;top:32%;height:40%;transform:rotate(3deg)}",
      ".l02-leg.c{left:66%;top:32%;height:41%;transform:rotate(-5deg)}",
      ".l02-leg.d{left:71%;top:31%;height:39%;transform:rotate(-9deg)}",
      ".l02-bar{position:absolute;left:28%;width:46%;height:2%;background:#c0b59e;border-radius:1px}",
      ".l02-bar.x1{top:55%;transform:rotate(2deg)}",
      ".l02-bar.x2{top:67%;transform:rotate(-1deg)}",
      ".l02-shadow{position:absolute;left:16%;bottom:7%;width:64%;height:8%;background:radial-gradient(ellipse,rgba(18,38,52,.24),transparent 70%)}",
      ".l02-lbody{flex:1;min-width:0;padding:18px 20px;display:flex;flex-direction:column;gap:3px}",
      ".l02-ltop{display:flex;align-items:flex-start;gap:10px}",
      ".l02-lt{font-size:20px;font-weight:700;color:#14364f;line-height:1.25;flex:1;min-width:0}",
      ".l02-lprice{font-size:20px;font-weight:700;color:#14364f;white-space:nowrap}",
      ".l02-lsub{font-size:13px;color:#6d8a96;margin-top:1px}",
      ".l02-ldsc{margin-top:6px;font-size:13.5px;line-height:1.55;color:#5d7580}",
      ".l02-pill{display:inline-flex;align-items:center;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap}",
      ".l02-pill--draft{background:#fdf3df;color:#8f5f16}",
      ".l02-pill--sale{background:#e5f4ec;color:#1c7a51}",
      ".l02-acts{display:flex;align-items:center;gap:9px;margin-top:auto;padding-top:14px;flex-wrap:wrap}",
      ".l02-act{border:0;font-family:inherit;font-size:12.5px;font-weight:700;border-radius:6px;padding:8px 15px;cursor:pointer;white-space:nowrap}",
      ".l02-act:hover{filter:brightness(.94)}",
      ".l02-act--link{background:none;color:#2f6f7f;padding:8px 2px;margin-right:auto}",
      ".l02-act--link:hover{text-decoration:underline;filter:none}",
      ".l02-act--ghost{background:#e9eff4;color:#5c8095}",
      ".l02-act--primary{background:#3c7689;color:#fff}",
      ".l02-act--danger{background:#d9534f;color:#fff}",
      ".l02-act--info{background:#2f6fae;color:#fff}",
      ".l02-act--ok{background:#2f9e6e;color:#fff}",
      ".l02-act--warn{background:#d99a2b;color:#fff}",
      ".l02-list.is-empty{display:block;background:#fff}",
      ".l02-empty{padding:34px 20px;text-align:center;color:#5d7580;font-size:13px}",
      ".l02-empty b{display:block;font-size:15px;color:#14364f;margin-bottom:6px}",
      ".l02-undo{margin-top:10px;border:0;background:none;color:#2f6f7f;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;text-decoration:underline}",
      ".l02-modal{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:12px;z-index:5}",
      ".l02-modal[hidden]{display:none}",
      ".l02-backdrop{position:absolute;inset:0;background:rgba(13,24,34,.46);border-radius:10px}",
      ".l02-dialog{position:relative;width:100%;max-width:290px;background:#fff;border-radius:10px;padding:18px;box-shadow:0 24px 50px -20px rgba(10,20,30,.5);text-align:left;font-family:var(--font-ui)}",
      ".l02-dlg-t{font-size:15px;font-weight:700;color:#14364f}",
      ".l02-dlg-d{margin-top:6px;font-size:12.5px;line-height:1.6;color:#5d7580}",
      ".l02-dlg-a{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}",
      ".l02-dlg-a .l02-act{font-size:12px;padding:7px 13px}",
      "@container (max-width:520px){.l02-list{flex-direction:column}.l02-stool{width:100%;height:132px}.l02-lbody{padding:14px 16px}.l02-lt,.l02-lprice{font-size:17px}}"
    ].join("\n");
    document.head.appendChild(st);
  }

  var LOGO = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 17l5.5-5.5 3.4 3.4L21 6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.6 6H21v5.4" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function muted(t, base, span, s) {
    return "hsl(210 " + s + "% " + (base + span * t).toFixed(1) + "%)";
  }

  /* ------------------------------------------------------------ 02-2 */
  RUILive.register("02-2", {
    build: function (body) {
      var state = { flat: false, mute: 58, band: true };
      var NAV = ["总览", "行情", "交易", "订单", "自选"];
      var ROWS = [
        { n: "苹果", sym: "AAPL", q: "12", p: "$189.20", v: "$2,270.40", g: "+$184.20", gp: "+8.8%", down: false },
        { n: "英伟达", sym: "NVDA", q: "8", p: "$721.50", v: "$5,772.00", g: "+$361.10", gp: "+6.7%", down: false },
        { n: "特斯拉", sym: "TSLA", q: "6", p: "$242.80", v: "$1,456.80", g: "−$59.40", gp: "−3.9%", down: true }
      ];

      function stat(label, value, gain) {
        var cells = [
          K.el("span", { class: "l02-statl", text: label }),
          K.el("span", { class: "l02-statv", text: value })
        ];
        if (gain) cells.push(K.el("span", { class: "l02-statg", text: gain }));
        return K.el("div", { class: "l02-stat" }, cells);
      }

      var rows = ROWS.map(function (r) {
        return K.el("div", { class: "l02-tr" }, [
          K.el("span", { style: { minWidth: "0" } }, [
            K.el("span", { class: "l02-nm", text: r.n }),
            K.el("span", { class: "l02-sym", text: " " + r.sym })
          ]),
          K.el("span", { class: "l02-td l02-r l02-cq", text: r.q }),
          K.el("span", { class: "l02-td l02-r l02-cp", text: r.p }),
          K.el("span", { class: "l02-td l02-r l02-cv", text: r.v }),
          K.el("span", { class: "l02-gain " + (r.down ? "is-down" : ""), html: r.g + '<span class="l02-gp">' + r.gp + "</span>" }),
          K.el("span", { class: "l02-mini" }, [
            K.el("button", { type: "button", text: "买入" }),
            K.el("button", { type: "button", text: "卖出" })
          ])
        ]);
      });

      var app = K.el("div", { class: "l02-dash" }, [
        K.el("div", { class: "l02-nav" }, [
          K.el("span", { class: "l02-logo", html: LOGO }),
          K.el("div", { class: "l02-navitems" }, NAV.map(function (t, i) {
            return K.el("span", { class: "l02-navitem" + (i === 0 ? " is-on" : "") + " l02-ni" + (i + 1), text: t });
          })),
          K.el("span", { class: "l02-avt" })
        ]),
        K.el("div", { class: "l02-pad" }, [
          K.el("div", { class: "l02-head" }, [
            K.el("span", { class: "l02-h2", text: "总览" }),
            K.el("span", { class: "l02-date", text: "截至 12 月 11 日 8:00" })
          ]),
          K.el("div", { class: "l02-band" }, [
            stat("总资产", "$16,412.92", "+$648.83"),
            stat("投资", "15,606.14", "+$648.83"),
            stat("现金", "$806.78", "")
          ]),
          K.el("div", { class: "l02-tabs" }, ["持仓", "动态", "表现", "盈亏"].map(function (t, i) {
            return K.el("span", { class: "l02-tab" + (i === 0 ? " is-on" : ""), text: t });
          })),
          K.el("div", { class: "l02-tbl" }, [
            K.el("div", { class: "l02-tr l02-thead" }, [
              K.el("span", { class: "l02-th", text: "名称" }),
              K.el("span", { class: "l02-th l02-r l02-cq", text: "数量" }),
              K.el("span", { class: "l02-th l02-r l02-cp", text: "价格" }),
              K.el("span", { class: "l02-th l02-r l02-cv", text: "市值" }),
              K.el("span", { class: "l02-th l02-r", text: "盈亏" }),
              K.el("span", { class: "l02-th l02-r", text: "操作" })
            ])
          ].concat(rows))
        ])
      ]);

      function paint() {
        var t = state.mute / 100;
        app.style.setProperty("--m2", muted(t, 24, 46, 14));
        app.style.setProperty("--m3", muted(t, 32, 44, 12));
        app.classList.toggle("is-flat", state.flat);
        app.classList.toggle("is-noband", !state.band);
      }
      paint();

      var seg = K.seg({
        label: "字号与字重",
        options: [{ value: "split", label: "分出主次" }, { value: "flat", label: "全部同级" }],
        value: "split",
        onChange: function (v) { state.flat = v === "flat"; paint(); }
      });
      var range = K.range({
        label: "次要文字弱化",
        min: 0, max: 100, step: 1, value: 58,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.mute = v; paint(); }
      });
      var toggle = K.toggle({
        label: "主指标底色",
        checked: true,
        onChange: function (c) { state.band = c; paint(); }
      });

      body.appendChild(K.controls([seg.el, range.el, toggle.el]));
      var canvas = K.canvas("l02-canvas");
      canvas.appendChild(K.el("div", { class: "l02-wrap" }, [app]));
      body.appendChild(canvas);
      body.appendChild(K.note("书里那张「改好之后」的仪表盘，配色、字体、布局一样都没动，只是<b>刻意弱化了次要信息、突出了主指标</b>——层级就是这么来的。"));
    }
  });

  /* ------------------------------------------------------------ 02-5 */
  var HOUSES = [
    { w: 19, h: 74, c: "#7c5c4a", gable: true },
    { w: 16, h: 62, c: "#8a4f42", gable: false },
    { w: 22, h: 82, c: "#5f4a3e", gable: true },
    { w: 17, h: 64, c: "#7d6350", gable: true },
    { w: 20, h: 70, c: "#4d5f56", gable: false },
    { w: 24, h: 58, c: "#6d5445", gable: true }
  ];

  RUILive.register("02-5", {
    build: function (body) {
      var state = { size: 30, weight: "800", mute: 30 };

      var houses = K.el("div", { class: "l02-photo" }, [K.el("span", { class: "l02-water" })]);
      var total = HOUSES.reduce(function (a, b) { return a + b.w; }, 0);
      var acc = 0;
      HOUSES.forEach(function (h) {
        var w = (h.w / total) * 100;
        var d = K.el("span", { class: "l02-house" });
        d.style.left = acc + "%";
        d.style.width = w + "%";
        d.style.height = h.h + "%";
        d.style.background = "repeating-linear-gradient(90deg,transparent 0 5px,rgba(246,233,202,.55) 5px 9px,transparent 9px 15px),repeating-linear-gradient(0deg,transparent 0 6px,rgba(246,233,202,.5) 6px 10px,transparent 10px 15px)," + h.c;
        if (h.gable) d.style.clipPath = "polygon(0 24%,50% 0,100% 24%,100% 100%,0 100%)";
        houses.appendChild(d);
        acc += w;
      });
      houses.appendChild(K.el("span", { class: "l02-tree" }));

      var title = K.el("div", { class: "l02-tt", text: "阿姆斯特丹徒步之旅" });
      var desc = K.el("div", { class: "l02-tdsc", text: "走访热门地标，也钻进游客不知道的隐秘小巷。" });
      var price = K.el("div", { class: "l02-price", html: "$17 <em>每人*</em>" });
      var rev = K.el("div", { class: "l02-rev" }, [
        K.el("span", { class: "l02-stars", text: "★★★★★" }),
        K.el("span", { text: "28 条评价" })
      ]);
      var foot = K.el("div", { class: "l02-foot", text: "*价格会随所选日期浮动。" });
      var btn = K.el("button", { class: "l02-book", type: "button", text: "立即预订" });
      var tbody = K.el("div", { class: "l02-tbody" }, [title, desc, price, rev, foot, btn]);
      var card = K.el("div", { class: "l02-tour" }, [houses, tbody]);

      function paint() {
        var t = state.mute / 100;
        title.style.fontSize = state.size + "px";
        title.style.fontWeight = state.weight;
        card.style.setProperty("--soft", "hsl(201 " + (20 - t * 5) + "% " + (20 + 46 * t).toFixed(1) + "%)");
        card.style.setProperty("--soft2", "hsl(203 15% " + (32 + 40 * t).toFixed(1) + "%)");
      }
      paint();

      var sizeR = K.range({
        label: "标题字号",
        min: 20, max: 40, step: 1, value: 30,
        format: function (v) { return v + "px"; },
        onInput: function (v) { state.size = v; paint(); }
      });
      var weightSeg = K.seg({
        label: "标题字重",
        options: [{ value: "400", label: "常规" }, { value: "600", label: "中粗" }, { value: "800", label: "特粗" }],
        value: "800",
        onChange: function (v) { state.weight = v; paint(); }
      });
      var muteR = K.range({
        label: "辅助文字弱化",
        min: 0, max: 100, step: 1, value: 30,
        format: function (v) { return v + "%"; },
        onInput: function (v) { state.mute = v; paint(); }
      });

      body.appendChild(K.controls([sizeR.el, weightSeg.el, muteR.el]));
      var canvas = K.canvas("l02-canvas");
      canvas.appendChild(K.el("div", { class: "l02-wrap" }, [card]));
      body.appendChild(canvas);
      body.appendChild(K.note("别把重活全交给字号：<b>一个字重、一种更灰的颜色</b>，就能把辅助信息压下去，还不牺牲可读性。常用颜色留两三种、字重留两种，足够了。"));
    }
  });

  /* ----------------------------------------------------------- 02-29 */
  RUILive.register("02-29", {
    build: function (body) {
      var state = { sem: false, draft: true, deleted: false };

      var stool = K.el("div", { class: "l02-stool" }, [
        K.el("span", { class: "l02-shadow" }),
        K.el("span", { class: "l02-leg a" }), K.el("span", { class: "l02-leg b" }),
        K.el("span", { class: "l02-leg c" }), K.el("span", { class: "l02-leg d" }),
        K.el("span", { class: "l02-bar x1" }), K.el("span", { class: "l02-bar x2" }),
        K.el("span", { class: "l02-seat" })
      ]);
      var card = K.el("div", { class: "l02-list" });
      var shell = K.el("div", { class: "l02-shell" }, [card]);
      var modal = K.el("div", { class: "l02-modal", hidden: true });
      shell.appendChild(modal);

      function close() { modal.hidden = true; }
      function open() {
        modal.innerHTML = "";
        var cancel = K.el("button", { class: "l02-act l02-act--ghost", type: "button", text: "取消" });
        var ok = K.el("button", { class: "l02-act l02-act--danger", type: "button", text: "删除商品" });
        var back = K.el("div", { class: "l02-backdrop" });
        cancel.addEventListener("click", close);
        back.addEventListener("click", close);
        ok.addEventListener("click", function () { state.deleted = true; close(); render(); });
        modal.appendChild(back);
        modal.appendChild(K.el("div", { class: "l02-dialog", role: "dialog", "aria-modal": "true", "aria-label": "删除确认" }, [
          K.el("div", { class: "l02-dlg-t", text: "删除这条商品？" }),
          K.el("div", { class: "l02-dlg-d", text: "删除后无法恢复，买家将看不到这件商品。" }),
          K.el("div", { class: "l02-dlg-a" }, [cancel, ok])
        ]));
        modal.hidden = false;
        cancel.focus();
      }

      function act(role, label, cls) {
        var b = K.el("button", { class: "l02-act " + cls, type: "button", text: label });
        if (role === "delete") b.addEventListener("click", open);
        return b;
      }

      function render() {
        card.innerHTML = "";
        card.className = "l02-list" + (state.sem ? " is-sem" : "") + (state.deleted ? " is-empty" : "");
        if (state.deleted) {
          var undo = K.el("button", { class: "l02-undo", type: "button", text: "撤销删除" });
          undo.addEventListener("click", function () { state.deleted = false; render(); });
          card.appendChild(K.el("div", { class: "l02-empty" }, [
            K.el("b", { text: "这条商品已删除" }),
            K.el("span", { text: "在真实产品里，这一步之后还应该能撤销。" }),
            K.el("div", {}, [undo])
          ]));
          return;
        }

        var draft = state.draft;
        var pill = K.el("span", { class: "l02-pill " + (draft ? "l02-pill--draft" : "l02-pill--sale"), text: draft ? "草稿" : "在售中" });
        var body2 = K.el("div", { class: "l02-lbody" }, [
          K.el("div", { class: "l02-ltop" }, [
            K.el("div", { class: "l02-lt", html: "米色木质吧台凳 " }, [pill]),
            K.el("div", { class: "l02-lprice", text: "$40" })
          ]),
          K.el("div", { class: "l02-lsub", text: "大多伦多地区" }),
          K.el("div", { class: "l02-ldsc", text: "手工打磨的乡村风吧凳。座面留孔，搬动起来很方便。" }),
          K.el("div", { class: "l02-acts" })
        ]);
        var acts = body2.querySelector(".l02-acts");
        var del = act("delete", "删除", state.sem ? "l02-act--danger" : "l02-act--link");
        if (draft) {
          var editC = state.sem ? "l02-act--info" : "l02-act--ghost";
          var pubC = state.sem ? "l02-act--ok" : "l02-act--primary";
          acts.appendChild(del);
          acts.appendChild(act("edit", "编辑", editC));
          acts.appendChild(act("publish", "发布", pubC));
        } else {
          var editC2 = state.sem ? "l02-act--info" : "l02-act--primary";
          var offC = state.sem ? "l02-act--warn" : "l02-act--ghost";
          acts.appendChild(del);
          acts.appendChild(act("off", "下架", offC));
          acts.appendChild(act("edit", "编辑", editC2));
        }
        card.appendChild(stool);
        card.appendChild(body2);
        close();
      }
      render();

      var semSeg = K.seg({
        label: "按钮风格",
        options: [{ value: "h", label: "按层级" }, { value: "s", label: "按语义上色" }],
        value: "h",
        onChange: function (v) { state.sem = v === "s"; render(); }
      });
      var stateSeg = K.seg({
        label: "商品状态",
        options: [{ value: "draft", label: "草稿" }, { value: "sale", label: "在售" }],
        value: "draft",
        onChange: function (v) { state.draft = v === "draft"; render(); }
      });

      body.appendChild(K.controls([semSeg.el, stateSeg.el]));
      var canvas = K.canvas("l02-canvas");
      canvas.appendChild(shell);
      body.appendChild(canvas);
      body.appendChild(K.note("页面上的操作排成一座金字塔：<b>实心留给唯一的主要操作</b>，次要操作退成浅底，第三级做成文字链接。破坏性操作不必又大又红——把那个样式留给确认弹层，点一下「删除」看。"));
    }
  });
})();
