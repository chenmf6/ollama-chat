import esmock from 'esmock';
import sinon from 'sinon';
import { expect } from 'chai';
import { Readable } from 'stream';

describe('generateResponse with esmock', () => {
  let generateResponse;
  let requestStub;

  beforeEach(async () => {
    // 创建一个 stub 替代 undici 的 request 方法
    requestStub = sinon.stub().callsFake(async (url, options) => {

      const mockChunks = [
        JSON.stringify({ response: 'Hello', done: false }),
        JSON.stringify({ response: ' world', done: false }),
        JSON.stringify({ response: '!', done: true }),
      ];

      const mockStream = new Readable({
        read() {
          const chunk = mockChunks.shift();
          if (chunk !== undefined) {
            this.push(Buffer.from(chunk));
          } else {
            this.push(null);
          }
        },
      });

      // 监听 AbortSignal 的 abort 事件
      if (options.signal) {
        const abortHandler = () => {
          console.log('Abort signal received, destroying stream...');
          mockStream.destroy(new DOMException('The operation was aborted.', 'AbortError'));
        };
        options.signal.addEventListener('abort', abortHandler);
        mockStream.on('close', () => {
          options.signal.removeEventListener('abort', abortHandler);
        });
      }

      return {
        statusCode: 200,
        body: mockStream,
      };
    });

    // 使用 esmock 注入 stub
    const module = await esmock('../services/ollama.js', {
      undici: {
        request: requestStub,
      },
    });

    generateResponse = module.generateResponse;
  });

  it('should handle stream response correctly', async () => {
    const onChunkSpy = sinon.spy();
    const onErrorSpy = sinon.spy();

    generateResponse('Test prompt', onChunkSpy, onErrorSpy);

    // 等待流处理完成
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 验证 onChunk 是否被正确调用
    sinon.assert.calledWith(onChunkSpy, 'Hello', false);
    sinon.assert.calledWith(onChunkSpy, ' world', false);
    sinon.assert.calledWith(onChunkSpy, '!', true);

    // 验证 onError 是否未被调用
    sinon.assert.notCalled(onErrorSpy);

  });

  it('should call onError when request fails', async () => {
    // 修改 stub 行为以模拟请求失败
    requestStub.rejects(new Error('Simulated network error'));

    const onChunkSpy = sinon.spy();
    const onErrorSpy = sinon.spy();

    generateResponse('Test prompt', onChunkSpy, onErrorSpy);

    // 等待错误处理完成
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 验证 onError 是否被正确调用
    sinon.assert.calledOnce(onErrorSpy);
    sinon.assert.calledWithMatch(onErrorSpy, sinon.match.instanceOf(Error));

    // 验证 onChunk 是否未被调用
    sinon.assert.notCalled(onChunkSpy);
  });

  it('should cancel the stream when cancelCallback is called', async () => {
    const onChunkSpy = sinon.spy();
    const onErrorSpy = sinon.spy();

    const cancelCallback = generateResponse('Test prompt', onChunkSpy, onErrorSpy);

    // 验证取消回调函数是否是有效的函数
    expect(cancelCallback).to.be.a('function'); 

    // 立即调用取消回调函数
    cancelCallback();

    // 等待一段时间以确保取消逻辑生效
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 验证 onChunk 是否未被调用（或只调用了部分）
    sinon.assert.notCalled(onChunkSpy); // 如果取消发生在第一个数据块之前，则不应调用 onChunk
    // AbortError不会触发onError
    sinon.assert.notCalled(onErrorSpy);
  });
});