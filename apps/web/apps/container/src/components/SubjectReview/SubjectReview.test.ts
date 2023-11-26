import { render, screen } from '@/test-utils';
import { SubjectReview } from '.';
import { useRouter } from 'vue-router';
import { subjectSearch } from '@/mocks/reviews';
import { server } from '@/mocks/server';
import { HttpResponse, http } from 'msw';

vi.mock('vue-router', async () => ({
  useRouter: vi.fn(),
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  createWebHistory: vi.fn(),
}));

const replaceMock = vi.fn();

describe('<SubjectReview />', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      go: vi.fn(),
      push: vi.fn(),
      replace: replaceMock,
      currentRoute: {
        value: {
          query: {
            q: 'test name',
            subjectId: 'test id',
          },
        },
      },
    } as unknown as ReturnType<typeof useRouter>);
  });

  test('render subject review', async () => {
    vi.mocked(useRouter).mockReturnValue({
      useRouter: vi.fn(),
      createRouter: vi.fn(() => ({
        beforeEach: vi.fn(),
      })),
      replace: replaceMock,
      currentRoute: {
        value: {
          query: {
            q: subjectSearch.data[0].name,
            subjectId: subjectSearch.data[0]._id,
          },
        },
      },
    } as unknown as ReturnType<typeof useRouter>);

    render(SubjectReview, {
      props: {
        subjectId: subjectSearch.data[0]._id,
      },
    });
    expect(
      await screen.findByText(subjectSearch.data[0].name),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Nome do Professor/i)).toBeInTheDocument();
  });
  test('render subject that demands review', async () => {
    vi.mocked(useRouter).mockReturnValue({
      useRouter: vi.fn(),
      createRouter: vi.fn(() => ({
        beforeEach: vi.fn(),
      })),
      replace: replaceMock,
      currentRoute: {
        value: {
          query: {
            q: subjectSearch.data[0].name,
            subjectId: subjectSearch.data[0]._id,
          },
        },
      },
    } as unknown as ReturnType<typeof useRouter>);

    render(SubjectReview, {
      props: {
        subjectId: subjectSearch.data[0]._id,
      },
    });
    expect(
      await screen.findByText(subjectSearch.data[0].name),
    ).toBeInTheDocument();
    expect(await screen.findByText(/Nome do Professor/i)).toBeInTheDocument();
  });
  test('fetching teacher error toaster', async () => {
    server.use(
      http.get(`*/reviews/subjects/*`, () =>
        HttpResponse.json(null, { status: 500 }),
      ),
    );

    vi.mocked(useRouter).mockReturnValue({
      useRouter: vi.fn(),
      createRouter: vi.fn(() => ({
        beforeEach: vi.fn(),
      })),
      replace: replaceMock,
      currentRoute: {
        value: {
          query: {
            q: subjectSearch.data[0].name,
            subjectId: subjectSearch.data[0]._id,
          },
        },
      },
    } as unknown as ReturnType<typeof useRouter>);

    render(SubjectReview, {
      props: {
        subjectId: subjectSearch.data[0]._id,
      },
    });
    expect(await screen.findByText('Erro ao carregar dados da disciplina'));
  });
});
