import { AppBackButton } from "@/components/ui/app-back-button";
import { Text } from "@/components/ui/app-text";
import { Colors, commonStyles, fonts } from "@/constants/theme";
import { View } from "react-native";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ProfileScreenHeaderProps = {
  title: string;
  rightAction?: ReactNode;
  onBack?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ProfileScreenHeader({
  title,
  rightAction,
  onBack,
  style,
}: ProfileScreenHeaderProps) {
  return (
    <SafeAreaView edges={["top"]} style={[commonStyles.header, style]}>
      <AppBackButton onPress={onBack} />
      <Text
        style={[fonts.sub3_sb_16, { color: Colors.gray[11] }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {rightAction ?? <View style={commonStyles.headerSpacer} />}
    </SafeAreaView>
  );
}
