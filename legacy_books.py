#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把三本书组装成一个可部署到 GitHub Pages 的静态站点。

- 韩语：全书内容来自《零起点标准韩语入门》，用 AES-GCM 加密，浏览器端凭密码解密后渲染。
        未解密前仓库里只有密文，看不到任何课文。
- 阿拉伯语：自编内容，直接公开。
- 法语：自编内容，直接公开。

用法：
    python3 build_site.py                # 组装到 site/
    python3 build_site.py --password XXX # 换访问密码
"""
import argparse
import base64
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
KR = "/home/kihara/dsh-workspace/korean-book/dist"
AR = "/home/kihara/dsh-workspace/arabic-course/dist"
FR = "/home/kihara/dsh-workspace/french-course/dist"
AC = "/home/kihara/dsh-workspace/arabic-culture-book/dist"
OUT = os.path.join(HERE, "site")

DEFAULT_PASSWORD = "HangulBook-2026"
ITERATIONS = 250000

# ---------------------------------------------------------------- 加密工具


def encrypt(plain: bytes, password: str) -> dict:
    """用 openssl 的 PBKDF2 + AES-256-GCM 做加密（与浏览器 WebCrypto 兼容）。

    这里不依赖第三方库：PBKDF2 用 hashlib，AES-GCM 用 cryptography（若无则退回 openssl CLI）。
    """
    salt = os.urandom(16)
    iv = os.urandom(12)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS, 32)
    ct = _aes_gcm_encrypt(key, iv, plain)
    return {
        "v": 1,
        "iter": ITERATIONS,
        "salt": base64.b64encode(salt).decode(),
        "iv": base64.b64encode(iv).decode(),
        "ct": base64.b64encode(ct).decode(),
    }


def _aes_gcm_encrypt(key: bytes, iv: bytes, plain: bytes) -> bytes:
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        return AESGCM(key).encrypt(iv, plain, None)
    except ImportError:
        pass
    # 退回 openssl CLI：openssl enc 不支持 GCM，改用 ChaCha20-Poly1305 不合适，
    # 因此这里直接报错提示安装 cryptography。
    raise SystemExit("需要 python 包 cryptography：pip install --break-system-packages cryptography")


# ---------------------------------------------------------------- 韩语加密码门

GATE_CSS = """
#gate{position:fixed;inset:0;background:linear-gradient(160deg,#fdf6ef,#f7e8ef 60%,#eef6f7);
  display:flex;align-items:center;justify-content:center;z-index:9999;padding:24px}
#gate .gc{background:#fff;border-radius:18px;box-shadow:0 18px 50px rgba(90,60,40,.16);
  padding:38px 34px;max-width:400px;width:100%;text-align:center}
#gate h2{margin:0 0 6px;font-size:24px;color:#2b2620}
#gate .sub{color:#8a7f74;font-size:13.5px;line-height:1.7;margin:0 0 22px}
#gate input{width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid #e6ded2;border-radius:10px;
  font-size:15px;outline:none;background:#fdfaf6}
