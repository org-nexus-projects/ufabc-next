import { http,HttpResponse } from 'msw';
import { useRouter } from 'vue-router';

import { subjectSearch, teacherSearch } from '@/mocks/reviews';
import { server } from '@/mocks/server';
import { render, screen, userEvent } from '@/test-utils';

import { SearchBar } from '.';

vi.mock('vue-router', async () => ({
  useRouter: vi.fn(),
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  createWebHistory: vi.fn(),
}));

const replaceMock = vi.fn();

describe('<SearchBar />', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      go: vi.fn(),
      push: vi.fn(),
      replace: replaceMock,
      currentRoute: {
        value: {
          query: {},
        },
      },
    } as unknown as ReturnType<typeof useRouter>);
  });

  test('type must replace current route', async () => {
    render(SearchBar);
    await userEvent.type(
      await screen.findByPlaceholderText(
        /Digite o nome do professor ou disciplina/i,
      ),
      'teste',
    );
    expect(replaceMock).toHaveBeenCalledWith({
      name: 'reviews',
      query: { q: 'teste' },
    });
  });
  test('render SearchBar, type something, and click on teacher result', async () => {
    vi.mocked(useRouter).mockReturnValue({
      replace: replaceMock,
      currentRoute: {
        value: {
          name: 'reviews',
          query: { q: 'teste' },
        },
      },
    } as unknown as ReturnType<typeof useRouter>);
    render(SearchBar);

    await userEvent.click(
      await screen.findByPlaceholderText(
        /Digite o nome do professor ou disciplina/i,
      ),
    );
    expect(
      screen.getByRole('button', { name: subjectSearch.data[0].name }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: teacherSearch.data[0].name }),
    );
    expect(replaceMock).toHaveBeenCalledWith({
      name: 'reviews',
      query: { q: teacherSearch.data[0].name, teacherId: teacherSearch.data[0]._id },
    });
  });
  test('render SearchBar, type something, and click on subject result', async () => {
    vi.mocked(useRouter).mockReturnValue({
      replace: replaceMock,
      currentRoute: {
        value: {
          name: 'reviews',
          query: { q: 'teste' },
        },
      },
    } as unknown as ReturnType<typeof useRouter>);
    render(SearchBar);

    await userEvent.click(
      await screen.findByPlaceholderText(
        /Digite o nome do professor ou disciplina/i,
      ),
    );
    expect(
      screen.getByRole('button', { name: subjectSearch.data[0].name }),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: subjectSearch.data[0].name }),
    );
    expect(replaceMock).toHaveBeenCalledWith({
      name: 'reviews',
      query: { q: subjectSearch.data[0].name, subjectId: subjectSearch.data[0]._id },
    });
  });
  test('show Error Teachers and Error Subjects toasters', async () => {
    server.use(
      http.get(`*/teachers/search`, () => HttpResponse.json(null, { status: 500 })),
      http.get(`*/subjects/search`, () => HttpResponse.json(null, { status: 500 })),
    );
    vi.mocked(useRouter).mockReturnValue({
      replace: replaceMock,
      currentRoute: {
        value: {
          name: 'reviews',
          query: { q: 'teste' },
        },
      },
    } as unknown as ReturnType<typeof useRouter>);
    render(SearchBar);
    expect(
      await screen.findByText(/Erro ao buscar professores/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Erro ao buscar disciplinas/i),
    ).toBeInTheDocument();
  });
});
