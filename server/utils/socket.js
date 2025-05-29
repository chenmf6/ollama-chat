import { generateResponse } from "../services/ollama.js";

export function initSocket(io) {
  // Socket.IO 处理
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // 定义停止函数
    let abortCallback;
    const runAbortCallback = () => {
      if (!abortCallback) {
        return;
      }
      console.log("Stopping current response...");
      try {
        abortCallback(); // 停止当前的流式响应
      } catch (e) {
        console.error("Error stopping response:", e);
      } finally {
        abortCallback = null; // 清理控制器
      }
    };

    const onChunk = (chunk, done) => {
      console.log('onChunk', chunk, done)
      // 将流式响应发送给对应的客户端
      socket.emit("response", { chunk, done });
      if (done) {
        console.log("response done");
        abortCallback = null;
      }
    };

    const onError = (error) => {
      socket.emit("response", { error, done: true });
      console.log("response error");
    };

    // 监听客户端发送的 request 事件
    socket.on("request", ({ prompt }) => {
      console.log('onrequest', prompt)
      if (!prompt) {
        console.error("Missing prompt");
        return;
      }

      // 如果已经有正在进行的流式响应，则先停止它
      if (abortCallback) {
        console.warn("Previous response is still running, aborting it...");
        runAbortCallback(); // 停止之前的流式响应
      }

      // 调用生成响应函数
      abortCallback = generateResponse(prompt, onChunk, onError);
    });

    // 绑定 stop 事件监听器
    socket.on("stop", () => {
      runAbortCallback();
    });

    socket.on('error', (err) => {
      console.log('socket error', err)
    })

    // 断开连接时清理监听器
    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
      // 确保断开连接时停止所有流式响应
      runAbortCallback();
    });
  });
}
