/* ===== 韩语入门 · 互动学习台 ===== */
(function () {
  const D = window.COURSE || { chapters: [] };
  const $ = s => document.querySelector(s);
  const view = $('#view');
  const nav = $('#nav');
  const crumb = $('#crumb');
  const topActions = $('#topActions');
  const toastEl = $('#toast');

  /* ---------------- 工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const HANGUL = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]+/g;
  function krWrap(html) {
    // 仅处理不在标签内的文本
    return html.replace(/(^|>)([^<]+)/g, (m, p, t) => p + t.replace(HANGUL, x => '<span class="kr">' + x + '</span>'));
  }
  function md(s) {
    let t = esc(s);
    t = t.replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>');
    t = t.replace(/\n/g, '<br>');
    return krWrap(t);
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }
  function secs() {
    const out = [];
    D.chapters.forEach(ch => ch.sections.forEach(s => out.push(Object.assign({ _ch: ch }, s))));
    return out;
  }
  function findSec(id) { return secs().find(s => s.id === id); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }

  /* ---------------- 音频 ---------------- */
  const player = $('#player');
  let curSpk = null;
  function play(aid, rate, spkEl) {
    if (!aid) { toast('这句没有音频'); return; }
    if (curSpk) curSpk.classList.remove('playing');
    if (spkEl) { spkEl.classList.add('playing'); curSpk = spkEl; }
    player.src = 'audio/' + aid + '.mp3';
    player.playbackRate = rate || (SRS.load().settings.rate || 1);
    player.currentTime = 0;
    const p = player.play();
    if (p && p.catch) p.catch(() => {});
    player.onended = () => { if (spkEl) spkEl.classList.remove('playing'); };
  }
  const SPK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L13 5v14L7.5 14.5H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  function spkBtn(aid, cls) {
    return `<button class="spk ${cls || ''}" data-audio="${esc(aid || '')}" title="播放">${SPK_SVG}</button>`;
  }


  /* ---------------- 图标（内联 SVG，避免 emoji 字体缺失） ---------------- */
  const SVG = (d, extra) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${extra||''}>${d}</svg>`;
  const ICON = {
    home: SVG('<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/>'),
    letters: SVG('<path d="M5 5h5.5a3.5 3.5 0 0 1 0 7H5z"/><path d="M5 12h6.5a3.5 3.5 0 0 1 0 7H5z"/>'),
    review: SVG('<path d="M3 12a9 9 0 0 1 15.5-6.2"/><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M18.5 2v4.2h-4.2"/><path d="M5.5 22v-4.2h4.2"/>'),
    quiz: SVG('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8.5h8M8 12.5h8M8 16.5h4"/>'),
    vocab: SVG('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5z"/><path d="M8 7h7"/>'),
    plan: SVG('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2"/>'),
    stats: SVG('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    book: SVG('<path d="M12 6.5C10 4.8 7.5 4 4.5 4v14c3 0 5.5.8 7.5 2.5 2-1.7 4.5-2.5 7.5-2.5V4c-3 0-5.5.8-7.5 2.5z"/><path d="M12 6.5V20"/>'),
    sun: SVG('<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/>'),
    help: SVG('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.9"/><circle cx="12" cy="17.3" r=".9" fill="currentColor" stroke="none"/>'),
    download: SVG('<path d="M12 3v11"/><path d="m7.5 10 4.5 4.5 4.5-4.5"/><path d="M4 20h16"/>'),
    menu: SVG('<path d="M4 7h16M4 12h16M4 17h16"/>')
  };

  /* ---------------- 路由 ---------------- */
  function route() {
    const h = (location.hash || '#/home').slice(2);
    const [name, arg] = h.split('/');
    if (curSpk) { curSpk.classList.remove('playing'); curSpk = null; }
    player.pause();
    window.scrollTo(0, 0);
    switch (name) {
      case 'lesson': return lesson(arg);
      case 'letters': return letters(arg);
      case 'review': return review();
      case 'quiz': return quiz(arg);
      case 'stats': return stats();
      case 'plan': return plan();
      case 'vocab': return vocabView(arg);
      case 'search': return searchView(decodeURIComponent(arg || ''));
      default: return home();
    }
  }
  window.addEventListener('hashchange', route);

  /* ---------------- 侧边导航 ---------------- */
  function renderNav() {
    const cur = (location.hash || '').slice(2);
    let h = '';
    h += navItem('home', ICON.home, '学习台', '');
    h += navItem('letters', ICON.letters, '发音表', '');
    h += navItem('review', ICON.review, '复习', '');
    h += navItem('quiz', ICON.quiz, '测验', '');
    h += navItem('vocab', ICON.vocab, '词库', '');
    h += navItem('plan', ICON.plan, '学习计划', '');
    h += navItem('stats', ICON.stats, '统计', '');
    D.chapters.forEach(ch => {
      const p = SRS.chapterProgress(ch);
      h += `<div class="nav-group"><div class="nav-item" data-go="lesson/${ch.sections[0] ? ch.sections[0].id : ''}">
        <span class="ico">${ICON.book}</span><span style="flex:1">${esc(ch.title)}</span>
        <span style="font-size:11px;color:var(--ink3)">${p.done}/${p.tot}</span></div>`;
      ch.sections.forEach(s => {
        const done = SRS.isDone(s.id);
        h += `<div class="nav-sec ${cur === 'lesson/' + s.id ? 'active' : ''}" data-go="lesson/${s.id}">
          <span class="dot ${done ? 'done' : ''}"></span><span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.title)}</span></div>`;
      });
      h += '</div>';
    });
    nav.innerHTML = h;
    nav.querySelectorAll('[data-go]').forEach(el => el.onclick = () => {
      location.hash = '#/' + el.dataset.go;
      $('#sidebar').classList.remove('open');
    });
  }
  function navItem(name, ico, label, extra) {
    const cur = (location.hash || '#/home').slice(2).split('/')[0];
    return `<div class="nav-item ${cur === name ? 'active' : ''}" data-go="${name}">
      <span class="ico">${ico}</span><span style="flex:1">${label}</span>${extra || ''}</div>`;
  }

  /* ---------------- 首页 ---------------- */
  function home() {
    crumb.textContent = '学习台';
    topActions.innerHTML = '';
    const st = SRS.cardStats();
    const due = SRS.dueQueue(999).length;
    const newQ = SRS.newQueue(999).length;
    const all = secs();
    const doneN = all.filter(s => SRS.isDone(s.id)).length;
    const next = all.find(s => !SRS.isDone(s.id)) || all[0];
    const hr = new Date().getHours();
    const greet = hr < 6 ? '夜深了' : hr < 11 ? '早上好' : hr < 14 ? '中午好' : hr < 19 ? '下午好' : '晚上好';
    const streak = SRS.streak();

    let h = `<div class="hero">
      <h2>${greet}，今天也来学一点韩语吧</h2>
      <p>${next ? `下一节：${esc(next._ch.title)} · ${esc(next.title)}` : '全书已学完，去复习巩固吧'}</p>
      <div class="btns">
        ${next ? `<button class="btn" data-go="lesson/${next.id}">继续学习 →</button>` : ''}
        <button class="btn ghost" data-go="review">开始复习${due ? `（${due}）` : ''}</button>
        <button class="btn ghost" data-go="quiz">来一组测验</button>
      </div>
    </div>`;

    h += `<div class="grid4" style="margin-top:18px">
      <div class="stat"><div class="n">${streak}<small> 天</small></div><div class="l">连续学习</div></div>
      <div class="stat"><div class="n">${st.seen}<small> / ${st.total}</small></div><div class="l">已接触卡片</div></div>
      <div class="stat"><div class="n" style="color:var(--pink)">${due}</div><div class="l">今日待复习</div></div>
      <div class="stat"><div class="n">${pct(doneN, all.length)}<small>%</small></div><div class="l">全书进度（${doneN}/${all.length} 节）</div></div>
    </div>`;

    h += `<div class="grid2" style="margin-top:18px;align-items:start">
      <div class="card"><h3>今日任务</h3><ul class="todo-list">
        <li><span class="dot ${doneN >= all.length ? 'done' : ''}"></span><div class="t"><b>学完 1 节新课</b><span>${next ? esc(next.title) : '—'}</span></div>
          ${next ? `<button class="btn sm line" data-go="lesson/${next.id}">去学</button>` : ''}</li>
        <li><span class="dot ${due === 0 ? 'done' : ''}"></span><div class="t"><b>复习 ${due} 张卡片</b><span>间隔重复，别让记忆漏掉</span></div>
          <button class="btn sm line" data-go="review">去复习</button></li>
        <li><span class="dot"></span><div class="t"><b>做 10 道测验</b><span>检验今天的学习效果</span></div>
          <button class="btn sm line" data-go="quiz">去测验</button></li>
      </ul></div>
      <div class="card"><h3>章节进度</h3>
        ${D.chapters.map(ch => {
          const p = SRS.chapterProgress(ch);
          return `<div style="margin:12px 0">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
              <span>${esc(ch.title)}</span><span style="color:var(--ink3)">${p.done}/${p.tot}</span></div>
            <div class="bar"><i style="width:${p.pct}%"></i></div></div>`;
        }).join('')}
      </div>
    </div>`;

    h += `<div class="card" style="margin-top:18px"><h3>怎么用这套学习台</h3>
      <div class="grid3" style="margin-top:10px">
        <div><b style="color:var(--pink)">① 先学发音</b><p style="font-size:13px;color:var(--ink2);margin:4px 0 0">第一章务必学扎实，点每个字母都能听发音。发音是后面一切的地基。</p></div>
        <div><b style="color:var(--teal)">② 每天 1 节 + 复习</b><p style="font-size:13px;color:var(--ink2);margin:4px 0 0">新知识只学 1 节，剩下的时间交给「复习」。卡片按记忆曲线自动排期。</p></div>
        <div><b style="color:var(--green)">③ 学完就测</b><p style="font-size:13px;color:var(--ink2);margin:4px 0 0">测验题从你学过的词汇和例句里随机生成，做错的会回到复习队列。</p></div>
      </div></div>`;

    view.className = 'view';
    view.innerHTML = h;
    bindGo();
  }

  /* ---------------- 课程页 ---------------- */
  function lesson(secId) {
    const s = findSec(secId);
    if (!s) { view.innerHTML = '<div class="empty">没找到这一节</div>'; return; }
    const ch = s._ch;
    const idx = secs().findIndex(x => x.id === secId);
    const all = secs();
    const prev = all[idx - 1], next = all[idx + 1];
    const st = SRS.load();
    crumb.textContent = ch.title + ' / ' + s.title;
    topActions.innerHTML = `<span class="pill">${esc(s.pages ? 'PDF p.' + s.pages : '')}</span>`;
    const hideZh = st.settings.hideZh;

    let h = `<div class="lesson-head">
      <div class="ch">${esc(ch.title)}</div>
      <h2>${esc(s.title)}</h2>
      <div class="meta">
        <span class="pill">${(s.concepts || []).length} 个知识点</span>
        <span class="pill">${(s.vocab || []).length} 个词</span>
        <span class="pill">${(s.examples || []).length} 个例句</span>
        ${SRS.isDone(secId) ? '<span class="pill green">✓ 已学</span>' : ''}
        <button class="pill" data-go="quiz/sec:${secId}">本节测验</button>
        <button class="pill" id="toggleZh">${hideZh ? '中文已遮挡 · 点击显示' : '中文已显示 · 点击遮挡'}</button>
      </div></div>`;

    if ((s.concepts || []).length) {
      h += `<div class="card"><h3>讲解</h3>`;
      s.concepts.forEach(c => {
        h += `<div class="concept"><h4>${krWrap(esc(c.title))}</h4>
          ${c.body ? c.body.split('\n').map(p => p.trim()).filter(Boolean).map(p => `<p>${md(p)}</p>`).join('') : ''}</div>`;
      });
      h += `</div>`;
    }

    if ((s.vocab || []).length) {
      h += `<div class="card" style="margin-top:16px"><h3>词汇 <span style="font-size:12px;color:var(--ink3);font-weight:400">点喇叭听发音</span></h3>
        <div class="vocab-grid">`;
      s.vocab.forEach(v => {
        h += `<div class="vcard ${hideZh ? 'hide' : ''}">
          ${spkBtn(v.a)}
          <div class="body"><div class="k">${esc(v.kr)}</div><div class="r">${esc(v.rom)}</div><div class="z">${esc(v.zh)}</div></div>
        </div>`;
      });
      h += `</div></div>`;
    }

    if ((s.examples || []).length) {
      h += `<div class="card" style="margin-top:16px"><h3>例句</h3>`;
      s.examples.forEach(e => {
        h += `<div class="ex">
          <div class="top">
            ${spkBtn(e.a)}
            <div style="flex:1">
              <div class="kr-line">${esc(e.kr)}</div>
              <div class="rom">${esc(e.rom)}</div>
            </div>
            <button class="spk" data-audio="${esc(e.a)}" data-rate="0.7" title="慢速 0.7×">0.7×</button>
          </div>
          <div class="zh ${hideZh ? 'hidden-zh' : ''}">${esc(e.zh)}</div>
          ${e.note ? `<div class="note">${esc(e.note)}</div>` : ''}
        </div>`;
      });
      h += `</div>`;
    }

    if ((s.drills || []).length) {
      h += `<div class="card" style="margin-top:16px"><h3>练习</h3>`;
      s.drills.forEach((d, i) => {
        h += `<div class="drill" data-i="${i}"><div class="q">${i + 1}. ${md(d.q)}</div>
          <div class="a">答案：${md(d.a || '—')}</div>
          <div class="reveal">显示答案</div></div>`;
      });
      h += `</div>`;
    }

    if ((s.tips || []).length) {
      h += `<div style="margin-top:16px">`;
      s.tips.forEach(t => { h += `<div class="tip"><b>易错提示</b> · ${md(t)}</div>`; });
      h += `</div>`;
    }

    if (!SRS.isDone(secId)) {
      h += `<div style="margin-top:22px"><button class="btn" id="markDone">✓ 学完了，标记本节完成</button></div>`;
    } else {
      h += `<div class="done-banner">✓ 本节已学完 · ${st.progress[secId] ? new Date(st.progress[secId].ts).toLocaleDateString('zh-CN') : ''}
        <button class="btn sm line" data-go="review" style="margin-left:auto">去复习</button></div>`;
    }

    h += `<div class="lesson-nav">
      <div>${prev ? `<button class="btn line" data-go="lesson/${prev.id}">← ${esc(prev.title)}</button>` : ''}</div>
      <div>${next ? `<button class="btn line" data-go="lesson/${next.id}">${esc(next.title)} →</button>` : ''}</div>
    </div>`;

    view.className = 'view';
    view.innerHTML = h;
    SRS.load().lastLesson = secId;
    SRS.save();

    bindGo();
    bindAudio(view);
    view.querySelectorAll('.vcard').forEach(c => c.onclick = ev => {
      if (ev.target.closest('.spk')) return;
      c.classList.toggle('hide');
    });
    view.querySelectorAll('.ex .zh.hidden-zh').forEach(z => z.onclick = () => z.classList.remove('hidden-zh'));
    view.querySelectorAll('.drill').forEach(d => {
      const rv = d.querySelector('.reveal');
      if (rv) rv.onclick = () => { d.classList.add('open'); rv.style.display = 'none'; };
    });
    const mdBtn = $('#markDone');
    if (mdBtn) mdBtn.onclick = () => {
      SRS.markDone(secId); toast('已标记完成'); renderNav(); lesson(secId);
    };
    const tz = $('#toggleZh');
    if (tz) tz.onclick = () => {
      const stt = SRS.load(); stt.settings.hideZh = !stt.settings.hideZh; SRS.save(); lesson(secId);
    };
  }

  /* ---------------- 发音表 ---------------- */
  function letters(arg) {
    if (arg) letters._tab = arg;
    crumb.textContent = '发音表';
    topActions.innerHTML = '';
    const L = D.letters || {};
    let tab = letters._tab || 'vowels_basic';
    const tabs = [['vowels_basic', '基础元音'], ['vowels_adv', '进阶元音'], ['consonants_basic', '基本辅音'], ['consonants_tense', '紧音'], ['batchim', '收音'], ['compose', '拼读练习'], ['rules', '音变速查']];

    let h = `<h2 class="page-title">发音表</h2>
      <p class="page-sub">点任意字母或例词即可听发音。发音是韩语的地基，建议第一章反复练。</p>
      <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>`;

    if (tab === 'rules') {
      const ruleSecs = secs().filter(s => /音变|变化/.test(s._ch.title) || /音变|变化/.test(s.title));
      if (!ruleSecs.length) h += '<div class="empty">音变章节内容还在整理中</div>';
      ruleSecs.forEach(s => {
        h += `<div class="rule"><h4>${esc(s.title)}</h4>`;
        (s.concepts || []).forEach(c => {
          h += `<div style="margin:14px 0 6px"><b>${krWrap(esc(c.title))}</b>
            <div style="font-size:13.5px;color:var(--ink2);margin-top:4px">${md(c.body || '')}</div></div>`;
        });
        if ((s.examples || []).length) {
          h += `<div class="exs">`;
          s.examples.slice(0, 40).forEach(e => {
            h += `<span data-audio="${esc(e.a)}" title="${esc(e.zh)}">${esc(e.kr)}</span>`;
          });
          h += `</div>`;
        }
        h += `</div>`;
      });
    } else if (tab === 'compose') {
      h += composerHtml();
      view.className = 'view';
      view.innerHTML = h;
      view.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { letters._tab = b.dataset.tab; letters(); });
      bindComposer();
      bindAudio(view);
      return;
    } else if (tab === 'batchim') {
      h += `<div class="jamo-grid">`;
      (L.batchim || []).forEach(b => {
        h += `<div class="jamo" data-audio="${esc(audioOf(b.say))}">
          <div class="j" style="font-size:22px">${esc(b.letters)}</div>
          <div class="r">[${esc(b.rom)}]</div>
          <div class="n">${esc(b.word)}</div></div>`;
      });
      h += `</div><div class="card" style="margin-top:18px"><h3>收音说明</h3>
        <p style="font-size:13.5px;color:var(--ink2)">收音（받침）是音节末尾的辅音。虽然书写上有 27 种，但实际发音只有 7 种代表音：ㄱ·ㄴ·ㄷ·ㄹ·ㅁ·ㅂ·ㅇ。上面的格子就是 7 组代表音及例词。</p></div>`;
    } else {
      const arr = L[tab] || [];
      h += `<div class="jamo-grid">`;
      arr.forEach(j => {
        h += `<div class="jamo" data-audio="${esc(audioOf(j.say))}" data-jamo="${esc(j.jamo)}">
          <div class="j">${esc(j.jamo)}</div>
          <div class="r">${esc(j.rom)}</div>
          <div class="n">${esc(j.name || j.zh || '')}</div></div>`;
      });
      h += `</div>`;
      h += `<div class="card" style="margin-top:18px"><h3>发音要点</h3><div class="grid2" style="margin-top:8px">`;
      arr.forEach(j => {
        h += `<div style="font-size:13px;color:var(--ink2)"><b class="kr" style="font-size:16px">${esc(j.jamo)}</b>
          <span style="color:var(--pink);font-family:var(--mono)">[${esc(j.rom)}]</span> — ${esc(j.tip || '')}</div>`;
      });
      h += `</div></div>`;
    }

    view.className = 'view';
    view.innerHTML = h;
    view.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { letters._tab = b.dataset.tab; letters(); });
    bindAudio(view);
  }
  /* ---------------- 拼读器 ---------------- */
  function sylFind(S, ini, med) {
    return (S.items || []).find(x => x.ini === ini && x.med === med && !x.fin);
  }
  function composerHtml() {
    const S = window.SYL || { ini: [], med: [], items: [] };
    const cs = letters._c || (letters._c = { i: 0, m: 0, q: null });
    const ini = S.ini[cs.i] || 'ㄱ', med = S.med[cs.m] || 'ㅏ';
    const cur = sylFind(S, ini, med);
    const kr = cur ? cur.kr : '', rom = cur ? cur.rom : '';
    let h = `<div class="card cp">
      <div class="cp-stage">
        <div class="cp-syl kr" id="cpSyl">${esc(kr)}</div>
        <div class="cp-rom" id="cpRom">[${esc(rom)}]</div>
        <div class="cp-act">
          <button class="btn" data-audio="${esc(audioOf(kr))}">${SPK_SVG} 听发音</button>
          <button class="btn ghost" id="cpRand">随机抽一个</button>
        </div>
        <div class="cp-hint" id="cpHint">${esc(ini)} + ${esc(med)} = ${esc(kr)}</div>
      </div>
      <div class="cp-pick">
        <div class="cp-label">初声 · 자음（19 个）</div>
        <div class="cp-grid">${S.ini.map((x, k) => `<button class="cp-b ${k === cs.i ? 'on' : ''}" data-ci="${k}">${esc(x)}</button>`).join('')}</div>
        <div class="cp-label">中声 · 모음（21 个）</div>
        <div class="cp-grid wide">${S.med.map((x, k) => `<button class="cp-b ${k === cs.m ? 'on' : ''}" data-cm="${k}">${esc(x)}</button>`).join('')}</div>
      </div>
    </div>`;

    h += `<div class="card" style="margin-top:18px"><h3>听音选字</h3>
      <p style="font-size:13.5px;color:var(--ink2);margin:4px 0 12px">先点「播放」，再从四个音节里选出你听到的那个。练的是「耳朵分辨」，不是死记。</p>
      <div id="cpQuiz">${quizCardHtml()}</div></div>`;

    h += `<div class="card" style="margin-top:18px"><h3>怎么用拼读器</h3>
      <div class="grid3" style="margin-top:10px">
        <div><b style="color:var(--pink)">① 先横后竖</b><p style="font-size:13px;color:var(--ink2);margin:4px 0 0">韩字是一个方块：左边/上面是初声辅音，右边/下面是中声元音。点一个辅音、再点一个元音，就拼出一个字。</p></div>
        <div><b style="color:var(--teal)">② 一定要出声</b><p style="font-size:13px;color:var(--ink2);margin:4px 0 0">先自己读，再点「听发音」核对。听三遍不如自己读一遍。</p></div>
        <div><b style="color:var(--green)">③ ㅇ 不发音</b><p style="font-size:13px;color:var(--ink2);margin:4px 0 0">以 ㅇ 开头的字，初声不发音，直接读元音：아 = a，이 = i。</p></div>
      </div></div>`;
    return h;
  }
  function cpQuizNew() {
    const S = window.SYL || { items: [] };
    const pool = (S.items || []).filter(x => !x.fin);
    if (!pool.length) return null;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const opts = [target];
    let guard = 0;
    while (opts.length < 4 && guard++ < 400) {
      const c = pool[Math.floor(Math.random() * pool.length)];
      if (!opts.some(o => o.kr === c.kr)) opts.push(c);
    }
    opts.sort(() => Math.random() - 0.5);
    return { target, opts, picked: null };
  }
  function quizCardHtml() {
    const cs = letters._c || (letters._c = {});
    if (!cs.q) cs.q = cpQuizNew();
    const q = cs.q;
    if (!q) return '<div class="empty">拼读数据缺失</div>';
    let h = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
      <button class="btn" data-audio="${esc(audioOf(q.target.kr))}" id="cpPlay">${SPK_SVG} 播放</button>
      <button class="btn ghost sm" id="cpAgain">换一题</button>`;
    if (q.picked !== null) {
      h += `<span style="font-size:13.5px;color:${q.picked === q.target.kr ? 'var(--green)' : 'var(--pink)'}">${q.picked === q.target.kr ? '✓ 答对了' : '✗ 正确答案是 ' + esc(q.target.kr) + ' [' + esc(q.target.rom) + ']'}</span>`;
    }
    h += `</div><div class="cp-opts">`;
    q.opts.forEach(o => {
      const cls = q.picked === null ? '' : (o.kr === q.target.kr ? 'ok' : (o.kr === q.picked ? 'bad' : ''));
      h += `<button class="cp-opt kr ${cls}" data-ans="${esc(o.kr)}">${esc(o.kr)}<small>[${esc(o.rom)}]</small></button>`;
    });
    h += `</div>`;
    return h;
  }
  function bindComposer() {
    const S = window.SYL || { ini: [], med: [] };
    const cs = letters._c || (letters._c = { i: 0, m: 0 });
    const refresh = () => {
      const ini = S.ini[cs.i], med = S.med[cs.m];
      const cur = sylFind(S, ini, med);
      const kr = cur ? cur.kr : '', rom = cur ? cur.rom : '';
      const sy = $('#cpSyl'); if (sy) sy.textContent = kr;
      const rm = $('#cpRom'); if (rm) rm.textContent = '[' + rom + ']';
      const hn = $('#cpHint'); if (hn) hn.textContent = ini + ' + ' + med + ' = ' + kr;
      const b = view.querySelector('.cp-act [data-audio]');
      if (b) b.dataset.audio = audioOf(kr);
      view.querySelectorAll('[data-ci]').forEach(x => x.classList.toggle('on', +x.dataset.ci === cs.i));
      view.querySelectorAll('[data-cm]').forEach(x => x.classList.toggle('on', +x.dataset.cm === cs.m));
    };
    view.querySelectorAll('[data-ci]').forEach(b => b.onclick = () => { cs.i = +b.dataset.ci; refresh(); bindAudio(view); });
    view.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => { cs.m = +b.dataset.cm; refresh(); bindAudio(view); });
    const rnd = $('#cpRand');
    if (rnd) rnd.onclick = () => {
      cs.i = Math.floor(Math.random() * S.ini.length);
      cs.m = Math.floor(Math.random() * S.med.length);
      refresh(); bindAudio(view);
      const b = view.querySelector('.cp-act [data-audio]');
      if (b) play(b.dataset.audio);
    };
    const paint = () => { const box = $('#cpQuiz'); if (box) { box.innerHTML = quizCardHtml(); bindQuiz(); bindAudio(view); } };
    const bindQuiz = () => {
      const q = cs.q;
      view.querySelectorAll('[data-ans]').forEach(b => b.onclick = () => {
        if (q.picked !== null) return;
        q.picked = b.dataset.ans;
        paint();
      });
      const again = $('#cpAgain');
      if (again) again.onclick = () => { cs.q = cpQuizNew(); paint(); };
      const pb = $('#cpPlay');
      if (pb) pb.onclick = () => play(audioOf(q.target.kr));
    };
    bindQuiz();
  }

  function audioOf(say) {
    if (!say) return '';
    // 与 build 时一致：sha1(say)[:12] —— 由 data.js 里的 map 提供
    return (window.AUDIO_MAP || {})[say] || '';
  }

  /* ---------------- 复习 ---------------- */
  let revSession = null;
  function review() {
    crumb.textContent = '复习';
    topActions.innerHTML = '';
    if (!revSession) {
      const due = SRS.dueQueue(120);
      const nw = SRS.newQueue(SRS.load().settings.newPerDay);
      revSession = { queue: due.concat(nw), i: 0, flipped: false, ok: 0, again: 0, started: Date.now() };
    }
    const q = revSession.queue;
    if (revSession.i >= q.length) return reviewDone();

    const c = q[revSession.i];
    const total = q.length, idx = revSession.i;
    let h = `<div class="review-wrap">
      <div class="rev-progress"><span>${idx + 1} / ${total}</span><div class="bar"><i style="width:${pct(idx, total)}%"></i></div>
        <span>✓ ${revSession.ok}</span></div>
      <div class="flash" id="flash">`;
    if (!revSession.flipped) {
      if (c.dir === 'zh2kr') {
        h += `<div class="front-zh">${esc(c.front)}</div>`;
      } else {
        h += `<div class="front-kr">${esc(c.front)}</div>`;
        if (c.audio) h += `<div class="front-audio">${spkBtn(c.audio)}</div>`;
      }
      h += `<div class="hint">点击卡片翻面 · 空格键</div></div>`;
    } else {
      h += `<div class="front-kr" style="font-size:30px">${esc(c.dir === 'zh2kr' ? c.back : c.front)}</div>
        <div class="back">
          ${c.audio ? `<div style="margin-bottom:10px">${spkBtn(c.audio)}</div>` : ''}
          ${c.dir === 'zh2kr' ? `<div class="zh2">${esc(c.front)}</div>` : `<div class="kr2">${esc(c.back)}</div>`}
          <div class="rom2">${esc(c.rom || '')}</div>
          ${c.note ? `<div class="note2">${esc(c.note)}</div>` : ''}
          <div style="font-size:12px;color:var(--ink3);margin-top:10px">${esc(c.chTitle)} · ${esc(c.secTitle)}</div>
        </div></div>`;
    }
    h += `</div>`;
    if (revSession.flipped) {
      h += `<div class="rate-row">
        <button class="rate" data-r="0">忘记<small>1</small></button>
        <button class="rate" data-r="1">模糊<small>2</small></button>
        <button class="rate" data-r="2">记得<small>3</small></button>
        <button class="rate" data-r="3">太简单<small>4</small></button>
      </div>`;
    } else {
      h += `<div style="text-align:center;margin-top:14px"><button class="btn line" id="flipBtn">显示答案</button></div>`;
    }
    h += `</div>`;
    view.className = 'view';
    view.innerHTML = h;

    const flip = () => { revSession.flipped = true; review(); };
    const flash = $('#flash');
    if (flash) flash.onclick = e => { if (!e.target.closest('.spk')) flip(); };
    const fb = $('#flipBtn'); if (fb) fb.onclick = flip;
    view.querySelectorAll('.rate').forEach(b => b.onclick = () => {
      const r = +b.dataset.r;
      SRS.rate(c.id, r);
      if (r === 0) { revSession.again++; revSession.queue.push(c); } else revSession.ok++;
      revSession.flipped = false;
      revSession.i++;
      review();
    });
    bindAudio(view);
  }
  function reviewDone() {
    const n = revSession ? revSession.ok + revSession.again : 0;
    const mins = revSession ? Math.max(1, Math.round((Date.now() - revSession.started) / 60000)) : 0;
    const st = SRS.cardStats();
    let h = `<div class="empty"><div class="big">${SVG('<circle cx="12" cy="12" r="9.2"/><path d="m7.8 12.3 2.9 2.9 5.6-5.9"/>')}</div>
      <h2 class="page-title">今天的复习完成了</h2>
      <p class="page-sub">复习 ${n} 张 · 用时约 ${mins} 分钟 · 待复习 ${st.due} 张</p>
      <div class="btns" style="justify-content:center;display:flex;gap:10px">
        <button class="btn" data-go="home">回到学习台</button>
        <button class="btn line" id="againBtn">再复习一轮</button>
        <button class="btn line" data-go="quiz">做测验</button>
      </div></div>`;
    view.className = 'view';
    view.innerHTML = h;
    bindGo();
    $('#againBtn').onclick = () => { revSession = null; review(); };
    revSession = null;
  }

  /* ---------------- 测验 ---------------- */
  let quizState = null;
  function quiz(scope) {
    crumb.textContent = '测验';
    topActions.innerHTML = '';
    if (!quizState && scope && String(scope).startsWith('sec:')) {
      const sid = String(scope).slice(4);
      const qs = QUIZ.build([sid], 8);
      if (!qs.length) { toast('这一节还没有足够的词汇，先去学一下'); quiz(); return; }
      quizState = { qs, i: 0, wrong: [], right: 0, secIds: [sid], scope: 'sec' };
      return quiz();
    }
    if (!quizState) {
      let h = `<h2 class="page-title">测验</h2>
        <p class="page-sub">题目从你学过的词汇和例句里自动生成，做错的词会回到复习队列。</p>
        <div class="card"><h3>选择范围</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">`;
      D.chapters.forEach(ch => {
        const p = SRS.chapterProgress(ch);
        h += `<button class="btn line" data-scope="${ch.id}">${esc(ch.title)} <span style="color:var(--ink3);font-weight:400">${p.pct}%</span></button>`;
      });
      h += `<button class="btn" data-scope="all">全书随机 20 题</button></div></div>`;
      view.className = 'view';
      view.innerHTML = h;
      view.querySelectorAll('[data-scope]').forEach(b => b.onclick = () => {
        const sc = b.dataset.scope;
        let secIds;
        if (sc === 'all') secIds = secs().map(s => s.id);
        else secIds = D.chapters.find(c => c.id === sc).sections.map(s => s.id);
        const n = sc === 'all' ? 20 : 10;
        const qs = QUIZ.build(secIds, n);
        if (!qs.length) { toast('这一章还没有足够的词汇，先去学几节吧'); return; }
        quizState = { qs, i: 0, wrong: [], right: 0, secIds, scope: sc };
        quiz();
      });
      return;
    }
    const S = quizState;
    if (S.i >= S.qs.length) return quizResult();
    const q = S.qs[S.i];
    let h = `<div class="qbox">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="qtype">${esc(q.label)}</span>
        <span class="qmeta">${S.i + 1} / ${S.qs.length}</span>
      </div>
      <div class="qtext ${q.promptClass}">${esc(q.prompt)}</div>
      ${q.audio ? `<div style="margin:-10px 0 16px">${spkBtn(q.audio)} <span style="font-size:12px;color:var(--ink3)">点喇叭再听一次</span></div>` : ''}
      <div class="opts">`;
    q.options.forEach((o, i) => {
      h += `<button class="opt ${o.kr ? 'kr-opt' : ''}" data-i="${i}">${esc(o.text)}</button>`;
    });
    h += `</div><div class="qfeed" id="feed"></div>
      <div class="qfoot"><span class="qmeta">✓ ${S.right}</span>
      <button class="btn line" id="nextBtn" style="display:none">下一题 →</button></div></div>`;
    view.className = 'view';
    view.innerHTML = h;
    bindAudio(view);
    if (q.audio) setTimeout(() => play(q.audio), 260);
    let answered = false;
    view.querySelectorAll('.opt').forEach(btn => btn.onclick = () => {
      if (answered) return;
      answered = true;
      const i = +btn.dataset.i;
      const correct = i === q.answerIndex;
      view.querySelectorAll('.opt').forEach((b, j) => {
        b.disabled = true;
        if (j === q.answerIndex) b.classList.add('correct');
        else if (j === i) b.classList.add('wrong');
      });
      if (correct) { S.right++; $('#feed').innerHTML = '✓ 答对了 · ' + esc(q.explain); }
      else {
        S.wrong.push(q);
        $('#feed').innerHTML = '✗ 正确答案：' + esc(q.options[q.answerIndex].text) + '<br><span style="font-size:12.5px;color:var(--ink3)">' + esc(q.explain) + '</span>';
      }
      const nb = $('#nextBtn');
      nb.style.display = '';
      nb.textContent = S.i + 1 >= S.qs.length ? '看结果 →' : '下一题 →';
      nb.onclick = () => { S.i++; quiz(); };
      nb.focus();
    });
  }
  function quizResult() {
    const S = quizState;
    const acc = Math.round(S.right / S.qs.length * 100);
    let h = `<div class="empty"><div class="big">${acc >= 80 ? '🏆' : acc >= 60 ? '👍' : '💪'}</div>
      <h2 class="page-title">${S.right} / ${S.qs.length} 正确（${acc}%）</h2>
      <p class="page-sub">${acc >= 80 ? '掌握得不错，继续保持！' : '错题已记录，会在复习里再见到它们。'}</p></div>`;
    if (S.wrong.length) {
      h += `<div class="card"><h3>错题回顾</h3>`;
      S.wrong.forEach(q => {
        h += `<div class="ex"><div class="kr-line">${esc(q.options[q.answerIndex].text)}</div>
          <div class="zh">${esc(q.explain)}</div></div>`;
      });
      h += `</div>`;
    }
    h += `<div style="display:flex;gap:10px;margin-top:18px">
      <button class="btn" data-go="quiz">再来一组</button>
      <button class="btn line" data-go="home">回到学习台</button>
      <button class="btn line" id="retryWrong">重做错题</button></div>`;
    view.className = 'view';
    view.innerHTML = h;
    bindGo();
    $('#retryWrong').onclick = () => {
      if (!S.wrong.length) { toast('没有错题'); return; }
      quizState = { qs: S.wrong.slice(), i: 0, wrong: [], right: 0, secIds: S.secIds, scope: S.scope };
      quiz();
    };
  }

  /* ---------------- 统计 ---------------- */
  function stats() {
    crumb.textContent = '统计';
    topActions.innerHTML = '';
    const st = SRS.cardStats();
    const s = SRS.load();
    const days = Object.keys(s.days).sort().slice(-30);
    const maxRev = Math.max(1, ...days.map(d => s.days[d].rev || 0));
    let h = `<h2 class="page-title">学习统计</h2><p class="page-sub">数据保存在本机浏览器里，换设备不同步。</p>
      <div class="grid4">
        <div class="stat"><div class="n">${SRS.streak()}<small> 天</small></div><div class="l">连续学习</div></div>
        <div class="stat"><div class="n">${st.seen}<small> / ${st.total}</small></div><div class="l">已接触卡片</div></div>
        <div class="stat"><div class="n">${st.mature}</div><div class="l">长期记住（间隔≥21天）</div></div>
        <div class="stat"><div class="n" style="color:var(--pink)">${st.due}</div><div class="l">今日待复习</div></div>
      </div>
      <div class="card" style="margin-top:18px"><h3>最近 30 天复习量</h3>
        <div style="display:flex;align-items:flex-end;gap:4px;height:110px;margin-top:14px">`;
    const last30 = [];
    for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); last30.push(d); }
    last30.forEach(d => {
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      const v = (s.days[k] && s.days[k].rev) || 0;
      h += `<div title="${k} · ${v} 张" style="flex:1;height:${Math.max(3, v / maxRev * 100)}%;background:${v ? 'var(--pink)' : 'var(--bg2)'};border-radius:3px"></div>`;
    });
    h += `</div><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink3);margin-top:6px"><span>30 天前</span><span>今天</span></div></div>`;

    h += `<div class="card" style="margin-top:18px"><h3>各章进度</h3>`;
    D.chapters.forEach(ch => {
      const p = SRS.chapterProgress(ch);
      h += `<div style="margin:14px 0"><div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:5px">
        <span>${esc(ch.title)}</span><span style="color:var(--ink3)">${p.done}/${p.tot} 节</span></div>
        <div class="bar"><i style="width:${p.pct}%"></i></div></div>`;
    });
    h += `</div>`;

    const wrongIds = Object.keys(s.wrong || {}).sort((a, b) => s.wrong[b] - s.wrong[a]).slice(0, 20);
    if (wrongIds.length) {
      const cmap = {};
      SRS.buildCards().forEach(c => cmap[c.id] = c);
      h += `<div class="card" style="margin-top:18px"><h3>最常错的卡</h3><div class="table-wrap" style="max-height:340px"><table class="tbl">
        <thead><tr><th>内容</th><th>释义</th><th>错误次数</th></tr></thead><tbody>`;
      wrongIds.forEach(id => {
        const c = cmap[id]; if (!c) return;
        h += `<tr><td class="kr">${esc(c.front)}</td><td>${esc(c.dir === 'zh2kr' ? c.front : c.back)}</td><td>${s.wrong[id]}</td></tr>`;
      });
      h += `</tbody></table></div></div>`;
    }

    h += `<div style="margin-top:22px;display:flex;gap:10px">
      <button class="btn line" id="exportBtn2">导出学习数据（JSON）</button>
      <button class="btn line" id="resetBtn" style="color:#d05a5a">清空所有学习记录</button></div>`;
    view.className = 'view';
    view.innerHTML = h;
    $('#exportBtn2').onclick = exportData;
    $('#resetBtn').onclick = () => {
      if (confirm('确定清空全部学习记录？此操作不可恢复。')) { SRS.reset(); toast('已清空'); stats(); renderNav(); }
    };
  }

  /* ---------------- 词库 ---------------- */
  function vocabView() {
    crumb.textContent = '词库';
    topActions.innerHTML = '';
    const all = [];
    D.chapters.forEach(ch => ch.sections.forEach(s => (s.vocab || []).forEach(v => all.push(Object.assign({ sec: s.title, ch: ch.title, secId: s.id }, v)))));
    const q = vocabView._q || '';
    const list = q ? all.filter(v => (v.kr + v.zh + v.rom).toLowerCase().includes(q.toLowerCase())) : all;
    let h = `<h2 class="page-title">词库</h2><p class="page-sub">全书共 ${all.length} 个词条。点喇叭听发音，点中文可遮挡自测。</p>
      <div style="margin-bottom:14px"><input id="vq" placeholder="筛选：韩语 / 中文 / 罗马音" value="${esc(q)}"
        style="width:100%;max-width:380px;padding:10px 14px;border-radius:11px;border:1px solid var(--line);background:var(--card);color:var(--ink);font-size:14px"></div>
      <div class="table-wrap"><table class="tbl"><thead><tr><th>韩语</th><th>罗马音</th><th>中文</th><th>出处</th></tr></thead><tbody>`;
    list.slice(0, 3000).forEach(v => {
      h += `<tr><td class="kr">${esc(v.kr)}${spkBtn(v.a)}</td><td style="font-family:var(--mono);font-size:12px;color:var(--ink3)">${esc(v.rom)}</td>
        <td>${esc(v.zh)}</td><td style="font-size:12px;color:var(--ink3);white-space:nowrap">${esc(v.ch)} · ${esc(v.sec)}</td></tr>`;
    });
    h += `</tbody></table></div>`;
    if (!list.length) h = `<div class="empty">没有匹配的词</div>`;
    view.className = 'view wide';
    view.innerHTML = h;
    bindAudio(view);
    const inp = $('#vq');
    if (inp) inp.oninput = () => { vocabView._q = inp.value; const pos = inp.selectionStart; vocabView(); const i2 = $('#vq'); if (i2) { i2.focus(); i2.setSelectionRange(pos, pos); } };
  }

  /* ---------------- 搜索 ---------------- */
  function searchView(q) {
    crumb.textContent = '搜索：' + q;
    topActions.innerHTML = '';
    if (!q) { view.innerHTML = '<div class="empty">输入关键词搜索</div>'; return; }
    const res = [];
    secs().forEach(s => {
      const hit = [];
      (s.concepts || []).forEach(c => { if ((c.title + c.body).includes(q)) hit.push({ t: c.title, b: c.body.slice(0, 120) }); });
      (s.vocab || []).forEach(v => { if ((v.kr + v.zh + v.rom).includes(q)) hit.push({ t: v.kr + ' ' + v.zh, b: v.rom }); });
      (s.examples || []).forEach(e => { if ((e.kr + e.zh).includes(q)) hit.push({ t: e.kr, b: e.zh }); });
      if (hit.length) res.push({ s, hit });
    });
    let h = `<h2 class="page-title">搜索「${esc(q)}」</h2><p class="page-sub">${res.length} 节命中</p>`;
    res.forEach(r => {
      h += `<div class="card" style="margin-bottom:12px"><h3><a href="#/lesson/${r.s.id}">${esc(r.s._ch.title)} · ${esc(r.s.title)}</a></h3>`;
      r.hit.slice(0, 6).forEach(x => {
        h += `<div style="font-size:13.5px;margin:6px 0"><b>${krWrap(esc(x.t))}</b> <span style="color:var(--ink3)">${krWrap(esc(x.b))}</span></div>`;
      });
      h += `</div>`;
    });
    if (!res.length) h += `<div class="empty">没有找到「${esc(q)}」</div>`;
    view.className = 'view';
    view.innerHTML = h;
  }

  /* ---------------- 学习计划 ---------------- */
  function plan() {
    crumb.textContent = '学习计划';
    topActions.innerHTML = '';
    const planData = D.plan || [];
    let h = `<h2 class="page-title">12 周学习计划</h2>
      <p class="page-sub">按每周 5 天、每天 40–60 分钟设计。零基础从头学，学完对应 TOPIK I 初级水平。</p>`;
    if (!planData.length) {
      h += `<div class="empty">计划生成中</div>`;
    } else {
      planData.forEach((w, i) => {
        const ids = w.sections || [];
        const done = ids.filter(id => SRS.isDone(id)).length;
        h += `<div class="week-card">
          <div style="display:flex;align-items:center;gap:10px"><span class="tag">第 ${i + 1} 周</span>
            <h4 style="margin:0">${esc(w.name || w.title)}</h4>
            <span style="margin-left:auto;font-size:12px;color:var(--ink3)">${done}/${ids.length} 节</span></div>
          <div class="bar" style="margin:8px 0 10px"><i style="width:${pct(done, ids.length)}%"></i></div>
          <ul>${(w.goals || []).map(g => `<li>${esc(g)}</li>`).join('')}</ul>
          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">`;
        ids.forEach(id => {
          const s = findSec(id); if (!s) return;
          h += `<button class="btn sm line" data-go="lesson/${id}" style="${SRS.isDone(id) ? 'border-color:var(--green);color:var(--green)' : ''}">${SRS.isDone(id) ? '✓ ' : ''}${esc(s.title)}</button>`;
        });
        h += `</div></div>`;
      });
    }
    view.className = 'view';
    view.innerHTML = h;
    bindGo();
  }

  /* ---------------- 通用绑定 ---------------- */
  function bindGo() {
    view.querySelectorAll('[data-go]').forEach(el => el.onclick = () => { location.hash = '#/' + el.dataset.go; });
  }
  function bindAudio(root) {
    (root || view).querySelectorAll('[data-audio]').forEach(el => {
      el.onclick = ev => {
        ev.stopPropagation();
        play(el.dataset.audio, el.dataset.rate ? +el.dataset.rate : null, el.classList.contains('spk') ? el : null);
      };
    });
  }
  function exportData() {
    const blob = new Blob([JSON.stringify(SRS.load(), null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '韩语学习数据-' + SRS.today() + '.json';
    a.click();
    toast('已导出');
  }

  /* ---------------- 全局事件 ---------------- */
  $('#themeBtn').innerHTML = ICON.sun;
  $('#helpBtn').innerHTML = ICON.help;
  $('#exportBtn').innerHTML = ICON.download;
  $('#hamburger').innerHTML = ICON.menu;
  $('#themeBtn').onclick = () => {
    const st = SRS.load();
    st.settings.theme = st.settings.theme === 'dark' ? 'light' : 'dark';
    SRS.save();
    document.documentElement.dataset.theme = st.settings.theme;
    toast(st.settings.theme === 'dark' ? '深色模式' : '浅色模式');
  };
  $('#helpBtn').onclick = () => alert(
    '快捷键：\n· 复习时：空格 / 回车 翻面，1-4 评分\n· 课程页：← → 切换上下节\n\n学习数据保存在本机浏览器（localStorage），换浏览器或清缓存会丢失，可在「统计」页导出备份。'
  );
  $('#exportBtn').onclick = exportData;
  $('#hamburger').onclick = () => $('#sidebar').classList.toggle('open');
  const si = $('#searchInput');
  si.onkeydown = e => { if (e.key === 'Enter' && si.value.trim()) location.hash = '#/search/' + encodeURIComponent(si.value.trim()); };
  document.addEventListener('keydown', e => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/INPUT|TEXTAREA/.test(tag)) return;
    const r = (location.hash || '').slice(2);
    if (r.startsWith('review')) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (revSession && !revSession.flipped) { revSession.flipped = true; review(); }
      }
      if (revSession && revSession.flipped && /^[1-4]$/.test(e.key)) {
        const b = view.querySelector(`.rate[data-r="${+e.key - 1}"]`); if (b) b.click();
      }
    } else if (r.startsWith('lesson/')) {
      const id = r.split('/')[1];
      const all = secs(); const i = all.findIndex(x => x.id === id);
      if (e.key === 'ArrowRight' && all[i + 1]) location.hash = '#/lesson/' + all[i + 1].id;
      if (e.key === 'ArrowLeft' && all[i - 1]) location.hash = '#/lesson/' + all[i - 1].id;
    }
  });

  /* ---------------- 启动 ---------------- */
  const st0 = SRS.load();
  document.documentElement.dataset.theme = st0.settings.theme || 'light';
  renderNav();
  route();
  window.addEventListener('hashchange', renderNav);
})();
