import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <AppBackButton fallbackHref="/home" style={styles.backButton} />
      <ThemedText type="title">This is a modal</ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 54,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F6F8FC',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
