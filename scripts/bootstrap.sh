#!/bin/bash

# 清理函数：用于优雅退出时停止容器
cleanup() {
    echo "Stopping Ollama container..."
    docker stop ollama > /dev/null 2>&1
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 启动 Ollama 容器（封装为方法）
startOllama() {
    if [ "$(docker ps -a -f "name=ollama" --format "{{.Status}}")" ]; then
        echo "Ollama container already exists. Starting it..."
        docker start ollama
    else
        echo "Creating and starting new Ollama container..."
        docker run -d \
          -v ollama:/root/.ollama \
          -p 11434:11434 \
          --name ollama \
          ollama/ollama
    fi
}

# 执行 Ollama 启动逻辑
startOllama && echo "Ollama started successfully."
docker exec -it ollama ollama run llama3.2

# 启动 Server
echo "Starting Server..."
npm --prefix ./server run start &

# 启动 Client
echo "Starting Client..."
npm --prefix ./client run start &

# 等待所有后台进程结束（不会真正退出）
wait