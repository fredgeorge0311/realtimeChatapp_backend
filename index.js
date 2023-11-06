const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();

const harperSaveMessage = require("./services/harper-save-message");
const harperGetMessages = require("./services/harper-get-messages");

app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const CHAT_BOT = "ChatBot";

let chatRoom = "";
let allUsers = [];

io.on("connection", (socket) => {
  console.log(`User connected ${socket.id}`);

  socket.on("join_room", (data) => {
    const { userName, room } = data;
    socket.join(room);

    let __createdtime__ = Date.now();

    socket.to(room).emit("receive_message", {
      message: `${userName} has joined the chat room`,
      userName: CHAT_BOT,
      __createdtime__,
    });

    socket.emit("receive_message", {
      message: `Welcome ${userName}`,
      userName: CHAT_BOT,
      __createdtime__,
    });

    chatRoom = room;
    allUsers.push({ id: socket.id, userName, room });
    chatRoomUsers = allUsers.filter((user) => user.room === room);
    socket.to(room).emit("chatroom_users", chatRoomUsers);
    socket.emit("chatroom_users", chatRoomUsers);
  });

  socket.on("send_message", (data) => {
    const { message, userName, room, __createdtime__ } = data;
    io.in(room).emit("receive_message", data);
    harperSaveMessage(message, userName, room, __createdtime__)
      .then((response) => console.log(response))
      .catch((err) => console.log(err));

    harperGetMessages(room)
      .then((last100Messages) => {
        socket.emit("last_100_messages", last100Messages);
      })
      .catch((err) => console.log(err));
  });
});

app.get("/", (req, res) => {
  res.send("Hello world");
});

const PORT = 5000;
server.listen(PORT, () => `Server is running on port ${PORT}`);
