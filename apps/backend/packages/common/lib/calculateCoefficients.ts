export type HistoryComponent = {
  periodo: '1' | '2' | '3';
  codigo: string;
  disciplina: string;
  ano: number;
  creditos: number;
  categoria: 'Livre Escolha' | 'Opção Limitada' | 'Obrigatória' | '-' | null;
  identifier?: string | null;
  situacao: string;
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
    year?: number | null;
    quad?: number | null;
    choosableCredits?: number | null;
  }[];
  credits_total?: number;
};

export function calculateCoefficients<TComponent extends HistoryComponent>(
  components: TComponent[],
  graduation: Graduation | null,
) {
  const componentsHash = {} as Record<any, any>;

  for (const component of components) {
    componentsHash[component.ano] = componentsHash[component.ano] ?? {};
    componentsHash[component.ano][component.periodo] =
      componentsHash[component.ano][component.periodo] ?? [];
    componentsHash[component.ano][component.periodo].push(component);
  }

  const unique: Record<any, any> = {};
  const uniqueComponent: Record<any, any> = {};
  let accumulated_credits = 0;
  let accumulated_conceitos = 0;
  let accumulated_unique = 0;

  let accumulated_credits_free = 0;
  let accumulated_credits_limited = 0;
  let accumulated_credits_mandatory = 0;

  for (const year in componentsHash) {
    for (const quad in componentsHash[year]) {
      let period_credits = 0;
      let conceitos_quad = 0;
      let period_unique = 0;
      let period_aprovados = 0;

      let credits_free = 0;
      let credits_mandatory = 0;
      let credits_limited = 0;

      for (const component in componentsHash[year][quad]) {
        const currComponent: HistoryComponent = componentsHash[year][quad][component];
        const creditos = Number.parseInt(currComponent.creditos.toString(), 10);
        const convertable = convertLetterToNumber(currComponent.conceito) * creditos;

        const category = parseCategory(currComponent.categoria);

        if (category && isAprovado(currComponent.conceito)) {
          if (category === 'free') {
            credits_free += creditos;
          }
          if (category === 'mandatory') {
            credits_mandatory += creditos;
          }
          if (category === 'limited') {
            credits_limited += creditos;
          }
        }

        if (Number.isNaN(convertable) || convertable < 0) {
          continue;
        }

        conceitos_quad += convertable;
        period_credits += creditos;

        if (isAprovado(currComponent.conceito)) {
          period_aprovados += creditos;
        }

        const name = currComponent.disciplina;
        const UFComponentCode = componentsHash[year][quad][component].codigo;
        if (!(name in uniqueComponent)) {
          unique[UFComponentCode] = true;
          uniqueComponent[name] = true;
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
        accumulated_unique === 0 ? 0 : accumulated_conceitos / accumulated_unique;
      const cr_quad = period_credits === 0 ? 0 : conceitos_quad / period_credits;
      const cr_acumulado =
        accumulated_credits === 0 ? 0 : accumulated_conceitos / accumulated_credits;
      const percentage_approved = period_credits === 0 ? 0 : period_aprovados / period_credits;

      let cp_acumulado = 0;

      if (graduation && hasValidGraduationCredits(graduation)) {
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
          excessLimitedCredits = accumulated_credits_limited - totalLimitedCredits;
        }
        const totalFreeCredits = Math.min(
          accumulated_credits_free + excessLimitedCredits,
          graduation.free_credits_number,
        );

        const creditsTotal =
          graduation.credits_total ||
          graduation.free_credits_number +
            graduation.limited_credits_number +
            graduation.mandatory_credits_number;

        const totalCredits =
          Math.max(totalFreeCredits, 0) +
          Math.max(totalLimitedCredits, 0) +
          Math.max(totalMandatoryCredits, 0);
        cp_acumulado = (totalCredits * 1) / creditsTotal;
      }

      componentsHash[year][quad] = {
        ca_quad,
        ca_acumulado,
        cr_quad,
        cr_acumulado,
        cp_acumulado: cp_acumulado ? roundTo(cp_acumulado, 3) : cp_acumulado,
        percentage_approved,
        accumulated_credits,
        period_credits,
      };
    }
  }

  return componentsHash;
}

function convertLetterToNumber(letter: HistoryComponent['conceito']) {
  const gradeMap = {
    A: 4,
    B: 3,
    C: 2,
    D: 1,
    F: 0,
    O: 0,
    '-': -1,
    E: -1,
    I: -1,
  };

  return gradeMap[letter] ?? undefined;
}

function parseCategory(category: HistoryComponent['categoria'] | null) {
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

const isAprovado = (letter: HistoryComponent['conceito']) => !['F', '0', 'O', 'I'].includes(letter);

// one-dumb-liner
const isNumber = (a: string) => typeof a === 'number';

const hasValidGraduationCredits = (graduation: any): boolean =>
  graduation &&
  [
    'credits_total',
    'limited_credits_number',
    'free_credits_number',
    'mandatory_credits_number',
  ].every((field: any) => isNumber(graduation[field]));

// https://stackoverflow.com/questions/33429136/round-to-3-decimal-points-in-javascript-jquery
function roundTo(n: number, decimalPlaces: number) {
  // @ts-expect-error ignore
  return +(+`${Math.round(`${n}e+${decimalPlaces}`)}e-${decimalPlaces}`).toFixed(decimalPlaces);
}
