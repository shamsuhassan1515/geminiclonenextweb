#!/bin/bash
# 宝塔面板所有项目自动启动脚本
# 在 Lima 虚拟机启动时自动运行

LOG_FILE="/www/wwwlogs/bt_projects_autostart.log"

echo "========================================" >> "$LOG_FILE"
echo "[$(date)] 开始启动所有宝塔项目..." >> "$LOG_FILE"

# 1. 启动所有 Node.js 项目
echo "[$(date)] 启动 Node.js 项目..." >> "$LOG_FILE"
for script in /www/server/nodejs/vhost/scripts/*.sh; do
    if [ -f "$script" ]; then
        project_name=$(basename "$script" .sh)
        echo "[$(date)] 启动 Node 项目: $project_name" >> "$LOG_FILE"
        pid_file="/www/server/nodejs/vhost/pids/${project_name}.pid"
        if [ -f "$pid_file" ]; then
            old_pid=$(cat "$pid_file" 2>/dev/null)
            if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
                echo "[$(date)] 项目 $project_name 已在运行 (PID: $old_pid)" >> "$LOG_FILE"
                continue
            fi
        fi
        bash "$script" >> "$LOG_FILE" 2>&1
        sleep 1
    fi
done

# 2. 启动所有 Go 项目
echo "[$(date)] 启动 Go 项目..." >> "$LOG_FILE"
for script in /www/server/go_project/vhost/scripts/*.sh; do
    if [ -f "$script" ]; then
        script_name=$(basename "$script")
        if [ "$script_name" = "start_all_projects.sh" ]; then
            continue
        fi
        project_name=$(basename "$script" .sh)
        echo "[$(date)] 启动 Go 项目: $project_name" >> "$LOG_FILE"
        pid_file="/www/server/go_project/vhost/pids/${project_name}.pid"
        if [ -f "$pid_file" ]; then
            old_pid=$(cat "$pid_file" 2>/dev/null)
            if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
                echo "[$(date)] 项目 $project_name 已在运行 (PID: $old_pid)" >> "$LOG_FILE"
                continue
            fi
        fi
        bash "$script" >> "$LOG_FILE" 2>&1
        sleep 1
    fi
done

# 3. 启动 PM2 管理的项目（如果有）
if command -v pm2 &> /dev/null; then
    echo "[$(date)] 恢复 PM2 项目..." >> "$LOG_FILE"
    pm2 resurrect >> "$LOG_FILE" 2>&1
fi

echo "[$(date)] 所有项目启动完成！" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"
