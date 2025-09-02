import {
  Comment,
  CreateCommentRequest,
  GetCommentResponse,
  UpdateCommentRequest,
} from '@ufabc-next/types';

import { api } from './api';

export const Comments = {
  get: (teacherId: string, subjectId: string, pageParam = 0) =>
    api.get<GetCommentResponse>(`/comments/${teacherId}/${subjectId}`, {
      params: { page: pageParam, limit: 10 },
    }),
  getUserComment: (enrollmentId: string) =>
    api.get<Comment>(`/comments/enrollment/${enrollmentId}`),
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
