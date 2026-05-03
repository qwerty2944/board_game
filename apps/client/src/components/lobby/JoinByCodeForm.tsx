"use client";

import { useState } from "react";

interface JoinByCodeFormProps {
  onJoin: (code: string, password?: string) => void;
}

export function JoinByCodeForm({ onJoin }: JoinByCodeFormProps) {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length >= 6) {
      onJoin(code.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter room code"
        maxLength={6}
        className="w-40 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-center font-mono text-lg uppercase tracking-widest text-white placeholder-gray-500"
      />
      <button
        type="submit"
        disabled={code.trim().length < 6}
        className="btn-primary"
      >
        Join by Code
      </button>
    </form>
  );
}
