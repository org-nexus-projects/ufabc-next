export type HistoryDiscipline = {
  periodo: '1' | '2' | '3';
  codigo: string;
  disciplina: string;
  ano: number;
  creditos: number;
  categoria: '-' | 'Opção Limitada' | 'Obrigatória';
  identifier?: string;
  situacao:
    | 'Repr.Freq'
    | 'Aprovado'
    | 'Reprovado'
    | 'Trt. Total'
    | 'Apr.S.Nota'
    | 'Aproveitamento';
  conceito: 'A' | 'B' | 'C' | 'D' | 'O' | 'F' | '-';
};

type Graduation = {
  locked: boolean;
  curso: string;
  grade: string;
  mandatory_credits_number: number;
  limited_credits_number: number;
  free_credits_number: number;
  creditsBreakdown: {
    year: number | undefined;
    quad: number | undefined;
    choosableCredits: number | undefined;
  }[];
  credits_total: number | undefined;
};

export function calculateCoefficients<
  TDisciplinas extends Array<HistoryDiscipline>,
>(disciplinas: TDisciplinas, graduation: Graduation | null) {
  const disciplinesPerYearAndQuad: Map<
    number,
    Map<number, HistoryDiscipline[]>
  > = new Map();

  const disciplinesCoefficient: Map<
    number,
    Map<number, Record<string, unknown>>
  > = new Map();

  for (const disciplina of disciplinas) {
    const { ano, periodo } = disciplina;

    if (!disciplinesPerYearAndQuad.has(ano)) {
      disciplinesPerYearAndQuad.set(ano, new Map());
    }

    if (!disciplinesCoefficient.has(ano)) {
      disciplinesCoefficient.set(ano, new Map());
    }

    if (!disciplinesPerYearAndQuad.get(ano)?.has(Number.parseInt(periodo))) {
      disciplinesPerYearAndQuad.get(ano)?.set(Number.parseInt(periodo), []);
    }

    if (!disciplinesCoefficient.get(ano)?.has(Number.parseInt(periodo))) {
      disciplinesCoefficient.get(ano)?.set(Number.parseInt(periodo), {});
    }

    disciplinesPerYearAndQuad
      .get(ano)
      ?.get(Number.parseInt(periodo))
      ?.push(disciplina);
  }

  const unique: Record<string, boolean> = {};
  const uniqueDisc: Record<string, boolean> = {};
  let accumulated_credits = 0;
  let accumulated_conceitos = 0;
  let accumulated_unique = 0;
  let accumulated_credits_free = 0;
  let accumulated_credits_limited = 0;
  let accumulated_credits_mandatory = 0;

  disciplinesPerYearAndQuad.forEach((quadMap, ano) => {
    quadMap.forEach((disciplinasArray, periodo) => {
      let period_credits = 0;
      let conceitos_quad = 0;
      let period_unique = 0;
      let period_aprovados = 0;
      let credits_free = 0;
      let credits_mandatory = 0;
      let credits_limited = 0;

      for (const disciplina of disciplinasArray) {
        const {
          creditos,
          conceito,
          categoria,
          codigo,
          disciplina: nomeDisc,
        } = disciplina;

        const convertable = convertLetterToNumber(conceito) * creditos;
        const category = parseCategory(categoria);

        if (category && isAprovado(conceito)) {
          if (category === 'free') credits_free += creditos;
          if (category === 'mandatory') credits_mandatory += creditos;
          if (category === 'limited') credits_limited += creditos;
        }

        if (convertable < 0) {
          continue;
        }

        conceitos_quad += convertable;
        period_credits += creditos;

        if (isAprovado(conceito)) {
          period_aprovados += creditos;
        }
        if (!(nomeDisc in uniqueDisc)) {
          unique[codigo] = true;
          uniqueDisc[nomeDisc] = true;
          accumulated_unique += creditos;
          period_unique += creditos;
        }
      }

      accumulated_credits += period_credits;
      accumulated_conceitos += conceitos_quad;
      accumulated_credits_free += credits_free;
      accumulated_credits_limited += credits_limited;
      accumulated_credits_mandatory += credits_mandatory;

      const ca_quad = period_unique === 0 ? 0 : conceitos_quad / period_unique;
      const ca_acumulado =
        accumulated_unique === 0
          ? 0
          : accumulated_conceitos / accumulated_unique;
      const cr_quad =
        period_credits === 0 ? 0 : conceitos_quad / period_credits;
      const cr_acumulado =
        accumulated_credits === 0
          ? 0
          : accumulated_conceitos / accumulated_credits;
      const percentage_approved =
        period_credits === 0 ? 0 : period_aprovados / period_credits;

      let cp_acumulado = 0;

      if (graduation !== null && graduation !== undefined) {
        const totalLimitedCredits = Math.min(
          accumulated_credits_limited,
          graduation.limited_credits_number,
        );
        const totalMandatoryCredits = Math.min(
          accumulated_credits_mandatory,
          graduation.mandatory_credits_number,
        );

        // excess limited credits are added to free credits
        let excessLimitedCredits = 0;

        if (accumulated_credits_limited > graduation.limited_credits_number) {
          excessLimitedCredits =
            accumulated_credits_limited - totalLimitedCredits;
        }

        const totalFreeCredits = Math.min(
          accumulated_credits_free + excessLimitedCredits,
          graduation.free_credits_number,
        );
        const totalCredits =
          Math.max(totalFreeCredits, 0) +
          Math.max(totalLimitedCredits, 0) +
          Math.max(totalMandatoryCredits, 0);

        cp_acumulado = (totalCredits * 1) / graduation.credits_total!;
      }

      const result = {
        ca_quad,
        ca_acumulado,
        cr_quad,
        cr_acumulado,
        cp_acumulado: cp_acumulado
          ? Math.round(cp_acumulado * 1000) / 1000
          : cp_acumulado,
        percentage_approved,
        accumulated_credits,
        period_credits,
      };

      disciplinesCoefficient.get(ano)?.set(periodo, result);
    });
  });

  return mapToObject(disciplinesCoefficient);
}

function isAprovado(letter: string) {
  return !['F', '0', 'O', 'I'].includes(letter);
}

function convertLetterToNumber(letter: string) {
  switch (letter) {
    case 'A':
      return 4;
    case 'B':
      return 3;
    case 'C':
      return 2;
    case 'D':
      return 1;
    case 'F':
    case 'O':
      return 0;
    case '-':
    case 'E':
    case 'I':
      return -1;
    default:
      return 1; // Default value when the input is not recognized
  }
}

function parseCategory(category: string) {
  switch (category) {
    case 'Livre Escolha':
      return 'free';
    case 'Obrigatória':
      return 'mandatory';
    case 'Opção Limitada':
      return 'limited';
    default:
      return null; // Default value when the input is not recognized
  }
}

function mapToObject(map: Map<unknown, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Array.from(map.entries(), ([k, v]) =>
      v instanceof Map ? [k, mapToObject(v)] : [k, v],
    ),
  );
}
