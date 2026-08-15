import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';

function ProgressStep({ label, active }: { label: string; active?: boolean }) {
  return (
    <View style={[styles.progressStep, active && styles.progressStepActive]}>
      <Text style={[styles.progressStepText, active && styles.progressStepTextActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function OnboardingConsentPage() {
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    if (!agreed) return;

    router.push('/onboarding/profile-setup');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppBackButton fallbackHref="/signup-success" style={styles.backButton} />
          <Text style={styles.headerTitle}>교환학생 인증 동의</Text>
        </View>

        <View style={styles.progressRow}>
          <ProgressStep label="1" active />
          <View style={styles.progressLine} />
          <ProgressStep label="2" />
        </View>

        <Text style={styles.title}>인증 서류 수집 및 이용 동의</Text>
        <Text style={styles.subtitle}>
          서류 업로드 전 개인정보 수집 및 이용 내용을 확인해주세요.
        </Text>

        <View style={styles.termsCard}>
          <ScrollView
            contentContainerStyle={styles.termsContent}
            showsVerticalScrollIndicator
            persistentScrollbar
          >
            <Text style={styles.termsText}>
              UNIROAD는 교환학생 본인 확인을 위해 아래와 같이{`\n`}
              인증 서류 및 관련 정보를 수집 및 이용합니다.
            </Text>

            <Text style={styles.termsHeading}>수집 목적</Text>
            <Text style={styles.termsText}>
              • 교환학생 신분 확인 및 파견 사실 검증{`\n`}
              • 중고거래 등 신뢰 기반 서비스 제공을 위한 본인인증
            </Text>

            <Text style={styles.termsHeading}>수집 항목</Text>
            <Text style={styles.termsText}>
              파견 대학 입학허가서 또는 재학 대학 파견 승인서 중 1종{`\n`}
              (서류 내 성명, 소속 학교, 파견 기간 등 정보 포함)
            </Text>

            <Text style={styles.termsHeading}>보유 및 이용 기간</Text>
            <Text style={styles.termsText}>
              인증 심사 완료 즉시 서류 원본은 파기하며, 인증결과값{`\n`}
              (인증 여부)만 회원 탈퇴 시까지 보관합니다.
            </Text>

            <Text style={styles.termsHeading}>제3자 제공 여부</Text>
            <Text style={styles.termsText}>
              제공하지 않음 (인증 심사 목적으로만 내부에서 이용)
            </Text>

            <Text style={styles.termsHeading}>동의 거부 권리 및 불이익</Text>
            <Text style={styles.termsText}>
              동의하지 않을 경우 본인인증이 필요한 기능 (중고거래 등)의{`\n`}
              이용이 제한됩니다.
            </Text>
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.bottomArea}>
        <Pressable
          style={styles.agreeRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          onPress={() => setAgreed((value) => !value)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
          </View>
          <Text style={styles.agreeText}>인증 서류 및 관련 정보 수집·이용에 동의합니다.</Text>
        </Pressable>

        <Pressable
          style={[styles.continueButton, !agreed && styles.continueButtonDisabled]}
          disabled={!agreed}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>동의하고 계속하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 58,
    paddingBottom: 190,
  },
  header: {
    height: 38,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
  },
  headerTitle: {
    color: '#252C37',
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
    textAlign: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  progressStep: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9DFE7',
  },
  progressStepActive: {
    backgroundColor: '#3A4655',
  },
  progressStepText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  progressStepTextActive: {
    color: '#FFFFFF',
  },
  progressLine: {
    width: 24,
    height: 1,
    backgroundColor: '#D9DFE7',
  },
  title: {
    color: '#101318',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7684',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  termsCard: {
    height: 360,
    marginTop: 26,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  termsContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
  },
  termsHeading: {
    color: '#252C37',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 6,
  },
  termsText: {
    color: '#4E5968',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  bottomArea: {
    position: 'absolute',
    right: 16,
    bottom: 52,
    left: 16,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 22,
    marginBottom: 56,
    paddingHorizontal: 3,
  },
  checkbox: {
    width: 18,
    height: 18,
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#B7C0CB',
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    borderColor: '#4F63FF',
    backgroundColor: '#4F63FF',
  },
  agreeText: {
    flex: 1,
    color: '#4E5968',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  continueButton: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191F28',
  },
  continueButtonDisabled: {
    backgroundColor: '#B3BDC9',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
