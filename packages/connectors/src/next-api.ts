import { BaseRequester } from './base-requester.ts';
import type {
  Comment,
  Component,
  CourseInformation,
  CourseName,
  CrDistributionData,
  EmailResponse,
  Enrollment,
  FacebookAuth,
  GetCommentResponse,
  HelpFormResult,
  HistoriesGraduations,
  MatriculaStudent,
  QuadInformation,
  ReactionKind,
  SearchComponentItem,
  SearchCourseItem,
  SearchSubject,
  SearchTeacher,
  SigStudent,
  StatsClass,
  StatsCourse,
  StatsOverview,
  StatsSubject,
  StatsUsage,
  SubjectInfo,
  TeacherReview,
  UpdatedStudent,
  User,
  UserConfirmResponse,
  WhatsappTokenResponse,
} from './schemas/next-api.ts';

export type NextApiConnectorOptions = {
  baseURL: string;
  globalTraceId?: string;
  defaultHeaders?: Record<string, string>;
  validateResponses?: boolean;
};

export class NextApiConnector extends BaseRequester {
  constructor(options: NextApiConnectorOptions) {
    super({ ...options, component: 'next-api' });
  }

  completeSignup(data: { email: string; ra: number }) {
    return this.request<UserConfirmResponse>('/users/complete', {
      method: 'PUT',
      body: data,
    });
  }

  confirmSignup(token: string) {
    return this.request<UserConfirmResponse>('/users/confirm', {
      method: 'POST',
      body: { token },
    });
  }

  resendEmail() {
    return this.request('/users/resend', { method: 'POST' });
  }

  recovery(email: string) {
    return this.request('/users/recover', {
      method: 'POST',
      body: { email },
    });
  }

  deleteUser() {
    return this.request('/users/remove', { method: 'DELETE' });
  }

  getUserInfo() {
    return this.request<User>('/users/info');
  }

  facebookAuth(data: FacebookAuth) {
    return this.request<UserConfirmResponse>('/users/facebook', {
      method: 'POST',
      body: data,
    });
  }

  getEmail(ra: string) {
    return this.request<EmailResponse>('/users/check-email', {
      query: { ra },
    });
  }

  getWhatsappToken(token: string, component?: string | string[]) {
    return this.request<WhatsappTokenResponse>('/v2/auth/whatsapp-token', {
      method: 'POST',
      body: { token, component },
    });
  }

  getComments(teacherId: string, subjectId: string, pageParam = 0) {
    return this.request<GetCommentResponse>(`/comments/${teacherId}/${subjectId}`, {
      query: { page: pageParam, limit: 10 },
    });
  }

  getUserComment(enrollmentId: string) {
    return this.request<Comment>(`/comments/enrollment/${enrollmentId}`);
  }

  createComment(data: { comment: string; enrollment: string; type: string }) {
    return this.request<Comment>('/comments/', {
      method: 'POST',
      body: data,
    });
  }

  updateComment(id: string, comment: string) {
    return this.request<Comment>(`/comments/${id}`, {
      method: 'PUT',
      body: { comment },
    });
  }

  deleteComment(id: string) {
    return this.request(`/comments/${id}`, { method: 'DELETE' });
  }

  createReaction(commentId: string, kind: ReactionKind) {
    return this.request(`/comments/reactions/${commentId}`, {
      method: 'POST',
      body: { kind },
    });
  }

  deleteReaction(commentId: string, kind: ReactionKind) {
    return this.request(`/comments/reactions/${commentId}/${kind}`, {
      method: 'DELETE',
    });
  }

  listEnrollments() {
    return this.request<Enrollment[]>('/entities/enrollments');
  }

  getEnrollment(id: string) {
    return this.request<Enrollment>(`/entities/enrollments/${id}`);
  }

  getEnrollmentsWithWhatsapp(params?: { ra?: number; season?: string }) {
    return this.request<Enrollment[]>('/entities/enrollments/wpp', {
      query: params,
    });
  }

  getStudent(login: string, sessionId: string) {
    return this.request<MatriculaStudent>('/v2/students', {
      headers: { login, 'session-id': sessionId },
    });
  }

  syncMatriculaStudent(
    sessionId: string,
    data: {
      login?: string;
      studentId?: number;
      graduationId?: number;
    }
  ) {
    return this.request('/v2/students', {
      method: 'PUT',
      body: data,
      headers: { 'session-id': sessionId },
    });
  }

  updateStudent(
    data: {
      login: string;
      ra: string;
      studentId?: number;
      graduationId?: number;
    },
    sessionId: string
  ) {
    return this.request<UpdatedStudent>('/entities/students', {
      method: 'PUT',
      body: data,
      headers: { 'session-id': sessionId },
    });
  }

