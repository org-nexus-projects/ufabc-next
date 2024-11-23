import type { Student } from "@/scripts/sig/homepage";
import { ofetch } from "ofetch";

export type PaginatedSubjects = {
  total: number;
  pages: number;
  data: {
    name: string;
    credits: number;
  }[];
};

export type SigHistory = {
  ra: string;
  grade: string;
  course: string;
  components: {
    grade: "A" | "B" | "C" | "D" | "O" | "F" | "E" | null;
    name: string;
    status: string | null;
    year: string;
    period: "1" | "2" | "3";
    UFCode: string;
    category: "mandatory" | "free" | "limited";
    credits: number;
  }[];
};

function resolveEndpoint() {
  if (import.meta.env.PROD) {
    return "https://api.v2.ufabcnext.com";
  }

  return "https://api.v2.ufabcnext.com/v2";
}

export const nextService = ofetch.create({
  baseURL: resolveEndpoint(),
});

export async function getPaginatedSubjects(page = 1, limit = 2_000) {
  const paginatedSubjects = await nextService<PaginatedSubjects>(
    "/entities/subjects",
    {
      params: {
        page: page,
        limit: limit,
      },
    }
  );

  return paginatedSubjects;
}

export async function createStudent(student: Student) {
  const createdStudent = await nextService("/entities/student", {
    method: "POST",
    body: student,
  });
  return createdStudent;
}

export async function syncHistory(student: SigHistory) {
  const syncedStudent = await nextService("/history", {
    method: "POST",
    body: student,
  });
  return syncedStudent;
}
