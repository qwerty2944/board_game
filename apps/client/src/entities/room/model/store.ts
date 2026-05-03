import { create } from "zustand";

export interface CardTooltipData {
  value: number;
  name: string;
  screenX: number;
  screenY: number;
}

interface UIStore {
  isChatOpen: boolean;
  isCreateRoomModalOpen: boolean;
  isJoinByCodeModalOpen: boolean;
  notification: { type: string; message: string } | null;
  cardTooltip: CardTooltipData | null;

  toggleChat: () => void;
  openCreateRoomModal: () => void;
  closeCreateRoomModal: () => void;
  openJoinByCodeModal: () => void;
  closeJoinByCodeModal: () => void;
  showNotification: (type: string, message: string) => void;
  clearNotification: () => void;
  showCardTooltip: (data: CardTooltipData) => void;
  hideCardTooltip: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isChatOpen: false,
  isCreateRoomModalOpen: false,
  isJoinByCodeModalOpen: false,
  notification: null,
  cardTooltip: null,

  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  openCreateRoomModal: () => set({ isCreateRoomModalOpen: true }),
  closeCreateRoomModal: () => set({ isCreateRoomModalOpen: false }),
  openJoinByCodeModal: () => set({ isJoinByCodeModalOpen: true }),
  closeJoinByCodeModal: () => set({ isJoinByCodeModalOpen: false }),
  showNotification: (type, message) => set({ notification: { type, message } }),
  clearNotification: () => set({ notification: null }),
  showCardTooltip: (data) => set({ cardTooltip: data }),
  hideCardTooltip: () => set({ cardTooltip: null }),
}));
