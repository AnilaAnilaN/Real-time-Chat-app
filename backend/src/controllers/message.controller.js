import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const { _id: loggedInUserId } = req.user;
    
    const users = await User.find({ _id: { $ne: loggedInUserId } })
      .select("-password")
      .sort({ username: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error("[MESSAGE_CONTROLLER] getUsersForSidebar error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users"
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const { _id: currentUserId } = req.user;

    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    console.error("[MESSAGE_CONTROLLER] getMessages error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch messages"
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const { _id: senderId } = req.user;
    const { text, image, voiceMessage, duration, emoji } = req.body;

    if (!text && !image && !voiceMessage && !emoji) {
      return res.status(400).json({
        success: false,
        error: "Message content is required"
      });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: "Recipient not found"
      });
    }

    let imageUrl, voiceMessageUrl;
    
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        folder: "chat_images"
      });
      imageUrl = uploadResponse.secure_url;
    }

    if (voiceMessage) {
      const uploadResponse = await cloudinary.uploader.upload(voiceMessage, {
        resource_type: "video",
        folder: "voice_messages"
      });
      voiceMessageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      voiceMessage: voiceMessageUrl,
      duration: voiceMessage ? duration : undefined,
      emoji,
      type: text ? "text" : image ? "image" : voiceMessage ? "voice" : emoji ? "emoji" : "text"
    });

    await newMessage.save();

    // Emit to both sender and receiver
    const senderSocketId = getReceiverSocketId(senderId);
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      io.to(receiverSocketId).emit("newNotification", {
        messageId: newMessage._id,
        senderId,
        text: text || emoji || "Media message",
        senderName: req.user.fullName
      });
    }

    res.status(201).json({
      success: true,
      data: newMessage
    });

  } catch (error) {
    console.error("[MESSAGE_CONTROLLER] sendMessage error:", error);
    if (error.message.includes("File size too large")) {
      return res.status(413).json({
        success: false,
        error: "File size exceeds maximum limit"
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to send message"
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { _id: userId } = req.user;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found"
      });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        error: "Not authorized to delete this message"
      });
    }

    if (message.image) {
      const publicId = message.image.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`chat_images/${publicId}`);
    }

    if (message.voiceMessage) {
      const publicId = message.voiceMessage.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`voice_messages/${publicId}`, {
        resource_type: "video"
      });
    }

    await Message.deleteOne({ _id: messageId });

    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", messageId);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }

    res.status(200).json({
      success: true,
      data: { id: messageId }
    });

  } catch (error) {
    console.error("[MESSAGE_CONTROLLER] deleteMessage error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete message"
    });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const { _id: userId } = req.user;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        error: "Emoji is required"
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found"
      });
    }

    // Prevent duplicate reactions
    if (message.reactions.some(r => r.userId.toString() === userId.toString() && r.emoji === emoji)) {
      return res.status(400).json({
        success: false,
        error: "Reaction already exists"
      });
    }

    const reaction = { userId, emoji };
    message.reactions.push(reaction);
    await message.save();

    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("reactionAdded", { messageId, reaction });
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("reactionAdded", { messageId, reaction });
    }

    res.status(200).json({
      success: true,
      data: message.reactions
    });
  } catch (error) {
    console.error("[MESSAGE_CONTROLLER] addReaction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add reaction"
    });
  }
};

export const removeReaction = async (req, res) => {
  try {
    const { messageId, reactionId } = req.params;
    const { _id: userId } = req.user;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Message not found"
      });
    }

    const reactionIndex = message.reactions.findIndex(
      r => r._id.toString() === reactionId && r.userId.toString() === userId.toString()
    );
    if (reactionIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Reaction not found"
      });
    }

    message.reactions.splice(reactionIndex, 1);
    await message.save();

    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("reactionRemoved", { messageId, reactionId });
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("reactionRemoved", { messageId, reactionId });
    }

    res.status(200).json({
      success: true,
      data: message.reactions
    });
  } catch (error) {
    console.error("[MESSAGE_CONTROLLER] removeReaction error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to remove reaction"
    });
  }
};