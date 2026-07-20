import type { UploadedFile } from '@prisma/client';

import { prisma } from '../config/prisma';

export type UploadCreateInput = {
  ownerId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryPublicId: string;
  fileUrl: string;
};

export type UploadUpdateInput = {
  deletedAt: Date;
};

export interface IUploadRepository {
  create(data: UploadCreateInput): Promise<UploadedFile>;
  findById(id: string): Promise<UploadedFile | null>;
  findByIdWithOwner(id: string): Promise<(UploadedFile & { owner: { id: string; name: string; email: string } }) | null>;
  listByOwner(ownerId: string, skip: number, take: number): Promise<UploadedFile[]>;
  countByOwner(ownerId: string): Promise<number>;
  softDelete(id: string): Promise<UploadedFile>;
}

export class UploadRepository implements IUploadRepository {
  async create(data: UploadCreateInput) {
    return prisma.uploadedFile.create({ data });
  }

  async findById(id: string) {
    return prisma.uploadedFile.findUnique({ where: { id } });
  }

  async findByIdWithOwner(id: string) {
    return prisma.uploadedFile.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
  }

  async listByOwner(ownerId: string, skip: number, take: number) {
    return prisma.uploadedFile.findMany({
      where: { ownerId, deletedAt: null },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countByOwner(ownerId: string) {
    return prisma.uploadedFile.count({ where: { ownerId, deletedAt: null } });
  }

  async softDelete(id: string) {
    return prisma.uploadedFile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
