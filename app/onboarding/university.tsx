import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function UniversityPage() {
  const { nickname } = useLocalSearchParams<{ nickname?: string }>();
  const [university, setUniversity] = useState('');
  const [universityModalVisible, setUniversityModalVisible] = useState(false);

  const universities = [
    '서울대학교',
    '연세대학교',
    '고려대학교',
    '성균관대학교',
    '한양대학교',
    '중앙대학교',
    '경희대학교',
    '한국외국어대학교',
    '이화여자대학교',
    '건국대학교',
  ];
  const [status, setStatus] = useState<'preparing' | 'dispatched' | ''>('');

  const isValid = university !== '' && status !== '';
  const handleNext = async () => {
    if (!university) {
      return;
    }

    await AsyncStorage.setItem('university', university);

    router.push({
      pathname: '/onboarding/country',
      params: { nickname },
    });
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>‹</Text>
      </Pressable>

      <View style={styles.progressRow}>
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
        <View style={styles.progressActive} />
        <View style={styles.progress} />
        <View style={styles.progress} />
      </View>

      <Text style={styles.title}>
        소속대학과{'\n'}현재 본인의 상태를 알려주세요.
      </Text>

      <Text style={styles.subtitle}>현재 본인의 단계는 어디인가요?</Text>

      <Text style={styles.label}>소속대학</Text>

      <Pressable
        style={styles.selectBox}
        onPress={() => setUniversityModalVisible(true)}
      >
        <Text
          style={[styles.selectText, university && styles.selectTextActive]}
        >
          {university || '소속대학 선택'}
        </Text>

        <Text style={styles.chevron}>⌄</Text>
      </Pressable>

      <Text style={styles.statusLabel}>현재 상황</Text>

      <View style={styles.statusRow}>
        <Pressable
          style={[
            styles.statusCard,
            status === 'preparing' && styles.selectedCard,
          ]}
          onPress={() => setStatus('preparing')}
        >
          <Image
            source={require('../../assets/images/ready.png')}
            style={styles.statusImage}
          />
          <Text style={styles.statusText}>교환학생 준비 중</Text>
        </Pressable>

        <Pressable
          style={[
            styles.statusCard,
            status === 'dispatched' && styles.selectedCard,
          ]}
          onPress={() => setStatus('dispatched')}
        >
          <Text style={styles.emoji}>🧚</Text>
          <Text style={styles.statusText}>현재 파견 중</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.nextButton, isValid && styles.nextButtonActive]}
        disabled={!isValid}
        onPress={() => {
          if (status === 'preparing') {
            router.push({
              pathname: '/onboarding/country',
              params: { nickname },
            });
          } else if (status === 'dispatched') {
            router.push({
              pathname: '/onboarding/dispatched-country',
              params: { nickname },
            });
          }
        }}
      >
        <Text style={[styles.nextText, isValid && styles.nextTextActive]}>
          다음 (2/4)
        </Text>
      </Pressable>
      <Modal
        transparent
        visible={universityModalVisible}
        animationType="fade"
        onRequestClose={() => setUniversityModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setUniversityModalVisible(false)}
        >
          <Pressable style={styles.universityModal}>
            <Text style={styles.modalTitle}>소속대학 선택</Text>

            <ScrollView
              style={styles.universityScroll}
              showsVerticalScrollIndicator={false}
            >
              {universities.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.universityOption,
                    university === item && styles.universityOptionActive,
                  ]}
                  onPress={async () => {
                    setUniversity(item);
                    await AsyncStorage.setItem('university', item);
                    setUniversityModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.universityOptionText,
                      university === item && styles.universityOptionTextActive,
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
    </View>
  );
}

const BLUE = '#123F9F';

const styles = StyleSheet.create({
  statusImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginBottom: 6,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 52,
  },

  back: {
    fontSize: 38,
    color: '#000',
    marginBottom: 35,
  },

  progressRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 68,
  },

  progress: {
    flex: 1,
    height: 5,
    borderRadius: 10,
    backgroundColor: '#DDDDDD',
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
  },

  selectText: {
    fontSize: 14,
    color: '#999999',
  },

  selectTextActive: {
    color: '#111111',
  },

  chevron: {
    fontSize: 24,
    color: '#C4C4C4',
    marginTop: -10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  universityModal: {
    width: 260,
    maxHeight: 400,
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

  universityScroll: {
    maxHeight: 330,
  },

  universityOption: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  universityOptionActive: {
    backgroundColor: '#F2F5FF',
  },

  universityOptionText: {
    fontSize: 16,
    color: '#111111',
  },

  universityOptionTextActive: {
    color: '#123F9F',
    fontWeight: '900',
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
    color: '#000',
    marginBottom: 18,
  },

  subtitle: {
    fontSize: 13,
    color: '#B0B0B0',
    marginBottom: 42,
  },

  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },

  statusLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 48,
    marginBottom: 16,
  },

  statusRow: {
    flexDirection: 'row',
    gap: 12,
  },

  statusCard: {
    flex: 1,
    height: 78,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedCard: {
    borderColor: BLUE,
    borderWidth: 1.5,
  },

  emoji: {
    fontSize: 26,
    marginBottom: 6,
  },

  statusText: {
    fontSize: 13,
    color: '#111',
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
});
