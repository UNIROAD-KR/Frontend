import { Modal as AppModal } from "@/components/ui/modal";
import { useCallback, useState } from "react";

export type AppAlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

type AlertState = {
  visible: boolean;
  title: string;
  description?: string;
  buttons: AppAlertButton[];
};

// Alert.alert 와 같은 호출 형태로 커스텀 Modal 을 띄운다. (버튼은 최대 3개)
export function useAppAlert() {
  const [state, setState] = useState<AlertState>({
    visible: false,
    title: "",
    buttons: [],
  });

  const close = useCallback(
    () => setState((prev) => ({ ...prev, visible: false })),
    [],
  );

  const showAlert = useCallback(
    (title: string, description?: string, buttons: AppAlertButton[] = []) =>
      setState({ visible: true, title, description, buttons }),
    [],
  );

  const buttons = state.buttons.length
    ? state.buttons
    : [{ text: "확인" } as AppAlertButton];
  const ordered = [
    ...buttons.filter((b) => b.style === "cancel"),
    ...buttons.filter((b) => b.style !== "cancel"),
  ].slice(0, 3);
  const mapped = ordered.map((b) => ({
    label: b.text,
    tone: b.style === "destructive" ? ("destructive" as const) : undefined,
    onPress: () => {
      close();
      b.onPress?.();
    },
  }));
  const backdropButton =
    ordered.find((b) => b.style === "cancel") ??
    (ordered.length === 1 ? ordered[0] : undefined);

  const alertElement = (
    <AppModal
      isOpen={state.visible}
      onClose={() => {
        close();
        backdropButton?.onPress?.();
      }}
      title={state.title}
      description={state.description}
      primaryButton={mapped[mapped.length - 1]}
      secondaryButton={
        mapped.length > 1 ? mapped[mapped.length - 2] : undefined
      }
      tertiaryButton={mapped.length > 2 ? mapped[mapped.length - 3] : undefined}
    />
  );

  return { showAlert, alertElement };
}
