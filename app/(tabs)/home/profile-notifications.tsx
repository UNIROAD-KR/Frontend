import { Text } from "@/components/ui/app-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ProfileScreenHeader } from "@/components/ui/profile-screen-header";
import {
  getNotificationSettings,
  NotificationCategory,
  updateNotificationCategoryEnabled,
} from "@/src/api/notifications";
import { NOTIFICATION_SETTINGS_STORAGE_KEY } from "@/src/notifications/push";
import { fonts, Colors } from "@/constants/theme";
import ChatIcon from "@/assets/icon/chat.svg";
import ShopIcon from "@/assets/icon/shop.svg";
import PeopleIcon from "@/assets/icon/people-line.svg";
import CalendarIcon from "@/assets/icon/calendar.svg";
import NoticeIcon from "@/assets/icon/notice.svg";

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
  icon: React.ReactNode;
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
    description: "거래 알림과 동행 채팅 알림",
    icon: <ChatIcon width={24} height={24} color={Colors.gray[9]} />,
  },
  {
    key: "market",
    title: "중고마켓 알림",
    description: "저장한 거래글, 가격 문의, 거래 상태 알림",
    icon: <ShopIcon width={24} height={24} color={Colors.gray[9]} />,
  },
  {
    key: "community",
    title: "커뮤니티 알림",
    description: "내 게시글에 달린 댓글과 답글 알림",
    icon: <PeopleIcon width={24} height={24} color={Colors.gray[9]} />,
  },
  {
    key: "schedule",
    title: "출국 준비 알림",
    description: "체크리스트 마감일 및 준비 일정 알림",
    icon: <CalendarIcon width={24} height={24} color={Colors.gray[9]} />,
  },
  {
    key: "notice",
    title: "공지 알림",
    description: "서비스 공지 및 운영 알림",
    icon: <NoticeIcon width={24} height={24} color={Colors.gray[9]} />,
  },
];

export default function ProfileNotificationsScreen() {
  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings);
  const [allEnabled, setAllEnabled] = useState(true);

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
      <ProfileScreenHeader title="알림 설정" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          {notificationItems.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="switch"
              accessibilityState={{
                checked: settings[item.key],
                disabled: !allEnabled,
              }}
              disabled={!allEnabled}
              style={[styles.row, !allEnabled && styles.rowDisabled]}
              onPress={() => toggleSetting(item.key)}
            >
              {item.icon}

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
    backgroundColor: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionCard: {
    marginTop: 0,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.gray[3],
    overflow: "hidden",
    gap: 4,
    padding: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    padding: 16,
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
    gap: 6,
  },
  rowTitle: {
    ...fonts.sub3_sb_16,
    color: "#000000",
  },
  rowDesc: {
    ...fonts.caption3_m_13,
    color: Colors.gray[7],
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
    backgroundColor: Colors.primary.default,
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
