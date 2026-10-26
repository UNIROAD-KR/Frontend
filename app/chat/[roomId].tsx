import { Text, TextInput } from "@/components/ui/app-text";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback, useEffect, useRef, useState } from "react";
import ExitIcon from "@/assets/icon/exit.svg";
import SendGrayIcon from "@/assets/icon/send-gray.svg";
import SendIcon from "@/assets/icon/send.svg";
import MenuIcon from "@/assets/icon/menu.svg";
import PlusCircleIcon from "@/assets/icon/plus-circle.svg";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppBackButton } from "@/components/ui/app-back-button";
import { Modal as AppModal } from "@/components/ui/modal";
import { useAppAlert } from "@/hooks/use-app-alert";
import { PhotoPickerSheet } from "@/components/ui/photo-picker-sheet";
import { Colors, fonts } from "@/constants/theme";
import { getCompanionPostDetail } from "../../src/api/companion";
import { getMemberMe } from "../../src/api/auth";
import {
  ChatMessageResponse,
  ChatRoomResponse,
  createChatSocket,
  getChatMessages,
  getChatRooms,
  readChatRoom,
  leaveChatRoom,
  sendChatMessage,
  subscribeChatRoom,
} from "../../src/api/chat";
import { createReport, ReportReason } from "../../src/api/reports";
import { getTicketDetail } from "../../src/api/ticket";
import { getUsedItemDetail } from "../../src/api/usedItems";
import { getTicketCurrency } from "../../src/storage/ticketMetadata";

type ChatMessage = {
  id: number;
  roomId: number;
  senderId: number | "me" | "other";
  message: string;
  type?: string;
  createdAt: string;
  unreadCount?: number;
  readCount?: number;
  read?: boolean;
  readByOpponent?: boolean;
  isRead?: boolean;
};

type ProductInfo = {
  title: string;
  price: string;
  thumbnail: string;
  sellerName?: string;
};

const BLUE = "#123F9F";
const GENERIC_TITLES = [
  "채팅",
  "동행 채팅",
  "중고거래 채팅",
  "멘토링 채팅",
  "티켓 양도 채팅",
];
const REPORT_OPTIONS: { label: string; reason: ReportReason }[] = [
  { label: "사기 의심", reason: "FRAUD" },
  { label: "부적절한 내용", reason: "INAPPROPRIATE" },
  { label: "욕설/비방", reason: "ABUSE" },
  { label: "스팸/광고", reason: "SPAM" },
  { label: "기타", reason: "ETC" },
];

const getValidAccessToken = async () => {
  const accessToken = await AsyncStorage.getItem("accessToken");
  console.log("[Chat][WebSocket] accessToken 확인:", Boolean(accessToken));

  if (!accessToken) {
    throw new Error("채팅 WebSocket 연결에 필요한 accessToken이 없습니다.");
  }

  return accessToken;
};

const normalizeMessage = (item: ChatMessageResponse): ChatMessage => ({
  id: item.id,
  roomId: item.roomId,
  senderId: item.senderId,
  message: item.message ?? item.content ?? "",
  type: item.type,
  createdAt: item.createdAt,
  unreadCount: item.unreadCount,
  readCount: item.readCount,
  read: item.read,
  readByOpponent: item.readByOpponent,
  isRead: item.isRead,
});

