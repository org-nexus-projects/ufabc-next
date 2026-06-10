<template>
  <v-container fluid>
    <v-row class="mb-2" align="center" justify="space-between">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold text-primary">Agenda da Equipe</h1>
        <p class="text-subtitle-1 text-grey-darken-1">Acesso exclusivo Team Next</p>
      </v-col>
      <v-col cols="12" md="6" class="d-flex justify-md-end">
        <v-btn
          prepend-icon="mdi-export"
          color="primary"
          variant="outlined"
          :disabled="teamSchedules.length === 0"
          @click="exportCalendar"
        >
          Exportar Calendário (.ics)
        </v-btn>
      </v-col>
    </v-row>

    <v-alert
      type="info"
      variant="tonal"
      class="mb-6"
    >
      Visualizando a grade compartilhada da equipe. Você pode adicionar membros reais consultando pelo RA.
    </v-alert>

    <v-row class="mb-4" align="center">
      <v-col cols="12" md="6" class="d-flex gap-2">
        <v-text-field
          v-model="newRa"
          label="Adicionar RA"
          placeholder="Ex: 11201900000"
          variant="outlined"
          density="compact"
          hide-details
          style="max-width: 180px"
          @keyup.enter="addStudentByRA"
        ></v-text-field>
        <v-text-field
          v-model="newName"
          label="Nome/Apelido (Opcional)"
          placeholder="Ex: João"
          variant="outlined"
          density="compact"
          hide-details
          @keyup.enter="addStudentByRA"
        ></v-text-field>
        <v-btn
          color="primary"
          @click="addStudentByRA"
          :loading="isAddingRa"
          :disabled="!newRa || isLoading"
          height="40"
        >
          Adicionar
        </v-btn>
      </v-col>
      <v-col cols="12" md="6">
        <div class="d-flex flex-wrap gap-2">
          <v-chip
            v-for="student in teamSchedules"
            :key="student.ra"
            closable
            color="primary"
            variant="tonal"
            @click:close="removeStudent(student.ra)"
          >
            {{ student.name }} ({{ student.ra }})
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <!-- Grid View Component -->
    <TeamScheduleGrid v-if="!isLoading" :schedules="teamSchedules" />
    <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>

    <!-- Best Meeting Times Recommendations -->
    <v-row v-if="!isLoading && bestMeetingTimes.length > 0" class="mt-8 mb-4">
      <v-col cols="12">
        <h3 class="text-h6 font-weight-bold d-flex align-center gap-2 mb-4">
          <v-icon color="success">mdi-calendar-star</v-icon>
          Melhores Horários para Reuniões (2h)
        </h3>
        <p class="text-body-2 text-grey-darken-1 mb-4">
          Baseado nas janelas em comum onde nenhum membro possui aula.
        </p>
      </v-col>
      
      <v-col v-for="(suggestion, i) in bestMeetingTimes" :key="i" cols="12" sm="4">
        <v-card class="rounded-xl border shadow-sm h-100" elevation="0">
          <v-card-text class="d-flex align-center pa-4">
            <v-avatar :color="suggestion.color" size="48" class="text-white mr-4 flex-shrink-0">
              <v-icon>{{ suggestion.icon }}</v-icon>
            </v-avatar>
            <div>
              <div class="text-subtitle-2 font-weight-bold text-uppercase text-grey-darken-1 mb-1" style="font-size: 11px; letter-spacing: 1px">
                {{ suggestion.shiftName }}
              </div>
              <div class="text-body-1 font-weight-bold text-grey-darken-3 mb-1">
                {{ suggestion.dayLabel }}
              </div>
              <div class="text-caption text-grey-darken-2 d-flex align-center gap-1">
                <v-icon size="small">mdi-clock-outline</v-icon>
                {{ suggestion.timeLabel }}
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="bestMeetingTimes.length === 0" cols="12">
        <v-alert type="warning" variant="tonal">
          Não foi encontrada nenhuma janela de 2 horas comum entre todos os membros para agendar reuniões.
        </v-alert>
      </v-col>
    </v-row>
    
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { parseSchedule, parseTimetableArray } from '@/utils/scheduleParser';
import { exportTeamScheduleToICS } from '@/utils/teamIcalExporter';
import TeamScheduleGrid from './components/TeamScheduleGrid.vue';
import type { StudentSchedule } from './components/TeamScheduleGrid.vue';

