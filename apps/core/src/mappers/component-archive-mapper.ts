import type { LeanComponentArchive } from '@/repositories/component-archives-repository.js';

export class ComponentArchiveMapper {
  toResponse(archive: LeanComponentArchive) {
    return {
      _id: archive._id.toString(),
      component: archive.component ?? null,
      createdAt: archive.createdAt?.toISOString() ?? '',
      file_name: archive.file_name ?? null,
      original_url: archive.original_url,
      s3_key: archive.s3_key ?? null,
      source: archive.source,
      status: archive.status,
      timeline: (archive.timeline ?? []).map((event) => ({
        metadata: event.metadata as unknown,
        status: event.status,
        timestamp: event.timestamp?.toISOString() ?? '',
      })),
    };
  }
}
