"use strict";
/* 韩语：发音表（元音、辅音、紧音、收音）、拼读器、听音选字、音变速查 */
window.HubLangPlugins.kr = function (E) {
  const { esc, md, wrap, audioOf, show, pageHead, play, SPK_SVG } = E;
  const TABS = [["vowels_basic", "基础元音"], ["vowels_adv", "进阶元音"], ["consonants_basic", "基本辅音"], ["consonants_tense", "紧音"], ["batchim", "收音"], ["compose", "拼读练习"], ["rules", "音变速查"]];
  let tab = "vowels_basic";
  const cs = { i: 0, m: 0, q: null };
  const SYL = () => E.EXTRA.SYL || { ini: [], med: [], items: [] };
  const sylFind = (ini, med) => (SYL().items || []).find(x => x.ini === ini && x.med === med && !x.fin);

  function quizNew() {
    const pool = (SYL().items || []).filter(x => !x.fin);
    if (!pool.length) return null;
    const target = E.pick(pool), opts = [target];
    let guard = 0;
    while (opts.length < 4 && guard++ < 400) { const c = E.pick(pool); if (!opts.some(o => o.kr === c.kr)) opts.push(c); }
    return { target, opts: E.shuffle(opts), picked: null };
  }
  function quizHtml() {
    if (!cs.q) cs.q = quizNew();
    const q = cs.q;
    if (!q) return '<div class="empty">拼读数据缺失</div>';
    return `<div class="cp-qrow"><button class="btn" type="button" data-audio="${esc(audioOf(q.target.kr))}" id="cpPlay">${SPK_SVG} 播放</button>
      <button class="btn line sm" type="button" id="cpAgain">换一题</button>${q.picked !== null
        ? `<span style="color:${q.picked === q.target.kr ? "var(--green)" : "var(--pink)"}">${q.picked === q.target.kr ? "✓ 答对了" : "✗ 正确答案是 " + esc(q.target.kr) + " [" + esc(q.target.rom) + "]"}</span>` : ""}</div>
      <div class="cp-opts">${q.opts.map(o => `<button class="cp-opt tx ${q.picked === null ? "" : o.kr === q.target.kr ? "ok" : o.kr === q.picked ? "bad" : ""}" type="button" data-ans="${esc(o.kr)}">${esc(o.kr)}<small>[${esc(o.rom)}]</small></button>`).join("")}</div>`;
  }
  function composerHtml() {
    const S = SYL(), ini = S.ini[cs.i] || "ㄱ", med = S.med[cs.m] || "ㅏ", cur = sylFind(ini, med), kr = cur ? cur.kr : "", rom = cur ? cur.rom : "";
    return `<div class="card cp"><div class="cp-stage"><div class="cp-syl tx" id="cpSyl">${esc(kr)}</div><div class="cp-rom" id="cpRom">[${esc(rom)}]</div>
        <div class="cp-act"><button class="btn" type="button" data-audio="${esc(audioOf(kr))}" id="cpListen">${SPK_SVG} 听发音</button><button class="btn line" type="button" id="cpRand">随机抽一个</button></div>
        <div class="cp-hint" id="cpHint">${esc(ini)} + ${esc(med)} = ${esc(kr)}</div></div>
      <div class="cp-pick"><div class="cp-label">初声 · 자음（19 个）</div><div class="cp-grid">${S.ini.map((x, k) => `<button class="cp-b ${k === cs.i ? "on" : ""}" type="button" data-ci="${k}">${esc(x)}</button>`).join("")}</div>
        <div class="cp-label">中声 · 모음（21 个）</div><div class="cp-grid">${S.med.map((x, k) => `<button class="cp-b ${k === cs.m ? "on" : ""}" type="button" data-cm="${k}">${esc(x)}</button>`).join("")}</div></div></div>
      <div class="card"><h3>听音选字</h3><p class="how" style="margin-bottom:12px">先点「播放」，再从四个音节里选出你听到的那个。练的是「耳朵分辨」，不是死记。</p><div id="cpQuiz">${quizHtml()}</div></div>
      <div class="card"><h3>怎么用拼读器</h3><div class="grid3" style="margin-top:10px">
        <div><b style="color:var(--pink)">① 先横后竖</b><p class="how">韩字是一个方块：左边/上面是初声辅音，右边/下面是中声元音。点一个辅音、再点一个元音，就拼出一个字。</p></div>
        <div><b style="color:var(--teal)">② 一定要出声</b><p class="how">先自己读，再点「听发音」核对。听三遍不如自己读一遍。</p></div>
        <div><b style="color:var(--green)">③ ㅇ 不发音</b><p class="how">以 ㅇ 开头的字，初声不发音，直接读元音：아 = a，이 = i。</p></div></div></div>`;
  }
  function bindComposer(box) {
    const S = SYL(), $ = s => box.querySelector(s);
    const refresh = () => {
      const ini = S.ini[cs.i], med = S.med[cs.m], cur = sylFind(ini, med), kr = cur ? cur.kr : "", rom = cur ? cur.rom : "";
      $("#cpSyl").textContent = kr; $("#cpRom").textContent = "[" + rom + "]"; $("#cpHint").textContent = ini + " + " + med + " = " + kr;
      const b = $("#cpListen"); b.dataset.audio = audioOf(kr); b.onclick = ev => { ev.stopPropagation(); play(b.dataset.audio); };
      box.querySelectorAll("[data-ci]").forEach(x => x.classList.toggle("on", +x.dataset.ci === cs.i));
      box.querySelectorAll("[data-cm]").forEach(x => x.classList.toggle("on", +x.dataset.cm === cs.m));
    };
    box.querySelectorAll("[data-ci]").forEach(b => b.onclick = () => { cs.i = +b.dataset.ci; refresh(); });
    box.querySelectorAll("[data-cm]").forEach(b => b.onclick = () => { cs.m = +b.dataset.cm; refresh(); });
    $("#cpRand").onclick = () => { cs.i = Math.floor(Math.random() * S.ini.length); cs.m = Math.floor(Math.random() * S.med.length); refresh(); play($("#cpListen").dataset.audio); };
    const paint = () => { $("#cpQuiz").innerHTML = quizHtml(); E.bindAudio($("#cpQuiz")); bindQuiz(); };
    const bindQuiz = () => {
      const q = cs.q;
      box.querySelectorAll("[data-ans]").forEach(b => b.onclick = () => { if (q.picked !== null) return; q.picked = b.dataset.ans; paint(); });
      $("#cpAgain")?.addEventListener("click", () => { cs.q = quizNew(); paint(); });
    };
    bindQuiz();
  }

  function letters(arg) {
    if (arg) tab = arg;
    const L = E.D.letters || {};
    let h = `${pageHead("发音表", "点任意字母或例词即可听发音。发音是韩语的地基，建议第一章反复练。")}
      <div class="tabs" role="tablist">${TABS.map(([k, l]) => `<button class="tab ${tab === k ? "active" : ""}" type="button" role="tab" data-tab="${k}">${l}</button>`).join("")}</div>`;
    if (tab === "rules") {
      const rs = E.secs().filter(s => /音变|变化/.test(s._ch.title) || /音变|变化/.test(s.title));
      h += rs.length ? rs.map(s => `<div class="rule"><h4>${esc(s.title)}</h4>${(s.concepts || []).map(c => `<div style="margin:14px 0 6px"><b>${wrap(esc(c.title))}</b>
        <div class="how">${md(c.body || "")}</div></div>`).join("")}${(s.examples || []).length ? `<div class="exs">${s.examples.slice(0, 40).map(e => `<span role="button" tabindex="0" data-audio="${esc(e.a)}" title="${esc(e.zh)}">${esc(e.t)}</span>`).join("")}</div>` : ""}</div>`).join("")
        : '<div class="empty">音变章节内容还在整理中</div>';
    } else if (tab === "compose") {
      h += composerHtml();
    } else if (tab === "batchim") {
      h += `<div class="jamo-grid">${(L.batchim || []).map(b => `<div class="jamo" role="button" tabindex="0" data-audio="${esc(audioOf(b.say))}"><div class="j" style="font-size:22px">${esc(b.letters)}</div>
        <div class="r">[${esc(b.rom)}]</div><div class="n">${esc(b.word)}</div></div>`).join("")}</div>
        <div class="card"><h3>收音说明</h3><p class="how">收音（받침）是音节末尾的辅音。虽然书写上有 27 种，但实际发音只有 7 种代表音：ㄱ·ㄴ·ㄷ·ㄹ·ㅁ·ㅂ·ㅇ。上面的格子就是 7 组代表音及例词。</p></div>`;
    } else {
      const arr = L[tab] || [];
      h += `<div class="jamo-grid">${arr.map(j => `<div class="jamo" role="button" tabindex="0" data-audio="${esc(audioOf(j.say))}"><div class="j tx">${esc(j.jamo)}</div>
        <div class="r">${esc(j.rom)}</div><div class="n">${esc(j.name || j.zh || "")}</div></div>`).join("")}</div>
        <div class="card"><h3>发音要点</h3><div class="grid2" style="margin-top:8px">${arr.map(j => `<div class="how"><b class="tx" style="font-size:16px">${esc(j.jamo)}</b>
          <span style="color:var(--pink);font-family:var(--mono)">[${esc(j.rom)}]</span> — ${esc(j.tip || "")}</div>`).join("")}</div></div>`;
    }
    const box = show(h);
    box.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { tab = b.dataset.tab; letters(); });
    box.querySelectorAll("[role=button][data-audio]").forEach(el => el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); } });
    if (tab === "compose") bindComposer(box);
  }
  return { letters };
};
