import { BaseRequester } from './base-requester.js';

type PlanContext = {
  planning?: {
    assessment: string;
    methodology: string;
    syllabus: string;
  } | null;
  schedule: Array<{ date: string; lesson: string }>;
  timetable: string[];
};

type NaturalResponseInput = {
  componentName: string;
  classroomCode: string;
  teacherName: string;
  plan: PlanContext;
  userMessage: string;
};

type Files = {
  url: string;
  name: string;
};

export class AIProxyConnector extends BaseRequester {
  constructor(
    baseUrl: string,
    private readonly serviceHeader: string
  ) {
    super(baseUrl);
  }

  async filterFiles(course: string, files: Files[]) {
    const headers = new Headers();
    headers.set('x-service-id', this.serviceHeader);
    const response = await this.request<unknown[]>('/', {
      body: {
        course,
        promptData: {
          course,
          promptData: files.map((file) => ({
            pdfLink: file.url,
            pdfName: file.name,
          })),
        },
      },
      method: 'POST',
    });
    return response;
  }

  async requestNaturalResponse({
    componentName,
    classroomCode,
    teacherName,
    plan,
    userMessage,
  }: NaturalResponseInput) {
    const headers = new Headers();

    headers.set('x-service-id', 'whatsapp');

    const nome_disciplina = componentName.toUpperCase();
    const codigo_turma = classroomCode;
    const professor = teacherName;

    let cronograma_str = '';
    for (const lesson of plan.schedule) {
      cronograma_str += `- ${lesson.date}: ${lesson.lesson}\n`;
    }

    let horarios_str = '';
    for (const slot of plan.timetable) {
      horarios_str += `- ${slot}\n`;
    }

    const ementa = plan.planning?.syllabus ?? 'Não informada.';
    const metodologia = plan.planning?.methodology ?? 'Não informada.';
    const avaliacao = plan.planning?.assessment ?? 'Não informada.';

    const basePrompt = `## Contexto:\nVocê é um assistente virtual especializado em responder dúvidas de alunos da Universidade Federal do ABC (UFABC).\nVocê está prestando suporte específico para a disciplina: **${nome_disciplina} (${codigo_turma})**.\nO professor responsável é: ${professor}.\n\nUse estritamente as informações oficiais do Plano de Ensino fornecidas abaixo para responder o aluno.\n\n## Informações Oficiais da Disciplina:\n\n### 1. Horários e Salas:\n${horarios_str}\n\n### 2. Ementa da Disciplina:\n${ementa}\n\n### 3. Metodologia de Ensino:\n${metodologia}\n\n### 4. Critério de Avaliação:\n${avaliacao}\n\n### 5. Cronograma de Aulas e Datas Importantes:\n${cronograma_str}\n\n## Sua tarefa:\n- Leia a mensagem recebida do aluno e identifique o que está sendo perguntado.\n- Responda de maneira assertiva, amigável e direta baseando-se estritamente nos dados acima.\n- Se a pergunta for sobre uma data específica (como uma prova ou feriado), consulte a seção de Cronograma.\n- Se a pergunta for sobre salas, horários ou formas de avaliação, consulte as seções respectivas.\n- Caso o aluno pergunte algo que NÃO está neste documento, informe educadamente que não possui essa informação e sugira que ele verifique no Moodle, SIGAA ou diretamente com o professor ${professor}.\n\n## Instruções de estilo:\n- Mantenha um tom acolhedor, jovem e prestativo (adequado para WhatsApp).\n- Use quebras de linha e emojis moderadamente para tornar a leitura escaneável no celular.\n- Responda sempre em Português.\n\n## Mensagem recebida do aluno:\n"${userMessage}"\n`;

    const response = await this.request<unknown[]>('/', {
      body: {
        promptData: basePrompt,
      },
      headers: headers,
      method: 'POST',
    });
    return response;
  }
}
