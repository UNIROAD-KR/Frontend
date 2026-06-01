import { api } from './client';
import { BaseResponse } from './types';

export interface PresignedUrlRequest {
  fileName: string;
  contentType: string;
  fileType: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export const getUploadUrl = (data: PresignedUrlRequest) => {
  return api.post<BaseResponse<PresignedUrlResponse>>('/api/s3/presigned-url', data);
};

export const uploadFileToStorage = async (
  uploadUrl: string,
  fileUri: string,
  contentType: string,
) => {
  const fileResponse = await fetch(fileUri);
  const blob = await fileResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed: ${uploadResponse.status}`);
  }

  return uploadResponse;
};
