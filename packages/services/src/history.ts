import { api } from './api';

export interface UploadHistoryDocumentResult {
  status: string;
  studentKey: string;
}

export const History = {
  uploadDocument: async (file: File): Promise<UploadHistoryDocumentResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post<UploadHistoryDocumentResult>(
      '/v2/students/history-document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return data;
  },
};
