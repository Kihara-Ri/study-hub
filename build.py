#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把所有学习书组装成一个可部署到 GitHub Pages 的静态站：docs/

  docs/index.html          总落地页（按 日语 / 语言课程 / 设计 / 文化 分组）
  docs/jp-shadowing/       日语影子跟读（课文与音频 AES-GCM 加密，需密码）
  docs/korean/             韩语（课文加密，需密码）
  docs/arabic/ french/     自编课程，公开
  docs/arabic-culture/     阿拉伯文化书，公开
  docs/refactoring-ui/     Refactoring UI 中文版，公开

密码不写在仓库里：用环境变量 HUB_PASSWORD 或 --password 传入。
用法：
    HUB_PASSWORD=xxx python3 build.py
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import sys
from pathlib import Path

import legacy_books as wb

HERE = Path(__file__).resolve().parent
WS = Path(os.environ.get("HUB_WORKSPACE", HERE.parent))
SRC = {
    "korean": WS / "korean-book/dist",
    "arabic": WS / "arabic-course/dist",
    "french": WS / "french-course/dist",
    "arabic-culture": WS / "arabic-culture-book/dist",
    "refactoring-ui": WS / "refactoring-ui-book/site",
    "jp": WS / "jp-shadowing/site",
    "french-data": WS / "french-course/build/data.json",
}
OUT = HERE / "docs"
ITER = wb.ITERATIONS

# legacy_books 的路径常量改指向这里的配置
wb.KR, wb.AR, wb.FR, wb.AC = (str(SRC[k]) for k in ("korean", "arabic", "french", "arabic-culture"))


# ---------------------------------------------------------------- 日语影子跟读（加密）

def build_jp(outdir: Path, password: str):
    """数据 JSON 与音频逐文件 AES-GCM 加密：文件 = iv(12) + 密文。
    密钥由密码经 PBKDF2 派生一次；data/check.bin 用来校验密码。"""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    src = SRC["jp"]
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITER, 32)
    aes = AESGCM(key)

    def enc(plain: bytes) -> bytes:
        iv = os.urandom(12)
        return iv + aes.encrypt(iv, plain, None)

    if outdir.exists():
        shutil.rmtree(outdir)
    (outdir / "data").mkdir(parents=True)
    (outdir / "audio").mkdir()
    shutil.copy2(src / "style.css", outdir / "style.css")
    shutil.copy2(src / "app.js", outdir / "app.js")
    json.dump({"salt": __import__("base64").b64encode(salt).decode(), "iter": ITER},
              open(outdir / "lock.json", "w"))
    (outdir / "data" / "check.bin").write_bytes(enc(b"jp-shadowing-ok"))
    for p in sorted((src / "data").glob("*.json")):
        (outdir / "data" / f"{p.stem}.bin").write_bytes(enc(p.read_bytes()))
    for p in sorted((src / "audio").glob("*.mp3")):
        (outdir / "audio" / f"{p.stem}.bin").write_bytes(enc(p.read_bytes()))

    html = (src / "index.html").read_text(encoding="utf-8")
    html = html.replace('<meta charset="utf-8">',
                        '<meta charset="utf-8">\n<meta name="jps-lock" content="1">\n'
                        '<meta name="robots" content="noindex, nofollow">', 1)
    html = html.replace('<nav>', '<nav>\n    <a href="../index.html">选书</a>', 1)
    (outdir / "index.html").write_text(html, encoding="utf-8")


def build_jp_plain(outdir: Path):
    """不加密：直接拷贝站点文件（去掉本地预览用的 serve.py / artifact.html）。"""
    if outdir.exists():
        shutil.rmtree(outdir)
    shutil.copytree(SRC["jp"], outdir, ignore=shutil.ignore_patterns("serve.py", "artifact.html"))
    p = outdir / "index.html"
    h = p.read_text(encoding="utf-8").replace("<nav>", '<nav>\n    <a href="../index.html">选书</a>', 1)
    p.write_text(h, encoding="utf-8")


def jp_meta() -> str:
    idx = json.load(open(SRC["jp"] / "data/index.json", encoding="utf-8"))
    nl = sum(i["nl"] for i in idx)
    nx = sum(i["nx"] for i in idx)
    mins = round(sum(i["dur"] for i in idx) / 60)
    return f"{len(idx)} 课 · {nl} 句对话 · {nx} 条地道表达 · 约 {mins} 分钟音频"


