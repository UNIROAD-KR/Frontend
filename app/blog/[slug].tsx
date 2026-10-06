import { Text } from "@/components/ui/app-text";
import { AppBackButton } from "@/components/ui/app-back-button";
import { Colors, fonts } from "@/constants/theme";
import {
  getBlogPost,
  toggleBlogPostLike,
  type BlogPostDetail,
} from "@/src/api/blog";
import { Ionicons } from "@expo/vector-icons";
import RenderHTML from "react-native-render-html";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const formatDate = (value: string) => value.slice(0, 10).replaceAll("-", ".");

export default function BlogPostPreviewScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const [post, setPost] = useState<BlogPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadPost = async () => {
      if (!slug) {
        setLoadFailed(true);
        setLoading(false);
        return;
      }
      try {
        const response = await getBlogPost(slug);
        if (active) setPost(response.data.data);
      } catch (error: any) {
        console.error("블로그 상세 조회 실패:", error.response?.data || error.message);
        if (active) setLoadFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPost();
    return () => {
      active = false;
    };
  }, [slug]);

  const handleLike = async () => {
    if (!post || likeLoading) return;
    setLikeLoading(true);
    try {
      const response = await toggleBlogPostLike(post.id);
      setPost((current) =>
        current
          ? {
              ...current,
              likedByMe: response.data.data.liked,
              likeCount: response.data.data.likeCount,
            }
          : current,
      );
    } catch (error: any) {
      console.error("블로그 좋아요 처리 실패:", error.response?.data || error.message);
      Alert.alert("좋아요 실패", "잠시 후 다시 시도해주세요.");
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <AppBackButton fallbackHref="/blog" />
        <Text style={styles.headerTitle}>블로그</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={Colors.primary.default} />
        </View>
      ) : loadFailed || !post ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>블로그 글을 불러오지 못했어요.</Text>
          <Text style={styles.retryHint}>목록으로 돌아가 다시 확인해주세요.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {post.thumbnailUrl ? (
            <Image source={{ uri: post.thumbnailUrl }} style={styles.thumbnail} />
          ) : null}
          <View style={styles.article}>
            <Text style={styles.author}>유니로드</Text>
            <Text style={styles.title}>{post.title}</Text>
            {!!post.summary && <Text style={styles.summary}>{post.summary}</Text>}
            <View style={styles.meta}>
              <Text style={styles.date}>{formatDate(post.publishedAt)}</Text>
              <View style={styles.metaItem}>
                <Ionicons name="eye-outline" size={16} color={Colors.gray[6]} />
                <Text style={styles.metaText}>{post.viewCount}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={post.likedByMe ? "좋아요 취소" : "좋아요"}
                style={styles.metaItem}
                onPress={() => void handleLike()}
                disabled={likeLoading}
              >
                <Ionicons
                  name={post.likedByMe ? "heart" : "heart-outline"}
                  size={16}
                  color={post.likedByMe ? "#F04452" : Colors.gray[6]}
                />
                <Text style={styles.metaText}>{post.likeCount}</Text>
              </Pressable>
            </View>
            {post.tags.length > 0 && (
              <View style={styles.tags}>
                {post.tags.map((tag) => (
                  <Text key={tag} style={styles.tag}>#{tag}</Text>
                ))}
              </View>
            )}
            <View style={styles.divider} />
            <RenderHTML
              contentWidth={width - 40}
              source={{ html: post.contentHtml }}
              baseStyle={styles.htmlBase}
              tagsStyles={{
                h1: styles.htmlHeading,
                h2: styles.htmlHeading,
                p: styles.htmlParagraph,
                a: { color: Colors.primary.default },
                img: { maxWidth: width - 40 },
              }}
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.common.white },
  header: {
    minHeight: 64,
    paddingBottom: 8,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[2],
  },
  headerTitle: { ...fonts.sub3_sb_16, color: Colors.gray[10] },
  headerSpacer: { width: 34 },
  content: { paddingBottom: 40 },
  stateBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  stateText: { ...fonts.body2_m_14, color: Colors.gray[8] },
  retryHint: { ...fonts.body4_r_14, color: Colors.gray[6] },
  thumbnail: { width: "100%", height: 220, backgroundColor: Colors.gray[2] },
  article: { paddingHorizontal: 20, paddingTop: 24 },
  author: { ...fonts.caption3_m_13, color: Colors.primary.default, marginBottom: 8 },
  title: { ...fonts.title3_b_24, color: Colors.gray[10] },
  summary: { ...fonts.body1_m_16, color: Colors.gray[8], marginTop: 12 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 16,
  },
  date: { ...fonts.body4_r_14, color: Colors.gray[6], flex: 1 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { ...fonts.caption3_m_13, color: Colors.gray[7] },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  tag: {
    ...fonts.caption3_m_13,
    color: Colors.primary.default,
    backgroundColor: "#F0F3FF",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
  },
  divider: { height: 1, backgroundColor: Colors.gray[2], marginVertical: 20 },
  htmlBase: { ...fonts.body3_r_16, color: Colors.gray[10] },
  htmlHeading: { ...fonts.title5_b_20, color: Colors.gray[10], marginVertical: 12 },
  htmlParagraph: { marginTop: 0, marginBottom: 16 },
});
