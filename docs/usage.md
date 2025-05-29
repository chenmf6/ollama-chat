# 使用文档

## 启动应用

首先启动llama服务，可以在docker中运行：
```
# pull ollama
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
# run llama 3.2 model
docker exec -it ollama ollama run llama3.2
```

1. 启动后端服务器：`cd server && npm start`
2. 启动前端开发服务器：`cd client && npm start`
3. 打开浏览器，访问 `http://localhost:3000`

## 使用方法
1. 在输入框中输入问题
2. 按下回车键发送请求
3. 等待响应结果显示在聊天区域