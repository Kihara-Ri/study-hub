# 学习台 study-hub

一个仓库、一个 GitHub Pages 静态站，收纳所有自学材料。站点输出在 `docs/`，Pages 从 `main` 分支的 `/docs` 发布。

整站是**一个单页应用**（外壳 `shell/`），书是数据加渲染器：

| 路径 | 内容 | 渲染方式 | 访问 |
|---|---|---|---|
| `/` | 首页：继续学习、搜索、书目；抽屉里是各书目录 | 外壳 | 公开 |
| `/#/b/jp-shadowing` | 日语影子跟读：74 课、逐句播放、表达库 | `course` 渲染器 | 公开 |
| `/#/b/korean` | 零起点韩语 | `course` + `lang` 引擎 | 密码（数据为密文） |
| `/#/b/arabic` `/#/b/french` | 自编阿拉伯语 / 法语课程 | `course` + `lang` 引擎 | 公开 |
| `/#/b/arabic-culture` | 阿拉伯文化背景知识（可交互阅读版） | 暂以 iframe 嵌入（`legacy`），待做 `reader` | 公开 |
| `/#/b/refactoring-ui` | Refactoring UI 中文版 | 暂以 iframe 嵌入（`legacy`），待做 `guide` | 公开 |

旧地址（如 `/french/`、`/jp-shadowing/#/lesson/07`）会自动跳到新地址。

## 结构

```
shell/books.json   书目清单：每本书一项（type / engine / lang / 目录…），加书从这里开始
shell/hub.js       外壳：路由、抽屉、首页、「继续学习」、主题；按需加载渲染器
shell/course.js    course 渲染器（对话 + 句级时间戳播放，日语用）
shell/lang.js      lang 引擎（韩/阿/法共用：讲解、词汇、例句、间隔复习、测验、词库、统计、计划）
shell/lang-*.js    各语言的字母/发音页（插件）
build.py           组装 docs/
```

站里每本 `course` 类书只留数据：`<书>/data/…`（法/阿是 `course.json`，韩语是加密的 `course.enc`）和 `<书>/audio/`。

## 仓库里有什么、没有什么

- 有：`build.py`（组装脚本）、`legacy_books.py`（加密、关于页、文化书的拷贝等旧逻辑）、`docs/`（构建产物）。
- 没有：原书 PDF、原始音频、识别文稿、各书的源码与源数据。这些留在服务器 `~/dsh-workspace/` 下各自的目录，
  其中韩语课文以密文形式出现在 `docs/`；日语跟读是公开明文。
- **密码不在仓库里。** 构建时通过环境变量 `HUB_PASSWORD` 传入。

## 重新构建与发布

源目录默认是 `~/dsh-workspace/` 下的兄弟目录（可用 `HUB_WORKSPACE` 改）：

| 书 | 取自 |
|---|---|
| 日语跟读 | `jp-shadowing/site/`（先在该目录跑 `build_site.py`） |
| 韩语 / 阿拉伯语 / 法语 / 阿拉伯文化 | 各自的 `dist/` |
| Refactoring UI | `refactoring-ui-book/site/` |

```bash
HUB_PASSWORD='你的密码' python3 build.py      # 生成 docs/（密码用于韩语）
HUB_PASSWORD='你的密码' ./deploy.sh "说明"    # 构建 + 提交 + 推送
```

每次构建都会换新的加密盐，所以即使内容没变，密文文件也会整体变化，提交会比较大；只改了某一本书时可以接受。

## 加一本新书

1. **同类型的书**（又一门语言入门课）：准备好 `data.js` 与 `audio/`，在 `shell/books.json` 加一项
   （`type:"course"`、`engine:"lang"`、`lang:{id,term,pron,name,…}`），在 `build.py` 里调一次 `build_lang()`；
   字母/发音页写一个 `shell/lang-<id>.js` 插件。
2. **新类型的书**：写一个渲染器 `shell/<类型>.js`（工厂函数，拿到 `ctx`：`view / dock / base / href / go / store / setToc / setCurrent / touch`），
   在 `hub.js` 的 `RENDERERS` 里登记。
3. 暂时没有渲染器的书，`type:"legacy"` 以 iframe 嵌入，页面放在 `docs/<名字>/`。

## 注意

- `gh` 的 token 没有 `workflow` 权限，所以仓库里不要放 `.github/workflows/`，部署用 `deploy.sh` 手动推送。
- 站点带 `noindex` 和 `Disallow: /`，不希望被搜索引擎收录。
