import { ComponentModel, type Component } from '@/models/Component.js';
import type { QueueContext } from '../types.js';
import { SubjectModel } from '@/models/Subject.js';

type JobData = Omit<Component, 'createdAt' | 'updatedAt'>;

export async function processComponentsTeachers(ctx: QueueContext<JobData>) {
  const { data: component } = ctx.job;

  try {
    if (!component || !component.codigo || !component.uf_cod_turma) {
      ctx.app.log.warn({
        msg: 'Invalid component data',
        component,
      });
      throw new Error('Invalid component data');
    }

    const result = await ComponentModel.findOneAndUpdate(
      {
        uf_cod_turma: component.uf_cod_turma,
      },
      {
        $set: {
          teoria: component.teoria,
          pratica: component.pratica,
        },
      },
      { new: true },
    );

    if (!result) {
      ctx.app.log.warn({
        msg: 'Component not found, inserting new one',
        component,
      });

      // Normalize the disciplina name for search
      const normalizedDisciplina = component.disciplina
        .toLowerCase()
        .normalize('NFD')
        // biome-ignore lint/suspicious/noMisleadingCharacterClass: not needed
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim();

      const subject = await SubjectModel.findOne({
        $or: [
          // Exact match on normalized name
          { search: normalizedDisciplina },
          // Partial match on normalized name
          { search: { $regex: normalizedDisciplina, $options: 'i' } },
          // Match individual words
          {
            search: {
              $regex: normalizedDisciplina
                .split(/\s+/)
                .map((word) => `(?=.*${word})`)
                .join(''),
              $options: 'i',
            },
          },
          // Original name matching
          { name: { $regex: component.disciplina, $options: 'i' } },
        ],
      });

      if (!subject) {
        ctx.app.log.warn({
          msg: 'Subject not found for component',
          component,
        });
        throw new Error('Subject not found for component');
      }
      ctx.app.log.info({
        msg: 'Subject found for component',
        subjectId: subject._id,
        subjectName: subject.name,
        searchWith: normalizedDisciplina,
      });
      component.subject = subject._id;

      await ComponentModel.create(component);
    }

    // Log the action
    ctx.app.log.info({
      msg: 'Component processed',
      disciplina: component.disciplina,
      UFCode: component.codigo,
      class: component.turma,
      practice: component.pratica,
      teory: component.teoria,
      action: result?.isNew ? 'inserted' : 'updated',
    });
  } catch (error) {
    ctx.app.log.error({
      msg: 'Error processing component',
      error: error instanceof Error ? error.message : String(error),
      component,
    });
    throw error;
  }
}
