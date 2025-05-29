import { useState, useCallback, useEffect, useRef } from "react";
import socket from "../utils/socket";
import useSocket from '../hooks/useSocket';

export default function ChatArea() {
  const [messageIds, setMessageIds] = useState([]); // 消息 ID 列表
  const [messageMap, setMessageMap] = useState({}); // 消息 ID -> 消息对象的映射
  const [currentMessage, setCurrentMessage] = useState(""); // 当前输入的消息
  const [streamingId, setStreamingId] = useState(null); // 当前流式响应的消息 ID
  const streamingIdRef = useRef(null); // 使用 useRef 存储 streamingId
  const messagesDOMRef = useRef(null); // 获取消息区域的引用

  // 是否正在进行流式响应
  const isStreaming = !!streamingId;

  const updateStreamingId = (streamingId = null) => {
    streamingIdRef.current = streamingId; // 更新 streamingIdRef
    setStreamingId(streamingId); // 设置流式响应消息 ID
  };

  // handleResponse 回调函数
  const handleResponse = useCallback(({ chunk, done, error }) => {
    if (error) {
      console.error("handleResponse Error:", error);
      updateStreamingId(null); // 清空流式响应消息
      return;
    }

    console.log("handleResponse", chunk, done);
    const currentStreamingId = streamingIdRef.current; // 获取当前的 streamingId
    if (!currentStreamingId) {
      return;
    }

    if (chunk) {
      // 更新流式响应内容
      setMessageMap((prev) => ({
        ...prev,
        [currentStreamingId]: {
          ...prev[currentStreamingId],
          content: (prev[currentStreamingId]?.content || "") + chunk, // 追加流式内容
          done   // 更新完成状态
        },
      }));
    }

    if (done) {
      updateStreamingId(null); // 清空流式响应消息
    }
  }, []);

  const handleError = useCallback((error) => {
    console.error("handleError", error);
    updateStreamingId(null); // 清空流式响应消息
  }, []);

  useSocket('error', handleError)
  useSocket('response', handleResponse)

  // 新的一轮对话
  const handleNewRound = () => {
    const userMessageId = Date.now(); // 用户消息 ID
    const systemMessageId = userMessageId + 1; // 系统消息 ID

    // 添加用户消息和预留空的系统消息
    setMessageIds((prev) => [...prev, userMessageId, systemMessageId]);
    setMessageMap((prev) => ({
      ...prev,
      [userMessageId]: {
        id: userMessageId,
        content: currentMessage,
        type: "user",
        done: true, // 用户消息默认已完成
      },
      [systemMessageId]: {
        id: systemMessageId,
        content: "",
        type: "system",
        done: false, // 系统消息初始未完成
      },
    }));
    updateStreamingId(systemMessageId); // 设置流式响应消息 ID
  };

  // 发送消息
  const sendMessage = () => {
    if (!currentMessage.trim()) return;
    handleNewRound(); // 处理新一轮的对话
    setCurrentMessage(""); // 清空输入框
    // 发送请求
    socket.emit("request", { prompt: currentMessage });
  };

  // 处理键盘事件：按下回车键发送消息
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing) return; // 忽略中文输入法的组合状态
      if (isStreaming) return; // 如果正在流式响应，直接返回
      e.preventDefault(); // 防止换行
      sendMessage();
    }
  };

  // 停止流式响应
  const stopStream = () => {
    socket.emit("stop");
    updateStreamingId(null); // 停止流式响应
  };

  // 滚动到底部
  const scrollToBottom = () => {
    if (messagesDOMRef.current) {
      messagesDOMRef.current.scrollTop = messagesDOMRef.current.scrollHeight;
    }
  };

  // 消息更新时自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messageIds]);

  return (
    <main className="flex flex-1 flex-col h-screen bg-gray-100">
      {/* 消息显示区 */}
      <div
        ref={messagesDOMRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {messageIds.map((id) => (
          <MessageItem key={id} {...messageMap[id]} />
        ))}
      </div>

      {/* 消息发送区 */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center">
          <input
            type="text"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={handleKeyDown} // 监听键盘事件
            className="flex-1 p-2 border rounded mr-2"
            placeholder="输入消息..."
          />
          {isStreaming ? (
            <button
              onClick={stopStream}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              停止
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!currentMessage.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              发送
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 opacity-50 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
  );
}

function MessageItem({ type, content }) {
  return (
    <div
      className={`p-2 rounded break-words min-h-[2em] ${
        type === "user"
          ? "bg-blue-100 text-blue-800 self-end"
          : "bg-gray-200 text-gray-800 self-start"
      }`}
    >
      {content || <Spinner />}
    </div>
  );
}
