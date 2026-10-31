import { DefaultProfileImage } from "@/components/ui/default-profile-image";
import { Text, TextInput } from "@/components/ui/app-text";
import { Modal as AppModal } from "@/components/ui/modal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import ChatIcon from "@/assets/icon/chat.svg";
import MoreIcon from "@/assets/icon/menu.svg";
import SendIcon from "@/assets/icon/send.svg";
import FlagIcon from "@/assets/icon/flag.svg";
import CalendarIcon from "@/assets/icon/calendar.svg";
import PersonIcon from "@/assets/icon/person.svg";
import CheckmarkCircleIcon from "@/assets/icon/complete.svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Toast } from "@/components/ui/fade-toast";
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
  Image,
  Linking,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { Colors, commonStyles, fonts } from "@/constants/theme";
import ReplyIcon from "@/assets/icon/reply.svg";
import CompleteIcon from "@/assets/icon/complete.svg";
import EditIcon from "@/assets/icon/edit.svg";
import DeleteIcon from "@/assets/icon/delete.svg";
import { createOrGetChatRoom } from "../src/api/chat";
import { getMemberMe } from "../src/api/auth";
import { goBackOrReplace } from "@/components/ui/app-back-button";
import { ProfileScreenHeader } from "@/components/ui/profile-screen-header";
import { PopoverMenu } from "@/components/ui/popover-menu";
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
  FreePostCategoryMap,
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
import Button from "@/components/ui/button";

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
  deleted?: boolean;
  replies: FreeComment[];
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

const mapFreeComments = (comments: FreePostCommentResponse[]) => {
  const anonymousNumbers = new Map<string, number>();
  let nextAnonymousNumber = 1;

  const getAuthorKey = (comment: FreePostCommentResponse) => {
    const memberId = comment.memberId ?? comment.authorId;
    if (memberId !== undefined && memberId !== null) {
      return `member:${memberId}`;
    }

    if (comment.mine) {
      return "member:me";
    }

    return `name:${comment.authorName.trim() || `commenter:${comment.id}`}`;
  };

  const mapComment = (comment: FreePostCommentResponse): FreeComment => {
    const authorKey = getAuthorKey(comment);
    let anonymousNumber = anonymousNumbers.get(authorKey);
    if (anonymousNumber === undefined) {
      anonymousNumber = nextAnonymousNumber++;
      anonymousNumbers.set(authorKey, anonymousNumber);
    }

    return {
      id: comment.id,
      author: `익명 ${anonymousNumber}`,
      content: comment.content,
      time: formatCompanionCreatedAt(comment.createdAt),
      mine: comment.mine,
      deleted: comment.deleted,
      replies: (comment.replies ?? []).map(mapComment),
    };
  };

  return [...comments].sort((a, b) => a.id - b.id).map(mapComment);
};

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
      category: post.category,
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

type AlertButton = {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};

