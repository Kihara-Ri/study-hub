#!/usr/bin/env bash
# 构建并推送。用法: ./deploy.sh ["提交说明"]
# 默认沿用上次构建里韩语的密文；要换密码或重新加密，设置 HUB_PASSWORD=xxx
set -euo pipefail
cd "$(dirname "$0")"
python3 build.py
git add -A
if git diff --cached --quiet; then echo "✓ 没有变化"; exit 0; fi
git commit -q -m "${1:-更新内容}"
git push -q origin main
echo "✓ 已推送，等 1–3 分钟 Pages 生效"
