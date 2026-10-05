import { InlineDropdown } from "@/components/ui/inline-dropdown";
import { Text, TextInput } from "@/components/ui/app-text";
import {
  AppBackButton,
  goBackOrReplace,
} from "@/components/ui/app-back-button";
import { OnboardingSelectModal } from "@/components/ui/onboarding-select-modal";
import { Colors, fonts } from "@/constants/theme";
import {
  CUSTOM_COUNTRY_OPTION,
  countryOptions,
} from "@/src/constants/onboarding";
import {
  clearMarketDraft,
  saveMarketDraft,
  type DraftItemState,
  type DraftCategoryDetail,
} from "@/src/storage/marketDraft";
import { canUseMarketWithoutVerification } from "@/src/utils/verification";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PhotoField } from "./PhotoField";
import { ItemEditor } from "./ItemEditor";
import {
  categoryLabel,
  parseJson,
  type RegistrationForm,
  type RegistrationItem,
} from "./model";
import { submitRegistration } from "./submit";
import { styles } from "./styles";

type Params = {
  type?: string;
  title?: string;
  content?: string;
  price?: string;
  country?: string;
  region?: string;
  returnDate?: string;
  semester?: string;
  photos?: string;
  wizard?: string;
  resumeCategory?: string;
  resumePreview?: string;
  selectedItems?: string;
  draftItemsByCategory?: string;
  draftCategoryDetails?: string;
};
function restoreItems(params: Params): RegistrationItem[] {
  const details = parseJson<Record<string, DraftCategoryDetail>>(
    params.draftCategoryDetails,
    {},
  );
  const draftItems = parseJson<Record<string, DraftItemState[]>>(
    params.draftItemsByCategory,
    {},
  );
  const groups = Object.keys(draftItems).length
    ? Object.entries(draftItems).map(([category, items]) => ({
        category,
        items: items.filter((item) => item.checked),
      }))
    : parseJson<
        {
          category: string;
          items: { name: string; quantity: number; description?: string }[];
        }[]
      >(params.selectedItems, []);
  return groups.flatMap((group, groupIndex) =>
    group.items.map((item, index) => ({
      id: `restored-${groupIndex}-${index}`,
      category: group.category,
      name: item.name,
      quantity: item.quantity,
      photos: details[group.category]?.photos ?? [],
      description:
        ("description" in item ? item.description : "") ||
        details[group.category]?.description ||
        "",
    })),
  );
}

