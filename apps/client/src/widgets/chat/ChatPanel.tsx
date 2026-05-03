"use client";

import { useState, useRef, useEffect } from "react";
import { useUIStore } from "@/entities/room/model/store";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { Room } from "colyseus.js";

interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
}

interface Props {
  room: Room | null;
  sendMessage: (type: string, data?: any) => void;
}

export function ChatPanel({ room, sendMessage }: Props) {
  const { isChatOpen, toggleChat } = useUIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!room) return;

    room.onMessage("chat", (msg: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-99), msg]);
    });
  }, [room]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage("chat", { text: input.trim() });
    setInput("");
  };

  return (
    <>
      <Button
        onClick={toggleChat}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        {isChatOpen ? "채팅 닫기" : "채팅"}
      </Button>

      {isChatOpen && (
        <div className="fixed bottom-14 right-4 z-50 flex h-80 w-72 flex-col rounded-lg border border-gray-700 bg-gray-900/95 shadow-xl">
          <div className="border-b border-gray-700 px-3 py-2">
            <span className="text-sm font-medium text-white">채팅</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
            {messages.map((msg, i) => (
              <div key={i} className="mb-1">
                <span className="text-xs font-semibold text-blue-400">
                  {msg.sender}
                </span>
                <span className="ml-1 text-xs text-gray-300">{msg.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex gap-1 border-t border-gray-700 p-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="메시지 입력..."
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" className="h-8 px-3">
              전송
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
