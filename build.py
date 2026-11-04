#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把所有学习书组装成一个可部署到 GitHub Pages 的静态站：docs/

  docs/index.html          外壳（首页 + 抽屉 + 路由）；hub.js hub.css books.json course.js course.css
  docs/jp-shadowing/       日语影子跟读（course 类型，只有 data/ 与 audio/，公开）
  docs/korean/             韩语（课文加密，需密码）
  docs/arabic/ french/     自编课程，公开
  docs/arabic-culture/     阿拉伯文化书，公开
  docs/refactoring-ui/     Refactoring UI 中文版，公开

密码不写在仓库里：用环境变量 HUB_PASSWORD 或 --password 传入。
用法：
    HUB_PASSWORD=xxx python3 build.py
"""
import argparse
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

# legacy_books 的路径常量改指向这里的配置
wb.KR, wb.AR, wb.FR, wb.AC = (str(SRC[k]) for k in ("korean", "arabic", "french", "arabic-culture"))


# ---------------------------------------------------------------- 日语影子跟读（course 类型，只有数据）

REDIRECT = ("<!DOCTYPE html><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex\">"
            "<script>location.replace('../#/b/%s/'+location.hash.replace(/^#\\/?/,''))</script>")


def build_jp(outdir: Path):
    """course 类型的书在站里只留数据（data/、audio/），页面由外壳里的 course 渲染器画。
    旧地址 jp-shadowing/ 留一个跳转页，旧书签仍然有效。"""
    if outdir.exists():
        shutil.rmtree(outdir)
    shutil.copytree(SRC["jp"], outdir, ignore=shutil.ignore_patterns(
        "serve.py", "artifact.html", "index.html", "app.js", "style.css"))
    (outdir / "index.html").write_text(REDIRECT % "jp-shadowing", encoding="utf-8")


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


# ---------------------------------------------------------------- 语言入门课（lang 引擎：只留数据）

def parse_data_js(path: Path) -> dict:
    """data.js 是若干行 `window.NAME = {...};`，转成 {NAME: 对象}。"""
    out, dec = {}, json.JSONDecoder()
    s = path.read_text(encoding="utf-8")
    for m in re.finditer(r"window\.([A-Z_]+)\s*=\s*", s):
        out[m.group(1)], _ = dec.raw_decode(s, m.end())
    return out


def build_lang(outdir: Path, src: Path, docs=("讲义.html", "学习计划.html", "速查表.html"), password=None, keep=None):
    """法/阿/韩：数据转 JSON（有密码则 AES-GCM 加密成 course.enc）、音频照搬、可打印讲义页保留；
    index.html 换成跳转页。加密的书，讲义页也加密（沿用旧站的门页）。
    keep：{相对路径: 字节}，没给密码时原样沿用上次构建的密文（data.enc / handout.enc / 讲义.html），密文不用重新生成。"""
    if outdir.exists():
        shutil.rmtree(outdir)
    (outdir / "data").mkdir(parents=True)
    data = json.dumps(parse_data_js(src / "assets" / "data.js"), ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    if keep:
        (outdir / "data" / "course.enc").write_bytes(keep["assets/data.enc"])
    elif password:
        (outdir / "data" / "course.enc").write_text(json.dumps(wb.encrypt(data, password), separators=(",", ":")), encoding="utf-8")
    else:
        (outdir / "data" / "course.json").write_bytes(data)
    shutil.copytree(src / "audio", outdir / "audio")
    if (src / "assets" / "fonts").is_dir():
        shutil.copytree(src / "assets" / "fonts", outdir / "assets" / "fonts")
    back = '<p style="text-align:center;margin:30px"><a href="../#/b/%s">← 回到学习台</a></p>' % outdir.name
    for name in docs:
        if not (src / name).is_file():
            continue
        if keep and name == "讲义.html":
            (outdir / "assets").mkdir(exist_ok=True)
            (outdir / "assets" / "handout.enc").write_bytes(keep["assets/handout.enc"])
            (outdir / name).write_bytes(keep["讲义.html"])
            continue
        if password and name == "讲义.html":                              # 讲义含全书正文：加密，门页解密后再显示
            (outdir / "assets").mkdir(exist_ok=True)
            (outdir / "assets" / "handout.enc").write_text(
                json.dumps(wb.encrypt((src / name).read_bytes(), password), separators=(",", ":")), encoding="utf-8")
            (outdir / name).write_text(wb.GATE_HTML.format(title="讲义", sub="讲义含全书正文，请输入访问密码。",
                                                           css=wb.GATE_CSS, js=wb.HANDOUT_GATE_JS, extra=""), encoding="utf-8")
            continue
        h = (src / name).read_text(encoding="utf-8")
        (outdir / name).write_text(h.replace("</body>", back + "</body>", 1) if "</body>" in h else h, encoding="utf-8")
    (outdir / "index.html").write_text(REDIRECT % outdir.name, encoding="utf-8")


# ---------------------------------------------------------------- 外壳（首页 + 抽屉 + 嵌入）

SHELL = HERE / "shell"
GUARD = ("<script>(function(){if(top!==self||/[?&]raw\\b/.test(location.search))return;var s='%s',p=location.pathname,"
         "i=p.indexOf('/'+s+'/');if(i<0)return;var r=p.slice(i+s.length+2).replace(/index\\.html$/,'')+location.hash;"
         "location.replace(p.slice(0,i+1)+'#/b/'+s+(r?'/'+r:''))})()</script>")


def guard_pages(outdir: Path, slug: str):
    """书的页面若被直接打开（不在外壳里），自动跳到外壳里的同一位置；?raw 可跳过。"""
    g = GUARD % slug
    for p in outdir.rglob("*.html"):
        h = p.read_text(encoding="utf-8")
        if "top!==self" in h:
            continue
        h = h.replace("<head>", "<head>" + g, 1) if "<head>" in h else g + h
        p.write_text(h, encoding="utf-8")


def write_shell(out: Path, fr_meta: str, updated: str, books_root: str = ""):
    out.mkdir(parents=True, exist_ok=True)
    m = json.loads((SHELL / "books.json").read_text(encoding="utf-8"))
    sub = {"@jp_meta": jp_meta(), "@fr_meta": fr_meta}
    for b in m["books"]:
        if b.get("meta") in sub:
            b["meta"] = sub[b["meta"]]
    m["updated"] = updated
    (out / "books.json").write_text(json.dumps(m, ensure_ascii=False, indent=1), encoding="utf-8")
    for f in ("hub.css", "hub.js", "course.js", "course.css", "lang.js", "lang.css", "lang-fr.js", "lang-ar.js", "lang-kr.js"):
        shutil.copy2(SHELL / f, out / f)
    h = (SHELL / "index.html").read_text(encoding="utf-8")
    if books_root:
        h = h.replace('<meta name="robots"', f'<meta name="books-root" content="{books_root}">\n<meta name="robots"', 1)
    (out / "index.html").write_text(h, encoding="utf-8")


def about() -> str:
    jp_note = "当前站点<b>没有</b>为日语部分设置密码，文稿与音频是公开可下载的。"
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
                  "<li>韩语课程数据以 AES-256-GCM 加密存放，密码只在浏览器本地解密，不发送到服务器。</li>")
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
    a = ap.parse_args()
    out = Path(a.out)
    OUT = out
    # 没给密码时，沿用上次构建里韩语的密文（旧布局 assets/data.enc，或新布局 data/course.enc）
    keep = None
    if not a.password:
        kr = out / "korean"
        data_enc = next((kr / c for c in ("assets/data.enc", "data/course.enc") if (kr / c).is_file()), None)
        if data_enc and (kr / "assets/handout.enc").is_file() and (kr / "讲义.html").is_file():
            keep = {"assets/data.enc": data_enc.read_bytes(), "assets/handout.enc": (kr / "assets/handout.enc").read_bytes(),
                    "讲义.html": (kr / "讲义.html").read_bytes()}
        else:
            sys.exit("缺少密码：设置环境变量 HUB_PASSWORD 或传 --password（找不到上次构建的韩语密文可沿用）")
    if out.exists():
        for p in out.iterdir():
            shutil.rmtree(p) if p.is_dir() else p.unlink()
    out.mkdir(parents=True, exist_ok=True)

    print("→ 日语跟读…")
    build_jp(out / "jp-shadowing")
    print("→ 韩语（" + ("沿用上次的密文" if keep else "重新加密") + "）…")
    build_lang(out / "korean", SRC["korean"], docs=("讲义.html", "学习计划.html"), password=a.password, keep=keep)
    print("→ 阿拉伯语 / 法语 / 阿拉伯文化…")
    build_lang(out / "arabic", SRC["arabic"])
    build_lang(out / "french", SRC["french"])
    wb.copy_arabic_culture(str(out / "arabic-culture"))
    print("→ Refactoring UI…")
    copy_rui(out / "refactoring-ui")

    print("→ 外壳与跳转…")
    for slug in ("arabic-culture", "refactoring-ui"):
        guard_pages(out / slug, slug)
    write_shell(out, wb._french_meta(), wb._today())
    (out / "about.html").write_text(about(), encoding="utf-8")
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