#gate input:focus{border-color:#e0457b;background:#fff}
#gate button{margin-top:14px;width:100%;padding:12px;border:none;border-radius:10px;cursor:pointer;
  background:linear-gradient(135deg,#e0457b,#c93a6b);color:#fff;font-size:15px;font-weight:600}
#gate button:disabled{opacity:.6;cursor:default}
#gate .err{color:#c0392b;font-size:13px;min-height:20px;margin:10px 0 0}
#gate .gback{margin:6px 0 0;text-align:center}
#gate .gback a{color:#a2988d;font-size:13px;text-decoration:none}
#gate .gback a:hover{color:#c93a6b}
#gate .lockico{line-height:1;margin-bottom:8px}
"""

KR_GATE_JS = r"""
(function () {
  var ORDER = ['assets/srs.js', 'assets/quiz.js', 'assets/app.js'];
  var KEY = 'kr-book-unlocked';
  var gate = document.getElementById('gate');
  var app = document.getElementById('app');
  var input = document.getElementById('pw');
  var btn = document.getElementById('go');
  var err = document.getElementById('err');

  function b64(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function load(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.body.appendChild(s);
    });
  }

  async function decrypt(pw) {
    var meta = await (await fetch('assets/data.enc')).json();
    var enc = new TextEncoder();
    var base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64(meta.salt), iterations: meta.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(meta.iv) }, key, b64(meta.ct));
    return new TextDecoder().decode(pt);
  }

  async function enter(pw) {
    btn.disabled = true; err.textContent = '';
    try {
      if (!window.crypto || !crypto.subtle) throw new Error('需要 https 或 localhost 环境');
      var code = await decrypt(pw);
      (new Function(code))();
      for (var i = 0; i < ORDER.length; i++) await load(ORDER[i]);
      gate.remove(); app.hidden = false;
      sessionStorage.setItem(KEY, pw);
    } catch (e) {
      err.textContent = '密码不对，或者这个环境不支持解密（请用 https 访问）';
      btn.disabled = false;
      input.select();
    }
  }

  btn.onclick = function () { enter(input.value); };
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.onclick(); });
  input.focus();

  var saved = sessionStorage.getItem(KEY);
  if (saved) enter(saved);
})();
"""

HANDOUT_GATE_JS = r"""
(function () {
  var KEY = 'kr-handout-unlocked';
  var gate = document.getElementById('gate');
  var input = document.getElementById('pw');
  var btn = document.getElementById('go');
  var err = document.getElementById('err');

  function b64(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function decrypt(pw) {
    var meta = await (await fetch('assets/handout.enc')).json();
    var enc = new TextEncoder();
    var base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64(meta.salt), iterations: meta.iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    var pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(meta.iv) }, key, b64(meta.ct));
    return new TextDecoder().decode(pt);
  }

  async function enter(pw) {
    btn.disabled = true; err.textContent = '';
    try {
      var html = await decrypt(pw);
      sessionStorage.setItem(KEY, pw);
      document.open(); document.write(html); document.close();
    } catch (e) {
      err.textContent = '密码不对，或者这个环境不支持解密（请用 https 访问）';
      btn.disabled = false;
    }
  }

  btn.onclick = function () { enter(input.value); };
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.onclick(); });
  input.focus();
  var saved = sessionStorage.getItem(KEY);
  if (saved) enter(saved);
})();
"""

GATE_BODY = """<div id="gate"><div class="gc">
  <div class="lockico"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#c93a6b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2" fill="#c93a6b" stroke="none"/></svg></div>
  <h2>{title}</h2>
  <p class="sub">{sub}</p>
  <input id="pw" type="password" placeholder="输入访问密码" autocomplete="current-password">
  <button id="go">进入</button>
  <p class="err" id="err"></p>
  <p class="gback"><a href="../index.html">← 返回选书</a></p>
</div></div>
"""

# ---------------------------------------------------------------- 返回选书
# 应用外壳：在顶栏加一个「选书」按钮；独立页面（讲义/计划/速查表）：左上角浮动胶囊。
BACK_CSS = """
#backhome{position:fixed;right:18px;bottom:18px;z-index:9999;display:inline-flex;align-items:center;gap:6px;
  padding:7px 13px;border-radius:999px;background:rgba(255,255,255,.94);border:1px solid #e6ded2;
  color:#6b6157;font-size:13px;text-decoration:none;box-shadow:0 6px 20px rgba(120,90,60,.16);
  font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif;line-height:1}
