import { View, Text } from "react-native";
import AsteriskIcon from "@/assets/icon/asterisk.svg";
import { Colors, fonts } from "@/constants/theme";

export function FieldLabel({
  title,
  required = true,
  marginBottom,
}: {
  title: string;
  required?: boolean;
  marginBottom?: number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: marginBottom ?? 0,
      }}
    >
      <Text style={{ ...fonts.sub4_sb_14 }}>{title}</Text>
      {required && (
        <AsteriskIcon color={Colors.error.normal} width={12} height={12} />
      )}
    </View>
  );
}