# ---------------------------------------------------------------- Refactoring UI

def copy_rui(outdir: Path):
    """整站拷贝；去掉它自己的 404 / robots（由总站统一提供），每页加「返回选书」。"""
    if outdir.exists():
        shutil.rmtree(outdir)
    shutil.copytree(SRC["refactoring-ui"], outdir,
                    ignore=shutil.ignore_patterns("404.html", "robots.txt"))
    grid = ('<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="5" height="5" rx="1"></rect>'
            '<rect x="9" y="2" width="5" height="5" rx="1"></rect><rect x="2" y="9" width="5" height="5" rx="1"></rect>'
            '<rect x="9" y="9" width="5" height="5" rx="1"></rect></svg>')
    for p in outdir.rglob("*.html"):
        depth = len(p.relative_to(OUT).parts) - 1  # 到 docs 根需要退几级
        href = "../" * depth + "index.html"
        h = p.read_text(encoding="utf-8")
        if "hub-back" in h or 'id="backhome"' in h:
            continue
        tools = '<div class="topbar__tools">'
        if tools in h:  # 放进顶栏工具区：小屏只显示图标
            link = (f'<a class="toolbtn hub-back" href="{href}" aria-label="返回选书" title="返回选书">'
                    f'{grid}<span class="toolbtn__label">选书</span></a>')
            h = h.replace(tools, tools + "\n    " + link, 1)
        else:           # 没有顶栏的页面才用悬浮胶囊
            back = f'<a id="backhome" href="{href}">← 返回选书</a>'
            h = h.replace("</head>", "<style>" + wb.BACK_CSS + "</style>\n</head>", 1)
            h = h.replace("</body>", back + "\n</body>", 1) if "</body>" in h else h + back
        p.write_text(h, encoding="utf-8")


# ---------------------------------------------------------------- 落地页

ICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' "
        "height='64' rx='14' fill='%232f7f8f'/%3E%3Ctext x='32' y='46' font-size='38' text-anchor='middle' "
        "fill='%23fff' font-family='sans-serif'%3E%E5%AD%A6%3C/text%3E%3C/svg%3E")

LOCK_SVG = ('<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" '
            'stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px">'
            '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>')


def card(href, cls, ico, title, meta, desc, tag):
    return (f'<a class="card {cls}" href="{href}"><div class="ico">{ico}</div><h3>{title}</h3>'
            f'<p class="meta">{meta}</p><p>{desc}</p><span class="tag">{tag}</span></a>')


def landing(fr_meta: str, updated: str, jp_locked: bool) -> str:
    locked = LOCK_SVG + "需要访问密码"
    jp_tag = locked if jp_locked else "✓ 直接打开"
    sections = [
        ("日语", [card("jp-shadowing/", "jp", "耳", "影子跟读 · 中级日语口语", jp_meta(),
                      "74 课生活对话，逐句点播、变速、单句循环、停顿跟读；每句带注音与中文，每课挑出可迁移的地道表达，并有跨课表达库。",
                      jp_tag)]),
        ("语言课程", [
            card("korean/", "kr", "가", "零起点韩语", "5 章 · 22 节 · 953 词条 · 605 例句",
                 "从字母和发音起步，到陈述、疑问、敬语、时态和句子连接。每个词、每个例句都能点读。", locked),
            card("arabic/", "ar", "ع", "零起点阿拉伯语", "5 章 · 26 节 · 889 词条 · 655 例句",
                 "现代标准阿拉伯语：字母四种形态、名词句、三个格、动词变位，最后是数字时间与阅读短文。", "✓ 直接打开"),
            card("french/", "fr", "é", "零起点法语", fr_meta,
                 "从字母、鼻化元音和连诵起步，到冠词、三组动词变位、复合过去时，最后是数字时间与阅读短文。", "✓ 直接打开")]),
        ("设计", [card("refactoring-ui/", "ui", "UI", "Refactoring UI 中文版", "9 章 · 13 个互动实验 · 32 个实时重制界面",
                      "把界面设计的层级、间距、色彩、深度讲成可动手的例子：拖一拖滑块，看设计怎么变好。", "✓ 直接打开 · 可交互")]),
        ("文化", [card("arabic-culture/", "bk", "书", "阿拉伯文化背景知识基础教程",
                      "6 编 · 46 章 · 144 节 · 52.3 万字",
                      "可交互阅读版：343 条术语注解、52 则小知识、互动字母表与词卡、百位名人卡片墙；全文搜索、阅读进度、深色模式。",
                      "✓ 直接打开 · 可交互")]),
    ]
    notice = ("日语跟读与韩语课程的内容整理自正式出版的教材，版权归原作者及出版方所有，仅供个人学习使用，所以加了访问密码，请勿转发或转载。"
              if jp_locked else
              "韩语课程的内容整理自正式出版的教材，版权归原作者及出版方所有，所以加了访问密码。"
              "日语跟读的文稿与音频同样来自正式出版的教材，版权归原作者及出版方所有，请仅用于个人学习，勿转发或商用。")
    body = "".join(f'<section><h2>{name}</h2><div class="grid">{"".join(cs)}</div></section>' for name, cs in sections)
    return f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>学习台 · 日语 韩语 阿拉伯语 法语 设计</title>
