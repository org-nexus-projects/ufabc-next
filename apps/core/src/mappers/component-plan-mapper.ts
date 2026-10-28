import type { ComponentPlan } from '@/models/ComponentPlan.js';

export class ComponentPlanMapper {
  toResponse(plan: ComponentPlan) {
    const schedule = [];
    for (const entry of plan.schedule) {
      schedule.push({ date: entry.date, lesson: entry.lesson });
    }

    const timetable = [];
    for (const slot of plan.timetable) {
      timetable.push(slot);
    }

    let planning = null;
    if (plan.planning) {
      planning = {
        assessment: plan.planning.assessment,
        methodology: plan.planning.methodology,
        objectives: plan.planning.objectives,
        syllabus: plan.planning.syllabus,
      };
    }

    return {
      planning,
      schedule,
      timetable,
    };
  }
}
