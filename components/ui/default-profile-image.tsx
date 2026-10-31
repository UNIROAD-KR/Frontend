import { Image, type ImageProps } from "react-native";

export function DefaultProfileImage(props: Omit<ImageProps, "source">) {
  return <Image {...props} source={require("@/assets/images/simbol.png")} />;
}
