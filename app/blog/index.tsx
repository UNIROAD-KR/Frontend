import { Text } from "@/components/ui/app-text";
import { AppBackButton } from "@/components/ui/app-back-button";
import { Colors, fonts } from "@/constants/theme";
import { getBlogPosts, type BlogPostSummary } from "@/src/api/blog";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatDate = (value: string) => value.slice(0, 10).replaceAll("-", ".");

export default function BlogPreviewScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<BlogPostSummary[]>([]);
  const [nextCursorId, setNextCursorId] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  const loadPosts = useCallback(async (cursorId?: number) => {
    try {
      if (cursorId === undefined) {
        setLoading(true);
        setLoadFailed(false);
      } else {
        setLoadingMore(true);
        setLoadMoreFailed(false);
      }

      const response = await getBlogPosts({ cursorId });
      const page = response.data.data;
      setPosts((current) =>
        cursorId === undefined ? page.items : [...current, ...page.items],
      );
      setNextCursorId(page.nextCursorId ?? null);
      setHasNext(page.hasNext);
    } catch (error: any) {
      console.error("블로그 목록 조회 실패:", error.response?.data || error.message);
      if (cursorId === undefined) {
        setLoadFailed(true);
      } else {
        setLoadMoreFailed(true);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AppBackButton fallbackHref="/home/profile-settings" />
        <Text style={styles.headerTitle}>블로그 미리보기</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Colors.primary.default} />
          </View>
        ) : loadFailed ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>블로그 목록을 불러오지 못했어요.</Text>
            <Pressable style={styles.retryButton} onPress={() => void loadPosts()}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>공개된 블로그 글이 없어요.</Text>
          </View>
        ) : (
          <>
            {posts.map((post) => (
              <Pressable
                key={post.id}
                style={styles.postCard}
                onPress={() =>
                  router.push({
                    pathname: "/blog/[slug]",
                    params: { slug: post.slug },
                  })
                }
              >
                {post.thumbnailUrl ? (
                  <Image source={{ uri: post.thumbnailUrl }} style={styles.thumbnail} />
                ) : (
                  <View style={styles.thumbnailPlaceholder}>
                    <Ionicons name="newspaper-outline" size={25} color={Colors.gray[5]} />
                  </View>
                )}
                <View style={styles.postText}>
                  <Text style={styles.author}>유니로드</Text>
                  <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
                  <Text style={styles.summary} numberOfLines={2}>{post.summary}</Text>
                  <View style={styles.meta}>
                    <Text style={styles.date}>{formatDate(post.publishedAt)}</Text>
                    <View style={styles.metaItem}>
                      <Ionicons name="eye-outline" size={14} color={Colors.gray[6]} />
                      <Text style={styles.metaText}>{post.viewCount}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="heart-outline" size={14} color={Colors.gray[6]} />
                      <Text style={styles.metaText}>{post.likeCount}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}

            {hasNext && nextCursorId !== null && (
              <View>
                {loadMoreFailed && (
                  <Text style={styles.loadMoreError}>
                    다음 글을 불러오지 못했어요.
                  </Text>
                )}
                <Pressable
                  style={styles.moreButton}
                  onPress={() => void loadPosts(nextCursorId)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator color={Colors.primary.default} />
                  ) : (
                    <Text style={styles.moreText}>
                      {loadMoreFailed ? "다시 시도" : "더 보기"}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F7F9" },
  header: {
    minHeight: 64,
    paddingBottom: 8,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[2],
  },
  headerTitle: { ...fonts.sub3_sb_16, color: Colors.gray[10] },
  headerSpacer: { width: 34 },
  content: { padding: 16, gap: 12, paddingBottom: 36 },
  stateBox: { minHeight: 220, alignItems: "center", justifyContent: "center", gap: 14 },
  stateText: { ...fonts.body2_m_14, color: Colors.gray[7] },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: Colors.primary.default,
  },
  retryText: { ...fonts.body4_r_14, color: Colors.common.white },
  postCard: {
    padding: 12,
    flexDirection: "row",
    gap: 12,
    borderRadius: 12,
    backgroundColor: Colors.common.white,
  },
  thumbnail: { width: 96, height: 96, borderRadius: 8, backgroundColor: Colors.gray[2] },
  thumbnailPlaceholder: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: Colors.gray[2],
  },
  postText: { flex: 1, justifyContent: "center", gap: 4 },
  author: { ...fonts.caption4_m_12, color: Colors.primary.default },
  title: { ...fonts.sub4_sb_14, color: Colors.gray[10] },
  summary: { ...fonts.body4_r_14, color: Colors.gray[7] },
  meta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 },
  date: { ...fonts.caption6_r_12, color: Colors.gray[6], flex: 1 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { ...fonts.caption6_r_12, color: Colors.gray[6] },
  moreButton: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 9,
    backgroundColor: Colors.common.white,
  },
  moreText: { ...fonts.body2_m_14, color: Colors.gray[8] },
  loadMoreError: {
    ...fonts.body4_r_14,
    color: Colors.gray[7],
    textAlign: "center",
    marginBottom: 8,
  },
});
