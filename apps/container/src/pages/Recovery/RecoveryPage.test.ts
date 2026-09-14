import { useRouter } from 'vue-router';

import { render, screen, userEvent } from '@/test-utils';

import { RecoveryPage } from '.';

vi.mock('vue-router', async () => ({
  useRouter: vi.fn(),
  createRouter: vi.fn(() => ({
    beforeEach: vi.fn(),
  })),
  createWebHistory: vi.fn(),
}));

describe('<RecoveryPage />', () => {
  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      go: vi.fn(),
      push: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
  });

  test('click go back button', async () => {
    const user = await userEvent.setup();
    render(RecoveryPage);

    await user.click(screen.getByRole('button', { name: /Anterior/i }));

    expect(useRouter().go).toHaveBeenCalledWith(-1);
  });
});
