import { api } from './api';

export interface HelpFormData {
  email: string;
  ra: string;
  problemTitle: string;
  problemDescription: string;
  image?: File;
}

export interface HelpFormResult {
  success: boolean;
  id?: string;
  url?: string;
}

export const sendHelpForm = async (
  data: HelpFormData,
): Promise<HelpFormResult> => {
  const formData = new FormData();

  formData.append('email', data.email);
  formData.append('ra', data.ra);
  formData.append('problemTitle', data.problemTitle);
  formData.append('problemDescription', data.problemDescription);

  if (data.image) {
    formData.append('image', data.image);
  }

  const response = await api.post('/help/form', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.status === 201) {
    return { success: true };
  }

  throw new Error('Falha ao enviar o formulário');
};
