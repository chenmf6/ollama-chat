import { useCallback, useEffect, useState, useRef } from "react";
import socket from "../utils/socket";
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  type: "user" | "assistant";
  done: boolean;
}

interface ChatResponse {
  chunk: string;
  done: boolean;
  error?: Error;
}

export function useSocketChat() {
  const [messageIds, setMessageIds] = useState<string[]>([]);
  const [messageMap, setMessageMap] = useState<Record<string, Message>>({});
  const [currentMessage, setCurrentMessage] = useState("");
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  // 是否正在进行流式响应
  const isStreaming = !!streamingId;

  const updateStreamingId = (id: string | null) => {
    streamingIdRef.current = id;
    setStreamingId(id);
  };

  const handleResponse = useCallback((res: ChatResponse) => {
    const { chunk, done, error } = res;
    if (error) return updateStreamingId(null);

    const currentStreamingId = streamingIdRef.current;
    if (!currentStreamingId) return;

    if (chunk) {
      setMessageMap(prev => ({
        ...prev,
        [currentStreamingId]: {
          ...prev[currentStreamingId],
          content: prev[currentStreamingId]?.content + chunk,
          done,
        },
      }));
    }

    if (done) updateStreamingId(null);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("handleError", error);
    updateStreamingId(null);
  }, []);

  // 新的一轮对话
  const handleNewRound = (message: string) => {
    const userMessageId = uuidv4(); // 用户消息 ID
    const systemMessageId = uuidv4(); // 系统消息 ID

    // 添加用户消息和预留空的系统消息
    setMessageIds((prev) => [...prev, userMessageId, systemMessageId]);
    setMessageMap((prev) => ({
      ...prev,
      [userMessageId]: {
        id: userMessageId,
        content: message,
        type: "user",
        done: true, // 用户消息默认已完成
      },
      [systemMessageId]: {
        id: systemMessageId,
        content: "",
        type: "assistant",
        done: false, // 系统消息初始未完成
      },
    }));
    updateStreamingId(systemMessageId); // 设置流式响应消息 ID
    socket.emit("request", { prompt: message });
  };

  const stopStream = () => {
    socket.emit("stop");
    updateStreamingId(null);
  };

  useEffect(() => {
    socket.on("response", handleResponse);
    socket.on("error", handleError);

    return () => {
      socket.off("response", handleResponse);
      socket.off("error", handleError);
    };
  }, [handleResponse, handleError]);

  return {
    messageIds,
    messageMap,
    currentMessage,
    setCurrentMessage,
    isStreaming,
    streamingId,
    handleNewRound,
    stopStream,
  };
}