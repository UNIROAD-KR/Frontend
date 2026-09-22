import { Text } from '@/components/ui/app-text';
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppBackButton } from "@/components/ui/app-back-button";
import {
  getNotificationSettings,
  NotificationCategory,
  updateAllNotificationsEnabled,
  updateNotificationCategoryEnabled,
} from "@/src/api/notifications";
import {
  disableDevicePushNotifications,
  NOTIFICATION_SETTINGS_STORAGE_KEY,
  registerDeviceForPushNotifications,
  requestNotificationPermission,
} from "@/src/notifications/push";

const NAVY = "#0F2042";
const BLUE = "#2F66D0";
const INK = "#111111";
const MUTED = "#64748B";
const STORAGE_KEY = NOTIFICATION_SETTINGS_STORAGE_KEY;
const MASTER_SETTING_KEY = "allEnabled";

type NotificationKey =
  | "market"
  | "community"
  | "chat"
  | "schedule"
  | "marketing"
  | "notice";

type NotificationSettings = Record<NotificationKey, boolean>;

const categoryByKey: Record<NotificationKey, NotificationCategory> = {
  chat: "CHAT",
  market: "MARKET",
  community: "COMMUNITY",
  schedule: "SCHEDULE",
  marketing: "MARKETING",
  notice: "NOTICE",
};

