import { Text } from '@/components/ui/app-text';
import { router } from "expo-router";
import type { ComponentType } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import type { SvgProps } from "react-native-svg";

import ConsentIcon from "@/assets/icon/onboarding-consent.svg";
import ProfileIcon from "@/assets/icon/onboarding-profile.svg";
import { Colors, fonts } from "@/constants/theme";

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
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[fonts.sub3_sb_16, { color: Colors.gray[10] }]}>
          {title}
        </Text>
        <Text style={[fonts.body4_r_14, { color: Colors.gray[7] }]}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export default function SignupSuccessPage() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={{ gap: 12 }}>
          <Text style={[fonts.caption1_sb_13, { color: Colors.gray[7] }]}>
            온보딩 진행
          </Text>
          <Text style={[fonts.title1_b_28, { color: Colors.common.black }]}>
            회원가입 성공!{`\n`}시작 전 간단한 절차가 필요해요
          </Text>
        </View>

        <View style={{ gap: 8 }}>
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
        onPress={() => router.replace("/onboarding/consent")}
      >
        <Text style={[fonts.sub3_sb_16, { color: Colors.common.white }]}>
          온보딩 시작하기
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 150,
    gap: 32,
  },
  stepCard: {
    height: 87,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 10,
    backgroundColor: Colors.gray[1],
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 10,
  },
  stepIcon: {
    marginTop: 3,
  },
  startButton: {
    position: "absolute",
    right: 16,
    bottom: 52,
    left: 16,
    height: 52,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.default,
  },
  startButtonPressed: {
    backgroundColor: Colors.primary.heavy,
  },
});
