import { HistoryModel } from '@/models/History.js';
import type { RouteHandler } from 'fastify';

type GradesRouteHandler = RouteHandler;
export const grades: GradesRouteHandler = async (request) => {
  // TODO: discover why points is a 40 constant
  const POINTS = 40;
  const INTERVAL = 4 / POINTS;

  const distribution = await HistoryModel.aggregate(
    // @ts-expect-error
    DistributionAggregateQuery(POINTS, INTERVAL),
  );
  const normalizedDistribution = distribution.map((interval) => {
    interval._id = interval._id.toFixed(2);
    interval.point = interval.point.toFixed(2);
    return interval;
  });

  request.log.info({ msg: 'Distribuiton points', normalizedDistribution });

  return normalizedDistribution;
};

const createGroup = (totalPoints: number, inc: number) => {
  // i still dont know what this code serves for
  const branches = [...Array.from({ length: totalPoints }).keys()].map((k) => ({
    case: {
      // select where the cr_acumulado is less than inc * k
      $lt: ['$value.cr_acumulado', inc * k],
    },
    then: inc * k,
  }));

  return {
    $switch: {
      branches,
      default: inc * totalPoints,
    },
  };
};

const DistributionAggregateQuery = (points: number, interval: number) => {
  const matchCoefficients = { 'coefficients.2018.3': { $exists: true } };
  const fieldsToInclude = {
    value: '$coefficients.2018.3',
  };
  const queryResultGroup = {
    _id: createGroup(points, interval),
    total: { $sum: 1 },
    point: { $avg: '$value.cr_acumulado' },
  };
  const sortResponseBy = { point: 1 };

  return [
    {
      $match: matchCoefficients,
    },
    {
      $project: fieldsToInclude,
    },
    {
      $group: queryResultGroup,
    },
    { $sort: sortResponseBy },
  ];
};
