import nock from 'nock';

export const moodleMock = {
  setupArchiveFlow: (componentId: number, componentName: string) => {
    const scope = nock('https://moodle.ufabc.edu.br')
      .persist()
      .post('/lib/ajax/service.php')
      .query(true)
      .reply(200, [
        {
          data: {
            courses: [
              {
                id: componentId,
                fullname: componentName,
                viewurl: `https://moodle.ufabc.edu.br/course/${componentId}`,
              },
            ],
          },
        },
      ]);

    nock('https://moodle.ufabc.edu.br')
      .get(`/course/${componentId}`)
      .query(true)
      .reply(200, `<a href="https://moodle.com/file.pdf"><span>PDF</span></a>`);

    nock('https://moodle.com')
      .head('/file.pdf')
      .reply(200, '', { 'content-type': 'application/pdf' })
      .get('/file.pdf')
      .reply(200, Buffer.from('PDF_DATA'));

    return scope;
  },
  cleanup: () => nock.cleanAll(),
};
