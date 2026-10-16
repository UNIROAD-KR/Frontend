import { AppBackButton } from "@/components/ui/app-back-button";
import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ProfileScreenHeaderProps = {
  title: string;
};

export function ProfileScreenHeader({ title }: ProfileScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: Math.max(50, insets.top + 10) }]}>
      <AppBackButton style={styles.backButton} />
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Colors.common.white,
  },
  backButton: {
    backgroundColor: "transparent",
  },
  title: {
    ...fonts.sub3_sb_16,
    letterSpacing: 0,
    color: Colors.gray[11],
  },
  spacer: {
    width: 38,
    height: 38,
  },
});
