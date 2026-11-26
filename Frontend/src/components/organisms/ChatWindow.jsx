// Job: 1v1 Chat window organism with ChatHeader, access alert, message thread, typing indicator, and ChatInputBox
import React, { useRef, useEffect, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageBubble from "../molecules/MessageBubble";
import ChatInputBox from "./ChatInputBox";
import Button from "../atoms/Button";
import Modal from "./Modal";
import { MessageSquare, Gift, AlertCircle, X } from "lucide-react";

export default function ChatWindow({
  activeChat,
  currentUserId,
  messages = [],
  loadingMessages = false,
  accessInfo = { canChat: true, reason: null, isMuted: false, isBlocked: false, blockedByMe: false },
  partnerIsTyping = false,
  inputText = "",
  onChangeInput,
  onSendMessage,
  onTyping,
  imagePreview,
  onSelectImage,
  onClearImage,
  sendingMessage = false,
  onBack,
  onToggleMute,
  onToggleBlock,
  onSendFriendRequest,
  onOpenInvite,
  className = "",
}) {
  const messagesEndRef = useRef(null);
  const [enlargedImage, setEnlargedImage] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerIsTyping]);

  if (!activeChat) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 h-full ${className}`}>
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
          <MessageSquare className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Your 1v1 Conversations</h3>
        <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
          All interactions on Dar-ul-Ameen are strictly 1v1 and private. Select an active conversation on the left, or connect with peers and teachers to start messaging.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary" size="md" onClick={onOpenInvite}>
            <Gift className="w-4 h-4 mr-1.5" /> Invite Friends & Earn Rs. 100
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white overflow-hidden relative ${className}`}>
      {/* Header */}
      <ChatHeader
        partner={activeChat}
        isOnline={activeChat.isOnline}
        isTyping={partnerIsTyping}
        isMuted={accessInfo.isMuted}
        isBlocked={accessInfo.isBlocked}
        onBack={onBack}
        onToggleMute={onToggleMute}
        onToggleBlock={onToggleBlock}
      />

      {/* Access Warning Banner */}
      {!accessInfo.canChat && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between text-xs text-amber-800 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {accessInfo.reason === "blocked"
                ? accessInfo.blockedByMe
                  ? "You have blocked this contact. Unblock to message."
                  : "You cannot send messages to this contact."
                : "You can only chat with users you have an active connection with."}
            </span>
          </div>
          {accessInfo.reason !== "blocked" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSendFriendRequest?.(activeChat._id)}
              className="bg-amber-600 text-white border-none hover:bg-amber-700"
            >
              Send Friend Request
            </Button>
          )}
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
        {loadingMessages ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading conversation...</div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
              <MessageSquare className="w-5 h-5" />
            </div>
            No messages yet. Send a friendly message or greeting!
          </div>
        ) : (
          messages.map((msg) => {
            const isMine =
              msg.sender === currentUserId ||
              msg.sender?._id === currentUserId ||
              msg.sender?.id === currentUserId;
            return (
              <MessageBubble
                key={msg._id}
                message={msg}
                isMine={isMine}
                onImageClick={(url) => setEnlargedImage(url)}
              />
            );
          })
        )}

        {/* In-thread Typing Indicator */}
        {partnerIsTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1.5 w-fit shadow-xs">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[11px]">{activeChat.fullName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <ChatInputBox
        text={inputText}
        onChangeText={onChangeInput}
        onSend={onSendMessage}
        onTyping={onTyping}
        imagePreview={imagePreview}
        onSelectImage={onSelectImage}
        onClearImage={onClearImage}
        isSending={sendingMessage}
        disabled={!accessInfo.canChat}
        placeholder={!accessInfo.canChat ? "Chatting is not available" : "Type a 1v1 message..."}
      />

      {/* Lightbox Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              type="button"
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={enlargedImage} alt="Enlarged" className="max-h-[85vh] w-auto rounded-lg object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
