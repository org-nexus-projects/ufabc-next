import { useRouter } from 'vue-router';

import { subjectSearch } from '@/mocks/reviews';
import { render, screen } from '@/test-utils';

import { ReviewsPage } from '.';

vi.mock('vue-router', () => ({
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  currentRoute: {
    value: {
      query: {},
    },
  },
  useRouter: vi.fn(),
}));

const replaceMock = vi.fn();

describe('<ReviewsPage />', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      createRouter: vi.fn(() => ({
        beforeEach: vi.fn(),
      })),
      currentRoute: {
        value: {
          query: {},
        },
      },
      useRouter: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  test('render reviews', async () => {
    render(ReviewsPage);

    expect(
      await screen.findByPlaceholderText(
        /Digite o nome do professor ou disciplina/iu
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Centralização da informação/iu)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Seus professores para avaliar/iu)
    ).toBeInTheDocument();
  });
  test('render subject search', async () => {
    vi.mocked(useRouter).mockReturnValue({
      createRouter: vi.fn(() => ({
        beforeEach: vi.fn(),
      })),
      currentRoute: {
        value: {
          query: {
            q: subjectSearch.data[0].name,
            subjectId: subjectSearch.data[0]._id,
          },
        },
      },
      replace: replaceMock,
      useRouter: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    render(ReviewsPage);
    expect(
      await screen.findByText(subjectSearch.data[0].name)
    ).toBeInTheDocument();
    expect(await screen.findByText(/Nome do Professor/iu)).toBeInTheDocument();
  });
});
