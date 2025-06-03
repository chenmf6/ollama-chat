import { useRef, useEffect } from "react";
import { useSocketChat } from "../hooks/socket-chat";
import { MessageItem } from "./MessageItem";

export default function ChatArea() {
  const {
    messageIds,
    messageMap,
    stopStream,
    handleNewRound,
    currentMessage,
    setCurrentMessage,
    isStreaming,
    streamingId
   } = useSocketChat();

  const messagesDOMRef = useRef<HTMLDivElement>(null); // 获取消息区域的引用

  // 发送消息
  const sendMessage = () => {
    if (!currentMessage.trim()) return;
    const message = currentMessage.trim();
    setCurrentMessage(""); // 清空输入框
    handleNewRound(message); // 处理新一轮的对话
    console.log('- client send request:', currentMessage)
  };

  // 处理键盘事件：按下回车键发送消息
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (e.nativeEvent.isComposing) return; // 忽略中文输入法的组合状态
      if (isStreaming) return; // 如果正在流式响应，直接返回
      e.preventDefault(); // 防止换行
      sendMessage();
    }
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
          <MessageItem key={id} streaming={streamingId === id} {...messageMap[id]} />
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
