import { useRouter } from 'vue-router';

import { render, screen, userEvent } from '@/test-utils';

import { RecoveryPage } from '.';

vi.mock('vue-router', () => ({
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  createWebHistory: vi.fn(),
  useRouter: vi.fn(),
}));

const goMock = vi.fn();

describe('<RecoveryPage />', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      go: goMock,
      push: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  test('click go back button', async () => {
    const user = userEvent.setup();
    render(RecoveryPage);

    await user.click(screen.getByRole('button', { name: /Anterior/iu }));

    expect(goMock).toHaveBeenCalledWith(-1);
  });
});
