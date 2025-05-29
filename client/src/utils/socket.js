import { io } from "socket.io-client";

const URL = "http://127.0.0.1:4000"

const socket = io(URL, {
  transports: ["websocket"],
});

export default socket;
