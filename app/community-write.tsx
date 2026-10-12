import { CommunityCompanionWriteForm } from "@/components/community/CommunityCompanionWriteForm";
import { CommunityFreeWriteForm } from "@/components/community/CommunityFreeWriteForm";
import { useLocalSearchParams } from "expo-router";
import React from "react";

export default function CommunityWriteScreen() {
  const { type } = useLocalSearchParams<{ type?: string }>();

  return type === "companion" ? (
    <CommunityCompanionWriteForm />
  ) : (
    <CommunityFreeWriteForm />
  );
}
