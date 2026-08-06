import { SoftServiceIcon } from '@/components/soft-service-icon';
import { AppBackButton } from '@/components/ui/app-back-button';
import { router } from 'expo-router';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const NAVY = '#18202B';
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 10;
const CONTENT_PADDING = 16;
const SERVICE_CARD_WIDTH =
  (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP) / 2;

const serviceGroups = [
  {
    title: '정보',
    items: [
      {
        title: '파견교 정보',
        icon: 'school-outline',
        route: '/home/school-info',
      },
      {
        title: '장학금 정보',
        icon: 'ribbon-outline',
        route: '/home/scholarship-info',
      },
      {
        title: '국가별 출국 가이드',
        icon: 'document-text-outline',
        route: '/home/visa-guide',
      },
      {
        title: '지원 기준',
        icon: 'business-outline',
        route: '/home/my-school-info',
      },
    ],
  },
  {
    title: '거래',
    items: [
      {
        title: '중고 구매',
        icon: 'cart-outline',
        route: '/market',
      },
      {
        title: '티켓 양도',
        icon: 'ticket-outline',
        route: {
          pathname: '/market',
          params: { tab: 'ticket' },
        },
      },
    ],
  },
  {
    title: '활동',
    items: [
      {
        title: '커뮤니티',
        icon: 'chatbubbles-outline',
        route: '/community',
      },
      {
        title: '동행 구하기',
        icon: 'people-outline',
        route: {
          pathname: '/community',
          params: { tab: 'companion' },
        },
      },
      {
        title: '지출 관리',
        icon: 'wallet-outline',
        route: {
          pathname: '/mypage',
          params: { fromService: 'true' },
        },
      },
      {
        title: '나의 출국 준비',
        icon: 'checkmark-done-outline',
        route: '/home/departure-checklist',
      },
    ],
  },
] as const;

export default function MoreMenuScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />

        <Text style={styles.headerTitle}>전체 서비스</Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {serviceGroups.map((group) => (
          <View key={group.title} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{group.title}</Text>

            <View style={styles.groupGrid}>
              {group.items.map((item) => (
                <TouchableOpacity
                  key={item.title}
                  style={styles.serviceCard}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.86}
                >
                  <SoftServiceIcon
                    name={item.icon}
                    iconSize={23}
                    borderRadius={14}
                    style={styles.serviceIconBox}
                  />
                  <Text style={styles.serviceTitle}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
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
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 16,
    paddingBottom: 104,
  },
  groupSection: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 9,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: CARD_GAP,
    rowGap: CARD_GAP,
  },
  serviceCard: {
    width: SERVICE_CARD_WIDTH,
    minHeight: 86,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  serviceIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  serviceTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: NAVY,
    textAlign: 'center',
    lineHeight: 17,
  },
});