export default function CommunityDetailScreen() {
  const router = useRouter();
  const [alertState, setAlertState] = useState<{
    visible: boolean;
    title: string;
    description?: string;
    buttons: AlertButton[];
  }>({ visible: false, title: "", buttons: [] });
  const showAlert = (
    title: string,
    description?: string,
    buttons: AlertButton[] = [],
  ) => setAlertState({ visible: true, title, description, buttons });
  const closeAlert = () =>
    setAlertState((prev) => ({ ...prev, visible: false }));
  const alertModalButtons = () => {
    const { buttons } = alertState;
    if (buttons.length === 0) {
      return { primaryButton: { label: "확인", onPress: closeAlert } };
    }
    const cancel = buttons.filter((b) => b.style === "cancel");
    const others = buttons.filter((b) => b.style !== "cancel");
    const display = [...cancel, ...others];
    const visibleButtons = display.length > 3 ? others.slice(0, 3) : display;
    const mapped = visibleButtons.map((b) => ({
      label: b.text,
      tone: b.style === "destructive" ? ("destructive" as const) : undefined,
      onPress: () => {
        closeAlert();
        b.onPress?.();
      },
    }));
    return {
      primaryButton: mapped[mapped.length - 1],
      secondaryButton:
        mapped.length > 1 ? mapped[mapped.length - 2] : undefined,
      tertiaryButton: mapped.length > 2 ? mapped[mapped.length - 3] : undefined,
    };
  };
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
  const headerHeight = Math.max(50, insets.top + 10) + 8 + 42;
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
  const [replyTarget, setReplyTarget] = useState<FreeComment | null>(null);
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
        if (nextPost.status === "COMPLETED") {
          Toast.show({
            type: "success",
            text: "이미 모집이 완료된 게시글입니다",
          });
        }
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
          authorName: post.memberName,
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
      author: "작성자",
      authorName: boardPost.authorName || "익명",
      title: boardPost.title,
      category:
        Object.entries(FreePostCategoryMap).find(
          ([, code]) => code === boardPost.category,
        )?.[0] ?? boardPost.category,
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
      commentItems: mapFreeComments(boardPost.comments ?? []),
      isMine: boardPost.mine,
    };
  }, [detailType, post]);

  const isAuthor =
    post && isCompanionApiPost(post)
      ? currentMemberId !== null && currentMemberId === post.memberId
      : !!viewModel &&
        (viewModel.isMine ||
          (!!currentMemberName && currentMemberName === viewModel.authorName));

  const handleStartCompanionChat = async () => {
    if (!post || !isCompanionApiPost(post) || chatPending.current || isAuthor)
      return;
    if (!Number.isInteger(post.memberId) || post.memberId <= 0) {
      showAlert(
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
      showAlert(
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
      showAlert("처리 실패", "좋아요 상태를 변경하지 못했어요.");
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
      showAlert("저장 실패", "게시글 저장 상태를 변경하지 못했어요.");
    }
  };

  const handleSubmitComment = async () => {
    const trimmedComment = commentText.trim();

    if (!trimmedComment || detailType !== "free" || !postId || !post) {
      return;
    }

    try {
      const response = await createFreePostComment(
        postId,
        trimmedComment,
        replyTarget?.id,
      );
      const created = response.data.data;
      const boardPost = post as FreePostDetailResponse;

      setPost({
        ...boardPost,
        commentCount: boardPost.commentCount + 1,
        comments: replyTarget
          ? (boardPost.comments ?? []).map((comment) =>
              comment.id === replyTarget.id
                ? { ...comment, replies: [...(comment.replies ?? []), created] }
                : comment,
            )
          : [...(boardPost.comments ?? []), created],
      });
      setCommentText("");
      setReplyTarget(null);
    } catch (error: any) {
      console.log(
        "자유게시판 댓글 작성 실패:",
        error.response?.data || error.message,
      );
      showAlert("등록 실패", "댓글을 등록하지 못했어요.");
    }
  };

  const handleReportPost = () => {
    const reasons: { text: string; reason: ReportReason }[] = [
      { text: "스팸 / 광고", reason: "SPAM" },
      { text: "욕설 / 비방", reason: "ABUSE" },
      { text: "부적절한 내용", reason: "INAPPROPRIATE" },
    ];
    showAlert("게시글 신고", "신고 사유를 선택해주세요.", [
      ...reasons.map(({ text, reason }) => ({
        text,
        onPress: async () => {
          try {
            await createReport({
              targetType: "FREE_POST",
              targetId: postId,
              reason,
            });
            showAlert("신고 완료", "신고가 접수되었어요.");
          } catch {
            showAlert("신고 실패", "잠시 후 다시 시도해주세요.");
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
        comments: (boardPost.comments ?? []).flatMap<FreePostCommentResponse>(
          (comment) => {
            if (comment.id === commentId) {
              return comment.replies?.length
                ? [{ ...comment, deleted: true }]
                : [];
            }
            return [
              {
                ...comment,
                replies: (comment.replies ?? []).filter(
                  (reply) => reply.id !== commentId,
                ),
              },
            ];
          },
        ),
      });
    } catch (error: any) {
      console.log(
        "자유게시판 댓글 삭제 실패:",
        error.response?.data || error.message,
      );
      showAlert("삭제 실패", "댓글을 삭제하지 못했어요.");
    }
  };

  const renderCommentMeta = (comment: FreeComment) => (
    <View style={styles.commentMetaRow}>
      <View style={styles.commentAuthorBlock}>
        <Text style={styles.commentAuthor}>{comment.author}</Text>
        <Text style={styles.commentTime}>{comment.time}</Text>
      </View>
      {comment.mine && (
        <Pressable
          hitSlop={8}
          accessibilityLabel="댓글 메뉴"
          onPress={() =>
            showAlert("댓글 삭제", "댓글을 삭제하시겠어요?", [
              { text: "취소", style: "cancel" },
              {
                text: "삭제",
                style: "destructive",
                onPress: () => handleDeleteComment(comment.id),
              },
            ])
          }
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#536071" />
        </Pressable>
      )}
    </View>
  );

  const handleDeletePost = () => {
    if (!postId) {
      return;
    }

    setMenuVisible(false);
    showAlert("게시글 삭제", "게시글을 삭제할까요?", [
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
            showAlert("삭제 실패", "게시글을 삭제하지 못했어요.");
          }
        },
      },
    ]);
  };

  const handleCompleteRecruitment = async () => {
    if (!post || detailType !== "companion") {
      return;
    }

    setMenuVisible(false);
    showAlert("모집 완료", "모집을 완료할까요?", [
      { text: "취소", style: "cancel" },
      {
        text: "완료하기",
        onPress: async () => {
          try {
            if (isCompanionApiPost(post)) {
              await updateCompanionPost(post.id, {
                ...post,
                status: "COMPLETED",
              });

              setPost({
                ...post,
                status: "COMPLETED",
              });
            }
            Toast.show({ type: "success", text: "모집 완료 처리 되었습니다" });
          } catch (error: any) {
            console.log(
              "모집 완료 실패:",
              error.response?.data || error.message,
            );
            showAlert("완료 실패", "모집을 완료하지 못했어요.");
          }
        },
      },
    ]);
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
      <ProfileScreenHeader
        title={detailType === "companion" ? "동행 모집" : "자유 게시판"}
        onBack={() => {
          if (
            fromProfileList === "liked" ||
            fromProfileList === "free" ||
            fromProfileList === "companion" ||
            fromProfileList === "saved" ||
            fromProfileList === "written"
          ) {
            router.replace({
              pathname:
                fromProfileList === "liked"
                  ? "/liked-posts"
                  : fromProfileList === "free" || fromProfileList === "written"
                    ? "/profile-posts"
                    : "/home/profile-list",
              params: { type: fromProfileList },
            } as never);
            return;
          }

          goBackOrReplace("/community");
        }}
        rightAction={
          <Pressable
            style={styles.headerIconButton}
            onPress={() => setMenuVisible(true)}
          >
            <MoreIcon />
          </Pressable>
        }
      />

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
              <DefaultProfileImage style={styles.authorAvatar} />
              <View style={styles.authorCardText}>
                <Text style={styles.authorCardName}>{viewModel.author}</Text>
                <Text style={styles.authorCardMeta} numberOfLines={1}>
                  {viewModel.country} · {viewModel.region}
                </Text>
              </View>
            </View>

            {/* {!!viewModel.chatLink && (
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
            )} */}

            <View style={styles.companionBodyBlock}>
              <Text style={styles.bodyText}>{viewModel.content}</Text>
            </View>

            <View style={styles.companionInfoPanel}>
              <CompanionInfoItem
                icon={
                  <FlagIcon width={16} height={16} color={Colors.gray[7]} />
                }
                label="국가 및 지역"
                value={`${viewModel.country} ${viewModel.region}`}
              />
              <CompanionInfoItem
                icon={
                  <CalendarIcon width={16} height={16} color={Colors.gray[7]} />
                }
                label="일정"
                alignTop
                value={viewModel.period?.replace(" - ", "\n- ") || "-"}
              />
              <CompanionInfoItem
                icon={
                  <PersonIcon width={16} height={16} color={Colors.gray[7]} />
                }
                label="모집 인원"
                value={`${viewModel.total}명`}
              />
              <CompanionInfoItem
                icon={
                  <CheckmarkCircleIcon
                    width={16}
                    height={16}
                    color={Colors.gray[7]}
                  />
                }
                label="참여 조건"
                value={viewModel.genderRatio!}
              />
            </View>
          </>
        ) : (
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
                  {viewModel.category}
                </Text>
              </View>
              <View style={styles.companionTitleRow}>
                <Text style={styles.title}>{viewModel.title}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="자유게시판 공유"
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

            <View>
              <Text style={styles.bodyText}>{viewModel.content}</Text>
            </View>
          </>
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
                  color={viewModel.liked ? Colors.primary.default : "#536071"}
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
                <ChatIcon width={24} height={24} color={Colors.gray[8]} />
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
                <View key={comment.id}>
                  <View style={styles.commentItem}>
                    <View style={styles.commentMain}>
                      {comment.deleted ? (
                        <Text style={styles.commentDeleted}>
                          삭제된 댓글입니다
                        </Text>
                      ) : (
                        <>
                          {renderCommentMeta(comment)}
                          <Text style={styles.commentContent}>
                            {comment.content}
                          </Text>
                          <Pressable
                            style={styles.replyButton}
                            hitSlop={8}
                            accessibilityRole="button"
                            onPress={() => {
                              setReplyTarget(comment);
                              commentInputRef.current?.focus();
                            }}
                          >
                            <Text style={styles.replyButtonText}>
                              답글 달기
                            </Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  </View>
                  {comment.replies.map((reply) => (
                    <View key={reply.id} style={styles.replyItem}>
                      <ReplyIcon />
                      <View style={styles.commentMain}>
                        {renderCommentMeta(reply)}
                        <Text style={styles.commentContent}>
                          {reply.content}
                        </Text>
                      </View>
                    </View>
                  ))}
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
          {replyTarget && (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText} numberOfLines={1}>
                {replyTarget.author}님에게 답글 남기는 중
              </Text>
              <Pressable
                hitSlop={8}
                accessibilityLabel="답글 취소"
                onPress={() => setReplyTarget(null)}
              >
                <Ionicons name="close" size={16} color={Colors.gray[6]} />
              </Pressable>
            </View>
          )}
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
                <SendIcon />
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
            <Button
              onPress={handleStartCompanionChat}
              disabled={chatLoading}
              title={
                chatLoading ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" />
                  </>
                ) : (
                  "채팅 시작하기"
                )
              }
            />
          )}
        </View>
      )}

      <PopoverMenu
        visible={menuVisible}
        position={{ top: headerHeight - 4, right: 18 }}
        width={120}
        accessibilityLabel="게시글 메뉴 닫기"
        onClose={() => setMenuVisible(false)}
        items={[
          ...(isAuthor
            ? [
                {
                  label: "수정하기",
                  icon: (
                    <EditIcon color={Colors.gray[8]} width={16} height={16} />
                  ),
                  onPress: handleEdit,
                },
                {
                  label: "삭제하기",
                  icon: (
                    <DeleteIcon color={Colors.gray[8]} width={16} height={16} />
                  ),
                  onPress: handleDeletePost,
                },
                ...(detailType === "companion"
                  ? [
                      {
                        label: "모집 완료",
                        icon: (
                          <CompleteIcon
                            color={Colors.gray[8]}
                            width={16}
                            height={16}
                          />
                        ),
                        onPress: handleCompleteRecruitment,
                      },
                    ]
                  : []),
              ]
            : [
                {
                  label: scrapped ? "스크랩 취소" : "스크랩하기",
                  icon: (
                    <Ionicons
                      name={scrapped ? "bookmark" : "bookmark-outline"}
                      size={16}
                      color={scrapped ? BLUE : "#111111"}
                    />
                  ),
                  onPress: handleScrapPress,
                },
              ]),
        ]}
      />
      <AppModal
        isOpen={alertState.visible}
        onClose={closeAlert}
        title={alertState.title}
        description={alertState.description}
        {...alertModalButtons()}
      />
    </KeyboardAvoidingView>
  );
}

