import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { PRIVACY_CONSENT } from '../../../constants/legal';

const NAVY = '#18202B';
const MUTED = '#7A8491';
const LINE = '#E3E7EC';

function renderLegalText(content: string) {
  return content.split('\n').map((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return <View key={`space-${index}`} style={styles.textGap} />;
    }

    const isSectionHeading =
      trimmedLine.startsWith('■') || /^제\d+조/.test(trimmedLine);

    return (
      <Text
        key={`${trimmedLine}-${index}`}
        style={[
          styles.sectionBody,
          isSectionHeading ? styles.legalSectionHeading : null,
        ]}
      >
        {line}
      </Text>
    );
  });
}

export default function PrivacyPolicyScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>개인정보 처리방침</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          {renderLegalText(PRIVACY_CONSENT)}
        </View>
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 104,
  },
  section: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LINE,
    padding: 15,
    marginBottom: 14,
  },
  sectionBody: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '700',
    color: MUTED,
  },
  legalSectionHeading: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '900',
    color: NAVY,
  },
  textGap: {
    height: 10,
  },
});
