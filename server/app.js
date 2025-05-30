import 'dotenv/config';
import Koa from "koa";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from "http";
import { Server } from "socket.io";
import serve from 'koa-static';
import { initSocket } from "./utils/socket.js";

console.log('app config', {
  host: process.env.HOST,
  port: process.env.PORT,
  corsOrigin: process.env.CORS_ORIGIN,
  ollamaHost: process.env.OLLAMA_HOST,
});

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '').split(',');
const DIRNAME = dirname(fileURLToPath(import.meta.url));

const app = new Koa();
app.use(serve(DIRNAME + '/static'));
const server = createServer(app.callback());
// 监听Socket.IO
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN, // 允许的前端地址
    methods: "*", // 允许的 HTTP 方法
  },
});
initSocket(io);

server.listen(PORT, HOST, () => {
  console.log(`Service "${process.env.npm_package_name}" version ${process.env.npm_package_version} is running`);
  console.log(`Listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Started at: ${new Date().toISOString()}`);
});
