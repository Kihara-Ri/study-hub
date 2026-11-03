#!/usr/bin/env bash
# 构建并推送。用法: HUB_PASSWORD=xxx ./deploy.sh ["提交说明"]
set -euo pipefail
cd "$(dirname "$0")"
: "${HUB_PASSWORD:?请先设置环境变量 HUB_PASSWORD}"
python3 build.py
git add -A
if git diff --cached --quiet; then echo "✓ 没有变化"; exit 0; fi
git commit -q -m "${1:-更新内容}"
git push -q origin main
echo "✓ 已推送，等 1–3 分钟 Pages 生效"
