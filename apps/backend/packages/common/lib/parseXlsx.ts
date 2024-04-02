import { Readable } from 'node:stream';
import fs from 'node:fs';
import { ofetch } from 'ofetch';
import { set_fs, stream, read as xlsxRead, utils as xlsxUtils } from 'xlsx';
import { logger } from './logger';
import type { convertUfabcDisciplinas } from './convertUfabcDiscplinas';

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
  CURSO: string;
  'CÓDIGO DE TURMA': string;
  TURMA: string;
  TEORIA: string;
  PRÁTICA: string;
  CAMPUS: 'Santo André' | 'São Bernardo';
  TURNO: 'diurno' | 'noturno';
  'T-P-I': `${number}-${number}-${number}`;
  'VAGAS TOTAIS': number;
  'VAGAS INGRESSANTES': number;
  'VAGAS VETERANOS': number;
  'DOCENTE TEORIA': string;
  'DOCENTE TEORIA 2': string;
  'DOCENTE PRATICA': string;
  'DOCENTE PRATICA 2': string;
};

type Disciplina = ReturnType<typeof convertUfabcDisciplinas>;
export async function parseXlsx<TBody extends ParseXlSXBody>(body: TBody) {
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
  const [sheetNames] = SheetNames;

  if (!sheetNames) {
    logger.error(sheetNames, 'Could not sheet name');
    throw new Error('Could not process given file');
  }

  const sheetItems = Sheets[sheetNames];

  if (!sheetItems) {
    logger.warn(sheetItems, 'Items');
    throw new Error('Could not retreive data');
  }

  const [columns, ...fileData] =
    xlsxUtils.sheet_to_json<JSONFileData>(sheetItems);

  if (!columns) {
    throw new Error('Could not get sheet data');
  }

  const sheetColumns = Object.keys(columns);
  logger.info({
    msg: 'File Columns',
    sheetColumns,
  });

  const parsedEnrollments = fileData.map((enrollment) => {
    const updatedEnrollment: Partial<
      Record<RenameOptions['as'] | RenameOptions['from'], string>
    > = {};
    params.rename.forEach((name) => {
      updatedEnrollment[name.as] = enrollment[name.from];
    });

    return Object.fromEntries(
      Object.entries(updatedEnrollment).filter(([key]) =>
        params.rename.some(({ as }) => as === key),
      ),
    );
  });

  return parsedEnrollments as unknown as Disciplina[];
}
