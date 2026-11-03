# 学习台 study-hub

一个仓库、一个 GitHub Pages 静态站，收纳所有自学材料。站点输出在 `docs/`，Pages 从 `main` 分支的 `/docs` 发布。

| 路径 | 内容 | 访问 |
|---|---|---|
| `/` | 总落地页（日语 / 语言课程 / 设计 / 文化） | 公开 |
| `/jp-shadowing/` | 日语影子跟读：74 课、逐句播放、表达库 | 密码（文本与音频均为密文） |
| `/korean/` | 零起点韩语 | 密码（课文为密文） |
| `/arabic/` `/french/` | 自编阿拉伯语 / 法语课程 | 公开 |
| `/arabic-culture/` | 阿拉伯文化背景知识（可交互阅读版） | 公开 |
| `/refactoring-ui/` | Refactoring UI 中文版 | 公开 |

## 仓库里有什么、没有什么

- 有：`build.py`（组装脚本）、`legacy_books.py`（韩/阿/法/文化书的拷贝与加密逻辑）、`docs/`（构建产物）。
- 没有：原书 PDF、原始音频、识别文稿、各书的源码与源数据。这些留在服务器 `~/dsh-workspace/` 下各自的目录，
  其中受版权保护的内容只以密文形式出现在 `docs/`。
- **密码不在仓库里。** 构建时通过环境变量 `HUB_PASSWORD` 传入。

## 重新构建与发布

源目录默认是 `~/dsh-workspace/` 下的兄弟目录（可用 `HUB_WORKSPACE` 改）：

| 书 | 取自 |
|---|---|
| 日语跟读 | `jp-shadowing/site/`（先在该目录跑 `build_site.py`） |
| 韩语 / 阿拉伯语 / 法语 / 阿拉伯文化 | 各自的 `dist/` |
| Refactoring UI | `refactoring-ui-book/site/` |

```bash
HUB_PASSWORD='你的密码' python3 build.py      # 生成 docs/
HUB_PASSWORD='你的密码' ./deploy.sh "说明"    # 构建 + 提交 + 推送
```

每次构建都会换新的加密盐，所以即使内容没变，密文文件也会整体变化，提交会比较大；只改了某一本书时可以接受。

## 加一本新书

1. 在 `build.py` 里加一个拷贝函数（参考 `copy_rui`），输出到 `docs/<名字>/`；
   页面里需要"返回选书"时，链接指向 `../index.html`。
2. 在 `landing()` 里加一张卡片。
3. 全部用相对路径，书才能放进子目录。

## 注意

- `gh` 的 token 没有 `workflow` 权限，所以仓库里不要放 `.github/workflows/`，部署用 `deploy.sh` 手动推送。
- 站点带 `noindex` 和 `Disallow: /`，不希望被搜索引擎收录。
