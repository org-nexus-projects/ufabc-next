export type PlanTextBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] };

export type PlanTextSegment = { text: string; href?: string };

const BULLET_PATTERN = /^\s*[-*•]\s+(.*)$/u;
const NUMBERED_PATTERN = /^\s*\d+[.)]\s+(.*)$/u;
const HEADING_PATTERN = /^#{1,6}\s+(.*)$/u;
const TABLE_SEPARATOR_PATTERN =
  /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/u;
const LINK_PATTERN = /https?:\/\/[^\s<>]+/gu;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/u;

function splitTableRow(line: string) {
  let content = line.trim();
  if (content.startsWith('|')) {
    content = content.slice(1);
  }
  if (content.endsWith('|')) {
    content = content.slice(0, -1);
  }

  const cells = [];
  for (const cell of content.split('|')) {
    cells.push(cell.trim());
  }
  return cells;
}

function isTableStart(lines: string[], index: number) {
  const hasNextLine = index + 1 < lines.length;
  if (!hasNextLine || !lines[index].includes('|')) {
    return false;
  }
  return TABLE_SEPARATOR_PATTERN.test(lines[index + 1]);
}

export function parsePlanText(text: string) {
  const lines = text.split('\n');
  const blocks: PlanTextBlock[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph() {
    if (paragraphLines.length === 0) {
      return;
    }
    blocks.push({ text: paragraphLines.join('\n'), type: 'paragraph' });
    paragraphLines = [];
  }

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];

    if (line.trim() === '') {
      flushParagraph();
      index += 1;
      continue;
    }

    if (isTableStart(lines, index)) {
      flushParagraph();
      const header = splitTableRow(line);
      const rows = [];
      index += 2;
      while (index < lines.length && lines[index].includes('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ header, rows, type: 'table' });
      continue;
    }

    const headingMatch = HEADING_PATTERN.exec(line);
    if (headingMatch) {
      flushParagraph();
      blocks.push({ text: headingMatch[1], type: 'heading' });
      index += 1;
      continue;
    }

    const isBullet = BULLET_PATTERN.test(line);
    const isNumbered = NUMBERED_PATTERN.test(line);
    if (isBullet || isNumbered) {
      flushParagraph();
      const pattern = isNumbered ? NUMBERED_PATTERN : BULLET_PATTERN;
      const items = [];
      while (index < lines.length) {
        const itemMatch = pattern.exec(lines[index]);
        if (!itemMatch) {
          break;
        }
        items.push(itemMatch[1]);
        index += 1;
      }
      blocks.push({ items, ordered: isNumbered, type: 'list' });
      continue;
    }

    paragraphLines.push(line);
    index += 1;
  }

  flushParagraph();
  return blocks;
}

export function splitLinks(text: string) {
  const segments: PlanTextSegment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const start = match.index;
    const url = match[0].replace(TRAILING_PUNCTUATION, '');

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start) });
    }
    segments.push({ href: url, text: url });
    cursor = start + url.length;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }
  return segments;
}
