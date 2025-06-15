import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"]
  },
  pingTimeout: 10000,
  pingInterval: 5000
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Used to store online users and active calls
const userSocketMap = {}; // {userId: socketId}
const activeCalls = {}; // {callId: {participants: [userId1, userId2], socketIds: [socketId1, socketId2]}}

io.on("connection", (socket) => {
  console.log("[SOCKET] User connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log("[SOCKET] Mapped user:", userId, socket.id);
  }

  // Emit online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Call functionality
  socket.on("incomingCall", (data) => {
    const { callId, callType, senderId, receiverId } = data;
    const receiverSocketId = getReceiverSocketId(receiverId);
    
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("incomingCall", data);
      activeCalls[callId] = {
        participants: [senderId, receiverId],
        socketIds: [socket.id, receiverSocketId]
      };
    }
  });

  socket.on("callStatusUpdate", (data) => {
    const { callId, status } = data;
    const call = activeCalls[callId];
    if (call) {
      io.to(call.socketIds).emit("callStatusUpdate", data);
      if (status === "rejected" || status === "ended") {
        delete activeCalls[callId];
      }
    }
  });

  socket.on("offer", (data) => {
    const { callId, offer, receiverId } = data;
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("offer", { callId, offer });
    }
  });

  socket.on("answer", (data) => {
    const { callId, answer, receiverId } = data;
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("answer", { callId, answer });
    }
  });

  socket.on("ice-candidate", (data) => {
    const { callId, candidate, receiverId } = data;
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("ice-candidate", { callId, candidate });
    }
  });

  socket.on("disconnect", () => {
    console.log("[SOCKET] User disconnected:", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Clean up any active calls
    for (const callId in activeCalls) {
      const call = activeCalls[callId];
      if (call.socketIds.includes(socket.id)) {
        io.to(call.socketIds).emit("callStatusUpdate", {
          callId,
          status: "ended",
          reason: "User disconnected"
        });
        delete activeCalls[callId];
      }
    }
  });
});

export { io, app, server };