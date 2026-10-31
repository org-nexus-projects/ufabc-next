import { describe, expect, it, vi } from 'vitest';

import { CmccConnector } from '../../src/connectors/cmcc.js';

const page = `
<table id="tabelaplanos20263"><tbody>
  <tr><td><a href="pdfs/20263_DA1MCTB019-17SA.pdf">plano</a></td></tr>
  <tr><td><a href="https://cds2.cmcc.ufabc.edu.br/planoensino/pdfs/20263_CCM00320263.pdf">plano</a></td></tr>
  <tr><td>sem link</td></tr>
  <tr><td><a href="notes.html">nota</a></td></tr>
</tbody></table>
<table id="tabelaplanos20262"><tbody><tr><td><a href="old.pdf">x</a></td></tr></tbody></table>`;

function buildConnector() {
  const connector = new CmccConnector('https://cds2.cmcc.ufabc.edu.br/planoensino/');
  vi.spyOn(connector as never, 'request').mockResolvedValue(page as never);
  return connector;
}

describe('CmccConnector.listPlans', () => {
  it('lists only pdf rows of the requested season', async () => {
    const plans = await buildConnector().listPlans('2026:3');

    expect(plans).toEqual([
      {
        classroomCode: 'DA1MCTB019-17SA',
        url: 'https://cds2.cmcc.ufabc.edu.br/planoensino/pdfs/20263_DA1MCTB019-17SA.pdf',
      },
      {
        classroomCode: 'CCM00320263',
        url: 'https://cds2.cmcc.ufabc.edu.br/planoensino/pdfs/20263_CCM00320263.pdf',
      },
    ]);
  });

  it('fails when the season table is missing', async () => {
    await expect(buildConnector().listPlans('2025:1')).rejects.toThrow(
      'table not found'
    );
  });
});