const sortMessagesByTime = (items: ChatMessage[]) => {
  return [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
};

const mergeMessagesById = (
  currentMessages: ChatMessage[],
  nextMessages: ChatMessage[],
) => {
  const messageMap = new Map<number, ChatMessage>();

  [...currentMessages, ...nextMessages].forEach((item) => {
    messageMap.set(item.id, item);
  });

  return sortMessagesByTime(Array.from(messageMap.values()));
};

const formatProductPrice = (value?: number, currencyUnit = "원") => {
  if (!value) return "가격 미정";

  return currencyUnit === "원"
    ? `${value.toLocaleString("ko-KR")}원`
    : `${currencyUnit} ${value.toLocaleString("ko-KR")}`;
};

const isGenericTitle = (value?: string) => {
  return !value || GENERIC_TITLES.includes(value.trim());
};

const formatMessageTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${String(hours).padStart(2, "0")}:${minutes}`;
};

const messageDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

const formatMessageDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

const isSameMessageGroup = (first?: ChatMessage, second?: ChatMessage) => {
  if (!first || !second || first.senderId !== second.senderId) return false;
  const gap = new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  return messageDateKey(first.createdAt) === messageDateKey(second.createdAt)
    && gap >= 0 && gap < 60000;
};

const getReadStatus = (item: ChatMessage) => {
  if (item.isRead) {
    return "";
  }

  if (item.readByOpponent || item.read || item.unreadCount === 0) {
    return "";
  }

  if (typeof item.readCount === "number" && item.readCount > 1) {
    return "";
  }

  return "1";
};

export default function ChatRoomPage() {
  const {
    roomId,
    title,
    price,
    thumbnail,
    sellerName,
    referenceType,
    referenceId,
    opponentMemberId,
  } = useLocalSearchParams<{
    roomId: string;
    title?: string;
    price?: string;
    thumbnail?: string;
    sellerName?: string;
    referenceType?: string;
    referenceId?: string;
    opponentMemberId?: string;
  }>();

  const scrollRef = useRef<ScrollView>(null);
  const { showAlert, alertElement } = useAppAlert();
  const [reportVisible, setReportVisible] = useState(false);
  const numericRoomId = Number(roomId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [contentErrorVisible, setContentErrorVisible] = useState(false);
  const [leaveRoomConfirmationVisible, setLeaveRoomConfirmationVisible] =
    useState(false);
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [roomInfo, setRoomInfo] = useState<ChatRoomResponse | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const effectiveReferenceType = roomInfo?.referenceType ?? referenceType;
  const effectiveReferenceId =
    roomInfo?.referenceId !== undefined
      ? String(roomInfo.referenceId)
      : referenceId;
  const parsedOpponentMemberId = opponentMemberId
    ? Number(opponentMemberId)
    : undefined;
  const effectiveOpponentMemberId =
    roomInfo?.opponentMemberId ??
    (Number.isFinite(parsedOpponentMemberId)
      ? parsedOpponentMemberId
      : undefined);
  const displaySellerName =
    roomInfo?.opponentNickname ||
    roomInfo?.opponentName ||
    sellerName ||
    productInfo?.sellerName ||
    "채팅";
  const productTitle =
    productInfo?.title ||
    (!isGenericTitle(title) ? title : undefined) ||
    (effectiveReferenceType === "COMPANION"
      ? "동행 모집글"
      : effectiveReferenceType === "TICKET"
        ? "티켓 양도글"
        : "중고거래 게시글");
  const productPrice = productInfo?.price || price || "가격 미정";
  const productThumbnail = productInfo?.thumbnail || thumbnail || "";

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const event = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const sub = Keyboard.addListener(event, () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => sub.remove();
  }, []);
  const fetchCurrentMember = useCallback(async () => {
    try {
      const response = await getMemberMe();
      setCurrentMemberId(response.data.data.id);
    } catch (error: any) {
      console.log("내 정보 조회 실패:", error.response?.data || error.message);
    }
  }, []);

  const fetchRoomInfo = useCallback(async () => {
    if (!Number.isFinite(numericRoomId)) return;

    try {
      const response = await getChatRooms();
      const currentRoom = response.data.find(
        (room) => room.roomId === numericRoomId,
      );

      if (currentRoom) {
        setRoomInfo(currentRoom);
      }
    } catch (error: any) {
      console.log(
        "채팅방 정보 조회 실패:",
        error.response?.data || error.message,
      );
    }
  }, [numericRoomId]);

  const fetchProductInfo = useCallback(async () => {
    const numericReferenceId = Number(effectiveReferenceId);

    if (!Number.isFinite(numericReferenceId)) {
      return;
    }

    try {
      if (effectiveReferenceType === "COMPANION") {
        const response = await getCompanionPostDetail(numericReferenceId);
        const item = response.data.data;
        setProductInfo({
          title: item.title,
          price: `${item.country} · ${item.region}`,
          thumbnail: "",
        });
        return;
      }
      if (effectiveReferenceType === "TRADE") {
        const response = await getUsedItemDetail(numericReferenceId);
        const item = response.data.data;

        setProductInfo({
          title: item.title,
          price: formatProductPrice(item.price),
          thumbnail: item.thumbnailImageUrl ?? "",
          sellerName: item.authorNickname || item.authorName,
        });
        return;
      }

      if (effectiveReferenceType === "TICKET") {
        const response = await getTicketDetail(numericReferenceId);
        const item = response.data.data;
        const currencyUnit = await getTicketCurrency(item.id);

        setProductInfo({
          title: item.title,
          price: formatProductPrice(item.transferPrice, currencyUnit || "€"),
          thumbnail: "",
          sellerName: item.authorNickname || item.authorName,
        });
      }
    } catch (error: any) {
      console.log(
        "채팅 게시글 조회 실패:",
        error.response?.data || error.message,
      );
    }
  }, [effectiveReferenceId, effectiveReferenceType]);

  const fetchMessages = useCallback(async () => {
    if (!Number.isFinite(numericRoomId)) return;

    try {
      const response = await getChatMessages(numericRoomId);
      const payload = response.data;
      const rawMessages = Array.isArray(payload)
        ? payload
        : (payload?.content ?? []);

      setMessages(sortMessagesByTime(rawMessages.map(normalizeMessage)));
      readChatRoom(numericRoomId).catch((error: any) => {
        console.log(
          "채팅방 읽음 처리 실패:",
          error.response?.data || error.message,
        );
      });
    } catch (error: any) {
      console.log("메시지 조회 실패:", error.response?.data || error.message);
    }
  }, [numericRoomId]);

  useFocusEffect(
    useCallback(() => {
      fetchCurrentMember();
      fetchRoomInfo();
      fetchMessages();

      // const messageTimer = setInterval(fetchMessages, 2500);
      // 웹소켓으로 교체
      let client: ReturnType<typeof createChatSocket> | null = null;

      const connectChatSocket = async () => {
        try {
          console.log("[Chat][WebSocket] 연결 시작:", numericRoomId);
          await getValidAccessToken();
          client = createChatSocket(getValidAccessToken);
          client.onConnect = () => {
            console.log("[Chat][WebSocket] STOMP 연결 성공:", numericRoomId);
            const subscription = subscribeChatRoom(
              client!,
              numericRoomId,
              (message) => {
                console.log("[Chat][WebSocket] 메시지 수신:", {
                  roomId: numericRoomId,
                  messageId: message.id,
                });
                setMessages((prev) =>
                  mergeMessagesById(prev, [normalizeMessage(message)]),
                );
                void readChatRoom(numericRoomId).catch((error: any) => {
                  console.log(
                    "채팅방 읽음 처리 실패:",
                    error.response?.data || error.message,
                  );
                });
              },
            );
            console.log("[Chat][WebSocket] 채팅방 구독 완료:", numericRoomId);

            client!.onDisconnect = () => subscription.unsubscribe();
          };
          client.onStompError = (frame) => {
            console.log("[Chat][WebSocket] STOMP 오류:", {
              roomId: numericRoomId,
              message: frame.headers.message,
              body: frame.body,
            });
          };
          client.onWebSocketError = (event) => {
            console.log("[Chat][WebSocket] 소켓 오류:", {
              roomId: numericRoomId,
              event,
            });
          };
          client.onWebSocketClose = (event) => {
            console.log("[Chat] 소켓 종료:", {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
            });
          };
          client.activate();
          console.log("[Chat][WebSocket] activate 호출 완료:", numericRoomId);
        } catch (error: any) {
          console.log("[Chat][WebSocket] 연결 실패:", {
            roomId: numericRoomId,
            message: error.message,
          });
        }
      };

      void connectChatSocket();
      // const roomTimer = setInterval(fetchRoomInfo, 7000);

      return () => {
        if (client) {
          console.log("[Chat][WebSocket] 연결 종료:", numericRoomId);
          void client.deactivate();
        }
        // clearInterval(messageTimer);
        // clearInterval(roomTimer);
      };
    }, [fetchCurrentMember, fetchMessages, fetchRoomInfo, numericRoomId]),
  );

  useEffect(() => {
    fetchProductInfo();
  }, [fetchProductInfo]);

  const handleSend = async () => {
    const text = message.trim();

    if (!text || sending || !Number.isFinite(numericRoomId)) return;

    try {
      setSending(true);
      const response = await sendChatMessage(numericRoomId, text);

      setMessages((prev) =>
        mergeMessagesById(prev, [normalizeMessage(response.data)]),
      );
      setMessage("");
      setTimeout(fetchMessages, 250);
    } catch (error: any) {
      console.log("메시지 전송 실패:", error.response?.data || error.message);
      showAlert(
        "메시지 전송 실패",
        error.response?.data?.message ?? "잠시 후 다시 시도해주세요.",
      );
    } finally {
      setSending(false);
    }
  };

  const submitReport = async (reason: ReportReason) => {
    if (reporting) return;

    const numericReferenceId = Number(effectiveReferenceId);
    const target =
      effectiveReferenceType === "TICKET" && Number.isFinite(numericReferenceId)
        ? {
            targetType: "TICKET_TRANSFER" as const,
            targetId: numericReferenceId,
          }
        : effectiveReferenceType === "TRADE" &&
            Number.isFinite(numericReferenceId)
          ? {
              targetType: "USED_ITEM" as const,
              targetId: numericReferenceId,
            }
          : effectiveOpponentMemberId
            ? {
                targetType: "MEMBER" as const,
                targetId: effectiveOpponentMemberId,
              }
            : null;

    if (!target) {
      showAlert(
        "신고할 수 없어요",
        "신고 대상 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
      );
      return;
    }

    try {
      setReporting(true);
      await createReport({
        ...target,
        reason,
        detail: `채팅방 #${roomId}에서 신고된 대화입니다.`,
      });
      showAlert("신고 접수", "운영팀이 대화 내용을 확인할게요.");
    } catch (error: any) {
      console.log("신고 접수 실패:", error.response?.data || error.message);
      showAlert(
        "신고 실패",
        error.response?.data?.message ?? "잠시 후 다시 시도해주세요.",
      );
    } finally {
      setReporting(false);
    }
  };

  const handleReport = () => {
    setMenuVisible(false);

    setReportVisible(true);
  };

  const handleGoToContent = () => {
    setMenuVisible(false);
    if (effectiveReferenceType === "COMPANION" && effectiveReferenceId) {
      router.push({
        pathname: "/community-detail",
        params: { type: "companion", id: effectiveReferenceId },
      });
      return;
    }
    if (effectiveReferenceType === "TRADE" && effectiveReferenceId) {
      router.push({
        pathname: "/market/[id]",
        params: {
          id: effectiveReferenceId,
          fromChatRoom: "true",
          chatRoomId: roomId,
          chatTitle: productTitle,
          chatPrice: productPrice,
          chatThumbnail: productThumbnail,
          chatSellerName: displaySellerName,
          chatReferenceType: effectiveReferenceType,
          chatReferenceId: effectiveReferenceId,
        },
      } as any);
    } else {
      setContentErrorVisible(true);
    }
  };

  const handleLeaveRoom = () => {
    setMenuVisible(false);
    setLeaveRoomConfirmationVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerSide}>
          <AppBackButton style={styles.backButton} />
        </View>

        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {productTitle}
          </Text>
        </View>

        <Pressable
          style={styles.headerSide}
          onPress={() => setMenuVisible((prev) => !prev)}
        >
          <MenuIcon />
        </Pressable>
      </View>

      {menuVisible && (
        <>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.chatMenuPopover}>
            {/* <ChatMenuRow
              icon="notifications-off-outline"
              title="채팅 알림 끄기"
              onPress={() => {
                setMenuVisible(false);
                showAlert("알림 설정", "이 채팅방 알림을 껐어요.");
              }}
            /> */}
            {/* <ChatMenuRow
              icon="flag-outline"
              title={reporting ? "신고 접수 중..." : "신고하기"}
              onPress={handleReport}
            /> */}
            <ChatMenuRow
              icon={<SendGrayIcon />}
              title="본문 바로가기"
              onPress={handleGoToContent}
            />
            <ChatMenuRow
              icon={<ExitIcon />}
              title="채팅방 나가기"
              onPress={handleLeaveRoom}
            />
          </View>
        </>
      )}

      {/* <Pressable
        style={styles.productCard}
        onPress={() => {
          if (effectiveReferenceType === "COMPANION" && effectiveReferenceId) {
            router.push({
              pathname: "/community-detail",
              params: { type: "companion", id: effectiveReferenceId },
            });
            return;
          }
          if (effectiveReferenceType === "TRADE" && effectiveReferenceId) {
            router.push({
              pathname: "/market/[id]",
              params: {
                id: effectiveReferenceId,
                fromChatRoom: "true",
                chatRoomId: roomId,
                chatTitle: productTitle,
                chatPrice: productPrice,
                chatThumbnail: productThumbnail,
                chatSellerName: displaySellerName,
                chatReferenceType: effectiveReferenceType,
                chatReferenceId: effectiveReferenceId,
              },
            } as any);
            return;
          }

          if (effectiveReferenceType === "TICKET" && effectiveReferenceId) {
            router.push({
              pathname: "/market/ticket-preview",
              params: {
                id: effectiveReferenceId,
                fromChatRoom: "true",
                chatRoomId: roomId,
                chatTitle: productTitle,
                chatPrice: productPrice,
                chatThumbnail: productThumbnail,
                chatSellerName: displaySellerName,
                chatReferenceType: effectiveReferenceType,
                chatReferenceId: effectiveReferenceId,
              },
            } as any);
          }
        }}
      > */}
      {/* <View style={styles.thumbnail}>
          {effectiveReferenceType === "COMPANION" && (
            <Ionicons name="people-outline" size={28} color={BLUE} />
          )}
          {!!productThumbnail && (
            <Image
              source={{ uri: productThumbnail }}
              style={styles.thumbnailImage}
            />
          )}
        </View> */}
      {/* 
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {productTitle}
          </Text>
          <Text style={styles.productPrice}>
            {effectiveReferenceType === "COMPANION"
              ? productInfo?.price || "동행 모집글 보기"
              : productPrice}
          </Text>
        </View> */}
      {/* </Pressable> */}

      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
        onLayout={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyBox}>
            <Image
              source={require("../../assets/images/school_icon.png")}
              style={styles.logo}
            />
            <Text style={styles.emptyText}>
              대화는 유니로드 채팅방에서 하는 것이 안전해요.{"\n"}
              {effectiveReferenceType === "COMPANION"
                ? "동행할 분에게 인사로 대화를 시작해보세요."
                : "교환학생 선배에게 인사로 대화를 시작해보세요."}
            </Text>
          </View>
        ) : (
          <View style={styles.messageList}>
            {messages.map((item, index) => {
              const isMine =
                item.senderId === "me" || item.senderId === currentMemberId;
              const previous = messages[index - 1];
              const startsGroup = !isSameMessageGroup(previous, item);
              const endsGroup = !isSameMessageGroup(item, messages[index + 1]);
              const showDate = !!messageDateKey(item.createdAt) &&
                (!previous || messageDateKey(previous.createdAt) !== messageDateKey(item.createdAt));

              return (
                <View key={item.id}>
                  {showDate && (
                    <View style={styles.dateRow}>
                      <View style={styles.dateChip}>
                        <Text style={styles.dateText}>{formatMessageDate(item.createdAt)}</Text>
                      </View>
                    </View>
                  )}
                  <View
                    style={[
                      styles.messageRow,
                      isMine ? styles.myMessageRow : styles.otherMessageRow,
                      index > 0 && !showDate && { marginTop: startsGroup ? 20 : 6 },
                    ]}
                  >
                    {!isMine && (
                      <View style={styles.avatarSlot}>
                        {startsGroup && <View style={styles.opponentAvatar} />}
                      </View>
                    )}
                    <View style={isMine ? styles.myMessageContent : styles.otherMessageContent}>
                      {!isMine && startsGroup && (
                        <Text style={styles.opponentName}>{displaySellerName}</Text>
                      )}
                      <View style={[styles.bubbleRow, isMine && styles.myMessageRow]}>
                        {isMine && (
                          <View style={styles.messageMetaBox}>
                            <Text style={styles.readStatus}>{getReadStatus(item)}</Text>
                            {endsGroup && (
                              <Text style={styles.messageTime}>{formatMessageTime(item.createdAt)}</Text>
                            )}
                          </View>
                        )}
                        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.otherBubble]}>
                          <Text style={styles.messageText}>{item.message}</Text>
                        </View>
                        {!isMine && endsGroup && (
                          <Text style={styles.messageTime}>{formatMessageTime(item.createdAt)}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <View style={styles.bottomArea}>
          {attachedPhotos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.attachedPhotos}
            >
              {attachedPhotos.map((uri, index) => (
                <View key={`${uri}-${index}`}>
                  <Image source={{ uri }} style={styles.attachedPhoto} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${index + 1}번째 첨부 이미지 삭제`}
                    style={styles.removePhoto}
                    onPress={() =>
                      setAttachedPhotos((photos) =>
                        photos.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <Ionicons name="close" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
          {/* <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickContent}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.quickBack}>
              <Text style={styles.quickBackText}>‹</Text>
            </Pressable>

            {["안녕하세요", "관심 있어서 문의 드려요.", "구매 가능할까요?"].map(
              (text) => (
                <Pressable
                  key={text}
                  style={styles.quickChip}
                  onPress={() => setMessage(text)}
                >
                  <Text style={styles.quickText}>{text}</Text>
                </Pressable>
              ),
            )}
          </ScrollView> */}

          <View style={styles.inputBox}>
            <Pressable
              style={styles.plusButton}
              accessibilityRole="button"
              accessibilityLabel="이미지 첨부"
              onPress={() => {
                if (attachedPhotos.length >= 10) {
                  showAlert(
                    "이미지 첨부",
                    "이미지는 최대 10장까지 첨부할 수 있어요.",
                  );
                  return;
                }
                Keyboard.dismiss();
                setMenuVisible(false);
                setPhotoSheetVisible(true);
              }}
            >
              <PlusCircleIcon />
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder="메시지 입력"
              placeholderTextColor={Colors.gray[6]}
              value={message}
              onChangeText={setMessage}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <Pressable style={styles.sendButton} onPress={handleSend}>
              <SendIcon />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
      <PhotoPickerSheet
        visible={photoSheetVisible}
        onClose={() => setPhotoSheetVisible(false)}
        remaining={10 - attachedPhotos.length}
        onSelect={(photos) =>
          setAttachedPhotos((current) => [...current, ...photos].slice(0, 10))
        }
      />
      <AppModal
        isOpen={contentErrorVisible}
        onClose={() => setContentErrorVisible(false)}
        title="본문 이동 실패"
        description="본문 정보를 불러오지 못했어요."
        primaryButton={{
          label: "확인",
          onPress: () => setContentErrorVisible(false),
        }}
      />
      <AppModal
        isOpen={leaveRoomConfirmationVisible}
        onClose={() => setLeaveRoomConfirmationVisible(false)}
        title="채팅방을 나가시겠습니까?"
        description={`채팅방을 나간 후에는 복구가 불가능합니다.\n단, 신고가 접수된 경우에는 채팅 기록을 복원하여 활용할 수 있습니다.`}
        secondaryButton={{
          label: "취소",
          onPress: () => setLeaveRoomConfirmationVisible(false),
        }}
        primaryButton={{
          label: "확인했어요",
          onPress: async () => {
            setLeaveRoomConfirmationVisible(false);
            try {
              await leaveChatRoom(numericRoomId);
              router.back();
            } catch (error: any) {
              console.log(
                "채팅방 나가기 실패:",
                error.response?.data || error.message,
              );
              showAlert(
                "채팅방을 나가지 못했어요",
                error.response?.data?.message ?? "잠시 후 다시 시도해주세요.",
              );
            }
          },
        }}
      />
      <AppModal
        isOpen={reportVisible}
        onClose={() => setReportVisible(false)}
        title="신고하기"
        description="신고 사유를 선택해주세요."
        secondaryButton={{
          label: "취소",
          onPress: () => setReportVisible(false),
        }}
      >
        {REPORT_OPTIONS.map((option) => (
          <Pressable
            key={option.reason}
            accessibilityRole="button"
            style={{ paddingVertical: 12 }}
            onPress={() => {
              setReportVisible(false);
              submitReport(option.reason);
            }}
          >
            <Text style={fonts.body1_m_16}>{option.label}</Text>
          </Pressable>
        ))}
      </AppModal>
      {alertElement}
    </SafeAreaView>
  );
}

function ChatMenuRow({
  icon,
  title,
  onPress,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable style={styles.chatMenuRow} onPress={onPress}>
      {icon}
      <Text style={{ ...fonts.body2_m_14, color: "#141416" }}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  attachedPhotos: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  attachedPhoto: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removePhoto: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00000088",
    alignItems: "center",
    justifyContent: "center",
  },
  plusButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 1000,
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F6F8FA",
  },

  headerSide: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  backButton: {
    backgroundColor: "transparent",
  },

  nameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  name: {
    ...fonts.sub3_sb_16,
    letterSpacing: 0,
    color: Colors.gray[11],
  },

  badgeIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    marginLeft: 6,
    marginTop: 2,
  },

  menuIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },

  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8,
  },

  chatMenuPopover: {
    position: "absolute",
    top: 120,
    right: 18,
    width: 178,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E7ECF3",
    elevation: 8,
    zIndex: 9,
  },

  chatMenuRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    gap: 10,
  },

  chatMenuText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111111",
  },

  chatMenuDangerText: {
    color: "#E5484D",
  },

  productCard: {
    height: 102,
    marginHorizontal: 15,
    marginTop: 20,
    backgroundColor: "#FAFAFA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
  },

  thumbnail: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: "#9B9B9B",
    marginRight: 22,
    overflow: "hidden",
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  productInfo: {
    flex: 1,
  },

  productTitle: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: "900",
    color: "#111111",
    marginBottom: 5,
  },

  productPrice: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
  },

  chatScroll: {
    flex: 1,
  },

  chatContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingTop: 18,
    paddingBottom: 18,
  },

  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 70,
  },

  logo: {
    width: 42,
    height: 42,
    resizeMode: "contain",
    marginBottom: 36,
  },

  emptyText: {
    fontSize: 18,
    lineHeight: 34,
    color: "#666666",
    fontWeight: "700",
    textAlign: "center",
  },

  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  dateRow: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },

  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 1000,
    backgroundColor: Colors.gray[2],
  },

  dateText: {
    ...fonts.caption5_r_13,
    color: Colors.gray[7],
  },

  avatarSlot: {
    width: 40,
    alignSelf: "stretch",
  },

  opponentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.gray[3],
  },

  opponentName: {
    ...fonts.caption5_r_13,
    color: Colors.gray[8],
    marginBottom: 6,
  },

  myMessageContent: {
    maxWidth: "100%",
    flexShrink: 1,
  },

  otherMessageContent: {
    flex: 1,
    minWidth: 0,
  },

  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  myMessageRow: {
    justifyContent: "flex-end",
  },

  otherMessageRow: {
    justifyContent: "flex-start",
  },

  messageBubble: {
    flexShrink: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  myBubble: {
    maxWidth: 280,
    alignSelf: "flex-end",
    backgroundColor: "#FFFFFF",
  },

  otherBubble: {
    maxWidth: 232,
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
  },

  messageText: {
    ...fonts.body4_r_14,
    color: "#070A0D",
  },

  otherMessageText: {
    color: "#111111",
  },

  messageMetaBox: {
    alignItems: "flex-end",
    marginBottom: 2,
  },

  readStatus: {
    ...fonts.caption6_r_12,
    color: Colors.primary.default,
  },

  messageTime: {
    ...fonts.caption6_r_12,
    color: Colors.gray[5],
    marginBottom: 2,
  },

  bottomArea: {
    backgroundColor: "#F6F8FA",
    paddingBottom: 24,
  },

  quickContent: {
    paddingLeft: 18,
    paddingRight: 18,
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
  },

  quickBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F6F6F6",
    alignItems: "center",
    justifyContent: "center",
  },

  quickBackText: {
    fontSize: 26,
    lineHeight: 28,
    color: "#555555",
  },

  quickChip: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  quickText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#555555",
  },

  inputRow: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  plusIcon: {
    width: 25,
    height: 25,
    resizeMode: "contain",
  },

  inputBox: {
    height: 48,
    borderRadius: 1000,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 12,
  },

  input: {
    flex: 1,
    ...fonts.body4_r_14,
    color: "#111111",
    paddingVertical: 0,
  },

  emojiButton: {
    width: 30,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
    marginRight: 3,
  },

  emojiIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },

  sendButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  sendIcon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },

  sendingIcon: {
    opacity: 0.45,
  },
});