#backhome:hover{border-color:#e0457b;color:#c93a6b}
@media print{#backhome{display:none}}
"""
BACK_LINK = '<a id="backhome" href="../index.html">← 返回选书</a>'

APP_BACK_BTN = (
    '<a class="icon-btn backhome" href="../index.html" title="返回选书">'
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" '
    'stroke-linecap="round" stroke-linejoin="round">'
    '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/>'
    '<rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/>'
    '<rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/>'
    '<rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/></svg>'
    '<span>选书</span></a>'
)
APP_BACK_CSS = (
    "<style>"
    ".icon-btn.backhome{display:inline-flex;flex-direction:row;align-items:center;justify-content:center;"
    "width:auto;height:34px;padding:0 12px;gap:6px;text-decoration:none;font-size:13px;"
    "color:var(--ink2,#6b6157);white-space:nowrap;flex:none}"
    ".icon-btn.backhome:hover{border-color:var(--pink,#e0457b);color:var(--pink,#e0457b)}"
    ".icon-btn.backhome svg{width:15px;height:15px;flex:none;display:block}"
    "@media(max-width:560px){.icon-btn.backhome span{display:none}.icon-btn.backhome{padding:0 9px}}"
    "</style>"
)


ICON_BOOK = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
             'stroke-linejoin="round"><path d="M12 6.5C10 4.8 7.5 4 4.5 4v14c3 0 5.5.8 7.5 2.5 2-1.7 4.5-2.5 7.5-2.5V4c-3 0-5.5.8-7.5 2.5z"/>'
             '<path d="M12 6.5V20"/></svg>')
ICON_CAL = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
            'stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/>'
            '<path d="M7.5 14h2M11 14h2M14.5 14h2M7.5 17.5h2M11 17.5h2"/></svg>')
ICON_INFO = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '
             'stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/>'
             '<circle cx="12" cy="7.9" r="0.95" fill="currentColor" stroke="none"/></svg>')


def _sf_link(href: str, title: str, icon: str, blank: bool = True) -> str:
    t = ' target="_blank" rel="noopener"' if blank else ''
    return f'<a class="icon-btn" href="{href}"{t} title="{title}">{icon}</a>'


def inject_sidefoot(html: str, links) -> str:
    """把额外入口插到侧栏底部图标条最前面。"""
    if 'class="side-foot"' not in html:
        return html
    m = re.search(r'<div class="side-foot">', html)
    if not m:
        return html
    return html[: m.end()] + "\n      " + "".join(links) + html[m.end():]


def inject_app_back(html: str) -> str:
    """在应用外壳的顶栏插入「返回选书」按钮。"""
    if 'class="icon-btn backhome"' in html:
        return html
    if '<button class="icon-btn" id="hamburger"' in html:
        html = html.replace('<button class="icon-btn" id="hamburger"',
                            APP_BACK_BTN + '\n      <button class="icon-btn" id="hamburger"', 1)
    else:
        return html
    return html.replace("</head>", APP_BACK_CSS + "\n</head>", 1)


def inject_fixed_back(html: str) -> str:
    """在独立页面（讲义 / 学习计划 / 速查表）左上角插入浮动「返回选书」。"""
    if 'id="backhome"' in html:
        return html
    if "</head>" in html:
        html = html.replace("</head>", "<style>" + BACK_CSS + "</style>\n</head>", 1)
    if "</body>" in html:
        html = html.replace("</body>", BACK_LINK + "\n</body>", 1)
    else:
        html += BACK_LINK
    return html


def patch_html_file(path: str, fn) -> None:
    with open(path, encoding="utf-8") as f:
        html = f.read()
    new = fn(html)
    if new != html:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new)

GATE_HTML = """<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{title}</title>
<style>{css}</style></head>
<body>
<div id="gate"><div class="gc">
  <div class="lockico"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#c93a6b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.2" fill="#c93a6b" stroke="none"/></svg></div>
  <h2>{title}</h2>
  <p class="sub">{sub}</p>
  <input id="pw" type="password" placeholder="输入访问密码" autocomplete="current-password">
  <button id="go">进入</button>
  <p class="err" id="err"></p>
  <p class="gback"><a href="../index.html">← 返回选书</a></p>
</div></div>
{extra}
<script>{js}</script>
</body></html>
"""


def lock_korean(password: str, outdir: str):
    os.makedirs(os.path.join(outdir, "assets"), exist_ok=True)

    # 1) data.js → data.enc
    data_js = open(os.path.join(KR, "assets", "data.js"), "rb").read()
    meta = encrypt(data_js, password)
    with open(os.path.join(outdir, "assets", "data.enc"), "w", encoding="utf-8") as f:
        json.dump(meta, f, separators=(",", ":"))

    # 2) 通用脚本与样式：直接拷（不含任何课文内容）
    for name in ("style.css", "srs.js", "quiz.js", "app.js"):
        shutil.copy2(os.path.join(KR, "assets", name), os.path.join(outdir, "assets", name))

    # 3) 音频：文件名是句子的 sha1，不含明文，可直接公开
    dst_audio = os.path.join(outdir, "audio")
    if os.path.isdir(dst_audio):
        shutil.rmtree(dst_audio)
    shutil.copytree(os.path.join(KR, "audio"), dst_audio)

    # 4) 主页面：门 + 隐藏的应用外壳
    src = open(os.path.join(KR, "index.html"), encoding="utf-8").read()
    # 去掉原来的脚本引用，改为解密后动态加载
    src = re.sub(r'\s*<script src="assets/(data|srs|quiz|app)\.js"></script>', "", src)
    src = src.replace('<div id="app">', '<div id="app" hidden>')
    gate_body = GATE_BODY.format(
        title="韩语学习台",
        sub="这本课程包含《零起点标准韩语入门》全书内容，<br>请输入访问密码。")
    src = inject_app_back(src)
    src = inject_sidefoot(src, [
        _sf_link("讲义.html", "结构化讲义（可打印）", ICON_BOOK),
        _sf_link("学习计划.html", "12 周学习计划", ICON_CAL),
        _sf_link("../about.html", "关于内容来源", ICON_INFO, blank=False),
    ])
    src = src.replace("<body>", "<body>\n" + gate_body, 1)
    src = src.replace("</head>", "<style>" + GATE_CSS + "</style>\n</head>", 1)
    src = src.replace("</body>", "<script>" + KR_GATE_JS + "</script>\n</body>", 1)
    src = src.replace('<meta name="viewport"', '<meta name="robots" content="noindex, nofollow">\n<meta name="viewport"', 1)
    with open(os.path.join(outdir, "index.html"), "w", encoding="utf-8") as f:
        f.write(src)

    # 5) 讲义：加密全文，门页面负责解密后 document.write
    handout = open(os.path.join(KR, "讲义.html"), "rb").read()
    hmeta = encrypt(handout, password)
    with open(os.path.join(outdir, "assets", "handout.enc"), "w", encoding="utf-8") as f:
        json.dump(hmeta, f, separators=(",", ":"))
    gate_page = GATE_HTML.format(
        title="韩语讲义", sub="讲义含全书正文，请输入访问密码。",
        css=GATE_CSS, js=HANDOUT_GATE_JS, extra="")
    with open(os.path.join(outdir, "讲义.html"), "w", encoding="utf-8") as f:
        f.write(gate_page)

    # 6) 学习计划：不含课文正文，直接公开
    plan_dst = os.path.join(outdir, "学习计划.html")
    shutil.copy2(os.path.join(KR, "学习计划.html"), plan_dst)
    patch_html_file(plan_dst, inject_fixed_back)
    return len(data_js), len(handout)


# ---------------------------------------------------------------- 阿拉伯语

def copy_arabic(outdir: str):
    if os.path.isdir(outdir):
        shutil.rmtree(outdir)
    shutil.copytree(AR, outdir)
    # 应用外壳：顶栏加「选书」；独立页面：左上角浮动返回
    patch_html_file(os.path.join(outdir, "index.html"), inject_app_back)
    patch_html_file(
        os.path.join(outdir, "index.html"),
        lambda h: inject_sidefoot(h, [_sf_link("../about.html", "关于内容来源", ICON_INFO, blank=False)]),
    )
    for name in ("讲义.html", "学习计划.html", "速查表.html"):
        p = os.path.join(outdir, name)
        if os.path.isfile(p):
            patch_html_file(p, inject_fixed_back)
    return True


# ---------------------------------------------------------------- 法语

def copy_french(outdir: str):
    if os.path.isdir(outdir):
        shutil.rmtree(outdir)
    shutil.copytree(FR, outdir)
    patch_html_file(os.path.join(outdir, "index.html"), inject_app_back)
    patch_html_file(
        os.path.join(outdir, "index.html"),
        lambda h: inject_sidefoot(h, [_sf_link("../about.html", "关于内容来源", ICON_INFO, blank=False)]),
    )
    for name in ("讲义.html", "学习计划.html", "速查表.html"):
        p = os.path.join(outdir, name)
        if os.path.isfile(p):
            patch_html_file(p, inject_fixed_back)
    return True


# ---------------------------------------------------------------- 阿拉伯文化书

def copy_arabic_culture(outdir: str):
    """纯阅读版线上书：零依赖单页 + 影印图，整目录直接拷贝。"""
    if not os.path.isdir(AC):
        print("  ! 缺 arabic-culture-book/dist，跳过")
        return False
    if os.path.isdir(outdir):
        shutil.rmtree(outdir)
    shutil.copytree(AC, outdir)
    patch_html_file(os.path.join(outdir, "index.html"), inject_reading_back)
    return True


def inject_reading_back(html: str) -> str:
    """在阅读器顶栏加「返回选书」。"""
    if 'class="icon-btn ac-back"' in html:
        return html
    link = ('<a class="icon-btn ac-back" href="../index.html" title="返回选书" '
            'aria-label="返回选书" style="text-decoration:none">←</a>')
    if '<div class="top-actions">' in html:
        html = html.replace('<div class="top-actions">',
                            '<div class="top-actions">' + link, 1)
    return html


# ---------------------------------------------------------------- 落地页

LANDING = """<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>语言学习台 · 韩语 & 阿拉伯语 & 法语</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%232f7f8f'/%3E%3Ctext x='32' y='46' font-size='38' text-anchor='middle' fill='%23fff' font-family='sans-serif'%3E%E8%AF%AD%3C/text%3E%3C/svg%3E">
<meta name="description" content="三套从零开始的语言自学课程：韩语（5 章 22 节）、阿拉伯语（5 章 26 节）、法语（5 章 24 节）。浏览器里直接学，点词发音、间隔重复复习、随机测验、进度自动保存。">
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:radial-gradient(1200px 600px at 20% -10%,#fdf1f5,transparent),
  radial-gradient(900px 500px at 100% 0%,#eaf5f7,transparent),#fbf7f2;color:#2b2620;
  font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:72px 26px 90px}
h1{font-size:34px;margin:0 0 10px;letter-spacing:.5px}
.lead{color:#7c7268;font-size:15.5px;line-height:1.85;margin:0 0 40px;max-width:640px}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
a.card{display:block;text-decoration:none;color:inherit;background:#fff;border:1px solid #ece4d9;
  border-radius:18px;padding:26px 24px;transition:.18s;box-shadow:0 2px 10px rgba(120,90,60,.04)}
a.card:hover{transform:translateY(-3px);box-shadow:0 16px 38px rgba(120,90,60,.13);border-color:#e2d5c6}
.card .ico{font-size:26px;margin-bottom:12px}
.card h2{margin:0 0 6px;font-size:20px}
.card .meta{color:#9a9086;font-size:12.5px;margin:0 0 12px;letter-spacing:.3px}
.card p{margin:0;color:#6b6157;font-size:14px;line-height:1.75}
.card .tag{display:inline-block;margin-top:14px;font-size:12px;padding:3px 10px;border-radius:999px;
  background:#f6efe7;color:#9a7b52}
.card.ar .tag{background:#eef6f7;color:#2f7f8f}
.card.fr .tag{background:#f0f3fa;color:#3b5a9a}
.card.bk .tag{background:#f4efe6;color:#8a6b3f}
footer{margin-top:52px;color:#a2988d;font-size:12.5px;line-height:1.9;border-top:1px solid #eee6db;padding-top:18px}
@media(max-width:880px){.grid{gap:14px}}
@media(max-width:680px){.grid{grid-template-columns:1fr}.wrap{padding:44px 20px 60px}h1{font-size:27px}}
</style></head>
<body><div class="wrap">
<h1>语言学习台</h1>
<p class="lead">三套从零开始的自学课程 + 一本线上书，都能在浏览器里直接打开：课程可点词听发音、间隔重复复习、随机测验；<br>
书可全文搜索、记住阅读进度、深色模式与打印讲义。不需要安装，不需要注册。</p>
<div class="grid">
  <a class="card kr" href="korean/">
    <div class="ico">가</div>
    <h2>零起点韩语</h2>
    <p class="meta">5 章 · 22 节 · 953 词条 · 605 例句</p>
    <p>从字母和发音起步，到陈述句、疑问句、敬语、时态、句子连接，最后是音变与句子成分。每个词、每个例句都能点读。</p>
    <span class="tag"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>需要访问密码</span>
  </a>
  <a class="card ar" href="arabic/">
    <div class="ico">ع</div>
    <h2>零起点阿拉伯语</h2>
    <p class="meta">5 章 · 26 节 · 889 词条 · 655 例句</p>
    <p>现代标准阿拉伯语（MSA）：28 个字母的四种形态、名词句、三个格、正偏组合、动词变位，最后是数字时间与阅读短文。</p>
    <span class="tag">✓ 直接打开</span>
  </a>
  <a class="card fr" href="french/">
    <div class="ico">é</div>
    <h2>零起点法语</h2>
    <p class="meta">{fr_meta}</p>
    <p>从 26 个字母、鼻化元音和连诵起步，到名词冠词、三组动词变位、复合过去时，最后是数字时间与阅读短文。</p>
    <span class="tag">✓ 直接打开</span>
  </a>
  <a class="card bk" href="arabic-culture/">
    <div class="ico">书</div>
    <h2>阿拉伯文化背景知识基础教程</h2>
    <p class="meta">6 编 · 46 章 · 144 节 · 155 条目录 · 52.3 万字</p>
    <p>《阿拉伯文化背景知识基础教程》可交互版：阿拉伯语语言与文学、伊斯兰文化、阿拉伯国家概况、百位文化名人、中阿交流。正文按「节」成页，带 <b>343 条术语注解</b>（点词即看释义）、<b>52 则小知识</b>、<b>96 条行内脚注</b>、书名/年份/古兰经引用高亮；另有互动字母表、阿语词卡、思考题自测、百位名人卡片墙、书签与笔记；全文搜索、阅读进度、深色模式与打印讲义。</p>
    <span class="tag">✓ 直接打开 · 可交互</span>
  </a>
</div>
<footer>
韩语课程内容整理自《零起点标准韩语入门》（张阳 编著），仅供个人学习使用，版权归原作者及出版方所有。<br>
阿拉伯语、法语课程为自编教材。发音由 edge-tts 生成。<br>
《阿拉伯文化背景知识基础教程》为原书 PDF 的可交互阅读版（正文经程序化抽取与阿拉伯文重建，仅供个人学习）。<br>
<a href="about.html" style="color:#9a7b52">关于内容来源与已知限制 →</a><span style="float:right;color:#b3a89c;font-size:12.5px">更新于 {updated}</span>
</footer>
</div></body></html>
"""


ABOUT = """<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>关于内容来源 · 语言学习台</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%232f7f8f'/%3E%3Ctext x='32' y='46' font-size='38' text-anchor='middle' fill='%23fff' font-family='sans-serif'%3E%E8%AF%AD%3C/text%3E%3C/svg%3E">
<style>
*{box-sizing:border-box}
body{margin:0;background:#fbf7f2;color:#2b2620;line-height:1.85;
  font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:56px 26px 100px}
h1{font-size:28px;margin:0 0 6px}
.sub{color:#9a9086;font-size:13.5px;margin:0 0 34px}
h2{font-size:18px;margin:38px 0 10px;padding-bottom:8px;border-bottom:1px solid #eee6db}
p,li{font-size:15px;color:#4a443d}
ul{padding-left:20px;margin:8px 0}
li{margin:5px 0}
.note{background:#fff;border:1px solid #ece4d9;border-left:4px solid #e0457b;border-radius:10px;
  padding:14px 18px;margin:18px 0;font-size:14.5px;color:#6b6157}
.note.blue{border-left-color:#2f7f8f}
code{background:#f3ece4;padding:1px 6px;border-radius:5px;font-size:13px}
a.back{display:inline-block;margin-top:40px;color:#c93a6b;text-decoration:none;font-size:14px}
</style></head>
<body><div class="wrap">
<h1>关于内容来源</h1>
<p class="sub">这套学习台里的三本书，来路不一样，这里说清楚。</p>

<h2>韩语：整理自一本正式出版的教材</h2>
<p>内容整理自 <b>《零起点标准韩语入门》</b>（张阳 编著，2019 年）。原书 330 页是扫描件，没有文字层，
逐页用视觉模型读取后结构化，再经四个子智能体交叉校对（约 84 页抽样，修正了十余处转写与标音错误）。</p>
<div class="note">课文、词汇、例句的<b>版权归原作者及出版方所有</b>。这里仅供个人学习使用，
所以加了访问密码，不公开传播。请勿转发、转载或用于任何商业用途。</div>

<h2>阿拉伯语：AI 自编，没有对应的教材</h2>
<p>这套阿拉伯语课程<b>没有参考任何一本教材</b>，是把韩语学习台的教学结构（章节切分、每节五段式、
间隔重复复习卡、12 周计划）搬过来，语言材料由 AI 从零撰写。共 5 章 26 节，约 889 个词条、655 个例句。</p>
<div class="note blue">它<b>没有经过母语者或教材校对</b>。字母、标音、格与式、正偏组合这些标准语法大体可靠，
但个别词汇用法、特殊复数、动词派生形式、方言对照可能有错。发现疑问请以权威教材为准。</div>

<h2>法语：AI 自编，没有对应的教材</h2>
<p>与阿拉伯语课程一样，法语课程<b>没有参考任何一本教材</b>，是沿用同一套教学结构（5 章 24 节、每节五段式、
复习卡、12 周计划）由 AI 撰写的语言材料。</p>
<div class="note blue">同样<b>没有经过母语者或教材校对</b>。字母、音标、冠词、三组动词变位、时态构成这些
标准语法大体可靠，但个别词的阴阳性、不规则动词形式、连诵与省音的取舍可能有错。有疑问请以权威教材为准。</div>

<h2>发音</h2>
<p>全部音频由微软 edge-tts 语音合成生成（韩语 <code>ko-KR-SunHiNeural</code>，阿拉伯语
<code>ar-SA-ZariyahNeural</code>，法语 <code>fr-FR-DeniseNeural</code>），不是真人录音。语速平稳、发音标准，但缺少真人语调的起伏，
适合跟读，不适合当作语音范本。</p>

<h2>学习数据</h2>
<p>复习进度、错题、设置全部存在你自己浏览器的 <code>localStorage</code> 里，不上传任何服务器。
换浏览器或清除站点数据就会丢失，可以在「统计」页导出备份。</p>

<h2>技术说明</h2>
<ul>
<li>韩语课程数据在服务器上以 AES-256-GCM 加密存放，密码只在浏览器本地解密，不发送到服务器。</li>
<li>阿拉伯语、法语课程公开访问。</li>
<li>《阿拉伯文化背景知识基础教程》阅读版公开访问，正文由 PDF 文字层程序化抽取（阿拉伯文按字体 cmap 重建），
页面上标有「影印」的页面是原书扫描图（语音表、书法页无法可靠转文字）。</li>
<li>页面是纯静态文件，托管在 GitHub Pages，不需要后端。</li>
</ul>

<a class="back" href="index.html">← 返回选书</a>
</div></body></html>
"""


def _today() -> str:
    import datetime
    return datetime.date.today().strftime("%Y-%m-%d")


def _french_meta() -> str:
    import json
    try:
        d = json.load(open("/home/kihara/dsh-workspace/french-course/build/data.json", encoding="utf-8"))
        chs = d["chapters"]
        secs = [s for c in chs for s in c["sections"]]
        nv = sum(len(s.get("vocab", [])) for s in secs)
        ne = sum(len(s.get("examples", [])) for s in secs)
        return f"{len(chs)} 章 · {len(secs)} 节 · {nv} 词条 · {ne} 例句"
    except Exception:
        return "5 章 · 24 节"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--password", default=DEFAULT_PASSWORD)
    ap.add_argument("--out", default=OUT)
    args = ap.parse_args()

    if os.path.isdir(args.out):
        # 保留 .git（部署仓库用），其余清空重建
        for name in os.listdir(args.out):
            if name == ".git":
                continue
            p = os.path.join(args.out, name)
            shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
    else:
        os.makedirs(args.out)

    print("→ 加密韩语…")
    n1, n2 = lock_korean(args.password, os.path.join(args.out, "korean"))
    print(f"  data.js {n1//1024}KB → data.enc；讲义 {n2//1024}KB → handout.enc")

    print("→ 拷贝阿拉伯语…")
    copy_arabic(os.path.join(args.out, "arabic"))

    print("→ 拷贝法语…")
    copy_french(os.path.join(args.out, "french"))

    print("→ 拷贝阿拉伯文化书…")
    copy_arabic_culture(os.path.join(args.out, "arabic-culture"))

    print("→ 落地页…")
    fr_meta = _french_meta()
    with open(os.path.join(args.out, "index.html"), "w", encoding="utf-8") as f:
        f.write(LANDING.replace("{fr_meta}", fr_meta).replace("{updated}", _today()))
    with open(os.path.join(args.out, "about.html"), "w", encoding="utf-8") as f:
        f.write(ABOUT)

    # 统计
    total = 0
    files = 0
    for root, _, fs in os.walk(args.out):
        for fn in fs:
            files += 1
            total += os.path.getsize(os.path.join(root, fn))
    print(f"✓ site/ 就绪：{files} 个文件，{total/1024/1024:.1f} MB")


if __name__ == "__main__":
    main()
