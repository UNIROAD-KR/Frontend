import { AppBackButton } from "@/components/ui/app-back-button";
import { Text } from "@/components/ui/app-text";
import { Colors, commonStyles, fonts } from "@/constants/theme";
import { View } from "react-native";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ProfileScreenHeaderProps = {
  title: string;
  rightAction?: ReactNode;
};

export function ProfileScreenHeader({ title, rightAction }: ProfileScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        commonStyles.header,
        {
          paddingTop: Math.max(50, insets.top + 10),
          paddingBottom: 8,
          backgroundColor: Colors.common.white,
        },
      ]}
    >
      <AppBackButton />
      <Text style={[fonts.sub3_sb_16, { color: Colors.gray[11] }]} numberOfLines={1}>
        {title}
      </Text>
      {rightAction ?? <View style={commonStyles.headerSpacer} />}
    </View>
  );
}
