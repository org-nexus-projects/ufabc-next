type PopulateIds = { TeacherModel: string[]; SubjectModel: string[] };

export function CommentModel(ids: PopulateIds) {
  return [
    {
      comment: 'Muito bom',
      teacher: ids.TeacherModel[0],
      type: 'teoria',
      enrollment: '000000000000000000000001',
      subject: ids.SubjectModel[0],
      ra: 11201822483,
    },

    {
      comment: 'Morte à geometria analitica e vetores',
      type: 'teoria',
      enrollment: '000000000000000000000002',
      subject: ids.SubjectModel[392],
      teacher: ids.SubjectModel[101],
      ra: 11201822479,
    },

    {
      comment: 'Só alegria',
      teacher: ids.TeacherModel[0],
      type: 'teoria',
      enrollment: '000000000000000000000007',
      subject: ids.SubjectModel[0],
      ra: 11201822481,
    },
  ];
}
