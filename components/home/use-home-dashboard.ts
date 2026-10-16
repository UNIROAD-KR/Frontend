import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { getMemberMe, type CurrentSituation } from "@/src/api/auth";
import { getMyVerifications } from "@/src/api/verification";
import { currentSituationLifecycleMap, statusDisplayMap } from "@/components/constants";
import type { LifecycleStatus } from "@/components/types";

const situations: Record<CurrentSituation, string> = {
  PREPARING_APPLICATION: "파견 지원 준비 중", WAITING_RESULT: "파견 결과 대기 중", ACCEPTED: "파견 확정",
  PREPARING_DEPARTURE: "출국 준비 중", DISPATCHED: "파견 중", RETURNED: "귀국 완료",
};
const initial = {
  country: "", university: "", lifecycleStatus: "지원 준비 중" as LifecycleStatus,
  situationText: "상태 미설정", verified: false, pending: false,
  applicationDeadline: "", departureDate: "", dispatchStartDate: "",
};
export function useHomeDashboard() {
  const [data, setData] = useState(initial);
  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      const keys = ["dispatchedCountry", "dispatchedUniversity", "profileStatus", "exchangeStatus", "applicationDeadline", "departureDate", "dispatchStartDate", "isVerified", "isVerificationPending", "profileFieldOverrides"];
      const [memberResult, verificationResult, storageResult] = await Promise.allSettled([
        getMemberMe(), getMyVerifications(), AsyncStorage.multiGet(keys),
      ]);
      const saved = Object.fromEntries(storageResult.status === "fulfilled" ? storageResult.value : []);
      const member = memberResult.status === "fulfilled" ? memberResult.value.data.data : null;
      let overrides: Record<string, unknown> = {};
      try {
        const parsed = JSON.parse(saved.profileFieldOverrides || "{}");
        if (parsed && typeof parsed === "object") overrides = parsed;
      } catch { /* Use saved profile values. */ }
      const situation = member?.currentSituation;
      const storedStatus = saved.profileStatus as LifecycleStatus;
      const lifecycleStatus = situation ? currentSituationLifecycleMap[situation] :
        (["지원 준비 중", "출국 준비 중", "파견 중", "귀국"].includes(storedStatus) ? storedStatus : statusDisplayMap[saved.exchangeStatus || ""] || "지원 준비 중");
      const verifications = verificationResult.status === "fulfilled" ? verificationResult.value.data.data : null;
      const verified = verifications ? verifications.some((item) => item.status === "APPROVED") : saved.isVerified === "true";
      const pending = verifications ? !verified && verifications.some((item) => item.status === "PENDING") : saved.isVerificationPending === "true";
      if (active) setData({
        country: member?.dispatchedCountry || saved.dispatchedCountry || "",
        university: (overrides.dispatchedUniversity ? saved.dispatchedUniversity : member?.dispatchedUniversity || saved.dispatchedUniversity) || "",
        lifecycleStatus, situationText: situation ? situations[situation] : lifecycleStatus,
        verified, pending,
        applicationDeadline: member?.applicationDeadline || saved.applicationDeadline || "",
        departureDate: member?.departureDate || saved.departureDate || "",
        dispatchStartDate: member?.dispatchStartDate || saved.dispatchStartDate || "",
      });
    };
    void load();
    return () => { active = false; };
  }, []));
  return data;
}