const teamSchedules = ref<StudentSchedule[]>([]);
const isLoading = ref(true);

const ufComponents = ref<any[]>([]);
const newRa = ref('');
const newName = ref('');
const isAddingRa = ref(false);

const teamMembers = [
 
  {
    "nome": "Igor Santos",
    "ra": null
  },
 
]
function buildUfClassroomCode(item: any) {
  const turnoStr = item.turno === 'diurno' ? 'D' : 'N';
  const campusStr = item.campus === 'sbc' ? 'SB' : 'SA';
  return `${turnoStr}${item.turma}${item.codigo}${campusStr}`;
}

function mapStudentEnrollments(student: any, components: any[]) {
  return {
    ra: student.ra,
    name: student.name,
    items: student.items.map((item: any) => {
      const ufCode = buildUfClassroomCode(item);
      const turnoEn = item.turno === 'diurno' ? 'morning' : 'night';
      const comp = components.find((c: any) => c.ufClassroomCode === ufCode || (c.ufComponentCode === item.codigo && c.componentClass === item.turma && c.shift === turnoEn && c.campus === item.campus));

      if (comp) {
        const teorias = comp.timetable.filter((t: any) => t.scheduleType === 'theory').map((t: any) => t.unparsed).join(' ; ');
        const praticas = comp.timetable.filter((t: any) => t.scheduleType === 'practice').map((t: any) => t.unparsed).join(' ; ');
        
        const validSalas = comp.timetable.map((t: any) => t.classroomCode).filter(Boolean);
        const salaStr = validSalas.length > 0 ? validSalas.join(' / ') : '';

        const bccCourse = comp.courses?.find((c: any) => c.name?.toLowerCase().includes('computação') || c.UFCourseId === 265);
        const category = bccCourse ? bccCourse.category : (comp.courses?.[0]?.category || 'free');

        return {
          ...item,
          uf_cod_turma: comp.ufClassroomCode,
          sala: salaStr,
          professor: item.teoria !== 'N/A' ? item.teoria : comp.teachers[0]?.name || '',
          teoria: teorias || null,
          pratica: praticas || null,
          timetable: comp.timetable,
          category
        };
      }
      
      return {
        ...item,
        professor: item.teoria !== 'N/A' ? item.teoria : '',
        teoria: null,
        pratica: null
      };
    })
  };
}

onMounted(async () => {
  try {
    const res = await fetch('https://ufabc-parser.com/v2/components?season=2026:2');
    ufComponents.value = await res.json();

    const validMembers = teamMembers.filter(m => m.ra);
    const results = await Promise.allSettled(
      validMembers.map(async (member) => {
        const r = await fetch(`https://api.v2.ufabcnext.com/entities/enrollments/wpp?ra=${member.ra}&season=2026:2`);
        if (!r.ok) throw new Error(`Falha ao buscar RA ${member.ra}`);
        const items = await r.json();
        if (!items || items.length === 0) return null;
        return mapStudentEnrollments({ ra: member.ra, name: member.nome, items }, ufComponents.value);
      })
    );

    teamSchedules.value = results
      .filter((r): r is PromiseFulfilledResult<StudentSchedule> => r.status === 'fulfilled' && r.value !== null)
      .map(r => r.value);
  } catch (error) {
    console.error("Erro ao carregar componentes: ", error);
  } finally {
    isLoading.value = false;
  }
});

