import {
  ProfilePostsContent,
  type ProfilePostsContentProps,
} from "./profile-posts-content";

export function LikedPostsContent(props: ProfilePostsContentProps) {
  return (
    <ProfilePostsContent
      {...props}
      emptyTitle="스크랩한 글이 없습니다"
      emptyText={"스크랩으로 관심있는 글을\n저장하고 표현해보세요"}
    />
  );
}
