#!/bin/bash

# Gemini Clone 服务管理脚本
# 用于在 macOS 上管理 Gemini Clone 服务

PLIST_FILE="com.geminiclonenextweb.server.plist"
SERVICE_NAME="com.geminiclonenextweb.server"
PROJECT_DIR="/Users/a1-6/开发/chatgpt-web-midjourney-proxy"
LOG_DIR="$PROJECT_DIR/logs"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 创建日志目录
mkdir -p "$LOG_DIR"

# 安装服务
install_service() {
    print_info "正在安装服务..."
    
    # 复制 plist 文件到 LaunchAgents 目录
    cp "$PROJECT_DIR/$PLIST_FILE" "$HOME/Library/LaunchAgents/"
    
    # 加载服务
    launchctl load "$HOME/Library/LaunchAgents/$PLIST_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "服务安装成功"
        print_info "服务将在系统启动时自动运行"
    else
        print_error "服务安装失败"
        exit 1
    fi
}

# 启动服务
start_service() {
    print_info "正在启动服务..."
    
    # 检查服务是否已加载
    if ! launchctl list | grep -q "$SERVICE_NAME"; then
        print_warning "服务未安装，正在安装..."
        install_service
    fi
    
    # 启动服务
    launchctl start "$SERVICE_NAME"
    
    if [ $? -eq 0 ]; then
        print_success "服务启动成功"
        print_info "访问地址: http://localhost:1002"
        print_info "Gemini 页面: http://localhost:1002/#/gemini"
    else
        print_error "服务启动失败"
        print_info "请查看日志: $LOG_DIR/gemini-clone-error.log"
        exit 1
    fi
}

# 停止服务
stop_service() {
    print_info "正在停止服务..."
    
    launchctl stop "$SERVICE_NAME"
    
    if [ $? -eq 0 ]; then
        print_success "服务停止成功"
    else
        print_warning "服务可能未运行"
    fi
}

# 重启服务
restart_service() {
    print_info "正在重启服务..."
    stop_service
    sleep 2
    start_service
}

# 卸载服务
uninstall_service() {
    print_info "正在卸载服务..."
    
    # 停止服务
    launchctl stop "$SERVICE_NAME" 2>/dev/null
    
    # 卸载服务
    launchctl unload "$HOME/Library/LaunchAgents/$PLIST_FILE"
    
    # 删除 plist 文件
    rm -f "$HOME/Library/LaunchAgents/$PLIST_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "服务卸载成功"
    else
        print_error "服务卸载失败"
        exit 1
    fi
}

# 查看服务状态
status_service() {
    print_info "服务状态:"
    
    if launchctl list | grep -q "$SERVICE_NAME"; then
        print_success "服务已安装"
        
        # 检查进程是否运行
        if lsof -Pi :1002 -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_success "服务正在运行"
            print_info "访问地址: http://localhost:1002"
        else
            print_warning "服务已安装但未运行"
        fi
    else
        print_warning "服务未安装"
    fi
}

# 查看日志
view_logs() {
    print_info "查看日志 (Ctrl+C 退出):"
    echo ""
    
    if [ -f "$LOG_DIR/gemini-clone.log" ]; then
        tail -f "$LOG_DIR/gemini-clone.log"
    else
        print_warning "日志文件不存在"
    fi
}

# 查看错误日志
view_error_logs() {
    print_info "查看错误日志:"
    echo ""
    
    if [ -f "$LOG_DIR/gemini-clone-error.log" ]; then
        cat "$LOG_DIR/gemini-clone-error.log"
    else
        print_warning "错误日志文件不存在"
    fi
}

# 显示帮助信息
show_help() {
    echo "========================================="
    echo "  Gemini Clone 服务管理工具"
    echo "========================================="
    echo ""
    echo "用法: ./manage-service.sh [命令]"
    echo ""
    echo "命令:"
    echo "  install    安装服务（开机自启动）"
    echo "  start      启动服务"
    echo "  stop       停止服务"
    echo "  restart    重启服务"
    echo "  uninstall  卸载服务"
    echo "  status     查看服务状态"
    echo "  logs       查看实时日志"
    echo "  errors     查看错误日志"
    echo "  help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./manage-service.sh install   # 安装并启动服务"
    echo "  ./manage-service.sh start     # 启动服务"
    echo "  ./manage-service.sh stop      # 停止服务"
    echo "  ./manage-service.sh logs      # 查看日志"
    echo ""
    echo "========================================="
}

# 主函数
main() {
    case "$1" in
        install)
            install_service
            ;;
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        restart)
            restart_service
            ;;
        uninstall)
            uninstall_service
            ;;
        status)
            status_service
            ;;
        logs)
            view_logs
            ;;
        errors)
            view_error_logs
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"