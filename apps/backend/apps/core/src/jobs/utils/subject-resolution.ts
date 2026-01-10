import { camelCase, startCase } from 'lodash-es';

import { SubjectModel, type SubjectDocument } from '@/models/Subject.js';

export async function findOrCreateSubject(
  name: string,
  credits: number,
  subjectCode: string
): Promise<SubjectDocument> {
  // Strategy 1: Exact code match
  let subject = await SubjectModel.findOne({
    uf_subject_code: { $in: [subjectCode] },
  });

  if (subject) {
    return subject;
  }

  // Strategy 2: Name + credits match (case-insensitive)
  const normalizedName = name.toLowerCase().trim();
  subject = await SubjectModel.findOne({
    name: { $regex: `^${normalizedName}$`, $options: 'i' },
    creditos: credits,
  });

  if (subject) {
    // Add new code to existing subject if not already present
    if (!subject.uf_subject_code.includes(subjectCode)) {
      subject.uf_subject_code.push(subjectCode);
      await subject.save();
    }
    return subject;
  }

  // Strategy 3: Fuzzy name match (for subjects with slight name variations)
  subject = await SubjectModel.findOne({
    $text: { $search: name },
    creditos: credits,
  });

  if (subject) {
    // Add new code to existing subject if not already present
    if (!subject.uf_subject_code.includes(subjectCode)) {
      subject.uf_subject_code.push(subjectCode);
      await subject.save();
    }
    return subject;
  }

  // Strategy 4: Create new subject
  return await SubjectModel.create({
    name,
    creditos: credits,
    uf_subject_code: [subjectCode],
    search: startCase(camelCase(name)),
  });
}
