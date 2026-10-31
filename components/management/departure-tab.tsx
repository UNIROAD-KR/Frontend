import MoneyActionIcon from "@/assets/icon/actions/money.svg";
import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";
import DocumentActionIcon from "@/assets/icon/actions/document.svg";
import HomeActionIcon from "@/assets/icon/actions/home.svg";
import WalletActionIcon from "@/assets/icon/actions/wallet.svg";
import UsimActionIcon from "@/assets/icon/actions/usim.svg";
import AirplaneActionIcon from "@/assets/icon/actions/airplane.svg";
import CheckboxIcon from "@/assets/icon/checkbox.svg";
import CheckboxEmptyIcon from "@/assets/icon/checkbox-empty.svg";
import { Modal } from "@/components/ui/modal";
import { PopoverMenu } from "@/components/ui/popover-menu";
import EditIcon from "@/assets/icon/edit.svg";
import DeleteIcon from "@/assets/icon/delete.svg";
import XIcon from "@/assets/icon/x-icon.svg";
import { FieldLabel } from "@/components/ui/field-label";
import Svg, { Circle } from "react-native-svg";
import { flags } from "@/src/constants/countries";
import EmptyState from "@/components/ui/empty-state";
import InfoCircleIcon from "@/assets/icon/info-circle.svg";
import { Text, TextInput } from "@/components/ui/app-text";
import {
  AppBackButton,
  goBackOrReplace,
} from "@/components/ui/app-back-button";
import {
  BottomSheetModal,
  BottomSheetView,
  bottomSheetStyles,
} from "@/components/ui/bottom-sheet";
import { Colors, commonStyles, fonts } from "@/constants/theme";
import {
  loadPreparations,
  makeId,
  progress,
  savePreparations,
  type DeparturePreparation,
  type PreparationItem,
} from "@/src/storage/departurePreparations";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const ESSENTIAL_PRESENTATION: Record<
  string,
  { category: string; title: string; Icon: ComponentType<SvgProps> }
