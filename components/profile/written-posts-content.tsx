import {
  ProfilePostsContent,
  type ProfilePostsContentProps,
} from "./profile-posts-content";

export function WrittenPostsContent(props: ProfilePostsContentProps) {
  return (
    <ProfilePostsContent
      {...props}
      emptyTitle="작성한 글이 없습니다"
      emptyText={"커뮤니티나 중고마켓에\n글을 작성해보세요"}
    />
  );
}
