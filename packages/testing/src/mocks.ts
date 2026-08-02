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
                shortname: 'MCTA001-24',
                idnumber: 'MCTA001',
                startdate: 1706745600,
                viewurl: `https://moodle.ufabc.edu.br/course/${componentId}`,
              },
            ],
          },
        },
      ]);

    nock('https://moodle.ufabc.edu.br')
      .get('/user/index.php')
      .query(true)
      .reply(
        200,
        `<html><body><table class="generaltable"><tr><td><a href="https://moodle.ufabc.edu.br/user/view.php?id=1&course=${componentId}">Teacher Name</a></td></tr></table></body></html>`,
        { 'Content-Type': 'text/html' }
      );

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
