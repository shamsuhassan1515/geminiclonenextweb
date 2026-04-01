#!/bin/bash
set -e

PLIST_FILE="$HOME/Library/LaunchAgents/io.lima-vm.autostart.bt-server.plist"

echo "正在更新 Lima 虚拟机自动启动配置..."

# 停止现有服务
launchctl stop io.lima-vm.autostart.bt-server 2>/dev/null || true
launchctl unload "$PLIST_FILE" 2>/dev/null || true

# 创建新的配置文件
cat > "$PLIST_FILE" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
        <key>Label</key>
        <string>io.lima-vm.autostart.bt-server</string>
        <key>ProgramArguments</key>
        <array>
                <string>/opt/homebrew/bin/limactl</string>
                <string>start</string>
                <string>bt-server</string>
                <string>--foreground</string>
        </array>
        <key>RunAtLoad</key>
        <true/>
        <key>KeepAlive</key>
        <dict>
                <key>SuccessfulExit</key>
                <false/>
                <key>Crashed</key>
                <true/>
        </dict>
        <key>ThrottleInterval</key>
        <integer>30</integer>
        <key>StandardErrorPath</key>
        <string>launchd.stderr.log</string>
        <key>StandardOutPath</key>
        <string>launchd.stdout.log</string>
        <key>WorkingDirectory</key>
        <string>/Users/aydinkaya/.lima/bt-server</string>
        <key>ProcessType</key>
        <string>Interactive</string>
        <key>LowPriorityIO</key>
        <false/>
</dict>
</plist>
EOF

# 加载新配置
launchctl load "$PLIST_FILE"

echo "配置已更新！"
echo ""
echo "主要改进："
echo "1. KeepAlive: 虚拟机崩溃后自动重启"
echo "2. ProcessType: Interactive (不会被系统后台管理器终止)"
echo "3. ThrottleInterval: 30秒重启间隔"
echo ""
echo "正在启动虚拟机..."
limactl start bt-server
