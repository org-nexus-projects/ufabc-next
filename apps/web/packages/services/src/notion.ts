import { api } from './api';

export interface NotionCardData {
  title: string;
  description: string;
  priority: 'Baixa' | 'Média' | 'Alta';
}

export interface NotionCardResponse {
  id: string;
  url: string;
  created_time: string;
}

export const createNotionCard = async (
  data: NotionCardData,
): Promise<NotionCardResponse> => {
  try {
    const { title, description, priority } = data;

    if (!title || !description || !priority) {
      throw new Error('Title, description, and priority are required fields');
    }

    if (!['Baixa', 'Média', 'Alta'].includes(priority)) {
      throw new Error('Priority must be one of: Baixa, Média, Alta');
    }

    console.log('Making request to backend proxy...');
    console.log('Request data:', { title, description, priority });

    const response = await api.post<NotionCardResponse>('/api/notion/card', {
      title,
      description,
      priority,
    });

    console.log('Success response:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('Error creating Notion card:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      response: error.response?.data,
    });

    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }

    throw new Error(error.message || 'Failed to create Notion card');
  }
};
