import FilterIcon from "@/assets/icon/filter.svg";
import SearchIcon from "@/assets/icon/search-icon.svg";
import SortIcon from "@/assets/icon/sort.svg";
import {
  partnerSchoolExamples,
  type PartnerSchoolExample,
} from "@/components/home/partner-school-examples";
import { Text, TextInput } from "@/components/ui/app-text";
import { CountrySelectionSheet } from "@/components/ui/country-selection-sheet";
import { Colors, fonts } from "@/constants/theme";
import {
  getPartnerSchools,
  type PartnerSchoolSummaryResponse,
} from "@/src/api/partnerSchools";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function ExplorePartnerSchools() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("전체");
  const [countrySheetOpen, setCountrySheetOpen] = useState(false);
  const [useExamples, setUseExamples] = useState(false);

  return (
    <View style={styles.screen}>
      <View style={styles.filters}>
        <View style={[styles.control, styles.search]}>
          <TextInput
            accessibilityLabel="파견교로 검색"
            placeholder="파견교로 검색"
            placeholderTextColor={Colors.gray[6]}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          <SearchIcon width={18} height={18} />
        </View>
        <Pressable
          style={styles.control}
          accessibilityRole="button"
          accessibilityLabel={`국가 필터: ${country}`}
          onPress={() => setCountrySheetOpen(true)}
        >
          <Text style={styles.label} numberOfLines={1}>
            {country === "전체" ? "국가" : country}
          </Text>
          <FilterIcon width={18} height={18} />
        </Pressable>
        <View
          style={styles.control}
          accessible
          accessibilityRole="button"
          accessibilityLabel="정렬"
          accessibilityState={{ disabled: true }}
        >
          <Text style={styles.label}>정렬</Text>
          <SortIcon width={18} height={18} />
        </View>
      </View>
      <PartnerSchoolResults
        key={JSON.stringify([query.trim(), country])}
        keyword={query.trim()}
        country={country}
        bottomPadding={Math.max(insets.bottom, 20)}
        useExamples={useExamples}
        onUseExamples={setUseExamples}
      />
      <CountrySelectionSheet
        visible={countrySheetOpen}
        selectedCountry={country}
        onClose={() => setCountrySheetOpen(false)}
        onSelect={(value) => {
          setCountry(value);
          setCountrySheetOpen(false);
        }}
      />
    </View>
  );
}

function PartnerSchoolResults({
  keyword,
  country,
  bottomPadding,
  useExamples,
  onUseExamples,
}: {
  keyword: string;
  country: string;
  bottomPadding: number;
  useExamples: boolean;
  onUseExamples: (value: boolean) => void;
}) {
  const [schools, setSchools] = useState<PartnerSchoolSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (useExamples) return;
    let active = true;
    const timer = setTimeout(
      async () => {
        try {
          const { data } = await getPartnerSchools({
            page,
            size: 20,
            keyword: keyword || undefined,
            country: country === "전체" ? undefined : country,
          });
          if (!active) return;
          const result = data.data;
          if (
            page === 0 &&
            !keyword &&
            country === "전체" &&
            result.content.length === 0
          ) {
            onUseExamples(true);
            return;
          }
          setSchools((current) =>
            page === 0 ? result.content : [...current, ...result.content],
          );
          setLast(result.last);
        } catch {
          if (active) setFailed(true);
        } finally {
          if (active) setLoading(false);
        }
      },
      page === 0 ? 250 : 0,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [country, keyword, onUseExamples, page, retry, useExamples]);

  const searchTerm = keyword.toLowerCase();
  const visibleSchools = useExamples
    ? partnerSchoolExamples.filter(
        (school) =>
          (country === "전체" || school.country === country) &&
          school.name.toLowerCase().includes(searchTerm),
      )
    : schools;

  return (
    <FlatList<PartnerSchoolSummaryResponse | PartnerSchoolExample>
      data={visibleSchools}
      keyExtractor={(school) => String(school.id)}
      contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      renderItem={({ item: school }) => {
        const image =
          "image" in school
            ? school.image
            : school.thumbnailImageUrl
              ? { uri: school.thumbnailImageUrl }
              : null;
        return (
          <Pressable
            style={styles.row}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/school-detail",
                params: { id: String(school.id), name: school.name },
              })
            }
          >
            {image ? (
              <Image style={styles.thumbnail} source={image} />
            ) : (
              <View style={styles.thumbnail} />
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {school.name}
              </Text>
              <Text style={styles.location}>
                {[school.country, school.city].filter(Boolean).join(" · ")}
              </Text>
              <View style={styles.tags}>
                {(school.tags ?? []).slice(0, 2).map((tag, index) => (
                  <Text key={index} style={styles.tag}>
                    {tag.replace(/^#/, "")}
                  </Text>
                ))}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.gray[6]} />
          </Pressable>
        );
      }}
      ListEmptyComponent={
        useExamples || (!loading && !failed) ? (
          <Text style={styles.status}>조건에 맞는 파견교가 없어요.</Text>
        ) : null
      }
      ListFooterComponent={
        useExamples ? null : loading ? (
          <ActivityIndicator
            style={styles.status}
            color={Colors.primary.default}
          />
        ) : failed ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setFailed(false);
              setLoading(true);
              setRetry((current) => current + 1);
            }}
          >
            <Text style={styles.status}>
              파견교를 불러오지 못했어요. 다시 시도
            </Text>
          </Pressable>
        ) : !last && schools.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setLoading(true);
              setPage((current) => current + 1);
            }}
          >
            <Text style={styles.status}>더 보기</Text>
          </Pressable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  filters: {
    flexDirection: "row",
    gap: 5,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  control: {
    minHeight: 46,
    maxWidth: "27%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 100,
  },
  search: { flex: 1, minWidth: 0, maxWidth: "100%", paddingHorizontal: 15 },
  input: {
    ...fonts.body2_m_14,
    flex: 1,
    lineHeight: undefined,
    padding: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
    color: Colors.common.black,
  },
  label: { ...fonts.body2_m_14, flexShrink: 1, color: Colors.common.black },
  list: { paddingHorizontal: 16, paddingTop: 10, gap: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: Colors.gray[3],
  },
  info: { flex: 1, gap: 4 },
  name: { ...fonts.sub3_sb_16, color: Colors.gray[10] },
  location: { ...fonts.body2_m_14, color: Colors.gray[7] },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 },
  tag: {
    ...fonts.caption4_m_12,
    color: Colors.primary.default,
    backgroundColor: "#EAF3FF",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  status: {
    ...fonts.body2_m_14,
    color: Colors.gray[7],
    textAlign: "center",
    paddingVertical: 20,
  },
});
