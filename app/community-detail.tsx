import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getMemberMe } from '../src/api/auth';
import { AppBackButton } from '@/components/ui/app-back-button';
import {
  CompanionPostResponse,
  deleteCompanionPost,
  getCompanionPostDetail,
  updateCompanionPost,
} from '../src/api/companion';
import {
  FreePostCommentResponse,
  FreePostDetailResponse,
  createFreePostComment,
  deleteFreePost,
  deleteFreePostComment,
  getFreePostDetail,
  toggleFreePostLike,
} from '../src/api/freePosts';
import {
  BLUE,
  GREEN,
} from '../src/data/community';

const LIKED_FREE_POSTS_STORAGE_KEY = 'univ:profile:liked-free-posts';

type DetailType = 'free' | 'companion';
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
  'memberName' in post;

const formatDate = (value?: string) => {
  if (!value) {
    return '';
  }

  return value.replaceAll('-', '.');
};

const getCompanionStatusText = (status: CompanionPostResponse['status']) =>
  status === 'RECRUITING' ? '모집중' : '모집완료';

const getBoardStatusColors = (status: string) => {
  if (status === '파견 중') {
    return { backgroundColor: '#DDF4E4', color: '#238451' };
  }

  if (status === '파견 전') {
    return { backgroundColor: '#EAF1FF', color: '#2F66D0' };
  }

  return { backgroundColor: '#FFF1DF', color: '#F28A2E' };
};

const mapFreeComment = (comment: FreePostCommentResponse): FreeComment => ({
  id: comment.id,
  author: comment.authorName || '익명',
  content: comment.content,
  time: formatDate(comment.createdAt?.slice(0, 10)),
  mine: comment.mine,
});

