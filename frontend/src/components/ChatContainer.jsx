import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { X, Smile, Play } from "lucide-react";
import MessageInput from "./MessageInput";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const { messages, getMessages, deleteMessage, addReaction, removeReaction, selectedUser, subscribeToMessages } =
    useChatStore();
  const { authUser } = useAuthStore();
  const messagesEndRef = useRef(null);
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const audioRefs = useRef({});

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
    const unsubscribe = subscribeToMessages();
    return () => unsubscribe && unsubscribe();
  }, [selectedUser?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAddReaction = async (messageId, emoji) => {
    try {
      await addReaction(messageId, emoji);
      // Removed setShowReactionPicker(null) to keep picker open
    } catch (error) {
      console.error("[ChatContainer] Add reaction error:", error);
      toast.error("Failed to add reaction");
    }
  };

  const handleRemoveReaction = async (messageId, reactionId) => {
    try {
      await removeReaction(messageId, reactionId);
    } catch (error) {
      console.error("[ChatContainer] Remove reaction error:", error);
      toast.error("Failed to remove reaction");
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error("[ChatContainer] Delete message error:", error);
      toast.error("Failed to delete message");
    }
  };

  const toggleReactionPicker = (messageId) => {
    setShowReactionPicker(showReactionPicker === messageId ? null : messageId);
  };

  const handlePlayAudio = (messageId) => {
    const audio = audioRefs.current[messageId];
    if (audio) {
      if (audio.paused) {
        audio.play().catch((error) => {
          console.error("[ChatContainer] Audio play error:", error);
          toast.error("Failed to play audio");
        });
      } else {
        audio.pause();
      }
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const reactionEmojis = ["👍", "❤️", "😂", "😢"];

  return (
    <div className="flex-1 flex flex-col bg-base-100">
      {selectedUser ? (
        <>
          <div className="p-5  bg-gradient-to-r from-teal-500 to-pink-500 text-black rounded-none shadow-sm border-b border-gray-200">
            <h2 className="text-xl font-bold">
              {selectedUser.fullName || selectedUser.username}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isSentByUser = msg.senderId === authUser?._id;
              // Filter emojis to exclude those already reacted by the user
              const availableEmojis = reactionEmojis.filter(
                (emoji) => !msg.reactions?.some((r) => r.userId === authUser?._id && r.emoji === emoji)
              );
              return (
                <div
                  key={msg._id}
                  className={`chat ${isSentByUser ? "chat-end" : "chat-start"}`}
                >
                  <div
                    className={`chat-bubble ${
                      isSentByUser
                        ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-2xl shadow-md"
                        : "bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl shadow-md"
                    } max-w-[80%] p-4`}
                  >
                    {msg.text && <p>{msg.text}</p>}
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Message image"
                        className="w-full max-w-xs rounded-lg mt-2"
                      />
                    )}
                    {msg.voiceMessage && (
                      <div
                        className={`flex items-center gap-2 w-full max-w-[80%] mt-2 p-2 ${
                          isSentByUser ? "bg-teal-600/20" : "bg-purple-600/20"
                        } shadow-sm`}
                      >
                        <button
                          onClick={() => handlePlayAudio(msg._id)}
                          className="text-white hover:text-teal-400"
                          title="Play audio"
                        >
                          <Play size={20} />
                        </button>
                        <span className="text-xs text-white/60">
                          {msg.duration ? formatDuration(msg.duration) : "Voice message"}
                        </span>
                        <audio
                          ref={(el) => (audioRefs.current[msg._id] = el)}
                          src={msg.voiceMessage}
                          className="hidden"
                        />
                      </div>
                    )}
                    {msg.createdAt && (
                      <span className="text-xs opacity-60 mt-1 block">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 relative">
                    {msg.reactions?.map((reaction) => (
                      <button
                        key={reaction._id}
                        onClick={() =>
                          reaction.userId === authUser?._id
                            ? handleRemoveReaction(msg._id, reaction._id)
                            : handleAddReaction(msg._id, reaction.emoji)
                        }
                        className={`text-sm ${
                          reaction.userId === authUser?._id
                            ? "text-teal-400 font-semibold"
                            : "text-white/60"
                        } hover:opacity-80`}
                        title={
                          reaction.userId === authUser?._id
                            ? "Reacted by you"
                            : "Add reaction"
                        }
                      >
                        {reaction.emoji}
                      </button>
                    ))}
                    {availableEmojis.length > 0 && (
                      <button
                        onClick={() => toggleReactionPicker(msg._id)}
                        className="text-black opacity-100"
                        title="Add reaction"
                        data-testid="smile-button"
                      >
                        <Smile size={16} />
                      </button>
                    )}
                    {isSentByUser && (
                      <button
                        onClick={() => handleDeleteMessage(msg._id)}
                        className="text-error hover:text-error-focus"
                        title="Delete message"
                      >
                        <X size={16} />
                      </button>
                    )}
                    {showReactionPicker === msg._id && (
                      <div
                        className={`absolute z-10 top-[-2.5rem] flex gap-2 bg-base-200 p-2 rounded-lg shadow-md ${
                          isSentByUser
                            ? "left-0 translate-x-[-100%]"
                            : "right-0 translate-x-[100%]"
                        }`}
                      >
                        {availableEmojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleAddReaction(msg._id, emoji)}
                            className="text-lg hover:bg-base-300 rounded p-1"
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <MessageInput />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-base-content/60">
          Select a user to start chatting
        </div>
      )}
    </div>
  );
};

export default ChatContainer;