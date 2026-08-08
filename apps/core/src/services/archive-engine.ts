import { findArchiveQuarter } from '@next/utils';
import { load } from 'cheerio';
import { createHash } from 'node:crypto';

import { MoodleConnector } from '@/connectors/moodle.js';
import type { S3Connector } from '@/connectors/s3-connector.js';
import { ArchiveParseFailed } from '@/errors/custom-errors.js';
import type { ComponentDocument } from '@/models/Component.js';
import { findTeacher } from '@/models/Teacher.js';
import { ComponentsRepository } from '@/repositories/components-repository.js';
import { componentArchiveSchema } from '@/schemas/v2/components.js';
import { logger as baseLogger } from '@/utils/logger.js';

export type MoodleSession = {
  sessionId: string;
  sessKey: string;
};

export type MoodleCourse = {
  viewurl: string;
  fullname: string;
  shortname?: string;
  idnumber?: string;
  id: number;
  startdate?: number;
};

export class ArchiveEngine {
  private readonly logger;
  private readonly moodleConnector;
  private readonly componentsRepository: ComponentsRepository;
  private readonly session?: MoodleSession;
  private readonly s3Connector?: S3Connector;

  constructor({
    globalTraceId,
    session,
    s3Connector,
  }: {
    globalTraceId?: string;
    session?: MoodleSession;
    s3Connector?: S3Connector;
  } = {}) {
    this.logger = baseLogger.child({ globalTraceId });
    this.moodleConnector = new MoodleConnector({ globalTraceId });
    this.componentsRepository = new ComponentsRepository({ globalTraceId });
    this.session = session;
    this.s3Connector = s3Connector;
  }

  async findComponentByMoodleCourse(
    moodleCourse: MoodleCourse,
    teacherNames?: string[],
    enrolledCodigos?: string[]
  ) {
    this.logger.info(
      { courseId: moodleCourse.id, courseName: moodleCourse.fullname },
      'Matching moodle course to internal component'
    );

    const candidates: string[] = [];

    if (moodleCourse.idnumber != null) {
      candidates.push(moodleCourse.idnumber);
    }

    if (moodleCourse.shortname != null) {
      const codeMatch = /[A-Z]{2,}\d{3,}(?:-\d+)?/u.exec(
        moodleCourse.shortname
      );
      if (codeMatch) {
        candidates.push(codeMatch[0]);
      }
    }

    const codeMatch = /[A-Z]{2,}\d{3,}(?:-\d+)?/u.exec(moodleCourse.fullname);
    if (codeMatch) {
      candidates.push(codeMatch[0]);
    }

    const uniqueCandidates = [...new Set(candidates)];
    this.logger.info(
      {
        candidates: uniqueCandidates,
        hasEnrolledFilter: (enrolledCodigos?.length ?? 0) > 0,
      },
      'Extracted candidate codes from moodle course'
    );

    const teacherIds: string[] = [];
    if (teacherNames && teacherNames.length > 0) {
      for (const teacherName of teacherNames) {
        const teacherId = await findTeacher(teacherName);
        if (teacherId) {
          teacherIds.push(teacherId.toString());
        }
      }
    }

    const uniqueTeacherIds = [...new Set(teacherIds)];

    this.logger.info(
      { count: uniqueTeacherIds.length, teacherIds: uniqueTeacherIds },
      'Resolved teachers for matching'
    );

    const seasonFilter =
      moodleCourse.startdate === undefined
        ? null
        : findArchiveQuarter(new Date(moodleCourse.startdate * 1000));

    if (seasonFilter) {
      this.logger.info(
        { derivedSeason: `${seasonFilter.year}:${seasonFilter.quad}` },
        'Derived season from moodle course startdate'
      );
    }

    let matchedComponent: ComponentDocument | null = null;

    // Try with season filter first
    const seasonExtra = seasonFilter
      ? { quad: seasonFilter.quad, year: seasonFilter.year }
      : {};

    matchedComponent = await this.matchComponentStrategies(
      moodleCourse,
      uniqueCandidates,
      uniqueTeacherIds,
      enrolledCodigos,
      seasonExtra
    );

    // Fall back to tenant-free if no match
    if (!matchedComponent) {
      this.logger.info(
        'No match with season filter, falling back to tenant-free'
      );
      matchedComponent = await this.matchComponentStrategies(
        moodleCourse,
        uniqueCandidates,
        uniqueTeacherIds,
        enrolledCodigos
      );
    }

    if (matchedComponent) {
      await this.componentsRepository.setMoodleCourseId(
        matchedComponent._id,
        moodleCourse.id
      );

      this.logger.info(
        {
          componentDbId: matchedComponent._id,
          componentName: matchedComponent.disciplina,
          moodleCourseId: moodleCourse.id,
        },
        'Updated component with moodleCourseId'
      );

      return matchedComponent;
    }

    this.logger.warn(
      { courseName: moodleCourse.fullname, moodleCourseId: moodleCourse.id },
      'No matching component found'
    );
    return null;
  }

