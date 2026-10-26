import {
  ProfilePostsContent,
  type ProfilePostsContentProps,
} from "./profile-posts-content";

export function LikedPostsContent(props: ProfilePostsContentProps) {
  return (
    <ProfilePostsContent
      {...props}
      emptyTitle="좋아요 누른 글이 없습니다"
      emptyText={"좋아요를 눌러 관심있는 글을\n저장하고 표현해보세요"}
    />
  );
}
