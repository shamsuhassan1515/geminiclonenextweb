#!/bin/bash

# FlyEnv 快速配置脚本
# 用于快速配置和启动 Gemini Clone 项目

echo "========================================="
echo "  Gemini Clone - FlyEnv 配置向导"
echo "========================================="
echo ""

# 检查 FlyEnv 是否安装
if ! command -v flyenv &> /dev/null; then
    echo "⚠️  FlyEnv 未安装"
    echo "请从以下地址下载并安装 FlyEnv:"
    echo "https://flyenv.com/download"
    echo ""
    echo "或者使用 Homebrew 安装:"
    echo "brew install flyenv"
    echo ""
    exit 1
fi

echo "✅ FlyEnv 已安装"
echo ""

# 检查项目目录
PROJECT_DIR="/Users/a1-6/开发/chatgpt-web-midjourney-proxy"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ 项目目录不存在: $PROJECT_DIR"
    exit 1
fi

echo "✅ 项目目录存在: $PROJECT_DIR"
echo ""

# 检查配置文件
CONFIG_FILES=(".flyenv.json" "flyenv.config.json" "start.sh")
for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        echo "✅ 配置文件存在: $file"
    else
        echo "❌ 配置文件缺失: $file"
    fi
done
echo ""

# 检查依赖
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo "⚠️  依赖未安装，正在安装..."
    cd "$PROJECT_DIR"
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ 依赖安装成功"
    else
        echo "❌ 依赖安装失败"
        exit 1
    fi
else
    echo "✅ 依赖已安装"
fi
echo ""

# 创建日志目录
mkdir -p "$PROJECT_DIR/logs"
echo "✅ 日志目录已创建"
echo ""

# 检查端口占用
PORT=1002
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 $PORT 已被占用"
    echo "请先停止占用该端口的进程"
    exit 1
else
    echo "✅ 端口 $PORT 可用"
fi
echo ""

echo "========================================="
echo "  配置完成！"
echo "========================================="
echo ""
echo "下一步操作："
echo "1. 打开 FlyEnv 应用"
echo "2. 点击 '导入项目'"
echo "3. 选择项目类型: Node.js"
echo "4. 项目路径: $PROJECT_DIR"
echo "5. 项目名称: Gemini Clone"
echo "6. 点击 '启动' 按钮"
echo ""
echo "或者使用命令行启动:"
echo "cd $PROJECT_DIR"
echo "./start.sh"
echo ""
echo "访问地址:"
echo "http://localhost:1002"
echo "http://localhost:1002/#/gemini"
echo ""
echo "========================================="