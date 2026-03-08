#!/bin/bash

# FlyEnv 快速配置脚本
# 用于快速配置项目到 FlyEnv

echo "========================================="
echo "  FlyEnv 快速配置向导"
echo "========================================="
echo ""

PROJECT_DIR="/Users/a1-6/开发/chatgpt-web-midjourney-proxy"
FLYENV_CONFIG_FILES=(
    "flyenv-project.json"
    "flyenv.yaml"
    ".flyenv"
    "flyenv.config.json"
)

echo "检查配置文件..."
for file in "${FLYENV_CONFIG_FILES[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (缺失)"
    fi
done
echo ""

echo "检查项目文件..."
if [ -f "$PROJECT_DIR/package.json" ]; then
    echo "✅ package.json"
else
    echo "❌ package.json (缺失)"
fi

if [ -f "$PROJECT_DIR/README.md" ]; then
    echo "✅ README.md"
else
    echo "❌ README.md (缺失)"
fi
echo ""

echo "========================================="
echo "  配置完成！"
echo "========================================="
echo ""
echo "下一步操作："
echo ""
echo "1. 打开 FlyEnv 应用"
echo "2. 点击 '导入项目' 或 '添加项目'"
echo "3. 选择项目目录: $PROJECT_DIR"
echo "4. FlyEnv 会自动识别配置文件"
echo ""
echo "或者手动添加项目："
echo "1. 项目名称: Gemini Clone"
echo "2. 项目类型: Node.js"
echo "3. 工作目录: $PROJECT_DIR"
echo "4. 端口: 1002"
echo "5. 启动命令: npm run dev"
echo ""
echo "访问地址:"
echo "http://localhost:1002"
echo "http://localhost:1002/#/gemini"
echo ""
echo "========================================="
echo ""
echo "详细配置说明请查看: FLYENV_CONFIG_GUIDE.md"
echo ""