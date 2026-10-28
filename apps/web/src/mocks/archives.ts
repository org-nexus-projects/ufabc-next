import type {
  ArchiveDownload,
  ArchivesPage,
  ComponentPlan,
} from '@next/services';

const structuredProgramming = {
  _id: 'component-1',
  code: 'MCTA028-15',
  group: 'A1',
  name: 'programação estruturada',
  season: '2026:3',
  shift: 'day',
} as const;

const linearAlgebra = {
  _id: 'component-2',
  code: 'MCTB001-17',
  group: 'A4',
  name: 'álgebra linear',
  season: '2026:3',
  shift: 'night',
} as const;

const networks = {
  _id: 'component-3',
  code: 'MCZA023-17',
  group: 'A1',
  name: 'redes convergentes',
  season: '2026:3',
  shift: 'day',
} as const;

export const archives = {
  data: [
    {
      _id: 'archive-1',
      component: structuredProgramming,
      fileName: 'Plano_de_ensino.pdf',
      source: 'moodle',
      status: 'stored',
    },
    {
      _id: 'archive-2',
      component: structuredProgramming,
      fileName: 'Cronograma.pdf',
      source: 'moodle',
      status: 'stored',
    },
    {
      _id: 'archive-3',
      component: structuredProgramming,
      fileName: 'Aula_3_Listas_encadeadas.pdf',
      source: 'moodle',
      status: 'stored',
    },
    {
      _id: 'archive-4',
      component: linearAlgebra,
      fileName: 'planoensino_AL_3Q26.pdf',
      source: 'moodle',
      status: 'stored',
    },
    {
      _id: 'archive-5',
      component: linearAlgebra,
      fileName: 'Aula_4_Espacos_vetoriais.pdf',
      source: 'moodle',
      status: 'created',
    },
    {
      _id: 'archive-6',
      component: networks,
      fileName: '20263_NA1MCZA023-17SB.pdf',
      source: 'cmcc',
      status: 'stored',
    },
    {
      _id: 'archive-7',
      component: null,
      fileName: null,
      source: 'moodle',
      status: 'failed',
    },
  ],
  limit: 20,
  page: 1,
  total: 7,
} satisfies ArchivesPage;

export const archiveDownload = {
  expiresInSeconds: 300,
  fileName: 'Plano_de_ensino.pdf',
  url: 'https://example.com/signed-url',
} satisfies ArchiveDownload;

export const componentPlan = {
  planning: {
    assessment:
      'Duas provas escritas e uma lista de exercícios.\n\n- A recuperação será feita por nova prova\n- A frequência mínima é de 75%',
    methodology: 'Aulas expositivas e atividades práticas em laboratório.',
    objectives:
      'Introduzir as estruturas de dados fundamentais.\n\nEstudar:\n- Listas encadeadas\n- Pilhas e filas',
    syllabus: 'Listas, pilhas, filas, árvores e grafos.',
  },
  schedule: [
    { date: '2026-10-06', lesson: 'Apresentação da disciplina' },
    { date: '2026-10-13', lesson: 'Listas encadeadas' },
    { date: '2026-10-20', lesson: 'Pilhas e filas' },
  ],
  timetable: ['segunda das 08:00 às 10:00, sala A-101, semanal'],
} satisfies ComponentPlan;
