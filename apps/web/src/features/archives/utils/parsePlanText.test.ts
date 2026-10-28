import { parsePlanText, splitLinks } from './parsePlanText';

describe('parsePlanText', () => {
  test('splits paragraphs on blank lines and keeps single line breaks', () => {
    expect(
      parsePlanText('Primeira linha\nSegunda linha\n\nOutro parágrafo')
    ).toEqual([
      { text: 'Primeira linha\nSegunda linha', type: 'paragraph' },
      { text: 'Outro parágrafo', type: 'paragraph' },
    ]);
  });

  test('reads bullet and numbered lists', () => {
    expect(parsePlanText('- Listas\n- Pilhas\n\n1. Prova\n2) Projeto')).toEqual(
      [
        { items: ['Listas', 'Pilhas'], ordered: false, type: 'list' },
        { items: ['Prova', 'Projeto'], ordered: true, type: 'list' },
      ]
    );
  });

  test('reads a pipe table with its header', () => {
    const text = [
      'Peso das avaliações',
      '',
      '| Avaliação | Composição | Peso |',
      '|-----------|------------|------|',
      '| Av1       | Provas     | 50%  |',
      '| Av2       | Projeto    | 50%  |',
    ].join('\n');

    expect(parsePlanText(text)).toEqual([
      { text: 'Peso das avaliações', type: 'paragraph' },
      {
        header: ['Avaliação', 'Composição', 'Peso'],
        rows: [
          ['Av1', 'Provas', '50%'],
          ['Av2', 'Projeto', '50%'],
        ],
        type: 'table',
      },
    ]);
  });

  test('keeps a pipe in plain text as a paragraph', () => {
    expect(parsePlanText('Prova | Projeto')).toEqual([
      { text: 'Prova | Projeto', type: 'paragraph' },
    ]);
  });

  test('never produces html, only text', () => {
    const blocks = parsePlanText('<script>alert(1)</script>');
    expect(blocks).toEqual([
      { text: '<script>alert(1)</script>', type: 'paragraph' },
    ]);
  });
});

describe('splitLinks', () => {
  test('turns urls into links without trailing punctuation', () => {
    expect(
      splitLinks('Veja https://moodle.ufabc.edu.br/curso, depois.')
    ).toEqual([
      { text: 'Veja ' },
      {
        href: 'https://moodle.ufabc.edu.br/curso',
        text: 'https://moodle.ufabc.edu.br/curso',
      },
      { text: ', depois.' },
    ]);
  });

  test('ignores text without links', () => {
    expect(splitLinks('Sem links')).toEqual([{ text: 'Sem links' }]);
  });
});
