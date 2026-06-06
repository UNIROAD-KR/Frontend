import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';

import { checkEmail, signUp, checkUsername } from '../src/api/auth';
import { signupStyles as styles } from '../src/styles/signupStyles';
import { BackButton } from '@/components/back-button';

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [phone, setPhone] = useState('');

  const cleanedUsername = username.trim();
  const cleanedEmail = email.trim();

  const isFormValid =
    cleanedUsername.length > 0 &&
    cleanedEmail.length > 0 &&
    name.trim().length > 0 &&
    password.length > 0 &&
    passwordCheck.length > 0 &&
    phone.length > 0;

  const [domainModalVisible, setDomainModalVisible] = useState(false);

  const handleCheckUsername = async () => {
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

  const handleCheckEmail = async () => {
    if (!cleanedEmail) {
      Alert.alert('입력 오류', '이메일을 입력해주세요.');
      return;
    }

    try {
      await checkEmail(cleanedEmail);
      Alert.alert('확인 완료', '사용 가능한 이메일입니다.');
    } catch (error: any) {
      console.log(
        '이메일 중복확인 실패:',
        error.response?.data || error.message,
      );
      Alert.alert('중복 확인 실패', '이미 사용 중인 이메일일 수 있습니다.');
    }
  };

  const handleSignup = async () => {
    if (!isFormValid) {
      Alert.alert(
        '입력 오류',
        '모든 항목을 입력해주세요.',
      );
      return;
    }

    if (password !== passwordCheck) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      console.log('회원가입 이메일:', cleanedEmail);

      await signUp({
        username: cleanedUsername,
        email: cleanedEmail,
        password,
        name: name.trim(),
      });

      Alert.alert('가입 완료', '회원가입이 완료되었습니다.');
      router.replace('/onboarding/nickname');
    } catch (error: any) {
      console.log('회원가입 실패:', error.response?.data || error.message);
      Alert.alert('회원가입 실패', '입력 정보를 다시 확인해주세요.');
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

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flexInput]}
          placeholder="아이디"
          placeholderTextColor="#9A9A9A"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Pressable style={styles.checkButton} onPress={handleCheckUsername}>
          <Text style={styles.checkButtonText}>중복확인</Text>
        </Pressable>
      </View>

      <Text style={[styles.label, styles.emailSection]}>이메일</Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flexInput]}
          placeholder="이메일"
          placeholderTextColor="#9A9A9A"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Pressable style={styles.checkButton} onPress={handleCheckEmail}>
          <Text style={styles.checkButtonText}>중복확인</Text>
        </Pressable>
      </View>

      <Text style={styles.helpText}>
        로그인에 사용할 이메일을 입력해주세요.
      </Text>

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

      <Text style={[styles.label, styles.passwordSection]}>비밀번호</Text>

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
        6~20자/영문 대문자, 소문자, 숫자, 특수문자 2가지 이상 조합
      </Text>

      <Text style={[styles.label, styles.emailSection]}>휴대폰 번호</Text>

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flexInput]}
          placeholder="휴대폰 번호"
          placeholderTextColor="#9A9A9A"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Pressable style={styles.checkButton}>
          <Text style={styles.checkButtonText}>인증번호 받기</Text>
        </Pressable>
      </View>

      <View style={styles.bottomSpacer} />

      <Pressable
        style={[styles.submitButton, isFormValid && styles.submitButtonActive]}
        onPress={handleSignup}
      >
        <Text
          style={[styles.submitText, isFormValid && styles.submitTextActive]}
        >
          가입하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
