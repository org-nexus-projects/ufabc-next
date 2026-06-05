import type { QueryFilter as FilterQuery } from 'mongoose';

import type { Component } from '@/models/Component.js';

export function resolveStep(
  action: 'overview' | 'component' | 'courses',
  turno?: string,
  courseId?: number
) {
  switch (action) {
    case 'overview':
      return getOverviewSteps();
    case 'component':
      return getDisciplineSteps();
    case 'courses':
      return getCourseSteps(turno, courseId);
    default:
      return [];
  }
}

function getOverviewSteps() {
  return [
    {
      $group: {
        _id: null,
        vagas: { $sum: '$vagas' },
        requisicoes: { $sum: '$requisicoes' },
        deficit: { $sum: '$deficit' },
      },
    },
  ];
}

function getDisciplineSteps() {
  return [
    {
      $group: {
        _id: '$codigo',
        disciplina: { $first: '$disciplina' },
        vagas: { $sum: '$vagas' },
        requisicoes: { $sum: '$requisicoes' },
      },
    },
    {
      $project: {
        disciplina: 1,
        vagas: 1,
        requisicoes: 1,
        codigo: 1,
        deficit: { $subtract: ['$requisicoes', '$vagas'] },
        ratio: { $divide: ['$requisicoes', '$vagas'] },
      },
    },
  ];
}

function getCourseSteps(turno?: string, courseId?: number) {
  const match: FilterQuery<Component> = {};

  if (turno) {
    match.turno = turno;
  }

  if (courseId) {
    match.obrigatorias = courseId;
  }

  return [
    { $unwind: '$obrigatorias' },
    { $match: match },
    {
      $group: {
        _id: '$obrigatorias',
        obrigatorias: { $first: '$obrigatorias' },
        disciplina: { $first: '$disciplina' },
        vagas: { $sum: '$vagas' },
        requisicoes: { $sum: '$requisicoes' },
      },
    },
    {
      $project: {
        vagas: 1,
        requisicoes: 1,
        deficit: { $subtract: ['$requisicoes', '$vagas'] },
        ratio: { $divide: ['$requisicoes', '$vagas'] },
      },
    },
  ];
}
