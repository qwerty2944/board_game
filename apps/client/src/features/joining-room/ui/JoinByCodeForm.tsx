"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface Props {
  onJoin: (code: string, password?: string) => void;
}

export function JoinByCodeForm({ onJoin }: Props) {
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onJoin(code.trim());
      setCode("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="방 코드 입력"
        maxLength={6}
        className="w-36 uppercase"
      />
      <Button type="submit" variant="outline" disabled={!code.trim()}>
        코드로 입장
      </Button>
    </form>
  );
}
