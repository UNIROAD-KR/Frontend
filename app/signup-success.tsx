import { router } from 'expo-router';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import ConsentIcon from '@/assets/icon/onboarding-consent.svg';
import ProfileIcon from '@/assets/icon/onboarding-profile.svg';

type OnboardingStepProps = {
  Icon: ComponentType<SvgProps>;
  iconSize: number;
  title: string;
  description: string;
};

function OnboardingStep({
  Icon,
  iconSize,
  title,
  description,
}: OnboardingStepProps) {
  return (
    <View style={styles.stepCard}>
      <Icon width={iconSize} height={iconSize} style={styles.stepIcon} />
      <View style={styles.stepTextWrap}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function SignupSuccessPage() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>온보딩 진행</Text>
        <Text style={styles.title}>
          회원가입 성공!{`\n`}시작 전 간단한 절차가 필요해요
        </Text>

        <View style={styles.steps}>
          <OnboardingStep
            Icon={ConsentIcon}
            iconSize={18}
            title="인증 서류 수집 및 이용 동의"
            description="개인정보 수집 및 이용 안내"
          />
          <OnboardingStep
            Icon={ProfileIcon}
            iconSize={22}
            title="프로필 설정"
            description="재학 학교 및 닉네임 설정"
          />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          pressed && styles.startButtonPressed,
        ]}
        onPress={() => router.replace('/onboarding/consent')}
      >
        <Text style={styles.startButtonText}>온보딩 시작하기</Text>
      </Pressable>
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
    paddingTop: 150,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    color: '#6B7684',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 36,
    color: '#0B0D10',
    marginBottom: 32,
  },
  steps: {
    gap: 8,
  },
  stepCard: {
    height: 87,
    borderWidth: 1,
    borderColor: '#E1E4E9',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 14,
  },
  stepIcon: {
    marginTop: 3,
  },
  stepTextWrap: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
    color: '#252C37',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    color: '#6B7684',
  },
  startButton: {
    position: 'absolute',
    right: 16,
    bottom: 52,
    left: 16,
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#191F28',
  },
  startButtonPressed: {
    backgroundColor: '#10151C',
  },
  startButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
