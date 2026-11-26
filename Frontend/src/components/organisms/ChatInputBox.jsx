// Job: 1v1 Chat message input bar organism with text input, image upload preview, emoji picker, and send action
import React, { useRef, useState, memo } from "react";
import IconButton from "../atoms/IconButton";
import { Send, Image as ImageIcon, Smile, X } from "lucide-react";
import { compressImage } from "../../utils/imageCompressor";

const EMOJIS = ["👍", "👋", "😊", "❤️", "🎉", "🔥", "🙏", "✅", "📚", "⭐", "👏", "💡"];

function ChatInputBox({
  text = "",
  onChangeText,
  onSend,
  onTyping,
  imagePreview,
  onSelectImage,
  onClearImage,
  isSending = false,
  disabled = false,
  placeholder = "Type a 1v1 message...",
  className = "",
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || isSending) return;
    if (!text.trim() && !imagePreview) return;
    onSend?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.75 });
        onSelectImage?.(compressed);
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => onSelectImage?.(reader.result);
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className={`p-3 bg-white border-t border-slate-200 relative ${className}`}>
      {/* Image Preview */}
      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img
            src={imagePreview}
            alt="upload preview"
            loading="lazy"
            decoding="async"
            className="w-16 h-16 object-cover rounded-xl border border-slate-200"
          />
          <button
            type="button"
            onClick={onClearImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-full left-4 mb-2 p-2 bg-white border border-slate-200 rounded-2xl shadow-xl grid grid-cols-6 gap-1 z-30">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onChangeText?.(text + emoji);
                setShowEmoji(false);
              }}
              className="w-8 h-8 flex items-center justify-center text-base hover:bg-slate-100 rounded-lg transition-transform active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <IconButton
          onClick={() => fileInputRef.current?.click()}
          title="Upload image"
          size="sm"
          type="button"
        >
          <ImageIcon className="w-5 h-5 text-slate-500 hover:text-emerald-600" />
        </IconButton>

        <IconButton
          onClick={() => setShowEmoji(!showEmoji)}
          title="Insert emoji"
          size="sm"
          type="button"
        >
          <Smile className="w-5 h-5 text-slate-500 hover:text-emerald-600" />
        </IconButton>

        <input
          type="text"
          value={text}
          onChange={(e) => {
            onChangeText?.(e.target.value);
            onTyping?.();
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all disabled:opacity-50"
        />

        <IconButton
          type="submit"
          variant="primary"
          size="sm"
          disabled={disabled || isSending || (!text.trim() && !imagePreview)}
          isLoading={isSending}
          title="Send"
        >
          <Send className="w-4 h-4 text-white" />
        </IconButton>
      </form>
    </div>
  );
}

export default memo(ChatInputBox);