export default function MarketRegistration() {
  const params = useLocalSearchParams<Params>();
  const wizard = parseJson<{ step: number; items: RegistrationItem[] } | null>(
    params.wizard,
    null,
  );
  const [step, setStep] = useState(() =>
    Math.min(
      3,
      Math.max(1, wizard?.step ?? (params.resumeCategory === "true" ? 3 : 1)),
    ),
  );
  const [form, setForm] = useState<RegistrationForm>(() => ({
    title: params.title || "",
    content: params.content || "",
    price: params.price || "",
    country: params.country || "",
    region: params.region || "",
    returnDate: params.returnDate || "",
    semester: params.semester || "",
    photos: parseJson<string[]>(params.photos, []),
  }));
  const [items, setItems] = useState<RegistrationItem[]>(
    () => wizard?.items ?? restoreItems(params),
  );
  const [editor, setEditor] = useState<RegistrationItem | null>(null);
  const [selector, setSelector] = useState<
    "country" | "year" | "month" | "day" | null
  >(null);
  const [customCountry, setCustomCountry] = useState(
    Boolean(params.country && !countryOptions.includes(params.country)),
  );
  const [dateParts, setDateParts] = useState(() =>
    (params.returnDate || "--").split("-"),
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const uploadLock = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const patch = (value: Partial<RegistrationForm>) =>
    setForm((prev) => ({ ...prev, ...value }));
  const basicValid = Boolean(
    form.country.trim() && form.region.trim() && form.returnDate,
  );
  const postValid = Boolean(
    form.title.trim() &&
    form.content.trim() &&
    form.price.replace(/\D/g, "") &&
    form.photos.length,
  );
  const valid =
    step === 1
      ? basicValid
      : step === 2
        ? postValid
        : basicValid && postValid && items.length > 0;

  useEffect(() => {
    let active = true;
    canUseMarketWithoutVerification()
      .then((allowed) => {
        if (active && !allowed)
          Alert.alert(
            "교환학생 인증",
            "중고거래를 이용하려면 교환학생 신원 인증이 필요해요.",
            [
              { text: "돌아가기", onPress: () => goBackOrReplace("/market") },
              {
                text: "신원 인증하기",
                onPress: () => router.replace("/verification-consent"),
              },
            ],
          );
      })
      .catch(() => {
        if (active)
          Alert.alert(
            "인증 확인 실패",
            "등록할 때 인증 상태를 다시 확인합니다.",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  const saveDraft = async (notify = true) => {
    if (saving || uploading) return false;
    setSaving(true);
    try {
      await saveMarketDraft({
        step: "write",
        write: { ...form, type: params.type ?? "all" },
        wizard: { step, items },
      });
      if (notify)
        Alert.alert("임시저장 완료", "작성 중인 거래글을 저장했어요.");
      return true;
    } catch {
      Alert.alert("임시저장 실패", "저장하지 못했어요. 다시 시도해주세요.");
      return false;
    } finally {
      setSaving(false);
    }
  };
  const back = () => {
    if (uploading) return;
    if (step > 1) {
      setStep(step - 1);
      scroll.current?.scrollTo({ y: 0, animated: false });
      return;
    }
    Alert.alert(
      "작성을 나갈까요?",
      "임시저장하면 나중에 이어서 작성할 수 있어요.",
      [
        { text: "계속 작성", style: "cancel" },
        { text: "나가기", onPress: () => goBackOrReplace("/market") },
        {
          text: "저장하고 나가기",
          onPress: async () => {
            if (await saveDraft(false)) goBackOrReplace("/market");
          },
        },
      ],
    );
  };
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        back();
        return true;
      },
    );
    return () => subscription.remove();
  });

  const next = async () => {
    Keyboard.dismiss();
    if (!valid || uploadLock.current) return;
    if (step < 3) {
      setStep(step + 1);
      scroll.current?.scrollTo({ y: 0, animated: false });
      return;
    }
    uploadLock.current = true;
    setUploading(true);
    try {
      if (!(await canUseMarketWithoutVerification())) {
        Alert.alert("교환학생 인증", "신원 인증 후 등록할 수 있어요.", [
          { text: "확인" },
          {
            text: "인증하기",
            onPress: () => router.push("/verification-consent"),
          },
        ]);
        return;
      }
      await submitRegistration(form, items);
      // A local cleanup failure must not cause a second server submission.
      await clearMarketDraft().catch((error) =>
        console.warn("임시저장 정리 실패", error),
      );
      Alert.alert("등록 완료", "중고거래 게시글이 등록되었습니다.");
      router.replace("/market");
    } catch (error) {
      console.warn("중고거래 등록 실패", error);
      Alert.alert(
        "등록 실패",
        "작성한 내용은 유지됩니다. 잠시 후 다시 시도해주세요.",
      );
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  };
  const chooseDate = (value: string) => {
    const index = selector === "year" ? 0 : selector === "month" ? 1 : 2;
    const nextParts = [...dateParts];
    nextParts[index] = value;
    if (nextParts[0] && nextParts[1] && nextParts[2]) {
      const maxDay = new Date(
        Number(nextParts[0]),
        Number(nextParts[1]),
        0,
      ).getDate();
      nextParts[2] = String(Math.min(Number(nextParts[2]), maxDay)).padStart(
        2,
        "0",
      );
      patch({ returnDate: nextParts.join("-") });
    }
    setDateParts(nextParts);
    setSelector(null);
  };
  const year = new Date().getFullYear();
  const years = Array.from(
    new Set([
      ...(dateParts[0] ? [dateParts[0]] : []),
      ...Array.from({ length: 12 }, (_, index) => String(year + index)),
    ]),
  ).sort();
  const options =
    selector === "country"
      ? countryOptions
      : selector === "year"
        ? years
        : Array.from(
            {
              length:
                selector === "month"
                  ? 12
                  : new Date(
                      Number(dateParts[0]) || year,
                      Number(dateParts[1]) || 1,
                      0,
                    ).getDate(),
            },
            (_, index) => String(index + 1).padStart(2, "0"),
          );
  const titles = [
    "기본 정보 등록하기",
    "게시글 정보 등록하기",
    "세부 물품 등록하기",
  ];
  const subtitles = [
    "거래에 필요한 기본 정보를 등록해주세요.",
    "구체적인 게시글 정보를 등록해주세요.",
    "거래를 원하시는 세부 물품을 모두 등록해주세요.",
  ];
  return (
    <KeyboardAvoidingView
      style={[styles.page, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <AppBackButton onPress={back} />
        <Text style={fonts.sub3_sb_16}>중고물품 등록</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, selector && selector !== "country" && { paddingBottom: 200 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progress}>
          {[1, 2, 3].map((value) => (
            <Fragment key={value}>
              {value > 1 && <View style={styles.connector} />}
              <View style={[styles.dot, step === value && styles.dotActive]}>
                <Text style={[fonts.caption4_m_12, { color: "white" }]}>
                  {value}
                </Text>
              </View>
            </Fragment>
          ))}
          <Pressable
            disabled={saving || uploading}
            style={styles.save}
            onPress={() => saveDraft()}
          >
            <Text style={[fonts.body2_m_14, { color: Colors.gray[8] }]}>
              {saving ? "저장 중" : "임시저장"}
            </Text>
          </Pressable>
        </View>
        <Text style={[fonts.title3_b_24, { marginBottom: 6 }]}>
          {titles[step - 1]}
        </Text>
        <Text
          style={[fonts.body3_r_16, { color: Colors.gray[7], marginBottom: 8 }]}
        >
          {subtitles[step - 1]}
        </Text>
        {step === 1 && (
          <View style={styles.field}>
            <View style={{ gap: 4 }}>
              <Text style={[fonts.sub4_sb_14, { color: Colors.gray[8] }]}>
                국가 및 지역
              </Text>
              <Pressable
                style={styles.select}
                onPress={() => setSelector("country")}
              >
                <Text
                  style={[
                    fonts.body2_m_14,
                    { color: form.country ? Colors.gray[11] : Colors.gray[5] },
                  ]}
                >
                  {form.country || "국가 및 지역을 선택해주세요"}
                </Text>
                <Ionicons name="chevron-down" size={18} />
              </Pressable>
              {customCountry && (
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  placeholder="국가 및 지역을 입력해주세요"
                  value={form.country}
                  onChangeText={(country) => patch({ country })}
                />
              )}
            </View>
            <View style={{ gap: 4 }}>
              <Text style={[fonts.sub4_sb_14, { color: Colors.gray[8] }]}>
                희망 장소
              </Text>
              <TextInput
                style={styles.input}
                placeholder="구체적인 장소를 입력해주세요"
                placeholderTextColor={Colors.gray[5]}
                value={form.region}
                onChangeText={(region) => patch({ region })}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={[fonts.sub4_sb_14, { color: Colors.gray[8] }]}>
                귀국일
              </Text>
              <View style={[styles.row, { alignItems: "flex-start", zIndex: 30 }]}>
                {(["year", "month", "day"] as const).map((part, index) => (
                  <InlineDropdown
                    key={part}
                    compact
                    value={dateParts[index] || ""}
                    displayValue={dateParts[index] ? `${Number(dateParts[index])}${["년", "월", "일"][index]}` : ""}
                    placeholder={["연도", "월", "일"][index]}
                    open={selector === part}
                    onPress={() => setSelector(selector === part ? null : part)}
                    options={(part === "year" ? years : Array.from({ length: part === "month" ? 12 : new Date(Number(dateParts[0]) || year, Number(dateParts[1]) || 1, 0).getDate() }, (_, i) => String(i + 1).padStart(2, "0"))).map((value) => ({ value, label: `${Number(value)}${["년", "월", "일"][index]}` }))}
                    onSelect={chooseDate}
                  />
                ))}
              </View>
              <Text
                style={[
                  fonts.caption4_m_12,
                  { color: Colors.gray[6], marginTop: 8 },
                ]}
              >
                ⓘ 대면 거래를 파악하기 위해 필요한 정보예요.
              </Text>
            </View>
          </View>
        )}
        {step === 2 && (
          <View style={styles.field}>
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>게시글 제목</Text>
              <View style={styles.select}>
                <TextInput
                  style={[fonts.body2_m_14, { flex: 1, minHeight: 46 }]}
                  placeholder="제목을 입력해주세요"
                  placeholderTextColor={Colors.gray[5]}
                  maxLength={Math.max(20, params.title?.length ?? 0)}
                  value={form.title}
                  onChangeText={(title) => patch({ title })}
                />
                <Text style={fonts.caption4_m_12}>{form.title.length}/20</Text>
              </View>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>상세 설명</Text>
              <View style={styles.textBox}>
                <TextInput
                  style={styles.textarea}
                  placeholder="물품 상태, 구매 시기, 거래 조건 등을 입력해주세요"
                  placeholderTextColor={Colors.gray[5]}
                  multiline
                  maxLength={Math.max(100, params.content?.length ?? 0)}
                  value={form.content}
                  onChangeText={(content) => patch({ content })}
                />
                <Text style={styles.counter}>{form.content.length}/100</Text>
              </View>
            </View>
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>가격</Text>
              <View style={styles.select}>
                <TextInput
                  style={[fonts.body2_m_14, { flex: 1, minHeight: 46 }]}
                  placeholder="0"
                  placeholderTextColor={Colors.gray[5]}
                  keyboardType="number-pad"
                  value={
                    form.price
                      ? Number(form.price.replace(/\D/g, "")).toLocaleString(
                          "ko-KR",
                        )
                      : ""
                  }
                  onChangeText={(price) =>
                    patch({ price: price.replace(/\D/g, "").slice(0, 12) })
                  }
                />
                <Text style={fonts.body2_m_14}>원</Text>
              </View>
            </View>
            <View>
              <Text style={styles.label}>이미지</Text>
              <PhotoField
                photos={form.photos}
                onChange={(photos) => patch({ photos })}
                limit={10}
              />
            </View>
          </View>
        )}
        {step === 3 && (
          <>
            {items.map((item) => (
              <View key={item.id} style={styles.card}>
                <Pressable
                  style={[styles.row, { flex: 1 }]}
                  onPress={() => setEditor(item)}
                  accessibilityLabel={`${item.name} 수정`}
                >
                  {item.photos[0] ? (
                    <Image
                      source={{ uri: item.photos[0] }}
                      style={styles.thumb}
                    />
                  ) : (
                    <View
                      style={[
                        styles.thumb,
                        { alignItems: "center", justifyContent: "center" },
                      ]}
                    >
                      <Ionicons
                        name="image-outline"
                        size={24}
                        color={Colors.gray[5]}
                      />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={fonts.sub4_sb_14}>
                      {item.name} {item.quantity}개
                    </Text>
                    <Text
                      style={[
                        fonts.caption4_m_12,
                        { color: Colors.primary.default },
                      ]}
                    >
                      {categoryLabel(item.category)}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[fonts.caption4_m_12, { color: Colors.gray[6] }]}
                    >
                      {item.description}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  hitSlop={8}
                  accessibilityLabel={`${item.name} 삭제`}
                  onPress={() =>
                    Alert.alert(
                      "물품 삭제",
                      `${item.name}을 목록에서 삭제할까요?`,
                      [
                        { text: "취소", style: "cancel" },
                        {
                          text: "삭제",
                          style: "destructive",
                          onPress: () =>
                            setItems(
                              items.filter((other) => other.id !== item.id),
                            ),
                        },
                      ],
                    )
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={Colors.gray[6]}
                  />
                </Pressable>
              </View>
            ))}
            <Pressable
              style={[styles.empty, !!items.length && { minHeight: 88 }]}
              onPress={() =>
                setEditor({
                  id: `${Date.now()}`,
                  category: "",
                  name: "",
                  quantity: 0,
                  photos: [],
                  description: "",
                })
              }
            >
              <Ionicons
                name="add-circle"
                size={25}
                color={Colors.primary.default}
              />
              <Text style={[fonts.sub4_sb_14, { color: Colors.gray[8] }]}>
                물품을 등록해주세요
              </Text>
              {!items.length && (
                <Text style={[fonts.caption4_m_12, { color: Colors.gray[6] }]}>
                  아직 등록된 세부 물품이 없습니다
                </Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <Pressable
          disabled={!valid || uploading || saving}
          style={[
            styles.button,
            (!valid || uploading || saving) && styles.disabled,
          ]}
          onPress={next}
        >
          {uploading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {step === 3 ? "등록하기" : "다음 단계로"}
            </Text>
          )}
        </Pressable>
      </View>
      <OnboardingSelectModal
        visible={selector === "country"}
        title={selector === "country" ? "국가 및 지역 선택" : "귀국일 선택"}
        options={options}
        selectedValue={
          selector === "country"
            ? form.country
            : dateParts[
                selector === "year" ? 0 : selector === "month" ? 1 : 2
              ] || ""
        }
        onClose={() => setSelector(null)}
        onSelect={(value) => {
          if (selector !== "country") {
            chooseDate(value);
            return;
          }
          setCustomCountry(value === CUSTOM_COUNTRY_OPTION);
          patch({ country: value === CUSTOM_COUNTRY_OPTION ? "" : value });
          setSelector(null);
        }}
      />
      {editor && (
        <ItemEditor
          key={editor.id}
          initial={editor}
          items={items}
          onClose={() => setEditor(null)}
          onSave={(item) => {
            setItems((prev) =>
              prev.some((other) => other.id === item.id)
                ? prev.map((other) => (other.id === item.id ? item : other))
                : [...prev, item],
            );
            setEditor(null);
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
