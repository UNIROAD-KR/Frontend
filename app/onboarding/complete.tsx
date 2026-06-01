import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CompletePage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const displayName = nickname || 'OO';

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹</Text>
      </Pressable>

      <View style={styles.centerArea}>
        <Image
          source={require('../../assets/images/school_icon.png')}
          style={styles.logo}
        />

        <View style={styles.badge}>
          <Text style={styles.badgeText}>준비 완료!</Text>
        </View>

        <Text style={styles.title}>
          이제 유니로드와 함께{'\n'}교환 생활을 시작해봐요
        </Text>

        <Text style={styles.subtitle}>
          {displayName} 님의 파견지 정보를 바탕으로 딱 맞는 정보를 준비했어요
        </Text>
      </View>

      <Pressable
        style={styles.startButton}
        onPress={async () => {
          try {
            const birthYearStr = await AsyncStorage.getItem('birthYear');
            const domesticUniversity = await AsyncStorage.getItem('university') || '';
            const dispatchedUniversity = await AsyncStorage.getItem('dispatchedUniversity') || '';
            const dispatchedCountry = await AsyncStorage.getItem('dispatchedCountry') || '';
            const dispatchedRegion = await AsyncStorage.getItem('dispatchedRegion') || '';

            // 나이 계산 로직 (출생년도 기반, 예시: 현재연도 - 출생년도 + 1)
            const currentYear = new Date().getFullYear();
            const age = birthYearStr ? currentYear - parseInt(birthYearStr, 10) + 1 : 20;

            // auth.ts의 onboarding API 호출을 동적으로 가져옵니다 (상단 import 추가 필요시 활용)
            const { onboarding } = await import('../../src/api/auth');

            await onboarding({
              age,
              domesticUniversity,
              dispatchedUniversity,
              dispatchedCountry,
              dispatchedRegion,
            });

            await AsyncStorage.setItem('nickname', displayName);
            router.replace('/home');
          } catch (error: any) {
            console.log('온보딩 정보 전송 실패:', error.response?.data || error.message);
            // 에러 처리: Alert 또는 그냥 진행
            // router.replace('/home');
          }
        }}
      >
        <Text style={styles.startButtonText}>시작하기</Text>
      </Pressable>
    </View>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingTop: 52,
  },

  back: {
    fontSize: 30,
    lineHeight: 32,
    color: '#000',
  },

  centerArea: {
    alignItems: 'center',
    marginTop: 155,
  },

  logo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginBottom: 18,
  },

  badge: {
    width: '100%',
    height: 32,
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
  },

  badgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },

  title: {
    fontSize: 22,
    lineHeight: 33,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    marginBottom: 40,
  },

  subtitle: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
  },

  startButton: {
    position: 'absolute',
    left: 30,
    right: 30,
    bottom: 48,
    height: 52,
    borderRadius: 5,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
