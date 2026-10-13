import { Text, TextInput } from "@/components/ui/app-text";
import {
  AppBackButton,
  goBackOrReplace,
} from "@/components/ui/app-back-button";
import { PhotoField } from "@/components/market/registration/PhotoField";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  createFreePost,
  FreePostCategoryMap,
  updateFreePost,
} from "../../src/api/freePosts";
import { getUploadUrl, uploadFileToStorage } from "../../src/api/upload";
import { Colors, commonStyles, fonts } from "@/constants/theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppAlert } from "@/hooks/use-app-alert";

const MAX_FREE_POST_PHOTOS = 10;
const boardStatusFilters = Object.keys(
  FreePostCategoryMap,
) as (keyof typeof FreePostCategoryMap)[];

const uploadCommunityImage = async (uri: string, index: number) => {
  if (/^https?:\/\//.test(uri)) {
    return uri;
  }

  const fileName = `community_${Date.now()}_${index}.jpg`;
  const contentType = "image/jpeg";
  const response = await getUploadUrl({
    fileName,
    contentType,
    fileType: "IMAGE",
  });

  const { uploadUrl, fileUrl } = response.data.data;
  await uploadFileToStorage(uploadUrl, uri, contentType);

  return fileUrl;
};

const parseImageUrls = (value?: string) => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
};

export function CommunityFreeWriteForm() {
  const params = useLocalSearchParams<{
    mode?: string;
    id?: string;
    title?: string;
    body?: string;
    imageUrls?: string;
  }>();
  const isEdit = params.mode === "edit";

  const { showAlert, alertElement } = useAppAlert();
  const [title, setTitle] = useState(params.title || "");
  const [body, setBody] = useState(params.body || "");
  const [photos, setPhotos] = useState<string[]>(() =>
    parseImageUrls(params.imageUrls),
  );
  const [submitting, setSubmitting] = useState(false);
  const [selectedBoardStatus, setSelectedBoardStatus] =
    useState<keyof typeof FreePostCategoryMap>("질문글");

  const submitDisabled = submitting || !title.trim() || !body.trim();

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    if (!title.trim() || !body.trim()) {
      showAlert("입력 오류", "제목과 내용을 입력해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const imageUrls = await Promise.all(
        photos.map((photo, index) => uploadCommunityImage(photo, index)),
      );
      const payload = {
        category: FreePostCategoryMap[selectedBoardStatus],
        title: title.trim(),
        content: body.trim(),
        imageUrls,
      };

      if (isEdit && params.id) {
        await updateFreePost(Number(params.id), payload);
      } else {
        await createFreePost(payload);
      }

      showAlert(
        isEdit ? "수정 완료" : "등록 완료",
        isEdit ? "게시글을 수정했어요." : "게시글을 등록했어요.",
        [{ text: "확인", onPress: () => goBackOrReplace("/community") }],
      );
    } catch (error: any) {
      console.log(
        "자유게시판 저장 실패:",
        error.response?.data || error.message,
      );
      showAlert(
        "저장 실패",
        error.response?.data?.message || "잠시 후 다시 시도해주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={commonStyles.header}>
          <AppBackButton
            onPress={() => goBackOrReplace("/community")}
            style={styles.backButton}
          />
          <Text style={[fonts.sub3_sb_16, { textAlign: "center" }]}>
            자유게시판 글쓰기
          </Text>
          <Pressable disabled={submitDisabled} onPress={handleSubmit}>
            <Text
              style={{
                ...fonts.body1_m_16,
                color: submitDisabled ? Colors.gray[7] : Colors.primary.default,
              }}
            >
              등록하기
            </Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>카테고리</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {boardStatusFilters.map((status) => {
                const selected = selectedBoardStatus === status;
                return (
                  <Pressable
                    key={status}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedBoardStatus(status)}
                    style={[
                      styles.boardStatusFilter,
                      selected && styles.boardStatusFilterSelected,
                    ]}
                  >
                    <Text
                      style={[
                        fonts.body2_m_14,
                        selected
                          ? styles.boardStatusFilterTextSelected
                          : styles.boardStatusFilterText,
                      ]}
                    >
                      {status}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>제목</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="제목을 입력해주세요."
              placeholderTextColor="#A0A0A0"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>이미지 첨부</Text>
            <PhotoField
              photos={photos}
              onChange={setPhotos}
              limit={MAX_FREE_POST_PHOTOS}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>내용</Text>
            <TextInput
              style={styles.textarea}
              value={body}
              onChangeText={setBody}
              placeholder="본문을 입력해주세요."
              placeholderTextColor="#A0A0A0"
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}></View>
      </KeyboardAvoidingView>
      {alertElement}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 108,
    paddingTop: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111111",
  },
  headerSpacer: {
    width: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingHorizontal: 23,
    paddingTop: 16,
    paddingBottom: 132,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700",
    color: "#777777",
    marginBottom: 22,
  },
  fieldGroup: {
    marginBottom: 18,
    gap: 8,
  },
  label: {
    ...commonStyles.inputLabel,
    marginBottom: 0,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    ...fonts.body1_m_16,
    color: Colors.common.black,
  },
  textarea: {
    minHeight: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingTop: 14,
    ...fonts.long_body2_r_16,
    color: Colors.common.black,
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 23,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F1F1",
  },
  submitButton: {
    ...commonStyles.button,
  },
  submitButtonDisabled: {
    backgroundColor: "#C9CED8",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  boardStatusFilter: {
    height: 38,
    borderRadius: 20,
    backgroundColor: "#F6F8FA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
  },
  boardStatusFilterSelected: {
    backgroundColor: "#191F28",
  },
  boardStatusFilterText: {
    color: "#6B7684",
  },
  boardStatusFilterTextSelected: {
    color: "#FFFFFF",
  },
});
