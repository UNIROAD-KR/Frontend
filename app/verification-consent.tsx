import { Text } from "@/components/ui/app-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import {
  AppBackButton,
  goBackOrReplace,
} from "@/components/ui/app-back-button";

import {
  getMyVerifications,
  VerificationResponse,
} from "../src/api/verification";
import { Colors, commonStyles, fonts } from "@/constants/theme";

type FormMode = "history" | "form";

const NAVY = "#18202B";
export default function VerificationPage() {
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<FormMode>("history");
  const [verifications, setVerifications] = useState<VerificationResponse[]>(
    [],
  );
  const hasHistory = verifications.length > 0;

  const loadVerifications = useCallback(async () => {
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
      Alert.alert("조회 실패", "인증 신청 내역을 불러오지 못했습니다.");
      setMode("history");
    } finally {
    }
  }, [requestedMode]);

  useFocusEffect(
    useCallback(() => {
      loadVerifications();
    }, [loadVerifications]),
  );

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
        <Text style={fonts.title3_b_24}>
          중고마켓을 이용하려면{"\n"}신원 인증이 필요해요.
        </Text>

        <Text
          style={[
            fonts.body4_r_14,
            { color: Colors.gray[7], paddingBottom: 28, paddingTop: 6 },
          ]}
        >
          허위 매물 방지를 위해 교환학생 신원 인증을{"\n"}
          필수적으로 진행하고 있어요.
        </Text>
      </ScrollView>

      <View style={styles.formFooter}>
        <Pressable
          style={[styles.primaryButton]}
          onPress={() => router.push("/verification")}
          disabled={false}
        >
          <Text style={[fonts.sub3_sb_16, { color: "#FFFFFF" }]}>시작하기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F8FA",
  },
  header: {
    height: 118,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 43,
    paddingBottom: 12,
    backgroundColor: "#F6F8FA",
    position: "relative",
  },
  backButton: {
    backgroundColor: "transparent",
  },
  headerTitle: {
    position: "absolute",
    top: 57,
    left: 0,
    right: 0,
    height: 34,
    lineHeight: 34,
    fontSize: 16,
    fontWeight: "800",
    color: NAVY,
    textAlign: "center",
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
  primaryButton: {
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.primary.default,
    alignItems: "center",
    justifyContent: "center",
  },
  historyFooter: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: "#F6F8FA",
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

// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { router } from "expo-router";
// import { useEffect, useState } from "react";
// import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

// import { AppBackButton } from "@/components/ui/app-back-button";
// import { VERIFICATION_CONSENT } from "../constants/legal";
// import {
//   canUseMarketWithoutVerification,
//   VERIFICATION_CONSENT_AGREED_KEY,
// } from "../src/utils/verification";

// const BLUE = "#3568DA";
// const NAVY = "#18202B";
// const MUTED = "#7A8491";
// const LINE = "#E3E7EC";

// function renderConsentText(content: string) {
//   return content
//     .trim()
//     .split("\n")
//     .map((line, index) => {
//       const trimmedLine = line.trim();

//       if (!trimmedLine) {
//         return <View key={`space-${index}`} style={styles.textGap} />;
//       }

//       const isSectionHeading = trimmedLine.startsWith("■");

//       return (
//         <Text
//           key={`${trimmedLine}-${index}`}
//           style={[
//             styles.bodyText,
//             isSectionHeading ? styles.sectionHeading : null,
//           ]}
//         >
//           {line}
//         </Text>
//       );
//     });
// }

// export default function VerificationConsentScreen() {
//   const [agreed, setAgreed] = useState(false);

//   useEffect(() => {
//     const redirectIfVerified = async () => {
//       try {
//         const canUseMarket = await canUseMarketWithoutVerification();

//         if (canUseMarket) {
//           router.replace("/verification" as any);
//         }
//       } catch {
//         // If verification status cannot be confirmed, keep the consent step.
//       }
//     };

//     redirectIfVerified();
//   }, []);

//   const handleContinue = async () => {
//     if (!agreed) {
//       return;
//     }

//     await AsyncStorage.setItem(VERIFICATION_CONSENT_AGREED_KEY, "true");

//     router.replace({
//       pathname: "/verification",
//       params: { consent: "true" },
//     } as any);
//   };

//   return (
//     <View style={styles.container}>
//       <View style={styles.header}>
//         <AppBackButton style={styles.iconBtn} />
//         <Text style={styles.headerTitle}>교환학생 인증 동의</Text>
//         <View style={styles.headerSpacer} />
//       </View>

//       <ScrollView
//         style={styles.scroll}
//         contentContainerStyle={styles.content}
//         showsVerticalScrollIndicator={false}
//       >
//         <Text style={styles.title}>인증 서류 수집·이용 동의</Text>
//         <Text style={styles.subtitle}>
//           서류 업로드 전 개인정보 수집·이용 내용을 확인해주세요.
//         </Text>

//         <View style={styles.card}>
//           {renderConsentText(VERIFICATION_CONSENT)}
//         </View>
//       </ScrollView>

//       <View style={styles.footer}>
//         <Pressable
//           style={styles.agreeRow}
//           onPress={() => setAgreed((prev) => !prev)}
//         >
//           <View
//             style={[styles.checkbox, agreed ? styles.checkboxActive : null]}
//           >
//             {agreed && <Text style={styles.checkMark}>✓</Text>}
//           </View>
//           <Text style={styles.agreeText}>
//             인증 서류 및 관련 정보 수집·이용에 동의합니다.
//           </Text>
//         </Pressable>

//         <Pressable
//           style={[
//             styles.continueButton,
//             agreed ? styles.continueButtonActive : null,
//           ]}
//           onPress={handleContinue}
//           disabled={!agreed}
//         >
//           <Text style={styles.continueButtonText}>동의하고 계속하기</Text>
//         </Pressable>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#F6F7F9",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 20,
//     paddingTop: 44,
//     paddingBottom: 12,
//     backgroundColor: "#FFFFFF",
//     borderBottomWidth: 1,
//     borderBottomColor: "#E8EBEF",
//   },
//   iconBtn: {
//     backgroundColor: "transparent",
//   },
//   headerTitle: {
//     fontSize: 16,
//     fontWeight: "900",
//     color: NAVY,
//   },
//   headerSpacer: {
//     width: 38,
//     height: 38,
//   },
//   scroll: {
//     flex: 1,
//   },
//   content: {
//     paddingHorizontal: 16,
//     paddingTop: 20,
//     paddingBottom: 136,
//   },
//   title: {
//     fontSize: 20,
//     lineHeight: 28,
//     fontWeight: "900",
//     color: NAVY,
//   },
//   subtitle: {
//     marginTop: 8,
//     marginBottom: 18,
//     fontSize: 12,
//     lineHeight: 18,
//     fontWeight: "700",
//     color: MUTED,
//   },
//   card: {
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: LINE,
//     padding: 15,
//     backgroundColor: "#FFFFFF",
//   },
//   bodyText: {
//     fontSize: 12,
//     lineHeight: 20,
//     fontWeight: "700",
//     color: MUTED,
//   },
//   sectionHeading: {
//     marginTop: 8,
//     marginBottom: 4,
//     fontWeight: "900",
//     color: NAVY,
//   },
//   textGap: {
//     height: 10,
//   },
//   footer: {
//     position: "absolute",
//     left: 0,
//     right: 0,
//     bottom: 0,
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: 22,
//     borderTopWidth: 1,
//     borderTopColor: "#EEF1F5",
//     backgroundColor: "#FFFFFF",
//   },
//   agreeRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   checkbox: {
//     width: 22,
//     height: 22,
//     borderRadius: 6,
//     borderWidth: 1,
//     borderColor: "#CBD3DF",
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: 10,
//   },
//   checkboxActive: {
//     borderColor: BLUE,
//     backgroundColor: BLUE,
//   },
//   checkMark: {
//     fontSize: 15,
//     lineHeight: 18,
//     fontWeight: "900",
//     color: "#FFFFFF",
//   },
//   agreeText: {
//     flex: 1,
//     fontSize: 12,
//     lineHeight: 18,
//     fontWeight: "700",
//     color: "#344054",
//   },
//   continueButton: {
//     height: 50,
//     borderRadius: 7,
//     backgroundColor: "#D9DCE4",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   continueButtonActive: {
//     backgroundColor: "#18202B",
//   },
//   continueButtonText: {
//     fontSize: 14,
//     fontWeight: "900",
//     color: "#FFFFFF",
//   },
// });
