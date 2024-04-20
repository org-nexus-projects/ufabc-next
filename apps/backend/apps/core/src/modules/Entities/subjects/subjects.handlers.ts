import {
  groupBy as LodashGroupBy,
  merge as LodashMerge,
  camelCase,
  startCase,
} from "lodash-es";
import { TeacherModel } from "@/models/Teacher.js";
import { SubjectModel } from "@/models/Subject.js";
import { storage } from "@/services/unstorage.js";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { SubjectService } from "./subjects.service.js";

type ReviewStats = Awaited<ReturnType<SubjectService["subjectReviews"]>>;
type Concept = ReviewStats[number]["distribution"][number]["conceito"];
type Distribution = Omit<
  ReviewStats[number]["distribution"][number],
  "conceito | weigth"
>;

type GroupedDistribution = Record<
  NonNullable<Concept>,
  ReviewStats[number]["distribution"]
>;

export class SubjectHandler {
  constructor(private readonly subjectService: SubjectService) {}

  async searchSubject(request: FastifyRequest<{ Querystring: { q: string } }>) {
    const { q: rawSearch } = request.query;
    const normalizedSearch = startCase(camelCase(rawSearch));
    const validatedSearch = normalizedSearch.replaceAll(
      /[\s#$()*+,.?[\\\]^{|}-]/g,
      "\\$&",
    );

    const search = new RegExp(validatedSearch, "gi");
    const searchResults = await this.subjectService.findSubject(search);
    return searchResults;
  }

  async createSubject(request: FastifyRequest<{ Body: { name: string } }>) {
    const subjectName = request.body.name;

    const insertedSubject =
      await this.subjectService.createSubject(subjectName);

    return insertedSubject;
  }

  async listAllSubjects() {
    const subjects = await this.subjectService.listSubjects();
    return subjects;
  }

  // this need a big refactor
  async subjectsReviews(
    request: FastifyRequest<{ Params: { subjectId: string } }>,
    reply: FastifyReply,
  ) {
    const { subjectId } = request.params;

    if (!subjectId) {
      return reply.badRequest("Missing Subject");
    }

    const cacheKey = `reviews-${subjectId}`;
    const cached = await storage.getItem<typeof result>(cacheKey);

    if (cached) {
      return cached;
    }

    const stats = await this.subjectService.subjectReviews(subjectId);

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
      subject: await SubjectModel.findOne({ _id: subjectId }).lean(true),
      // @ts-expect-error mess code
      general: LodashMerge(getStatsMean(rawDistribution), {
        distribution: rawDistribution,
      }),
      specific: await TeacherModel.populate(stats, "teacher"),
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
