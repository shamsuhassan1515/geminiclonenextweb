#!/bin/bash

# FlyEnv 启动脚本
# 用于在 FlyEnv 中启动 Gemini Clone 项目

cd /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "npm 未安装，请先安装 npm"
    exit 1
fi

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi

# 创建日志目录
mkdir -p logs

# 启动开发服务器
echo "正在启动 Gemini Clone 开发服务器..."
npm run dev

# 如果进程意外退出，等待 5 秒后重启
sleep 5
echo "服务已停止"