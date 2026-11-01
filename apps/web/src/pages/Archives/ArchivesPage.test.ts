import { http, HttpResponse } from 'msw';

import { archives } from '@/mocks/archives';
import { server } from '@/mocks/server';
import { render, screen, userEvent, waitFor } from '@/test-utils';
import { capitalizeName } from '@/utils/capitalizeName';

import { ArchivesPage } from '.';

const firstComponentName = capitalizeName(archives.data[0].component?.name);

describe('<ArchivesPage />', () => {
  test('lists archives and opens the first plan automatically', async () => {
    render(ArchivesPage);

    const matches = await screen.findAllByText(firstComponentName);
    expect(matches.length).toBeGreaterThan(0);
    expect(await screen.findByText('Apresentação da disciplina')).toBeInTheDocument();
    expect(screen.getByText('Ementa')).toBeInTheDocument();
    expect(screen.getByText('Sem disciplina vinculada')).toBeInTheDocument();
  });

  test('enables opening the file only for stored archives', async () => {
    render(ArchivesPage);
    await screen.findByText('Apresentação da disciplina');

    expect(
      screen.getByRole('button', { name: /Abrir arquivo/u })
    ).toBeEnabled();

    const unlinkedItem = screen
      .getByText('Sem disciplina vinculada')
      .closest('button');
    if (!unlinkedItem) {
      throw new Error('Unlinked archive item not found');
    }
    await userEvent.click(unlinkedItem);

    expect(
      await screen.findByText(/ainda não foi vinculado a uma disciplina/u)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Abrir arquivo/u })
    ).toBeDisabled();
  });

  test('marks the selected archive for assistive technology', async () => {
    render(ArchivesPage);
    await screen.findByText('Apresentação da disciplina');

    const items = screen.getAllByRole('button', { current: true });
    expect(items).toHaveLength(1);
  });

  test('searches archives by file name', async () => {
    const requestedTerms: string[] = [];
    server.use(
      http.get(
        `${import.meta.env.VITE_API_BASE_URL}/v2/archives`,
        ({ request }) => {
          requestedTerms.push(new URL(request.url).searchParams.get('q') ?? '');
          return HttpResponse.json(archives);
        }
      )
    );
    render(ArchivesPage);
    await screen.findByText('Apresentação da disciplina');

    await userEvent.type(
      screen.getByLabelText('Buscar pelo nome do arquivo'),
      'plano'
    );

    await waitFor(() => expect(requestedTerms).toContain('plano'));
  });
});
