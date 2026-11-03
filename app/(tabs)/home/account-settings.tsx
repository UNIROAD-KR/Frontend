import { commonStyles, fonts, Colors } from "@/constants/theme";
import { Text } from "@/components/ui/app-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import CompleteIcon from "@/assets/icon/complete.svg";
import InfoIcon from "@/assets/icon/info-circle.svg";
import { FieldLabel } from "@/components/ui/field-label";
import InputField from "@/components/ui/input-field";
import { useAppAlert } from "@/hooks/use-app-alert";
import { ProfileScreenHeader } from "@/components/ui/profile-screen-header";
import { getMemberMe, updatePassword } from "../../../src/api/auth";
import Button from "@/components/ui/button";

const getPasswordError = (value: string) => {
  if (!value) return "";

  if (value.length < 8 || value.length > 20) {
    return "비밀번호는 8~20자로 입력해주세요.";
  }

  if (!/^[A-Za-z0-9@$!%*#?&^_-]+$/.test(value)) {
    return "비밀번호에 사용할 수 없는 문자가 포함되어 있습니다.";
  }

  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "비밀번호는 영문과 숫자를 모두 포함해야 합니다.";
  }

  return "";
};

export default function AccountSettingsScreen() {
  const { showAlert, alertElement } = useAppAlert();
  const [username, setUsername] = useState("로그인 계정");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const newPasswordError = getPasswordError(newPassword);
  const confirmPasswordError =
    confirmPassword.length > 0 && newPassword !== confirmPassword
      ? "비밀번호가 일치하지 않습니다."
      : "";
  const submitDisabled =
    submitting ||
    !newPassword ||
    !confirmPassword ||
    !!newPasswordError ||
    !!confirmPasswordError;

  useFocusEffect(
    useCallback(() => {
      const loadMember = async () => {
        try {
          const response = await getMemberMe();
          setUsername(response.data.data.username || "로그인 계정");
        } catch (error: any) {
          console.log(
            "계정 정보 조회 실패:",
            error.response?.data || error.message,
          );
          const savedNickname = await AsyncStorage.getItem("nickname");
          setUsername(savedNickname || "로그인 계정");
        }
      };

      loadMember();
    }, []),
  );

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      showAlert("입력 필요", "새 비밀번호를 입력해주세요.");
      return;
    }

    if (newPasswordError) {
      showAlert("입력 오류", newPasswordError);
      return;
    }

    if (confirmPasswordError) {
      showAlert("입력 오류", confirmPasswordError);
      return;
    }

    setSubmitting(true);

    try {
      await updatePassword({ newPassword });
      showAlert("비밀번호를 변경했어요", undefined, [
        {
          text: "확인했어요.",
          onPress: () => {
            setNewPassword("");
            setConfirmPassword("");
            router.back();
          },
        },
      ]);
    } catch (error: any) {
      console.log("비밀번호 변경 실패:", error.response?.data || error.message);
      showAlert(
        "변경 실패",
        error.response?.data?.message || "비밀번호 변경에 실패했어요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={commonStyles.container}>
      <ProfileScreenHeader title="비밀번호 변경" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            ...fonts.title3_b_24,
            color: Colors.common.black,
            marginBottom: 6,
          }}
        >
          비밀번호 변경
        </Text>
        <Text
          style={{
            ...fonts.body4_r_14,
            color: Colors.gray[7],
            marginBottom: 40,
          }}
        >
          개인정보 보호를 위해 비밀번호를 변경해주세요.
        </Text>

        <PasswordField
          label="기존 비밀번호"
          value={currentPassword}
          placeholder="영문과 숫자 포함 8-20자"
          onChangeText={setCurrentPassword}
        />
        <PasswordField
          label="신규 비밀번호"
          value={newPassword}
          placeholder="영문과 숫자 포함 8-20자"
          onChangeText={setNewPassword}
          error={
            newPasswordError
              ? "영문과 숫자를 포함하여 8-20자로 구성해주세요"
              : ""
          }
          helper="영문과 숫자를 포함하여 8-20자로 구성해주세요"
          valid={newPassword.length > 0 && !newPasswordError}
        />
        <PasswordField
          label="신규 비밀번호 확인"
          value={confirmPassword}
          placeholder="신규 비밀번호를 다시 입력해주세요"
          onChangeText={setConfirmPassword}
          error={confirmPasswordError}
          valid={confirmPassword.length > 0 && !confirmPasswordError}
        />

        <Button
          title="비밀번호 변경하기"
          onPress={handleSubmit}
          disabled={submitDisabled}
        />
      </ScrollView>
      {alertElement}
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
  valid,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  error?: string;
  helper?: string;
  valid?: boolean;
}) {
  return (
    <View style={styles.field}>
      <FieldLabel title={label} marginBottom={8} />
      <View>
        <InputField
          size="sm"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry
          autoCapitalize="none"
          style={[error ? styles.inputError : null, valid && styles.inputValid]}
          error={error}
        />
        {valid ? (
          <View pointerEvents="none" style={styles.validIcon}>
            <CompleteIcon
              width={24}
              height={24}
              color={Colors.primary.default}
            />
          </View>
        ) : null}
      </View>
      {!error && helper ? (
        <View style={styles.helperRow}>
          <InfoIcon width={16} height={16} />
          <Text style={styles.helpText}>{helper}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  field: {
    marginBottom: 24,
  },
  inputError: {
    borderColor: Colors.error.normal,
  },
  inputValid: {
    paddingRight: 46,
  },
  validIcon: {
    position: "absolute",
    right: 16,
    top: 17,
  },
  helperRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  helpText: {
    ...fonts.caption3_m_13,
    color: Colors.gray[7],
  },
});