async function addStudentByRA() {
  const ra = newRa.value.trim();
  if (!ra || isAddingRa.value) return;

  // Evita duplicatas
  if (teamSchedules.value.some(s => s.ra === ra)) {
    newRa.value = '';
    return;
  }

  isAddingRa.value = true;
  try {
    const res = await fetch(`https://api.v2.ufabcnext.com/entities/enrollments/wpp?ra=${ra}&season=2026:2`);
    if (!res.ok) throw new Error('Falha ao buscar RA');
    
    const items = await res.json();
    if (!items || items.length === 0) {
      alert(`Nenhuma disciplina encontrada para o RA ${ra} na season 2026:2`);
      return;
    }

    const studentObj = {
      ra,
      name: newName.value.trim() || `Aluno`,
      items
    };

    const parsedStudent = mapStudentEnrollments(studentObj, ufComponents.value);
    teamSchedules.value.push(parsedStudent);
    newRa.value = '';
    newName.value = '';
  } catch (error) {
    console.error("Erro ao adicionar aluno: ", error);
    alert('Erro ao buscar as informações do aluno. Tente novamente.');
  } finally {
    isAddingRa.value = false;
  }
}

function removeStudent(raToRemove: string) {
  teamSchedules.value = teamSchedules.value.filter(s => s.ra !== raToRemove);
}

function exportCalendar() {
  try {
    // 2/2026 is the default for season "2026:2"
    exportTeamScheduleToICS(teamSchedules.value, '2/2026');
  } catch (error) {
    console.error(error);
    alert('Erro ao exportar o calendário.');
  }
}

const ALL_WEEK_DAYS = [
  { id: 'seg', label: 'Segunda-feira' },
  { id: 'ter', label: 'Terça-feira' },
  { id: 'qua', label: 'Quarta-feira' },
  { id: 'qui', label: 'Quinta-feira' },
  { id: 'sex', label: 'Sexta-feira' },
  { id: 'sab', label: 'Sábado' },
];

const bestMeetingTimes = computed(() => {
  if (teamSchedules.value.length === 0) return [];

  const busyMatrix: Record<string, Record<number, boolean>> = {};
  ALL_WEEK_DAYS.forEach(d => {
    busyMatrix[d.id] = {};
    for (let h = 8; h <= 22; h++) busyMatrix[d.id][h] = false;
  });

  teamSchedules.value.forEach(student => {
    student.items.forEach((item: any) => {
      let slots: any[] = [];
      if (item.timetable) {
        slots.push(...parseTimetableArray(item.timetable, 'theory'));
        slots.push(...parseTimetableArray(item.timetable, 'practice'));
      } else {
        slots.push(...parseSchedule(item.teoria));
        slots.push(...parseSchedule(item.pratica));
      }
      slots.forEach((s: any) => {
        if (busyMatrix[s.day]) {
          busyMatrix[s.day][s.time] = true;
        }
      });
    });
  });

  const shifts = [
    { name: 'Manhã', icon: 'mdi-white-balance-sunny', color: 'amber-darken-1', blocks: [[8, 9], [10, 11]] },
    { name: 'Tarde', icon: 'mdi-weather-sunset', color: 'orange-darken-2', blocks: [[14, 15], [16, 17]] },
    { name: 'Noite', icon: 'mdi-weather-night', color: 'indigo-lighten-1', blocks: [[19, 20], [21, 22]] }
  ];

  const suggestions: any[] = [];

  shifts.forEach(shift => {
    let found = null;
    for (const day of ALL_WEEK_DAYS) {
      for (const block of shift.blocks) {
        const [h1, h2] = block;
        if (!busyMatrix[day.id][h1] && !busyMatrix[day.id][h2]) {
          found = {
            shiftName: shift.name,
            icon: shift.icon,
            color: shift.color,
            dayLabel: day.label,
            timeLabel: `${String(h1).padStart(2, '0')}:00 às ${String(h2 + 1).padStart(2, '0')}:00`
          };
          break; // pick the first available block for this shift
        }
      }
      if (found) break; // found a block for this shift, move to next shift
    }
    if (found) suggestions.push(found);
  });

  return suggestions;
});
</script>

<style scoped>
</style>
