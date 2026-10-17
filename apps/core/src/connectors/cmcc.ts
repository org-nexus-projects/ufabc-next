import { load } from 'cheerio';

import { BaseRequester } from './base-requester.js';

export type CmccPlan = {
  classroomCode: string;
  url: string;
};

export class CmccConnector extends BaseRequester {
  constructor(baseUrl: string, globalTraceId?: string) {
    super(baseUrl, globalTraceId);
  }

  async listPlans(season: string) {
    const page = await this.request<string>('files', { responseType: 'text' });
    const html = load(page);

    const seasonDigits = season.replace(':', '');
    const tableId = `tabelaplanos${seasonDigits}`;
    const rows = html(`#${tableId} > tbody tr`);

    if (rows.length === 0) {
      throw new Error(`CMCC plans table not found for season ${season}`);
    }

    const plans: CmccPlan[] = [];
    for (const row of rows.toArray()) {
      const href = html(row).find('a[href]').first().attr('href');
      if (!href?.toLowerCase().endsWith('.pdf')) {
        continue;
      }

      const url = new URL(href, `${this.baseURL}`).href;
      const filename = decodeURIComponent(url.split('/').at(-1) ?? '');
      // files are named <seasonDigits>_<classroomCode>.pdf
      const stem = filename.slice(0, -'.pdf'.length);
      const classroomCode = stem.startsWith(`${seasonDigits}_`)
        ? stem.slice(seasonDigits.length + 1)
        : stem;
      plans.push({ classroomCode, url });
    }

    return plans;
  }

  async downloadPlan(url: string) {
    return await this.request<ArrayBuffer>(url, { responseType: 'arrayBuffer' });
  }
}
