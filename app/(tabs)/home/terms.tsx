import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { TERMS_OF_SERVICE } from '../../../constants/legal';

const NAVY = '#0F2042';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

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

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>서비스 이용약관</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          {renderLegalText(TERMS_OF_SERVICE)}
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
    fontSize: 18,
    fontWeight: '900',
    color: NAVY,
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 130,
  },
  section: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    padding: 18,
    marginBottom: 14,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 22,
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
