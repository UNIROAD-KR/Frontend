import { PackingEmptyState } from "@/components/management/packing-empty-state";
import CheckboxIcon from "@/assets/icon/checkbox.svg";
import ArrowRightIcon from "@/assets/icon/arrow-right.svg";
import CheckboxEmptyIcon from "@/assets/icon/checkbox-empty.svg";
import { Modal } from "@/components/ui/modal";
import { PopoverMenu } from "@/components/ui/popover-menu";
import EditIcon from "@/assets/icon/edit.svg";
import DeleteIcon from "@/assets/icon/delete.svg";
import XIcon from "@/assets/icon/x-icon.svg";
import PlusIcon from "@/assets/icon/plus-line.svg";
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
  type PreparationGroup,
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
import { CountryFlag } from "../ui/country-flag";

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
  const [essentialsOpen, setEssentialsOpen] = useState(false);
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
  const [category, setCategory] = useState("custom");
  const [itemTitle, setItemTitle] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [pendingGroups, setPendingGroups] = useState<PreparationGroup[]>([]);
  const list = lists.find((entry) => entry.id === preparationId);
  const isTravelPackingEmpty =
    list?.scheduleType === "여행" &&
    !list.groups.some((group) => group.items.length > 0);
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
      setEssentialsOpen(false);
      void load();
    }, [load, preparationId]),
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
  const newGroups = pendingGroups.filter(
    (pending) => !list?.groups.some((group) => group.id === pending.id),
  );
  const categoryOptions = [...(list?.groups ?? []), ...newGroups];
  const draftTitle = itemTitle.trim();
  const draftCategoryTitle = customCategory.trim();
  const canStageItem = !!draftTitle && (category === "custom"
    ? !!draftCategoryTitle
    : categoryOptions.some((group) => group.id === category));
  const pendingCount = pendingGroups.reduce((count, group) => count + group.items.length, 0);
  const canSaveItems = !saving && pendingCount > 0;

  const openItemSheet = (initialCategory: string) => {
    setCategory(initialCategory);
    setItemTitle("");
    setCustomCategory("");
    setPendingGroups([]);
    setError("");
    setSheet("item");
  };

  const stageDraft = () => {
    const selectedGroup = categoryOptions.find((group) =>
      category === "custom" ? group.title === draftCategoryTitle : group.id === category,
    );
    const id = selectedGroup?.id ?? makeId();
    const title = selectedGroup?.title ?? draftCategoryTitle;
    const item: PreparationItem = { id: makeId(), title: draftTitle, done: false };
    const pending = pendingGroups.find((group) => group.id === id);
    return {
      id,
      groups: pending
        ? pendingGroups.map((group) =>
            group.id === id ? { ...group, items: [...group.items, item] } : group,
          )
        : [...pendingGroups, { id, title, items: [item] }],
    };
  };

  const addPendingItem = () => {
    if (!canStageItem || saving) return;
    const next = stageDraft();
    setPendingGroups(next.groups);
    setCategory(next.id);
    setCustomCategory("");
    setItemTitle("");
    setError("");
  };

  const removePendingItem = (group: PreparationGroup, itemId: string) => {
    const items = group.items.filter((item) => item.id !== itemId);
    setPendingGroups((current) => current.flatMap((entry) => {
      if (entry.id !== group.id) return [entry];
      return items.length ? [{ ...entry, items }] : [];
    }));
    if (!items.length && category === group.id && newGroups.some((entry) => entry.id === group.id)) {
      setCategory("custom");
      setCustomCategory(group.title);
    }
  };

  const addItems = async () => {
    if (!list || !canSaveItems || busy.current) return;
    const additions = pendingGroups;
    const itemsByGroup = new Map(additions.map((group) => [group.id, group.items]));
    const existingGroups = list.groups.map((group) => {
      const items = itemsByGroup.get(group.id);
      return items ? { ...group, items: [...group.items, ...items] } : group;
    });
    const createdGroups = additions.filter(
      ({ id }) => !list.groups.some((group) => group.id === id),
    );
    if (await update({ ...list, groups: [...createdGroups, ...existingGroups] })) {
      setOpenGroups((previous) => ({
        ...previous,
        ...Object.fromEntries(additions.map(({ id }) => [id, true])),
      }));
      setPendingGroups([]);
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
  const renderItem = (item: PreparationItem, groupId?: string) => (
    <View key={item.id} style={s.item}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.done, disabled: saving }}
        disabled={saving}
        onPress={() => toggleItem(item.id, groupId)}
        style={s.itemToggle}
      >
        {item.done ? (
          <CheckboxIcon width={24} height={24} />
        ) : (
          <CheckboxEmptyIcon width={24} height={24} />
        )}
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
              <View style={s.summaryText}>
                <Text
                  style={[fonts.title3_b_24, { color: Colors.common.black }]}
                >
                  {list.title}
                </Text>

                <View style={s.summaryMeta}>
                  <Text style={[fonts.body4_r_14, { color: Colors.gray[7] }]}>
                    {formatRegisteredAt(list.createdAt)}
                  </Text>
                  <Text style={s.typeBadge}>{list.scheduleType ?? "여행"}</Text>
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
              <Text style={[fonts.sub2_m_18, s.flex]}>짐싸기</Text>
              <Pressable
                disabled={saving}
                onPress={() => openItemSheet(list.groups[0]?.id ?? "custom")}
              >
                <Text style={s.link}>추가하기</Text>
              </Pressable>
            </View>
            {list.scheduleType === "파견" && list.essentials.length > 0 && (
              <View style={s.group}>
                <Pressable
                  style={s.groupHeader}
                  accessibilityRole="button"
                  accessibilityState={{
                    expanded: essentialsOpen,
                  }}
                  onPress={() => setEssentialsOpen((previous) => !previous)}
                >
                  <View style={s.flex}>
                    <Text style={fonts.sub4_sb_14}>필수 준비물</Text>
                    <Text style={s.meta}>
                      {list.essentials.filter((item) => item.done).length}/
                      {list.essentials.length}
                    </Text>
                  </View>

                  <Ionicons
                    name={essentialsOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={Colors.gray[7]}
                  />
                </Pressable>
                {essentialsOpen && (
                  <>
                    <Pressable
                      disabled={saving}
                      onPress={() =>
                        void update({
                          ...list,
                          essentials: list.essentials.map((item) => ({
                            ...item,
                            done: !list.essentials.every((entry) => entry.done),
                          })),
                        })
                      }
                    >
                      <Text style={s.link}>
                        {list.essentials.every((item) => item.done)
                          ? "전체 해제"
                          : "전체 선택"}
                      </Text>
                    </Pressable>
                    {list.essentials.map((item) => renderItem(item))}
                  </>
                )}
              </View>
            )}
            {isTravelPackingEmpty && (
              <PackingEmptyState
                disabled={saving}
                onAdd={() => openItemSheet("custom")}
              />
            )}
            {!list.groups.length &&
              list.scheduleType !== "파견" &&
              !isTravelPackingEmpty && (
                <Text style={s.meta}>준비물을 추가해주세요.</Text>
              )}
            {!isTravelPackingEmpty &&
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
                        <Text
                          style={{
                            ...fonts.caption5_r_13,
                            color: Colors.gray[6],
                            marginBottom: 14,
                          }}
                        >
                          준비물을 추가해주세요.
                        </Text>
                      )}
                    </>
                  )}
                </View>
              ))}
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
                  <CountryFlag
                    country={recent.country}
                    width={32}
                    height={32}
                    style={{ borderRadius: 10 }}
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
                <Text style={s.link}>준비 중 일정</Text>
                <Text style={[fonts.sub1_sb_18, { marginTop: 2 }]}>
                  {recent ? (
                    <>
                      {recent.title}{" "}
                      <Text
                        style={{ color: Colors.primary.default, marginLeft: 4 }}
                      >{`${progress(recent).percent}%`}</Text>
                    </>
                  ) : (
                    "준비 중 일정이 없습니다"
                  )}
                </Text>
                <Text
                  style={[
                    fonts.caption5_r_13,
                    { color: Colors.gray[7], marginTop: 4 },
                  ]}
                >
                  {recent
                    ? "유니로드와 출국 준비를 이어가세요!"
                    : "유니로드와 출국 준비 해봐요!"}
                </Text>
              </View>
              <ArrowRightIcon width={24} height={24} color={Colors.gray[8]} />
            </Pressable>
            <View style={{ gap: 8 }}>
              <Text style={fonts.title5_b_20}>지난 일정 기록</Text>
              <View style={s.chips}>
                {["전체", "완료", "준비 중"].map((title) =>
                  chip(title, filter === title, () => setFilter(title)),
                )}
              </View>
              {filtered.length ? (
                <View>
                  {[...filtered]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((entry, index) => (
                      <View key={entry.id}>
                        <Pressable
                          style={[s.listRow]}
                          onPress={() =>
                            router.push({
                              pathname: "/departure-preparation",
                              params: { id: entry.id },
                            })
                          }
                        >
                          <CountryFlag
                            country={entry.country}
                            width={32}
                            height={32}
                          />
                          <View style={s.flex}>
                            <Text style={fonts.sub3_sb_16}>{entry.title}</Text>
                            <Text
                              style={[
                                fonts.caption6_r_12,
                                { color: Colors.gray[7], marginTop: 4 },
                              ]}
                            >
                              {entry.country} · {entry.scheduleType}
                            </Text>
                          </View>
                          <Text
                            style={[
                              s.badge,
                              progress(entry).percent === 100 && s.complete,
                            ]}
                          >
                            {progress(entry).percent === 100
                              ? "완료"
                              : "준비 중"}
                          </Text>
                        </Pressable>
                        {index !== filtered.length - 1 && (
                          <View
                            style={{
                              height: 1,
                              backgroundColor: Colors.gray[2],
                            }}
                          />
                        )}
                      </View>
                    ))}
                </View>
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
            </View>
          </>
        )}
      </ScrollView>
      {!list && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="출국 준비 목록 추가"
          onPress={() => void openCreate()}
          style={commonStyles.fab}
        >
          <PlusIcon />
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
                <XIcon
                  style={{ width: 24, height: 24 }}
                  color={Colors.common.black}
                />
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
                  {categoryOptions.length > 0 && (
                    <View style={s.chips}>
                      {chip("직접 추가", category === "custom", () =>
                        setCategory("custom"),
                      )}
                      {categoryOptions.map((group) =>
                        chip(group.title, category === group.id, () =>
                          setCategory(group.id),
                        ),
                      )}
                    </View>
                  )}
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
                        onSubmitEditing={addPendingItem}
                        returnKeyType="done"
                        placeholder="이름을 입력해주세요"
                        maxLength={20}
                        style={s.nameInput}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="준비물 담기"
                        disabled={saving || !canStageItem}
                        hitSlop={8}
                        onPress={addPendingItem}
                      >
                        <Text style={[fonts.body2_m_14, { color: canStageItem && !saving ? Colors.primary.default : Colors.gray[5] }]}>
                          담기
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                  {pendingCount > 0 && (
                    <View style={s.pendingList}>
                      <Text style={fonts.sub4_sb_14}>담은 준비물 {pendingCount}개</Text>
                      {pendingGroups.map((group) => (
                        <View key={group.id} style={s.pendingGroup}>
                          <Text style={s.pendingCategory}>{group.title}</Text>
                          {group.items.map((item) => (
                            <View key={item.id} style={s.pendingItem}>
                              <Text style={[fonts.body2_m_14, s.flex]}>{item.title}</Text>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`${item.title} 빼기`}
                                disabled={saving}
                                hitSlop={6}
                                onPress={() => removePendingItem(group, item.id)}
                              >
                                <Ionicons name="close" size={18} color={Colors.gray[7]} />
                              </Pressable>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}
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
              disabled={!canSaveItems}
              accessibilityRole="button"
              style={[s.submit, !canSaveItems && { opacity: 0.4 }]}
              onPress={() => void addItems()}
            >
              <Text style={[fonts.sub3_sb_16, { color: Colors.common.white }]}>
                {saving ? "저장 중…" : pendingCount > 0
                  ? `${pendingCount}개 추가하기`
                  : "추가하기"}
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
  content: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 20, gap: 16 },
  row: { flexDirection: "row", alignItems: "center", marginTop: 20, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: Colors.gray[2],
    borderRadius: 12,
    padding: 16,
    gap: 8,
    backgroundColor: Colors.common.white,
  },
  meta: { ...fonts.caption4_m_12, color: Colors.gray[6], marginTop: 4 },
  link: { ...fonts.caption4_m_12, color: Colors.primary.default },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderRadius: 100,
    backgroundColor: Colors.gray[1],
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: Colors.gray[11] },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18, // 14가 맞지만 국기 아이콘이 현재 확정 x
    paddingRight: 12,
    paddingLeft: 4, // 마찬가지로 국기 아이콘 때문에
    paddingVertical: 16,
  },
  badge: {
    ...fonts.caption1_sb_13,
    color: Colors.gray[7],
    backgroundColor: Colors.gray[2],
    paddingHorizontal: 8,
    paddingVertical: 4,
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 20,
    borderRadius: 12,
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
    borderRadius: 1000,
    backgroundColor: Colors.gray[1],
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
    justifyContent: "space-between",
    gap: 16,
    paddingTop: 20,
  },
  summaryText: { flex: 1, minWidth: 0 },
  summaryMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  typeBadge: {
    ...fonts.caption4_m_12,
    color: Colors.primary.default,
    backgroundColor: "#EAF3FF",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  progressCircle: {
    flexShrink: 0,
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    ...fonts.sub4_sb_14,
    position: "absolute",
    color: Colors.primary.default,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
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
  itemNameField: { marginTop: 12 },
  pendingList: { gap: 10, marginTop: 8 },
  pendingGroup: { borderRadius: 8, backgroundColor: Colors.gray[1], paddingHorizontal: 12, paddingVertical: 8 },
  pendingCategory: { ...fonts.caption3_m_13, color: Colors.gray[7], marginBottom: 2 },
  pendingItem: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 12 },
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
