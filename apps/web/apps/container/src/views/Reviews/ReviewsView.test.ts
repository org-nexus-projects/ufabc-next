import { render, screen } from '@/test-utils';
import { ReviewsView } from '.';
import { useRouter } from 'vue-router';
import { subjectSearch, teacherSearch } from '@/mocks/reviews';

vi.mock('vue-router', async () => ({
  useRouter: vi.fn(),
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  currentRoute: {
    value: {
      query: {},
    },
  },
}));

const replaceMock = vi.fn();

describe('<ReviewsView />', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      useRouter: vi.fn(),
      createRouter: vi.fn(() => ({
        beforeEach: vi.fn(),
      })),
      currentRoute: {
        value: {
          query: {},
        },
      },
    } as unknown as ReturnType<typeof useRouter>);
  });

  test('render reviews', async () => {
    render(ReviewsView);

    expect(
      await screen.findByPlaceholderText(
        /Digite o nome do professor ou disciplina/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Centralização da informação/i),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Seus professores para avaliar/i),
    ).toBeInTheDocument();
  });
  test.skip('render teacher search', async () => {
    vi.mocked(useRouter).mockReturnValue({
      useRouter: vi.fn(),
      createRouter: vi.fn(() => ({
        beforeEach: vi.fn(),
      })),
      replace: replaceMock,
      currentRoute: {
        value: {
          query: {
            q: teacherSearch.data[0].name,
            teacherId: teacherSearch.data[0]._id,
          },
        },
      },
    } as unknown as ReturnType<typeof useRouter>);
    render(ReviewsView);
    expect(
      await screen.findByText(/Provavelmente esse professor cobra presença/i),
    ).toBeInTheDocument();
  });
  test('render subject search', async () => {
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
    render(ReviewsView);
    expect(
      await screen.findByText(subjectSearch.data[0].name),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Nome do Professor/i),
    ).toBeInTheDocument();
  });
});
