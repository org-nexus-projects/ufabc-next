import { render, screen } from '@/test-utils';
import { TeacherReview } from '.';
import { useRouter } from 'vue-router';
import { teacherSearch } from '@/mocks/reviews';
import { HttpResponse, http } from 'msw';
import { server } from '@/mocks/server';

vi.mock('vue-router', async () => ({
  useRouter: vi.fn(),
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  createWebHistory: vi.fn(),
}));

const replaceMock = vi.fn();

describe('<TeacherReview />', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      go: vi.fn(),
      push: vi.fn(),
      replace: replaceMock,
      currentRoute: {
        value: {
          query: {
            q: 'test name',
            teacherId: 'test id',
          },
        },
      },
    } as unknown as ReturnType<typeof useRouter>);
  });
  test('fetching teacher error toaster', async () => {
    server.use(
      http.get(`*/reviews/teachers/*`, () =>
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
            q: teacherSearch.data[0].name,
            teacherId: teacherSearch.data[0]._id,
          },
        },
      },
    } as unknown as ReturnType<typeof useRouter>);

    render(TeacherReview, {
      props: {
        teacherId: teacherSearch.data[0]._id,
      },
    });
    expect(
      await screen.findByText('Erro ao carregar dados do(a) professor(a)'),
    );
  });
});
