import { useRouter } from 'vue-router';

import { subjectSearch } from '@/mocks/reviews';
import { render, screen } from '@/test-utils';

import { SubjectReview } from '.';

vi.mock('vue-router', () => ({
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  createWebHistory: vi.fn(),
  useRouter: vi.fn(),
}));

const replaceMock = vi.fn();

describe('<SubjectReview />', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      currentRoute: {
        value: {
          query: {
            q: 'test name',
            subjectId: 'test id',
          },
        },
      },
      go: vi.fn(),
      push: vi.fn(),
      replace: replaceMock,
    } as unknown as ReturnType<typeof useRouter>);
  });

  test('render subject review', async () => {
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

    render(SubjectReview, {
      props: {
        subjectId: subjectSearch.data[0]._id,
      },
    });
    expect(
      await screen.findByText(subjectSearch.data[0].name)
    ).toBeInTheDocument();
    expect(await screen.findByText(/Nome do Professor/iu)).toBeInTheDocument();
  });
  test('render subject that demands review', async () => {
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

    render(SubjectReview, {
      props: {
        subjectId: subjectSearch.data[0]._id,
      },
    });
    expect(
      await screen.findByText(subjectSearch.data[0].name)
    ).toBeInTheDocument();
    expect(await screen.findByText(/Nome do Professor/iu)).toBeInTheDocument();
  });
});
