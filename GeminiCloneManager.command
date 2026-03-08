#!/bin/bash

# Gemini Clone 桌面快捷方式
# 双击此文件可以打开服务管理界面

cd /Users/a1-6/开发/chatgpt-web-midjourney-proxy

# 打开终端并显示管理菜单
osascript -e 'tell application "Terminal"
    activate
    do script "cd /Users/a1-6/开发/chatgpt-web-midjourney-proxy && ./manage-service.sh status"
end tell'

# 等待用户输入
read -p "按 Enter 键打开服务管理菜单..."

# 显示管理菜单
echo ""
echo "========================================="
echo "  Gemini Clone 服务管理"
echo "========================================="
echo ""
echo "请选择操作:"
echo "1. 启动服务"
echo "2. 停止服务"
echo "3. 重启服务"
echo "4. 查看状态"
echo "5. 查看日志"
echo "6. 查看错误日志"
echo "7. 卸载服务"
echo "8. 退出"
echo ""
read -p "请输入选项 (1-8): " choice

case $choice in
    1)
        ./manage-service.sh start
        ;;
    2)
        ./manage-service.sh stop
        ;;
    3)
        ./manage-service.sh restart
        ;;
    4)
        ./manage-service.sh status
        ;;
    5)
        ./manage-service.sh logs
        ;;
    6)
        ./manage-service.sh errors
        ;;
    7)
        ./manage-service.sh uninstall
        ;;
    8)
        echo "退出"
        exit 0
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

read -p "按 Enter 键退出..."