import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';

const countries = [
  '독일',
  '프랑스',
  '스페인',
  '이탈리아',
  '미국',
  '영국',
  '일본',
  '캐나다',
  '호주',
  '네덜란드',
];

const regions = [
  '베를린',
  '뮌헨',
  '파리',
  '바르셀로나',
  '로마',
  '뉴욕',
  '런던',
  '도쿄',
  '토론토',
  '암스테르담',
];

export default function DispatchedCountryPage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();

  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [university, setUniversity] = useState('');

  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [regionModalVisible, setRegionModalVisible] = useState(false);

  const isValid =
    country.length > 0 && region.length > 0 && university.trim().length > 0;

  const handleNext = async () => {
    if (!isValid) return;

    await AsyncStorage.setItem('dispatchedCountry', country);
    await AsyncStorage.setItem('dispatchedRegion', region);
    await AsyncStorage.setItem('dispatchedUniversity', university.trim());

    router.push({
      pathname: '/onboarding/dispatched-interests',
      params: { nickname },
    } as any);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AppBackButton style={styles.backButton} />

        <View style={styles.progressRow}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progress} />
        </View>

        <Text style={styles.title}>현재 파견 중인{'\n'}지역이 어디인가요?</Text>

        <Text style={styles.subtitle}>파견 중인 지역을 알려주세요.</Text>

        <Text style={styles.label}>파견 국가</Text>

        <Pressable
          style={styles.selectBox}
          onPress={() => setCountryModalVisible(true)}
        >
          <Text style={[styles.selectText, country && styles.selectTextActive]}>
            {country || '파견 국가 선택'}
          </Text>
          <Text style={styles.chevron}>⌄</Text>
        </Pressable>

        <Text style={styles.label}>파견 지역</Text>

        <Pressable
          style={styles.selectBox}
          onPress={() => setRegionModalVisible(true)}
        >
          <Text style={[styles.selectText, region && styles.selectTextActive]}>
            {region || '파견 지역 선택'}
          </Text>
          <Text style={styles.chevron}>⌄</Text>
        </Pressable>

        <Text style={styles.label}>파견 대학</Text>

        <View style={styles.universityInputBox}>
          <TextInput
            style={styles.universityInput}
            placeholder="파견 대학 입력"
            placeholderTextColor="#333333"
            value={university}
            onChangeText={setUniversity}
          />

          {university.length > 0 && (
            <Pressable onPress={() => setUniversity('')}>
              <Image
                source={require('../../assets/images/x.png')}
                style={styles.clearIcon}
              />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.nextButton, isValid && styles.nextButtonActive]}
          disabled={!isValid}
          onPress={handleNext}
        >
          <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
            다음 (3/4)
          </Text>
        </Pressable>
      </ScrollView>

      <SelectModal
        visible={countryModalVisible}
        title="파견 국가 선택"
        data={countries}
        selectedValue={country}
        onClose={() => setCountryModalVisible(false)}
        onSelect={(value) => {
          setCountry(value);
          setCountryModalVisible(false);
        }}
      />

      <SelectModal
        visible={regionModalVisible}
        title="파견 지역 선택"
        data={regions}
        selectedValue={region}
        onClose={() => setRegionModalVisible(false)}
        onSelect={(value) => {
          setRegion(value);
          setRegionModalVisible(false);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function SelectModal({
  visible,
  title,
  data,
  selectedValue,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  data: string[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalBox}>
          <Text style={styles.modalTitle}>{title}</Text>

          <ScrollView
            style={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {data.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.modalOption,
                  selectedValue === item && styles.modalOptionActive,
                ]}
                onPress={() => onSelect(item)}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedValue === item && styles.modalOptionTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 42,
    paddingBottom: 36,
  },

  backButton: {
    marginBottom: 36,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 76,
  },

  progress: {
    flex: 1,
    height: 5,
    borderRadius: 10,
    backgroundColor: '#DDDDDD',
  },

  progressActive: {
    flex: 1,
    height: 5,
    borderRadius: 10,
    backgroundColor: BLUE,
  },

  title: {
    fontSize: 25,
    lineHeight: 36,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 18,
  },

  subtitle: {
    fontSize: 13,
    color: '#B0B0B0',
    marginBottom: 62,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 12,
  },

  selectBox: {
    height: 46,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 5,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 42,
  },

  selectText: {
    fontSize: 14,
    color: '#333333',
  },

  selectTextActive: {
    color: '#111111',
    fontWeight: '600',
  },

  chevron: {
    fontSize: 24,
    color: '#C4C4C4',
    marginTop: -6,
  },

  universityInputBox: {
    height: 45,
    borderBottomWidth: 2,
    borderBottomColor: '#CFCFCF',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 82,
  },

  universityInput: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
    paddingVertical: 0,
  },

  clearIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    marginLeft: 8,
  },

  nextButton: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 36,
    height: 53,
    borderRadius: 5,
    backgroundColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextButtonActive: {
    backgroundColor: BLUE,
  },

  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9A9A9A',
  },

  nextTextActive: {
    color: '#FFFFFF',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalBox: {
    width: 250,
    maxHeight: 380,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 10,
  },

  modalScroll: {
    maxHeight: 310,
  },

  modalOption: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalOptionActive: {
    backgroundColor: '#F2F5FF',
  },

  modalOptionText: {
    fontSize: 16,
    color: '#111111',
  },

  modalOptionTextActive: {
    color: BLUE,
    fontWeight: '900',
  },
});