type NotificationItem = {
  key: NotificationKey;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const defaultSettings: NotificationSettings = {
  market: true,
  community: true,
  chat: true,
  schedule: true,
  marketing: false,
  notice: true,
};

const notificationItems: NotificationItem[] = [
  {
    key: "chat",
    title: "채팅 알림",
    description: "거래와 동행 채팅 메시지를 바로 받아요.",
    icon: "chatbubble-ellipses-outline",
  },
  {
    key: "market",
    title: "중고마켓 알림",
    description: "저장한 거래글, 가격 문의, 거래 상태를 알려드려요.",
    icon: "bag-handle-outline",
  },
  {
    key: "community",
    title: "커뮤니티 알림",
    description: "내 글의 댓글과 관심 게시판 소식을 받아요.",
    icon: "people-outline",
  },
  {
    key: "schedule",
    title: "출국 준비 알림",
    description: "체크리스트 마감일과 준비 일정을 놓치지 않게 도와드려요.",
    icon: "calendar-outline",
  },
  {
    key: "marketing",
    title: "혜택 및 이벤트",
    description: "교환학생에게 맞는 혜택과 새 소식을 선택적으로 받아요.",
    icon: "sparkles-outline",
  },
  {
    key: "notice",
    title: "공지 알림",
    description: "서비스 공지와 운영 안내를 받아요.",
    icon: "megaphone-outline",
  },
];

export default function ProfileNotificationsScreen() {
  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings);
  const [allEnabled, setAllEnabled] = useState(true);
  const [checkingPermission, setCheckingPermission] = useState(false);

  // 푸시 모듈(areNotificationsEnabled)이 참조하는 로컬 캐시를 최신 값으로 유지한다.
  const cacheSettings = async (
    nextSettings: NotificationSettings,
    nextAllEnabled: boolean,
  ) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...nextSettings,
          [MASTER_SETTING_KEY]: nextAllEnabled,
        }),
      );
    } catch (error) {
      console.log("알림 설정 캐시 저장 실패:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const loadLocalSettings = async () => {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (!raw) {
          return;
        }

        try {
          const savedSettings = JSON.parse(raw);
          setAllEnabled(savedSettings[MASTER_SETTING_KEY] ?? true);
          setSettings({ ...defaultSettings, ...savedSettings });
        } catch {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      };

      const loadSettings = async () => {
        try {
          const response = await getNotificationSettings();
          const serverSettings = response.data.data;

          console.log(
            "[Notifications][Settings] 서버 설정 조회 성공:",
            serverSettings,
          );

          setAllEnabled(serverSettings.allEnabled);
          setSettings({
            market: serverSettings.market,
            community: serverSettings.community,
            chat: serverSettings.chat,
            schedule: serverSettings.schedule,
            marketing: serverSettings.marketing,
            notice: serverSettings.notice,
          });
          await cacheSettings(serverSettings, serverSettings.allEnabled);
        } catch (error: any) {
          console.log(
            "알림 설정 조회 실패:",
            error.response?.data || error.message,
          );
          await loadLocalSettings();
        }
      };

      loadSettings();
    }, []),
  );

  const toggleAllNotifications = async () => {
    if (checkingPermission) {
      return;
    }

    if (allEnabled) {
      setCheckingPermission(true);
      try {
        console.log("[Notifications][Settings] 전체 알림 꺼기 요청");
        const response = await updateAllNotificationsEnabled(false);
        console.log("[Notifications][Settings] 전체 알림 꺼기 응답 성공:", {
          status: response.status,
          data: response.data,
        });
        await cacheSettings(settings, false);
        await disableDevicePushNotifications();
        setAllEnabled(false);
      } catch (error: any) {
        console.log(
          "[Notifications][Settings] 전체 알림 꺼기 실패:",
          error.response?.data || error.message,
        );
        Alert.alert(
          "알림 설정 실패",
          "전체 알림을 끄지 못했어요. 다시 시도해주세요.",
        );
      } finally {
        setCheckingPermission(false);
      }
      return;
    }

    setCheckingPermission(true);

    try {
      const permissionGranted = await requestNotificationPermission();

      if (!permissionGranted) {
        Alert.alert(
          "알림 권한이 필요해요",
          "유니로드에서 알림을 받으려면 설정에서 알림 권한을 허용해주세요.",
          [
            { text: "취소", style: "cancel" },
            { text: "설정 열기", onPress: () => void Linking.openSettings() },
          ],
        );
        return;
      }

      await updateAllNotificationsEnabled(true);
      console.log("[Notifications][Settings] 전체 알림 켜기 성공");
      setAllEnabled(true);
      await cacheSettings(settings, true);
      registerDeviceForPushNotifications({ force: true }).catch((error) => {
        console.log("FCM 토큰 재등록 실패:", error);
      });
    } catch (error: any) {
      console.log(
        "알림 권한 확인 실패:",
        error.response?.data || error.message,
      );
      Alert.alert("알림 설정 실패", "알림 권한을 확인하지 못했어요.");
    } finally {
      setCheckingPermission(false);
    }
  };

  const toggleSetting = (key: NotificationKey) => {
    if (!allEnabled) {
      return;
    }

    const previousValue = settings[key];
    const nextValue = !previousValue;
    const category = categoryByKey[key];
    const nextSettings = { ...settings, [key]: nextValue };

    setSettings(nextSettings);
    void cacheSettings(nextSettings, allEnabled);

    console.log("[Notifications][Settings] 카테고리 토글 요청:", {
      key,
      category,
      enabled: nextValue,
    });

    updateNotificationCategoryEnabled(category, nextValue)
      .then((response) => {
        console.log("[Notifications][Settings] 카테고리 토글 응답 성공:", {
          category,
          enabled: nextValue,
          status: response.status,
          data: response.data,
        });
      })
      .catch((error: any) => {
        console.log("[Notifications][Settings] 카테고리 토글 실패:", {
          category,
          enabled: nextValue,
          status: error.response?.status,
          data: error.response?.data || error.message,
        });
        setSettings(settings);
        void cacheSettings(settings, allEnabled);
        Alert.alert("알림 설정 실패", "설정을 저장하지 못했어요.");
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="switch"
          accessibilityState={{
            checked: allEnabled,
            disabled: checkingPermission,
          }}
          disabled={checkingPermission}
          onPress={toggleAllNotifications}
          style={styles.heroCard}
        >
          <View style={styles.heroIconBox}>
            <Ionicons name="notifications-outline" size={25} color={BLUE} />
          </View>

          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>전체 알림</Text>
          </View>

          <View
            style={[
              styles.switchTrack,
              allEnabled && styles.switchTrackActive,
              checkingPermission && styles.switchDisabled,
            ]}
          >
            <View
              style={[
                styles.switchThumb,
                allEnabled && styles.switchThumbActive,
              ]}
            />
          </View>
        </Pressable>

        <View style={styles.sectionCard}>
          {notificationItems.map((item, index) => (
            <Pressable
              key={item.key}
              accessibilityRole="switch"
              accessibilityState={{
                checked: settings[item.key],
                disabled: !allEnabled,
              }}
              disabled={!allEnabled}
              style={[
                styles.row,
                index < notificationItems.length - 1 && styles.divider,
                !allEnabled && styles.rowDisabled,
              ]}
              onPress={() => toggleSetting(item.key)}
            >
              <View style={styles.rowIconBox}>
                <Ionicons name={item.icon} size={21} color={NAVY} />
              </View>

              <View style={styles.rowTextBox}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              <View
                style={[
                  styles.switchTrack,
                  settings[item.key] && styles.switchTrackActive,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    settings[item.key] && styles.switchThumbActive,
                  ]}
                />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconBtn: {
    backgroundColor: "transparent",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: NAVY,
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 104,
  },
  heroCard: {
    minHeight: 106,
    borderRadius: 20,
    backgroundColor: "#F4F8FF",
    borderWidth: 1,
    borderColor: "#DCE7FF",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginBottom: 12,
  },
  heroIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextBox: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: INK,
  },
  heroDesc: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    color: MUTED,
  },
  sectionCard: {
    marginTop: 0,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E9EE",
    overflow: "hidden",
  },
  row: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  rowDisabled: {
    opacity: 0.42,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  rowIconBox: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowTextBox: {
    flex: 1,
    paddingRight: 12,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: INK,
  },
  rowDesc: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    color: MUTED,
  },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D7DDE7",
    padding: 3,
    justifyContent: "center",
  },
  switchTrackActive: {
    backgroundColor: "#4F63FF",
  },
  switchDisabled: {
    opacity: 0.55,
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
  },
  switchThumbActive: {
    transform: [{ translateX: 18 }],
  },
});
