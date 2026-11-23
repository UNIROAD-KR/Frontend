import { Text } from "@/components/ui/app-text";
import { ListLoadingIndicator } from "@/components/ui/list-loading-indicator";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ChatRoomResponse, getChatRooms } from "../../../src/api/chat";
import { Colors, commonStyles, fonts } from "@/constants/theme";
import { useChatListSettings } from "@/components/chat/chat-list-settings";
import { sortChatRooms } from "@/src/utils/chatSort";
import EmptyState from "@/components/ui/empty-state";
import defaultChatImage from "../../../assets/images/simbol.png";

const categoryLabels = {
  TRADE: "중고거래",
  TICKET: "티켓 양도",
  COMPANION: "동행 모집",
  MENTOR: "멘토링",
} as const;

const chatFilters = [
  { key: "ALL", label: "전체" },
  { key: "TRADE", label: "중고거래" },
  { key: "TICKET", label: "티켓 양도" },
  { key: "COMPANION", label: "동행 모집" },
] as const;
type ChatFilter = (typeof chatFilters)[number]["key"];

const roomLabels = {
  TRADE: { title: "중고거래 채팅", reference: "거래글", icon: "cart-outline" },
  MENTOR: { title: "멘토링 채팅", reference: "멘토링", icon: "school-outline" },
  TICKET: {
    title: "티켓 양도 채팅",
    reference: "티켓 양도글",
    icon: "ticket-outline",
  },
  COMPANION: {
    title: "동행 채팅",
    reference: "동행 모집글",
    icon: "people-outline",
  },
} as const;

const getRoomTitle = (room: ChatRoomResponse) =>
  room.referenceTitle ?? roomLabels[room.referenceType]?.title ?? "채팅";

export default function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const roomsRequestPending = useRef(false);
  const [selectedFilter, setSelectedFilter] = useState<ChatFilter>("ALL");
  const { sortOrder, roomOrder, refreshSettings } = useChatListSettings();
  const filteredRooms = sortChatRooms(
    selectedFilter === "ALL"
      ? rooms
      : rooms.filter((room) => room.referenceType === selectedFilter),
    sortOrder,
    roomOrder,
  );

  const loadRooms = useCallback(async (showSpinner = true) => {
    if (roomsRequestPending.current) return;
    roomsRequestPending.current = true;
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
    } finally {
      roomsRequestPending.current = false;
      if (showSpinner) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRooms();
      void refreshSettings().catch((error) =>
        console.log("채팅 정렬 불러오기 실패", error),
      );

      const timer = setInterval(() => {
        loadRooms(false);
      }, 5000);

      return () => clearInterval(timer);
    }, [loadRooms, refreshSettings]),
  );

  return (
    <View style={commonStyles.container}>
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {chatFilters.map((filter) => {
            const selected = selectedFilter === filter.key;
            return (
              <Pressable
                key={filter.key}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSelectedFilter(filter.key)}
                style={[styles.filterChip, selected && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selected && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <ScrollView
        contentContainerStyle={[
          {
            paddingBottom: 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading && rooms.length === 0 ? (
          <ListLoadingIndicator label="채팅방을 불러오는 중이에요" />
        ) : filteredRooms.length > 0 ? (
          <View style={styles.roomList}>
            {filteredRooms.map((room) => {
              const title = getRoomTitle(room);

              // const opponentName =
              //   room.opponentNickname || room.opponentName || title;
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
                        // sellerName: opponentName,
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
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      marginRight: 12,
                      borderRadius: 12,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={
                        room.referenceImageUrl
                          ? { uri: room.referenceImageUrl }
                          : defaultChatImage
                      }
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>

                  <View style={styles.roomTextBox}>
                    <View style={styles.roomTitleRow}>
                      {categoryLabels[room.referenceType] && (
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>
                            {categoryLabels[room.referenceType]}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.roomTitle} numberOfLines={1}>
                        {title}
                      </Text>
                      {/* {room.lastMessageCreatedAt && (
                        <Text style={styles.roomTime}>
                          {formatRoomTime(room.lastMessageCreatedAt)}
                        </Text>
                      )} */}
                    </View>
                    {/* <Text style={styles.roomSubtitle} numberOfLines={1}>
                      {subtitle}
                    </Text> */}
                    <View style={styles.roomPreviewRow}>
                      <Text style={styles.roomPreview} numberOfLines={1}>
                        {previewMessage}
                      </Text>
                      {Number(room.unreadCount) > 0 ? (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>
                            {Number(room.unreadCount) > 99
                              ? "99+"
                              : room.unreadCount}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <EmptyState
            title={
              selectedFilter === "ALL"
                ? "아직 열린 채팅방이 없어요"
                : "해당 카테고리의 채팅방이 없어요"
            }
            description="거래글이나 동행 모집글에서 시작한 채팅이 여기에 모여요."
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  filterChip: {
    minHeight: 38,
    borderRadius: 20,
    backgroundColor: Colors.gray[1],
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipActive: {
    backgroundColor: Colors.gray[11],
  },
  filterChipText: {
    ...fonts.body2_m_14,
    letterSpacing: 0,
    color: Colors.gray[7],
  },
  filterChipTextActive: {
    color: Colors.common.white,
  },

  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 22,
  },

  roomList: {
    gap: 16,
  },

  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
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
    flexShrink: 1,
    ...fonts.sub3_sb_16,
  },

  categoryBadge: {
    flexShrink: 0,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    backgroundColor: "#EAF3FF",
  },

  categoryText: {
    ...fonts.caption4_m_12,
    color: Colors.primary.default,
  },

  roomSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#777777",
  },

  roomPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  roomPreview: {
    flex: 1,
    ...fonts.body4_r_14,
    color: Colors.gray[7],
  },

  unreadBadge: {
    minWidth: 17,
    height: 17,
    borderRadius: 1000,
    backgroundColor: Colors.error.normal,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  unreadText: {
    ...fonts.caption4_m_12,
    color: Colors.common.white,
  },
});
