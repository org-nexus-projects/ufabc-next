/**
 * One-off backfill for disciplinas stuck with both teoria and pratica null.
 *
 * These records predate the alias-aware teacher matching fix (or were
 * created before ufabc-parser ever sent a follow-up component.updated
 * webhook), so they never got re-resolved. This re-runs the same
 * findTeacher() resolution against the current ufabc-parser data without
 * waiting for a new webhook.
 *
 * Usage:
 *   tsx --env-file=.env src/scripts/backfill-missing-teachers.ts --season=2026:3
 *   tsx --env-file=.env src/scripts/backfill-missing-teachers.ts --season=2026:3 --apply
 *
 * Dry-run by default: prints what would change. Pass --apply to write.
 */
import { randomUUID } from 'node:crypto';

import { currentQuad } from '@next/utils';
import mongoose from 'mongoose';

import {
  UfabcParserConnector,
  type UfabcParserComponent,
} from '@/connectors/ufabc-parser.js';
import { ComponentModel } from '@/models/Component.js';
import { findTeacher } from '@/models/Teacher.js';
import { logger } from '@/utils/logger.js';

const scriptLogger = logger.child({ component: 'BackfillMissingTeachers' });

function parseArgs() {
  const args = process.argv.slice(2);
  let season = currentQuad();
  let shouldApply = false;

  for (const arg of args) {
    if (arg === '--apply') {
      shouldApply = true;
      continue;
    }
    if (arg.startsWith('--season=')) {
      season = arg.split('=')[1] as ReturnType<typeof currentQuad>;
    }
  }

  return { season, shouldApply };
}

function findTeacherNameByRole(
  teachers: UfabcParserComponent['teachers'],
  role: 'professor' | 'practice'
): string | null {
  for (const teacher of teachers) {
    if (teacher.role === role) {
      return teacher.name;
    }
  }
  return null;
}

async function main() {
  const { season, shouldApply } = parseArgs();

  scriptLogger.info({ season, shouldApply }, 'Starting backfill');

  await mongoose.connect(process.env.MONGODB_CONNECTION_URL!);

  const connector = new UfabcParserConnector(randomUUID());
  const parserComponents = await connector.getComponents();

  const parserComponentByClassroomCode = new Map<string, UfabcParserComponent>();
  for (const parserComponent of parserComponents) {
    if (parserComponent.season === season) {
      parserComponentByClassroomCode.set(
        parserComponent.ufClassroomCode,
        parserComponent
      );
    }
  }

  const stuckComponents = await ComponentModel.find({
    season,
    teoria: null,
    pratica: null,
  });

  scriptLogger.info(
    { count: stuckComponents.length },
    'Disciplinas missing both teoria and pratica'
  );

  let resolvedCount = 0;
  let genuinelyMissingInSourceCount = 0;
  let sourceHasTeacherButUnmatchedCount = 0;
  let notFoundInSourceCount = 0;

  for (const component of stuckComponents) {
    const parserComponent = parserComponentByClassroomCode.get(
      component.uf_cod_turma
    );

    if (!parserComponent) {
      notFoundInSourceCount++;
      scriptLogger.warn(
        { uf_cod_turma: component.uf_cod_turma },
        'No matching component in ufabc-parser'
      );
      continue;
    }

    const teoriaName = findTeacherNameByRole(
      parserComponent.teachers,
      'professor'
    );
    const praticaName = findTeacherNameByRole(
      parserComponent.teachers,
      'practice'
    );

    if (!teoriaName && !praticaName) {
      genuinelyMissingInSourceCount++;
      continue;
    }

    const teoriaTeacherId = await findTeacher(teoriaName);
    const praticaTeacherId = await findTeacher(praticaName);

    if (!teoriaTeacherId && !praticaTeacherId) {
      sourceHasTeacherButUnmatchedCount++;
      scriptLogger.warn(
        {
          uf_cod_turma: component.uf_cod_turma,
          teoriaName,
          praticaName,
        },
        'ufabc-parser has a teacher we could not match to an existing teacher record'
      );
      continue;
    }

    resolvedCount++;

    const patch: Record<string, unknown> = {
      origin_key: parserComponent.componentKey,
    };
    if (teoriaTeacherId) patch.teoria = teoriaTeacherId;
    if (praticaTeacherId) patch.pratica = praticaTeacherId;

    scriptLogger.info(
      {
        uf_cod_turma: component.uf_cod_turma,
        disciplina: component.disciplina,
        teoriaName,
        praticaName,
        willApply: shouldApply,
      },
      'Resolved teacher(s) for stuck component'
    );

    if (shouldApply) {
      await ComponentModel.updateOne(
        { _id: component._id },
        { $set: patch }
      );
    }
  }

  scriptLogger.info(
    {
      total: stuckComponents.length,
      resolved: resolvedCount,
      genuinelyMissingInSource: genuinelyMissingInSourceCount,
      sourceHasTeacherButUnmatched: sourceHasTeacherButUnmatchedCount,
      notFoundInSource: notFoundInSourceCount,
      applied: shouldApply,
    },
    'Backfill finished'
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  scriptLogger.error({ error }, 'Backfill failed');
  process.exitCode = 1;
});
