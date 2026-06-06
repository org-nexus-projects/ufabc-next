import type {
  Comment,
  CreateCommentRequest,
  GetCommentResponse,
  UpdateCommentRequest,
} from './types';

import { api } from './api';

export const Comments = {
  get: async (teacherId: string, subjectId: string, pageParam = 0) => {
    const { data } = await api.get(`/comments/${teacherId}/${subjectId}`, {
      params: { page: pageParam, limit: 10 },
    });
    return data as GetCommentResponse;
  },
  getUserComment: async (enrollmentId: string) => {
    const { data } = await api.get(`/comments/enrollment/${enrollmentId}`);
    return data as Comment;
  },
  create: (data: CreateCommentRequest) => api.post('/comments/', data),
  update: ({ id, comment }: UpdateCommentRequest) =>
    api.put(`/comments/${id}`, { comment }),
  like: (id: string) => api.post(`/comments/reactions/${id}`, { kind: 'like' }),
  recommendation: (id: string) =>
    api.post(`/comments/reactions/${id}`, { kind: 'recommendation' }),
  removeLike: (id: string) => api.delete(`/comments/reactions/${id}/like`),
  removeRecommendation: (id: string) =>
    api.delete(`/comments/reactions/${id}/recommendation`),
};
