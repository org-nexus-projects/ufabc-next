import { BaseRequester } from './base-requester.ts';
import type {
  Comment,
  Component,
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

   async completeSignup(data: { email: string; ra: number }) {
    return await this.request<UserConfirmResponse>('/users/complete', {
      body: data,
      method: 'PUT',
    });
  }

   async confirmSignup(token: string) {
    return await this.request<UserConfirmResponse>('/users/confirm', {
      body: { token },
      method: 'POST',
    });
  }

   async resendEmail() {
    return await this.request('/users/resend', { method: 'POST' });
  }

   async recovery(email: string) {
    return await this.request('/users/recover', {
      body: { email },
      method: 'POST',
    });
  }

   async deleteUser() {
    return await this.request('/users/remove', { method: 'DELETE' });
  }

   async getUserInfo() {
    return await this.request<User>('/users/info');
  }

   async facebookAuth(data: FacebookAuth) {
    return await this.request<UserConfirmResponse>('/users/facebook', {
      body: data,
      method: 'POST',
    });
  }

   async getEmail(ra: string) {
    return await this.request<EmailResponse>('/users/check-email', {
      query: { ra },
    });
  }

   async getWhatsappToken(token: string, component?: string | string[]) {
    return await this.request<WhatsappTokenResponse>('/v2/auth/whatsapp-token', {
      body: { component, token },
      method: 'POST',
    });
  }

   async getComments(teacherId: string, subjectId: string, pageParam = 0) {
    return await this.request<GetCommentResponse>(`/comments/${teacherId}/${subjectId}`, {
      query: { limit: 10, page: pageParam },
    });
  }

   async getUserComment(enrollmentId: string) {
    return await this.request<Comment>(`/comments/enrollment/${enrollmentId}`);
  }

   async createComment(data: { comment: string; enrollment: string; type: string }) {
    return await this.request<Comment>('/comments/', {
      body: data,
      method: 'POST',
    });
  }

   async updateComment(id: string, comment: string) {
    return await this.request<Comment>(`/comments/${id}`, {
      body: { comment },
      method: 'PUT',
    });
  }

   async deleteComment(id: string) {
    return await this.request(`/comments/${id}`, { method: 'DELETE' });
  }

   async createReaction(commentId: string, kind: ReactionKind) {
    return await this.request(`/comments/reactions/${commentId}`, {
      body: { kind },
      method: 'POST',
    });
  }

   async deleteReaction(commentId: string, kind: ReactionKind) {
    return await this.request(`/comments/reactions/${commentId}/${kind}`, {
      method: 'DELETE',
    });
  }

   async listEnrollments() {
    return await this.request<Enrollment[]>('/entities/enrollments');
  }

   async getEnrollment(id: string) {
    return await this.request<Enrollment>(`/entities/enrollments/${id}`);
  }

   async getEnrollmentsWithWhatsapp(params?: { ra?: number; season?: string }) {
    return await this.request<Enrollment[]>('/entities/enrollments/wpp', {
      query: params,
    });
  }

   async getStudent(login: string, sessionId: string) {
    return await this.request<MatriculaStudent>('/v2/students', {
      headers: { login, 'session-id': sessionId },
    });
  }

   async syncMatriculaStudent(
    sessionId: string,
    data: {
      login?: string;
      studentId?: number;
      graduationId?: number;
    }
  ) {
    return await this.request('/v2/students', {
      body: data,
      headers: { 'session-id': sessionId },
      method: 'PUT',
    });
  }

   async updateStudent(
    data: {
      login: string;
      ra: string;
      studentId?: number;
      graduationId?: number;
    },
    sessionId: string
  ) {
    return await this.request<UpdatedStudent>('/entities/students', {
      body: data,
      headers: { 'session-id': sessionId },
      method: 'PUT',
    });
  }

   async syncSigaaStudent(
    data: { login: string; ra: number },
    sessionId: string,
    viewId: string
  ) {
    return await this.request('/v2/students/sigaa', {
      body: data,
      headers: { 'session-id': sessionId, 'view-id': viewId },
      method: 'POST',
    });
  }

   async getSigStudent(data: SigStudent, sessionId: string) {
    return await this.request('/entities/students/sig', {
      body: data,
      headers: { 'session-id': sessionId },
      method: 'POST',
    });
  }

   async searchComponents(season?: string) {
     const query: Record<string, string> = {}
     if (season != undefined) {
      query.season = season
     }
     return await this.request<SearchComponentItem[]>('/v2/components', {
      query,
    });
  }

   async getEntityComponents() {
    return await this.request<Component[]>('/entities/components');
  }

   async getComponentKicks(
    componentId: string,
    params?: { sort?: string; season?: string; studentId?: number }
  ) {
    return await this.request(`/entities/components/${componentId}/kicks`, {
      query: params,
    });
  }

   async getComponentArchives(sessionId: string, sessKey: string) {
    return await this.request('/v2/components/archives', {
      headers: { 'sess-key': sessKey, 'session-id': sessionId },
    });
  }

   async triggerComponentArchiveProcessing(sessionId: string, sessKey: string) {
    return await this.request('/v2/components/archives', {
      headers: { 'sess-key': sessKey, 'session-id': sessionId },
      method: 'POST',
    });
  }

   async getComponentUploads() {
    return await this.request('/v2/components/archives/uploads');
  }

   async getTeachers() {
    return await this.request<Array<{ name: string; alias: string[] }>>('/entities/teachers/');
  }

   async createTeachers(names: string[]) {
    return await this.request('/entities/teachers/', {
      body: { names },
      method: 'POST',
    });
  }

   async updateTeacher(teacherId: string, alias: string) {
    return await this.request(`/entities/teachers/${teacherId}`, {
      body: { alias },
      method: 'PUT',
    });
  }

   async searchTeachers(q: string) {
    return await this.request<SearchTeacher>('/entities/teachers/search', {
      query: { q },
    });
  }

   async getTeacherReviews(teacherId: string) {
    return await this.request<TeacherReview>(`/entities/teachers/reviews/${teacherId}`);
  }

   async getSubjects(params: { limit: number; page: number }) {
    return await this.request('/entities/subjects/', { query: params });
  }

   async searchSubjects(q: string) {
    return await this.request<SearchSubject>('/entities/subjects/search', {
      query: { q },
    });
  }

   async getSubjectReviews(subjectId: string) {
    return await this.request<SubjectInfo>(`/entities/subjects/reviews/${subjectId}`);
  }

   async getStatsClasses(params: {
    season: string;
    page?: number;
    deficit?: number;
    vagas?: number;
    ratio?: number;
    requisicoes?: number;
    turno?: string;
  }) {
    return await this.request<StatsClass[]>('public/stats/components', {
      query: params,
    });
  }

   async getStatsCourses(params: { season: string; page?: number }) {
    return await this.request<StatsCourse[]>('public/stats/components/courses', {
      query: params,
    });
  }

   async getStatsSubjects(params: { season: string; page?: number }) {
    return await this.request<StatsSubject[]>('public/stats/components/component', {
      query: params,
    });
  }

   async getStatsCourseNames() {
    return await this.request<CourseName[]>('/histories/courses');
  }

   async getStatsOverview(params: { season: string }) {
    return await this.request<StatsOverview>('public/stats/components/overview', {
      query: params,
    });
  }

   async getStatsUsage(params: { season: string }) {
    return await this.request<StatsUsage>('public/stats/usage', {
      query: params,
    });
  }

   async getCrHistory() {
    return await this.request<QuadInformation[]>('courseStats/history');
  }

   async getCrDistribution() {
    return await this.request<CrDistributionData[]>('courseStats/grades');
  }

   async getHistoriesGraduations() {
    return await this.request<HistoriesGraduations>('/courseStats/user/grades');
  }

   async syncHistory(
    sessionId: string,
    viewState: string,
    data: { login: string; ra: string }
  ) {
    return await this.request('/histories', {
      body: data,
      headers: { 'session-id': sessionId, 'view-state': viewState },
      method: 'POST',
    });
  }

   async sendResults(sessionId: string, sessKey: string) {
    return await this.request<{ msg: string }>('/v2/components/archives', {
      headers: { 'sess-key': sessKey, 'session-id': sessionId },
      method: 'POST',
    });
  }

   async sendHelpForm(formData: FormData) {
    return await this.request<HelpFormResult>('/help/form', {
      body: formData,
      method: 'POST',
    });
  }

   async searchWhatsappComponents(season: string) {
    return await this.request<SearchComponentItem[]>('v2/components', {
      query: { season },
    });
  }

   async getWhatsappComponentsByUser(params: { ra?: number; season?: string }) {
    return await this.request<SearchComponentItem[]>('entities/enrollments/wpp', {
      query: params,
    });
  }

   async getWhatsappCourses() {
    return await this.request<SearchCourseItem[]>('/components/curriculum/subjects');
  }
}
