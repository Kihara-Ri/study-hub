/* line-length.js — 第 4 章 · 行长与行高：拖到舒服的阅读区间 */
(function () {
  "use strict";
  var K = window.RUIDemo.kit;
  var STYLE_ID = "ll-style";
  var PAD = 22;

  var TEXT = "给界面做排版，最难的不是挑一款好看的字体，而是让每一行都停在一个舒服的位置。" +
    "行太长，眼睛从右边跳回左边时容易串行；行太短，换行太频繁，读起来像在爬楼梯。" +
    "一个常见的起点是每行 45 到 75 个字符，但这不是死规定：字号小的时候字符本身也小，" +
    "同样的列宽能塞下更多字；字号大的时候能放下的字就少。真正要一起调的是行长和行高。" +
    "行距的作用，是让眼睛在换行时找得到下一行的起点；行越长，横向跳动的距离越远，" +
    "就越需要多一点行高来补偿。窄的正文可以用 1.5 左右，宽的正文可能要接近 2。" +
    "把这两个参数当成一对来调，段落才会稳定、耐读。所以别让文字去迁就布局：" +
    "先决定读起来舒服的行长，再让容器去适应它。如果内容区需要更宽来放图片或表格，" +
    "段落本身仍然可以收窄——在同一个页面里，不同宽度是成立的。";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent =
      ".ll-wrap{display:grid;gap:15px;width:100%}" +
      ".ll-scene{width:100%;display:flex;justify-content:center}" +
      ".ll-col{margin:0 auto;max-width:100%}" +
      ".ll-ruler{position:relative;height:34px;margin-bottom:9px;font-family:var(--font-mono);" +
      "font-size:9.5px;color:var(--ink-3)}" +
      ".ll-ruler__track{position:absolute;left:0;right:0;top:14px;height:1px;background:var(--rule-strong)}" +
      ".ll-ruler__band{position:absolute;top:9px;height:10px;" +
      "background:color-mix(in srgb,var(--blue) 13%,transparent);" +
      "border-left:1px solid color-mix(in srgb,var(--blue) 45%,transparent);" +
      "border-right:1px solid color-mix(in srgb,var(--blue) 45%,transparent)}" +
      ".ll-ruler__over{position:absolute;top:9px;height:10px;" +
      "background:color-mix(in srgb,var(--accent) 11%,transparent);" +
      "border-right:1px solid color-mix(in srgb,var(--accent) 40%,transparent)}" +
      ".ll-ruler__tick{position:absolute;top:10px;width:1px;height:8px;background:var(--rule-strong)}" +
      ".ll-ruler__tick span{position:absolute;top:9px;left:0;transform:translateX(-50%)}" +
      ".ll-ruler__end{position:absolute;top:0;right:0;font-weight:700;color:var(--ink-2);white-space:nowrap}" +
      ".ll-paperwrap{position:relative;margin:0 auto}" +
      ".ll-paper{position:absolute;left:0;top:0;transform-origin:top left;background:#fff;color:#2a2a31;" +
      "border-radius:3px;padding:20px 22px;font-family:var(--font-ui);text-align:left;" +
      "box-shadow:inset 0 0 0 1px #e9e9ee,0 1px 2px rgba(0,0,0,.05),0 22px 46px -34px rgba(0,0,0,.42)}" +
      ".ll-paper__kicker{font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;" +
      "color:#9a9aa4;margin-bottom:7px}" +
      ".ll-paper__title{font-size:19px;font-weight:800;letter-spacing:-.02em;line-height:1.25;" +
      "margin-bottom:10px;color:#1b1b1f}" +
      ".ll-paper__text{color:#3a3a42;transition:line-height .1s}" +
      ".ll-stats{display:block;font-family:var(--font-mono);" +
      "font-size:11px;line-height:1.7;color:var(--ink-3)}" +
      ".ll-stats b{color:var(--ink);font-weight:600}" +
      ".ll-verdict{display:flex;align-items:center;gap:8px;flex-wrap:wrap;" +
      "font-size:11.5px;line-height:1.6;color:var(--ink-3)}" +
      ".ll-verdict em{font-style:normal;color:var(--ink-2)}" +
      ".ll-flag{flex:none;padding:2px 9px;border-radius:999px;font-size:10.5px;font-weight:700}" +
      ".ll-flag--ok{background:color-mix(in srgb,var(--blue) 13%,transparent);color:var(--blue)}" +
      ".ll-flag--warn{background:color-mix(in srgb,#b7791f 15%,transparent);color:#b7791f}" +
      ".ll-flag--bad{background:color-mix(in srgb,var(--accent) 13%,transparent);color:var(--accent)}" +
      "@media(max-width:560px){.ll-stats{font-size:10px}.ll-ruler{height:30px}" +
      ".ll-ruler__end{font-size:9px}}";
    document.head.appendChild(s);
  }

  window.RUIDemo.register("line-length", {
    build: function (body) {
      injectStyle();

      var state = { measure: 78, lh: 1.4 };
      var wrap = K.el("div", { class: "ll-wrap" });
      var controls = K.el("div", { class: "controls controls--row" });
      var stage = K.stage("demo__stage--plain");
      var scene = K.el("div", { class: "ll-scene" });
      var col = K.el("div", { class: "ll-col" });
      var ruler = K.el("div", { class: "ll-ruler" });
      var paperWrap = K.el("div", { class: "ll-paperwrap" });
      var stats = K.el("div", { class: "ll-stats" });
      var verdict = K.el("div", { class: "ll-verdict" });

      var paper = K.el("div", { class: "ll-paper" });
      paper.innerHTML = '<div class="ll-paper__kicker">第 04 章 · 文字设计</div>' +
        '<div class="ll-paper__title">把每一行停在一个舒服的位置</div>' +
        '<div class="ll-paper__text"></div>';
      var textEl = paper.querySelector(".ll-paper__text");
      textEl.textContent = TEXT;
      paperWrap.appendChild(paper);

      var measureCtl = K.range({
        label: "行长",
        min: 45, max: 95, step: 1, value: 78,
        format: function (v) { return v + " 字符"; },
        onInput: function (v) { state.measure = v; render(); }
      });
      var lhCtl = K.range({
        label: "行高",
        min: 1.2, max: 2.0, step: 0.05, value: 1.4,
        format: function (v) { return v.toFixed(2); },
        onInput: function (v) { state.lh = v; render(); }
      });

      controls.appendChild(measureCtl.el);
      controls.appendChild(lhCtl.el);
      col.appendChild(ruler);
      col.appendChild(paperWrap);
      scene.appendChild(col);
      stage.appendChild(scene);
      wrap.appendChild(controls);
      wrap.appendChild(stage);
      wrap.appendChild(stats);
      wrap.appendChild(verdict);
      body.appendChild(wrap);

      function renderRuler(m, width) {
        var html = '<i class="ll-ruler__track"></i>';
        var bandL = 45 / m, bandR = Math.min(75, m) / m;
        if (bandR > bandL) {
          html += '<i class="ll-ruler__band" style="left:' + (bandL * 100).toFixed(2) +
            "%;width:" + ((bandR - bandL) * 100).toFixed(2) + '%"></i>';
        }
        if (m > 75) {
          html += '<i class="ll-ruler__over" style="left:' + (75 / m * 100).toFixed(2) + '%;right:0"></i>';
        }
        var step = width < 330 ? 20 : 10;
        for (var c = step; c < m; c += step) {
          html += '<i class="ll-ruler__tick" style="left:' + (c / m * 100).toFixed(2) +
            '%"><span>' + c + "</span></i>";
        }
        html += '<span class="ll-ruler__end">' + m + " 字符</span>";
        ruler.innerHTML = html;
      }

      function render() {
        var stageW = stage.clientWidth || 0;
        var avail = Math.max(200, stageW - 52);
        var font = K.round(K.clamp(avail / 95, 9.5, 13), 2);
        var m = state.measure;

        paper.style.width = m * font + PAD * 2 + "px";
        paper.style.fontSize = font + "px";
        textEl.style.lineHeight = state.lh.toFixed(2);

        var lw = paper.offsetWidth || 1;
        var ph = paper.offsetHeight || 1;
        var scale = Math.min(1, avail / lw);
        paper.style.transform = "scale(" + scale.toFixed(4) + ")";
        paperWrap.style.width = lw * scale + "px";
        paperWrap.style.height = ph * scale + "px";
        col.style.width = lw * scale + "px";
        renderRuler(m, lw * scale);

        var ideal = K.clamp(1.45 + (m - 45) * 0.0125, 1.45, 2.0);
        var lines = Math.ceil(TEXT.length / m);
        stats.innerHTML = "每行 <b>" + m + "</b> 字符 · 行高 <b>" + state.lh.toFixed(2) +
          "</b>（<b>" + (font * state.lh).toFixed(1) + "</b>px）· 约 <b>" + lines +
          "</b> 行 · 建议行高 <b>" + ideal.toFixed(2) + "</b>" +
          (scale < 0.97 ? " · 预览缩放 <b>" + Math.round(scale * 100) + "%</b>" : "");

        var toneW, flagW;
        if (m > 75) { toneW = "bad"; flagW = "行长 " + m + " 字符 · 超过 75"; }
        else { toneW = "ok"; flagW = "行长 " + m + " 字符 · 舒适区"; }

        var gap = state.lh - ideal;
        var toneH, flagH;
        if (gap < -0.16) { toneH = "bad"; flagH = "行高 " + state.lh.toFixed(2) + " · 偏紧"; }
        else if (gap > 0.16) { toneH = "warn"; flagH = "行高 " + state.lh.toFixed(2) + " · 偏松"; }
        else { toneH = "ok"; flagH = "行高 " + state.lh.toFixed(2) + " · 匹配"; }

        var msg;
        if (m > 75 && gap < -0.16) {
          msg = "行长超过 75 字符，行高又偏紧：回行距离太长、行与行挨得近，眼睛最容易串行。" +
            "按这个行长，行高建议 <em>" + ideal.toFixed(2) + "</em> 左右。";
        } else if (m > 75) {
          msg = "行长超过 75 字符，进入书里说的高风险区；行高够大能救回一些，" +
            "但更稳的是收窄到 75 以内。";
        } else if (gap < -0.16) {
          msg = "行长舒服，但行高偏紧：这个宽度下行高建议 <em>" + ideal.toFixed(2) +
            "</em> 左右，眼睛回行才找得到下一行。";
        } else if (gap > 0.16) {
          msg = "行高偏松：行与行散开了，段落读起来会断。这个宽度下 <em>" + ideal.toFixed(2) +
            "</em> 左右就够。";
        } else {
          msg = "舒服区：行长 " + m + " 字符、行高 " + state.lh.toFixed(2) +
            "，宽窄和行距是配套的。";
        }
        verdict.innerHTML = '<span class="ll-flag ll-flag--' + toneW + '">' + flagW +
          '</span><span class="ll-flag ll-flag--' + toneH + '">' + flagH +
          "</span><span>" + msg + "</span>";
      }

      render();
    }
  });
})();
