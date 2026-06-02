import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#737373';
const LINE = '#E5E7EB';

type FieldKey = 'nickname' | 'homeUniversity' | 'country' | 'dispatchedUniversity';

const COUNTRY_GROUPS = {
  유럽권: ['독일', '프랑스', '체코', '스페인', '이탈리아', '네덜란드', '영국'],
  미주권: ['미국', '캐나다'],
  아시아권: ['일본', '중국', '대만', '싱가포르', '홍콩'],
  기타: ['호주', '뉴질랜드'],
} as const;

const fieldConfig: Record<
  FieldKey,
  {
    title: string;
    label: string;
    placeholder: string;
    helpText: string;
    buttonText: string;
    storageKeys: string[];
  }
> = {
  nickname: {
    title: '닉네임 설정',
    label: '닉네임',
    placeholder: '닉네임을 입력하세요',
    helpText: '※ 사용할 닉네임을 입력해주세요',
    buttonText: '저장하기',
    storageKeys: ['nickname'],
  },
  homeUniversity: {
    title: '소속 대학 설정',
    label: '소속 대학',
    placeholder: '소속 대학을 입력하세요',
    helpText: '※ 정확한 학교명을 입력하면 맞춤 정보를 더 잘 받을 수 있습니다.',
    buttonText: '변경하기',
    storageKeys: ['homeUniversity', 'university'],
  },
  country: {
    title: '파견 국가 및 지역 설정',
    label: '파견 국가 및 지역',
    placeholder: '파견 국가 선택',
    helpText: '※ 파견 국가와 지역은 홈 화면과 프로필에 함께 표시됩니다.',
    buttonText: '선택 완료',
    storageKeys: ['dispatchedCountry'],
  },
  dispatchedUniversity: {
    title: '파견교 설정',
    label: '파견교',
    placeholder: '파견교를 입력하세요',
    helpText: '※ 파견교를 설정하면 학교별 정보를 더 쉽게 확인할 수 있습니다.',
    buttonText: '선택 완료',
    storageKeys: ['dispatchedUniversity'],
  },
};

