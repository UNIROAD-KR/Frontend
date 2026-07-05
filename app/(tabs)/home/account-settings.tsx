import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { getMemberMe, updatePassword } from '../../../src/api/auth';

const NAVY = '#0F2042';
const BLUE = '#2F66D0';
const INK = '#111111';
const MUTED = '#64748B';
const LINE = '#E2E8F0';
const SOFT = '#F6F8FC';

const getPasswordError = (value: string) => {
  if (!value) return '';

  if (value.length < 8 || value.length > 20) {
    return '비밀번호는 8~20자로 입력해주세요.';
  }

  if (!/^[A-Za-z0-9@$!%*#?&^_-]+$/.test(value)) {
    return '비밀번호에 사용할 수 없는 문자가 포함되어 있습니다.';
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return '비밀번호는 영문과 숫자를 모두 포함해야 합니다.';
  }

  return '';
};

export default function AccountSettingsScreen() {
  const [username, setUsername] = useState('로그인 계정');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const newPasswordError = getPasswordError(newPassword);
  const confirmPasswordError =
    confirmPassword.length > 0 && newPassword !== confirmPassword
      ? '비밀번호가 일치하지 않습니다.'
      : '';

  useFocusEffect(
    useCallback(() => {
      const loadMember = async () => {
        try {
          const response = await getMemberMe();
          setUsername(response.data.data.username || '로그인 계정');
        } catch (error: any) {
          console.log('계정 정보 조회 실패:', error.response?.data || error.message);
          const savedNickname = await AsyncStorage.getItem('nickname');
          setUsername(savedNickname || '로그인 계정');
        }
      };

      loadMember();
    }, []),
  );

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('입력 필요', '현재 비밀번호와 새 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (newPasswordError) {
      Alert.alert('입력 오류', newPasswordError);
      return;
    }

    if (confirmPasswordError) {
      Alert.alert('입력 오류', confirmPasswordError);
      return;
    }

    setSubmitting(true);

    try {
      await updatePassword({ currentPassword, newPassword });
      Alert.alert('변경 완료', '비밀번호가 변경되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.log('비밀번호 변경 실패:', error.response?.data || error.message);
      Alert.alert(
        '변경 실패',
        error.response?.data?.message || '비밀번호 변경에 실패했어요.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton style={styles.iconBtn} />
        <Text style={styles.headerTitle}>계정 설정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.readOnlyCard}>
          <View style={styles.readOnlyIconBox}>
            <Ionicons name="person-circle-outline" size={26} color={BLUE} />
          </View>
          <View style={styles.readOnlyTextBox}>
            <Text style={styles.readOnlyLabel}>아이디</Text>
            <Text style={styles.readOnlyValue} numberOfLines={1}>
              {username}
            </Text>
          </View>
          <View style={styles.lockPill}>
            <Ionicons name="lock-closed" size={12} color={MUTED} />
            <Text style={styles.lockText}>확인만 가능</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>비밀번호 수정</Text>
          <PasswordField
            label="현재 비밀번호"
            value={currentPassword}
            placeholder="현재 비밀번호 입력"
            onChangeText={setCurrentPassword}
          />
          <PasswordField
            label="새 비밀번호"
            value={newPassword}
            placeholder="영문과 숫자 포함 8~20자"
            onChangeText={setNewPassword}
            error={newPasswordError}
            helper="8~20자 / 영문과 숫자 포함"
          />
          <PasswordField
            label="새 비밀번호 확인"
            value={confirmPassword}
            placeholder="새 비밀번호 다시 입력"
            onChangeText={setConfirmPassword}
            error={confirmPasswordError}
            success={
              confirmPassword.length > 0 && !confirmPasswordError
                ? '비밀번호가 일치합니다.'
                : ''
            }
          />

          <View style={styles.ruleBox}>
            <Ionicons name="information-circle-outline" size={18} color={BLUE} />
            <Text style={styles.ruleText}>
              아이디는 보안을 위해 수정할 수 없고, 비밀번호만 변경할 수 있어요.
            </Text>
          </View>
        </View>

        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? '변경 중...' : '비밀번호 변경하기'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function PasswordField({
  label,
  value,
  placeholder,
  onChangeText,
  error,
  helper,
  success,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  error?: string;
  helper?: string;
  success?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA4B2"
        secureTextEntry
        autoCapitalize="none"
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? (
        <View style={styles.feedbackRow}>
          <Text style={styles.errorBadge}>!</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : success ? (
        <Text style={styles.successText}>{success}</Text>
      ) : helper ? (
        <Text style={styles.helpText}>{helper}</Text>
      ) : null}
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
    paddingTop: 18,
    paddingBottom: 130,
  },
  readOnlyCard: {
    minHeight: 88,
    borderRadius: 18,
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#DCE7FF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  readOnlyIconBox: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  readOnlyTextBox: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: MUTED,
  },
  readOnlyValue: {
    marginTop: 5,
    fontSize: 17,
    fontWeight: '900',
    color: INK,
  },
  lockPill: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockText: {
    fontSize: 11,
    fontWeight: '900',
    color: MUTED,
  },
  formCard: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LINE,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: NAVY,
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    color: NAVY,
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SOFT,
    backgroundColor: SOFT,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '800',
    color: INK,
  },
  inputError: {
    borderColor: '#E53935',
    backgroundColor: '#FFFFFF',
  },
  feedbackRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#D94A45',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
    textAlign: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: '#D94A45',
  },
  helpText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: MUTED,
  },
  successText: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: BLUE,
  },
  ruleBox: {
    borderRadius: 14,
    backgroundColor: '#F4F8FF',
    borderWidth: 1,
    borderColor: '#DCE7FF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
    color: MUTED,
  },
  submitButton: {
    marginTop: 22,
    height: 54,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9AA4B2',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
