import { api } from './client';

export const getUploadUrl = async (data: {
  fileName: string;
  contentType: string;
  fileType: 'IMAGE' | 'PDF';
}) => {
  console.log('업로드 URL 요청 body:', data);

  const response = await api.post('/api/s3/presigned-url', data);

  console.log('업로드 URL 응답:', response.data);

  return response;
};

export const uploadFileToStorage = async (
  uploadUrl: string,
  fileUri: string,
  contentType: string,
) => {
  console.log('S3 업로드 시작:', uploadUrl);

  const fileResponse = await fetch(fileUri);
  const blob = await fileResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  console.log('S3 업로드 상태:', uploadResponse.status);

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.log('S3 업로드 실패 내용:', errorText);
    throw new Error(`S3 업로드 실패: ${uploadResponse.status}`);
  }

  return uploadResponse;
};
