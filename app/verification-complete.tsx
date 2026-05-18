import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

export default function VerificationCompletePage() {
  return (
    <View style={styles.container}>
      <View style={styles.centerArea}>
        <Image
          source={require('../assets/images/school_icon.png')}
          style={styles.logo}
        />

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

const BLUE = '#102BE0';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },

  centerArea: {
    alignItems: 'center',
    marginTop: 300,
  },

  logo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginBottom: 20,
  },

  badge: {
    width: '100%',
    height: 39,
    borderRadius: 4,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 42,
  },

  badgeText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
  },

  title: {
    fontSize: 25,
    lineHeight: 38,
    fontWeight: '900',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 42,
  },

  subtitle: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },

  button: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 64,
    height: 53,
    borderRadius: 5,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
