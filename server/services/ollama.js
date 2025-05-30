import { request } from "undici";

const OLLAMA_URL = `${process.env.OLLAMA_HOST}/api/generate`;
const MODEL = "llama3.2";

// 处理流式响应的核心逻辑
async function handleStreamResponse(prompt, onChunk, onError, signal) {
  try {
    const requestBody = JSON.stringify({
      model: MODEL,
      prompt,
      stream: true,
    });

    console.log("ollama request", requestBody);

    const { statusCode, body } = await request(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
      signal,
    });

    if (statusCode !== 200) {
      throw new Error(`Ollama 服务返回错误状态码: ${statusCode}`);
    }

    console.log("ollama response", body);

    const decoder = new TextDecoder("utf-8");
    for await (const chunk of body) {
      const parsedChunk = decoder.decode(chunk);
      const { response, done } = JSON.parse(parsedChunk);
      onChunk(response, done);
    }
  } catch (error) {
    if (!signal.aborted) {
      console.error("Error generating response:", error, error.message);
      onError(error);
    }
  }
}

// 主方法：生成响应并返回取消回调
export function generateResponse(prompt, onChunk, onError) {
  const controller = new AbortController();
  const signal = controller.signal;

  // 调用流式响应处理逻辑
  handleStreamResponse(prompt, onChunk, onError, signal);

  // 立即返回取消回调函数
  return () => controller.abort();
}
