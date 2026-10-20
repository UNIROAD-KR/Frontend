import React from "react";
import {
  View,
  Pressable,
  Text,
  useWindowDimensions,
  Image,
  StyleSheet,
} from "react-native";
import { Colors, fonts } from "@/constants/theme";
import { useRouter } from "expo-router";
import { FreePostSummaryResponse } from "@/src/api/freePosts";
import { Ionicons } from "@expo/vector-icons";

const CATEGORY_MAP: Record<string, string> = {
  QUESTION: "질문글",
  CHAT: "사담글",
  WORRY: "고민글",
};

export default function FreePostList({
  data,
  boardKeyword,
  boardLoadError,
  onRetry,
}: {
  data: FreePostSummaryResponse[];
  boardKeyword: string;
  boardLoadError: boolean;
  onRetry: () => void;
}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  return (
    <View style={[styles.boardList, isWide && styles.gridList]}>
      {data.length ? (
        data.map((post) => (
          <Pressable
            key={post.id}
            style={[styles.boardCard, isWide && styles.gridCard]}
            onPress={() =>
              router.push({
                pathname: "/community-detail",
                params: { type: "free", id: String(post.id) },
              } as never)
            }
          >
            <View style={styles.boardInfo}>
              <View style={styles.boardText}>
                <Text style={styles.boardTitle} numberOfLines={1}>
                  {post.title}
                </Text>
                <Text style={styles.boardPreview} numberOfLines={1}>
                  {post.preview}
                </Text>
                <View style={styles.boardFooter}>
                  <View style={styles.statsRow}>
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>
                        {CATEGORY_MAP[post.category]}
                      </Text>
                    </View>
                    <Text style={styles.statText}>좋아요 {post.likeCount}</Text>
                    <Text style={styles.statDivider}>·</Text>
                    <Text style={styles.statText}>
                      댓글 {post.commentCount}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            {!!post.thumbnailImageUrl && (
              <View style={styles.boardThumbnail}>
                <Image
                  source={{ uri: post.thumbnailImageUrl }}
                  style={styles.boardThumbnailImage}
                />
              </View>
            )}
          </Pressable>
        ))
      ) : (
        <View style={styles.boardEmptyState}>
          <Ionicons
            name={
              boardLoadError ? "cloud-offline-outline" : "chatbubbles-outline"
            }
            size={30}
            color="#B1B8C1"
          />
          <Text style={styles.boardEmptyTitle}>
            {boardLoadError
              ? "게시글을 불러오지 못했어요"
              : boardKeyword.trim()
                ? "검색 결과가 없어요"
                : "아직 게시글이 없어요"}
          </Text>
          <Text style={styles.boardEmptyDescription}>
            {boardLoadError
              ? "잠시 후 다시 시도해주세요."
              : boardKeyword.trim()
                ? "다른 키워드로 검색해보세요."
                : "자유 게시판의 첫 글을 기다리고 있어요."}
          </Text>
          {boardLoadError && (
            <Pressable
              accessibilityRole="button"
              style={styles.boardEmptyRetry}
              onPress={() => onRetry()}
            >
              <Text style={styles.boardEmptyRetryText}>다시 시도</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  categoryTag: {
    backgroundColor: "#EAF3FF",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  categoryText: {
    ...fonts.caption4_m_12,
    color: Colors.primary.default,
  },
  boardList: {
    gap: 0,
  },
  gridList: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  boardCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  gridCard: {
    width: "48.7%",
  },
  boardEmptyState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  boardEmptyTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: "#333D4B",
    textAlign: "center",
  },
  boardEmptyDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: "#8B95A1",
    textAlign: "center",
  },
  boardEmptyRetry: {
    marginTop: 8,
    borderRadius: 18,
    backgroundColor: "#F0F2F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  boardEmptyRetryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4E5968",
  },
  boardTitle: {
    ...fonts.sub3_sb_16,
    color: Colors.gray[11],
  },
  boardPreview: {
    marginTop: 4,
    ...fonts.body4_r_14,
    color: Colors.gray[6],
  },
  boardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statDivider: {
    fontSize: 13,
    color: "#596579",
  },
  statText: {
    ...fonts.caption3_m_13,
    color: Colors.gray[8],
  },
  boardInfo: {
    minHeight: 76,
    flex: 1,
    minWidth: 0,
    justifyContent: "space-between",
  },
  boardText: {
    flex: 1,
    justifyContent: "center",
  },
  boardThumbnail: {
    width: 76,
    height: 76,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E1E4E9",
  },
  boardThumbnailImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