> = {
  "visa-apply": {
    category: "비자",
    title: "비자 신청하기",
    Icon: DocumentActionIcon,
  },
  "visa-pickup": {
    category: "비자",
    title: "비자 수령하기",
    Icon: DocumentActionIcon,
  },
  "housing-secure": {
    category: "거주",
    title: "숙소 확보하기",
    Icon: HomeActionIcon,
  },
  "insurance-join": {
    category: "보험",
    title: "보험 가입하기",
    Icon: WalletActionIcon,
  },
  // "blocked-account": {
  //   category: "은행/재정",
  //   title: "슈페어콘토 개설",
  //   Icon: MoneyActionIcon,
  // },
  "card-ready": {
    category: "은행/재정",
    title: "해외결제 카드 준비",
    Icon: MoneyActionIcon,
  },
  "esim-ready": {
    category: "통신",
    title: "유심/eSIM 준비",
    Icon: UsimActionIcon,
  },
  "flight-booking": {
    category: "항공",
    title: "항공권 예약하기",
    Icon: AirplaneActionIcon,
  },
};
const displayDate = (value: string) => value.replaceAll("-", ".");
const formatRegisteredAt = (value: string) => {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}. ${pad(date.getMonth() + 1)}. ${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
type Sheet = "item" | "delete" | null;
export function DepartureTab({ preparationId }: { preparationId?: string }) {
  const insets = useSafeAreaInsets();
  const [lists, setLists] = useState<DeparturePreparation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [filter, setFilter] = useState("전체");
  const [section, setSection] = useState("필수 준비물");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [sheet, setSheet] = useState<Sheet>(null);
  const [menu, setMenu] = useState(false);
  const headerRef = useRef<View>(null);
  const [menuTop, setMenuTop] = useState(0);
  const pendingMenuAction = useRef<(() => void) | null>(null);
  const runMenuAction = (action: () => void) => {
    if (Platform.OS === "ios") pendingMenuAction.current = action;
    else action();
  };
  const [category, setCategory] = useState("daily");
  const [itemTitle, setItemTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const list = lists.find((entry) => entry.id === preparationId);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLists(await loadPreparations());
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );
  // Persist before showing success. A failed write leaves the previous list intact.
  const commit = async (next: DeparturePreparation[]) => {
    if (busy.current) return false;
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      await savePreparations(next);
      setLists(next);
      return true;
    } catch {
      setError("저장하지 못했어요. 다시 시도해주세요.");
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };
  const update = (next: DeparturePreparation) =>
    commit(lists.map((entry) => (entry.id === next.id ? next : entry)));
  const close = () => {
    if (!busy.current) {
      setSheet(null);
      setError("");
    }
  };
  const openCreate = () => router.push("/departure-preparation-form");
  const toggleItem = (id: string, groupId?: string) => {
    if (!list) return;
    const toggle = (items: PreparationItem[]) =>
      items.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      );
    void update(
      groupId
        ? {
            ...list,
            groups: list.groups.map((group) =>
              group.id === groupId
                ? { ...group, items: toggle(group.items) }
                : group,
            ),
          }
        : { ...list, essentials: toggle(list.essentials) },
    );
  };
  const addItem = async () => {
    if (!list || !itemTitle.trim()) return;
    const title = customCategory.trim();
    if (category === "custom" && !title) {
      setError("카테고리 이름을 입력해주세요.");
      return;
    }
    const item = { id: makeId(), title: itemTitle.trim(), done: false };
    const existing = list.groups.find(
      (group) =>
        group.id === category ||
        (category === "custom" && group.title === title),
    );
    const groupId = existing?.id ?? makeId();
    const groups = existing
      ? list.groups.map((group) =>
          group.id === existing.id
            ? { ...group, items: [...group.items, item] }
            : group,
        )
      : [{ id: groupId, title, items: [item] }, ...list.groups];
    if (await update({ ...list, groups })) {
      setOpenGroups((previous) => ({ ...previous, [groupId]: true }));
      setSheet(null);
    }
  };
  const iconButton = (
    name: React.ComponentProps<typeof Ionicons>["name"],
    label: string,
    onPress: () => void,
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      disabled={saving}
      onPress={onPress}
      style={s.icon}
    >
      <Ionicons name={name} size={22} color={Colors.gray[9]} />
    </Pressable>
  );
  const chip = (title: string, selected: boolean, onPress: () => void) => (
    <Pressable
      key={title}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.chip, selected && s.chipActive]}
    >
      <Text
        style={[
          fonts.caption3_m_13,
          { color: selected ? Colors.common.white : Colors.gray[7] },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
  const renderEssential = (item: PreparationItem) => {
    const { category, title, Icon } = ESSENTIAL_PRESENTATION[item.id] ?? {
      category: "준비",
      title: item.title,
      Icon: DocumentActionIcon,
    };
    return (
      <Pressable
        key={item.id}
        style={s.essentialCard}
        accessibilityRole="checkbox"
        accessibilityLabel={item.title}
        accessibilityState={{ checked: item.done, disabled: saving }}
        disabled={saving}
        onPress={() => toggleItem(item.id)}
      >
        <View style={s.essentialIcon}>
          <Icon width={28} height={28} />
        </View>
        <View style={s.flex}>
          <Text style={s.essentialCategory}>{category}</Text>
          <Text style={[fonts.sub3_sb_16, { color: Colors.common.black }]}>
            {title}
          </Text>
        </View>
        {item.done ? (
          <CheckboxIcon width={24} height={24} />
        ) : (
          <CheckboxEmptyIcon width={24} height={24} />
        )}
      </Pressable>
    );
  };
  const renderItem = (item: PreparationItem, groupId?: string) => (
    <View key={item.id} style={s.item}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.done, disabled: saving }}
        disabled={saving}
        onPress={() => toggleItem(item.id, groupId)}
        style={s.itemToggle}
      >
        <Ionicons
          name={item.done ? "checkbox" : "square-outline"}
          size={22}
          color={item.done ? Colors.primary.default : Colors.gray[4]}
        />
        <Text style={[fonts.body2_m_14, s.flex, item.done && s.done]}>
          {item.title}
        </Text>
      </Pressable>
      {groupId &&
        iconButton("close", `${item.title} 삭제`, () => {
          if (list)
            void update({
              ...list,
              groups: list.groups.map((group) =>
                group.id === groupId
                  ? {
                      ...group,
                      items: group.items.filter(
                        (entry) => entry.id !== item.id,
                      ),
                    }
                  : group,
              ),
            });
        })}
    </View>
  );
  if (loading)
    return (
      <View style={s.center}>
        <ActivityIndicator color={Colors.primary.default} />
      </View>
    );
  if (loadError)
    return (
      <View style={s.center}>
        <Text>출국 준비 목록을 불러오지 못했어요.</Text>
        <Pressable onPress={() => void load()}>
          <Text style={s.link}>다시 시도</Text>
        </Pressable>
      </View>
    );
  if (preparationId && !list)
    return (
      <View style={commonStyles.container}>
        <AppBackButton />
        <View style={s.center}>
          <Text>목록을 찾을 수 없어요.</Text>
        </View>
      </View>
    );
  const stats = list ? progress(list) : null;
  const recent = [...lists]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .find((entry) => progress(entry).percent < 100);
  const filtered = lists.filter(
    (entry) =>
      filter === "전체" ||
      (filter === "완료"
        ? progress(entry).percent === 100
        : progress(entry).percent < 100),
  );
  return (
    <View style={commonStyles.container}>
      {list && (
        <View ref={headerRef} collapsable={false} style={commonStyles.header}>
          <AppBackButton />
          <Text style={fonts.sub3_sb_16}>출국 준비</Text>
          {iconButton("ellipsis-vertical", "목록 메뉴", () =>
            headerRef.current?.measureInWindow((_x, y, _width, height) => {
              setMenuTop(y + height - 4);
              setMenu(true);
            }),
          )}
        </View>
      )}
      {list && (
        <PopoverMenu
          visible={menu}
          position={{ top: menuTop, right: 18 }}
          width={120}
          accessibilityLabel="출국 준비 메뉴 닫기"
          onClose={() => setMenu(false)}
          onDismiss={() => {
            const action = pendingMenuAction.current;
            pendingMenuAction.current = null;
            action?.();
          }}
          items={[
            {
              label: "수정하기",
              icon: <EditIcon color={Colors.gray[8]} width={16} height={16} />,
              onPress: () =>
                runMenuAction(() =>
                  router.push({
                    pathname: "/departure-preparation-form",
                    params: { id: list.id },
                  }),
                ),
            },
            {
              label: "삭제하기",
              icon: (
                <DeleteIcon color={Colors.gray[8]} width={16} height={16} />
              ),
              onPress: () => runMenuAction(() => setSheet("delete")),
            },
          ]}
        />
      )}
      {!!error && !sheet && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <ScrollView contentContainerStyle={s.content}>
        {list && stats ? (
          <>
            <View style={s.summaryHeader}>
              <View style={s.flex}>
                <Text
                  style={[fonts.title3_b_24, { color: Colors.common.black }]}
                >
                  {list.title}
                </Text>
                <View style={s.summaryMeta}>
                  <Text style={[fonts.body4_r_14, { color: Colors.gray[7] }]}>
                    {formatRegisteredAt(list.createdAt)}
                  </Text>
                  <Text style={s.typeBadge}>{list.scheduleType ?? "학업"}</Text>
                </View>
              </View>
              <View
                style={s.progressCircle}
                accessibilityLabel={`준비 진행률 ${stats.percent}%`}
              >
                <Svg width={64} height={64} viewBox="0 0 64 64">
                  <Circle
                    cx={32}
                    cy={32}
                    r={27}
                    fill="none"
                    stroke={Colors.gray[3]}
                    strokeWidth={6}
                  />
                  <Circle
                    cx={32}
                    cy={32}
                    r={27}
                    fill="none"
                    stroke={Colors.primary.default}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 27}`}
                    strokeDashoffset={
                      2 * Math.PI * 27 * (1 - stats.percent / 100)
                    }
                    rotation={-90}
                    origin="32, 32"
                    opacity={stats.percent ? 1 : 0}
                  />
                </Svg>
                <Text style={s.progressText}>{stats.percent}%</Text>
              </View>
            </View>
            <View style={s.summaryCard}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>• 국가 및 지역</Text>
                <Text style={s.summaryValue}>
                  {[flags[list.country], list.country, list.region]
                    .filter(Boolean)
                    .join(" ")}
                </Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>• 출국일</Text>
                <Text style={s.summaryValue}>
                  {list.departureDate.replaceAll("-", ". ")}
                </Text>
              </View>
            </View>
            <View style={s.row}>
              {["필수 준비물", "짐싸기 준비"].map((title) => (
                <Pressable
                  key={title}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: section === title }}
                  onPress={() => setSection(title)}
                  style={[s.sectionTab, section === title && s.sectionActive]}
                >
                  <Text
                    style={[
                      fonts.sub4_sb_14,
                      {
                        color:
                          section === title ? Colors.gray[10] : Colors.gray[6],
                      },
                    ]}
                  >
                    {title}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={s.row}>
              <Text style={[fonts.sub3_sb_16, s.flex]}>
                {section === "필수 준비물" ? "필수 준비물 체크" : "준비물 체크"}
              </Text>
              <Pressable
                disabled={saving}
                onPress={() => {
                  if (section === "필수 준비물")
                    void update({
                      ...list,
                      essentials: list.essentials.map((item) => ({
                        ...item,
                        done: !list.essentials.every((entry) => entry.done),
                      })),
                    });
                  else {
                    setCategory(list.groups[0]?.id ?? "custom");
                    setItemTitle("");
                    setCustomCategory("");
                    setError("");
                    setSheet("item");
                  }
                }}
              >
                <Text style={s.link}>
                  {section === "필수 준비물"
                    ? list.essentials.every((item) => item.done)
                      ? "전체 해제"
                      : "전체 선택"
                    : "추가하기"}
                </Text>
              </Pressable>
            </View>
            {section === "필수 준비물" ? (
              <View style={s.essentialList}>
                {list.essentials.map(renderEssential)}
              </View>
            ) : (
              list.groups.map((group) => (
                <View key={group.id} style={s.group}>
                  <Pressable
                    style={s.groupHeader}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: !!openGroups[group.id] }}
                    onPress={() =>
                      setOpenGroups((previous) => ({
                        ...previous,
                        [group.id]: !previous[group.id],
                      }))
                    }
                  >
                    <View style={s.flex}>
                      <Text style={fonts.sub4_sb_14}>{group.title}</Text>
                      <Text style={s.meta}>
                        {group.items.filter((item) => item.done).length}/
                        {group.items.length}
                      </Text>
                    </View>
                    <Ionicons
                      name={
                        openGroups[group.id] ? "chevron-up" : "chevron-down"
                      }
                      size={18}
                      color={Colors.gray[7]}
                    />
                  </Pressable>
                  {openGroups[group.id] && (
                    <>
                      {group.items.map((item) => renderItem(item, group.id))}
                      {!group.items.length && (
                        <Text style={s.meta}>준비물을 추가해주세요.</Text>
                      )}
                    </>
                  )}
                </View>
              ))
            )}
          </>
        ) : (
          <>
            <Pressable
              style={s.statusCard}
              accessibilityRole="button"
              onPress={() =>
                recent
                  ? router.push({
                      pathname: "/departure-preparation",
                      params: { id: recent.id },
                    })
                  : openCreate()
              }
            >
              <View style={s.statusIcon}>
                {recent ? (
                  <Ionicons
                    name="airplane"
                    size={28}
                    color={Colors.primary.default}
                  />
                ) : (
                  <InfoCircleIcon
                    width={28}
                    height={28}
                    color={Colors.gray[5]}
                  />
                )}
              </View>
              <View style={s.flex}>
                <Text style={s.link}>준비 중인 일정</Text>
                <Text style={[fonts.sub1_sb_18, { marginTop: 4 }]}>
                  {recent
                    ? `${recent.title} ${progress(recent).percent}%`
                    : "준비 중 일정이 없습니다"}
                </Text>
                <Text
                  style={[
                    fonts.body4_r_14,
                    { color: Colors.gray[7], marginTop: 4 },
                  ]}
                >
                  {recent
                    ? "유니로드와 출국 준비를 이어가세요!"
                    : "유니로드와 출국 준비 해봐요!"}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={Colors.gray[8]}
              />
            </Pressable>
            <Text style={fonts.sub3_sb_16}>지난 일정 기록</Text>
            <View style={s.chips}>
              {["전체", "완료", "준비 중"].map((title) =>
                chip(title, filter === title, () => setFilter(title)),
              )}
            </View>
            {filtered.length ? (
              [...filtered]
                .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                .map((entry, index) => (
                  <Pressable
                    key={entry.id}
                    style={[
                      s.listRow,
                      index === filtered.length - 1 && s.lastListRow,
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: "/departure-preparation",
                        params: { id: entry.id },
                      })
                    }
                  >
                    <Ionicons
                      name="airplane"
                      size={24}
                      color={Colors.primary.default}
                    />
                    <View style={s.flex}>
                      <Text style={fonts.sub4_sb_14}>{entry.title}</Text>
                      <Text style={s.meta}>
                        {entry.country} · {displayDate(entry.departureDate)} ·{" "}
                        {progress(entry).percent}%
                      </Text>
                    </View>
                    <Text
                      style={[
                        s.badge,
                        progress(entry).percent === 100 && s.complete,
                      ]}
                    >
                      {progress(entry).percent === 100 ? "완료" : "준비 중"}
                    </Text>
                  </Pressable>
                ))
            ) : (
              <View style={s.empty}>
                <EmptyState
                  title={
                    lists.length
                      ? "해당하는 일정이 없습니다"
                      : "등록된 일정이 없습니다"
                  }
                  description={
                    lists.length
                      ? "다른 필터를 선택해 일정을 확인해보세요."
                      : "일정을 등록하고 유니로드와 함께\n체계적인 출국 준비 해봐요!"
                  }
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
      {!list && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="출국 준비 목록 추가"
          onPress={() => void openCreate()}
          style={s.fab}
        >
          <Ionicons name="add" size={28} color={Colors.common.white} />
        </Pressable>
      )}
      <BottomSheetModal visible={sheet === "item"} onRequestClose={close}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.overlay}
        >
          <Pressable
            style={[StyleSheet.absoluteFill, bottomSheetStyles.transparent]}
            onPress={close}
          />
          <BottomSheetView
            style={[
              s.sheet,
              sheet === "item" && s.addItemSheet,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            {sheet === "item" && <View style={s.sheetHandle} />}
            <View style={s.row}>
              <Text style={[fonts.title5_b_20, s.flex]}>
                {sheet === "item" ? "준비물 추가하기" : "출국 준비 삭제"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="닫기"
                hitSlop={8}
                disabled={saving}
                onPress={close}
                style={s.icon}
              >
                <XIcon width={24} height={24} />
              </Pressable>
            </View>
            <ScrollView
              style={sheet === "item" ? s.sheetScroll : undefined}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.sheetScrollContent}
            >
              {sheet === "item" ? (
                <>
                  <FieldLabel title="카테고리" required={false} />
                  <View style={s.chips}>
                    {chip("직접 추가", category === "custom", () =>
                      setCategory("custom"),
                    )}
                    {list?.groups.map((group) =>
                      chip(group.title, category === group.id, () =>
                        setCategory(group.id),
                      ),
                    )}
                  </View>
                  {category === "custom" && (
                    <TextInput
                      value={customCategory}
                      onChangeText={setCustomCategory}
                      maxLength={20}
                      placeholder="카테고리 이름"
                      style={s.input}
                    />
                  )}
                  <View style={s.itemNameField}>
                    <FieldLabel
                      title="준비물 이름"
                      required={false}
                      marginBottom={8}
                    />
                    <View style={s.nameInputRow}>
                      <TextInput
                        value={itemTitle}
                        onChangeText={setItemTitle}
                        placeholder="이름을 입력해주세요"
                        maxLength={20}
                        style={s.nameInput}
                      />
                      <Text style={fonts.caption3_m_13}>
                        {itemTitle.length}/20
                      </Text>
                    </View>
                  </View>
                </>
              ) : (
                <Text style={fonts.body2_m_14}>
                  출국 준비 기록을 삭제할까요?\n삭제한 목록은 복구할 수 없어요.
                </Text>
              )}
              {!!error && (
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                </Text>
              )}
            </ScrollView>
            <Pressable
              disabled={saving || !itemTitle.trim()}
              style={[
                s.submit,
                (saving || !itemTitle.trim()) && { opacity: 0.4 },
              ]}
              onPress={() => void addItem()}
            >
              <Text style={[fonts.sub3_sb_16, { color: Colors.common.white }]}>
                {saving ? "저장 중…" : "추가하기"}
              </Text>
            </Pressable>
          </BottomSheetView>
        </KeyboardAvoidingView>
      </BottomSheetModal>
      <Modal
        isOpen={sheet === "delete"}
        onClose={close}
        title="출국 준비 삭제"
        description={
          "출국 준비 기록을 삭제할까요?\n삭제한 목록은 복구할 수 없어요."
        }
        secondaryButton={{ label: "취소", onPress: close }}
        primaryButton={{
          label: saving ? "삭제 중…" : "삭제하기",
          tone: "destructive",
          onPress: () => {
            if (!list || busy.current) return;
            void (async () => {
              if (await commit(lists.filter((entry) => entry.id !== list.id))) {
                setSheet(null);
                goBackOrReplace("/management?tab=departure");
              }
            })();
          },
        }}
      >
        {!!error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 100, gap: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  essentialList: { gap: 10 },
  essentialCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 84,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.common.white,
    shadowColor: Colors.gray[9],
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  essentialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray[2],
    alignItems: "center",
    justifyContent: "center",
  },
  essentialCategory: {
    ...fonts.caption5_r_13,
    color: Colors.gray[6],
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.gray[2],
    borderRadius: 12,
    padding: 16,
    gap: 8,
    backgroundColor: Colors.common.white,
  },
  meta: { ...fonts.caption4_m_12, color: Colors.gray[6], marginTop: 4 },
  link: { ...fonts.caption1_sb_13, color: Colors.primary.default },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderRadius: 20,
    backgroundColor: Colors.gray[2],
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: Colors.gray[10] },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: Colors.gray[2],
  },
  lastListRow: { borderBottomWidth: 0 },
  badge: {
    ...fonts.caption4_m_12,
    color: Colors.gray[7],
    backgroundColor: Colors.gray[2],
    padding: 5,
    borderRadius: 4,
  },
  complete: {
    color: Colors.primary.default,
    backgroundColor: Colors.primary.light,
  },
  empty: { flex: 1, justifyContent: "center", minHeight: 240 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 18,
    marginBottom: 20,
    borderRadius: 16,
    backgroundColor: Colors.common.white,
    shadowColor: Colors.gray[9],
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.gray[2],
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: Colors.gray[10],
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingTop: 20,
  },
  summaryMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  typeBadge: {
    ...fonts.caption3_m_13,
    color: Colors.primary.default,
    backgroundColor: Colors.gray[2],
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  progressCircle: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  progressText: {
    ...fonts.sub4_sb_14,
    position: "absolute",
    color: Colors.primary.default,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: Colors.gray[1],
    marginTop: 8,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  summaryLabel: { ...fonts.body2_m_14, color: Colors.gray[8] },
  summaryValue: {
    ...fonts.body2_m_14,
    color: Colors.gray[10],
    flex: 1,
    textAlign: "right",
  },
  sectionTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  sectionActive: { borderColor: Colors.gray[10] },
  group: {
    borderWidth: 1,
    borderColor: Colors.gray[2],
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  item: { flexDirection: "row", alignItems: "center", minHeight: 48 },
  itemToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    flex: 1,
  },
  done: { color: Colors.gray[5], textDecorationLine: "line-through" },
  overlay: { flex: 1, justifyContent: "flex-end" },
  addItemSheet: { height: "92%" },
  sheetScroll: { flex: 1, minHeight: 0 },
  sheetScrollContent: { gap: 12, paddingBottom: 16 },
  sheetHandle: {
    width: 76,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.gray[4],
    alignSelf: "center",
    marginTop: -8,
    marginBottom: 4,
  },
  itemNameField: { marginTop: 24 },
  nameInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 8,
    paddingHorizontal: 14,
    gap: 12,
  },
  nameInput: {
    ...fonts.body2_m_14,
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
  },
  sheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  input: {
    ...fonts.body2_m_14,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  submit: { ...commonStyles.button, flex: 0, marginTop: 12 },
  error: { ...fonts.caption3_m_13, color: Colors.error.normal, padding: 8 },
});
