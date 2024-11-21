import type { Component } from '@/models/Component.js';
import type { StudentComponent } from '@/services/ufprocessor.js';
import { generateIdentifier } from '@next/common';
import type { Types } from 'mongoose';

export type HydratedComponent = {
  ra: number;
  nome: string;
  campus: Component['campus'];
  turno: Component['turno'];
  turma: string;
  disciplina: string;
  year: number;
  quad: 1 | 2 | 3;
  identifier: string;
  disciplina_identifier: string;
  teoria: Types.ObjectId | null | undefined;
  pratica: Types.ObjectId | null | undefined;
  subject: Types.ObjectId;
  season: string;
};

export function hydrateComponent(
  ra: string,
  components: StudentComponent[],
  nextComponents: Component[],
  year: number,
  quad: 1 | 2 | 3,
): HydratedComponent[] {
  const result = [] as HydratedComponent[];
  const errors = [];
  const nextComponentsMap = new Map<string, Component>();

  for (const nextComponent of nextComponents) {
    nextComponentsMap.set(
      nextComponent.disciplina.toLocaleLowerCase(),
      nextComponent,
    );
  }

  for (const component of components) {
    if (!component.name) {
      continue;
    }

    const nextComponent = nextComponentsMap.get(component.name);
    if (!nextComponent) {
      errors.push(nextComponent);
      continue;
    }

    const identifier = generateIdentifier({
      // @ts-expect-error
      ra,
      year,
      quad,
      disciplina: nextComponent.disciplina,
    });

    const disciplina_identifier = generateIdentifier({
      year,
      quad,
      disciplina: nextComponent.disciplina,
    });

    result.push({
      ra: Number(ra),
      nome: `${nextComponent.disciplina} ${nextComponent.turma}-${nextComponent.turno} (${nextComponent.campus})`,
      campus: nextComponent.campus,
      turno: nextComponent.turno,
      turma: nextComponent.turma,
      disciplina: nextComponent.disciplina.toLocaleLowerCase(),
      year,
      quad,
      identifier,
      disciplina_identifier,
      teoria: nextComponent.teoria,
      pratica: nextComponent.pratica,
      subject: nextComponent.subject,
      season: nextComponent.season,
    });
  }

  return result;
}
