import { SubjectModel } from '@/models/Subject.js';
import { ufProcessor } from '@/services/ufprocessor.js';
import { logger } from '@next/common';

export async function syncSubjects(data: {
  operation: 'syncCredits';
}) {
  logger.info(data, 'Start...');
  const subjectsWithoutCredits = await SubjectModel.find({
    credits: {
      $exists: false,
    },
  });

  const components = await ufProcessor.getComponents();
  const toConsume = components.map((component) => ({
    name: component.name,
    credits: component.credits,
  }));

  const merged = subjectsWithoutCredits.flatMap((subject) => {
    const toAddCredits = toConsume.filter(
      (c) => c.name === subject.name.toLocaleLowerCase(),
    );
    const unregistered = [];
    if (!toAddCredits) {
      unregistered.push(toAddCredits);
      logger.warn(toAddCredits, 'unregistered');
      return;
    }

    return toAddCredits;
  });

  logger.warn(merged);

  logger.info(data, 'finish...');
  return merged;
}
