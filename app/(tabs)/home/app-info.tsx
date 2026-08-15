import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

export default function AppInfoScreen() {
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>앱 버전</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.versionCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="phone-portrait-outline" size={30} color={BLUE} />
          </View>
          <Text style={styles.appName}>UNIROAD</Text>
          <Text style={styles.versionText}>버전 {version}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>서비스명</Text>
          <Text style={styles.infoValue}>유니로드</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>현재 상태</Text>
          <Text style={styles.infoValue}>최신 버전 확인 중</Text>
        </View>
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
    backgroundColor: SOFT,
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 130,
  },
  versionCard: {
    minHeight: 188,
    borderRadius: 20,
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#DCE7FF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appName: {
    fontSize: 22,
    fontWeight: '900',
    color: NAVY,
  },
  versionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '900',
    color: MUTED,
  },
  infoRow: {
    marginTop: 14,
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LINE,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: MUTED,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '900',
    color: NAVY,
  },
});
