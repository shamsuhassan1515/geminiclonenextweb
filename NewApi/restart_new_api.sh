#!/bin/bash
cd /Users/aydinkaya/开发/chatgpt-web-midjourney-proxy/NewApi
pkill -9 new-api-linux
sleep 1
nohup ./new-api-linux --port 3000 --log-dir ./logs > ./logs/new-api-linux-restart.log 2>&1 &
echo "Started new-api-linux in background"
ps aux | grep new-api-linux | grep -v grep