  syncSigaaStudent(
    data: { login: string; ra: number },
    sessionId: string,
    viewId: string
  ) {
    return this.request('/v2/students/sigaa', {
      method: 'POST',
      body: data,
      headers: { 'session-id': sessionId, 'view-id': viewId },
    });
  }

  getSigStudent(data: SigStudent, sessionId: string) {
    return this.request('/entities/students/sig', {
      method: 'POST',
      body: data,
      headers: { 'session-id': sessionId },
    });
  }

  searchComponents(season?: string) {
    return this.request<SearchComponentItem[]>('/v2/components', {
      query: season ? { season } : undefined,
    });
  }

  getEntityComponents() {
    return this.request<Component[]>('/entities/components');
  }

  getComponentKicks(
    componentId: string,
    params?: { sort?: string; season?: string; studentId?: number }
  ) {
    return this.request(`/entities/components/${componentId}/kicks`, {
      query: params,
    });
  }

  getComponentArchives(sessionId: string, sessKey: string) {
    return this.request('/v2/components/archives', {
      headers: { 'session-id': sessionId, 'sess-key': sessKey },
    });
  }

  triggerComponentArchiveProcessing(sessionId: string, sessKey: string) {
    return this.request('/v2/components/archives', {
      method: 'POST',
      headers: { 'session-id': sessionId, 'sess-key': sessKey },
    });
  }

  getComponentUploads() {
    return this.request('/v2/components/archives/uploads');
  }

  getTeachers() {
    return this.request<Array<{ name: string; alias: string[] }>>('/entities/teachers/');
  }

  createTeachers(names: string[]) {
    return this.request('/entities/teachers/', {
      method: 'POST',
      body: { names },
    });
  }

  updateTeacher(teacherId: string, alias: string) {
    return this.request(`/entities/teachers/${teacherId}`, {
      method: 'PUT',
      body: { alias },
    });
  }

  searchTeachers(q: string) {
    return this.request<SearchTeacher>('/entities/teachers/search', {
      query: { q },
    });
  }

  getTeacherReviews(teacherId: string) {
    return this.request<TeacherReview>(`/entities/teachers/reviews/${teacherId}`);
  }

  getSubjects(params: { limit: number; page: number }) {
    return this.request('/entities/subjects/', { query: params });
  }

  searchSubjects(q: string) {
    return this.request<SearchSubject>('/entities/subjects/search', {
      query: { q },
    });
  }

  getSubjectReviews(subjectId: string) {
    return this.request<SubjectInfo>(`/entities/subjects/reviews/${subjectId}`);
  }

  getStatsClasses(params: {
    season: string;
    page?: number;
    deficit?: number;
    vagas?: number;
    ratio?: number;
    requisicoes?: number;
    turno?: string;
  }) {
    return this.request<StatsClass[]>('public/stats/components', {
      query: params,
    });
  }

  getStatsCourses(params: { season: string; page?: number }) {
    return this.request<StatsCourse[]>('public/stats/components/courses', {
      query: params,
    });
  }

  getStatsSubjects(params: { season: string; page?: number }) {
    return this.request<StatsSubject[]>('public/stats/components/component', {
      query: params,
    });
  }

  getStatsCourseNames() {
    return this.request<CourseName[]>('/histories/courses');
  }

  getStatsOverview(params: { season: string }) {
    return this.request<StatsOverview>('public/stats/components/overview', {
      query: params,
    });
  }

  getStatsUsage(params: { season: string }) {
    return this.request<StatsUsage>('public/stats/usage', {
      query: params,
    });
  }

  getCrHistory() {
    return this.request<QuadInformation[]>('courseStats/history');
  }

  getCrDistribution() {
    return this.request<CrDistributionData[]>('courseStats/grades');
  }

  getHistoriesGraduations() {
    return this.request<HistoriesGraduations>('/courseStats/user/grades');
  }

  syncHistory(
    sessionId: string,
    viewState: string,
    data: { login: string; ra: string }
  ) {
    return this.request('/histories', {
      method: 'POST',
      body: data,
      headers: { 'session-id': sessionId, 'view-state': viewState },
    });
  }

  sendResults(sessionId: string, sessKey: string) {
    return this.request<{ msg: string }>('/v2/components/archives', {
      method: 'POST',
      headers: { 'session-id': sessionId, 'sess-key': sessKey },
    });
  }

  sendHelpForm(formData: FormData) {
    return this.request<HelpFormResult>('/help/form', {
      method: 'POST',
      body: formData,
    });
  }

  searchWhatsappComponents(season: string) {
    return this.request<SearchComponentItem[]>('v2/components', {
      query: { season },
    });
  }

  getWhatsappComponentsByUser(params: { ra?: number; season?: string }) {
    return this.request<SearchComponentItem[]>('entities/enrollments/wpp', {
      query: params,
    });
  }

  getWhatsappCourses() {
    return this.request<SearchCourseItem[]>('/components/curriculum/subjects');
  }
}
