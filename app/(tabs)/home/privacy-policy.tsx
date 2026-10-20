import { Text } from "@/components/ui/app-text";
import { ScrollView, StyleSheet, View } from "react-native";

import { ProfileScreenHeader } from "@/components/ui/profile-screen-header";
import { PRIVACY_CONSENT } from "../../../constants/legal";
import { fonts, Colors } from "@/constants/theme";

const LINE = "#E3E7EC";

function renderLegalText(content: string) {
  return content.split("\n").map((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      return <View key={`space-${index}`} style={styles.textGap} />;
    }

    const isSectionHeading =
      trimmedLine.startsWith("■") || /^제\d+조/.test(trimmedLine);

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
      <ProfileScreenHeader title="개인정보 처리방침" />
      <Text
        style={{
          marginLeft: 16,
          marginTop: 16,
          marginBottom: 12,
          ...fonts.title3_b_24,
          color: Colors.common.black,
        }}
      >
        개인정보 처리방침
      </Text>

      <ScrollView
        style={styles.section}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator
        persistentScrollbar
      >
        {renderLegalText(PRIVACY_CONSENT)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 15,
  },
  section: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LINE,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  sectionBody: {
    ...fonts.body4_r_14,
    color: Colors.gray[9],
  },
  legalSectionHeading: {
    marginTop: 8,
    marginBottom: 6,
    ...fonts.sub4_sb_14,
    color: Colors.common.black,
  },
  textGap: {
    height: 10,
  },
});
