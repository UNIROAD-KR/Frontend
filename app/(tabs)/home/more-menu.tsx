import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const NAVY = '#0F2042';
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const CONTENT_PADDING = 22;
const SERVICE_CARD_WIDTH =
  (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_GAP) / 2;

const serviceGroups = [
  {
    title: '정보',
    items: [
      {
        title: '파견교 정보',
        icon: 'school-outline',
        route: '/(tabs)/home/school-info',
      },
      {
        title: '장학금 정보',
        icon: 'ribbon-outline',
        route: '/(tabs)/home/scholarship-info',
      },
      {
        title: '비자 가이드',
        icon: 'document-text-outline',
        route: '/(tabs)/home/visa-guide',
      },
      {
        title: '지원 기준',
        icon: 'business-outline',
        route: '/(tabs)/home/my-school-info',
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
        route: '/market/ticket-preview',
      },
    ],
  },
  {
    title: '활동',
    items: [
      {
        title: '동행 구하기',
        icon: 'people-outline',
        route: '/(tabs)/community',
      },
      {
        title: '지출 관리',
        icon: 'wallet-outline',
        route: '/(tabs)/mypage',
      },
      {
        title: '체크리스트',
        icon: 'checkmark-done-outline',
        route: '/(tabs)/home/departure-checklist',
      },
    ],
  },
] as const;

export default function MoreMenuScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={NAVY} />
        </TouchableOpacity>

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
                  <View style={styles.serviceIconBox}>
                    <Ionicons name={item.icon} size={23} color={NAVY} />
                  </View>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 18,
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
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 130,
  },
  groupSection: {
    marginBottom: 30,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 14,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: 12,
    rowGap: 12,
  },
  serviceCard: {
    width: SERVICE_CARD_WIDTH,
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 14,
    shadowColor: NAVY,
    shadowOpacity: 0.015,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  serviceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F6F8FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },
  serviceTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: NAVY,
    textAlign: 'center',
    lineHeight: 17,
  },
});
