import { api } from './api';
import type {
  Comment,
  CreateCommentRequest,
  GetCommentResponse,
  UpdateCommentRequest,
} from './types';

export const Comments = {
  create: async (data: CreateCommentRequest) =>
    await api.post('/comments/', data),
  get: async (teacherId: string, subjectId: string, pageParam = 0) => {
    const { data } = await api.get<GetCommentResponse>(
      `/comments/${teacherId}/${subjectId}`,
      {
        params: { limit: 10, page: pageParam },
      }
    );
    return data;
  },
  getUserComment: async (enrollmentId: string) => {
    const { data } = await api.get<Comment>(
      `/comments/enrollment/${enrollmentId}`
    );
    return data;
  },
  like: async (id: string) =>
    await api.post(`/comments/reactions/${id}`, { kind: 'like' }),
  recommendation: async (id: string) =>
    await api.post(`/comments/reactions/${id}`, { kind: 'recommendation' }),
  removeLike: async (id: string) =>
    await api.delete(`/comments/reactions/${id}/like`),
  removeRecommendation: async (id: string) =>
    await api.delete(`/comments/reactions/${id}/recommendation`),
  update: async ({ id, comment }: UpdateCommentRequest) =>
    await api.put(`/comments/${id}`, { comment }),
};