  private async matchComponentStrategies(
    moodleCourse: MoodleCourse,
    uniqueCandidates: string[],
    uniqueTeacherIds: string[],
    enrolledCodigos: string[] | undefined,
    extraFilter: Record<string, unknown> = {}
  ): Promise<ComponentDocument | null> {
    const findByKeywords = async (
      keywords: string[],
      extraFilterInner: Record<string, unknown> = {}
    ): Promise<ComponentDocument | null> =>
      await this.componentsRepository.findByDisciplinaKeywords(
        keywords,
        extraFilterInner
      );

    const enrolledCodigosFilter =
      enrolledCodigos && enrolledCodigos.length > 0
        ? { codigo: { $in: enrolledCodigos } }
        : {};

    const isCodeAllowed =
      enrolledCodigos && enrolledCodigos.length > 0
        ? (code: string) => enrolledCodigos.includes(code)
        : () => true;

    // Strategy 1: candidate code + teacher
    if (uniqueCandidates.length > 0) {
      const teacherFilter =
        uniqueTeacherIds.length > 0
          ? {
              $or: [
                { teoria: { $in: uniqueTeacherIds } },
                { pratica: { $in: uniqueTeacherIds } },
              ],
            }
          : {};

      for (const candidateCode of uniqueCandidates) {
        if (!isCodeAllowed(candidateCode)) {
          this.logger.info(
            { candidateCode },
            'Skipping candidate code not in enrollments'
          );
          continue;
        }

        const result = await this.componentsRepository.findByCodigo(
          candidateCode,
          { ...teacherFilter, ...extraFilter }
        );

        if (result) {
          this.logger.info(
            {
              candidateCode,
              componentDbId: result._id,
              componentName: result.disciplina,
              season: `${result.year}:${result.quad}`,
            },
            'Matched component by candidate code'
          );
          return result;
        }
      }

      // Strategy 2: candidate code only
      if (uniqueTeacherIds.length > 0) {
        for (const candidateCode of uniqueCandidates) {
          if (!isCodeAllowed(candidateCode)) {
            continue;
          }
          const result = await this.componentsRepository.findByCodigo(
            candidateCode,
            extraFilter
          );

          if (result) {
            this.logger.info(
              {
                candidateCode,
                componentDbId: result._id,
                componentName: result.disciplina,
                season: `${result.year}:${result.quad}`,
              },
              'Matched component by candidate code (no teacher)'
            );
            return result;
          }
        }
      }
    }

    // Strategy 3: disciplina keyword + teacher
    if (uniqueTeacherIds.length > 0) {
      const keywords = ArchiveEngine.extractKeywords(moodleCourse.fullname);
      this.logger.info(
        { keywords },
        'No candidate match, trying disciplina keywords'
      );

      const match = await ArchiveEngine.relaxedKeywordSearch(
        keywords,
        {
          $or: [
            { teoria: { $in: uniqueTeacherIds } },
            { pratica: { $in: uniqueTeacherIds } },
          ],
          ...extraFilter,
          ...enrolledCodigosFilter,
        },
        findByKeywords
      );

      if (match) {
        this.logger.info(
          {
            componentDbId: match.component._id,
            componentName: match.component.disciplina,
            keywords: match.keywordsUsed,
            season: `${match.component.year}:${match.component.quad}`,
          },
          'Matched component by disciplina keywords'
        );
        return match.component;
      }
    }

    // Strategy 4: disciplina keyword only
    {
      const keywords = ArchiveEngine.extractKeywords(moodleCourse.fullname);

      const match = await ArchiveEngine.relaxedKeywordSearch(
        keywords,
        { ...extraFilter, ...enrolledCodigosFilter },
        findByKeywords
      );

      if (match) {
        this.logger.info(
          {
            componentDbId: match.component._id,
            componentName: match.component.disciplina,
            keywords: match.keywordsUsed,
            season: `${match.component.year}:${match.component.quad}`,
          },
          'Matched component by disciplina keywords (no teacher)'
        );
        return match.component;
      }
    }

    return null;
  }

