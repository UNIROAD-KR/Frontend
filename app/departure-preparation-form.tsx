import { CountrySelectionSheet } from "@/components/ui/country-selection-sheet";
import { AppBackButton } from '@/components/ui/app-back-button';
import { Text } from '@/components/ui/app-text';
import CalendarModal from '@/components/ui/calendar';
import CalendarFillIcon from '@/assets/icon/calendar-fill.svg';
import { FieldLabel } from '@/components/ui/field-label';
import InputField from '@/components/ui/input-field';
import { Colors, commonStyles, fonts } from '@/constants/theme';
import { createPreparation, loadPreparations, savePreparations, SCHEDULE_TYPES, type ScheduleType } from '@/src/storage/departurePreparations';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export default function DeparturePreparationFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [title, setTitle] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('여행');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [countryVisible, setCountryVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void loadPreparations().then(lists => {
      if (!active) return;
      const list = lists.find(entry => entry.id === id);
      if (!list) { setLoadError('일정을 찾을 수 없어요.'); return; }
      setTitle(list.title);
      setScheduleType(list.scheduleType ?? '학업');
      setCountry(list.country);
      setRegion(list.region ?? '');
      setDepartureDate(list.departureDate);
    }).catch(() => { if (active) setLoadError('일정을 불러오지 못했어요. 다시 열어주세요.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const valid = !!title.trim() && !!scheduleType && !!country.trim() && !!departureDate && !loading && !loadError;
  const submit = async () => {
    if (busy.current || !valid) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const lists = await loadPreparations();
      const fields = { title: title.trim(), scheduleType, country, region: region.trim(), departureDate };
      if (id) {
        if (!lists.some(list => list.id === id)) throw new Error('missing');
        await savePreparations(lists.map(list => list.id === id ? { ...list, ...fields } : list));
        router.back();
      } else {
        const list = createPreparation({ ...fields, university: '' });
        await savePreparations([...lists, list]);
        router.dismissTo('/management?tab=departure');
      }
    } catch {
      setError('일정을 저장하지 못했어요. 다시 시도해주세요.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.header}>
        <View style={styles.headerSide}><AppBackButton fallbackHref="/management?tab=departure" /></View>
        <Text style={fonts.sub3_sb_16}>출국 일정 {id ? '수정' : '등록'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={id ? '일정 저장하기' : '일정 등록하기'} accessibilityState={{ disabled: !valid || saving }} disabled={!valid || saving} onPress={() => void submit()} style={styles.headerSide}>
          <Text style={[fonts.body1_m_16, styles.action, (!valid || saving) && styles.actionDisabled]}>{saving ? '저장 중' : id ? '저장하기' : '등록하기'}</Text>
        </Pressable>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 32 }} color={Colors.primary.default} /> : loadError ? <Text style={styles.error}>{loadError}</Text> : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <View style={styles.field}>
              <FieldLabel title="일정 이름" marginBottom={6} />
              <InputField value={title} onChangeText={setTitle} maxLength={80} placeholder="일정 이름을 입력해주세요" size="sm" accessibilityLabel="일정 이름" />
            </View>
            <View style={styles.field}>
              <FieldLabel title="일정 유형" marginBottom={6} />
              <View style={styles.types}>{SCHEDULE_TYPES.map(type => (
                <Pressable key={type} accessibilityRole="button" accessibilityState={{ selected: type === scheduleType }} onPress={() => setScheduleType(type)} style={[styles.chip, type === scheduleType && styles.selectedChip]}>
                  <Text style={[fonts.body2_m_14, { color: type === scheduleType ? Colors.common.white : Colors.gray[7] }]}>{type}</Text>
                </Pressable>
              ))}</View>
            </View>
            <View style={styles.field}>
              <FieldLabel title="국가 및 지역" marginBottom={6} />
              <Pressable style={styles.select} accessibilityRole="button" accessibilityLabel="국가 및 지역 선택" onPress={() => { Keyboard.dismiss(); setCountryVisible(true); }}>
                <Text style={[fonts.body1_m_16, { color: country ? Colors.gray[11] : Colors.gray[5], flex: 1 }]}>{country || '국가 및 지역을 선택해주세요'}</Text>
                <Ionicons name="chevron-down" size={22} color={Colors.gray[11]} />
              </Pressable>
              {!!country && <InputField value={region} onChangeText={setRegion} maxLength={80} placeholder="도시 / 지역을 입력해주세요 (선택)" size="sm" accessibilityLabel="도시 및 지역" style={{ marginTop: 8 }} />}
            </View>
            <View style={styles.field}>
              <FieldLabel title="출국일" marginBottom={6} />
              <Pressable style={styles.select} accessibilityRole="button" accessibilityLabel="출국일 선택" onPress={() => { Keyboard.dismiss(); setCalendarVisible(true); }}>
                <Text style={[fonts.body1_m_16, { color: departureDate ? Colors.gray[11] : Colors.gray[5] }]}>{departureDate ? departureDate.replaceAll('-', '.') : '날짜를 입력해주세요'}</Text>
                <CalendarFillIcon width={22} height={22} color={Colors.gray[5]} />
              </Pressable>
            </View>
            {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
      <CountrySelectionSheet visible={countryVisible} allowAll={false} selectedCountry={country} onClose={() => setCountryVisible(false)} onSelect={value => { setCountry(value); if (value !== country) setRegion(''); setCountryVisible(false); }} />
      <CalendarModal visible={calendarVisible} value={departureDate ? new Date(`${departureDate}T00:00:00`) : undefined} onClose={() => setCalendarVisible(false)} onSelect={date => { setDepartureDate(localDate(date)); setCalendarVisible(false); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { ...commonStyles.header, paddingHorizontal: 16 },
  headerSide: { width: 68 },
  action: { color: Colors.primary.default, textAlign: 'right' },
  actionDisabled: { color: Colors.gray[5] },
  content: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 40, gap: 28 },
  field: { gap: 0 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 24, backgroundColor: Colors.gray[1] },
  selectedChip: { backgroundColor: Colors.gray[10] },
  select: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: Colors.gray[3], borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  error: { ...fonts.caption3_m_13, color: Colors.error.normal, padding: 16 },
});
