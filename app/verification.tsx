import { Text } from "@/components/ui/app-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PlusIcon from "@/assets/icon/plus-round.svg";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import BulletIcon from "@/assets/icon/bullet.svg";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  AppBackButton,
  goBackOrReplace,
} from "@/components/ui/app-back-button";
import ArrowDownIcon from "@/assets/icon/Property 1=arrow2, Property 2=down.svg";
import ApprovedIcon from "@/assets/icon/approved.svg";
import PendingIcon from "@/assets/icon/pending.svg";
import { getMemberMe } from "../src/api/auth";
import { getUploadUrl, uploadFileToStorage } from "../src/api/upload";
import {
  getMyVerifications,
  submitVerification,
  VerificationResponse,
} from "../src/api/verification";
import { Modal } from "@/components/ui/modal";
import { SortSheet } from "@/components/ui/sort-sheet";
import { PhotoPickerSheet } from "@/components/ui/photo-picker-sheet";
import { useAppAlert } from "@/hooks/use-app-alert";
import { Colors, commonStyles, fonts } from "@/constants/theme";

type FormMode = "history" | "form";
type VerificationSortOrder = "latest" | "oldest";

type VerificationStatus = VerificationResponse["status"];

type PickedImage = {
  uri: string;
  fileName: string;
  contentType: string;
};

const BLUE = "#3568DA";
const MUTED = "#7A8491";
const LINE = "#E3E7EC";
const SOFT = "#F2F4F7";
const statusMeta: Record<
  VerificationStatus,
  { label: string; color: string; backgroundColor: string }
> = {
  PENDING: {
    label: "검토 중",
    color: "#006BFF",
    backgroundColor: "#F1F8FF",
  },
  APPROVED: {
    label: "승인 완료",
    color: "#7A8491",
    backgroundColor: "#F1F3F5",
  },
  REJECTED: {
    label: "반려",
    color: "#D92D20",
    backgroundColor: "#FFF1F0",
  },
};

