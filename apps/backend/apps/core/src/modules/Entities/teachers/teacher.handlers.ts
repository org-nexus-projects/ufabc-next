import {
  groupBy as LodashGroupBy,
  merge as LodashMerge,
  camelCase,
  startCase,
} from "lodash-es";
import { type Teacher, TeacherModel } from "@/models/Teacher.js";
import { SubjectModel } from "@/models/Subject.js";
import { storage } from "@/services/unstorage.js";
import type { TeacherService } from "./teacher.service.js";
import type { FastifyReply, FastifyRequest } from "fastify";

export type UpdateTeacherRequest = {
  Body: {
    alias: string[];
  };
  Params: {
    teacherId: string;
  };
};

type ReviewStats = Awaited<ReturnType<TeacherService["teacherReviews"]>>;
type Concept = ReviewStats[number]["distribution"][number]["conceito"];
type Distribution = Omit<
  ReviewStats[number]["distribution"][number],
  "conceito | weigth"
>;

type GroupedDistribution = Record<
  NonNullable<Concept>,
  ReviewStats[number]["distribution"]
>;

export class TeacherHandler {
  constructor(private readonly teacherService: TeacherService) {}

  async listAllTeachers() {
    const teachers = await this.teacherService.listTeachers({});
    return teachers;
  }

  async createTeacher(
    request: FastifyRequest<{ Body: Teacher }>,
    reply: FastifyReply,
  ) {
    const teacher = request.body;
    if (!teacher.name) {
      return reply.badRequest("Missing Teacher name");
    }
    const createdTeacher = await this.teacherService.insertTeacher(teacher);
    return createdTeacher;
  }

  async updateTeacher(
    request: FastifyRequest<UpdateTeacherRequest>,
    reply: FastifyReply,
  ) {
    const { teacherId } = request.params;
    const { alias } = request.body;

    if (!teacherId) {
      return reply.badRequest("Missing teacherId");
    }

    const teacherWithAlias = await this.teacherService.setTeacherAlias(
      teacherId,
      alias,
    );

    return teacherWithAlias;
  }

  async searchTeacher(request: FastifyRequest<{ Querystring: { q: string } }>) {
    const { q: rawSearch } = request.query;
    const normalizedSearch = startCase(camelCase(rawSearch));
    const validatedSearch = normalizedSearch.replaceAll(
      /[\s#$()*+,.?[\\\]^{|}-]/g,
      "\\$&",
    );

    const search = new RegExp(validatedSearch, "gi");
    const searchResults = await this.teacherService.findTeacher(search);
    return searchResults;
  }

  async teacherReview(
    request: FastifyRequest<{ Params: { teacherId: string } }>,
    reply: FastifyReply,
  ) {
    const { teacherId } = request.params;

    if (!teacherId) {
      return reply.badRequest("Missing Subject");
    }

    const cacheKey = `reviews-${teacherId}`;
    const cached = await storage.getItem<typeof result>(cacheKey);

    if (cached) {
      return cached;
    }

    const stats = await this.teacherService.teacherReviews(teacherId);
    request.log.warn(stats);

    stats.map((stat) => {
      stat.cr_medio = stat.numeric / stat.amount;
      return stat;
    });

    const distributions = stats.flatMap((stat) => stat.distribution);
    const groupedDistributions = LodashGroupBy(
      distributions,
      "conceito",
    ) as GroupedDistribution;

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const distributionsMean = {} as Record<NonNullable<Concept>, Distribution>;
    for (const conceito in groupedDistributions) {
      const concept = conceito as NonNullable<Concept>;
      const statsArray = groupedDistributions[concept];
      // @ts-expect-error mess code
      distributionsMean[concept] = getStatsMean(statsArray);
    }

    const rawDistribution = Object.values<Distribution>(distributionsMean);

    const result = {
      teacher: await TeacherModel.findOne({ _id: teacherId }).lean(true),
      // @ts-expect-error mess code
      general: LodashMerge(getStatsMean(rawDistribution), {
        distribution: rawDistribution,
      }),
      specific: await SubjectModel.populate(stats, "_id"),
    };

    await storage.setItem<typeof result>(cacheKey, result, {
      ttl: 60 * 60 * 24,
    });

    return result;
  }
}

function getStatsMean(
  reviewStats: ReviewStats[number]["distribution"],
  key?: keyof GroupedDistribution,
) {
  const count = reviewStats.reduce((acc, { count }) => acc + count, 0);
  const amount = reviewStats.reduce((acc, { amount }) => acc + amount, 0);
  const simpleSum = reviewStats
    .filter((stat) => stat.cr_medio !== null)
    .map((stat) => stat.amount + stat.cr_medio!);
  const totalSum = simpleSum.reduce((acc, val) => acc + val, 0);

  return {
    conceito: key,
    cr_medio: totalSum / amount,
    cr_professor:
      reviewStats.reduce((acc, { numericWeight }) => acc + numericWeight, 0) /
      amount,
    count,
    amount,
    numeric: reviewStats.reduce((acc, { numeric }) => acc + numeric, 0),
    numericWeight: reviewStats.reduce(
      (acc, { numericWeight }) => acc + numericWeight,
      0,
    ),
  };
}
