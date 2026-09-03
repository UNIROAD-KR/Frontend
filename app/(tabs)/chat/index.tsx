import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChatRoomResponse, getChatRooms } from "../../../src/api/chat";

const BLUE = "#102BE0";

const getRoomTitle = (room: ChatRoomResponse) =>
  room.referenceType === "TRADE" ? "중고거래 채팅" : "멘토링 채팅";

const getRoomSubtitle = (room: ChatRoomResponse) =>
  room.referenceType === "TRADE"
    ? `거래글 #${room.referenceId}`
    : `멘토링 #${room.referenceId}`;

const formatRoomTime = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10).replaceAll("-", ".");
  }

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMinutes < 1) return "방금 전";
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  return value.slice(0, 10).replaceAll("-", ".");
};

export default function ChatListPage() {
  const insets = useSafeAreaInsets();
  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRooms = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setLoading(true);
      }
      const response = await getChatRooms();
      setRooms(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.log(
        "채팅방 목록 조회 실패:",
        error.response?.data || error.message,
      );
      setRooms([]);
    } finally {
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRooms();

      const timer = setInterval(() => {
        loadRooms(false);
      }, 5000);

      return () => clearInterval(timer);
    }, [loadRooms]),
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(76, insets.top + 34),
            paddingBottom: Math.max(120, insets.bottom + 96),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>채팅</Text>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={BLUE} />
            <Text style={styles.centerText}>채팅방을 불러오는 중이에요</Text>
          </View>
        ) : rooms.length > 0 ? (
          <View style={styles.roomList}>
            {rooms.map((room) => {
              const title = getRoomTitle(room);
              const subtitle = getRoomSubtitle(room);
              const opponentName =
                room.opponentNickname || room.opponentName || title;
              const previewMessage =
                room.lastMessage ||
                (room.lastMessageType === "ENTER"
                  ? "채팅방에 입장했어요"
                  : "아직 메시지가 없어요");

              return (
                <Pressable
                  key={room.roomId}
                  style={styles.roomCard}
                  onPress={() =>
                    router.push({
                      pathname: "/chat/[roomId]",
                      params: {
                        roomId: String(room.roomId),
                        title,
                        sellerName: opponentName,
                        price: "",
                        thumbnail: "",
                        referenceType: room.referenceType,
                        referenceId: String(room.referenceId),
                        opponentMemberId: room.opponentMemberId
                          ? String(room.opponentMemberId)
                          : "",
                      },
                    } as any)
                  }
                >
                  <View style={styles.roomIcon}>
                    <Ionicons
                      name={
                        room.referenceType === "TRADE"
                          ? "cart-outline"
                          : "school-outline"
                      }
                      size={22}
                      color={BLUE}
                    />
                  </View>

                  <View style={styles.roomTextBox}>
                    <View style={styles.roomTitleRow}>
                      <Text style={styles.roomTitle} numberOfLines={1}>
                        {opponentName}
                      </Text>
                      {room.lastMessageCreatedAt && (
                        <Text style={styles.roomTime}>
                          {formatRoomTime(room.lastMessageCreatedAt)}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.roomSubtitle} numberOfLines={1}>
                      {subtitle}
                    </Text>
                    <Text style={styles.roomPreview} numberOfLines={1}>
                      {previewMessage}
                    </Text>
                  </View>

                  {Number(room.unreadCount) > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>
                        {Number(room.unreadCount) > 99
                          ? "99+"
                          : room.unreadCount}
                      </Text>
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#999999"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.centerState}>
            <Ionicons name="chatbubbles-outline" size={38} color="#BBBBBB" />
            <Text style={styles.emptyTitle}>아직 열린 채팅방이 없어요</Text>
            <Text style={styles.centerText}>
              거래글에서 채팅을 시작하면 여기에 모여요.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingHorizontal: 23,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 22,
  },

  centerState: {
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  centerText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#777777",
    textAlign: "center",
  },

  emptyTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
  },

  roomList: {
    gap: 10,
  },

  roomCard: {
    minHeight: 78,
    borderRadius: 8,
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  roomIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EAF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  roomTextBox: {
    flex: 1,
    minWidth: 0,
  },

  roomTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  roomTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 5,
  },

  roomTime: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999999",
  },

  roomSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777777",
  },

  roomPreview: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: "600",
    color: "#555555",
  },

  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  unreadText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
  },
});
