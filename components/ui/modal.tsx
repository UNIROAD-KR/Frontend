import React from "react";
import { Modal as RNModal, Pressable, View } from "react-native";

import { Text } from "@/components/ui/app-text";
import { Colors, fonts } from "@/constants/theme";

interface ModalButton {
  label: string;
  onPress: () => void;
}

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  description?: string;
  primaryButton?: ModalButton;
  secondaryButton?: ModalButton;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  primaryButton,
  secondaryButton,
}: ModalProps) {
  return (
    <RNModal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            width: "100%",
            maxWidth: 340,
            gap: 8,
            paddingHorizontal: 20,
            paddingVertical: 24,
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
          }}
        >
          <Text style={[fonts.title5_b_20, { color: Colors.common.black }]}>
            {title}
          </Text>
          {description ? (
            <Text style={[fonts.body4_r_14, { color: Colors.gray[7] }]}>
              {description}
            </Text>
          ) : null}
          {primaryButton || secondaryButton ? (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              {secondaryButton ? (
                <Pressable
                  onPress={secondaryButton.onPress}
                  style={{
                    minWidth: 80,
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={[fonts.sub4_sb_14, { color: Colors.gray[8] }]}>
                    {secondaryButton.label}
                  </Text>
                </Pressable>
              ) : null}
              {primaryButton ? (
                <Pressable
                  onPress={primaryButton.onPress}
                  style={{
                    minWidth: 80,
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={[fonts.sub4_sb_14, { color: Colors.primary.default }]}
                  >
                    {primaryButton.label}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
