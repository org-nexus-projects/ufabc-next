import type { Types } from 'mongoose';

import type { Component } from '@/models/Component.js';

type LeanComponent = Component & { _id: Types.ObjectId };

export class ComponentMapper {
  toResponse(component: LeanComponent, metadata: unknown) {
    return {
      _id: component._id.toString(),
      campus: component.campus,
      codigo: component.codigo ?? null,
      disciplina: component.disciplina,
      disciplina_id: component.disciplina_id ?? null,
      identifier: component.identifier ?? null,
      metadata: metadata ?? null,
      origin_key: component.origin_key ?? null,
      season: component.season,
      turma: component.turma,
      turno: component.turno,
      uf_cod_turma: component.uf_cod_turma,
      vagas: component.vagas,
    };
  }
}
