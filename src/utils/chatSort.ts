import type { ChatRoomResponse } from "@/src/api/chat";

export type ChatSortOrder = "newest" | "unread" | "custom";

const messageTime = (room: ChatRoomResponse) => {
  const time = Date.parse(room.lastMessageCreatedAt ?? "");
  return Number.isFinite(time) ? time : 0;
};

export function sortChatRooms(rooms: ChatRoomResponse[], order: ChatSortOrder, roomOrder: number[] = []) {
  const positions = new Map(roomOrder.map((id, index) => [id, index]));
  return [...rooms].sort((a, b) => {
    if (order === "custom") {
      const position = (positions.get(a.roomId) ?? Infinity) - (positions.get(b.roomId) ?? Infinity);
      if (position && !Number.isNaN(position)) return position;
    }
    if (order === "unread") {
      const unreadFirst = Number(Number(b.unreadCount) > 0) - Number(Number(a.unreadCount) > 0);
      if (unreadFirst) return unreadFirst;
    }
    return messageTime(b) - messageTime(a);
  });
}
