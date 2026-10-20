import { useCallback, useState } from "react";
import { router } from "expo-router";

import { Modal } from "@/components/ui/modal";
import { getMarketAccess } from "@/src/utils/verification";

export function useMarketVerification() {
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);

  const checkVerified = useCallback(async () => {
    try {
      const access = await getMarketAccess();
      if (access === "allowed") return true;
      setPending(access === "verificationPending");
    } catch (error: any) {
      console.log("내 정보 조회 실패:", error.response?.data || error.message);
      setPending(false);
    }
    setVisible(true);
    return false;
  }, []);

  const close = () => setVisible(false);

  const verificationModal = (
    <Modal
      isOpen={visible}
      onClose={close}
      title={pending ? "서류 심사 결과를 기다려주세요." : "교환학생 인증"}
      description={
        pending
          ? "제출하신 서류를 심사 중이에요.\n승인 후 중고거래를 이용할 수 있어요."
          : "중고거래를 이용하려면 교환학생 신원 인증이 필요해요."
      }
      secondaryButton={pending ? undefined : { label: "취소", onPress: close }}
      primaryButton={
        pending
          ? { label: "확인", onPress: close }
          : {
              label: "신원 인증하기",
              onPress: () => {
                close();
                router.push("/verification-consent" as any);
              },
            }
      }
    />
  );

  return { checkVerified, verificationModal };
}