  private static extractKeywords(fullname: string): string[] {
    return fullname
      .toLowerCase()
      .split(/[\s-]+/u)
      .filter((w) => w.length > 3 && !/\d/u.test(w))
      .slice(0, 4);
  }

  private static async relaxedKeywordSearch(
    keywords: string[],
    extraFilter: Record<string, unknown>,
    finder: (
      subset: string[],
      filter: Record<string, unknown>
    ) => Promise<ComponentDocument | null>
  ): Promise<{ component: ComponentDocument; keywordsUsed: string[] } | null> {
    const cleanKeywords = keywords.filter(
      (w) => w.length > 3 && !/\d/u.test(w)
    );
    if (cleanKeywords.length === 0) {
      return null;
    }

    for (let count = cleanKeywords.length; count >= 1; count -= 1) {
      const subset = cleanKeywords.slice(0, count);
      const result = await finder(subset, extraFilter);
      if (result) {
        return { component: result, keywordsUsed: subset };
      }
    }

    return null;
  }

  async getUserEmail(sessionId: string): Promise<string | null> {
    const userPage = await this.moodleConnector.getUserPage(sessionId);
    const $ = load(userPage);
    const email = $(
      '#region-main > div > div > div.userprofile > div > section:nth-child(1) > div > ul > li:nth-child(2) > dl > dd > a'
    ).text();

    return email || null;
  }

  async fetchAndValidateCourses(session: MoodleSession) {
    const [moodleCourses] = await this.moodleConnector.getComponents(
      session.sessionId,
      session.sessKey
    );
    const parsed = componentArchiveSchema.safeParse(
      moodleCourses?.data?.courses
    );

    if (!parsed.success) {
      this.logger.warn(
        { error: parsed.error.message },
        'Failed to parse component archives'
      );
      throw new ArchiveParseFailed(parsed.error.message);
    }

    return parsed.data;
  }

  async extractTeacherNames(courseId: number) {
    if (!this.session) {
      this.logger.warn('No session available for teacher extraction');
      return [];
    }

    const html = await this.moodleConnector.getUsersByCoursePage(
      this.session.sessionId,
      courseId
    );

    const $ = load(html);
    const teacherNames: string[] = [];

    $('a[href*="user/view.php"]').each((_index, el) => {
      const name = $(el).text().trim();
      if (name && name.length > 2 && !/^\d+$/u.test(name)) {
        teacherNames.push(name);
      }
    });

    const uniqueNames = [...new Set(teacherNames)];

    this.logger.info(
      { count: uniqueNames.length, courseId, teacherNames: uniqueNames },
      'Found teachers via user/index.php'
    );

    return uniqueNames;
  }

