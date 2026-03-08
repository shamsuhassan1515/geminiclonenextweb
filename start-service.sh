#!/bin/bash

# 启动后端服务脚本
# 用于启动 ChatGPT Web Service

cd /Users/a1-6/开发/chatgpt-web-midjourney-proxy/service

echo "正在启动后端服务..."

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "正在安装后端依赖..."
    pnpm install
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "警告: .env 文件不存在，使用 .env.example"
    cp .env.example .env
fi

# 启动后端服务
pnpm run dev
