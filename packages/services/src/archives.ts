import { api } from './api';

export type ArchiveSource = 'moodle' | 'manual' | 'sigaa' | 'cmcc';
export type ArchiveStatus =
  | 'created'
  | 'downloaded'
  | 'stored'
  | 'failed'
  | 'deleted';

export type ArchiveComponent = {
  _id: string;
  code: string;
  group: string;
  name: string;
  season: string;
  shift: 'day' | 'night';
};

export type ComponentArchive = {
  _id: string;
  component: ArchiveComponent | null;
  fileName: string | null;
  source: ArchiveSource;
  status: ArchiveStatus;
};

export type ArchivesParams = {
  page: number;
  limit: number;
  q?: string;
  source?: ArchiveSource;
  status?: ArchiveStatus;
};

export type ArchivesPage = {
  data: ComponentArchive[];
  limit: number;
  page: number;
  total: number;
};

export type ArchiveDownload = {
  expiresInSeconds: number;
  fileName: string | null;
  url: string;
};

export type ComponentPlan = {
  planning: {
    assessment: string;
    methodology: string;
    objectives: string;
    syllabus: string;
  } | null;
  schedule: Array<{ date: string; lesson: string }>;
  timetable: string[];
};

export const Archives = {
  getDownload: async (archiveId: string) => {
    const { data } = await api.get<ArchiveDownload>(
      `/v2/archives/${archiveId}/download`
    );
    return data;
  },
  getPlan: async (componentId: string) => {
    const { data } = await api.get<ComponentPlan>(
      `/v2/components/${componentId}/plan`
    );
    return data;
  },
  list: async (params: ArchivesParams) => {
    const { data } = await api.get<ArchivesPage>('/v2/archives', { params });
    return data;
  },
};
