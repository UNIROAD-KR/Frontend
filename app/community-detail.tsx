import { Text, TextInput } from "@/components/ui/app-text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { Colors, fonts } from "@/constants/theme";

import { createOrGetChatRoom } from "../src/api/chat";
import { getMemberMe } from "../src/api/auth";
import {
  AppBackButton,
  goBackOrReplace,
} from "@/components/ui/app-back-button";
import {
  CompanionPostResponse,
  deleteCompanionPost,
  getCompanionPostDetail,
  getScrappedCompanionPosts,
  toggleCompanionPostScrap,
  updateCompanionPost,
} from "../src/api/companion";
import {
  FreePostCommentResponse,
  FreePostDetailResponse,
  createFreePostComment,
  deleteFreePost,
  deleteFreePostComment,
  getFreePostDetail,
  getScrappedFreePosts,
  toggleFreePostLike,
  toggleFreePostScrap,
} from "../src/api/freePosts";
import { createReport, ReportReason } from "../src/api/reports";
import { BLUE } from "../src/data/community";

const LIKED_FREE_POSTS_STORAGE_KEY = "univ:profile:liked-free-posts";

type DetailType = "free" | "companion";
type DetailPost = FreePostDetailResponse | CompanionPostResponse;
type StoredLikedFreePost = FreePostDetailResponse & {
  preview?: string;
  thumbnailImageUrl?: string;
};
type FreeComment = {
  id: number;
  author: string;
  content: string;
  time: string;
  mine?: boolean;
};

const isCompanionApiPost = (post: DetailPost): post is CompanionPostResponse =>
  "memberName" in post;

const formatDate = (value?: string) => {
  if (!value) {
    return "";
  }

  return value.replaceAll("-", ".");
};

const formatCompanionCreatedAt = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return formatCompanionDate(value.slice(0, 10));
  }
  const dateText = formatCompanionDate(value);
  const timeText = `${`${date.getHours()}`.padStart(2, "0")}:${`${date.getMinutes()}`.padStart(2, "0")}`;
  return `${dateText}  ${timeText}`;
};

const formatCompanionDate = (value?: string) => {
  if (!value) return "";
  const date = value.slice(0, 10).split("-");
  return date.length === 3
    ? `${date[0]}. ${date[1]}. ${date[2]}`
    : formatDate(value);
};

const formatCompanionPeriod = (startDate?: string, endDate?: string) => {
  const format = (value?: string) => {
    if (!value) return "";
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return formatCompanionDate(value);
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    return `${formatCompanionDate(value)} (${weekday})`;
  };
  const start = format(startDate);
  const end = format(endDate);
  return !start ? "" : !end || start === end ? start : `${start} - ${end}`;
};

const getCompanionStatusText = (status: CompanionPostResponse["status"]) =>
  status === "RECRUITING" ? "모집중" : "모집완료";

const getBoardStatusColors = (status: string) => {
  if (status === "파견 중") {
    return { backgroundColor: "#DDF4E4", color: "#238451" };
  }

  if (status === "파견 전") {
    return { backgroundColor: "#EAF1FF", color: "#2F66D0" };
  }

  return { backgroundColor: "#FFF1DF", color: "#F28A2E" };
};

const mapFreeComment = (comment: FreePostCommentResponse): FreeComment => ({
  id: comment.id,
  author: comment.authorName || "익명",
  content: comment.content,
  time: formatCompanionCreatedAt(comment.createdAt),
  mine: comment.mine,
});

const syncLikedFreePostStorage = async (
  post: FreePostDetailResponse,
  liked: boolean,
) => {
  const rawPosts = await AsyncStorage.getItem(LIKED_FREE_POSTS_STORAGE_KEY);
  const savedPosts = rawPosts
    ? (JSON.parse(rawPosts) as StoredLikedFreePost[])
    : [];
  const nextPosts = savedPosts.filter((item) => item.id !== post.id);

  if (liked) {
    nextPosts.unshift({
      id: post.id,
      title: post.title,
      content: post.content,
      preview: post.content?.slice(0, 80) ?? "",
      country: post.country,
      status: post.status,
      authorName: post.authorName,
      imageUrls: post.imageUrls,
      thumbnailImageUrl: post.imageUrls?.[0],
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      liked: true,
      mine: post.mine,
      createdAt: post.createdAt,
    });
  }

  await AsyncStorage.setItem(
    LIKED_FREE_POSTS_STORAGE_KEY,
    JSON.stringify(nextPosts.slice(0, 50)),
  );
};

