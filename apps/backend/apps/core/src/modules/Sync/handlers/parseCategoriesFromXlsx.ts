import { Readable } from 'node:stream';
import fs from 'node:fs';
import { ofetch } from 'ofetch';
import { set_fs, stream, read as xlsxRead, utils as xlsxUtils } from 'xlsx';
import { logger } from '@next/common';

set_fs(fs);
stream.set_readable(Readable);


type RenameOptions = {
    from: 'Sigla' | 'TPEI' | 'Curso (categoria)';
    as: 'codigo' | 'credits' | 'curso';
  };
  


export type ParseXlSXBody = {
    link: string;
    rename: Array<RenameOptions>;
    season?: string;
  };

export async function categoriesHandler<TBody>(body: TBody) {


    const bodyDefaults = {
        link: '',
        rename: [
          { from: 'Sigla', as: 'codigo' },
          { from: 'TPEI', as: 'credits' },
          { from: 'Curso (categoria)', as: 'curso' },
        ],
      } satisfies ParseXlSXBody;

    const params = Object.assign(bodyDefaults, body);

 
    const file = await ofetch(params.link, {
        responseType: 'arrayBuffer',
      });
    
      const { SheetNames, Sheets } = xlsxRead(file);
      const [sheetNames] = SheetNames;

      logger.warn({SheetNames, Sheets});


      return null 
    
}