export default function ProfileFieldEditScreen() {
  const { field, value, region } = useLocalSearchParams<{
    field?: string;
    value?: string;
    region?: string;
  }>();
  const safeField: FieldKey =
    field === 'homeUniversity' ||
    field === 'country' ||
    field === 'dispatchedUniversity' ||
    field === 'nickname'
      ? field
      : 'nickname';
  const config = fieldConfig[safeField];
  const initialValue = useMemo(() => (typeof value === 'string' ? value : ''), [value]);
  const initialRegion = useMemo(() => (typeof region === 'string' ? region : ''), [region]);
  const [draft, setDraft] = useState(initialValue);
  const [regionDraft, setRegionDraft] = useState(initialRegion);
  const [countrySheetVisible, setCountrySheetVisible] = useState(false);
  const [selectedCountryGroup, setSelectedCountryGroup] =
    useState<keyof typeof COUNTRY_GROUPS>('유럽권');

  const trimmedDraft = draft.trim();
  const trimmedRegion = regionDraft.trim();
  const canSave =
    safeField === 'country'
      ? trimmedDraft.length > 0 &&
        (trimmedDraft !== initialValue.trim() || trimmedRegion !== initialRegion.trim())
      : trimmedDraft.length > 0 && trimmedDraft !== initialValue.trim();

  const saveField = async () => {
    Keyboard.dismiss();

    if (!canSave) return;

    const savedOverrides = await AsyncStorage.getItem('profileFieldOverrides');
    const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};

    const storageTasks = config.storageKeys.map((key) => AsyncStorage.setItem(key, trimmedDraft));

    if (safeField === 'country') {
      storageTasks.push(AsyncStorage.setItem('dispatchedRegion', trimmedRegion));
    }

    await Promise.all([
      ...storageTasks,
      AsyncStorage.setItem(
        'profileFieldOverrides',
        JSON.stringify({
          ...overrides,
          [safeField]: true,
          ...(safeField === 'country' ? { region: true } : {}),
        }),
      ),
    ]);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Pressable style={styles.mainArea} onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{config.title}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="close" size={22} color={INK} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {safeField === 'country' ? (
            <>
              <Text style={styles.label}>파견 국가</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  Keyboard.dismiss();
                  setCountrySheetVisible(true);
                }}
                activeOpacity={0.84}
              >
                <Text style={[styles.selectText, !trimmedDraft && styles.selectPlaceholder]}>
                  {trimmedDraft || config.placeholder}
                </Text>
                <Ionicons name="chevron-down" size={18} color={MUTED} />
              </TouchableOpacity>

              <Text style={[styles.label, styles.regionLabel]}>파견 지역</Text>
              <TextInput
                style={styles.input}
                value={regionDraft}
                onChangeText={setRegionDraft}
                placeholder="파견 지역을 입력하세요"
                placeholderTextColor="#A4ADBA"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>{config.label}</Text>
              <TextInput
                style={styles.input}
                value={draft}
                onChangeText={setDraft}
                placeholder={config.placeholder}
                placeholderTextColor="#A4ADBA"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </>
          )}
          <Text style={styles.helpText}>{config.helpText}</Text>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.ctaButton, !canSave && styles.ctaButtonDisabled]}
          onPress={saveField}
          activeOpacity={canSave ? 0.88 : 1}
          disabled={!canSave}
        >
          <Text style={[styles.ctaText, !canSave && styles.ctaTextDisabled]}>
            {config.buttonText}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={countrySheetVisible}
        animationType="slide"
        onRequestClose={() => setCountrySheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setCountrySheetVisible(false)}
        >
          <TouchableOpacity
            style={styles.sheet}
            activeOpacity={1}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>파견 국가 선택</Text>
              <TouchableOpacity onPress={() => setCountrySheetVisible(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color={INK} />
              </TouchableOpacity>
            </View>

            <View style={styles.countrySheetBody}>
              <View style={styles.countryGroupColumn}>
                {(Object.keys(COUNTRY_GROUPS) as (keyof typeof COUNTRY_GROUPS)[]).map((group) => {
                  const active = selectedCountryGroup === group;

                  return (
                    <TouchableOpacity
                      key={group}
                      style={[styles.countryGroupItem, active && styles.countryGroupItemActive]}
                      onPress={() => setSelectedCountryGroup(group)}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.countryGroupText, active && styles.countryGroupTextActive]}>
                        {group}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <ScrollView style={styles.countryDetailColumn}>
                {COUNTRY_GROUPS[selectedCountryGroup].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.countryOption}
                    onPress={() => {
                      setDraft(option);
                      setCountrySheetVisible(false);
                    }}
                    activeOpacity={0.78}
                  >
                    <Text
                      style={[
                        styles.countryOptionText,
                        trimmedDraft === option && styles.countryOptionTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                    {trimmedDraft === option && (
                      <Ionicons name="checkmark" size={18} color={BLUE} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainArea: {
    flex: 1,
  },
  header: {
    minHeight: 98,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 17,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: INK,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    bottom: 9,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '900',
    color: MUTED,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  regionLabel: {
    marginTop: 14,
  },
  selectButton: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: INK,
  },
  selectPlaceholder: {
    color: '#A4ADBA',
  },
  helpText: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    color: MUTED,
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
  },
  sheet: {
    maxHeight: '68%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D8DEE8',
    marginBottom: 12,
  },
  sheetHeader: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: INK,
  },
  countrySheetBody: {
    minHeight: 250,
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: '#F7F8FA',
    overflow: 'hidden',
  },
  countryGroupColumn: {
    width: 104,
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  countryGroupItem: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  countryGroupItemActive: {
    backgroundColor: '#FFFFFF',
  },
  countryGroupText: {
    fontSize: 13,
    fontWeight: '800',
    color: MUTED,
  },
  countryGroupTextActive: {
    color: BLUE,
  },
  countryDetailColumn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  countryOption: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  countryOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  countryOptionTextActive: {
    color: BLUE,
    fontWeight: '900',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
  },
  ctaButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonDisabled: {
    backgroundColor: '#D8DEE8',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  ctaTextDisabled: {
    color: '#8B95A1',
  },
});
