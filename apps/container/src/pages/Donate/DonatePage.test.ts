import { render, screen, userEvent, waitFor } from '@/test-utils';

import { DonatePage } from '.';

describe('<DonatePage />', () => {
  test('render donate view', () => {
    render(DonatePage);
    expect(
      screen.getByRole('heading', { name: 'Ajude o UFABC Next' }),
    ).toBeInTheDocument();
  });
  test('open donate dialog', async () => {
    const user = userEvent.setup();

    render(DonatePage);

    await user.click(screen.getByRole('button', { name: 'Quero ajudar!' }));

    expect(await screen.findByAltText('PIX do UFABC Next')).toBeInTheDocument();
  });
  test('close donate dialog', async () => {
    const user = userEvent.setup();

    render(DonatePage);

    await user.click(screen.getByRole('button', { name: 'Quero ajudar!' }));

    expect(await screen.findByAltText('PIX do UFABC Next')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Fechar' }));

    await waitFor(() => {
      expect(screen.queryByAltText('PIX do UFABC Next')).not.toBeVisible();
    });
  });
});
