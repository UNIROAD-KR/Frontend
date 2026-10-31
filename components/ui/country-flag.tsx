import FlagIcon from "react-native-ico-flags";
import { StyleProp, ViewStyle } from "react-native";

const countryFlagNames = {
  대한민국: "south-korea",
  한국: "south-korea",
  독일: "germany",
  프랑스: "france",
  스페인: "spain",
  이탈리아: "italy",
  미국: "united-states-of-america",
  영국: "united-kingdom",
  일본: "japan",
  캐나다: "canada",
  호주: "australia",
  네덜란드: "netherlands",
  체코: "czech-republic",
  포르투갈: "portugal",
  벨기에: "belgium",
  폴란드: "poland",
  핀란드: "finland",
  노르웨이: "norway",
  스웨덴: "sweden",
  아일랜드: "ireland",
  덴마크: "denmark",
  오스트리아: "austria",
  스위스: "switzerland",
  중국: "china",
  대만: "taiwan",
  싱가포르: "singapore",
  홍콩: "hong-kong",
  뉴질랜드: "new-zealand",
  멕시코: "mexico",
  브라질: "brazil",
  튀르키예: "turkey",
  터키: "turkey",
} as const;

type CountryFlagProps = {
  country?: string;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export function CountryFlag({
  country,
  width = 40,
  height = 24,
  style,
}: CountryFlagProps) {
  const name = country
    ? countryFlagNames[country as keyof typeof countryFlagNames]
    : undefined;

  if (!name) {
    return null;
  }

  return (
    <FlagIcon
      name={name}
      width={Math.min(width, 40)}
      height={height}
      style={style}
    />
  );
}
