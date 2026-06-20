export type Resume = {
  id: string;
  ownerId: string;
  uploadedFileId: string;
  title: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  fileUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateResumeRequest = {
  uploadedFileId: string;
  title: string;
};

export type UpdateResumeRequest = {
  title?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
};