function CompanionInfoItem({
  icon,
  label,
  value,
  alignTop = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  alignTop?: boolean;
}) {
  return (
    <View style={[styles.companionInfoRow, alignTop && { alignItems: "flex-start" }]}>
      {icon}
      <Text style={styles.companionInfoLabel}>{label}</Text>
      <Text style={styles.companionInfoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chatActionBar: {
    flexDirection: "row",
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
  startChatButtonFill: { flex: 0, alignSelf: "stretch" },
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
  headerIconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: "100%",
    alignSelf: "center",
    paddingBottom: 54,
    paddingHorizontal: 16,
  },
  companionTitleBlock: {
    paddingBottom: 16,
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
  bodyBlock: {},
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
  freeTitle: { ...fonts.title3_b_24, color: "#070A0D" },
  freeCreatedAt: {
    ...fonts.body4_r_14,
    color: Colors.gray[7],
  },
  freeAuthorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E0E4EA",
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
  },
  freeAuthorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E0E4E9",
  },
  freeAuthorName: { fontSize: 16, fontWeight: "600", color: "#111111" },
  freeAuthorMeta: { fontSize: 14, lineHeight: 21, color: "#536071" },
  freeContent: { paddingHorizontal: 16, paddingBottom: 0 },
  freeReactionBar: {
    marginTop: 28,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  freeReactionText: { ...fonts.long_body1_m_16, color: Colors.gray[9] },
  freeSaveButton: { marginLeft: "auto", padding: 10 },
  commentSecondaryText: { ...fonts.body2_m_14, color: Colors.gray[6] },
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
    backgroundColor: Colors.primary.default,
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
  commentAuthor: { ...fonts.sub4_sb_14, color: Colors.common.black },
  commentTime: { ...fonts.caption6_r_12, color: Colors.gray[6] },
  commentContent: {
    ...fonts.long_body2_r_16,
    color: Colors.gray[10],
    marginTop: 12,
  },
  commentDeleted: {
    ...fonts.body1_m_16,
    color: Colors.gray[6],
    paddingVertical: 8,
  },
  replyButton: { alignSelf: "flex-start", marginTop: 8 },
  replyButtonText: { ...fonts.caption3_m_13, color: Colors.gray[7] },
  replyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray[1],
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  replyBannerText: { ...fonts.caption3_m_13, color: Colors.gray[7], flex: 1 },
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
    alignItems: "center",
    justifyContent: "center",
  },
});