const getFileExtension = (contentType: string) => {
  if (contentType === "image/png") {
    return "png";
  }
  if (contentType === "image/webp") {
    return "webp";
  }
  return "jpg";
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(
    date.getDate(),
  ).padStart(2, "0")}`;
};

const getVerificationFileName = (imageUrl: string, fallbackId: number) => {
  if (!imageUrl) {
    return `image${fallbackId}`;
  }

  const decodedUrl = decodeURIComponent(imageUrl.split("?")[0]);
  const fileName = decodedUrl.split("/").pop() || "";
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, "");

  return nameWithoutExtension || `image${fallbackId}`;
};

export default function VerificationPage() {
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const { showAlert, alertElement } = useAppAlert();
  const [isImageSourceSheetVisible, setIsImageSourceSheetVisible] =
    useState(false);
  const [mode, setMode] = useState<FormMode>("history");
  const [verifications, setVerifications] = useState<VerificationResponse[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [sortOrder, setSortOrder] = useState<VerificationSortOrder>("latest");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isSubmitCompleteVisible, setIsSubmitCompleteVisible] = useState(false);

  const hasHistory = verifications.length > 0;
  const canSubmit = Boolean(pickedImage) && !isSubmitting;
  const sortedVerifications = useMemo(
    () =>
      [...verifications].sort((a, b) => {
        const comparison =
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        return sortOrder === "latest" ? comparison : -comparison;
      }),
    [sortOrder, verifications],
  );
  const latestVerification = useMemo(
    () =>
      [...verifications].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      )[0],
    [verifications],
  );

  const loadVerifications = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getMyVerifications();
      const nextVerifications = [...response.data.data].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      );
      const isApproved = nextVerifications.some(
        (verification) => verification.status === "APPROVED",
      );

      setVerifications(nextVerifications);
      setMode(
        requestedMode === "form" || nextVerifications.length === 0
          ? "form"
          : "history",
      );
      await AsyncStorage.setItem("isVerified", isApproved ? "true" : "false");
    } catch (error: any) {
      console.log(
        "인증 내역 조회 실패:",
        error.response?.data || error.message,
      );
      showAlert("조회 실패", "인증 신청 내역을 불러오지 못했습니다.");
      setMode("history");
    } finally {
      setIsLoading(false);
    }
  }, [requestedMode, showAlert]);

  useFocusEffect(
    useCallback(() => {
      loadVerifications();
    }, [loadVerifications]),
  );

  const openNewVerificationForm = () => {
    router.push({
      pathname: "/verification",
      params: { mode: "form" },
    } as any);
  };

  const handleHeaderBack = () => {
    if (mode === "form" && hasHistory) {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace({
        pathname: "/verification",
        params: { mode: "history" },
      } as any);
      return;
    }

    goBackOrReplace("/profile-card");
  };

  const handlePhotoSelect = (photos: string[]) => {
    const uri = photos[0];
    if (!uri) return;

    const lowerUri = uri.toLowerCase();
    const contentType = lowerUri.endsWith(".png")
      ? "image/png"
      : lowerUri.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";

    setPickedImage({
      uri,
      fileName: `verification_${Date.now()}.${getFileExtension(contentType)}`,
      contentType,
    });
  };

  const openImagePicker = () => setIsImageSourceSheetVisible(true);

  const getProfilePayload = async () => {
    const [savedUniversity, savedCountry, savedRegion] = await Promise.all([
      AsyncStorage.getItem("dispatchedUniversity"),
      AsyncStorage.getItem("dispatchedCountry"),
      AsyncStorage.getItem("dispatchedRegion"),
    ]);

    try {
      const response = await getMemberMe();
      const member = response.data.data;

      return {
        university: member.dispatchedUniversity || savedUniversity || "",
        country: member.dispatchedCountry || savedCountry || "",
        region: member.dispatchedRegion || savedRegion || "",
      };
    } catch (error: any) {
      console.log(
        "회원 정보 조회 실패:",
        error.response?.data || error.message,
      );

      return {
        university: savedUniversity || "",
        country: savedCountry || "",
        region: savedRegion || "",
      };
    }
  };

  const uploadVerificationImage = async (image: PickedImage) => {
    const response = await getUploadUrl({
      fileName: image.fileName,
      contentType: image.contentType,
      fileType: "IMAGE",
    });
    const { uploadUrl, fileUrl } = response.data.data;

    await uploadFileToStorage(uploadUrl, image.uri, image.contentType);

    return fileUrl;
  };

  const handleSubmit = async () => {
    if (!pickedImage) {
      showAlert(
        "이미지 선택",
        "인증에 사용할 사진을 촬영하거나 선택해주세요.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const [imageUrl, profilePayload] = await Promise.all([
        uploadVerificationImage(pickedImage),
        getProfilePayload(),
      ]);

      await submitVerification({
        imageUrl,
        ...profilePayload,
      });

      await AsyncStorage.setItem("isVerified", "false");
      setPickedImage(null);
      await loadVerifications();

      setIsSubmitCompleteVisible(true);
    } catch (error: any) {
      console.log("인증 요청 실패:", error.response?.data || error.message);
      showAlert(
        "제출 실패",
        "인증 요청을 제출하지 못했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHistory = () => {
    const isLatestApproved = latestVerification?.status === "APPROVED";
    const SummaryIcon = isLatestApproved ? ApprovedIcon : PendingIcon;
    const summaryTitle = isLatestApproved
      ? "최신 인증 승인 완료"
      : "최신 인증 검토 중";
    const summaryReviewDate = latestVerification?.reviewedAt
      ? formatDate(latestVerification.reviewedAt)
      : "-";

    return (
      <>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <SummaryIcon width={24} height={24} />
          </View>
          <View style={styles.summaryTextBox}>
            <Text style={styles.summaryTitle}>{summaryTitle}</Text>
            <Text style={styles.summaryDesc}>
              최신 검토일 {summaryReviewDate}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={fonts.title5_b_20}>인증 신청 내역</Text>
          <View style={styles.sortControl}>
            <Pressable
              style={styles.sortLabel}
              onPress={() => setIsSortMenuOpen(true)}
            >
              <Text style={[fonts.body2_m_14, { color: Colors.gray[8] }]}>
                {sortOrder === "latest" ? "최신순" : "오래된순"}
              </Text>
              <ArrowDownIcon width={16} height={16} color={MUTED} />
            </Pressable>

          </View>
        </View>

        {sortedVerifications.map((verification) => {
          const fileName = getVerificationFileName(
            verification.imageUrl,
            verification.id,
          );

          return (
            <View key={verification.id} style={styles.historyCard}>
              {verification.imageUrl ? (
                <Image
                  source={{ uri: verification.imageUrl }}
                  style={styles.historyImage}
                />
              ) : (
                <View style={styles.historyImagePlaceholder} />
              )}
              <View style={styles.historyContent}>
                <View style={styles.historyTopRow}>
                  <Text
                    style={[
                      fonts.sub3_sb_16,
                      {
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        maxWidth: 200,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {fileName}
                  </Text>
                  <VerificationBadge status={verification.status} />
                </View>
                <Text style={[fonts.caption4_m_12, { color: Colors.gray[6] }]}>
                  신청일 {formatDate(verification.submittedAt)}
                </Text>
                <Text style={[fonts.caption4_m_12, { color: Colors.gray[6] }]}>
                  검토일 {formatDate(verification.reviewedAt)}
                </Text>
                {verification.status === "REJECTED" &&
                verification.rejectReason ? (
                  <Text style={styles.rejectReason} numberOfLines={2}>
                    반려 사유: {verification.rejectReason}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </>
    );
  };

  const renderForm = () => (
    <>
      <Text style={fonts.title3_b_24}>교환학생 신원 인증</Text>

      <Text
        style={[
          fonts.body4_r_14,
          { color: Colors.gray[7], paddingBottom: 28, paddingTop: 6 },
        ]}
      >
        허위 매물 방지를 위해 공식 서류 사진을 제출해주세요.{"\n"}
        제출된 정보는 인증 목적으로만 사용됩니다.
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="인증 사진 추가"
        style={styles.imagePickerCard}
        onPress={openImagePicker}
      >
        {pickedImage ? (
          <View style={styles.previewContent}>
            <Image
              source={{ uri: pickedImage.uri }}
              style={styles.previewImage}
            />
            <View style={styles.previewTextBox}>
              <Text
                style={[fonts.body1_m_16, { color: Colors.gray[11] }]}
                numberOfLines={1}
              >
                {pickedImage.fileName}
              </Text>
              <Text style={[fonts.caption5_r_13, { color: Colors.gray[6] }]}>
                다시 누르면 사진을 변경할 수 있어요.
              </Text>
            </View>
          </View>
        ) : (
          <View
            style={[{ gap: 8, justifyContent: "center", alignItems: "center" }]}
          >
            <PlusIcon />
            <Text style={fonts.sub1_sb_18}>인증 가능한 이미지 추가</Text>
            <Text
              style={[
                fonts.body4_r_14,
                { color: Colors.gray[7], textAlign: "center" },
              ]}
            >
              카메라로 직접 촬영하거나{`\n`}앨범에서 이미지를 불러와주세요
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.infoBox}>
        <Text style={[fonts.sub4_sb_14, { color: Colors.gray[11] }]}>
          인증 가능 서류
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <BulletIcon />
          <Text style={[fonts.caption3_m_13, { color: Colors.gray[8] }]}>
            파견 대학 입학허가서 (Letter of Admission)
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <BulletIcon />
          <Text style={[fonts.caption3_m_13, { color: Colors.gray[8] }]}>
            재학 대학교 파견 승인서
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={commonStyles.header}>
        <AppBackButton onPress={handleHeaderBack} style={styles.backButton} />
        <Text style={fonts.sub3_sb_16}>교환학생 신원 인증</Text>
        <View style={commonStyles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          mode === "form" && styles.formContent,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={BLUE} />
          </View>
        ) : mode === "history" ? (
          renderHistory()
        ) : (
          renderForm()
        )}
      </ScrollView>

      {!isLoading && mode === "history" ? (
        <View style={styles.historyFooter}>
          <Pressable
            style={styles.primaryButton}
            onPress={openNewVerificationForm}
          >
            <Text style={[fonts.sub3_sb_16, { color: "#FFFFFF" }]}>
              신규 인증 신청하기
            </Text>
          </Pressable>
          <Text
            style={[
              fonts.caption3_m_13,
              { color: Colors.gray[6], textAlign: "center", marginTop: 12 },
            ]}
          >
            서류 검토는 영업일 기준 최대 24시간이 소요될 수 있습니다.
          </Text>
        </View>
      ) : null}

      {!isLoading && mode === "form" ? (
        <View style={styles.formFooter}>
          <Pressable
            style={[
              styles.primaryButton,
              !canSubmit && styles.primaryButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[fonts.sub3_sb_16, { color: "#FFFFFF" }]}>
                제출하기
              </Text>
            )}
          </Pressable>
          <Text
            style={[
              fonts.caption3_m_13,
              { color: Colors.gray[6], textAlign: "center", marginTop: 12 },
            ]}
          >
            서류 검토는 영업일 기준 최대 24시간이 소요될 수 있습니다.
          </Text>
        </View>
      ) : null}

      {alertElement}
      <SortSheet
        visible={isSortMenuOpen}
        value={sortOrder}
        onClose={() => setIsSortMenuOpen(false)}
        onSelect={(value) => {
          setSortOrder(value);
          setIsSortMenuOpen(false);
        }}
        options={[
          { value: "latest", label: "최신순" },
          { value: "oldest", label: "오래된순" },
        ]}
      />
      <PhotoPickerSheet
        visible={isImageSourceSheetVisible}
        onClose={() => setIsImageSourceSheetVisible(false)}
        onSelect={handlePhotoSelect}
        remaining={1}
      />
      <Modal
        isOpen={isSubmitCompleteVisible}
        title="인증 요청이 제출되었습니다"
        description="서류 검토는 영업일 기준 최대 24시간이 소요될 수 있으며, 검토가 완료되면 알림으로 알려드립니다."
        primaryButton={{
          label: "확인했어요",
          onPress: () => {
            setIsSubmitCompleteVisible(false);
            router.replace("/home" as any);
          },
        }}
      />
    </SafeAreaView>
  );
}

function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "PENDING") {
    return (
      <View
        style={{
          paddingVertical: 2,
          paddingHorizontal: 4,
          borderRadius: 3,
          backgroundColor: "#F1F8FF",
        }}
      >
        <Text style={[fonts.caption4_m_12, { color: Colors.primary.default }]}>
          검토 중
        </Text>
      </View>
    );
  }

  if (status === "APPROVED") {
    return (
      <View
        style={{
          paddingVertical: 2,
          paddingHorizontal: 4,
          borderRadius: 3,
          backgroundColor: Colors.gray[2],
        }}
      >
        <Text style={[fonts.caption4_m_12, { color: Colors.gray[7] }]}>
          승인 완료
        </Text>
      </View>
    );
  }

  const meta = statusMeta[status];

  return (
    <View
      style={[styles.statusPill, { backgroundColor: meta.backgroundColor }]}
    >
      <Text style={[styles.statusText, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: "transparent",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
  },
  formContent: {
    paddingTop: 32,
  },
  loadingBox: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    zIndex: 2,
  },
  sortControl: {
    position: "relative",
  },
  sortLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingLeft: 8,
  },
  summaryCard: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray[3],
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary.default,
  },
  summaryTextBox: {
    flex: 1,
    minWidth: 0,
  },
  summaryTitle: {
    ...fonts.sub3_sb_16,
    color: Colors.common.black,
    marginBottom: 4,
  },
  summaryDesc: {
    ...fonts.caption5_r_13,
    color: Colors.gray[7],
  },
  historyCard: {
    height: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  historyImage: {
    width: 68,
    height: 68,
    borderRadius: 7,
    backgroundColor: SOFT,
    marginRight: 12,
  },
  historyImagePlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 7,
    backgroundColor: "#EEF1F5",
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
    minWidth: 0,
  },
  historyTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 3,
  },
  statusPill: {
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },
  rejectReason: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    color: "#D92D20",
  },
  imagePickerCard: {
    height: 187,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: LINE,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  previewContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  previewImage: {
    width: 112,
    height: 112,
    borderRadius: 8,
    marginRight: 12,
  },
  previewTextBox: {
    flex: 1,
    minWidth: 0,
  },
  infoBox: {
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 8,
    backgroundColor: Colors.gray[1],
    padding: 16,
    gap: 8,
  },
  primaryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.primary.default,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.primary.light,
  },
  historyFooter: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: "#FFFFFF",
  },
  formFooter: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: "#FFFFFF",
  },
});
