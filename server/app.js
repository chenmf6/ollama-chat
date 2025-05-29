import Koa from "koa";
import { createServer } from "http";
import { Server } from "socket.io";
import serve from 'koa-static';
import { initSocket } from "./utils/socket.js";

const app = new Koa();
app.use(serve(__dirname + '/static'));
const server = createServer(app.callback());
// 监听Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://127.0.0.1:3000", // 允许的前端地址
    methods: "*", // 允许的 HTTP 方法
  },
});
initSocket(io);

server.listen(4000, () => {
  console.log("Server running on http://127.0.0.1:4000");
});
