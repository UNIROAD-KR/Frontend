import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { ChatSortOrder } from "@/src/utils/chatSort";
import { getChatPreferencesKey, loadChatPreferences, saveChatPreferences, type ChatListPreferences } from "@/src/storage/chatRoomOrder";

const ChatListSettings = createContext<{
  sortOrder: ChatSortOrder;
  roomOrder: number[];
  refreshSettings: () => Promise<ChatListPreferences>;
  setSortOrder: (value: ChatSortOrder) => Promise<void>;
  saveRoomOrder: (ids: number[]) => Promise<void>;
} | null>(null);

export function ChatListSettingsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<ChatListPreferences>({ sortOrder: "newest", roomOrder: [] });
  const refreshSettings = useCallback(async () => {
    const key = await getChatPreferencesKey();
    const saved = await loadChatPreferences(key);
    setPreferences(saved);
    return saved;
  }, []);
  const update = async (change: Partial<ChatListPreferences>) => {
    const key = await getChatPreferencesKey();
    const saved = await loadChatPreferences(key);
    const next = { ...saved, ...change };
    await saveChatPreferences(key, next);
    setPreferences(next);
  };
  return <ChatListSettings.Provider value={{ ...preferences, refreshSettings,
    setSortOrder: (sortOrder) => update({ sortOrder }),
    saveRoomOrder: (roomOrder) => update({ roomOrder, sortOrder: "custom" }),
  }}>{children}</ChatListSettings.Provider>;
}
export function useChatListSettings() {
  const settings = useContext(ChatListSettings);
  if (!settings) throw new Error("ChatListSettingsProvider is required");
  return settings;
}