  async extractFiles(viewurl: string, componentId: number) {
    const url = new URL(viewurl);
    const page = await this.moodleConnector.getComponentContentsPage(
      this.session?.sessionId ?? '',
      url.pathname,
      componentId.toString()
    );

    const $ = load(page);
    const potentialLinks: Array<{ href: string; name: string }> = [];

    $('div.activityname').each((_index, el) => {
      const href = $(el).find('a').attr('href');
      const name = $(el).find('span.instancename').text();
      if (href !== undefined && name) {
        potentialLinks.push({ href, name });
      }
    });

    $('a[href*="/mod/resource/"]').each((_index, el) => {
      const link = $(el).attr('href');
      const name = $(el).text().trim();
      if (
        link !== undefined &&
        name &&
        !potentialLinks.some((p) => p.href === link)
      ) {
        potentialLinks.push({ href: link, name });
      }
    });

    $('a[href*="/pluginfile.php/"]').each((_index, el) => {
      const link = $(el).attr('href');
      const trimmedText = $(el).text().trim();
      let name = trimmedText;
      if (name === '') {
        const titleAttr = $(el).attr('title');
        name =
          titleAttr !== undefined && titleAttr !== '' ? titleAttr : 'documento';
      }

      if (
        link !== undefined &&
        link.toLowerCase().endsWith('.pdf') &&
        !potentialLinks.some((p) => p.href === link)
      ) {
        potentialLinks.push({ href: link, name });
      }
    });

    const validationPromises = potentialLinks.map(async ({ href, name }) => {
      const { isPdf, finalUrl } = await this.moodleConnector.validatePdfLink(
        href,
        this.session?.sessionId ?? '',
        this.session?.sessKey ?? ''
      );

      if (!isPdf) {
        return null;
      }

      if (finalUrl !== undefined && finalUrl !== '') {
        return { name, url: finalUrl };
      }
      return null;
    });

    const validatedLinks = await Promise.all(validationPromises);
    return validatedLinks.filter((link) => link !== null);
  }

  async downloadAndUpload(rawUrl: string, componentId: string, bucket: string) {
    if (!this.session) {
      this.logger.warn(
        { componentId, rawUrl },
        'No Moodle session available, skipping PDF download'
      );
      return null;
    }

    const url = new URL(rawUrl);
    const buffer = await this.moodleConnector.downloadFile(
      url.href,
      this.session.sessionId
    );

    const filename = this.extractFilenameFromUrl(url);
    const sanitizedFilename = ArchiveEngine.sanitizeFilename(filename);
    const s3Key = `/archives/${componentId}/${sanitizedFilename}`;
    const checksum = createHash('sha256')
      .update(Buffer.from(buffer))
      .digest('hex');

    await this.s3Connector?.upload(bucket, s3Key, Buffer.from(buffer));

    return {
      checksum,
      pdfName: sanitizedFilename,
      s3Key,
    };
  }

  private extractFilenameFromUrl(url: URL): string {
    const { pathname } = url;
    this.logger.info(
      { pathname, url: url.href },
      'Extracting filename from URL'
    );
    const segments = pathname
      .split('/')
      .filter((segment) => segment.length > 0);
    const lastSegment = segments.at(-1) ?? 'document.pdf';

    try {
      return decodeURIComponent(lastSegment);
    } catch {
      return lastSegment;
    }
  }

  private static sanitizeFilename(filename: string): string {
    const invalidChars = /[<>:"|?*\s]/u;

    let sanitizedChars = '';
    for (const char of filename) {
      const code = char.codePointAt(0);
      const isInvalid =
        invalidChars.test(char) || (code !== undefined && code <= 31);
      sanitizedChars += isInvalid ? '_' : char;
    }

    let sanitized = sanitizedChars.replaceAll(/_{2,}/gu, '_').trim();

    if (!sanitized.toLowerCase().endsWith('.pdf')) {
      sanitized = `${sanitized}.pdf`;
    }

    if (sanitized.length > 255) {
      const ext = '.pdf';
      const nameWithoutExt = sanitized.slice(0, 255 - ext.length);
      sanitized = `${nameWithoutExt}${ext}`;
    }

    return sanitized || 'document.pdf';
  }
}
