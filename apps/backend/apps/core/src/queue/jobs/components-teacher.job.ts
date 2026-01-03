import { ComponentModel, type Component } from '@/models/Component.js';
import type { QueueContext } from '../types.js';
import { SubjectModel } from '@/models/Subject.js';

// Add flag and ignoreErrors to JobData
type JobData = Omit<Component, 'createdAt' | 'updatedAt'> & {
  flag?: string;
  ignoreErrors?: boolean;
};

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

    // If flag is 'upsert', perform upsert regardless of existence
    if (component.flag === 'upsert') {
      try {
        await ComponentModel.findOneAndUpdate(
          { season: component.season, uf_cod_turma: component.uf_cod_turma },
          { $set: { ...component } },
          { upsert: true, new: true }
        );
        ctx.app.log.info({
          msg: 'Component upserted (flag: upsert)',
          action: 'upserted',
          uf_cod_turma: component.uf_cod_turma,
        });
        return;
      } catch (error) {
        if (component.ignoreErrors) {
          ctx.app.log.warn({
            msg: 'Upsert failed but ignored due to ignoreErrors',
            error: error instanceof Error ? error.message : String(error),
            component,
          });
          return;
        }
        throw error;
      }
    }

    const result = await ComponentModel.findOneAndUpdate(
      {
        season: component.season,
        uf_cod_turma: component.uf_cod_turma,
      },
      {
        $set: {
          teoria: component.teoria,
          pratica: component.pratica,
        },
      },
      { new: true }
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
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .trim();

      // Normalize the subject code (strip year, uppercase, etc.)
      const codeMatch = component.codigo.match(/^(.*?)-\d{2}$/);
      const normalizedCode = codeMatch ? codeMatch[1] : component.codigo;

      const subject = await SubjectModel.findOne({
        uf_subject_code: { $in: [normalizedCode] },
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