const syncLikedFreePostStorage = async (
  post: FreePostDetailResponse,
  liked: boolean,
) => {
  const rawPosts = await AsyncStorage.getItem(LIKED_FREE_POSTS_STORAGE_KEY);
  const savedPosts = rawPosts ? JSON.parse(rawPosts) as StoredLikedFreePost[] : [];
  const nextPosts = savedPosts.filter((item) => item.id !== post.id);

  if (liked) {
    nextPosts.unshift({
      id: post.id,
      title: post.title,
      content: post.content,
      preview: post.content?.slice(0, 80) ?? '',
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
  const { type = 'free', id, fromProfileList } = useLocalSearchParams<{
    type?: DetailType;
    id?: string;
    fromProfileList?: string;
  }>();
  const postId = Number(id);
  const detailType: DetailType = type === 'companion' ? 'companion' : 'free';
  const [post, setPost] = useState<DetailPost | null>(null);
  const [currentMemberName, setCurrentMemberName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [commentInputVisible, setCommentInputVisible] = useState(false);
  const [commentText, setCommentText] = useState('');

  const loadPost = useCallback(async () => {
    if (!postId) {
      setPost(null);
      setLoading(false);
      return;
    }

    try {
      if (detailType === 'companion') {
        const response = await getCompanionPostDetail(postId);
        setPost(response.data.data);
        return;
      }

      const response = await getFreePostDetail(postId);
      const nextPost = response.data.data;
      setPost(nextPost);

      if (nextPost.liked) {
        await syncLikedFreePostStorage(nextPost, true);
      }
    } catch (error: any) {
      console.log('게시글 상세 조회 실패:', error.response?.data || error.message);
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
      const savedNickname = await AsyncStorage.getItem('nickname');

      try {
        const response = await getMemberMe();
        setCurrentMemberName(response.data?.data?.name || savedNickname || '');
      } catch (error: any) {
        console.log('내 정보 조회 실패:', error.response?.data || error.message);
        setCurrentMemberName(savedNickname || '');
      }
    };

    loadMember();
  }, []);

  const viewModel = useMemo(() => {
    if (!post) {
      return null;
    }

    if (detailType === 'companion') {
      if (isCompanionApiPost(post)) {
        return {
          author: post.memberName,
          title: post.title,
          content: post.content,
          country: post.country,
          region: post.region,
          status: getCompanionStatusText(post.status),
          statusColor: post.status === 'RECRUITING' ? '#DDF4E4' : '#EEEEEE',
          statusTextColor: post.status === 'RECRUITING' ? '#238451' : '#777777',
          period: `${formatDate(post.startDate)} - ${formatDate(post.endDate)}`,
          current: post.currentParticipants,
          total: post.capacity,
          chatLink: post.chatLink,
          genderRatio: post.genderRatio || '무관',
          createdAt: formatDate(post.createdAt?.slice(0, 10)),
          isMine: false,
        };
      }

    }

    const boardPost = post as FreePostDetailResponse;
    const statusColors = getBoardStatusColors(boardPost.status);

    return {
      author: boardPost.authorName || '익명',
      title: boardPost.title,
      content: boardPost.content,
      country: boardPost.country,
      status: boardPost.status,
      statusColor: statusColors.backgroundColor,
      statusTextColor: statusColors.color,
      createdAt: formatDate(boardPost.createdAt?.slice(0, 10)),
      likes: boardPost.likeCount,
      comments: boardPost.commentCount,
      liked: boardPost.liked,
      imageUrls: boardPost.imageUrls ?? [],
      commentItems: (boardPost.comments ?? []).map(mapFreeComment),
      isMine: boardPost.mine,
    };
  }, [detailType, post]);

  const isAuthor =
    !!viewModel &&
    (viewModel.isMine ||
      (!!currentMemberName && currentMemberName === viewModel.author));

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPost();
    setRefreshing(false);
    setMenuVisible(false);
    Alert.alert('새로고침 완료', '게시글 내용을 다시 불러왔어요.');
  };

  const handleEdit = () => {
    if (!viewModel || !post) {
      return;
    }

    setMenuVisible(false);

    if (detailType === 'companion') {
      const params = isCompanionApiPost(post)
        ? {
            type: 'companion',
            mode: 'edit',
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
            genderRatio: post.genderRatio || '',
            status: post.status,
          }
        : null;

      if (!params) {
        return;
      }

      router.push({ pathname: '/community-write', params } as never);
      return;
    }

    router.push({
      pathname: '/community-write',
      params: {
        type: 'free',
        mode: 'edit',
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
    if (detailType !== 'free' || !postId || !post) {
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
      console.log('자유게시판 좋아요 실패:', error.response?.data || error.message);
      Alert.alert('처리 실패', '좋아요 상태를 변경하지 못했어요.');
    }
  };

  const handleSubmitComment = async () => {
    const trimmedComment = commentText.trim();

    if (!trimmedComment || detailType !== 'free' || !postId || !post) {
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
      setCommentText('');
      setCommentInputVisible(false);
    } catch (error: any) {
      console.log('자유게시판 댓글 작성 실패:', error.response?.data || error.message);
      Alert.alert('등록 실패', '댓글을 등록하지 못했어요.');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (detailType !== 'free' || !postId || !post) {
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
      console.log('자유게시판 댓글 삭제 실패:', error.response?.data || error.message);
      Alert.alert('삭제 실패', '댓글을 삭제하지 못했어요.');
    }
  };

  const handleDeletePost = () => {
    if (!postId) {
      return;
    }

    setMenuVisible(false);
    Alert.alert('게시글 삭제', '게시글을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            if (detailType === 'companion') {
              await deleteCompanionPost(postId);
            } else {
              await deleteFreePost(postId);
            }

            router.back();
          } catch (error: any) {
            console.log('게시글 삭제 실패:', error.response?.data || error.message);
            Alert.alert('삭제 실패', '게시글을 삭제하지 못했어요.');
          }
        },
      },
    ]);
  };

  const handleParticipantsChange = async (delta: 1 | -1) => {
    if (!post || !viewModel || detailType !== 'companion') {
      return;
    }

    const currentParticipants = Number(viewModel.current);
    const capacity = Number(viewModel.total);
    const nextParticipants = currentParticipants + delta;

    if (nextParticipants < 1) {
      Alert.alert('변경 불가', '모집 인원은 1명보다 작아질 수 없어요.');
      return;
    }

    if (nextParticipants > capacity) {
      Alert.alert('변경 불가', '모집 인원은 전체 정원을 넘을 수 없어요.');
      return;
    }

    setMenuVisible(false);

    if (isCompanionApiPost(post)) {
      const nextStatus =
        nextParticipants >= post.capacity ? 'COMPLETED' : 'RECRUITING';

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
        console.log('동행 모집 인원 변경 실패:', error.response?.data || error.message);
        Alert.alert('변경 실패', '모집 인원을 변경하지 못했어요.');
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
        <Pressable style={styles.emptyButton} onPress={() => router.back()}>
          <Text style={styles.emptyButtonText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const freeCommentItems =
    detailType === 'free' ? (viewModel.commentItems ?? []) : [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppBackButton
          onPress={() => {
            if (fromProfileList === 'liked' || fromProfileList === 'free' || fromProfileList === 'companion') {
              router.replace({
                pathname: '/home/profile-list',
                params: { type: fromProfileList },
              } as never);
              return;
            }

            router.back();
          }}
          style={styles.headerIconButton}
        />
        <Text style={styles.headerTitle}>
          {detailType === 'companion' ? '동행 구하기' : '자유 게시판'}
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
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

          <Text style={styles.title}>{viewModel.title}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.authorText}>
              {detailType === 'free' ? '익명' : viewModel.author}
            </Text>
            <View style={styles.dot} />
            <Text style={styles.metaText}>{viewModel.country}</Text>
            <View style={styles.dot} />
            <Text style={styles.metaText}>{viewModel.createdAt}</Text>
          </View>
        </View>

        {detailType === 'companion' && (
          <View style={styles.infoPanel}>
            <InfoItem
              icon="location-outline"
              label="지역"
              value={`${viewModel.country} ${viewModel.region}`}
            />
            <InfoItem
              icon="calendar-outline"
              label="일정"
              value={viewModel.period || '-'}
            />
            <InfoItem
              icon="people-outline"
              label="모집 인원"
              value={`${viewModel.current}/${viewModel.total}명`}
            />
            <InfoItem
              icon="shield-checkmark-outline"
              label="참여 조건"
              value={`학교인증 · ${viewModel.genderRatio}`}
              accent
            />
          </View>
        )}

        {detailType === 'free' && (viewModel.imageUrls ?? []).length > 0 && (
          <View style={styles.imageSection}>
            {(viewModel.imageUrls ?? []).map((imageUrl: string, index: number) => (
              <Image
                key={`${imageUrl}-${index}`}
                source={{ uri: imageUrl }}
                style={styles.postImage}
              />
            ))}
          </View>
        )}

        <View style={styles.bodyBlock}>
          <Text style={styles.bodyText}>{viewModel.content}</Text>
        </View>

        {detailType === 'companion' && !!viewModel.chatLink && (
          <View style={styles.chatPanel}>
            <View style={styles.chatIcon}>
              <Ionicons name="chatbubbles-outline" size={20} color={BLUE} />
            </View>
            <View style={styles.chatTextBlock}>
              <Text style={styles.chatTitle}>오픈채팅 링크</Text>
              <Text style={styles.chatLink} numberOfLines={1}>
                {viewModel.chatLink}
              </Text>
            </View>
          </View>
        )}

        {detailType === 'free' && (
          <View style={styles.freeSection}>
            <View style={styles.reactionBar}>
              <Pressable style={styles.reactionButton} onPress={handleLikePress}>
                <Ionicons
                  name={viewModel.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={17}
                  color={viewModel.liked ? BLUE : '#777777'}
                />
                <Text
                  style={[
                    styles.reactionText,
                    viewModel.liked && styles.reactionTextActive,
                  ]}
                >
                  {viewModel.likes}
                </Text>
              </Pressable>
              <Pressable
                style={styles.reactionButton}
                onPress={() => setCommentInputVisible((prev) => !prev)}
              >
                <Ionicons name="chatbubble-outline" size={17} color="#777777" />
                <Text style={styles.reactionText}>{viewModel.comments}</Text>
              </Pressable>
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.commentTitle}>댓글 {viewModel.comments}개</Text>

              {freeCommentItems.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentMetaRow}>
                    <Text style={styles.commentAuthor}>{comment.author}</Text>
                    <View style={styles.commentMetaRight}>
                      <Text style={styles.commentTime}>{comment.time}</Text>
                      {comment.mine && (
                        <Pressable onPress={() => handleDeleteComment(comment.id)}>
                          <Text style={styles.commentDeleteText}>삭제</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                </View>
              ))}

              {commentInputVisible && (
                <View style={styles.commentInputBox}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="댓글을 입력해보세요"
                    placeholderTextColor="#9A9A9A"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <Pressable
                    style={[
                      styles.commentSubmitButton,
                      !commentText.trim() && styles.commentSubmitButtonDisabled,
                    ]}
                    onPress={handleSubmitComment}
                    disabled={!commentText.trim()}
                  >
                    <Text style={styles.commentSubmitText}>등록</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

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
                <Text style={[styles.menuText, styles.menuDangerText]}>삭제</Text>
              </Pressable>
            )}
            {isAuthor && detailType === 'companion' && (
              <>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleParticipantsChange(1)}
                >
                  <Ionicons name="person-add-outline" size={19} color="#111111" />
                  <Text style={styles.menuText}>모집 인원 추가</Text>
                </Pressable>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleParticipantsChange(-1)}
                >
                  <Ionicons name="person-remove-outline" size={19} color="#111111" />
                  <Text style={styles.menuText}>모집 인원 감소</Text>
                </Pressable>
              </>
            )}
            <Pressable style={styles.menuItem} onPress={handleRefresh}>
              <Ionicons
                name="refresh"
                size={19}
                color={refreshing ? '#A0A0A0' : '#111111'}
              />
              <Text style={[styles.menuText, refreshing && styles.menuTextMuted]}>
                새로고침
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoItem({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.infoItem}>
      <View style={[styles.infoIcon, accent && styles.infoIconAccent]}>
        <Ionicons name={icon} size={18} color={accent ? GREEN : BLUE} />
      </View>
      <View style={styles.infoTextBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#111111',
  },
  emptyButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  header: {
    height: 108,
    paddingTop: 58,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  headerIconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#111111',
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: 23,
    paddingTop: 24,
    paddingBottom: 54,
  },
  titleBlock: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 13,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  title: {
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 0,
  },
  metaRow: {
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  authorText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#333333',
  },
  metaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888888',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#C8C8C8',
  },
  infoPanel: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8ECF3',
    backgroundColor: '#F8FAFD',
    padding: 14,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF1FF',
  },
  infoIconAccent: {
    backgroundColor: '#EAF7EF',
  },
  infoTextBlock: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8A8A8A',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
    color: '#111111',
  },
  bodyBlock: {
    paddingTop: 24,
  },
  imageSection: {
    paddingTop: 20,
    gap: 10,
  },
  postImage: {
    width: '100%',
    height: 260,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '600',
    color: '#222222',
  },
  chatPanel: {
    marginTop: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF3',
    backgroundColor: '#FFFFFF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F3FF',
  },
  chatTextBlock: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111111',
    marginBottom: 4,
  },
  chatLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#777777',
  },
  reactionBar: {
    marginTop: 28,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F6F7F9',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 18,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 48,
  },
  reactionText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#777777',
  },
  reactionTextActive: {
    color: BLUE,
  },
  freeSection: {
    marginTop: 0,
  },
  commentSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
    gap: 14,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111111',
  },
  commentItem: {
    borderRadius: 14,
    backgroundColor: '#F8F9FB',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  commentMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '900',
    color: '#333333',
  },
  commentTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999999',
  },
  commentMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  commentDeleteText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D94343',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    color: '#333333',
  },
  commentInputBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E6EE',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  commentInput: {
    minHeight: 74,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: '#111111',
    textAlignVertical: 'top',
  },
  commentSubmitButton: {
    alignSelf: 'flex-end',
    height: 38,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#C7CBD6',
  },
  commentSubmitText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
  menuBackdrop: {
    flex: 1,
  },
  menuSheet: {
    position: 'absolute',
    top: 86,
    right: 18,
    width: 198,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECEC',
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  menuItem: {
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111111',
  },
  menuTextMuted: {
    color: '#A0A0A0',
  },
  menuDangerText: {
    color: '#D94343',
  },
});
