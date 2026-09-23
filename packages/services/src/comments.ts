import type {
  Comment,
  CreateCommentRequest,
  GetCommentResponse,
  UpdateCommentRequest,
} from './types';

import { api } from './api';

export const Comments = {
  get: async (teacherId: string, subjectId: string, pageParam = 0) => {
    const { data } = await api.get(`/v2/comments/${teacherId}/${subjectId}`, {
      params: { page: pageParam, limit: 10 },
    });
    return data as GetCommentResponse;
  },
  getUserComment: async (enrollmentId: string) => {
    const { data } = await api.get(`/v2/comments/enrollment/${enrollmentId}`);
    return data as Comment;
  },
  create: (data: CreateCommentRequest) => api.post('/v2/comments/', data),
  update: ({ id, comment }: UpdateCommentRequest) =>
    api.put(`/v2/comments/${id}`, { comment }),
  like: (id: string) =>
    api.post(`/v2/comments/reactions/${id}`, { kind: 'like' }),
  recommendation: (id: string) =>
    api.post(`/v2/comments/reactions/${id}`, { kind: 'recommendation' }),
  removeLike: (id: string) => api.delete(`/v2/comments/reactions/${id}/like`),
  removeRecommendation: (id: string) =>
    api.delete(`/v2/comments/reactions/${id}/recommendation`),
};
