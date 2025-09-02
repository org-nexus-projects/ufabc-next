import { http, HttpResponse } from 'msw';

import { enrollment, enrollments } from './enrollments';
import { historiesGraduations } from './performance';
import { comments, subject, subjectSearch, teacher, teacherSearch } from './reviews';
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
import { user, userGrades } from './users';

const baseUrl = 'https://api.v2.ufabcnext.com';

export const handlers = [
  http.get(`${baseUrl}/users/info`, () => HttpResponse.json(user)),
  http.get(`${baseUrl}/enrollments`, () => HttpResponse.json(enrollments)),
  http.get(`${baseUrl}/enrollments/*`, () => HttpResponse.json(enrollment)),
  http.get(`${baseUrl}/reviews/teachers/*`, () => HttpResponse.json(teacher)),
  http.get(`${baseUrl}/reviews/subjects/*`, () => HttpResponse.json(subject)),
  http.get(`${baseUrl}/comments/*`, () => HttpResponse.json(comments)),
  http.get(`${baseUrl}/stats/usage`, () => HttpResponse.json(usage)),
  http.get(`${baseUrl}/stats/disciplinas/courses`, () =>
    HttpResponse.json(courses),
  ),
  http.get(`${baseUrl}/stats/disciplinas`, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('page') === '1') {
      return HttpResponse.json(classesPage1);
    }
    return HttpResponse.json(classes);
  }),
  http.get(`${baseUrl}/stats/disciplinas/overview`, () =>
    HttpResponse.json(overview),
  ),
  http.get(`${baseUrl}/stats/disciplinas/disciplines`, () =>
    HttpResponse.json(subjects),
  ),
  http.get(`${baseUrl}/histories/courses`, () =>
    HttpResponse.json(courseNames),
  ),
  http.get(`${baseUrl}/users/me/grades`, () => HttpResponse.json(userGrades)),
  http.get(`${baseUrl}/stats/grades`, () => HttpResponse.json(grades)),
  http.get(`${baseUrl}/historiesGraduations`, () =>
    HttpResponse.json(historiesGraduations),
  ),
  http.get(`${baseUrl}/teachers/search`, () => {
    return HttpResponse.json(teacherSearch);
  }),
  http.get(`${baseUrl}/subjects/search`, () =>
    HttpResponse.json(subjectSearch),
  ),
  http.delete(`${baseUrl}/users/me/delete`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/account/confirm`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/users/me/recover`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/users/me/resend`, () => HttpResponse.json({})),
  http.put(`${baseUrl}/users/complete`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/comments`, () => HttpResponse.json({})),
  http.put(`${baseUrl}/comments/*`, () => HttpResponse.json({})),
  http.post(`${baseUrl}/reactions/*`, () => HttpResponse.json({})),
  http.delete(`${baseUrl}/reactions/*`, () => HttpResponse.json({})),
];