<link rel="icon" href="{ICON}">
<style>
*{{box-sizing:border-box}}
body{{margin:0;min-height:100vh;background:radial-gradient(1200px 600px at 20% -10%,#fdf1f5,transparent),
  radial-gradient(900px 500px at 100% 0%,#eaf5f7,transparent),#fbf7f2;color:#2b2620;
  font-family:-apple-system,"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif}}
.wrap{{max-width:940px;margin:0 auto;padding:64px 26px 90px}}
h1{{font-size:34px;margin:0 0 10px;letter-spacing:.5px}}
.lead{{color:#7c7268;font-size:15.5px;line-height:1.85;margin:0 0 12px;max-width:660px}}
section{{margin-top:38px}}
section>h2{{font-size:13px;letter-spacing:.2em;color:#9a9086;margin:0 0 14px;font-weight:600}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px}}
a.card{{display:block;text-decoration:none;color:inherit;background:#fff;border:1px solid #ece4d9;
  border-radius:18px;padding:24px 22px;transition:.18s;box-shadow:0 2px 10px rgba(120,90,60,.04)}}
a.card:hover{{transform:translateY(-3px);box-shadow:0 16px 38px rgba(120,90,60,.13);border-color:#e2d5c6}}
.card .ico{{font-size:26px;margin-bottom:10px;line-height:1.2}}
.card h3{{margin:0 0 6px;font-size:19px;line-height:1.4}}
.card .meta{{color:#9a9086;font-size:12.5px;margin:0 0 10px;letter-spacing:.2px}}
.card p{{margin:0;color:#6b6157;font-size:14px;line-height:1.75}}
.card .tag{{display:inline-block;margin-top:14px;font-size:12px;padding:3px 10px;border-radius:999px;background:#f6efe7;color:#9a7b52}}
.card.ar .tag{{background:#eef6f7;color:#2f7f8f}}
.card.fr .tag{{background:#f0f3fa;color:#3b5a9a}}
.card.bk .tag,.card.ui .tag{{background:#f4efe6;color:#8a6b3f}}
.card.jp .tag{{background:#fbefe6;color:#b4531a}}
footer{{margin-top:52px;color:#a2988d;font-size:12.5px;line-height:1.9;border-top:1px solid #eee6db;padding-top:18px}}
@media(max-width:680px){{.wrap{{padding:40px 18px 60px}}h1{{font-size:27px}}}}
</style></head>
<body><div class="wrap">
<h1>学习台</h1>
<p class="lead">自己在学的几门语言和几本书，放在同一个地方。浏览器里直接打开，进度和收藏只存在本机，不需要注册。</p>
{body}
<footer>
{notice}<br>
阿拉伯语、法语课程为自编教材；韩/阿/法发音由 edge-tts 合成。<br>
<a href="about.html" style="color:#9a7b52">关于内容来源与已知限制 →</a><span style="float:right;color:#b3a89c">更新于 {updated}</span>
</footer>
</div></body></html>
"""


def about(jp_locked: bool) -> str:
    jp_note = ("文本与音频在仓库里都是密文，仅在你输入密码后于浏览器本地解密。" if jp_locked else
               "当前站点<b>没有</b>为日语部分设置密码，文稿与音频是公开可下载的。")
    extra = """<h2>日语跟读：整理自一套正式出版的教材</h2>
<p>文稿由教材配套音频经 AI 语音识别、再由大模型校正标点与同音字、分场并翻译而成；每句时间点由识别结果对齐得到，
少数句子的时间点是估算值（页面上带小点标记）。地道表达卡片由大模型挑选并撰写说明，<b>未经人工校对</b>。</p>
<div class="note">课文与音频的<b>版权归原作者及出版方所有</b>。""" + jp_note + """请勿转发、转载或用于商业用途。</div>

<h2>Refactoring UI 中文版</h2>
<p>中文翻译与互动实验的静态站，构建自同一仓库外的源稿。</p>

<h2>发音</h2>"""
    s = wb.ABOUT.replace("<h2>发音</h2>", extra, 1)
    s = s.replace("这套学习台里的三本书，来路不一样，这里说清楚。", "这里的几本书，来路不一样，这里说清楚。")
    s = s.replace("语言学习台", "学习台")
    s = s.replace("<li>韩语课程数据在服务器上以 AES-256-GCM 加密存放，密码只在浏览器本地解密，不发送到服务器。</li>",
                  ("<li>韩语课程数据与日语跟读的文本、音频以 AES-256-GCM 加密存放，密码只在浏览器本地解密，不发送到服务器。</li>" if jp_locked else
                   "<li>韩语课程数据以 AES-256-GCM 加密存放，密码只在浏览器本地解密，不发送到服务器。</li>"))
    return s


NOT_FOUND = """<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex">
<title>页面不存在</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fbf7f2;color:#2b2620;
font-family:-apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif;text-align:center}a{color:#b4531a}</style></head>
<body><div><h1>找不到这个页面</h1><p>可能是链接写错了，或这本书的地址变了。</p><p><a href="./">回到学习台首页</a></p></div></body></html>
"""


def main():
    global OUT
    ap = argparse.ArgumentParser()
    ap.add_argument("--password", default=os.environ.get("HUB_PASSWORD"))
    ap.add_argument("--out", default=str(OUT))
    ap.add_argument("--lock-jp", action="store_true", help="给日语跟读加密（默认不加密）")
    a = ap.parse_args()
    if not a.password:
        sys.exit("缺少密码：设置环境变量 HUB_PASSWORD 或传 --password")
    out = Path(a.out)
    OUT = out
    if out.exists():
        for p in out.iterdir():
            shutil.rmtree(p) if p.is_dir() else p.unlink()
    out.mkdir(parents=True, exist_ok=True)

    print("→ 日语跟读（" + ("加密" if a.lock_jp else "不加密") + "）…")
    (build_jp if a.lock_jp else (lambda o, _p: build_jp_plain(o)))(out / "jp-shadowing", a.password)
    print("→ 韩语（加密）…")
    wb.lock_korean(a.password, str(out / "korean"))
    print("→ 阿拉伯语 / 法语 / 阿拉伯文化…")
    wb.copy_arabic(str(out / "arabic"))
    wb.copy_french(str(out / "french"))
    wb.copy_arabic_culture(str(out / "arabic-culture"))
    print("→ Refactoring UI…")
    copy_rui(out / "refactoring-ui")

    print("→ 落地页…")
    (out / "index.html").write_text(landing(wb._french_meta(), wb._today(), a.lock_jp), encoding="utf-8")
    (out / "about.html").write_text(about(a.lock_jp), encoding="utf-8")
    (out / "404.html").write_text(NOT_FOUND, encoding="utf-8")
    (out / "robots.txt").write_text("User-agent: *\nDisallow: /\n", encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")

    files = [p for p in out.rglob("*") if p.is_file()]
    size = sum(p.stat().st_size for p in files)
    big = max(files, key=lambda p: p.stat().st_size)
    print(f"✓ docs/ 就绪：{len(files)} 个文件，{size/1024/1024:.1f} MB；最大单文件 {big.relative_to(out)} "
          f"{big.stat().st_size/1024/1024:.1f} MB")


if __name__ == "__main__":
    main()
