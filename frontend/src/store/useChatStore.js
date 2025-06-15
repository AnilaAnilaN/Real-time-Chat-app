import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadMessages: {},
  totalUnreadCount: 0,
  mutualMessageCache: {},

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const authUser = useAuthStore.getState().authUser;
      if (!authUser?._id) {
        throw new Error("User not authenticated");
      }

      const res = await axiosInstance.get("/messages/users");
      console.log("[getUsers] Response:", res.data);
      const users = res.data?.data || [];
      const unreadMessages = users.reduce((acc, user) => ({ ...acc, [user._id]: 0 }), {});

      let sortedUsers = users;
      try {
        const savedOrder = localStorage.getItem("userSortOrder");
        if (savedOrder) {
          const orderedIds = JSON.parse(savedOrder);
          if (Array.isArray(orderedIds)) {
            sortedUsers = orderedIds
              .map((id) => users.find((user) => user._id === id))
              .filter(Boolean)
              .concat(users.filter((user) => !orderedIds.includes(user._id)));
          }
        } else {
          sortedUsers = users.sort((a, b) => a.username?.localeCompare(b.username || "") || 0);
        }
      } catch (error) {
        console.error("[getUsers] Error restoring sort order:", error);
        sortedUsers = users.sort((a, b) => a.username?.localeCompare(b.username || "") || 0);
      }

      set({ users: sortedUsers, unreadMessages, totalUnreadCount: 0 });
      localStorage.setItem("userSortOrder", JSON.stringify(sortedUsers.map((user) => user._id)));
      document.title = "Messages";
    } catch (error) {
      console.error("[getUsers] Error:", error);
      toast.error(error.response?.data?.error || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      if (!userId) {
        throw new Error("Invalid user ID");
      }
      const authUser = useAuthStore.getState().authUser;
      if (!authUser?._id) {
        throw new Error("User not authenticated");
      }

      const res = await axiosInstance.get(`/messages/${userId}`);
      console.log("[getMessages] Response:", res.data);
      const messages = res.data?.data || [];
      set((state) => {
        const newUnreadMessages = { ...state.unreadMessages, [userId]: 0 };
        const totalUnreadCount = Object.values(newUnreadMessages).reduce(
          (sum, count) => sum + count,
          0
        );
        document.title = totalUnreadCount > 0 ? `(${totalUnreadCount}) Messages` : "Messages";
        return {
          messages,
          unreadMessages: newUnreadMessages,
          totalUnreadCount,
          mutualMessageCache: {
            ...state.mutualMessageCache,
            [userId]: messages.some(
              (msg) => msg.senderId === userId && msg.receiverId === authUser._id
            ),
          },
        };
      });
    } catch (error) {
      console.error("[getMessages] Error:", error);
      toast.error(error.response?.data?.error || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    try {
      const { selectedUser } = get();
      if (!selectedUser?._id) {
        throw new Error("No user selected");
      }
      console.log("[sendMessage] Sending:", messageData);
      await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
    } catch (error) {
      console.error("[sendMessage] Error:", error);
      toast.error(error.response?.data?.error || "Failed to send message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      if (!messageId) {
        throw new Error("Invalid message ID");
      }
      console.log("[deleteMessage] Deleting:", messageId);
      await axiosInstance.delete(`/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
    } catch (error) {
      console.error("[deleteMessage] Error:", error);
      toast.error(error.response?.data?.error || "Failed to delete message");
    }
  },

  addReaction: async (messageId, emoji) => {
    try {
      if (!messageId || !emoji) {
        throw new Error("Invalid message ID or emoji");
      }
      console.log("[addReaction] Adding:", { messageId, emoji });
      const { messages } = get();
      const messageExists = messages.some((msg) => msg._id === messageId);
      if (!messageExists) {
        throw new Error("Message not found in local state");
      }

      const res = await axiosInstance.post(`/messages/${messageId}/reactions`, { emoji });
      console.log("[addReaction] Response:", res.data);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions: res.data.data } : msg
        ),
      }));
    } catch (error) {
      console.error("[addReaction] Error:", error);
      toast.error(error.response?.data?.error || "Failed to add reaction");
    }
  },

  removeReaction: async (messageId, reactionId) => {
    try {
      if (!messageId || !reactionId) {
        throw new Error("Invalid message ID or reaction ID");
      }
      console.log("[removeReaction] Removing:", { messageId, reactionId });
      const { messages } = get();
      const message = messages.find((msg) => msg._id === messageId);
      if (!message) {
        throw new Error("Message not found in local state");
      }
      const reactionExists = message.reactions?.some((r) => r._id === reactionId);
      if (!reactionExists) {
        throw new Error("Reaction not found in local state");
      }

      const res = await axiosInstance.delete(`/messages/${messageId}/reactions/${reactionId}`);
      console.log("[removeReaction] Response:", res.data);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, reactions: res.data.data } : msg
        ),
      }));
    } catch (error) {
      console.error("[removeReaction] Error:", error);
      toast.error(error.response?.data?.error || "Failed to remove reaction");
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUserId = useAuthStore.getState().authUser?._id;
    if (!socket || !authUserId) {
      console.warn("[subscribeToMessages] Socket or user ID missing");
      return;
    }

    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("newNotification");
    socket.off("reactionAdded");
    socket.off("reactionRemoved");

    socket.on("newMessage", async (newMessage) => {
      console.log("[Socket] New message received:", newMessage);
      const { selectedUser, messages, users, mutualMessageCache } = get();

      if (
        selectedUser &&
        (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id)
      ) {
        const messageExists = messages.some((msg) => msg._id === newMessage._id);
        if (!messageExists) {
          set((state) => ({
            messages: [...state.messages, newMessage],
          }));
        }
      }

      let hasMutualMessages =
        newMessage.senderId === authUserId ? true : mutualMessageCache[newMessage.senderId];
      if (newMessage.senderId !== authUserId && hasMutualMessages === undefined) {
        try {
          const res = await axiosInstance.get(`/messages/${newMessage.senderId}`);
          hasMutualMessages =
            res.data?.data?.some(
              (msg) => msg.senderId === newMessage.senderId && msg.receiverId === authUserId
            ) || false;
          set((state) => ({
            mutualMessageCache: {
              ...state.mutualMessageCache,
              [newMessage.senderId]: hasMutualMessages,
            },
          }));
        } catch (error) {
          console.error("[Socket] Error checking mutual messages:", error);
          hasMutualMessages = false;
        }
      }

      set((state) => ({
        users: state.users.map((user) =>
          user._id === newMessage.senderId || user._id === newMessage.receiverId
            ? { ...user, lastMessage: newMessage.createdAt }
            : user
        ),
      }));

      set((state) => {
        const sortedUsers = [...state.users].sort((a, b) => {
          const aTime = a.lastMessage ? new Date(a.lastMessage).getTime() : 0;
          const bTime = b.lastMessage ? new Date(b.lastMessage).getTime() : 0;
          return bTime - aTime;
        });
        localStorage.setItem("userSortOrder", JSON.stringify(sortedUsers.map((user) => user._id)));
        return { users: sortedUsers };
      });
    });

    socket.on("newNotification", ({ messageId, senderId, text, senderName }) => {
      console.log("[Socket] New notification received:", { messageId, senderId, text, senderName });
      const { selectedUser } = get();
      if (senderId !== authUserId && (!selectedUser || senderId !== selectedUser._id)) {
        set((state) => {
          const newUnreadMessages = {
            ...state.unreadMessages,
            [senderId]: (state.unreadMessages[senderId] || 0) + 1,
          };
          const totalUnreadCount = Object.values(newUnreadMessages).reduce(
            (sum, count) => sum + count,
            0
          );
          document.title = totalUnreadCount > 0 ? `(${totalUnreadCount}) Messages` : "Messages";
          return { unreadMessages: newUnreadMessages, totalUnreadCount };
        });

        toast(`${senderName}: ${text.slice(0, 50)}`, {
          duration: 3000,
          position: "top-right",
          style: {
            background: "#1f2937",
            color: "#f3f4f6",
            border: "1px solid #374151",
          },
        });
      }
    });

    socket.on("messageDeleted", (messageId) => {
      console.log("[Socket] Message deleted:", messageId);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
    });

    socket.on("reactionAdded", ({ messageId, reaction }) => {
      console.log("[Socket] Reaction added:", { messageId, reaction });
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
            : msg
        ),
      }));
    });

    socket.on("reactionRemoved", ({ messageId, reactionId }) => {
      console.log("[Socket] Reaction removed:", { messageId, reactionId });
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId
            ? { ...msg, reactions: msg.reactions.filter((r) => r._id !== reactionId) }
            : msg
        ),
      }));
    });

    const handleFocus = () => {
      const { totalUnreadCount } = get();
      document.title = totalUnreadCount > 0 ? `(${totalUnreadCount}) Messages` : "Messages";
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      socket.off("newMessage");
      socket.off("messageDeleted");
      socket.off("newNotification");
      socket.off("reactionAdded");
      socket.off("reactionRemoved");
      window.removeEventListener("focus", handleFocus);
    };
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messageDeleted");
      socket.off("newNotification");
      socket.off("reactionAdded");
      socket.off("reactionRemoved");
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    document.title = "Messages";
  },
}));