export default function CommunityDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    type = "free",
    id,
    fromProfileList,
  } = useLocalSearchParams<{
    type?: DetailType;
    id?: string;
    fromProfileList?: string;
  }>();
  const postId = Number(id);
  const detailType: DetailType = type === "companion" ? "companion" : "free";
  const headerPaddingTop = insets.top + 8;
  const headerHeight = headerPaddingTop + 56;
  const [post, setPost] = useState<DetailPost | null>(null);
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const chatPending = useRef(false);
  const [currentMemberName, setCurrentMemberName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const commentInputRef = useRef<TextInput>(null);
  const [commentSort, setCommentSort] = useState<"oldest" | "newest">("oldest");
  const [commentText, setCommentText] = useState("");
  const [scrapped, setScrapped] = useState(false);
  const [scrapCount, setScrapCount] = useState(0);

  const loadPost = useCallback(async () => {
    if (!postId) {
      setPost(null);
      setLoading(false);
      return;
    }

    try {
      if (detailType === "companion") {
        const response = await getCompanionPostDetail(postId);
        const nextPost = response.data.data;

        setPost(nextPost);
        setScrapCount(nextPost.scrapCount ?? 0);

        try {
          const scrapResponse = await getScrappedCompanionPosts({ size: 100 });
          setScrapped(
            (scrapResponse.data.data.items ?? []).some(
              (item) => item.id === postId,
            ),
          );
        } catch (scrapError: any) {
          console.log(
            "스크랩한 동행 글 확인 실패:",
            scrapError.response?.data || scrapError.message,
          );
        }
        return;
      }

      const response = await getFreePostDetail(postId);
      const nextPost = response.data.data;
      setPost(nextPost);
      setScrapCount(nextPost.scrapCount ?? 0);

      try {
        const scrapResponse = await getScrappedFreePosts({ size: 100 });
        setScrapped(
          (scrapResponse.data.data.items ?? []).some(
            (item) => item.id === postId,
          ),
        );
      } catch (scrapError: any) {
        console.log(
          "스크랩한 자유게시판 글 확인 실패:",
          scrapError.response?.data || scrapError.message,
        );
      }

      if (nextPost.liked) {
        await syncLikedFreePostStorage(nextPost, true);
      }
    } catch (error: any) {
      console.log(
        "게시글 상세 조회 실패:",
        error.response?.data || error.message,
      );
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [detailType, postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    const loadMember = async () => {
      const savedNickname = await AsyncStorage.getItem("nickname");

      try {
        const response = await getMemberMe();
        setCurrentMemberId(response.data.data.id);
        setCurrentMemberName(response.data?.data?.name || savedNickname || "");
      } catch (error: any) {
        console.log(
          "내 정보 조회 실패:",
          error.response?.data || error.message,
        );
        setCurrentMemberName(savedNickname || "");
      }
    };

    loadMember();
  }, []);

  const viewModel = useMemo(() => {
    if (!post) {
      return null;
    }

    if (detailType === "companion") {
      if (isCompanionApiPost(post)) {
        return {
          author: post.memberName,
          title: post.title,
          content: post.content,
          country: post.country,
          region: post.region,
          status: getCompanionStatusText(post.status),
          statusColor: post.status === "RECRUITING" ? "#EAF1FF" : "#F0F2F6",
          statusTextColor: post.status === "RECRUITING" ? BLUE : "#6B7684",
          period: formatCompanionPeriod(post.startDate, post.endDate),
          current: post.currentParticipants,
          total: post.capacity,
          chatLink: post.chatLink,
          genderRatio: post.genderRatio || "무관",
          createdAt: formatCompanionCreatedAt(post.createdAt),
          isMine: false,
        };
      }
    }

    const boardPost = post as FreePostDetailResponse;
    const statusColors = getBoardStatusColors(boardPost.status);

    return {
      author: boardPost.authorName || "익명",
      authorNickname: boardPost.authorNickname || boardPost.authorName || "익명",
      title: boardPost.title,
      content: boardPost.content,
      country: boardPost.country,
      status: boardPost.status,
      statusColor: statusColors.backgroundColor,
      statusTextColor: statusColors.color,
      createdAt: formatCompanionCreatedAt(boardPost.createdAt),
      likes: boardPost.likeCount,
      comments: boardPost.commentCount,
      liked: boardPost.liked,
      imageUrls: boardPost.imageUrls ?? [],
      commentItems: (boardPost.comments ?? []).map(mapFreeComment),
      isMine: boardPost.mine,
    };
  }, [detailType, post]);

  const isAuthor =
    post && isCompanionApiPost(post)
      ? currentMemberId !== null && currentMemberId === post.memberId
      : !!viewModel &&
        (viewModel.isMine ||
          (!!currentMemberName && currentMemberName === viewModel.author));

  const handleStartCompanionChat = async () => {
    if (!post || !isCompanionApiPost(post) || chatPending.current || isAuthor)
      return;
    if (!Number.isInteger(post.memberId) || post.memberId <= 0) {
      Alert.alert(
        "채팅을 시작할 수 없어요",
        "작성자 정보를 확인할 수 없어요. 잠시 후 다시 시도해주세요.",
      );
      return;
    }

    chatPending.current = true;
    setChatLoading(true);
    try {
      const response = await createOrGetChatRoom({
        referenceType: "COMPANION",
        referenceId: post.id,
        targetMemberId: post.memberId,
      });
      const roomId = response.data.roomId;
      if (!roomId) throw new Error("채팅방 ID가 응답에 없습니다.");
      router.push({
        pathname: "/chat/[roomId]",
        params: {
          roomId: String(roomId),
          title: post.title,
          sellerName: post.memberName,
          referenceType: "COMPANION",
          referenceId: String(post.id),
          opponentMemberId: String(post.memberId),
        },
      });
    } catch (error: any) {
      Alert.alert(
        "채팅방 생성 실패",
        error.response?.data?.message || "잠시 후 다시 시도해주세요.",
      );
    } finally {
      chatPending.current = false;
      setChatLoading(false);
    }
  };

  const handleShareCompanionPost = async () => {
    if (!viewModel) return;
    try {
      await Share.share({ message: viewModel.title });
    } catch (error) {
      console.log("동행 모집글 공유 실패:", error);
    }
  };

  const handleOpenCompanionChatLink = async () => {
    if (!viewModel?.chatLink) return;
    try {
      await Linking.openURL(viewModel.chatLink);
    } catch (error) {
      console.log("오픈채팅 링크 열기 실패:", error);
      Alert.alert("링크를 열 수 없어요", "잠시 후 다시 시도해주세요.");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPost();
    setRefreshing(false);
    setMenuVisible(false);
    Alert.alert("새로고침 완료", "게시글 내용을 다시 불러왔어요.");
  };

  const handleEdit = () => {
    if (!viewModel || !post) {
      return;
    }

    setMenuVisible(false);

    if (detailType === "companion") {
      const params = isCompanionApiPost(post)
        ? {
            type: "companion",
            mode: "edit",
            id: String(post.id),
            title: post.title,
            body: post.content,
            country: post.country,
            region: post.region,
            startDate: post.startDate,
            endDate: post.endDate,
            chatLink: post.chatLink,
            capacity: String(post.capacity),
            currentParticipants: String(post.currentParticipants),
            genderRatio: post.genderRatio || "",
            status: post.status,
          }
        : null;

      if (!params) {
        return;
      }

      router.push({ pathname: "/community-write", params } as never);
      return;
    }

    router.push({
      pathname: "/community-write",
      params: {
        type: "free",
        mode: "edit",
        id: String(postId),
        title: viewModel.title,
        body: viewModel.content,
        country: viewModel.country,
        freeStatus: viewModel.status,
        imageUrls: JSON.stringify(viewModel.imageUrls ?? []),
      },
    } as never);
  };

  const handleLikePress = async () => {
    if (detailType !== "free" || !postId || !post) {
      return;
    }

    try {
      const response = await toggleFreePostLike(postId);
      const nextPost = {
        ...(post as FreePostDetailResponse),
        liked: response.data.data.liked,
        likeCount: response.data.data.likeCount,
      };

      setPost(nextPost);
      await syncLikedFreePostStorage(nextPost, response.data.data.liked);
    } catch (error: any) {
      console.log(
        "자유게시판 좋아요 실패:",
        error.response?.data || error.message,
      );
      Alert.alert("처리 실패", "좋아요 상태를 변경하지 못했어요.");
    }
  };

  const handleScrapPress = async () => {
    if (!postId || !post) {
      return;
    }

    const wasScrapped = scrapped;

    setScrapped((prev) => !prev);

    try {
      const response =
        detailType === "companion"
          ? await toggleCompanionPostScrap(postId)
          : await toggleFreePostScrap(postId);
      const nextScrapped = response.data.data;

      setScrapped(nextScrapped);
      setScrapCount((prev) =>
        Math.max(
          0,
          prev + (nextScrapped === wasScrapped ? 0 : nextScrapped ? 1 : -1),
        ),
      );
    } catch (error: any) {
      console.log("게시글 스크랩 실패:", error.response?.data || error.message);
      setScrapped(wasScrapped);
      Alert.alert("저장 실패", "게시글 저장 상태를 변경하지 못했어요.");
    }
  };

  const handleSubmitComment = async () => {
    const trimmedComment = commentText.trim();

    if (!trimmedComment || detailType !== "free" || !postId || !post) {
      return;
    }

    try {
      const response = await createFreePostComment(postId, trimmedComment);
      const boardPost = post as FreePostDetailResponse;

      setPost({
        ...boardPost,
        commentCount: boardPost.commentCount + 1,
        comments: [...(boardPost.comments ?? []), response.data.data],
      });
      setCommentText("");
    } catch (error: any) {
      console.log(
        "자유게시판 댓글 작성 실패:",
        error.response?.data || error.message,
      );
      Alert.alert("등록 실패", "댓글을 등록하지 못했어요.");
    }
  };

  const handleReportPost = () => {
    const reasons: { text: string; reason: ReportReason }[] = [
      { text: "스팸 / 광고", reason: "SPAM" },
      { text: "욕설 / 비방", reason: "ABUSE" },
      { text: "부적절한 내용", reason: "INAPPROPRIATE" },
    ];
    Alert.alert("게시글 신고", "신고 사유를 선택해주세요.", [
      ...reasons.map(({ text, reason }) => ({
        text,
        onPress: async () => {
          try {
            await createReport({
              targetType: "FREE_POST",
              targetId: postId,
              reason,
            });
            Alert.alert("신고 완료", "신고가 접수되었어요.");
          } catch {
            Alert.alert("신고 실패", "잠시 후 다시 시도해주세요.");
          }
        },
      })),
      { text: "취소", style: "cancel" },
    ]);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (detailType !== "free" || !postId || !post) {
      return;
    }

    try {
      await deleteFreePostComment(postId, commentId);
      const boardPost = post as FreePostDetailResponse;

      setPost({
        ...boardPost,
        commentCount: Math.max(0, boardPost.commentCount - 1),
        comments: (boardPost.comments ?? []).filter(
          (comment) => comment.id !== commentId,
        ),
      });
    } catch (error: any) {
      console.log(
        "자유게시판 댓글 삭제 실패:",
        error.response?.data || error.message,
      );
      Alert.alert("삭제 실패", "댓글을 삭제하지 못했어요.");
    }
  };

  const handleDeletePost = () => {
    if (!postId) {
      return;
    }

    setMenuVisible(false);
    Alert.alert("게시글 삭제", "게시글을 삭제할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            if (detailType === "companion") {
              await deleteCompanionPost(postId);
            } else {
              await deleteFreePost(postId);
            }

            goBackOrReplace("/community");
          } catch (error: any) {
            console.log(
              "게시글 삭제 실패:",
              error.response?.data || error.message,
            );
            Alert.alert("삭제 실패", "게시글을 삭제하지 못했어요.");
          }
        },
      },
    ]);
  };

  const handleParticipantsChange = async (delta: 1 | -1) => {
    if (!post || !viewModel || detailType !== "companion") {
      return;
    }

    const currentParticipants = Number(viewModel.current);
    const capacity = Number(viewModel.total);
    const nextParticipants = currentParticipants + delta;

    if (nextParticipants < 1) {
      Alert.alert("변경 불가", "모집 인원은 1명보다 작아질 수 없어요.");
      return;
    }

    if (nextParticipants > capacity) {
      Alert.alert("변경 불가", "모집 인원은 전체 정원을 넘을 수 없어요.");
      return;
    }

    setMenuVisible(false);

    if (isCompanionApiPost(post)) {
      const nextStatus =
        nextParticipants >= post.capacity ? "COMPLETED" : "RECRUITING";

      try {
        await updateCompanionPost(post.id, {
          title: post.title,
          content: post.content,
          startDate: post.startDate,
          endDate: post.endDate,
          country: post.country,
          region: post.region,
          chatLink: post.chatLink,
          status: nextStatus,
          capacity: post.capacity,
          currentParticipants: nextParticipants,
          genderRatio: post.genderRatio,
        });

        setPost({
          ...post,
          status: nextStatus,
          currentParticipants: nextParticipants,
        });
      } catch (error: any) {
        console.log(
          "동행 모집 인원 변경 실패:",
          error.response?.data || error.message,
        );
        Alert.alert("변경 실패", "모집 인원을 변경하지 못했어요.");
      }

      return;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={BLUE} />
      </View>
    );
  }

  if (!viewModel) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>게시글을 찾을 수 없어요.</Text>
        <Pressable
          style={styles.emptyButton}
          onPress={() => goBackOrReplace("/community")}
        >
          <Text style={styles.emptyButtonText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const freeCommentItems =
    detailType === "free"
      ? [...(viewModel.commentItems ?? [])].sort((a, b) =>
          commentSort === "oldest" ? a.id - b.id : b.id - a.id,
        )
      : [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View
        style={[
          styles.header,
          { height: headerHeight, paddingTop: headerPaddingTop },
        ]}
      >
        <AppBackButton
          onPress={() => {
            if (
              fromProfileList === "liked" ||
              fromProfileList === "free" ||
              fromProfileList === "companion" ||
              fromProfileList === "saved" ||
              fromProfileList === "written"
            ) {
              router.replace({
                pathname: "/home/profile-list",
                params: { type: fromProfileList },
              } as never);
              return;
            }

            goBackOrReplace("/community");
          }}
          style={styles.headerIconButton}
        />
        <Text style={styles.headerTitle}>
          {detailType === "companion" ? "동행 모집" : "자유 게시판"}
        </Text>
        <Pressable
          style={styles.headerIconButton}
          onPress={() => setMenuVisible(true)}
        >
          <Ionicons name="ellipsis-horizontal" size={23} color="#111111" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          detailType === "free" && styles.freeContent,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {detailType === "companion" ? (
          <>
            <View style={styles.companionTitleBlock}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: viewModel.statusColor },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    { color: viewModel.statusTextColor },
                  ]}
                >
                  {viewModel.status}
                </Text>
              </View>
              <View style={styles.companionTitleRow}>
                <Text style={styles.title}>{viewModel.title}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="동행 모집글 공유"
                  onPress={handleShareCompanionPost}
                  style={styles.shareButton}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={22}
                    color="#191F28"
                  />
                </Pressable>
              </View>
              <Text style={styles.companionCreatedAt}>
                {viewModel.createdAt}
              </Text>
            </View>

            <View style={styles.authorCard}>
              <View style={styles.authorAvatar}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.authorCardText}>
                <Text style={styles.authorCardName}>{viewModel.author}</Text>
                <Text style={styles.authorCardMeta} numberOfLines={1}>
                  {viewModel.country} · {viewModel.region}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#191F28" />
            </View>

            {!!viewModel.chatLink && (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="오픈채팅 링크 열기"
                style={styles.companionLink}
                onPress={handleOpenCompanionChatLink}
              >
                <Ionicons name="link-outline" size={20} color={BLUE} />
                <Text style={styles.companionLinkText} numberOfLines={1}>
                  {viewModel.chatLink}
                </Text>
              </Pressable>
            )}

            <View style={styles.companionBodyBlock}>
              <Text style={styles.bodyText}>{viewModel.content}</Text>
            </View>

            <View style={styles.companionInfoPanel}>
              <CompanionInfoItem
                icon="flag-outline"
                label="국가 및 지역"
                value={`${viewModel.country} ${viewModel.region}`}
              />
              <CompanionInfoItem
                icon="calendar-outline"
                label="일정"
                value={viewModel.period || "-"}
              />
              <CompanionInfoItem
                icon="person-outline"
                label="모집 인원"
                value={`${viewModel.total}명`}
              />
              <CompanionInfoItem
                icon="checkmark-circle-outline"
                label="참여 조건"
                value={viewModel.genderRatio!}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.freeTitleBlock}>
              <Text style={styles.freeTitle}>{viewModel.title}</Text>
              <Text style={styles.freeCreatedAt}>{viewModel.createdAt}</Text>
            </View>
            <View style={styles.freeAuthorCard}>
              <View style={styles.freeAuthorAvatar} />
              <View style={styles.authorCardText}>
                <Text style={styles.freeAuthorName}>{viewModel.authorNickname}</Text>
                <Text style={styles.freeAuthorMeta} numberOfLines={1}>{viewModel.country}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#111111" />
            </View>

            {(viewModel.imageUrls ?? []).length > 0 && (
              <View style={styles.imageSection}>
                {(viewModel.imageUrls ?? []).map(
                  (imageUrl: string, index: number) => (
                    <Image
                      key={`${imageUrl}-${index}`}
                      source={{ uri: imageUrl }}
                      style={styles.postImage}
                    />
                  ),
                )}
              </View>
            )}

            <View style={styles.bodyBlock}>
              <Text style={styles.bodyText}>{viewModel.content}</Text>
            </View>
          </>
        )}

        {detailType === "companion" && (
          <View style={styles.reactionBar}>
            <Pressable style={styles.reactionButton} onPress={handleScrapPress}>
              <Ionicons
                name={scrapped ? "bookmark" : "bookmark-outline"}
                size={17}
                color={scrapped ? BLUE : "#777777"}
              />
              <Text
                style={[
                  styles.reactionText,
                  scrapped && styles.reactionTextActive,
                ]}
              >
                {scrapCount}
              </Text>
            </Pressable>
          </View>
        )}

        {detailType === "free" && (
          <View style={styles.freeSection}>
            <View style={styles.freeReactionBar}>
              <Pressable
                style={styles.reactionButton}
                onPress={handleLikePress}
                accessibilityRole="button"
                accessibilityLabel="좋아요"
              >
                <Ionicons
                  name={viewModel.liked ? "heart" : "heart-outline"}
                  size={24}
                  color={viewModel.liked ? BLUE : "#536071"}
                />
                <Text
                  style={[
                    styles.freeReactionText,
                    viewModel.liked && styles.reactionTextActive,
                  ]}
                >
                  {viewModel.likes}
                </Text>
              </Pressable>
              <Pressable
                style={styles.reactionButton}
                onPress={() => commentInputRef.current?.focus()}
                accessibilityRole="button"
                accessibilityLabel="댓글 쓰기"
              >
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={23}
                  color="#536071"
                />
                <Text style={styles.freeReactionText}>
                  {viewModel.comments}
                </Text>
              </Pressable>
              <Pressable
                style={styles.freeSaveButton}
                onPress={handleReportPost}
              >
                <Text style={styles.commentSecondaryText}>게시글 신고</Text>
              </Pressable>
            </View>
            <View style={styles.commentSection}>
              <View style={styles.commentSortRow}>
                {(["oldest", "newest"] as const).map((sort) => (
                  <Pressable
                    key={sort}
                    style={styles.commentSortButton}
                    onPress={() => setCommentSort(sort)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: commentSort === sort }}
                  >
                    {commentSort === sort && (
                      <View style={styles.commentSortDot} />
                    )}
                    <Text
                      style={[
                        styles.commentSecondaryText,
                        commentSort === sort && styles.commentSortActive,
                      ]}
                    >
                      {sort === "oldest" ? "등록순" : "최신순"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {freeCommentItems.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar} />
                  <View style={styles.commentMain}>
                    <View style={styles.commentMetaRow}>
                      <View style={styles.commentAuthorBlock}>
                        <Text style={styles.commentAuthor}>
                          {comment.author}
                        </Text>
                        <Text style={styles.commentTime}>{comment.time}</Text>
                      </View>
                      {comment.mine && (
                        <Pressable
                          hitSlop={8}
                          accessibilityLabel="댓글 메뉴"
                          onPress={() =>
                            Alert.alert("댓글 삭제", "댓글을 삭제하시겠어요?", [
                              { text: "취소", style: "cancel" },
                              {
                                text: "삭제",
                                style: "destructive",
                                onPress: () => handleDeleteComment(comment.id),
                              },
                            ])
                          }
                        >
                          <Ionicons
                            name="ellipsis-vertical"
                            size={20}
                            color="#536071"
                          />
                        </Pressable>
                      )}
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {detailType === "free" && (
        <View
          style={[
            styles.commentComposer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <View style={styles.commentInputBox}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder="따뜻한 댓글을 입력해주세요"
              placeholderTextColor="#AFB7C4"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            {!!commentText.trim() && (
              <Pressable
                style={styles.commentSubmitButton}
                onPress={handleSubmitComment}
                accessibilityLabel="댓글 등록"
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {detailType === "companion" && (
        <View
          style={[
            styles.chatActionBar,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          {isAuthor ? (
            <Text style={styles.ownPostHint}>내가 작성한 동행 글이에요</Text>
          ) : (
            <Pressable
              style={[
                styles.startChatButton,
                chatLoading && styles.startChatButtonDisabled,
              ]}
              onPress={handleStartCompanionChat}
              disabled={chatLoading}
              accessibilityRole="button"
              accessibilityState={{ disabled: chatLoading, busy: chatLoading }}
            >
              {chatLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.startChatText}>
                {chatLoading ? "채팅방 연결 중..." : "채팅 시작하기"}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuOverlay}>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menuSheet}>
            {isAuthor && (
              <Pressable style={styles.menuItem} onPress={handleEdit}>
                <Ionicons name="create-outline" size={19} color="#111111" />
                <Text style={styles.menuText}>수정</Text>
              </Pressable>
            )}
            {isAuthor && (
              <Pressable style={styles.menuItem} onPress={handleDeletePost}>
                <Ionicons name="trash-outline" size={19} color="#D94343" />
                <Text style={[styles.menuText, styles.menuDangerText]}>
                  삭제
                </Text>
              </Pressable>
            )}
            {isAuthor && detailType === "companion" && (
              <>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleParticipantsChange(1)}
                >
                  <Ionicons
                    name="person-add-outline"
                    size={19}
                    color="#111111"
                  />
                  <Text style={styles.menuText}>모집 인원 추가</Text>
                </Pressable>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleParticipantsChange(-1)}
                >
                  <Ionicons
                    name="person-remove-outline"
                    size={19}
                    color="#111111"
                  />
                  <Text style={styles.menuText}>모집 인원 감소</Text>
                </Pressable>
              </>
            )}
            {detailType === "free" && (
              <Pressable style={styles.menuItem} onPress={handleScrapPress}>
                <Ionicons
                  name={scrapped ? "bookmark" : "bookmark-outline"}
                  size={19}
                  color={scrapped ? BLUE : "#111111"}
                />
                <Text style={styles.menuText}>
                  {scrapped ? "저장 취소" : "게시글 저장"}
                </Text>
              </Pressable>
            )}
            <Pressable style={styles.menuItem} onPress={handleRefresh}>
              <Ionicons
                name="refresh"
                size={19}
                color={refreshing ? "#A0A0A0" : "#111111"}
              />
              <Text
                style={[styles.menuText, refreshing && styles.menuTextMuted]}
              >
                새로고침
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function CompanionInfoItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.companionInfoRow}>
      <Ionicons name={icon} size={17} color="#6B7684" />
      <Text style={styles.companionInfoLabel}>{label}</Text>
      <Text style={styles.companionInfoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chatActionBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  ownPostHint: {
    paddingVertical: 15,
    textAlign: "center",
    color: "#777777",
    fontSize: 14,
  },
  startChatButtonDisabled: { opacity: 0.6 },
  startChatButton: {
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: BLUE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  startChatText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111111",
  },
  emptyButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.common.white,
    zIndex: 10,
    flexShrink: 0,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...fonts.sub3_sb_16,
    color: "#111111",
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 23,
    paddingTop: 24,
    paddingBottom: 54,
  },
  companionTitleBlock: {
    paddingBottom: 20,
  },
  titleBlock: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 8,
  },
  statusBadgeText: {
    ...fonts.caption4_m_12,
  },
  title: {
    ...fonts.title3_b_24,
  },
  companionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shareButton: {
    width: 36,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  companionCreatedAt: {
    ...fonts.body4_r_14,
    color: Colors.gray[7],
  },
  authorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.gray[3],
    borderRadius: 10,
    backgroundColor: Colors.gray[1],
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D1D6DC",
  },
  authorCardText: {
    flex: 1,
    gap: 2,
  },
  authorCardName: {
    ...fonts.sub4_sb_14,
    color: Colors.common.black,
  },
  authorCardMeta: {
    ...fonts.caption6_r_12,
    color: Colors.gray[8],
  },
  companionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary.default,
    backgroundColor: "#E8EBFF",
  },
  companionLinkText: {
    flex: 1,
    ...fonts.body2_m_14,
    color: Colors.common.black,
  },
  companionBodyBlock: {
    marginVertical: 24,
  },
  companionInfoPanel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E1E4E9",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  companionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  companionInfoLabel: {
    ...fonts.body2_m_14,
    color: Colors.gray[8],
    width: 82,
  },
  companionInfoValue: {
    flex: 1,
    ...fonts.body2_m_14,
    color: Colors.gray[10],
    textAlign: "right",
  },
  metaRow: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  authorText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#333333",
  },
  metaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888888",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#C8C8C8",
  },
  bodyBlock: {
    paddingTop: 24,
  },
  imageSection: {
    paddingTop: 20,
    gap: 10,
  },
  postImage: {
    width: "100%",
    height: 260,
    borderRadius: 14,
    backgroundColor: "#F2F2F2",
  },
  bodyText: {
    ...fonts.long_body2_r_16,
    color: Colors.gray[10],
  },
  reactionBar: {
    marginTop: 28,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F6F7F9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 18,
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 48,
  },
  reactionText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#777777",
  },
  reactionTextActive: {
    color: BLUE,
  },
  freeSection: {
    marginTop: 0,
  },
  freeTitleBlock: { paddingBottom: 24 },
  freeTitle: { ...fonts.title3_b_24, color: "#090B0D", lineHeight: 36 },
  freeCreatedAt: { fontSize: 16, lineHeight: 24, color: "#737F90", marginTop: 16 },
  freeAuthorCard: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: "#E0E4EA", borderRadius: 12, backgroundColor: "#F8F9FA" },
  freeAuthorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#E0E4E9" },
  freeAuthorName: { fontSize: 16, fontWeight: "600", color: "#111111" },
  freeAuthorMeta: { fontSize: 14, lineHeight: 21, color: "#536071" },
  freeContent: { paddingHorizontal: 16, paddingBottom: 0 },
  freeReactionBar: {
    marginTop: 28,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  freeReactionText: { fontSize: 16, color: "#374151" },
  freeSaveButton: { marginLeft: "auto", padding: 10 },
  commentSecondaryText: { fontSize: 14, color: "#8B97A8" },
  commentSection: {
    marginHorizontal: -16,
    borderTopWidth: 10,
    borderTopColor: "#F0F2F5",
    paddingTop: 16,
  },
  commentSortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  commentSortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 32,
  },
  commentSortDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BLUE,
  },
  commentSortActive: { color: "#111111", fontWeight: "700" },
  commentItem: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  commentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E0E4E9",
  },
  commentMain: { flex: 1 },
  commentAuthorBlock: { gap: 3, flex: 1 },
  commentMetaRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  commentAuthor: { fontSize: 14, fontWeight: "600", color: "#111111" },
  commentTime: { fontSize: 12, color: "#8B97A8" },
  commentContent: {
    fontSize: 16,
    lineHeight: 27,
    color: "#293140",
    marginTop: 16,
  },
  commentComposer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  commentInputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E2E5EA",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentInput: {
    flex: 1,
    minHeight: 28,
    maxHeight: 100,
    fontSize: 15,
    lineHeight: 22,
    color: "#293140",
    paddingVertical: 0,
  },
  commentSubmitButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  },
  menuBackdrop: {
    flex: 1,
  },
  menuSheet: {
    position: "absolute",
    top: 86,
    right: 18,
    width: 198,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECECEC",
    backgroundColor: "#FFFFFF",
    paddingVertical: 7,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  menuItem: {
    height: 47,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
  },
  menuText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111111",
  },
  menuTextMuted: {
    color: "#A0A0A0",
  },
  menuDangerText: {
    color: "#D94343",
  },
});
