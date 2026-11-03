/* shadow.js — 第 6 章 · 阴影与高度：让元素浮起来或贴下去 */
(function () {
  "use strict";
  var K = window.RUIDemo.kit;
  var STYLE_ID = "sh-style";

  function shadowFor(e, down) {
    if (e < 0.08) return "none";
    var t = e / 4;
    var sign = down ? -1 : 1;
    var y1 = sign * K.lerp(1, 4, t);
    var b1 = K.lerp(2, 8, t);
    var a1 = K.lerp(0.16, 0.03, t);
    var y2 = sign * K.lerp(3, 30, t);
    var b2 = K.lerp(10, 64, t);
    var a2 = K.lerp(0.07, 0.2, t);
    return "0 " + y1.toFixed(1) + "px " + b1.toFixed(1) + "px rgba(20,22,30," + a1.toFixed(3) + "), " +
      "0 " + y2.toFixed(1) + "px " + b2.toFixed(1) + "px rgba(20,22,30," + a2.toFixed(3) + ")";
  }

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent =
      ".sh-wrap{display:grid;gap:15px;width:100%}" +
      ".sh-canvas{position:relative;width:100%;max-width:620px;margin:0 auto;padding:22px;" +
      "border-radius:16px;background:#e9ecf1;font-family:var(--font-ui);color:#1b1b1f}" +
      ".sh-window{position:relative;z-index:1;background:#fff;border-radius:12px;" +
      "padding:13px 16px 8px;border:1px solid rgba(20,22,30,.07)}" +
      ".sh-window__head{display:flex;align-items:center;justify-content:space-between;gap:10px;" +
      "padding-bottom:9px;border-bottom:1px solid #f0f0f3;margin-bottom:2px;font-size:10px;" +
      "font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6b6b75}" +
      ".sh-window__count{font-family:var(--font-mono);font-size:10px;font-weight:600;" +
      "letter-spacing:0;text-transform:none;color:#9a9aa4;background:#f3f3f6;padding:1px 6px;" +
      "border-radius:999px}" +
      ".sh-task{display:flex;align-items:center;gap:10px;padding:9px 0;" +
      "border-bottom:1px solid #f6f6f8;font-size:12.5px;color:#3a3a42}" +
      ".sh-task:last-child{border-bottom:0}" +
      ".sh-check{flex:none;width:13px;height:13px;border-radius:3px;border:1.5px solid #c9c9d1}" +
      ".sh-check.is-done{position:relative;background:#2f5d8a;border-color:#2f5d8a}" +
      ".sh-check.is-done::after{content:\"\";position:absolute;left:3px;top:1px;width:3px;" +
      "height:6px;border:solid #fff;border-width:0 1.5px 1.5px 0;transform:rotate(42deg)}" +
      ".sh-task span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".sh-task b{flex:none;font-family:var(--font-mono);font-size:10px;font-weight:500;color:#9a9aa4}" +
      ".sh-el{border:1px solid transparent;transition:box-shadow .15s ease,border-color .15s ease}" +
      ".sh-card{position:relative;z-index:2;width:min(80%,360px);margin:-22px 0 0 24px;" +
      "background:#fff;border-radius:10px;padding:13px 16px}" +
      ".sh-card__label{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;" +
      "color:#9a9aa4;margin-bottom:5px}" +
      ".sh-card__title{font-size:15px;font-weight:700;letter-spacing:-.01em;color:#1b1b1f;margin-bottom:3px}" +
      ".sh-card__sub{font-size:11.5px;line-height:1.5;color:#6b6b75;margin-bottom:9px}" +
      ".sh-card__tags{display:flex;gap:5px}" +
      ".sh-tag{font-size:9.5px;font-weight:600;padding:2px 7px;border-radius:999px;" +
      "background:#f1f1f5;color:#55555f}" +
      ".sh-pop{position:absolute;z-index:3;top:46px;right:14px;width:150px;background:#fff;" +
      "border-radius:8px;padding:6px;font-size:11.5px;color:#3a3a42}" +
      ".sh-pop__head{font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;" +
      "color:#9a9aa4;padding:3px 8px 5px}" +
      ".sh-pop__item{padding:6px 8px;border-radius:5px;white-space:nowrap;overflow:hidden;" +
      "text-overflow:ellipsis}" +
      ".sh-pop__item.is-active{background:#eef3f8;color:#2f5d8a;font-weight:600}" +
      ".sh-readout{font-family:var(--font-mono);font-size:10.5px;line-height:1.6;color:var(--ink-3)}" +
      ".sh-verdict{display:flex;align-items:center;gap:9px;flex-wrap:wrap;" +
      "font-size:11.5px;line-height:1.6;color:var(--ink-3)}" +
      ".sh-flag{flex:none;padding:2px 9px;border-radius:999px;font-size:10.5px;font-weight:700}" +
      ".sh-flag--ok{background:color-mix(in srgb,var(--blue) 13%,transparent);color:var(--blue)}" +
      ".sh-flag--warn{background:color-mix(in srgb,#b7791f 15%,transparent);color:#b7791f}" +
      ".sh-flag--bad{background:color-mix(in srgb,var(--accent) 13%,transparent);color:var(--accent)}" +
      ".sh-controls{grid-template-columns:1fr 1fr}" +
      "@media(max-width:560px){.sh-controls{grid-template-columns:1fr}" +
      ".sh-canvas{padding:16px;border-radius:13px}" +
      ".sh-card{width:calc(100% - 24px);margin:-20px 0 0 12px;padding:11px 13px}" +
      ".sh-pop{width:132px;right:10px;top:42px}.sh-task{font-size:11.5px;gap:8px}}";
    document.head.appendChild(s);
  }

  window.RUIDemo.register("shadow", {
    build: function (body) {
      injectStyle();

      var state = { v: 50, mode: "shadow", down: false };
      var wrap = K.el("div", { class: "sh-wrap" });
      var controls = K.el("div", { class: "controls sh-controls" });
      var stage = K.stage("demo__stage--plain");
      var readout = K.el("div", { class: "sh-readout" });
      var verdict = K.el("div", { class: "sh-verdict" });

      var canvas = K.el("div", { class: "sh-canvas" });
      canvas.innerHTML =
        '<div class="sh-window">' +
        '<div class="sh-window__head"><span>今日任务</span><span class="sh-window__count">3</span></div>' +
        '<div class="sh-task"><i class="sh-check is-done"></i><span>整理首页的层级</span><b>09:30</b></div>' +
        '<div class="sh-task"><i class="sh-check"></i><span>把主按钮换成更深的色阶</span><b>11:00</b></div>' +
        '<div class="sh-task"><i class="sh-check"></i><span>检查卡片的阴影是否过头</span><b>14:20</b></div>' +
        "</div>" +
        '<div class="sh-card sh-el">' +
        '<div class="sh-card__label">进行中的项目</div>' +
        '<div class="sh-card__title">重设计首页</div>' +
        '<div class="sh-card__sub">和团队一起把首屏的层级理顺</div>' +
        '<div class="sh-card__tags"><span class="sh-tag">设计</span><span class="sh-tag">本周</span></div>' +
        "</div>" +
        '<div class="sh-pop sh-el">' +
        '<div class="sh-pop__head">排序方式</div>' +
        '<div class="sh-pop__item is-active">按截止日期</div>' +
        '<div class="sh-pop__item">按优先级</div>' +
        '<div class="sh-pop__item">按创建时间</div>' +
        "</div>";
      var card = canvas.querySelector(".sh-card");
      var pop = canvas.querySelector(".sh-pop");

      var heightCtl = K.range({
        label: "高度",
        min: 0, max: 100, step: 1, value: 50,
        format: function (v) { return v === 0 ? "L0" : "L" + (v / 100 * 4).toFixed(1); },
        onInput: function (v) { state.v = v; render(); }
      });
      var modeSeg = K.seg({
        label: "表达方式",
        options: [
          { value: "shadow", label: "只靠阴影" },
          { value: "border", label: "只靠边框" },
          { value: "both", label: "两者" }
        ],
        value: "shadow",
        onChange: function (v) { state.mode = v; render(); }
      });
      var downToggle = K.toggle({
        label: "光源在下方",
        checked: false,
        hint: "默认光从上方来；打开后阴影朝上",
        onChange: function (v) { state.down = !!v; render(); }
      });

      heightCtl.el.style.gridColumn = "1 / -1";
      controls.appendChild(heightCtl.el);
      controls.appendChild(modeSeg.el);
      controls.appendChild(downToggle.el);
      stage.appendChild(canvas);
      wrap.appendChild(controls);
      wrap.appendChild(stage);
      wrap.appendChild(readout);
      wrap.appendChild(verdict);
      body.appendChild(wrap);

      function render() {
        var e = state.v / 100 * 4;
        var t = e / 4;
        var popE = Math.min(4, e + 0.8);
        var mode = state.mode;
        var hasShadow = mode !== "border";

        card.style.boxShadow = hasShadow ? shadowFor(e, state.down) : "none";
        card.style.borderColor = mode === "shadow" ? "transparent"
          : mode === "both" ? "rgba(20,22,30,.1)" : "rgba(20,22,30,.14)";
        pop.style.boxShadow = hasShadow ? shadowFor(popE, state.down) : "none";
        pop.style.borderColor = mode === "shadow" ? "transparent"
          : mode === "both" ? "rgba(20,22,30,.1)" : "rgba(20,22,30,.14)";

        var blur = Math.round(K.lerp(10, 64, t));
        var offset = Math.round(K.lerp(3, 30, t));
        var info = "页面 L0 · 卡片 L" + e.toFixed(1) + " · 浮层 L" + popE.toFixed(1);
        info += hasShadow && e >= 0.08
          ? " · 模糊 " + blur + "px · 偏移 " + offset + "px"
          : " · 无阴影";
        readout.textContent = info;

        var tone, flag, msg;
        if (mode === "border") {
          tone = "warn"; flag = "只有边框";
          msg = "元素被框住，但和背景仍在同一个平面上。边框擅长分隔，不擅长表达高度。";
        } else if (state.down) {
          tone = "bad"; flag = "光在下方";
          msg = "阴影跑到元素上面：界面像被倒过来，凸起读成了凹陷。书里说光默认从上方来。";
        } else if (e < 0.25) {
          tone = "ok"; flag = "L0 · 贴地";
          msg = "贴地的一层：这是页面背景，不该浮起来。页面层安静，上面的卡片才有高度可讲。";
        } else if (mode === "both") {
          tone = "warn"; flag = "边框 + 阴影";
          msg = "边框管边界、阴影管高度，分工清楚，但两者一起也最容易显脏。书里建议少用边框，把高度交给阴影。";
        } else {
          tone = "ok"; flag = "L" + e.toFixed(1);
          msg = "模糊 " + blur + "px、偏移 " + offset + "px。模糊和范围越大，元素离用户越近、越抓注意力。";
          if (e > 1.2) {
            msg += " 两层阴影：外层大而柔（直射光投影），内层紧而暗（环境光死角）；高度越高，内层越轻。";
          }
        }
        verdict.innerHTML = '<span class="sh-flag sh-flag--' + tone + '">' + flag +
          "</span><span>" + msg + "</span>";
      }

      render();
    }
  });
})();
