export type SearchTeacherItem = {
  _id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  __v: number;
  alias?: string[];
};

export type SearchSubjectItem = {
  _id: string;
  name: string;
  search: string;
  updatedAt: string;
  createdAt: string;
  __v: number;
  creditos: number;
};

export type SearchComponentItem = {
  season: string;
  groupURL: string;
  codigo: string;
  campus?: 'sa' | 'sbc';
  turma?: string;
  turno?: string;
  subject: string;
  teoria: string;
  pratica: string;
};

export type SearchCourseItem = {
  id: number;
  name: string;
  ufComponentCodes: string[];
  ufabcCourseIdentifier: number;
  componentKeys: string[];
};
