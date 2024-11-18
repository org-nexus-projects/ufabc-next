import type { Student } from "@/scripts/sig/homepage";
import { ofetch } from "ofetch";

export type PaginatedSubjects = {
  total: number;
  pages: number
  data: {
    name: string;
    credits: number;
  }[]
}

const SUBJECTS_CACHE_KEY = 'next:subjects'

function resolveEndpoint() {
  if (import.meta.env.PROD) {
    return 'https://api.v2.ufabcnext.com'
  }

  return 'http://localhost:5000'
}


export const nextService = ofetch.create({
  baseURL: resolveEndpoint(),
})


export async function getPaginatedSubjects(page = 1, limit = 2_000) {
  const cachedSubjects = await storage.getItem<PaginatedSubjects>(
		`session:${SUBJECTS_CACHE_KEY}`,
	);

  if (cachedSubjects) {
    return cachedSubjects;
  }

  const paginatedSubjects = await nextService<PaginatedSubjects>("/entities/subjects", {
    params: {
      page: page,
      limit: limit,
    },
  });

  storage.setItem(`session:${SUBJECTS_CACHE_KEY}`, paginatedSubjects)
  return paginatedSubjects
}


export async function createStudent(student: Student) {
  const createdStudent = await nextService('/entities/student', {
    method: 'POST',
    body: student,
  })
  return createdStudent;
}
