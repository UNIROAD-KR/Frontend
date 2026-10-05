import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  AppState,
  DeviceEventEmitter,
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
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HeaderProvider() {
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
        <LogoIcon height="24" />
        <View style={styles.headerRight}>
          <TouchableOpacity
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
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/profile-card" as any)}
            activeOpacity={0.82}
          >
            <SearchIcon />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/profile-card" as any)}
            activeOpacity={0.82}
          >
            <PersonIcon />
          </TouchableOpacity>
        </View>
      </View>
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
