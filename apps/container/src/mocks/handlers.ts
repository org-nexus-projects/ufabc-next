import { http, HttpResponse } from 'msw';

import { enrollment, enrollments } from './enrollments';
import { historiesGraduations } from './performance';
import {
  comments,
  subject,
  subjectSearch,
  teacher,
  teacherSearch,
  teacherSummary,
} from './reviews';
import {
  classes,
  classesPage1,
  courseNames,
  courses,
  grades,
  overview,
  subjects,
  usage,
} from './stats';
import { user } from './users';

const baseUrl = import.meta.env.VITE_API_BASE_URL;

export const handlers = [
  http.get(`${baseUrl}/v2/users/info`, () => HttpResponse.json(user)),
  http.get(`${baseUrl}/v2/entities/enrollments`, () =>
    HttpResponse.json(enrollments),
  ),
  http.get(`${baseUrl}/v2/entities/enrollments/*`, () =>
    HttpResponse.json(enrollment),
  ),
  http.get(`${baseUrl}/v2/entities/teachers/reviews/*`, () =>
    HttpResponse.json(teacher),
  ),
  http.get(`${baseUrl}/v2/teachers/*/summary`, () =>
    HttpResponse.json(teacherSummary),
  ),
  http.get(`${baseUrl}/v2/entities/subjects/reviews/*`, () =>
    HttpResponse.json(subject),
  ),
  http.get(`${baseUrl}/v2/comments/*`, () => HttpResponse.json(comments)),
  http.get(`${baseUrl}/v2/public/stats/usage`, () => HttpResponse.json(usage)),
  http.get(`${baseUrl}/v2/public/stats/components/courses`, () =>
    HttpResponse.json(courses),
  ),
  http.get(`${baseUrl}/v2/public/stats/components`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('page') === '1') {
      return HttpResponse.json(classesPage1);
    }
    return HttpResponse.json(classes);
  }),
  http.get(`${baseUrl}/v2/public/stats/components/overview`, () =>
    HttpResponse.json(overview),
  ),
  http.get(`${baseUrl}/v2/public/stats/components/component`, () =>
    HttpResponse.json(subjects),
  ),
  http.get(`${baseUrl}/v2/histories/courses`, () =>
    HttpResponse.json(courseNames),
  ),
  http.get(`${baseUrl}/v2/courseStats/user/grades`, () =>
    HttpResponse.json(historiesGraduations),
  ),
  http.get(`${baseUrl}/v2/courseStats/grades`, () =>
    HttpResponse.json(grades),
  ),
  http.get(`${baseUrl}/v2/entities/teachers/search`, () => {
    return HttpResponse.json(teacherSearch);
  }),
  http.get(`${baseUrl}/v2/entities/subjects/search`, () =>
    HttpResponse.json(subjectSearch),
  ),
  http.delete(`${baseUrl}/v2/users/remove`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/v2/users/confirm`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/v2/users/recover`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/v2/users/resend`, () => HttpResponse.json({})),
  http.put(`${baseUrl}/v2/users/complete`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/v2/comments/`, () => HttpResponse.json({})),
  http.put(`${baseUrl}/v2/comments/*`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/v2/comments/reactions/*`, () => HttpResponse.json({})),
  http.delete(`${baseUrl}/v2/comments/reactions/*/like`, () =>
    HttpResponse.json({}),
  ),
  http.delete(`${baseUrl}/v2/comments/reactions/*/recommendation`, () =>
    HttpResponse.json({}),
  ),
];
