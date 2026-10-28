import type { ComponentArchive } from '@/models/ComponentArchive.js';
import type { LeanPopulatedArchive } from '@/repositories/component-archives-repository.js';

export type PresignedDownload = {
  expiresInSeconds: number;
  url: string;
};

export type ArchivePagination = {
  limit: number;
  page: number;
  total: number;
};

export class ComponentArchiveMapper {
  toResponse(archive: LeanPopulatedArchive) {
    let component = null;
    if (archive.component) {
      let shift: 'day' | 'night' = 'night';
      if (archive.component.turno === 'diurno') {
        shift = 'day';
      }

      component = {
        _id: archive.component._id.toString(),
        code: archive.component.codigo,
        group: archive.component.turma,
        name: archive.component.disciplina,
        season: archive.component.season,
        shift,
      };
    }

    return {
      _id: archive._id.toString(),
      component,
      fileName: archive.file_name ?? null,
      source: archive.source,
      status: archive.status,
    };
  }

  toPageResponse(
    archives: LeanPopulatedArchive[],
    pagination: ArchivePagination
  ) {
    const data = [];
    for (const archive of archives) {
      data.push(this.toResponse(archive));
    }

    return {
      data,
      limit: pagination.limit,
      page: pagination.page,
      total: pagination.total,
    };
  }

  toDownloadResponse(archive: ComponentArchive, presigned: PresignedDownload) {
    return {
      expiresInSeconds: presigned.expiresInSeconds,
      fileName: archive.file_name ?? null,
      url: presigned.url,
    };
  }
}
