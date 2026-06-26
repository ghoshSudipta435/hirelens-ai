export type UploadedFile = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
};

export type UploadListQuery = {
  page?: number;
  limit?: number;
};
