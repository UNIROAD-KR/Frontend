import AsyncStorage from "@react-native-async-storage/async-storage";
import { getMemberMe } from "@/src/api/auth";
import type { ChatSortOrder } from "@/src/utils/chatSort";

export type ChatListPreferences = { sortOrder: ChatSortOrder; roomOrder: number[] };
const defaults: ChatListPreferences = { sortOrder: "newest", roomOrder: [] };
export async function getChatPreferencesKey() {
  const response = await getMemberMe();
  return `chat-list-preferences:${response.data.data.id}`;
}
export async function loadChatPreferences(key: string): Promise<ChatListPreferences> {
  const value = await AsyncStorage.getItem(key);
  if (!value) return defaults;
  try {
    const parsed = JSON.parse(value);
    return {
      sortOrder: ["newest", "unread", "custom"].includes(parsed.sortOrder) ? parsed.sortOrder : "newest",
      roomOrder: Array.isArray(parsed.roomOrder) ? [...new Set<number>(parsed.roomOrder.filter((id: unknown) => typeof id === "number" && Number.isFinite(id)))] : [],
    };
  } catch { return defaults; }
}
export async function saveChatPreferences(key: string, value: ChatListPreferences) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}
