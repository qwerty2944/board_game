"use client";

import { useState, useRef, useEffect } from "react";
import type { Room } from "colyseus.js";
import { useUIStore } from "@/stores/uiStore";
import { MessageType } from "@board-game/shared";

interface ChatPanelProps {
  room: Room | null;
  sendMessage: (type: string, data?: any) => void;
}

interface ChatEntry {
  senderSessionId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export function ChatPanel({ room, sendMessage }: ChatPanelProps) {
  const isChatOpen = useUIStore((s) => s.isChatOpen);
  const toggleChat = useUIStore((s) => s.toggleChat);
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room) return;

    // Listen for chat messages via state
    const chatListener = room.state.chatMessages?.onChange(() => {
      const parsed: ChatEntry[] = [];
      for (let i = 0; i < room.state.chatMessages.length; i++) {
        try {
          parsed.push(JSON.parse(room.state.chatMessages[i]));
        } catch {}
      }
      setMessages(parsed);
    });
  }, [room]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(MessageType.CHAT, { text: input.trim() });
    setInput("");
  };

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-game-accent p-3 text-white shadow-lg hover:bg-red-600"
      >
        Chat
      </button>

      {isChatOpen && (
        <div className="fixed bottom-16 right-4 z-40 flex h-80 w-72 flex-col rounded-lg border border-gray-700 bg-game-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-700 px-3 py-2">
            <span className="text-sm font-semibold text-white">Chat</span>
            <button
              onClick={toggleChat}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1">
            {messages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium text-primary-400">
                  {msg.senderName}:
                </span>{" "}
                <span className="text-gray-300">{msg.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="border-t border-gray-700 p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white placeholder-gray-500"
              maxLength={500}
            />
          </form>
        </div>
      )}
    </>
  );
}
