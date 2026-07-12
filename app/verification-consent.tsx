import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { VERIFICATION_CONSENT } from '../constants/legal';
import {
  canUseMarketWithoutVerification,
  VERIFICATION_CONSENT_AGREED_KEY,
} from '../src/utils/verification';

const BLUE = '#123F9F';
const NAVY = '#0F2042';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

function renderConsentText(content: string) {
  return content
    .trim()
    .split('\n')
    .map((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        return <View key={`space-${index}`} style={styles.textGap} />;
      }

      const isSectionHeading = trimmedLine.startsWith('■');

      return (
        <Text
          key={`${trimmedLine}-${index}`}
          style={[
            styles.bodyText,
            isSectionHeading ? styles.sectionHeading : null,
          ]}
        >
          {line}
        </Text>
      );
    });
}

export default function VerificationConsentScreen() {
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    const redirectIfVerified = async () => {
      try {
        const canUseMarket = await canUseMarketWithoutVerification();

        if (canUseMarket) {
          router.replace('/verification' as any);
        }
      } catch {
        // If verification status cannot be confirmed, keep the consent step.
      }
    };

    redirectIfVerified();
  }, []);

  const handleContinue = async () => {
    if (!agreed) {
      return;
    }

    await AsyncStorage.setItem(VERIFICATION_CONSENT_AGREED_KEY, 'true');

    router.replace({
      pathname: '/verification',
      params: { consent: 'true' },
    } as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>교환학생 인증 동의</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>인증 서류 수집·이용 동의</Text>
        <Text style={styles.subtitle}>
          서류 업로드 전 개인정보 수집·이용 내용을 확인해주세요.
        </Text>

        <View style={styles.card}>{renderConsentText(VERIFICATION_CONSENT)}</View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.agreeRow}
          onPress={() => setAgreed((prev) => !prev)}
        >
          <View style={[styles.checkbox, agreed ? styles.checkboxActive : null]}>
            {agreed && <Text style={styles.checkMark}>✓</Text>}
          </View>
          <Text style={styles.agreeText}>
            인증 서류 및 관련 정보 수집·이용에 동의합니다.
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.continueButton,
            agreed ? styles.continueButtonActive : null,
          ]}
          onPress={handleContinue}
          disabled={!agreed}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: NAVY,
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 150,
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
    color: NAVY,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    color: MUTED,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: LINE,
    padding: 18,
    backgroundColor: '#FFFFFF',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    color: MUTED,
  },
  sectionHeading: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: '900',
    color: NAVY,
  },
  textGap: {
    height: 10,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F5',
    backgroundColor: '#FFFFFF',
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD3DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    borderColor: BLUE,
    backgroundColor: BLUE,
  },
  checkMark: {
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  agreeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    color: '#344054',
  },
  continueButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#D9DCE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonActive: {
    backgroundColor: BLUE,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
