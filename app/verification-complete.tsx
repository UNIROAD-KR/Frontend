import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';

export default function VerificationCompletePage() {
  return (
    <View style={styles.container}>
      <AppBackButton fallbackHref="/home" style={styles.backButton} />

      <View style={styles.centerArea}>
        <View style={styles.iconBox}>
          <Ionicons name="checkmark" size={28} color="#FFFFFF" />
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>제출 완료!</Text>
        </View>

        <Text style={styles.title}>
          검토가 완료되면{'\n'}알림으로 알려드릴게요 !
        </Text>

        <Text style={styles.subtitle}>그동안 유니로드를 둘러볼까요?</Text>
      </View>

      <Pressable style={styles.button} onPress={() => router.replace('/home')}>
        <Text style={styles.buttonText}>유니로드 둘러보기</Text>
      </Pressable>
    </View>
  );
}

const BLUE = '#3568DA';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    paddingHorizontal: 24,
  },

  backButton: {
    position: 'absolute',
    top: 44,
    left: 16,
    zIndex: 10,
  },

  centerArea: {
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  badge: {
    borderRadius: 5,
    backgroundColor: '#EAF0FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: BLUE,
  },

  title: {
    fontSize: 22,
    lineHeight: 31,
    fontWeight: '900',
    color: '#18202B',
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 12,
    color: '#7A8491',
    textAlign: 'center',
  },

  button: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 30,
    height: 50,
    borderRadius: 7,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
