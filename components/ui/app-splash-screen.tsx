import { Image, StyleSheet, View } from 'react-native';

const splashLogo = require('../../assets/images/uniroad-splash-logo.png');

export function AppSplashScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={splashLogo}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="유니로드"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F7F9',
  },
  logo: {
    width: 185,
    height: 62,
  },
});
