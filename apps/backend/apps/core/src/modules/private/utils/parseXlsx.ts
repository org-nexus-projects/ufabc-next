import { Readable } from 'node:stream';
import fs from 'node:fs';
import { ofetch } from 'ofetch';
import { set_fs, stream, read as xlsxRead, utils as xlsxUtils } from 'xlsx';
import { logger } from '@next/common';
import type { Disciplina } from '@/models/index.js';

set_fs(fs);
stream.set_readable(Readable);

type RenameOptions = {
  from: 'RA' | 'TURMA' | 'DOCENTE TEORIA' | 'DOCENTE PRATICA' | 'TEORIA';
  as: 'ra' | 'nome' | 'teoria' | 'pratica' | 'horarios';
};

export type ParseXlSXBody = {
  link: string;
  rename: Array<RenameOptions>;
  season?: string;
};

type JSONFileData = {
  RA: number;
  CODIGO_DA_TURMA: string;
};

type XLSXOutput = Partial<Disciplina>;

export async function parseXlsx<TBody extends ParseXlSXBody>(
  body: TBody,
): Promise<XLSXOutput[]> {
  const bodyDefaults = {
    link: '',
    rename: [
      { from: 'TURMA', as: 'nome' },
      { from: 'DOCENTE TEORIA', as: 'teoria' },
      { from: 'DOCENTE PRATICA', as: 'pratica' },
    ],
  } satisfies ParseXlSXBody;
  const params = Object.assign(bodyDefaults, body);
  const file = await ofetch(params.link, {
    responseType: 'arrayBuffer',
  });

  const { SheetNames, Sheets } = xlsxRead(file);
  const fileData = xlsxUtils.sheet_to_json<JSONFileData>(Sheets[SheetNames[0]]);
  const columns = Object.keys(fileData[0]);
  logger.info({ msg: 'File Columns', columns });

  const parsedEnrollments = fileData.map((enrollment) => {
    const updatedEnrollment = {};
    params.rename.forEach((name) => {
      // @ts-expect-error WHY IS TS SO FUCKING DUMB
      updatedEnrollment[name.as] = enrollment[name.from];
    });

    return Object.fromEntries(
      Object.entries(updatedEnrollment).filter(([key]) =>
        params.rename.some(({ as }) => as === key),
      ),
    );
  });

  return parsedEnrollments as XLSXOutput[];
}
