import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Modal,
  Image,
} from 'react-native';
import { BackButton } from '@/components/back-button';
import { checkUsername, socialSignUp } from '../src/api/auth';
import { signupStyles as styles } from '../src/styles/signupStyles';

export default function SnsSignupPage() {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [emailId, setEmailId] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [isCustomDomain, setIsCustomDomain] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);

  const fullEmail = emailId && emailDomain ? `${emailId}@${emailDomain}` : '';

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,20}$/;
  const isPasswordValid = passwordRegex.test(password);

  const canSubmit =
    username.trim().length >= 4 &&
    name.trim().length > 0 &&
    isPasswordValid &&
    password === passwordCheck;

  const [domainModalVisible, setDomainModalVisible] = useState(false);

  const emailDomains = [
    'gmail.com',
    'naver.com',
    'daum.net',
    'kakao.com',
    'hanmail.net',
    'nate.com',
    'icloud.com',
    '직접 입력',
  ];

  const handleCheckUsername = async () => {
    const cleanedUsername = username.trim();
    if (!cleanedUsername) {
      Alert.alert('입력 오류', '아이디를 입력해주세요.');
      return;
    }

    try {
      await checkUsername(cleanedUsername);
      Alert.alert('확인 완료', '사용 가능한 아이디입니다.');
    } catch (error: any) {
      Alert.alert('중복 확인 실패', '이미 사용 중인 아이디입니다.');
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      Alert.alert('입력 확인', '아이디, 이름, 비밀번호를 확인해주세요.');
      return;
    }

    try {
      const signUpData: {
        username: string;
        password: string;
        name: string;
        email?: string;
      } = {
        username: username.trim(),
        password,
        name: name.trim(),
      };

      if (fullEmail.trim()) {
        signUpData.email = fullEmail.trim();
      }

      await socialSignUp(signUpData);

      Alert.alert('가입 완료', '아이디와 비밀번호 설정이 완료되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            router.push({
              pathname: '/onboarding/nickname',
              params: {
                username: username.trim(),
                email: signUpData.email || '',
              },
            } as any);
          },
        },
      ]);
    } catch (error: any) {
      console.log('소셜 회원가입 실패:', error.response?.data || error.message);
      Alert.alert('회원가입 실패', error.response?.data?.message || '입력 정보를 다시 확인해주세요.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <BackButton />

        <Text style={styles.title}>회원가입</Text>

        <View style={styles.headerBlank} />
      </View>

      <Text style={styles.label}>아이디</Text>

      <View style={styles.idRow}>
        <TextInput
          style={[styles.input, styles.idInput]}
          placeholder="아이디"
          placeholderTextColor="#8F8F8F"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Pressable style={styles.checkButton} onPress={handleCheckUsername}>
          <Text style={styles.checkButtonText}>중복확인</Text>
        </Pressable>
      </View>

      <Text style={styles.helpText}>4~12자/영문 소문자(숫자 조합 가능)</Text>

      <Text style={[styles.label, styles.emailSection]}>이름</Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flexInput]}
          placeholder="이름 (실명)"
          placeholderTextColor="#9A9A9A"
          value={name}
          onChangeText={setName}
        />
      </View>

      <Text style={[styles.label, styles.passwordLabel]}>비밀번호</Text>

      <View style={styles.passwordInputBox}>
        <TextInput
          style={styles.passwordInput}
          placeholder="비밀번호"
          placeholderTextColor="#9A9A9A"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
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

      <View style={styles.passwordInputBox}>
        <TextInput
          style={styles.passwordInput}
          placeholder="비밀번호 확인"
          placeholderTextColor="#9A9A9A"
          secureTextEntry={!showPasswordCheck}
          value={passwordCheck}
          onChangeText={setPasswordCheck}
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
        <Text
          style={[
            styles.passwordMatchText,
            password === passwordCheck
              ? styles.passwordMatchSuccess
              : styles.passwordMatchError,
          ]}
        >
          {password === passwordCheck
            ? '비밀번호가 일치합니다.'
            : '비밀번호가 일치하지 않습니다.'}
        </Text>
      )}

      <Text style={styles.helpText}>
        8~20자/영문, 숫자, 특수문자 필수 조합
      </Text>

      <Text style={[styles.label, styles.emailLabel]}>이메일 (선택)</Text>

      <View style={styles.emailRow}>
        <TextInput
          style={[styles.input, styles.emailIdInput]}
          placeholder="이메일"
          placeholderTextColor="#9A9A9A"
          value={emailId}
          onChangeText={setEmailId}
          autoCapitalize="none"
        />

        <Text style={styles.at}>@</Text>

        {isCustomDomain ? (
          <TextInput
            style={[styles.input, styles.customDomainInput]}
            placeholder="직접 입력"
            placeholderTextColor="#9A9A9A"
            value={emailDomain}
            onChangeText={setEmailDomain}
            autoCapitalize="none"
          />
        ) : (
          <Pressable
            style={styles.domainBox}
            onPress={() => setDomainModalVisible(true)}
          >
            <Text
              style={[
                styles.domainText,
                emailDomain && styles.domainTextActive,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {emailDomain || '선택'}
            </Text>

            <Text style={styles.chevron}>⌄</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.bottomSpacer} />
      <Pressable
        style={[styles.submitButton, canSubmit && styles.submitButtonActive]}
        disabled={!canSubmit}
        onPress={handleSubmit}
      >
        <Text style={[styles.submitText, canSubmit && styles.submitTextActive]}>
          가입하기
        </Text>
      </Pressable>
      <Modal
        transparent
        visible={domainModalVisible}
        animationType="fade"
        onRequestClose={() => setDomainModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDomainModalVisible(false)}
        >
          <View style={styles.domainModal}>
            {emailDomains.map((domain) => (
              <Pressable
                key={domain}
                style={styles.domainOption}
                onPress={() => {
                  if (domain === '직접 입력') {
                    setIsCustomDomain(true);
                    setEmailDomain('');
                  } else {
                    setIsCustomDomain(false);
                    setEmailDomain(domain);
                  }

                  setDomainModalVisible(false);
                }}
              >
                <Text style={styles.domainOptionText}>{domain}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
