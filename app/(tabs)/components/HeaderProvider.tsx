import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  AppState,
  DeviceEventEmitter,
  Pressable,
  useWindowDimensions,
  Platform,
  Alert,
} from "react-native";
import {
  getUnreadNotificationCount,
  NOTIFICATION_READ_EVENT,
  NOTIFICATION_RECEIVED_EVENT,
} from "@/src/api/notifications";
import LogoIcon from "../../../assets/icon/logo.svg";
import NotificationIcon from "../../../assets/icon/notification.svg";
import SearchIcon from "../../../assets/icon/search.svg";
import PersonIcon from "../../../assets/icon/person.svg";
import SettingIcon from "../../../assets/icon/setting.svg";
import SortGrayIcon from "../../../assets/icon/sort-gray.svg";
import SettingGrayIcon from "../../../assets/icon/setting-gray.svg";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/constants/theme";
import { SortSheet } from "@/components/ui/sort-sheet";
import { PopoverMenu } from "@/components/ui/popover-menu";
import { useChatListSettings } from "@/components/chat/chat-list-settings";

const chatSortOptions = [
  { value: "newest", label: "최신순" },
  { value: "unread", label: "안읽은 순" },
] as const;

export default function HeaderProvider({ isChat }: { isChat: boolean }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const pendingSort = useRef(false);
  const pendingManage = useRef(false);
  const { sortOrder, setSortOrder } = useChatListSettings();
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });
  const settingsRef = useRef<View>(null);
  const { width } = useWindowDimensions();
  useEffect(() => {
    setMenuVisible(false);
    setSortVisible(false);
    pendingSort.current = false;
    pendingManage.current = false;
  }, [isChat, width]);
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    if (__DEV__)
      console.log("[Notifications][Home] 화면 배지 상태:", unreadCount);
  }, [unreadCount]);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      let fetching = false;
      let pendingRefresh = false;
      const refreshUnreadCount = async () => {
        if (fetching || AppState.currentState !== "active") return;
        fetching = true;
        try {
          if (!(await AsyncStorage.getItem("accessToken"))) {
            if (__DEV__)
              console.log("[Notifications] 비로그인: 개수 조회 생략, 배지 0");
            if (active) setUnreadCount(0);
            return;
          }
          if (__DEV__)
            console.log("[Notifications] 읽지 않은 알림 개수 조회 요청");
          const response = await getUnreadNotificationCount();
          if (__DEV__)
            console.log(
              "[Notifications] 개수 조회 응답:",
              response.status,
              response.data,
            );
          const count = response.data.data.count;
          if (active) {
            setUnreadCount(count);
          }
        } catch (error: any) {
          console.log(
            "미확인 알림 개수 조회 실패:",
            error.response?.data || error.message,
          );
        } finally {
          fetching = false;
          if (active && pendingRefresh) {
            pendingRefresh = false;
            void refreshUnreadCount();
          }
        }
      };
      const requestRefresh = () => {
        if (fetching) pendingRefresh = true;
        else void refreshUnreadCount();
      };
      requestRefresh();
      const readSubscription = DeviceEventEmitter.addListener(
        NOTIFICATION_READ_EVENT,
        requestRefresh,
      );
      const pushSubscription = DeviceEventEmitter.addListener(
        NOTIFICATION_RECEIVED_EVENT,
        requestRefresh,
      );
      // 푸시가 꺼져 있거나 누락된 알림을 보완한다. 즉시 갱신은 수신 이벤트가 담당한다.
      const timer = setInterval(() => void refreshUnreadCount(), 60000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") requestRefresh();
      });
      return () => {
        active = false;
        clearInterval(timer);
        subscription.remove();
        readSubscription.remove();
        pushSubscription.remove();
      };
    }, []),
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, paddingHorizontal: 20 }}>
      <View style={styles.header}>
        {isChat ? (
          <Text style={{ ...fonts.title5_b_20, color: "#070A0D" }}>채팅</Text>
        ) : (
          <LogoIcon height="24" />
        )}
        {isChat ? (
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => router.push("/settings" as any)}>
              <SearchIcon />
            </TouchableOpacity>
            <Pressable
              ref={settingsRef}
              accessibilityRole="button"
              accessibilityLabel="채팅 목록 설정"
              accessibilityState={{ expanded: menuVisible }}
              onPress={() => {
                settingsRef.current?.measureInWindow(
                  (x, y, buttonWidth, height) => {
                    setMenuPosition({
                      top: y + height + 8,
                      right: Math.max(16, width - x - buttonWidth),
                    });
                    setMenuVisible(true);
                  },
                );
              }}
            >
              <SettingIcon />
            </Pressable>
          </View>
        ) : (
          <View style={styles.headerRight}>
            <Pressable
              accessibilityLabel={`알림, 읽지 않은 알림 ${unreadCount}개`}
              onPress={() => router.push("/notifications")}
            >
              <NotificationIcon />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge} pointerEvents="none">
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </Pressable>
            {/* <TouchableOpacity
              onPress={() => router.push("/profile-card" as any)}
              activeOpacity={0.82}
            >
              <SearchIcon />
            </TouchableOpacity> */}
            <Pressable onPress={() => router.push("/profile-card" as any)}>
              <PersonIcon />
            </Pressable>
          </View>
        )}
      </View>
      <PopoverMenu
        visible={isChat && menuVisible}
        position={menuPosition}
        width={126}
        accessibilityLabel="채팅 목록 설정 닫기"
        onClose={() => setMenuVisible(false)}
        onDismiss={() => {
          if (pendingManage.current) {
            pendingManage.current = false;
            router.push("/chat-management");
          }
          if (pendingSort.current) {
            pendingSort.current = false;
            setSortVisible(true);
          }
        }}
        items={[
          {
            label: "채팅방 정렬",
            icon: <SortGrayIcon width={16} height={16} />,
            onPress: () => {
              pendingSort.current = Platform.OS === "ios";
              if (Platform.OS !== "ios") setSortVisible(true);
            },
          },
          {
            label: "채팅방 관리",
            icon: <SettingGrayIcon width={16} height={16} />,
            onPress: () => {
              pendingManage.current = Platform.OS === "ios";
              if (Platform.OS !== "ios") router.push("/chat-management");
            },
          },
        ]}
      />
      <SortSheet
        visible={isChat && sortVisible}
        value={sortOrder}
        options={chatSortOptions}
        onClose={() => setSortVisible(false)}
        onSelect={(value) => {
          void setSortOrder(value).catch(() =>
            Alert.alert("정렬 저장 실패", "잠시 후 다시 시도해주세요."),
          );
          setSortVisible(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
});
