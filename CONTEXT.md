# UFABC Next context

UFABC Next é uma plataforma colaborativa para estudantes da UFABC. O portal web e a extensão oferecem avaliações, planejamento de matrícula, histórico e desempenho acadêmico, além de links para grupos de disciplinas.

## Vocabulário

Use os identificadores de código em crases como vocabulário técnico canônico. O texto em português pode explicá-los, mas não deve introduzir outro nome para a mesma entidade.

- **RA**: identificador acadêmico do estudante. É a chave que relaciona conta, dados acadêmicos, matrículas e histórico.
- **User**: conta do portal, com autenticação, confirmação e permissões. Uma conta pode estar ligada a um RA.
- **Student**: retrato dos dados acadêmicos de uma pessoa identificada por RA, incluindo cursos e período atual. Não use `User` e `Student` como sinônimos.
- **Subject**: disciplina canônica do catálogo, identificada por código(s) da UFABC e créditos.
- **Component**: oferta de um subject em um período: turma, turno, campus, vagas, docentes e horários. O código legado pode chamar essa oferta de `disciplina`; quando a distinção importar, prefira `component` para a oferta e `subject` para a disciplina canônica.
- **Enrollment**: vínculo de um Student com um Component em um período. Carrega o resultado acadêmico disponível, como conceito e créditos.
- **Teacher**: docente associado a um Component como teoria ou prática. Aliases ajudam a conciliar variações de nome.
- **Comment**: avaliação de um Teacher, vinculada a um Enrollment, Subject e ao papel de teoria ou prática.
- **Reaction**: manifestação de uma conta sobre um Comment: `like`, `recommendation` ou `star`.
- **History**: histórico acadêmico de um Student, com disciplinas cursadas e coeficientes por período.
- **Graduation**: conjunto de exigências de uma combinação de curso e grade. Seus subjects têm categorias como obrigatória, opção limitada e livre escolha.

## Tempo acadêmico

- **Quadrimestre (`quad`)**: um dos três períodos letivos do ano, numerados de 1 a 3.
- **Season**: identificador textual de período no formato `ano:quad`, como `2026:2`.

## Limites do produto

- Dados acadêmicos e de matrícula vêm de sistemas externos da UFABC e de suas integrações.
- Avaliações e reações são recursos colaborativos do Next; elas não são dados oficiais da universidade.
- Ao alterar comportamento de domínio, preserve as distinções deste vocabulário antes de escolher nomes de código, APIs, telas ou testes.
