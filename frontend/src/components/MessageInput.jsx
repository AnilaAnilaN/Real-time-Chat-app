import { useRef, useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Mic, StopCircle, Smile } from "lucide-react";
import toast from "react-hot-toast";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiButtonRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
        clearInterval(mediaRecorderRef.current.durationInterval);
      }
    };
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file?.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioPreview(null);
    setDuration(0);
  };

  const startRecording = async () => {
    if (!selectedUser) {
      toast.error("Please select a user to chat with");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioPreview(audioUrl);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      const durationInterval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      mediaRecorderRef.current.durationInterval = durationInterval;
    } catch (error) {
      console.error("[MessageInput] Microphone error:", error);
      toast.error("Microphone access denied or unavailable");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      clearInterval(mediaRecorderRef.current.durationInterval);
      setIsRecording(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !audioBlob) return;
    if (!selectedUser) {
      toast.error("Please select a user to chat with");
      return;
    }

    try {
      let voiceMessageUrl = null;
      if (audioBlob) {
        voiceMessageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(audioBlob);
        });
      }

      await sendMessage({
        text: text.trim(),
        image: imagePreview,
        voiceMessage: voiceMessageUrl,
        duration,
        emoji: text.trim() && !imagePreview && !voiceMessageUrl ? text.trim() : null,
      });

      setText("");
      setImagePreview(null);
      setAudioBlob(null);
      setAudioPreview(null);
      setDuration(0);
      if (imageInputRef.current) imageInputRef.current.value = "";
    } catch (error) {
      console.error("[MessageInput] Send message error:", error);
      toast.error("Failed to send message");
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="p-4 w-full bg-base-200 border-t border-base-300">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Image Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center hover:bg-error"
              type="button"
            >
              <X className="size-3 text-error-content" />
            </button>
          </div>
        </div>
      )}

      {audioPreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex items-center gap-2 bg-base-100 p-2 rounded-lg shadow-sm">
            <audio ref={audioRef} src={audioPreview} controls className="max-w-[200px]" />
            <span className="text-sm text-base-content/60">{formatDuration(duration)}</span>
            <button
              onClick={removeAudio}
              className="w-5 h-5 rounded-full bg-base-300 flex items-center justify-center hover:bg-error"
              type="button"
            >
              <X className="size-3 text-error-content" />
            </button>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="mb-3 flex items-center gap-2 text-error animate-pulse">
          <span>Recording... {formatDuration(duration)}</span>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gradient-to-r from-teal-500 to-pink-500 text-white p-2 rounded-3xl border border-teal-600 shadow-md">
          <button
            type="button"
            className="btn btn-circle btn-ghost text-white/60 hover:bg-white/10"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            ref={emojiButtonRef}
          >
            <Smile size={20} />
          </button>
          <input
            type="text"
            className="flex-1 w-full max-w-4xl p-2 text-base bg-transparent focus:outline-none placeholder:text-white/60"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!selectedUser}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={imageInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={`btn btn-circle btn-ghost ${
              imagePreview ? "text-emerald-300" : "text-white/60"
            } hover:bg-white/10`}
            onClick={() => imageInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
          <button
            type="button"
            className={`btn btn-circle btn-ghost ${
              isRecording ? "text-red-300 animate-pulse" : "text-white/60"
            } hover:bg-white/10`}
            onClick={isRecording ? stopRecording : startRecording}
          >
            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-circle bg-teal-500 text-white hover:bg-teal-600 disabled:bg-base-300 disabled:text-base-content/60"
          disabled={!text.trim() && !imagePreview && !audioBlob}
          title="Send message"
        >
          <Send size={20} />
        </button>
      </form>

      {showEmojiPicker && (
        <div
          className="absolute z-50 bottom-16 left-1/2 max-w-[350px]"
          style={{
            transform: "translateX(-50%)",
          }}
        >
          <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="dark" />
        </div>
      )}
    </div>
  );
};

export default MessageInput;