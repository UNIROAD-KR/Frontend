import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppBackButton } from '@/components/ui/app-back-button';
import { checkUsername, socialSignUp } from '../src/api/auth';
import { clearOnboardingDraft } from '../src/storage/onboardingDraft';
import { signupStyles as styles } from '../src/styles/signupStyles';

const getUsernameError = (value: string) => {
  const cleanedValue = value.trim();

  if (!cleanedValue) {
    return '';
  }

  if (cleanedValue.length < 4 || cleanedValue.length > 12) {
    return '아이디는 4~12자로 입력해주세요.';
  }

  if (!/^[a-z0-9]+$/.test(cleanedValue)) {
    return '아이디는 영문 소문자와 숫자만 사용할 수 있습니다.';
  }

  return '';
};

const getPasswordError = (value: string) => {
  if (!value) {
    return '';
  }

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

export default function SnsSignupPage() {
  const scrollRef = useRef<ScrollView>(null);
  const [focusedField, setFocusedField] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [isUsernameChecked, setIsUsernameChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);
  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  const usernameError = getUsernameError(username);
  const passwordError = getPasswordError(password);
  const passwordCheckError =
    passwordCheck.length > 0 && password !== passwordCheck
      ? '비밀번호가 일치하지 않습니다.'
      : '';
  const allTermsChecked = agreeService && agreePrivacy && agreeMarketing;
  const requiredTermsChecked = agreeService && agreePrivacy;

  const isInputValid =
    username.trim().length > 0 &&
    !usernameError &&
    isUsernameChecked &&
    name.trim().length > 0 &&
    password.length > 0 &&
    !passwordError &&
    passwordCheck.length > 0 &&
    !passwordCheckError;

  const handleCheckUsername = async () => {
    const cleanedUsername = username.trim();

    if (!cleanedUsername) {
      Alert.alert('입력 오류', '아이디를 입력해주세요.');
      return;
    }

    if (usernameError) {
      Alert.alert('입력 오류', usernameError);
      return;
    }

    try {
      await checkUsername(cleanedUsername);
      setIsUsernameChecked(true);
      Alert.alert('확인 완료', '사용 가능한 아이디입니다.');
    } catch (error: any) {
      setIsUsernameChecked(false);
      console.log('아이디 중복확인 실패:', error.response?.data || error.message);
      Alert.alert('중복 확인 실패', '이미 사용 중인 아이디입니다.');
    }
  };

  const handleOpenTerms = () => {
    if (usernameError) {
      Alert.alert('입력 오류', usernameError);
      return;
    }

    if (passwordError) {
      Alert.alert('입력 오류', passwordError);
      return;
    }

    if (passwordCheckError) {
      Alert.alert('입력 오류', passwordCheckError);
      return;
    }

    if (!isInputValid) {
      Alert.alert('입력 확인', '아이디, 이름, 비밀번호를 확인해주세요.');
      return;
    }

    openTermsSheet();
  };

  const handleSubmit = async () => {
    await AsyncStorage.setItem('isVerified', 'false');

    try {
      const signUpData: {
        username: string;
        password: string;
        name: string;
      } = {
        username: username.trim(),
        password,
        name: name.trim(),
      };

      await socialSignUp(signUpData);
      await clearOnboardingDraft();

      Alert.alert('가입 완료', '아이디와 비밀번호 설정이 완료되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            router.push({
              pathname: '/onboarding/nickname',
              params: {
                username: username.trim(),
              },
            } as any);
          },
        },
      ]);
    } catch (error: any) {
      console.log('소셜 회원가입 실패:', error.response?.data || error.message);
      Alert.alert(
        '회원가입 실패',
        error.response?.data?.message || '입력 정보를 다시 확인해주세요.',
      );
    }
  };

  const handlePasswordCheckFocus = () => {
    setFocusedField('passwordCheck');
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 120, animated: true });
    }, 80);
  };

  const handleToggleAllTerms = () => {
    const nextValue = !allTermsChecked;

    setAgreeService(nextValue);
    setAgreePrivacy(nextValue);
    setAgreeMarketing(nextValue);
  };

  const openTermsSheet = () => {
    setAgreeService(false);
    setAgreePrivacy(false);
    setAgreeMarketing(false);
    setTermsVisible(true);
  };

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <AppBackButton fallbackHref="/login" />

          <Text style={styles.title}>회원가입</Text>

          <View style={styles.headerBlank} />
        </View>

      <Text style={styles.label}>아이디</Text>

      <View style={styles.idRow}>
        <TextInput
          style={[
            styles.input,
            styles.idInput,
            focusedField === 'username' && !usernameError
              ? styles.inputFocused
              : null,
            usernameError ? styles.inputError : null,
          ]}
          placeholder="아이디"
          placeholderTextColor="#8F8F8F"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setIsUsernameChecked(false);
          }}
          autoCapitalize="none"
          onFocus={() => setFocusedField('username')}
          onBlur={() => setFocusedField('')}
        />

        <Pressable
          style={[
            styles.checkButton,
            username.trim().length > 0 && !usernameError
              ? styles.checkButtonActive
              : null,
            isUsernameChecked ? styles.checkButtonDone : null,
          ]}
          disabled={!username.trim() || !!usernameError || isUsernameChecked}
          onPress={handleCheckUsername}
        >
          <Text
            style={[
              styles.checkButtonText,
              username.trim().length > 0 && !usernameError
                ? styles.checkButtonTextActive
                : null,
              isUsernameChecked ? styles.checkButtonTextDone : null,
            ]}
          >
            중복확인
          </Text>
        </Pressable>
      </View>

      {usernameError ? (
        <View style={styles.feedbackRow}>
          <Text style={styles.errorBadge}>!</Text>
          <Text style={styles.errorText}>{usernameError}</Text>
        </View>
      ) : isUsernameChecked ? (
        <Text style={styles.successText}>사용 가능한 아이디입니다.</Text>
      ) : (
        <Text style={styles.helpText}>4~12자/영문 소문자(숫자 조합 가능)</Text>
      )}

      <Text style={[styles.label, styles.passwordLabel]}>비밀번호</Text>

      <View
        style={[
          styles.passwordInputBox,
          focusedField === 'password' && !passwordError
            ? styles.inputFocused
            : null,
          passwordError ? styles.inputError : null,
        ]}
      >
        <TextInput
          style={styles.passwordInput}
          placeholder="비밀번호"
          placeholderTextColor="#9A9A9A"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField('')}
        />

        <Pressable onPress={() => setShowPassword((prev) => !prev)}>
          <Image
            source={
              showPassword
                ? require('../assets/images/eye_open.png')
                : require('../assets/images/eye_close.png')
            }
            style={styles.eyeIcon}
          />
        </Pressable>
      </View>

      {passwordError ? (
        <View style={styles.feedbackRow}>
          <Text style={styles.errorBadge}>!</Text>
          <Text style={styles.errorText}>{passwordError}</Text>
        </View>
      ) : (
        <Text style={styles.helpText}>
          8~20자/영문과 숫자 포함
        </Text>
      )}

      <View
        style={[
          styles.passwordInputBox,
          styles.passwordConfirmBox,
          focusedField === 'passwordCheck' && !passwordCheckError
            ? styles.inputFocused
            : null,
          passwordCheckError ? styles.inputError : null,
        ]}
      >
        <TextInput
          style={styles.passwordInput}
          placeholder="비밀번호 확인"
          placeholderTextColor="#9A9A9A"
          secureTextEntry={!showPasswordCheck}
          value={passwordCheck}
          onChangeText={setPasswordCheck}
          onFocus={handlePasswordCheckFocus}
          onBlur={() => setFocusedField('')}
        />

        <Pressable onPress={() => setShowPasswordCheck((prev) => !prev)}>
          <Image
            source={
              showPasswordCheck
                ? require('../assets/images/eye_open.png')
                : require('../assets/images/eye_close.png')
            }
            style={styles.eyeIcon}
          />
        </Pressable>
      </View>
      {passwordCheck.length > 0 && (
        passwordCheckError ? (
          <View style={styles.feedbackRow}>
            <Text style={styles.errorBadge}>!</Text>
            <Text style={[styles.passwordMatchText, styles.passwordMatchError]}>
              {passwordCheckError}
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.passwordMatchText, styles.passwordMatchSuccess]}
          >
            비밀번호가 일치합니다.
          </Text>
        )
      )}

      <Text style={[styles.label, styles.emailSection]}>이름</Text>

      <View style={styles.row}>
        <TextInput
          style={[
            styles.input,
            styles.flexInput,
            focusedField === 'name' ? styles.inputFocused : null,
          ]}
          placeholder="이름"
          placeholderTextColor="#9A9A9A"
          value={name}
          onChangeText={setName}
          onFocus={() => setFocusedField('name')}
          onBlur={() => setFocusedField('')}
        />
      </View>

      <View style={styles.bottomSpacer} />
      <Pressable
        style={[styles.submitButton, isInputValid && styles.submitButtonActive]}
        onPress={handleOpenTerms}
      >
        <Text style={[styles.submitText, isInputValid && styles.submitTextActive]}>
          가입하기
        </Text>
      </Pressable>
      </ScrollView>
      <Modal
        transparent
        visible={termsVisible}
        animationType="slide"
        onRequestClose={() => setTermsVisible(false)}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setTermsVisible(false)}
        >
          <Pressable style={styles.termsSheet}>
            <View style={styles.sheetHandle} />
            <TermAgreementRow
              label="전체 동의"
              checked={allTermsChecked}
              onPress={handleToggleAllTerms}
              emphasized
            />

            <View style={styles.termsDivider} />

            <TermAgreementRow
              label="[필수] 서비스 이용약관 동의"
              checked={agreeService}
              onPress={() => setAgreeService((prev) => !prev)}
              showLink
            />
            <TermAgreementRow
              label="[필수] 개인정보 수집 및 이용 동의"
              checked={agreePrivacy}
              onPress={() => setAgreePrivacy((prev) => !prev)}
              showLink
            />
            <TermAgreementRow
              label="[선택] 마케팅 정보 수신 동의"
              checked={agreeMarketing}
              onPress={() => setAgreeMarketing((prev) => !prev)}
              showLink
            />

            <Pressable
              style={[
                styles.sheetConfirmButton,
                requiredTermsChecked ? styles.sheetConfirmButtonActive : null,
              ]}
              onPress={handleSubmit}
              disabled={!requiredTermsChecked}
            >
              <Text
                style={[
                  styles.sheetConfirmText,
                  requiredTermsChecked ? styles.sheetConfirmTextActive : null,
                ]}
              >
                가입하기
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function TermAgreementRow({
  label,
  checked,
  onPress,
  emphasized = false,
  showLink = false,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
  emphasized?: boolean;
  showLink?: boolean;
}) {
  return (
    <View style={styles.termRow}>
      <Pressable style={styles.termPressArea} onPress={onPress}>
        {emphasized ? (
          <View
            style={[
              styles.checkbox,
              styles.checkboxCircle,
              checked ? styles.checkboxChecked : null,
            ]}
          >
            <Text style={styles.checkboxCheckText}>✓</Text>
          </View>
        ) : (
          <Text
            style={[
              styles.termCheckMark,
              checked ? styles.termCheckMarkActive : null,
            ]}
          >
            ✓
          </Text>
        )}
        <Text style={[styles.termText, emphasized ? styles.termAllText : null]}>
          {label}
        </Text>
      </Pressable>

      {showLink && (
        <Pressable style={styles.termLinkButton}>
          <Text style={styles.termLinkText}>›</Text>
        </Pressable>
      )}
    </View>
  );
}
