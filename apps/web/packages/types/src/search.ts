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
