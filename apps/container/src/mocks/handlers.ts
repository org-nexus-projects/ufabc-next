import { http, HttpResponse } from 'msw';

import { enrollment, enrollments } from './enrollments';
import { historiesGraduations } from './performance';
import {
  comments,
  subject,
  subjectSearch,
  teacher,
  teacherSearch,
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
  http.get(`${baseUrl}/users/info`, () => HttpResponse.json(user)),
  http.get(`${baseUrl}/entities/enrollments`, () =>
    HttpResponse.json(enrollments),
  ),
  http.get(`${baseUrl}/entities/enrollments/*`, () =>
    HttpResponse.json(enrollment),
  ),
  http.get(`${baseUrl}/entities/teachers/reviews/*`, () =>
    HttpResponse.json(teacher),
  ),
  http.get(`${baseUrl}/entities/subjects/reviews/*`, () =>
    HttpResponse.json(subject),
  ),
  http.get(`${baseUrl}/comments/*`, () => HttpResponse.json(comments)),
  http.get(`${baseUrl}/public/stats/usage`, () => HttpResponse.json(usage)),
  http.get(`${baseUrl}/public/stats/components/courses`, () =>
    HttpResponse.json(courses),
  ),
  http.get(`${baseUrl}/public/stats/components`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('page') === '1') {
      return HttpResponse.json(classesPage1);
    }
    return HttpResponse.json(classes);
  }),
  http.get(`${baseUrl}/public/stats/components/overview`, () =>
    HttpResponse.json(overview),
  ),
  http.get(`${baseUrl}/public/stats/components/component`, () =>
    HttpResponse.json(subjects),
  ),
  http.get(`${baseUrl}/histories/courses`, () =>
    HttpResponse.json(courseNames),
  ),
  http.get(`${baseUrl}/courseStats/user/grades`, () =>
    HttpResponse.json(historiesGraduations),
  ),
  http.get(`${baseUrl}/courseStats/grades`, () => HttpResponse.json(grades)),
  http.get(`${baseUrl}/entities/teachers/search`, () => {
    return HttpResponse.json(teacherSearch);
  }),
  http.get(`${baseUrl}/entities/subjects/search`, () =>
    HttpResponse.json(subjectSearch),
  ),
  http.delete(`${baseUrl}/users/remove`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/users/confirm`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/users/recover`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/users/resend`, () => HttpResponse.json({})),
  http.put(`${baseUrl}/users/complete`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/comments/`, () => HttpResponse.json({})),
  http.put(`${baseUrl}/comments/*`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/comments/reactions/*`, () => HttpResponse.json({})),
  http.delete(`${baseUrl}/comments/reactions/*/like`, () =>
    HttpResponse.json({}),
  ),
  http.delete(`${baseUrl}/comments/reactions/*/recommendation`, () =>
    HttpResponse.json({}),
  ),
];
